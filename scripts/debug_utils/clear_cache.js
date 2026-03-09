const CDP = require('chrome-remote-interface');

async function clearCacheAndReload() {
    try {
        const client = await CDP({ port: 9097 });
        const { Network, Runtime } = client;

        console.log("Connected to 9097. Clearing cache...");
        await Network.clearBrowserCache();
        await Network.setCacheDisabled({ cacheDisabled: true });

        console.log("Issuing hard reload...");
        await Runtime.evaluate({ expression: 'location.reload(true)' });

        setTimeout(async () => {
            console.log("Done.");
            await client.close();
        }, 3000);
    } catch (err) {
        console.error("Error:", err);
    }
}

clearCacheAndReload();
