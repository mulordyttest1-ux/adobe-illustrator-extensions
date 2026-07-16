/*
    📐 MODULE: MARKS (Consistent Direction)
    ================================================================================
    Version: 2.3.0-CONSISTENT-DIR
    Description: 
    - Fix lỗi đối xứng gương của Mark Hybrid.
    - Quy ước chiều vẽ cố định:
      + Mark Ngang: Luôn từ TRÊN xuống DƯỚI (Top -> Bottom).
      + Mark Dọc: Luôn từ TRÁI sang PHẢI (Left -> Right).
    - Điều này đảm bảo phần Solid (đầu mark) luôn nằm cùng một phía khi cầm tờ in.
    ================================================================================
*/

(function () {
    var Module = {
        id: "marks",
        version: "2.3.0",

        process: function (doc, items, frame, sheetInfo) {
            // ... (Phần kiểm tra config, tạo layer, tính toán Grid giữ nguyên) ...
            var processing = sheetInfo.processingOptions || {};
            var opts = processing.marks || {};
            if (!opts.enabled) return { status: 'skipped' };

            $.writeln("[Marks] Generating Direction-Consistent Marks...");

            var layerName = "Marks_Trim";
            var layer;
            try { layer = doc.layers.getByName(layerName); } catch (e) { layer = doc.layers.add(); layer.name = layerName; }
            layer.locked = false; 

            var layoutConstraint = 0;
            var grid = ImpositionDomain.calculateNUpLayout(sheetInfo.rect, frame.finish, 1, { x: 0, y: 0 }, layoutConstraint);
            if (grid.length === 0) return { status: 'skipped' };

            var lenMm = opts.length || 5;
            var lenPt = lenMm * 2.834645;
            var weight = opts.weight || 0.5;
            var isHybrid = opts.hybrid;

            // --- HELPER VẼ LINE ---
            function drawLine(startPt, endPt) {
                var p = layer.pathItems.add();
                p.setEntirePath([startPt, endPt]);
                p.stroked = true; p.filled = false; p.strokeWidth = weight;
                var color = new CMYKColor(); color.cyan = 0; color.magenta = 0; color.yellow = 0; color.black = 100;
                p.strokeColor = color;

                if (isHybrid) {
                    // [Solid, Gap, Dash...] -> Phần Solid luôn ở điểm startPt
                    p.strokeDashes = [lenPt / 2, 2, 2, 2];
                } else {
                    p.strokeDashes = [];
                }
            }

            // --- XỬ LÝ TỌA ĐỘ (Giữ nguyên logic làm tròn và lọc biên của bạn) ---
            var distinctX = {};
            var distinctY = {};
            var halfW = frame.finish.w / 2;
            var halfH = frame.finish.h / 2;

            for(var i=0; i<grid.length; i++) {
                var left = grid[i].x - halfW; var right = grid[i].x + halfW;
                var top = grid[i].y + halfH; var bottom = grid[i].y - halfH;
                distinctX[left.toFixed(2)] = left; distinctX[right.toFixed(2)] = right;
                distinctY[top.toFixed(2)] = top; distinctY[bottom.toFixed(2)] = bottom;
            }

            var xValues = []; for (var k in distinctX) xValues.push(distinctX[k]); xValues.sort(function(a, b) { return a - b; });
            var yValues = []; for (var k in distinctY) yValues.push(distinctY[k]); yValues.sort(function(a, b) { return a - b; });

            if (xValues.length >= 2) { xValues.shift(); xValues.pop(); }
            if (yValues.length >= 2) { yValues.shift(); yValues.pop(); }

            // --- VẼ MARK (LOGIC ĐƯỢC SỬA ĐỔI) ---
            var sTop = sheetInfo.top;
            var sLeft = sheetInfo.left;
            var sRight = sLeft + sheetInfo.w;
            var sBot = sTop - sheetInfo.h;
            var offset = 1 * 2.834645;

            // A. Vẽ Mark tại các trục X (Dọc) - Quy ước: VẼ TỪ TRÊN XUỐNG DƯỚI
            for (var i = 0; i < xValues.length; i++) {
                var x = xValues[i];
                if (x > sLeft && x < sRight) {
                    // 1. Mark ở mép Trên:
                    // Start: Mép trên (Solid) -> End: Đi vào trong
                    drawLine([x, sTop - offset], [x, sTop - offset - lenPt]); 
                    
                    // 2. Mark ở mép Dưới:
                    // Start: Đi từ trong (Dash) -> End: Mép dưới (Solid)
                    // ⚠️ ĐẢO NGƯỢC ĐIỂM START/END để Solid nằm ở cuối (tức là ở mép dưới)
                    drawLine([x, sBot + offset + lenPt], [x, sBot + offset]);
                }
            }

            // B. Vẽ Mark tại các trục Y (Ngang) - Quy ước: VẼ TỪ TRÁI SANG PHẢI
            for (var j = 0; j < yValues.length; j++) {
                var y = yValues[j];
                if (y < sTop && y > sBot) {
                    // 3. Mark ở mép Trái:
                    // Start: Mép trái (Solid) -> End: Đi vào trong
                    drawLine([sLeft + offset, y], [sLeft + offset + lenPt, y]);

                    // 4. Mark ở mép Phải:
                    // Start: Đi từ trong (Dash) -> End: Mép phải (Solid)
                    // ⚠️ ĐẢO NGƯỢC ĐIỂM START/END để Solid nằm ở cuối (tức là ở mép phải)
                    drawLine([sRight - offset - lenPt, y], [sRight - offset, y]);
                }
            }

            return { status: 'success' };
        }
    };

    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("marks", Module);
    }
})();
