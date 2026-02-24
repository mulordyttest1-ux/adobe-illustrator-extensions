const CDP = require('chrome-remote-interface');

async function debugCheck() {
    try {
        console.log('Connecting to Wedding CEP on port 9097...');
        const client = await CDP({ port: 9097, host: 'localhost' });
        const { Runtime } = client;

        console.log('✅ Connected successfully!');

        await Runtime.enable();
        const result = await Runtime.evaluate({ expression: 'window.location.href' });
        console.log('Current URL:', result.result.value);

        await client.close();
        console.log('Connection closed.');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.error('Troubleshooting: Ensure Illustrator is running and Extension is open.');
    }
}

debugCheck();
