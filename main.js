const { Plugin, Notice, TFile, FileSystemAdapter, PluginSettingTab, Setting, FuzzySuggestModal } = require("obsidian");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];

const DEFAULT_SETTINGS = {
  webhookUrl: ""
};

// --- Send image to Discord webhook ---
async function sendToWebhook(webhookUrl, imagePath) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(imagePath);
    const imageName = path.basename(imagePath, path.extname(imagePath));
    const fileBuffer = fs.readFileSync(imagePath);

    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);

    const formParts = [];

    // content part (image name without extension)
    formParts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="content"\r\n\r\n` +
      `${imageName}\r\n`
    );

    // file part
    formParts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );

    const header = Buffer.from(formParts.join(""));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length
      }
    };

    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Discord responded with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// --- Send text to Discord webhook ---
async function sendTextToWebhook(webhookUrl, text) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify({ content: text }));
    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": body.length
      }
    };

    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Discord responded with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// --- Image Suggester ---
class ImageSuggester extends FuzzySuggestModal {
  constructor(app, images, onChoose) {
    super(app);
    this.images = images;
    this.onChoose = onChoose;
    this.setPlaceholder("Choose an image...");
  }
  getItems() { return this.images; }
  getItemText(item) { return item.path; }
  onChooseItem(item) { this.onChoose(item.path); }
}

// --- Settings Tab ---
class SendToDiscordSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Send Image to Discord" });

    new Setting(containerEl)
      .setName("Webhook URL")
      .setDesc("The Discord webhook URL to send images and text to")
      .addText((text) =>
        text
          .setPlaceholder("https://discord.com/api/webhooks/...")
          .setValue(this.plugin.settings.webhookUrl)
          .onChange(async (value) => {
            this.plugin.settings.webhookUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}

// --- Main plugin ---
module.exports = class SendToDiscordPlugin extends Plugin {

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SendToDiscordSettingTab(this.app, this));

    // File explorer context menu
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(this.app.vault.adapter instanceof FileSystemAdapter)) return;
        if (!(file instanceof TFile)) return;

        const ext = path.extname(file.path).toLowerCase();
        if (!IMAGE_EXTS.includes(ext)) return;

        menu.addItem((item) => {
          item
            .setTitle("Send to Discord")
            .setIcon("send")
            .onClick(() => this.sendFile(file.path));
        });
      })
    );

    // Editor context menu
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const selection = editor.getSelection();
        if (!selection) return;

        menu.addItem((item) => {
          item
            .setTitle("Send to Discord")
            .setIcon("send")
            .onClick(() => this.sendText(selection));
        });
      })
    );

    // Command palette
    this.addCommand({
      id: "send-image-to-discord",
      name: "Choose and send image to Discord",
      callback: () => this.openSuggester()
    });

    console.log("Send to Discord loaded.");
  }

  async onunload() {
    console.log("Send to Discord unloaded.");
  }

  async sendFile(relativePath) {
    if (!this.settings.webhookUrl) {
      new Notice("❌ Please configure the Webhook URL in the plugin settings!");
      return;
    }

    const vaultPath = this.app.vault.adapter.basePath;
    const imagePath = path.join(vaultPath, relativePath);

    try {
      new Notice("⏳ Sending...");
      await sendToWebhook(this.settings.webhookUrl, imagePath);
      new Notice("✅ Sent: " + path.basename(relativePath, path.extname(relativePath)));
    } catch (err) {
      new Notice("❌ Error: " + err.message);
    }
  }

  async sendText(text) {
    if (!this.settings.webhookUrl) {
      new Notice("❌ Please configure the Webhook URL in the plugin settings!");
      return;
    }

    try {
      new Notice("⏳ Sending...");
      await sendTextToWebhook(this.settings.webhookUrl, text);
      new Notice("✅ Text sent to Discord!");
    } catch (err) {
      new Notice("❌ Error: " + err.message);
    }
  }

  async openSuggester() {
    if (!this.settings.webhookUrl) {
      new Notice("❌ Please configure the Webhook URL in the plugin settings!");
      return;
    }

    const images = this.app.vault.getFiles().filter(file =>
      IMAGE_EXTS.includes(path.extname(file.path).toLowerCase())
    );

    if (images.length === 0) {
      new Notice("❌ No images found in the vault!");
      return;
    }

    new ImageSuggester(this.app, images, (relativePath) => {
      this.sendFile(relativePath);
    }).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};