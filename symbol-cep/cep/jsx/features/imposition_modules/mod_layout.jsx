/*
    📐 MODULE: LAYOUT (Sheet-Level)
    ================================================================================
    📜 COMPLIANCE STANDARDS (Required Reading)
    1. Domain Separation: [.agent/domain_separation_standard.md]
    2. Architecture:      [.agent/plans/modular_architecture_risk_and_roadmap.md]
    
    PROTOCOL: SATELLITE_MODULE
    - Input: sheetCtx (Rectangle + Gripper)
    - Input: finishDim (Dimensions ONLY)
    ================================================================================
    
    🏛️ ARCHITECTURE: SHEET vs YIELD
    ================================================================================
    This module handles SHEET-LEVEL (Paper) concerns. Key distinctions:
    
    | Aspect         | SHEET (mod_layout.jsx)         | YIELD (mod_symbol.jsx)         |
    | -------------- | ----------------------------- | ----------------------------- |
    | Purpose        | Visual Reference (View Only)  | Functional (Resize/Clip)      |
    | Data Source    | `sec_sheet_layout` in schema  | `sec_margins` in schema       |
    | Output         | Guides on Layer               | Guides inside Group (Symbol)  |
    | Layer          | `Guides_Paper (Artboard)`     | Inside `Container_*` group    |
    | Affects Calc   | NO (View Only)                | YES (Yield Padding/Margins)   |
    
    🔄 DRY NAMING CONVENTION:
    - Sheet Margins draw guides named: `Guide_sheet_m_[edge]` (e.g., `Guide_sheet_m_top`)
    - Yield Margins draw guides named: `Guide_[field_id]` (e.g., `Guide_safe_top`)
    - Both follow the same `PREFIX_GUIDE + field_id` pattern from `FIELD_IDS`.
    - UI/Platform naming is synchronized: Adding a field auto-generates its guide.
    ================================================================================
    
    Responsibility: Calculate N-Up Grid, Draw Sheet Guides (View Only), Determine Sheet Geometry.
*/

(function () {
    var Module = {
        id: "layout",
        version: "3.0.0-SDSS",

        getSheetGeometry: function (doc) {
            var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
            var r = ab.artboardRect;
            return { rect: r, w: r[2] - r[0], h: r[1] - r[3], left: r[0], top: r[1] };
        },

        setupSheet: function (doc, w_pt, h_pt) {
            var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
            var r = ab.artboardRect;
            var newR = r[0] + w_pt;
            var newB = r[1] - h_pt;
            ab.artboardRect = [r[0], r[1], newR, newB];
            return { rect: [r[0], r[1], newR, newB], w: w_pt, h: h_pt, left: r[0], top: r[1] };
        },

        /* --- FILE: mod_layout.jsx --- */

        // --- TRONG FILE: mod_layout.jsx ---
        process: function (doc, items, frame, sheetInfo, useSymbol) {
            $.writeln("[Layout] Calculating Grid...");

            // 1. DATA FOR VISUALS
            var visualGripper = sheetInfo.gripper || sheetInfo.margin || 0;

            // 2. DATA FOR CALCULATION
            var layoutConstraint = 0;

            // 3. Lấy cấu hình Head-to-Head (Đã sửa ở bước trước)

            var rawOpt = sheetInfo.rawValues && sheetInfo.rawValues.opt_layout_head_to_head;
            var isHeadToHead = (rawOpt === true || rawOpt === 'on' || rawOpt === 'true');

            var layout = ImpositionDomain.calculateNUpLayout(
                sheetInfo.rect,
                frame.finish,
                items.length,
                { x: 0, y: 0 },
                layoutConstraint,
                isHeadToHead // Truyền giá trị Boolean đã chuẩn hóa
            );

            if (layout.length === 0) {
                $.writeln("[Layout] Failed: 0 positions available.");
                return { status: 'error', message: "Không đủ chỗ trên khổ giấy để xếp." };
            }

            $.writeln("[Layout] Grid found: " + layout.length + " slots.");

            var placementLayer = doc.activeLayer;
            var firstPos = null;
            var placedItems = []; // NEW: Track actual placed instances

            for (var k = 0; k < layout.length; k++) {
                var point = layout[k];
                if (k === 0) firstPos = point;

                var idx = point.variantIndex;
                // Kiểm tra an toàn: Nếu index tào lao thì quay về 0
                if (typeof idx === 'undefined' || idx < 0 || idx >= items.length) {
                    idx = 0;
                }
                var sourceItem = items[idx]; var instance;

                if (useSymbol) {
                    instance = placementLayer.symbolItems.add(sourceItem);
                } else {
                    instance = sourceItem.duplicate(placementLayer, ElementPlacement.PLACEATEND);
                }

                var b = instance.visibleBounds;
                var w = b[2] - b[0];
                var h = b[1] - b[3];

                // Đặt vị trí
                instance.position = [point.x - (w / 2), point.y + (h / 2)];

                // --- XOAY ĐỐI TƯỢNG (HEAD-TO-HEAD) ---
                // Đây là đoạn code giúp hàng chẵn quay đầu 180 độ
                if (point.rotation && point.rotation !== 0) {
                    instance.rotate(point.rotation);
                }

                placedItems.push(instance); // NEW: Track placed instance
            }

            // --- KHÔNG CÒN ĐOẠN CODE DUPLICATE Ở ĐÂY NỮA ---

            // Draw Guides Logic
            // (Logic vẽ guide sheet giữ nguyên...)
            var absLeft = firstPos.x - (frame.finish.w / 2);
            var absTop = firstPos.y + (frame.finish.h / 2);

            frame.finish.left = absLeft;
            frame.finish.top = absTop;

            this.drawGuides(doc, frame, {
                gripper: visualGripper,
                top: sheetInfo.top,
                left: sheetInfo.left,
                w: sheetInfo.w,
                h: sheetInfo.h
            });

            return { status: 'success', placedItems: placedItems }; // NEW: Return placed items
        },

        /**
         * Draw sheet guides - DELEGATE TO MOD_SHEET_GUIDES (SRP Refactor)
         */
        drawGuides: function (doc, frame, sheetInfo) {
            if ($._imposition.modules && $._imposition.modules.sheet_guides) {
                $._imposition.modules.sheet_guides.draw(doc, sheetInfo);
            }
        },

        /**
         * Calculate anchor point for 9-direction alignment
         * IMPORTANT: Uses RAW artboard bounds, NOT affected by sheet margins.
         * Sheet margins are VISUAL ONLY (for print operators to check overflow).
         * 
         * @param {Object} sheetInfo - Sheet geometry (artboard bounds)
         * @param {Object} finishSize - {w, h} in pt
         * @param {String} alignPos - tl, tc, tr, ml, mc, mr, bl, bc, br
         * @returns {Object} {x, y} - TOP-LEFT corner position for item placement
         */
        getAnchorPoint: function (sheetInfo, finishSize, alignPos) {
            // Use RAW artboard bounds - NO margin subtraction!
            // Sheet margins (sm) are ONLY for visual guides, not for placement calculation
            var areaLeft = sheetInfo.left;
            var areaRight = sheetInfo.left + sheetInfo.w;
            var areaTop = sheetInfo.top;
            var areaBottom = sheetInfo.top - sheetInfo.h;

            var areaW = areaRight - areaLeft;
            var areaH = areaTop - areaBottom;

            // Item dimensions
            var itemW = finishSize.w;
            var itemH = finishSize.h;

            // Calculate TOP-LEFT position based on alignment
            var x, y;

            // Horizontal alignment
            if (alignPos.charAt(1) === 'l') {
                x = areaLeft;                    // Artboard left edge
            } else if (alignPos.charAt(1) === 'r') {
                x = areaRight - itemW;           // Artboard right edge - item width
            } else {
                x = areaLeft + (areaW - itemW) / 2;  // Center
            }

            // Vertical alignment (Y is TOP-LEFT, positive up in Illustrator)
            if (alignPos.charAt(0) === 't') {
                y = areaTop;                     // Artboard top edge
            } else if (alignPos.charAt(0) === 'b') {
                y = areaBottom + itemH;          // Artboard bottom edge + item height
            } else {
                y = areaBottom + itemH + (areaH - itemH) / 2;  // Middle
            }

            $.writeln("[Anchor] Artboard bounds (RAW, no margins): L=" + areaLeft.toFixed(1) +
                " R=" + areaRight.toFixed(1) + " T=" + areaTop.toFixed(1) + " B=" + areaBottom.toFixed(1));
            $.writeln("[Anchor] Item: W=" + itemW.toFixed(1) + " H=" + itemH.toFixed(1));
            $.writeln("[Anchor] Result: x=" + x.toFixed(1) + " y=" + y.toFixed(1));

            return { x: x, y: y };
        },

        /**
         * Place single item at specified alignment position (no N-Up grid)
         * @param {Document} doc
         * @param {Array} items - Yield items (typically 1)
         * @param {Object} frame - Frame spec with finish.w, finish.h
         * @param {Object} sheetInfo - Sheet geometry with margin, rawValues
         * @param {Boolean} useSymbol
         * @returns {Object} {status, placedItems}
         */
        placeSingle: function (doc, items, frame, sheetInfo, useSymbol) {
            if (items.length === 0) {
                return { status: 'error', message: 'No items to place.' };
            }

            var raw = sheetInfo.rawValues || {};
            var alignPos = raw.align_position || 'tl';

            // Check if rotation is enabled
            var hasRotation = (raw.opt_custom_rotate === true || raw.opt_custom_rotate === 'on' || raw.opt_custom_rotate === 'true');
            var rotationAngle = parseFloat(raw.custom_rotate_angle) || 0;

            $.writeln("[Layout] Single placement mode. Align: " + alignPos);
            $.writeln("[Layout] Rotation: " + (hasRotation ? rotationAngle + "°" : "none"));

            var placementLayer = doc.activeLayer;
            var placedItems = [];

            for (var i = 0; i < items.length; i++) {
                var sourceItem = items[i];
                var instance;

                if (useSymbol) {
                    // Symbol mode: Create SymbolItem instance from Symbol definition
                    instance = placementLayer.symbolItems.add(sourceItem);
                } else {
                    // Group mode: MOVE the existing group (don't duplicate!)
                    instance = sourceItem;
                    instance.move(placementLayer, ElementPlacement.PLACEATEND);
                }

                // ROTATE FIRST (before calculating position)
                // This way, visibleBounds will reflect rotated dimensions
                if (hasRotation && rotationAngle !== 0) {
                    $.writeln("[Layout] Rotating item by " + rotationAngle + "° before positioning...");
                    instance.rotate(rotationAngle);
                }

                // Now get bounds AFTER rotation
                var b = instance.visibleBounds;
                var itemW = b[2] - b[0];
                var itemH = b[1] - b[3];

                $.writeln("[Layout] Rotated item dimensions: " + (itemW / 2.834645).toFixed(1) + " x " + (itemH / 2.834645).toFixed(1) + " mm");

                // Calculate anchor using ROTATED dimensions
                var anchor = this.getAnchorPoint(sheetInfo, { w: itemW, h: itemH }, alignPos);
                $.writeln("[Layout] Anchor point: x=" + anchor.x.toFixed(2) + ", y=" + anchor.y.toFixed(2));

                // Position item's TOP-LEFT corner at anchor
                instance.position = [anchor.x, anchor.y];

                placedItems.push(instance);
            }

            // MANDATORY: Draw Sheet Guides (for print operators)
            var visualGripper = sheetInfo.gripper || sheetInfo.margin || 0;
            this.drawGuides(doc, frame, {
                gripper: visualGripper,
                top: sheetInfo.top,
                left: sheetInfo.left,
                w: sheetInfo.w,
                h: sheetInfo.h
            });

            return { status: 'success', placedItems: placedItems, rotated: hasRotation };
        }
    };

    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("layout", Module);
    }
})();