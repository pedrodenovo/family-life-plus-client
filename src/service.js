const { api } = require('./auth');

/**
 * Envia o histórico de mensagens para a API e retorna a resposta da IA.
 * @param {Array} messages - Array de objetos { role: string, content: string }
 */
async function getAIResponse(messages) {
    try {
        //console.log(`📤 Enviando ${messages.length} mensagens para a IA...`);

        // O Token e a BaseURL já são gerenciados pelo auth.js
        const response = await api.post('/family-life/chat', {
            messages: messages
        });

        const { reply, used_model } = response.data;
        
        //console.log(`🤖 Resposta recebida (Modelo: ${used_model})`);
        return reply;

    } catch (error) {
        // Tratamento para devolver o erro ao jogador dentro do Minecraft
        if (error.response) {
            const status = error.response.status;
            const errorMsg = error.response.data.error;

            console.warn(`⚠️ Erro da API (${status}): ${errorMsg}`);
            
            // Retorna a mensagem de erro da API (ex: link do Patreon ou aviso de sobrecarga)
            return `§c[Erro do Sistema]: ${errorMsg}§r`; 
        } else {
            console.error("❌ Erro de conexão:", error.message);
            return "§c[Erro]: Não foi possível conectar ao servidor da IA.§r";
        }
    }
}

module.exports = { getAIResponse };