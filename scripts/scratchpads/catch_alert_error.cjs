const CDP = require('chrome-remote-interface');

async function main() {
    let client;
    try {
        console.log("Connecting to port 9098...");
        client = await CDP({ port: 9098 });
        const { Runtime } = client;

        await Runtime.enable();

        console.log("Listening for logs...");
        Runtime.consoleAPICalled((params) => {
            const type = params.type;
            const args = params.args.map(a => a.value || a.description || '').join(' ');
            console.log(`[CEP CONSOLE ${type.toUpperCase()}] ${args}`);
        });

        console.log("Simulating click on preset...");
        await Runtime.evaluate({
            expression: `
                (function() {
                    // Try to catch window.alert
                    window.alert = function(msg) {
                        console.error("INTERCEPTED ALERT:\\n", msg);
                    };
                    
                    var btns = Array.from(document.querySelectorAll('.manager-run-btn'));
                    var target = btns.find(b => b.textContent.toLowerCase().includes('a5') || b.textContent.toLowerCase().includes('ky'));
                    if(target) {
                        console.log('Automated Click on: ' + target.textContent.trim());
                        target.click();
                        return true;
                    }
                    console.error('Button not found');
                    return false;
                })()
            `,
            returnByValue: true
        });

        // wait 3 seconds to collect logs
        await new Promise(r => setTimeout(r, 4000));

    } catch (err) {
        console.error("Error connecting CDP:", err.message);
        console.log("Make sure Illustrator is open and the Symbol CEP panel is focused.");
    } finally {
        if (client) {
            await client.close();
        }
    }
}

main();
