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
    pkg upgrade && pkg install nodejs git -y && git clone https://github.com/pedrodenovo/family-life-plus-client && cd family-life-plus-client && npm install && cd ..
    ```
3.  To start the client in the future, just open Termux and run:
    ```bash
    cd family-life-plus-client || node index.js
    ```

## How to Use
1.  Install the client by following the instructions for [PC](https://www.google.com/search?q=%23windows) or [Android/Termux](https://www.google.com/search?q=%23android).
2.  Start the client on your device.
      * On **Windows**, run the `start.bat` file.
      * On **Termux**, type and run `cd family-life-plus-client || node index.js`.
3.  Choose a user option. Use the arrow keys and press Enter, or type the number of the option:
      * **Free / Patreon:**
        1.  A link will appear. Open it in your browser.
        2.  Go through the link shortener or log in with Patreon.
        3.  When a green success message appears, you can continue to step 4.
      * **Custom Key:**
        1.  Enter your Gemini API key from [aistudio.google.com](https://aistudio.google.com/) and press Enter.
        2.  Continue to step 4.
4.  Open Minecraft and enter your world (with cheats and the Family Life+ addon enabled).
5.  Type the following command in the chat:
    ```
    /connect localhost:3000
    ```
6.  That's it\! Enjoy the addon.

> **Important:** Only the **world's host** needs to have the client installed and run the `/connect` command. Other players don't need to do anything.
