/**
 * EMERGENCY RECOVERY: Restore presets from localStorage to presets.json
 */
const CDP = require('chrome-remote-interface');

async function recover() {
    let client;
    try {
        console.log('🚨 RECOVERY MODE: Restoring presets from localStorage...');
        client = await CDP({ port: 9098 });
        const { Runtime } = client;
        await Runtime.enable();

        const r = await Runtime.evaluate({
            expression: `
                (function() {
                    try {
                        // 1. Read from localStorage
                        const raw = localStorage.getItem('cep_imposition_presets');
                        if (!raw) return JSON.stringify({ error: 'No data in localStorage!' });
                        const presets = JSON.parse(raw);
                        if (!Array.isArray(presets) || presets.length === 0) return JSON.stringify({ error: 'localStorage empty' });

                        // 2. Get native path
                        const cs = new CSInterface();
                        let native = cs.getSystemPath(CSInterface.EXTENSION);
                        if (native.startsWith('file:///')) native = native.slice(8);
                        else if (native.startsWith('file://')) native = native.slice(7);

                        const dataDir = native + '/data';
                        const filePath = dataDir + '/presets.json';

                        // 3. Ensure dir
                        if (window.cep.fs.stat(dataDir).err !== 0) {
                            window.cep.fs.makedir(dataDir);
                        }

                        // 4. Write CORRECT payload with all presets
                        const payload = JSON.stringify({ version: 1, presets: presets }, null, 2);
                        const wr = window.cep.fs.writeFile(filePath, payload);

                        return JSON.stringify({
                            ok: wr.err === 0,
                            count: presets.length,
                            filePath: filePath,
                            labels: presets.slice(0, 5).map(p => p.label)
                        });
                    } catch(e) { return JSON.stringify({ error: e.message }); }
                })()
            `,
            returnByValue: true
        });

        const result = JSON.parse(r.result.value);
        if (result.error) {
            console.error('❌ RECOVERY FAILED:', result.error);
            process.exit(1);
        }

        if (result.ok) {
            console.log('✅ RECOVERY SUCCESS!');
            console.log('   Restored', result.count, 'presets to:', result.filePath);
            console.log('   First 5:', result.labels.join(', '));
        } else {
            console.error('❌ Write failed');
            process.exit(1);
        }

    } catch(err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
}

recover();
