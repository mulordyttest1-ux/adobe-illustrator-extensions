const CDP = require('chrome-remote-interface');

async function debug() {
    try {
        const client = await CDP({ port: 8097 });
        const { Runtime } = client;

        await Runtime.enable();

        // Let's ask the page some questions!
        const result1 = await Runtime.evaluate({ expression: 'document.readyState' });
        console.log("ReadyState:", result1.result.value);

        const result2 = await Runtime.evaluate({ expression: 'typeof bridge' });
        console.log("type of bridge:", result2.result.value);

        const result3 = await Runtime.evaluate({ expression: 'typeof window.__adobe_cep__' });
        console.log("type of window.__adobe_cep__:", result3.result.value);

        const result4 = await Runtime.evaluate({
            expression: `document.getElementById('splash-screen') ? document.getElementById('splash-screen').style.display : 'no splash'`
        });
        console.log("Splash Display:", result4.result.value);

        const result5 = await Runtime.evaluate({
            expression: `document.getElementById('ds-app-error') ? document.getElementById('ds-app-error').innerText : 'no error'`
        });
        console.log("Error Display Text:", result5.result.value);

        await client.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

debug();
