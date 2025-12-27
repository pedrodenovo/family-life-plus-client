const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const DB_FOLDER = path.join(__dirname, 'dbm');

// Garante que a pasta existe ao iniciar
if (!fsSync.existsSync(DB_FOLDER)) {
    fsSync.mkdirSync(DB_FOLDER, { recursive: true });
}

// Helper: Define o caminho do arquivo com base no ID (sanitizando para evitar erros de nome)
function getFilePath(unicId) {
    const safeId = String(unicId).replace(/[^a-z0-9\-_]/gi, '_');
    return path.join(DB_FOLDER, `${safeId}.json`);
}

// Helper: Carrega ou cria os dados do usuário específico
async function loadUserDB(unicId) {
    const filePath = getFilePath(unicId);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // Estrutura padrão para novo usuário
            return { dialogues: [], memories: [] };
        }
        throw err;
    }
}

// Helper: Salva os dados do usuário
async function saveUserDB(unicId, data) {
    const filePath = getFilePath(unicId);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// --- DIÁLOGOS ---

async function addDialogue(unicId, content) {
    try {
        const db = await loadUserDB(unicId);
        
        db.dialogues.push({
            content,
            timestamp: new Date().toISOString()
        });

        // Mantém apenas os 10 mais recentes (lógica simplificada para array)
        if (db.dialogues.length > 10) {
            db.dialogues = db.dialogues.slice(-10);
        }

        await saveUserDB(unicId, db);
    } catch (err) {
        console.error("Erro ao salvar diálogo:", err);
    }
}

async function getDialogues(unicId) {
    try {
        const db = await loadUserDB(unicId);
        
        if (db.dialogues.length === 0) {
            return "-- Essa é a primeira interação de vocês --";
        }
        
        return db.dialogues.map(d => d.content).join('\n');
    } catch (err) {
        console.error("Erro ao ler diálogos:", err);
        return "";
    }
}

// --- MEMÓRIAS ---

async function addMemory(unicId, content) {
    try {
        const db = await loadUserDB(unicId);

        db.memories.push({
            content,
            timestamp: new Date().toISOString()
        });

        // Mantém apenas as 100 mais recentes
        if (db.memories.length > 100) {
            db.memories = db.memories.slice(-100);
        }

        await saveUserDB(unicId, db);
    } catch (err) {
        console.error("Erro ao salvar memória:", err);
    }
}

async function getMemories(unicId) {
    try {
        const db = await loadUserDB(unicId);

        if (db.memories.length === 0) {
            return "-- Sem memórias registradas --";
        }

        return db.memories.map(m => m.content).join('\n');
    } catch (err) {
        console.error("Erro ao ler memórias:", err);
        return "";
    }
}

module.exports = { addDialogue, getDialogues, addMemory, getMemories };
