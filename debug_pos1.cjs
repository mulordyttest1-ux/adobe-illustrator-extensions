const { E2ERunner } = require('./shared/testing/E2ERunner.cjs');

const runner = new E2ERunner({ port: 9097, projectName: 'Wedding CEP Debug' });

runner.addTest(
    'Debug POS1 Diachi Active Element',
    `
        (async function() {
            try {
                if (!window.compactBuilder) return 'No compactBuilder';
                
                const pos1ta = window.compactBuilder.refs['pos1.diachi'];
                const pos2ta = window.compactBuilder.refs['pos2.diachi'];

                if (!pos1ta) return 'pos1.diachi not found in refs';

                // Simulate focus and input
                pos1ta.focus();
                pos1ta.value = "dlie ya";
                pos1ta.dispatchEvent(new Event('input', { bubbles: true }));
                
                await new Promise(r => setTimeout(r, 500));
                
                const listHtml = document.querySelector('.autocomplete-list');
                
                return JSON.stringify({
                    pos1_html: pos1ta.outerHTML,
                    pos2_html: pos2ta.outerHTML,
                    pos1_disabled: pos1ta.disabled,
                    pos1_readonly: pos1ta.readOnly,
                    list_rendered: !!listHtml
                });
            } catch(e) {
                return 'ERROR: ' + e.message;
            }
        })()
    `,
    async (res) => {
        console.log("TEST RESULT:", res);
    }
);
runner.run();
