# Obsidian: Send to Discord

An Obsidian plugin that lets you send images and text to a Discord channel via webhook, directly from your vault.

## Features

- 📤 **Send images** to Discord via right-click on any image in the file explorer
- 🔍 **Choose and send** any image from the vault via command palette
- ✏️ **Send selected text** to Discord via right-click in the editor
- ⚙️ **Simple settings** — just paste your webhook URL and you're ready to go

## Installation

Since this plugin is not yet available in the Obsidian community plugins list, you need to install it manually.

1. Download `main.js` and `manifest.json` from the [latest release](../../releases/latest)
2. Create a folder called `send-to-discord` inside your vault's plugins folder:YourVault/.obsidian/plugins/send-to-discord/
3. Copy `main.js` and `manifest.json` into that folder
4. Open Obsidian and go to `Settings → Community plugins`
5. Disable **Safe mode** if not already done
6. Enable **Send to Discord**

## Configuration

1. Go to `Settings → Send to Discord`
2. Paste your Discord webhook URL in the **Webhook URL** field

### How to get a Discord webhook URL

1. Open Discord and go to the channel you want to send to
2. Click the ⚙️ icon next to the channel name → **Edit Channel**
3. Go to **Integrations → Webhooks**
4. Click **New Webhook**, give it a name, and click **Copy Webhook URL**
5. Paste the URL in the plugin settings

## Usage

### Send an image via right-click

Right-click on any image file in the Obsidian file explorer and select **📤 Send to Discord**.

### Send an image via command palette

1. Open the command palette (`Ctrl+P`)
2. Search for **Choose and send image to Discord**
3. A fuzzy search modal will open with all images in your vault
4. Select the image you want to send

### Send selected text

1. Select any text in a note
2. Right-click and select **Send to Discord**

## Requirements

- Obsidian desktop app (mobile not supported)
- A Discord server where you have permission to create webhooks

## License

MIT
