const CDP = require('chrome-remote-interface');

async function main() {
    let client;
    try {
        console.log("🔌 Connecting to Symbol CEP (Port 9098)...");
        client = await CDP({ host: 'localhost', port: 9098 });
        const { Runtime } = client;

        await Runtime.enable();

        console.log("✅ CONNECTED!");
        console.log("👉 VUI LÒNG BẤM LẠI NÚT 'a52 ky' TRONG PANEL NGAY BÂY GIỜ! 👈");
        console.log("Đang lắng nghe Console Logs... (Bấm Ctrl+C để thoát)\\n");

        Runtime.consoleAPICalled((params) => {
            const type = params.type;
            if (type !== 'info') { // ignore trivial infos for cleaner output
                const args = params.args.map(a => a.value || a.description || '').join(' ');
                console.log(`[CEP ${type.toUpperCase()}] ${args}`);
            }
        });

        // Override window.alert to prevent blocking UI and truncation
        await Runtime.evaluate({
            expression: `
                window.alert = function(msg) {
                    console.error(">>> ALERT INTERCEPTED FULL MESSAGE <<<\\n" + msg);
                };
            `
        });

        // Keep alive indefinitely
        await new Promise(() => { });

    } catch (err) {
        console.error("CDP Error:", err.message);
    }
}

main();
