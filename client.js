const WebSocket = require('ws');
const uuid = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const USE_REMOTE_SERVER = true;

// Endereço da sua API remota que irá processar a chamada para o Gemini
const API_URL_VERSION = "V0.1";
const DIALOG_REMOTE_API_URL = USE_REMOTE_SERVER? `https://api.pedro-denovo.site//family-life/NPCDialogResponse/${API_URL_VERSION}` : `http://localhost:8080/family-life/NPCDialogResponse/${API_URL_VERSION}`;
const INTERACAT_REMOTE_API_URL =  USE_REMOTE_SERVER? `https://api.pedro-denovo.site//family-life/NPCInteractResponse/${API_URL_VERSION}` : `http://localhost:8080/family-life/NPCInteractResponse/${API_URL_VERSION}`;
const HISTORY_FILE_PATH = path.join(__dirname, 'dialogue_history.json');

// Objeto para armazenar partes de requisições que ainda não foram completadas
const pendingRequests = {};

// Cria um novo servidor websocket na porta 3000
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
    Gitub:      https://github.com/pedrodenovo/family-life-plus-client
    Curseforge: https://www.curseforge.com/members/pedro_dnovo/projects



  ► LOGS
`);
const wss = new WebSocket.Server({ port: 3000 });

async function loadHistory() {
    try {
        await fs.access(HISTORY_FILE_PATH);
        const data = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir ou estiver vazio/corrompido, retorna um objeto vazio.
        return {};
    }
}

// Função para salvar o histórico no arquivo JSON
async function saveHistory(data) {
    for (const dat in data) {
        if (data[dat].length > 32) {
            data[dat].splice(0, data[dat].length - 32)
        }
    }
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Função assíncrona para processar a requisição completa
async function processCompleteRequest(requestData, sendFunction) {
    try {
        const { meta } = requestData;

        // CORRIGIDO: O conversationId deve ser criado a partir de 'meta', que já temos.
        const conversationId = `${meta.NPCID}_${meta.PNAME}`;
        const history = await loadHistory();
        const previousMessages = history[conversationId] || [];

        // Combina as duas partes em um único corpo de requisição
        const fullRequestBody = {
            ...meta,
            previousMessages: previousMessages
        };

        const NPCN = fullRequestBody.NPCN;
        const PNAME = fullRequestBody.PNAME;
        const RequestType = fullRequestBody.RT;
        const PLT = fullRequestBody.PLT;
        const _playerMessage = fullRequestBody.CUM;

        console.log(`Dados completos recebidos para ${PNAME}. Enviando para API remota...`);

        // 1. Faz a chamada HTTP para a SUA API remota
        if (RequestType == "D") {
            const apiResponse = await fetch(DIALOG_REMOTE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullRequestBody)
            });

            if (!apiResponse.ok) {
                const errorBody = await apiResponse.text();
                throw new Error(`Erro na API remota: ${apiResponse.statusText} - ${errorBody}`);
            }

            const remoteApiResult = await apiResponse.json();

            // 2. Processa a resposta recebida do seu servidor
            if (remoteApiResult && remoteApiResult.NPCGenResponse) {
                const npcResponseText = remoteApiResult.NPCGenResponse;
                const escapedNpcResponseText = npcResponseText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                console.log(`Resposta recebida do servidor para ${NPCN}: ${npcResponseText}`);

                // Envia a resposta de volta para o chat do Minecraft
                sendFunction(`tellraw @p[name="${PNAME}",${PLT}] {"rawtext":[{"text":"<${NPCN}> ${escapedNpcResponseText}"}]}`);

                // CORRIGIDO: Garante que o array de histórico exista antes de adicionar novas mensagens
                if (!history[conversationId]) {
                    history[conversationId] = [];
                }
                history[conversationId].push(`<${PNAME}> ${_playerMessage}`);
                history[conversationId].push(`<${NPCN}> ${escapedNpcResponseText}`);
                await saveHistory(history);

                let tag = `NPCIChange.${remoteApiResult.NPCIChange}.${PNAME}`;
                sendFunction(`tag @e[type=minecraft:villager,c=1,name="${NPCN}",${PLT}] add ${tag}`);
                sendFunction(`event entity @e[type=minecraft:villager,c=1,name="${NPCN}",${PLT}] sunrise:talk_to_player`);
            } else {
                console.log("A resposta do servidor remoto era inválida.");
                sendFunction(`say Hmm, algo estranho aconteceu com minha mente.`);
            }
        }else if (RequestType == "I" || RequestType == "G"){
            const apiResponse = await fetch(INTERACAT_REMOTE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullRequestBody)
            });

            if (!apiResponse.ok) {
                const errorBody = await apiResponse.text();
                throw new Error(`Erro na API remota: ${apiResponse.statusText} - ${errorBody}`);
            }

            const remoteApiResult = await apiResponse.json();

            // 2. Processa a resposta recebida do seu servidor
            if (remoteApiResult && remoteApiResult.NPCGenResponse) {
                const npcResponseText = remoteApiResult.NPCGenResponse;
                const escapedNpcResponseText = npcResponseText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                console.log(`Resposta recebida do servidor para ${NPCN}: ${npcResponseText}`);

                // Envia a resposta de volta para o chat do Minecraft
                sendFunction(`tellraw @p[name="${PNAME}",${PLT}] {"rawtext":[{"text":"<${NPCN}> ${escapedNpcResponseText}"}]}`);

                // CORRIGIDO: Garante que o array de histórico exista antes de adicionar novas mensagens
                if (!history[conversationId]) {
                    history[conversationId] = [];
                }
                history[conversationId].push(`${_playerMessage}`);
                history[conversationId].push(`${NPCN} repondeu a interação > ${escapedNpcResponseText}`);
                await saveHistory(history);

                let tag = `NPCIChange.${remoteApiResult.NPCIChange}.${PNAME}`;
                sendFunction(`tag @e[type=minecraft:villager,c=1,name="${NPCN}",${PLT}] add ${tag}`);
                sendFunction(`event entity @e[type=minecraft:villager,c=1,name="${NPCN}",${PLT}] sunrise:talk_to_player`);
            } else {
                console.log("A resposta do servidor remoto era inválida.");
                sendFunction(`say Hmm, algo estranho aconteceu com minha mente.`);
            }
        }

    } catch (error) {
        console.error("Falha ao se comunicar com o servidor remoto:", error);
        sendFunction(`say Não consegui me conectar com meus pensamentos... Tente mais tarde.`);
    }
}


// No Minecraft, quando você digita "/connect localhost:3000", uma conexão é criada
wss.on('connection', socket => {
    console.log('Conectado ao Minecraft');
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

    // Quando o MineCraft envia uma mensagem, age sobre ela.
    socket.on('message', async (packet) => {
        const msg = JSON.parse(packet);

        // Se for uma mensagem com o gatilho da API (title ou actionbar)
        if (msg.header.eventName === 'PlayerMessage' && msg.body.message.startsWith('{"FLRV":"2.0.0"')) {
            try {
                const dataPart = JSON.parse(msg.body.message);
                const { requestId, type, requestBody } = dataPart;

                // Se não for uma requisição válida, ignora
                if (!requestId || !type || !requestBody) return;

                // Se for a primeira parte da requisição, cria a entrada
                if (!pendingRequests[requestId]) {
                    pendingRequests[requestId] = {};
                    // Define um timeout para limpar a requisição se ela não se completar em 10s
                    setTimeout(() => {
                        if (pendingRequests[requestId]) {
                            console.log(`Requisição ${requestId} expirou e foi removida.`);
                            delete pendingRequests[requestId];
                        }
                    }, 10000);
                }

                // Armazena a parte correspondente (meta)
                if (type === "meta") {
                    pendingRequests[requestId].meta = requestBody;
                }

                // Verifica se a parte 'meta' já foi recebida
                if (pendingRequests[requestId].meta) {
                    // Se a requisição está "completa" (tem o meta), processa
                    await processCompleteRequest(pendingRequests[requestId], send);
                    // Limpa a requisição da memória
                    delete pendingRequests[requestId];
                }

            } catch (error) {
                // Ignora erros de JSON.parse se a mensagem não for o que esperamos
            }
        }

        // --- Lógica de filas (inalterada) ---
        if (msg.header.messagePurpose == 'commandResponse') {
            if (msg.header.requestId in awaitedQueue) {
                if (msg.body.statusCode < 0)
                    console.log('Erro:', awaitedQueue[msg.header.requestId].body.commandLine, msg.body.statusMessage);
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
