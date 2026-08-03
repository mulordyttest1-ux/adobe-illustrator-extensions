/**
 * LIVE DIAGNOSTIC: Inspect real presets and search behavior via CDP.
 * 
 * Run while Symbol CEP is open in Illustrator:
 *   node symbol-cep/cep/debug_scripts/diag_search.cjs
 * 
 * Port 9098 = Symbol CEP debug port
 */
const CDP = require('chrome-remote-interface');

async function diagnose() {
    let client;
    try {
        console.log('🔌 Connecting to Symbol CEP (Port 9098)...');
        client = await CDP({ port: 9098, host: 'localhost' });
        const { Runtime } = client;
        await Runtime.enable();
        console.log('✅ Connected!\n');

        // 1. Dump all presets from localStorage
        const dumpResult = await Runtime.evaluate({
            expression: `
                (function() {
                    const actionTab = window.Imposition && window.Imposition.actionTab;
                    if (!actionTab) return { error: 'ActionTab not loaded' };
                    const presets = actionTab.filteredPresets || [];
                    return presets.map(p => ({
                        id: p.id,
                        label: p.label,
                        labelType: typeof p.label,
                        labelChars: p.label ? [...p.label].map(c => c + '(U+' + c.charCodeAt(0).toString(16).padStart(4, '0') + ')').join(' ') : 'null'
                    }));
                })()
            `,
            returnByValue: true
        });

        const presets = dumpResult.result.value;
        console.log('=== PRESETS IN LOCALSTORAGE ===');
        if (presets.error) {
            console.log('❌', presets.error);
        } else {
            presets.forEach((p, i) => {
                console.log(`[${i}] id="${p.id}" label="${p.label}" (type=${p.labelType})`);
                console.log(`    chars: ${p.labelChars}`);
            });
        }
        console.log('');

        // 2. Test Fuse search with "a52 khong ky" directly
        const searchResult = await Runtime.evaluate({
            expression: `
                (function() {
                    const actionTab = window.Imposition && window.Imposition.actionTab;
                    if (!actionTab) return { error: 'ActionTab not loaded' };
                    const presets = actionTab.filteredPresets || [];
                    
                    if (!window.Fuse) return { error: 'Fuse not loaded' };
                    
                    const fuse = new Fuse(presets, {
                        keys: [
                            { name: 'label', weight: 0.7 },
                            { name: 'id', weight: 0.3 }
                        ],
                        threshold: 0.4,
                        ignoreLocation: true,
                        includeScore: true
                    });
                    
                    const testQueries = ['a52 khong ky', 'a52', 'khong ky'];
                    return testQueries.map(q => ({
                        query: q,
                        results: fuse.search(q).map(r => ({
                            label: r.item.label,
                            id: r.item.id,
                            score: r.score
                        }))
                    }));
                })()
            `,
            returnByValue: true
        });

        console.log('=== FUSE SEARCH TEST (LIVE DATA) ===');
        const searches = searchResult.result.value;
        if (searches.error) {
            console.log('❌', searches.error);
        } else {
            searches.forEach(s => {
                console.log(`Query: "${s.query}"`);
                if (s.results.length === 0) {
                    console.log('  ❌ NO RESULTS');
                } else {
                    s.results.forEach(r => {
                        console.log(`  ✅ "${r.label}" (score=${r.score.toFixed(4)})`);
                    });
                }
            });
        }
        console.log('');

        // 3. Check if ActionTab fuse instance exists and is working
        const stateResult = await Runtime.evaluate({
            expression: `
                (function() {
                    const at = window.Imposition && window.Imposition.actionTab;
                    if (!at) return { error: 'ActionTab not loaded' };
                    return {
                        hasFuse: !!at.fuse,
                        searchTerm: at.searchTerm,
                        filteredCount: at.filteredPresets ? at.filteredPresets.length : -1,
                        filteredLabels: at.filteredPresets ? at.filteredPresets.map(p => p.label) : [],
                        isManagerMode: at.isManagerMode
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('=== ACTIONTAB STATE ===');
        console.log(JSON.stringify(stateResult.result.value, null, 2));

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\n💡 Make sure Symbol CEP panel is open in Adobe Illustrator.');
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
}

diagnose();
