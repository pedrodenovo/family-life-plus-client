const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, 'minecraft_ai.json');

// Estrutura inicial do banco
const initialData = {
    dialogues: [],
    memories: [],
    // Contadores para simular o AUTOINCREMENT do SQL
    meta: { lastDialogueId: 0, lastMemoryId: 0 }
};

// Helper: Lê o "banco" (JSON)
async function loadDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await saveDB(initialData);
            return JSON.parse(JSON.stringify(initialData));
        }
        throw err;
    }
}

// Helper: Salva o "banco"
async function saveDB(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- DIÁLOGOS (FALAS) ---

async function addDialogue(unicId, content) {
    try {
        const db = await loadDB();
        
        // 1. Simula INSERT
        const newEntry = {
            id: ++db.meta.lastDialogueId,
            unicId,
            content,
            timestamp: new Date().toISOString()
        };
        db.dialogues.push(newEntry);

        // 2. Simula DELETE ... NOT IN (LIMIT 10)
        // Filtra os diálogos desse usuário específico
        const userDialogues = db.dialogues.filter(d => d.unicId === unicId);
        
        // Se houver mais de 10, pegamos os IDs dos mais antigos para remover
        if (userDialogues.length > 10) {
            // Ordena decrescente pelo ID e pega os 10 primeiros (os mais novos)
            const keepIds = userDialogues
                .sort((a, b) => b.id - a.id)
                .slice(0, 10)
                .map(d => d.id);

            // Mantém no banco apenas: (Outros usuários) OU (Ids que estão na lista de manter)
            db.dialogues = db.dialogues.filter(d => d.unicId !== unicId || keepIds.includes(d.id));
        }

        await saveDB(db);

    } catch (err) {
        console.error("Erro ao salvar diálogo:", err);
    }
}

async function getDialogues(unicId) {
    try {
        const db = await loadDB();
        
        // Filtra pelo ID e Ordena Ascendente (antigo -> novo)
        const rows = db.dialogues
            .filter(d => d.unicId === unicId)
            .sort((a, b) => a.id - b.id);

        if (rows.length === 0) {
            return "-- Essa é a primeira interação de vocês --";
        }

        return rows.map(r => r.content).join('\n');
    } catch (err) {
        console.error("Erro ao ler diálogos:", err);
        return "";
    }
}

// --- MEMÓRIAS DINÂMICAS ---

async function addMemory(unicId, content) {
    try {
        const db = await loadDB();

        const newEntry = {
            id: ++db.meta.lastMemoryId,
            unicId,
            content,
            timestamp: new Date().toISOString()
        };
        db.memories.push(newEntry);

        // Limpeza: Mantém apenas as 100 últimas para este unicId
        const userMemories = db.memories.filter(m => m.unicId === unicId);

        if (userMemories.length > 100) {
            const keepIds = userMemories
                .sort((a, b) => b.id - a.id)
                .slice(0, 100)
                .map(m => m.id);

            db.memories = db.memories.filter(m => m.unicId !== unicId || keepIds.includes(m.id));
        }

        await saveDB(db);

    } catch (err) {
        console.error("Erro ao salvar memória:", err);
    }
}

async function getMemories(unicId) {
    try {
        const db = await loadDB();

        const rows = db.memories
            .filter(m => m.unicId === unicId)
            .sort((a, b) => a.id - b.id);

        if (rows.length === 0) {
            return "-- Sem memórias registradas --";
        }

        return rows.map(r => r.content).join('\n');
    } catch (err) {
        console.error("Erro ao ler memórias:", err);
        return "";
    }
}

module.exports = { addDialogue, getDialogues, addMemory, getMemories };
