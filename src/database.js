const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./minecraft_ai.db');

// Inicializa as tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS dialogues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unicId TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unicId TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Helper para encapsular queries em Promises
function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// --- DIÁLOGOS (FALAS) ---

async function addDialogue(unicId, content) {
    try {
        // 1. Adiciona a nova fala
        await runQuery(`INSERT INTO dialogues (unicId, content) VALUES (?, ?)`, [unicId, content]);

        // 2. Limpeza inteligente: Mantém apenas as 10 mais recentes para este ID
        await runQuery(`
            DELETE FROM dialogues 
            WHERE unicId = ? AND id NOT IN (
                SELECT id FROM dialogues WHERE unicId = ? ORDER BY id DESC LIMIT 10
            )
        `, [unicId, unicId]);
        
    } catch (err) {
        console.error("Erro ao salvar diálogo:", err);
    }
}

async function getDialogues(unicId) {
    try {
        // Pegamos em ordem ascendente (antigo -> novo) para a IA entender o contexto cronológico
        const rows = await getQuery(`SELECT content FROM dialogues WHERE unicId = ? ORDER BY id ASC`, [unicId]);
        
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
        await runQuery(`INSERT INTO memories (unicId, content) VALUES (?, ?)`, [unicId, content]);

        // Limpeza: Mantém apenas as 100 últimas
        await runQuery(`
            DELETE FROM memories 
            WHERE unicId = ? AND id NOT IN (
                SELECT id FROM memories WHERE unicId = ? ORDER BY id DESC LIMIT 100
            )
        `, [unicId, unicId]);

    } catch (err) {
        console.error("Erro ao salvar memória:", err);
    }
}

async function getMemories(unicId) {
    try {
        const rows = await getQuery(`SELECT content FROM memories WHERE unicId = ? ORDER BY id ASC`, [unicId]);
        
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