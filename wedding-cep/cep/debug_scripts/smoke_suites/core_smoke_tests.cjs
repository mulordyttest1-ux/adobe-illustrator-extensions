function registerCoreSmokeTests(runner) {
    runner.addTest(
        'Shell labels render with readable Vietnamese text',
        `
            (function() {
                const reloadBtn = document.getElementById('btn-reload-panel');
                const settingsTab = document.querySelector('.ds-tab[data-tab="settings"]');

                return {
                    reloadTitle: reloadBtn ? reloadBtn.getAttribute('title') : null,
                    settingsLabel: settingsTab ? settingsTab.textContent.replace(/\\s+/g, ' ').trim() : null
                };
            })()
        `,
        async (result) => {
            if (result.reloadTitle !== 'Làm mới panel') {
                throw new Error(`Unexpected reload title: ${JSON.stringify(result)}`);
            }
            if (result.settingsLabel !== 'Cài đặt') {
                throw new Error(`Unexpected settings label: ${JSON.stringify(result)}`);
            }
            if ((result.reloadTitle + result.settingsLabel).includes('\u00C3')) {
                throw new Error(`Shell labels still contain mojibake markers: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'InputEngine Auto-Capitalize Mappings',
        `
            (function() {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const inputEngine = testApi && testApi.modules ? testApi.modules.inputEngine : null;
                if (!inputEngine) throw new Error('test API inputEngine not found');
                const result = inputEngine.process('nguyen van a', 'ten_chu_re');
                return result.value;
            })()
        `,
        async (result) => {
            if (result !== 'Nguyen Van A') {
                throw new Error(`Expected "Nguyen Van A", got "${result}"`);
            }
        }
    );

    runner.addTest(
        'Auto-Venue Checkbox Propagation',
        `
            (function() {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const builder = testApi && typeof testApi.getCompactBuilder === 'function'
                    ? testApi.getCompactBuilder()
                    : null;
                if (!builder) throw new Error('compactBuilder missing - UI not loaded');

                const pos1Addr = builder.refs['pos1.diachi'];
                const ceremonyAuto = builder.refs['ceremony.ten_auto'];
                const ceremonyTen = builder.refs['ceremony.ten'];
                const ceremonyDiachi = builder.refs['ceremony.diachi'];

                if (!pos1Addr || !ceremonyAuto || !ceremonyTen || !ceremonyDiachi) {
                    throw new Error('DOM nodes missing from refs');
                }

                pos1Addr.value = '123 Fake Street';
                pos1Addr.dispatchEvent(new Event('input', { bubbles: true }));

                ceremonyAuto.checked = true;
                ceremonyAuto.dispatchEvent(new Event('change', { bubbles: true }));

                return { ten: ceremonyTen.value, diachi: ceremonyDiachi.value };
            })()
        `,
        async (result) => {
            if (result.diachi !== '123 Fake Street' || !result.ten.includes('Tư Gia')) {
                throw new Error(`Expected diachi "123 Fake Street" and ten to include "Tư Gia", got "${result.ten} / ${result.diachi}"`);
            }
        }
    );
}

module.exports = { registerCoreSmokeTests };
