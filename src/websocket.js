const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 3000 });

console.log("🌸 Servidor WebSocket pronto na porta 3000!");
console.log("No Minecraft, digite: /connect localhost:3000");

wss.on('connection', (ws) => {
    console.log('✅ Minecraft conectado!');

    // Assim que conecta, já pedimos para escutar o chat
    subscribeToEvent(ws, 'PlayerMessage');
});

// Função para enviar comandos ao Minecraft
function sendCommand(ws, command) {
    const payload = {
        header: {
            requestId: uuidv4(),
            messagePurpose: "commandRequest",
            version: 1,
            messageType: "commandRequest"
        },
        body: {
            origin: { type: "player" },
            commandLine: command,
            version: 1
        }
    };
    ws.send(JSON.stringify(payload));
}

// Função para assinar eventos (Espionar o chat)
function subscribeToEvent(ws, eventName) {
    const payload = {
        header: {
            requestId: uuidv4(),
            messagePurpose: "subscribe",
            version: 1,
            messageType: "commandRequest"
        },
        body: {
            eventName: eventName
        }
    };
    ws.send(JSON.stringify(payload));
}

// Processa o que vem do Minecraft
function processIncomingMessage(msg) {
    // Verifica se é uma mensagem de chat de um jogador
    if (msg.header.messagePurpose === 'event' && msg.body.eventName === 'PlayerMessage') {
        const player = msg.body.properties.Sender;
        const message = msg.body.properties.Message;
        
        console.log(`💬 ${player} disse: ${message}`);
        
        // Aqui futuramente conectaremos com a IA
    } 
    // Log para respostas de comandos nossos
    else if (msg.header.messagePurpose === 'commandResponse') {
        // console.log("Resposta do comando:", msg.body);
    }
}

module.exports = { wss, sendCommand };