# Family Life+ Client

[![](https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3/assets/cozy/social/discord-plural_vector.svg)](https://discord.com/invite/HAS99pEwJ4) [![](https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3.2.0/assets/cozy/social/youtube-singular_vector.svg)](https://m.youtube.com/channel/UCrq1E1rJEaYDXeU1qXk9OaQ) [![](https://cdn.jsdelivr.net/npm/@intergrav/devins-badges@3.2.0/assets/cozy/social/twitter-singular_vector.svg)](https://x.com/sunrise_studioo)

## About The Project

This is a WebSocket client for the **Family Life+** addon for Minecraft Bedrock. It connects your Minecraft world to an AI, enabling dynamic dialogue generation and other features for the addon's NPCs.

## Prerequisites

For the client to work, you **must** have the latest version of the **Family Life+** addon installed.

- **[Download the Family Life+ Addon here](https://www.curseforge.com/minecraft-bedrock/addons/family-life-plus)**

## Installation

Follow the guide for your operating system.

### Windows

1.  Download and extract the project file: **[main.zip](https://github.com/pedrodenovo/family-life-plus-client/archive/refs/heads/main.zip)**
2.  Open the extracted folder in your file explorer.
3.  Run the `start.bat` file.

### Android

1.  Download and install **[Termux](https://f-droid.org/en/packages/com.termux/)** (use this official link from F-Droid).
2.  Open Termux and run the following commands one by one:
    ```bash
    pkg upgrade
    pkg install nodejs git -y
    git clone https://github.com/pedrodenovo/family-life-plus-client
    cd family-life-plus-client
    npm install
    ```
3.  To start the client in the future, just open Termux and run:
    ```bash
    cd family-life-plus-client || node index.js
    ```

## How to Use

1.  Start the client on your PC or Termux.
2.  Open Minecraft and enter your world (with cheats enabled).
3.  Type the following command in the chat:
    ```
    /connect localhost:3000
    ```

> **Important:** Only the **world's host** needs to have the client installed and run the `/connect` command. Other players don't need to do anything.
