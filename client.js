// client.js
const WebSocket = require('ws');
const uuid = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const http = require('http');

// --- GENERAL SETTINGS ---
const USE_REMOTE_SERVER = true;
const API_URL_VERSION = "V0.1";
const DIALOG_REMOTE_API_URL = USE_REMOTE_SERVER ? `https://api.pedro-denovo.site/family-life/NPCDialogResponse/${API_URL_VERSION}` : `http://localhost:8080/family-life/NPCDialogResponse/${API_URL_VERSION}`;
const INTERACAT_REMOTE_API_URL = USE_REMOTE_SERVER ? `https://api.pedro-denovo.site/family-life/NPCInteractResponse/${API_URL_VERSION}` : `http://localhost:8080/family-life/NPCInteractResponse/${API_URL_VERSION}`;
const VALIDATE_KEY_API_URL = USE_REMOTE_SERVER ? `https://api.pedro-denovo.site/family-life/validate-key` : `http://localhost:8080/family-life/validate-key`;

const HTTP_PORT = 3001; // Port for the local HTTP server to receive the key

// Your server's URLs that will start the auth process
const PATREON_AUTH_URL = "http://api.pedro-denovo.site/callback-patreon"; // Example, use your real server URL
const FREE_TICKET_URL = "https://link-center.net/180977/cwjKO8tsZAxw"; // Example

const HISTORY_FILE_PATH = path.join(__dirname, 'dialogue_history.json');
const CONFIG_FILE_PATH = path.join(__dirname, 'config.json');

// --- APPLICATION STATE ---
let userConfig = {};
const pendingRequests = {};
let wsServer;
let httpServer;

// --- CONFIG & UI FUNCTIONS ---

async function loadConfig() {
    try {
        await fs.access(CONFIG_FILE_PATH);
        const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveConfig(config) {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function clearConsole() {
    process.stdout.write('\x1B[2J\x1B[0;0H');
}

function displayHeader() {
    console.log(`
┌──────────────────────────────────┐
│                                  │
│       FAMILY LIFE+ CLIENT        │
│                                  │
└──────────────────────────────────┘

  ► Connect: In Minecraft chat, type

    /connect localhost:3000

    
  ► Support the project!
    Patreon:    https://patreon.com/Sunrise483
    Discord:    https://discord.gg/HAS99pEwJ4
    Github:     https://github.com/pedrodenovo/family-life-plus-client
    Curseforge: https://www.curseforge.com/members/pedro_dnovo/projects
`);
}

function promptUserType() {
    return new Promise(resolve => {
        let selectedOption = 0;
        const options = [
            "Free User: Renew a ticket every 30 minutes.",
            "Patreon Subscriber: Log in for unlimited access.",
            "Custom Key: Use your own Gemini API key."
        ];

        const drawMenu = () => {
            clearConsole();
            displayHeader();
            console.log("  ► Choose your account type (use arrow keys or numbers 1-3, then press Enter):\n");
            options.forEach((option, index) => {
                if (index === selectedOption) {
                    console.log(`    > ${index + 1} - ${option}`);
                } else {
                    console.log(`      ${index + 1} - ${option}`);
                }
            });
        };

        drawMenu();

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);

        const onKeyPress = (str, key) => {
            if (key.name === 'up') {
                selectedOption = (selectedOption - 1 + options.length) % options.length;
            } else if (key.name === 'down') {
                selectedOption = (selectedOption + 1) % options.length;
            } else if (key.name >= '1' && key.name <= '3') {
                selectedOption = parseInt(key.name, 10) - 1;
            } else if (key.name === 'return') {
                process.stdin.setRawMode(false);
                process.stdin.removeListener('keypress', onKeyPress);
                const userTypes = ['free', 'patreon', 'custom'];
                resolve(userTypes[selectedOption]);
                return;
            } else if (key.ctrl && key.name === 'c') {
                process.exit();
            }
            drawMenu();
        };

        process.stdin.on('keypress', onKeyPress);
    });
}

// --- AUTHENTICATION LOGIC FUNCTIONS ---

const generateHtmlResponse = (title, message, isSuccess = false) => {
    const color = isSuccess ? '#28a745' : '#dc3545';
    return `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:sans-serif;background:#f4f4f9;display:flex;justify-content:center;align-items:center;height:100vh;}.container{background:white;padding:40px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.1);text-align:center;border-top:5px solid ${color};}h1{color:${color};}</style></head>
        <body><div class="container"><h1>${title}</h1><p>${message}</p></div></body></html>
    `;
};


function startHttpServerForAuth(onCodeReceived) {
    if (httpServer) httpServer.close();
    
    httpServer = http.createServer((req, res) => {
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);
        
        if (requestUrl.pathname === '/set-key') {
            const code = requestUrl.searchParams.get('code');
            if (code) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(generateHtmlResponse('Success!', 'Authentication successful. You can now close this page and return to the client console.', true));
                httpServer.close();
                httpServer = null;
                onCodeReceived(code);
            } else {
                res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(generateHtmlResponse('Error', 'No code was provided in the request.'));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(generateHtmlResponse('Not Found', 'This page does not exist.'));
        }
    }).listen(HTTP_PORT);

    console.log(`\n  ► Waiting for authentication... Client is listening on http://localhost:${HTTP_PORT}`);
}

async function validateGeminiKey(key) {
    console.log("  ► Validating API key. Please wait...");
    try {
        const response = await fetch(VALIDATE_KEY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key })
        });
        return response.ok;
    } catch (error) {
        console.error("  ► Error connecting to the validation server:", error.message);
        return false;
    }
}

async function handleFreeUser() {
    console.log(`\n  ► To generate your free ticket, open the link below in your browser:`);
    console.log(`  ► ${FREE_TICKET_URL}`);

    const ticket = await new Promise(resolve => startHttpServerForAuth(resolve));

    console.log("  ► Ticket received successfully!");
    
    userConfig.userType = 'free';
    userConfig.ticket = ticket;
    userConfig.ticketExpiresAt = Date.now() + 30 * 60 * 1000;
    await saveConfig(userConfig);
    
    console.log(`  ► Ticket generated! Valid for 30 minutes. Enjoy!`);
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function handlePatreonUser() {
    userConfig.userType = 'patreon';
    
    if (userConfig.patreonCode) {
        console.log("\n  ► Patreon code found. Verifying validity...");
        const isCodeValid = true; // Placeholder. Real validation is on the server.
        if (!isCodeValid) {
            console.log("  ► Your code has expired or is invalid. Please authenticate again.");
            delete userConfig.patreonCode;
        } else {
            console.log("  ► Code is valid! Welcome back!");
            await new Promise(resolve => setTimeout(resolve, 2000));
            return;
        }
    }

    console.log(`\n  ► To log in with your Patreon account, open the link below in your browser:`);
    console.log(`  ► ${PATREON_AUTH_URL}`);
    
    const code = await new Promise(resolve => startHttpServerForAuth(resolve));

    console.log("  ► Patreon authentication code received successfully!");
    userConfig.patreonCode = code.trim();
    await saveConfig(userConfig);
    console.log("  ► Code saved! Connecting...");
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function handleCustomKeyUser() {
    userConfig.userType = 'custom';
    while (true) {
        if (!userConfig.customGeminiKey) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const key = await new Promise(resolve => rl.question("\n  ► Please enter your Gemini API key and press Enter: ", resolve));
            rl.close();
            userConfig.customGeminiKey = key.trim();
        }

        const isValid = await validateGeminiKey(userConfig.customGeminiKey);

        if (isValid) {
            console.log("  ► API key successfully validated!");
            await saveConfig(userConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
        } else {
            console.log("\n  ❌ The provided API key is invalid or a verification error occurred.");
            delete userConfig.customGeminiKey;
            await saveConfig(userConfig);
            console.log("  ► You will be returned to the account selection screen in 3 seconds...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            await main(); 
            return;
        }
    }
}

// --- CORE WEBSOCKET LOGIC ---

async function loadHistory() {
    try {
        await fs.access(HISTORY_FILE_PATH);
        const data = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) { return {}; }
}

async function saveHistory(data) {
    for (const dat in data) {
        if (data[dat].length > 32) data[dat].splice(0, data[dat].length - 32);
    }
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

async function processCompleteRequest(requestData, sendFunction) {
    if (userConfig.userType === 'free') {
        if (!userConfig.ticket || Date.now() > userConfig.ticketExpiresAt) {
            console.log("Free ticket expired. Blocking request.");
            sendFunction(`tellraw @a {"rawtext":[{"text":"§c[FAMILY LIFE+] warn.ticketLimitTime"}]}`);
            console.log("\nWARNING: The free ticket has expired. New requests are blocked. Please restart the client to get a new ticket.");
            return;
        }
    }
    
    try {
        const { meta } = requestData;
        const conversationId = `${meta.NPCID}_${meta.PNAME}`;
        const history = await loadHistory();
        const previousMessages = history[conversationId] || [];

        let authData = { type: userConfig.userType };
        if (userConfig.userType === 'free') authData.ticket = userConfig.ticket;
        if (userConfig.userType === 'patreon') authData.code = userConfig.patreonCode;
        if (userConfig.userType === 'custom') authData.key = userConfig.customGeminiKey;

        const fullRequestBody = { ...meta, previousMessages, auth: authData };
        const { NPCN, PNAME, RT, PLT, CUM: _playerMessage } = fullRequestBody;
        
        console.log(`Complete data received for ${PNAME}. Sending to remote API...`);

        const targetUrl = (RT === "D") ? DIALOG_REMOTE_API_URL : INTERACAT_REMOTE_API_URL;
        
        const apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullRequestBody)
        });
        
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            if (apiResponse.status === 401 || apiResponse.status === 403) {
                console.error(`Authentication Error: ${errorBody}`);
                sendFunction(`tellraw @a {"rawtext":[{"text":"§c[FAMILY LIFE+] Authentication failed. Please check your code/key and restart the client."}]}`);
                if(userConfig.userType === 'patreon') delete userConfig.patreonCode;
                await saveConfig(userConfig);
            } else {
                 throw new Error(`Remote API Error: ${apiResponse.statusText} - ${errorBody}`);
            }
            return;
        }

        const remoteApiResult = await apiResponse.json();

        if (remoteApiResult && remoteApiResult.NPCGenResponse) {
            const npcResponseText = remoteApiResult.NPCGenResponse;
            const escapedNpcResponseText = npcResponseText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            
            sendFunction(`tellraw @p[name="${PNAME}",${PLT}] {"rawtext":[{"text":"<${NPCN}> ${escapedNpcResponseText}"}]}`);

            if (!history[conversationId]) history[conversationId] = [];
            
            if(RT === "D") {
                history[conversationId].push(`<${PNAME}> ${_playerMessage}`);
                history[conversationId].push(`<${NPCN}> ${escapedNpcResponseText}`);
            } else {
                history[conversationId].push(`<${_playerMessage}>`);
                history[conversationId].push(`<${NPCN}> ${escapedNpcResponseText}`);
            }
            await saveHistory(history);

            let tag = `NPCIChange.${remoteApiResult.NPCIChange}.${PNAME}`;
            sendFunction(`tag @e[type=minecraft:villager,c=1,name="${NPCN}",${PLT}] add ${tag}`);
            sendFunction(`event entity @e[type=minecraft:villager,c=1,name="${NPCN}",${PLT}] sunrise:talk_to_player`);
        } else {
            console.log("The remote server's response was invalid.");
            sendFunction(`say Hmm, something strange happened to my thoughts.`);
        }

    } catch (error) {
        if (error.name !== 'AbortError' && !(error instanceof TypeError && error.message.includes('undici'))) {
             console.error("Failed to communicate with remote server:", error);
             sendFunction(`say I couldn't connect to my thoughts... Try again later.`);
        }
    }
}

function startWebSocketServer() {
    clearConsole();
    displayHeader();
    console.log(`  ► LOGS (Mode: ${userConfig.userType})`);

    wsServer = new WebSocket.Server({ port: 3000 });

    wsServer.on('connection', socket => {
        console.log('Connected to Minecraft.');
        const sendQueue = [];
        const awaitedQueue = {};

        function send(cmd) {
            const msg = {
                "header": { "version": 1, "requestId": uuid.v4(), "messagePurpose": "commandRequest", "messageType": "commandRequest" },
                "body": { "version": 1, "commandLine": cmd, "origin": { "type": "player" } }
            };
            sendQueue.push(msg);
        }

        socket.send(JSON.stringify({
            "header": { "version": 1, "requestId": uuid.v4(), "messageType": "commandRequest", "messagePurpose": "subscribe" },
            "body": { "eventName": "PlayerMessage" },
        }));

        socket.on('message', async (packet) => {
            const msg = JSON.parse(packet);

            if (msg.header.eventName === 'PlayerMessage' && msg.body.message.startsWith('{"FLRV":"2.0.0"')) {
                try {
                    const dataPart = JSON.parse(msg.body.message);
                    const { requestId, type, requestBody } = dataPart;
                    if (!requestId || !type || !requestBody) return;

                    if (!pendingRequests[requestId]) {
                        pendingRequests[requestId] = {};
                        setTimeout(() => {
                            if (pendingRequests[requestId]) {
                                console.log(`Request ${requestId} timed out and was removed.`);
                                delete pendingRequests[requestId];
                            }
                        }, 10000);
                    }
                    if (type === "meta") pendingRequests[requestId].meta = requestBody;
                    if (pendingRequests[requestId].meta) {
                        await processCompleteRequest(pendingRequests[requestId], send);
                        delete pendingRequests[requestId];
                    }
                } catch (error) { /* Ignore JSON parse errors */ }
            }

            if (msg.header.messagePurpose == 'commandResponse') {
                if (msg.header.requestId in awaitedQueue) {
                    if (msg.body.statusCode < 0) console.log('Error:', awaitedQueue[msg.header.requestId].body.commandLine, msg.body.statusMessage);
                    delete awaitedQueue[msg.header.requestId];
                }
            }

            let count = Math.min(100 - Object.keys(awaitedQueue).length, sendQueue.length);
            for (let i = 0; i < count; i++) {
                let command = sendQueue.shift();
                socket.send(JSON.stringify(command));
                awaitedQueue[command.header.requestId] = command;
            }
        });
    });
}

// --- APPLICATION ENTRY POINT ---

async function main() {
    clearConsole();
    displayHeader();

    userConfig = await loadConfig();
    let chosenType = userConfig.userType;

    if (!chosenType) {
        chosenType = await promptUserType();
    }
    
    switch (chosenType) {
        case 'free':
            await handleFreeUser();
            break;
        case 'patreon':
            await handlePatreonUser();
            break;
        case 'custom':
            await handleCustomKeyUser();
            break;
    }

    if (!wsServer || !wsServer.clients) {
         startWebSocketServer();
    }
}

main().catch(console.error);