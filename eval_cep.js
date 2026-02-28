const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function debug() {
    try {
        // Phase 1: Clear cache and reload
        let client = await CDP({ port: 9098, host: 'localhost' });
        const { Network, Runtime: RT1 } = client;
        await Network.enable();
        await Network.clearBrowserCache();
        await Network.setCacheDisabled({ cacheDisabled: true });
        console.log("Cache cleared. Reloading...");
        await RT1.evaluate({ expression: 'location.reload(true)' });
        await client.close();

        // Wait for reload
        await new Promise(r => setTimeout(r, 3000));

        // Phase 2: Reconnect and inspect
        client = await CDP({ port: 9098, host: 'localhost' });
        const { Runtime, Page } = client;
        await Runtime.enable();
        await Page.enable();

        // Screenshot
        const screenshot = await Page.captureScreenshot({ format: 'png' });
        fs.writeFileSync('panel_screenshot.png', Buffer.from(screenshot.data, 'base64'));
        console.log("Screenshot saved to panel_screenshot.png");

        // Check input
        const r1 = await Runtime.evaluate({ expression: '!!document.getElementById("action-search")' });
        console.log("Input exists:", r1.result.value);

        const r2 = await Runtime.evaluate({
            expression: `(function() {
                var el = document.getElementById("action-search");
                if (!el) return "NOT FOUND";
                var cs = window.getComputedStyle(el);
                return "width=" + cs.width + " height=" + cs.height + " display=" + cs.display + " visibility=" + cs.visibility;
            })()`
        });
        console.log("Input style:", r2.result.value);

        const r3 = await Runtime.evaluate({ expression: '!!window.Fuse' });
        console.log("Fuse loaded:", r3.result.value);

        await client.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

debug();
