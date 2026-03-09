const CDP = require('chrome-remote-interface');

async function debug() {
    try {
        const client = await CDP({ port: 9097 });
        const { Runtime, Page } = client;

        await Runtime.enable();
        await Page.enable();

        console.log("Connected to Illustrator CEP (Port 9097)! Collecting existing errors...");

        // Listen for unhandled exceptions
        Runtime.exceptionThrown((params) => {
            console.error('\n❌ CEP Exception:', JSON.stringify(params.exceptionDetails, null, 2));
        });

        // Listen for console logs
        Runtime.consoleAPICalled((params) => {
            const args = params.args.map(a => a.value || a.description).join(' ');
            if (params.type === 'error') {
                console.error(`\n[CEP CONSOLE ERROR]`, args);
            } else {
                console.log(`[CEP Console]`, args);
            }
        });

        // Evaluate to get any visible error on screen
        const domError = await Runtime.evaluate({
            expression: `document.getElementById('ds-app-error') ? document.getElementById('ds-app-error').innerText : 'No explicit DOM error found'`
        });
        console.log("\nDOM Error Text:", domError.result.value);

        // Wait a bit to collect logs, then close
        setTimeout(async () => {
            console.log("\nDebug session completed.");
            await client.close();
        }, 3000);

    } catch (err) {
        console.error('CDP Connection Error:', err.message);
    }
}

debug();
