const auth = require('./src/auth.js');
const db = require('./src/database.js');
const service = require('./src/service.js');
const { wss, sendCommand } = require('./src/websocket.js');
const { RULES } = require('./src/prompt.js');

async function startApp() {
    console.log("🚀 Starting Family Life Plus System...");

    // 1. Attempt login before anything else
    const user = await auth.login();
    
    if (!user) {
        console.error("⛔ Shutting down: Initial authentication failed.");
        process.exit(1);
    }

    // 2. Configure WebSocket listener
    wss.on('connection', (ws) => {
        
        ws.on('message', async (data) => {
            const msg = JSON.parse(data);

            // Filter only chat messages from players
            if (msg.header.messagePurpose === 'event' && 
                msg.header.eventName === 'PlayerMessage' && 
                msg.body.sender != 'Externo' &&
                msg.body.type === 'title') {
                
                // Parse the custom JSON sent by the Addon (replacing ´ with ")
                const message = JSON.parse(msg.body.message.replaceAll("´","\""));

                if (!message.t) return;

                const player_name = message.pn;
                const player_message = message.pm;
                const player_language = message.pl;
                
                // NPC Data extraction
                const npc_name = message.nn || "NPC";
                const npc_id = message.ni || "NPC_GENERIC";
                const npc_age = message.nc === "A" ? "Teenager" : "Adult"; // Translated mapping
                const npc_mood = message.nh || "Neutral";
                const npc_gender = message.ns || "Female";
                const npc_personality = message.np || "Alegre";
                const npc_friendship = message.a || 0;
                const npc_affection = message.r || 0;
                
                const unicId = `${player_name}_${npc_id}`; // Unique Key: Player + NPC

                // Optional log for debugging
                // console.log(`\n📨 Received from ${player_name}: "${player_message}"`);
                if (message.t === "D"){
                    await processConversation(ws, unicId, player_name, player_message, npc_name, npc_mood, npc_age, npc_friendship, npc_affection, npc_personality, npc_gender, player_language);
                }else{
                    await processInteraction(ws, unicId, player_name, player_message, npc_name, npc_mood, npc_age, npc_friendship, npc_affection, npc_personality, npc_gender, player_language);
                }
            }
        });
    });
}

async function processConversation(ws, unicId, player, message, npc_name, npc_mood, npc_age, npc_friendship, npc_affection, npc_personality, npc_gender, player_language) {
    try {
        // A. Save player's message
        await db.addDialogue(unicId, `${player}: ${message}`);

        // B. Fetch Context (Memories + History)
        const memories = await db.getMemories(unicId);
        const history = await db.getDialogues(unicId);

        // C. Construct Payload for API
        const payloadMessages = [
            { 
                role: "system", 
                // Prompt translated to English so the AI understands the structure better.
                // The AI will still reply in the language the user speaks if instructed or based on context.
                content: `You are an NPC in Minecraft named ${npc_name}. 
The player's name is ${player}. 
Act like a normal person, but conditioned to be inside Minecraft!

Respond in the user's language: ${player_language}

/* CONTEXT INFO */
About you:
- Name: ${npc_name}
- Age Group: ${npc_age}
- Gender: ${npc_gender}
- Personality: ${npc_personality}
- Mood: ${npc_mood}
- CURRENT STATUS: [Friendship: ${npc_friendship}/200] | [Affection: ${npc_affection}/200]

Important Memories: ${memories}

Recent Conversation History:
${history}

${RULES}`
            },
            { role: "user", content: message }
        ];

        // D. Call AI Service
        const aiResponse = await service.getAIResponse(payloadMessages);

        // E. Process AI Response and send to Game
        if (aiResponse) {
            let response;
            
            // Safety Block: Tries to parse JSON, handles error if AI returns plain text
            try {
                const cleanJson = aiResponse.replaceAll("```json","").replaceAll("```","").replaceAll("\n","").replaceAll("/break/","\\n");
                //console.log(cleanJson)
                response = JSON.parse(cleanJson);
            } catch (jsonError) {
                console.error("⚠️ Error parsing AI JSON response. Using raw text fallback.");
                // Fallback: if JSON fails, assumes the whole text is the speech
                response = { fala_personagem: aiResponse };
            }

            if (response.fala_personagem) {
                await db.addDialogue(unicId, `${npc_name}: ${response.fala_personagem}`);
                if (response.memoria_dinamica){
                    await db.addMemory(unicId, `${response.memoria_dinamica.conteudo}`);
                }

                // Smart Regex: split into blocks of 400 chars, respecting word boundaries
                const parts = response.fala_personagem.match(/[\s\S]{1,300}(?!\S)/g) || [response.fala_personagem];

                for (const part of parts) {
                    // Send tellraw command
                    // Replacing " with '' to avoid JSON syntax breaking inside the command
                    const safeText = part.trim().replaceAll("\"", "''");
                    const command = `tellraw "${player}" {"rawtext":[{"text":"§a<${npc_name}> §r${safeText}"}]}`;
                    
                    sendCommand(ws, command);

                    // Delay to ensure order in Minecraft chat
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

    } catch (err) {
        console.error("❌ Error in conversation flow:", err);
    }
}

async function processInteraction(ws, unicId, player, message, npc_name, npc_mood, npc_age, npc_friendship, npc_affection, npc_personality, npc_gender, player_language) {
    try {
        // A. Save player's message
        await db.addDialogue(unicId, `${player}: ${message}`);

        // B. Fetch Context (Memories + History)
        const memories = await db.getMemories(unicId);
        const history = await db.getDialogues(unicId);

        // C. Construct Payload for API
        const payloadMessages = [
            { 
                role: "system", 
                // Prompt translated to English so the AI understands the structure better.
                // The AI will still reply in the language the user speaks if instructed or based on context.
                content: `You are an NPC in Minecraft named ${npc_name}. 
The player's name is ${player}. 
Act like a normal person, but conditioned to be inside Minecraft!

Respond in the user's language: ${player_language}

/* CONTEXT INFO */
About you:
- Name: ${npc_name}
- Age Group: ${npc_age}
- Gender: ${npc_gender}
- Personality: ${npc_personality}
- Mood: ${npc_mood}
- CURRENT STATUS: [Friendship: ${npc_friendship}/200] | [Affection: ${npc_affection}/200]

Important Memories: ${memories}

Recent Conversation History:
${history}

${RULES}`
            },
            { role: "user", content: `System: The player told/give ${message}` }
        ];

        // D. Call AI Service
        const aiResponse = await service.getAIResponse(payloadMessages);

        // E. Process AI Response and send to Game
        if (aiResponse) {
            let response;
            
            // Safety Block: Tries to parse JSON, handles error if AI returns plain text
            try {
                const cleanJson = aiResponse.replaceAll("```json","").replaceAll("```","").replaceAll("\n","").replaceAll("/break/","\\n");
                //console.log(cleanJson)
                response = JSON.parse(cleanJson);
            } catch (jsonError) {
                console.error("⚠️ Error parsing AI JSON response. Using raw text fallback.");
                // Fallback: if JSON fails, assumes the whole text is the speech
                response = { fala_personagem: aiResponse };
            }

            if (response.fala_personagem) {
                await db.addDialogue(unicId, `${npc_name}: ${response.fala_personagem}`);
                if (response.memoria_dinamica){
                    await db.addMemory(unicId, `${response.memoria_dinamica.conteudo}`);
                }

                // Smart Regex: split into blocks of 400 chars, respecting word boundaries
                const parts = response.fala_personagem.match(/[\s\S]{1,300}(?!\S)/g) || [response.fala_personagem];

                for (const part of parts) {
                    // Send tellraw command
                    // Replacing " with '' to avoid JSON syntax breaking inside the command
                    const safeText = part.trim().replaceAll("\"", "''");
                    const command = `tellraw "${player}" {"rawtext":[{"text":"§a<${npc_name}> §r${safeText}"}]}`;
                    
                    sendCommand(ws, command);

                    // Delay to ensure order in Minecraft chat
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

    } catch (err) {
        console.error("❌ Error in conversation flow:", err);
    }
}

// Start everything
startApp();