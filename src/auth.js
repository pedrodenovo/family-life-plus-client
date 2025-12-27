const axios = require('axios');
const { machineId } = require('node-machine-id');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Variable to store the token in memory
let authToken = null;

function getDeviceId() {
    // Salva na Home do usuário, fora da pasta do projeto
    // Assim, se você atualizar o bot (apagar a pasta do projeto), o ID continua o mesmo!
    const filePath = path.join(os.homedir(), '.minecraft_ai_id');

    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8').trim();
        }

        // Gera um ID único aleatório (tipo UUID)
        const newId = crypto.randomBytes(16).toString('hex');
        
        fs.writeFileSync(filePath, newId);
        return newId;

    } catch (err) {
        console.error('Erro ao gerar ID:', err);
        return 'device-unknown-' + Date.now(); // Fallback de emergência
    }
}

// API Instance creation
const api = axios.create({
    baseURL: 'https://family-life-plus.pedro-denovo.site/api',
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor to inject the token automatically
api.interceptors.request.use(config => {
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
});

async function login() {
    try {
        // Get unique Device ID
        const deviceId = getDeviceId();
        console.log(`🔄 Checking authentication for Device ID: ${deviceId}...`);

        const response = await api.post('/auth/device', {
            device_id: deviceId
        });

        const data = response.data;

        if (data.status === "success") {
            authToken = data.token;
            console.log(`✅ Login successful! User Tier: ${data.user.tier}`);
            return data.user;
        } 
        else if (data.status === "login_required") {
            // Friendly formatted message for authentication
            console.log('\n==========================================================');
            console.log('               AUTHENTICATION REQUIRED');
            console.log('==========================================================');
            console.log('To use the Family Life Plus AI, you need to link this device.');
            console.log('Please copy and open the URL below in your browser:');
            console.log('');
            console.log(data.login_url);
            console.log('');
            console.log('----------------------------------------------------------');
            console.log('👉 After logging in on the website, please restart this server.');
            console.log('==========================================================\n');
            
            // Returns null so app.js knows to stop
            return null;
        } 
        else {
            console.warn('⚠️ Login failed:', data);
            return null;
        }

    } catch (error) {
        console.error('❌ Connection error:', error.message);
        return null;
    }
}

// Export the instance and the function

module.exports = { api, login };
