const WebSocket = require('ws');
const uuid = require('uuid');

// Endereço da sua API remota que irá processar a chamada para o Gemini
const YOUR_REMOTE_API_URL = "https://api.pedro-denovo.site/family-life/NPCDialogResponse";

// Objeto para armazenar partes de requisições que ainda não foram completadas
const pendingRequests = {};

// Cria um novo servidor websocket na porta 3000
console.log(`
┌──────────────────────────────────┐
│                                  │
│      FAMILY LIFE+ CLIENT         │
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

// Função assíncrona para processar a requisição completa
async function processCompleteRequest(requestData, sendFunction) {
    try {
        const { meta, history } = requestData;

        // Combina as duas partes em um único corpo de requisição
        const fullRequestBody = {
            ...meta,
            previousMessages: history.previousMessages
        };

        const npcName = fullRequestBody.NPCName;
        const playerName = fullRequestBody.PlayerName;
        const playerLocation = fullRequestBody.playerLocation;

        console.log(`Dados completos recebidos para ${playerName}. Enviando para API remota...`);

        // 1. Faz a chamada HTTP para a SUA API remota
        const apiResponse = await fetch(YOUR_REMOTE_API_URL, {
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
            const escapedNpcResponseText = npcResponseText.replaceAll(/\\/g, '\\\\').replaceAll(/"/g, '\\"');
            console.log(`Resposta recebida do servidor para ${npcName}: ${npcResponseText}`);

            // Envia a resposta de volta para o chat do Minecraft
            sendFunction(`tellraw @p[name="${playerName}",${playerLocation}] {"rawtext":[{"text":"<${npcName}> ${escapedNpcResponseText}"}]}`);

            let tag = "talkedTo" + playerName + npcResponseText;
            sendFunction(`tag @e[type=minecraft:villager,c=1,name="${npcName}",${playerLocation}] add ${tag.replaceAll(/[^\p{L}\p{N} ]/gu, '').replaceAll(' ', '_')}`);
            sendFunction(`event entity @e[type=minecraft:villager,c=1,name="${npcName}",${playerLocation}] sunrise:talk_to_player`);
        } else {
            console.log("A resposta do servidor remoto era inválida.");
            sendFunction(`say Hmm, algo estranho aconteceu com minha mente.`);
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
        if (msg.header.eventName === 'PlayerMessage' && msg.body.message.startsWith('{"familyLifeRequestVersion":"2.0.0"')) {
            try {
                const dataPart = JSON.parse(msg.body.message);
                const { requestId, type, requestBody } = dataPart;

                // Se não for uma requisição válida, ignora
                if (!requestId || !type || !requestBody) return;
                
                // Se for a primeira parte da requisição, cria a entrada
                if (!pendingRequests[requestId]) {
                    pendingRequests[requestId] = {};
                    // Define um timeout para limpar a requisição se ela não se completar em 5s
                    setTimeout(() => {
                        if (pendingRequests[requestId] && (!pendingRequests[requestId].meta || !pendingRequests[requestId].history)) {
                            console.log(`Requisição ${requestId} expirou e foi removida.`);
                            delete pendingRequests[requestId];
                        }
                    }, 10000);
                }
                
                // Armazena a parte correspondente (meta ou history)
                if (type === "meta") {
                    pendingRequests[requestId].meta = requestBody;
                } else if (type === "history") {
                    pendingRequests[requestId].history = requestBody;
                }

                // Verifica se ambas as partes já foram recebidas
                if (pendingRequests[requestId].meta && pendingRequests[requestId].history) {
                    // Se a requisição está completa, processa
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