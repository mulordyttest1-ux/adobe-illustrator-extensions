const CDP = require('chrome-remote-interface');

async function runSymbolSmokeTest() {
    let client;
    try {
        console.log('🔌 Connecting to Symbol CEP (Port 9098)...');
        client = await CDP({ port: 9098, host: 'localhost' });
        const { Runtime } = client;
        await Runtime.enable();

        console.log('✅ Connected! Checking Bootstrap Status...');

        // 1. JS Domain Check (Skipped)
        // Architecture changed: ImpositionDomain is only loaded in ExtendScript (JSX) now.

        // 2. Check JSX Bootstrap (Rule: $._imposition.isLoaded)
        // We use a Promise wrapper for evalScript because it's async callback-based
        const jsxExpression = `
            new Promise((resolve) => {
                if (typeof CSInterface === 'undefined') {
                    resolve({ error: 'CSInterface missing' });
                    return;
                }
                new CSInterface().evalScript('$._imposition.isLoaded', (res) => {
                    resolve({ loaded: res });
                });
            })
        `;

        const jsxEval = await Runtime.evaluate({
            expression: jsxExpression,
            awaitPromise: true,
            returnByValue: true
        });

        console.log('📜 JSX Bootstrap Check:', JSON.stringify(jsxEval.result.value, null, 2));

        // Final Assertion
        const jsxOk = jsxEval.result.value.loaded === 'true';

        if (jsxOk) {
            console.log('🎉 SYMBOL CEP BOOTSTRAP: PASS');
        } else {
            console.error('❌ SYMBOL CEP BOOTSTRAP: FAILED');
            if (!jsxOk) console.error('   -> JSX Bootstrap Failed (Core.jsx error?)');
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

runSymbolSmokeTest();
