/**
 * DEBUG: Diagnostic for DataStore file-based storage.
 * Run this to check if presets.json is being written correctly.
 */
const CDP = require('chrome-remote-interface');

async function debugDataStore() {
    let client;
    try {
        console.log('🔌 Connecting to Symbol CEP (Port 9098)...');
        client = await CDP({ port: 9098, host: 'localhost' });
        const { Runtime } = client;
        await Runtime.enable();
        console.log('✅ Connected!\n');

        // 1. Check EXTENSION path resolved
        const pathCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    try {
                        const cs = new CSInterface();
                        const extPath = cs.getSystemPath(CSInterface.EXTENSION);
                        return JSON.stringify({ extensionPath: extPath, filePath: extPath + '/data/presets.json' });
                    } catch(e) { return JSON.stringify({ error: e.message }); }
                })()
            `,
            returnByValue: true
        });
        const paths = JSON.parse(pathCheck.result.value);
        console.log('📂 Extension Path:', paths.extensionPath);
        console.log('📄 Expected presets.json at:', paths.filePath);

        // 2. Check if file exists
        const fileCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    try {
                        const cs = new CSInterface();
                        const extPath = cs.getSystemPath(CSInterface.EXTENSION);
                        const filePath = extPath + '/data/presets.json';
                        const result = window.cep.fs.readFile(filePath);
                        if (result.err !== 0) return JSON.stringify({ exists: false, errCode: result.err });
                        return JSON.stringify({ exists: true, content: result.data.substring(0, 200) });
                    } catch(e) { return JSON.stringify({ error: e.message }); }
                })()
            `,
            returnByValue: true
        });
        const fileStatus = JSON.parse(fileCheck.result.value);
        console.log('\n📊 File Status:', fileStatus.exists ? '✅ EXISTS' : `❌ NOT FOUND (err: ${fileStatus.errCode})`);
        if (fileStatus.exists) console.log('Content preview:', fileStatus.content);

        // 3. Read DataStore presets
        const presetsCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    try {
                        const presets = window.Imposition && window.Imposition.actionTab
                            ? window.Imposition.actionTab.filteredPresets
                            : [];
                        return JSON.stringify({ count: presets.length, labels: presets.slice(0,5).map(p => p.label) });
                    } catch(e) { return JSON.stringify({ error: e.message }); }
                })()
            `,
            returnByValue: true
        });
        const presetsStatus = JSON.parse(presetsCheck.result.value);
        console.log('\n🗂️ Presets in ActionTab:', presetsStatus.count, 'found');
        if (presetsStatus.labels) console.log('   Labels:', presetsStatus.labels.join(', '));

        // 4. Force DataStore.getPresets() directly
        const dsCheck = await Runtime.evaluate({
            expression: `
                (function() {
                    try {
                        const ds = window.Imposition && window.Imposition.actionTab
                            ? null // Can't access dataStore directly from here
                            : null;
                        // Try to read localStorage too
                        const lsRaw = localStorage.getItem('cep_imposition_presets');
                        const lsPresets = lsRaw ? JSON.parse(lsRaw) : [];
                        return JSON.stringify({ localStorageCount: lsPresets.length });
                    } catch(e) { return JSON.stringify({ error: e.message }); }
                })()
            `,
            returnByValue: true
        });
        const dsStatus = JSON.parse(dsCheck.result.value);
        console.log('\n💾 localStorage presets:', dsStatus.localStorageCount, 'items (old storage)');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
}

debugDataStore();
