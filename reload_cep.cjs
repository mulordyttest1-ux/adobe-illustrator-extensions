const CDP = require('chrome-remote-interface');
(async function () {
    try {
        let client = await CDP({ port: 9097, host: 'localhost' });
        await client.Runtime.evaluate({ expression: 'location.reload(true)' });
        await client.close();
        console.log("✅ 9097 CEP Panel reloaded successfully.");
    } catch (e) {
        console.error("❌ Failed to reload CEP:", e.message);
    }
})();
