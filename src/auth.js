const axios = require('axios');
const { machineId } = require('node-machine-id');

// Variable to store the token in memory
let authToken = null;

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
        const deviceId = await machineId();
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