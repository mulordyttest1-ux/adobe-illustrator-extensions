const { E2ERunner } = require('./shared/testing/E2ERunner.cjs');

const runner = new E2ERunner({ port: 9097, projectName: 'Wedding CEP Debug' });

runner.addTest(
    'Debug POS1 Console Error',
    `
        (async function() {
            // Trap console.error and window.onerror
            const oldError = console.error;
            const trappedErrors = [];
            console.error = function(...args) {
                trappedErrors.push(args.map(a => String(a)).join(' '));
                oldError.apply(console, args);
            };
            
            window.onerror = function(msg, url, line, col, error) {
                trappedErrors.push(msg);
            };

            try {
                if (!window.compactBuilder) return 'No compactBuilder';
                
                const pos1ta = window.compactBuilder.refs['pos1.diachi'];
                if (!pos1ta) return 'pos1.diachi not found';

                pos1ta.focus();
                pos1ta.value = "dlie ya";
                pos1ta.dispatchEvent(new Event('input', { bubbles: true }));
                
                // wait for debounce (300ms) + slightly longer
                await new Promise(r => setTimeout(r, 800));
                
                const listHtml = document.querySelector('.autocomplete-list');
                
                // restore
                console.error = oldError;
                
                return JSON.stringify({
                    list_rendered: !!listHtml,
                    errors: trappedErrors
                });
            } catch(e) {
                console.error = oldError;
                return 'ERROR: ' + e.message;
            }
        })()
    `,
    async (res) => {
        console.log("TEST RESULT:", res);
    }
);

runner.run();
