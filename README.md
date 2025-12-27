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

1.  Download and install **[Termux](https://f-droid.org/repo/com.termux_1022.apk)** (use this official link from F-Droid).
2.  Open Termux and run the following command:
    ```bash
    pkg update -y && pkg upgrade -y && pkg install nodejs git -y && rm -rf family-life-plus-client && git clone https://github.com/pedrodenovo/family-life-plus-client && cd family-life-plus-client && npm install && cd ..
    ```
3.  To start the client in the future, just open Termux and run:
    ```bash
    cd family-life-plus-client && node app.js
    ```

## How to Use
1.  Install the client by following the instructions for [PC](https://www.google.com/search?q=%23windows) or [Android/Termux](https://www.google.com/search?q=%23android).
2.  Start the client on your device.
      * On **Windows**, run the `start.bat` file.
      * On **Termux**, type and run `cd family-life-plus-client && node app.js`.
3.  Login & Authentication: 
    * When you start the client for the first time, a verification link will appear in your console.
    * **Copy and open the link** in your browser.
    * **Log in** with your Patreon account.
    * Wait for the **green success message** in your browser before returning to the console.
       
    > ⚠️ **Requirement:** To use the system for free, **following our Patreon page is mandatory**.

    > 💎 **Why become a Patron?**
    > While the free version works great, our Patrons unlock premium AI models that are **at least 5x smarter**. They offer deeper reasoning, better memory retention, and more complex interactions compared to the free model.
5.  Open Minecraft and enter your world (with cheats and the Family Life+ addon enabled).
6.  Type the following command in the chat:
    ```
    /connect localhost:3000
    ```
7.  That's it\! Enjoy the addon.

> **Important:** Only the **world's host** needs to have the client installed and run the `/connect` command. Other players don't need to do anything.
