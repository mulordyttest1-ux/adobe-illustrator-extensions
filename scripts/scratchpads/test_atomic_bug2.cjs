const CDP = require('chrome-remote-interface');

async function testILST2() {
    try {
        const client = await CDP({ port: 9097 });
        const { Runtime } = client;

        const script = `
        var doc = app.activeDocument;
        var item = doc.textFrames.add();
        item.contents = "VÀO LÚC : 11 GIỜ 00 - Thứ Tư\\n10 . 01 . 2026\\n(Nhằm ngày 22 tháng 11 năm Mậu Thân)";
        
        var reps = [
            { "start": 71, "end": 79, "val": "{date.tiec.nam_al}" },
            { "start": 64, "end": 66, "val": "{date.tiec.thang_al}" },
            { "start": 55, "end": 57, "val": "{date.tiec.ngay_al}" },
            { "start": 39, "end": 43, "val": "{date.tiec.nam}" },
            { "start": 34, "end": 36, "val": "{date.tiec.thang}" },
            { "start": 29, "end": 31, "val": "{date.tiec.ngay}" },
            { "start": 22, "end": 28, "val": "{date.tiec.thu}" },
            { "start": 17, "end": 19, "val": "{date.tiec.phut}" },
            { "start": 10, "end": 12, "val": "{date.tiec.gio}" }
        ];
        
        reps.sort(function (a, b) { return b.start - a.start; });
        var chars = item.characters;

        for (var k = 0; k < reps.length; k++) {
            var r = reps[k];
            var val = String(r.val).replace(/\\n/g, "\\r");

            if (r.end > r.start + 1) {
                for (var d = r.end - 1; d > r.start; d--) {
                    if (d < chars.length) chars[d].remove();
                }
            }

            if (r.start < chars.length) {
                if (val === "") chars[r.start].remove();
                else chars[r.start].contents = val;
            } else {
                item.contents += val;
            }
        }
        item.contents.replace(/\\r/g, '\\n');
        `;

        const { result } = await Runtime.evaluate({
            expression: `window.bridge.cs.evalScript(${JSON.stringify(script)}, function(r){ window.TEST_RES2 = r; })`
        });

        await new Promise(r => setTimeout(r, 1000));

        const { result: actual } = await Runtime.evaluate({ expression: 'window.TEST_RES2' });
        console.log("ACTUAL ILST RESULT: \n" + actual.value);
        await client.close();
    } catch (err) {
        console.error(err);
    }
}
testILST2();
