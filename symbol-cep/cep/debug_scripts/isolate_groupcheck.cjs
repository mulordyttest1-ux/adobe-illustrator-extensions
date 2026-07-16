/**
 * /fix ISOLATION v2: Test showGroupCheckDialog after reload
 */
const CDP = require('chrome-remote-interface');

function atob(b64) { return Buffer.from(b64, 'base64').toString('utf8'); }

async function isolate() {
    let client;
    try {
        client = await CDP({ port: 9098 });
        const { Runtime } = client;
        await Runtime.enable();
        console.log('✅ Connected\n');

        // Check if showGroupCheckDialog exists
        const h1 = await Runtime.evaluate({
            expression: `new Promise(resolve => {
                const cs = new CSInterface();
                cs.evalScript('typeof $.global.Bridge.showGroupCheckDialog', r => resolve(r));
            })`,
            returnByValue: true,
            awaitPromise: true
        });
        console.log('typeof showGroupCheckDialog:', h1.result.value);

        if (h1.result.value === 'function') {
            console.log('✅ Function is defined — will show ScriptUI dialog in Illustrator on real test');
        } else {
            console.log('❌ STILL UNDEFINED — bridge.jsx not reloaded. Panel needs reload.');
        }

    } catch(err) {
        console.error('Error:', err.message);
    } finally {
        if (client) await client.close();
    }
}

isolate();
