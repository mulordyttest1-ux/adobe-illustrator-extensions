const CDP = require('chrome-remote-interface');

async function testLiveAI() {
    let client;
    try {
        console.log("🔌 Connecting to Wedding CEP (Port 9097)...");
        client = await CDP({ port: 9097, host: '127.0.0.1' });

        console.log("🔄 Ép trình duyệt CEP Reload (xóa Cache)...");
        await client.Runtime.evaluate({ expression: 'location.reload(true)' });
        await client.close();
        await new Promise(r => setTimeout(r, 2000));

        console.log("🔌 Kết nối lại...");
        client = await CDP({ port: 9097, host: '127.0.0.1' });
        const { Runtime } = client;
        await Runtime.enable();

        console.log("🔍 Chạy hàm SchemaInjector.computeChanges trong V8 của CEP...");
        const evalRes = await Runtime.evaluate({
            expression: `
                (function() {
                    if (typeof window.SchemaInjector === 'undefined') return "LỖI: SchemaInjector chưa được expose ra window!";
                    
                    const testCases = [
                        "(NHẰM NGÀY 18 THÁNG 09 NĂM ẤT TỴ)",
                        "Ngày 20 tháng 10 năm 2024"
                    ];
                    
                    const frames = testCases.map((txt, idx) => ({ id: idx+1, text: txt }));
                    const changes = window.SchemaInjector.computeChanges(frames, 'tiec');
                    
                    return JSON.stringify(changes, null, 2);
                })()
            `
        });

        console.log("\n====================\nKẾT QUẢ TỪ V8 CEP:\n" + evalRes.result.value + "\n====================");

    } catch (err) {
        console.error("Lỗi:", err);
    } finally {
        if (client) await client.close();
    }
}
testLiveAI();
