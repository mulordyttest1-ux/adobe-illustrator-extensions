/**
 * CDP test: Simulate typing and check search results.
 * Following §T4 Bug Regression from testing/SKILL.md
 */
const CDP = require('chrome-remote-interface');

async function testSearch() {
    let client;
    try {
        console.log('🔌 Connecting to Symbol CEP (Port 9098)...');
        client = await CDP({ port: 9098, host: 'localhost' });
        const { Runtime } = client;
        await Runtime.enable();
        console.log('✅ Connected!\n');

        // Step 1: Simulate typing "a52 khong ky"
        await Runtime.evaluate({
            expression: `
                var input = document.getElementById('action-search');
                input.value = 'a52 khong ky';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            `
        });

        // Wait 300ms for render
        await new Promise(r => setTimeout(r, 300));

        // Step 2: Read results
        const result = await Runtime.evaluate({
            expression: `
                (function() {
                    var at = window.Imposition.actionTab;
                    var items = document.querySelectorAll('.dropdown-item');
                    var texts = [];
                    for (var i = 0; i < items.length; i++) texts.push(items[i].textContent.trim());
                    return JSON.stringify({
                        searchTerm: at.searchTerm,
                        hasFuse: !!at.fuse,
                        filteredCount: at.filteredPresets.length,
                        filteredLabels: at.filteredPresets.map(function(p) { return p.label; }),
                        domItemCount: items.length,
                        domItemsText: texts,
                        noResultMsg: document.getElementById('action-list') ? document.getElementById('action-list').textContent.trim() : ''
                    });
                })()
            `
        });

        console.log("Raw Eval Result:", JSON.stringify(result));
        const data = JSON.parse(result.result.value);
        console.log('=== SEARCH SIMULATION: "a52 khong ky" ===');
        console.log('searchTerm:', data.searchTerm);
        console.log('hasFuse:', data.hasFuse);
        console.log('filteredCount:', data.filteredCount);
        console.log('filteredLabels:', data.filteredLabels);
        console.log('DOM item count:', data.domItemCount);
        console.log('DOM items:', data.domItemsText);
        if (data.noResultMsg && data.domItemCount === 0) {
            console.log('❌ NO RESULTS MSG:', data.noResultMsg);
        }

        // Test verdict
        if (data.filteredCount > 0 && data.filteredLabels.some(l => l.includes('a52 khong ky'))) {
            console.log('\n✅ TEST PASSED: "a52 khong ky" found in search results');
        } else {
            console.log('\n❌ TEST FAILED: "a52 khong ky" NOT found in search results');
        }

        // Step 3: Also test with partial terms
        const partials = ['a52', 'khong', 'a52 khong'];
        for (const term of partials) {
            await Runtime.evaluate({
                expression: `
                    var input = document.getElementById('action-search');
                    input.value = '${term}';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                `
            });
            await new Promise(r => setTimeout(r, 200));
            const pr = await Runtime.evaluate({
                expression: `
                    (function() {
                        var at = window.Imposition.actionTab;
                        return JSON.stringify({
                            count: at.filteredPresets.length,
                            labels: at.filteredPresets.map(function(p) { return p.label; })
                        });
                    })()
                `
            });
            const pd = JSON.parse(pr.result.value);
            console.log(`\nQuery "${term}": ${pd.count} results → [${pd.labels.join(', ')}]`);
        }

        // Step 4: Reset search
        await Runtime.evaluate({
            expression: `
                var input = document.getElementById('action-search');
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            `
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        if (client) await client.close();
    }
}

testSearch();
