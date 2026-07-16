/**
 * DEBUG: Test path stripping + file write on live panel.
 */
const CDP = require('chrome-remote-interface');

async function testPathAndWrite() {
    let client;
    try {
        console.log('🔌 Connecting...');
        client = await CDP({ port: 9098 });
        const { Runtime } = client;
        await Runtime.enable();

        // 1. Check what path looks like after stripping
        const pathR = await Runtime.evaluate({
            expression: `
                (function() {
                    const cs = new CSInterface();
                    const raw = cs.getSystemPath(CSInterface.EXTENSION);
                    let native = raw;
                    if (native.startsWith('file:///')) native = native.slice(8);
                    else if (native.startsWith('file://')) native = native.slice(7);
                    const dataDir = native + '/data';
                    const filePath = dataDir + '/presets.json';
                    const statExt = window.cep.fs.stat(native);
                    const statDir = window.cep.fs.stat(dataDir);
                    const statFile = window.cep.fs.stat(filePath);
                    return JSON.stringify({
                        raw: raw,
                        native: native,
                        filePath: filePath,
                        extExists: statExt.err === 0,
                        dataDirExists: statDir.err === 0,
                        fileExists: statFile.err === 0
                    });
                })()
            `,
            returnByValue: true
        });
        const p = JSON.parse(pathR.result.value);
        console.log('Raw URL:', p.raw);
        console.log('Native Path:', p.native);
        console.log('presets.json path:', p.filePath);
        console.log('extension dir exists?', p.extExists);
        console.log('data/ dir exists?', p.dataDirExists);
        console.log('presets.json exists?', p.fileExists);

        // 2. Force a test write
        if (p.extExists) {
            const writeR = await Runtime.evaluate({
                expression: `
                    (function() {
                        try {
                            const cs = new CSInterface();
                            let native = cs.getSystemPath(CSInterface.EXTENSION);
                            if (native.startsWith('file:///')) native = native.slice(8);
                            else if (native.startsWith('file://')) native = native.slice(7);
                            const dataDir = native + '/data';
                            const filePath = dataDir + '/presets.json';
                            // Ensure dir
                            const stat = window.cep.fs.stat(dataDir);
                            if (stat.err !== 0) {
                                const mk = window.cep.fs.makedir(dataDir);
                                if (mk.err !== 0) return JSON.stringify({ error: 'mkdir failed: ' + mk.err });
                            }
                            // Write test
                            const testPayload = JSON.stringify({ version: 1, test: true });
                            const wr = window.cep.fs.writeFile(filePath, testPayload);
                            return JSON.stringify({ writeErr: wr.err });
                        } catch(e) { return JSON.stringify({ error: e.message }); }
                    })()
                `,
                returnByValue: true
            });
            const wr = JSON.parse(writeR.result.value);
            console.log('\n📝 Test write result:', wr.writeErr === 0 ? '✅ SUCCESS' : '❌ FAILED err=' + wr.writeErr);
        }

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
}

testPathAndWrite();
