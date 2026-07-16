const CDP = require('chrome-remote-interface');

async function reloadPanel() {
    let client;
    try {
        console.log('🔌 Connecting to Wedding CEP (Port 9097) for reload...');
        client = await CDP({ port: 9097 });
        const { Page, Runtime } = client;

        await Runtime.enable();
        console.log('🔄 Reloading panel...');
        await Runtime.evaluate({ expression: 'location.reload()' });

        console.log('✅ Reload command sent. Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
        console.error('❌ Failed to reload panel:', err.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

reloadPanel();
