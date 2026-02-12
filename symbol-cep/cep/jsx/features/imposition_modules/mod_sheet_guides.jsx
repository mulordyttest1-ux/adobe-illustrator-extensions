/*
    📏 MODULE: SHEET GUIDES (Sheet-Level)
    ================================================================================
    📜 COMPLIANCE STANDARDS
    1. SRP: Single Responsibility - Only draw sheet-level margins
    2. Domain Separation: Sheet-level guides on artboard layer
    
    PROTOCOL: SHEET_GUIDE_DRAWER
    - Draws guides on Guides_Paper layer (artboard level)
    - Based on sheetInfo.margin
    - View-only, does not affect calculations
    ================================================================================
    
    Responsibility: Draw sheet margin guides on artboard.
    Interface: draw(doc, sheetInfo) → void
*/

(function () {
    // Constants
    var F = (typeof FIELD_IDS !== 'undefined') ? FIELD_IDS : {
        LAYER_GUIDES_PAPER: 'Guides_Paper (Artboard)',
        PREFIX_GUIDE: 'Guide_',
        SHEET_M_TOP: 'sheet_m_top',
        SHEET_M_BOT: 'sheet_m_bot',
        SHEET_M_LEFT: 'sheet_m_left',
        SHEET_M_RIGHT: 'sheet_m_right'
    };

    var Module = {
        id: "sheet_guides",
        version: "1.0.0",

        /**
         * Draw sheet margin guides
         * @param {Document} doc - Illustrator document
         * @param {Object} sheetInfo - Sheet geometry
         *   - sheetInfo.top, left, w, h
         *   - sheetInfo.margin: {top, bottom, left, right}
         */
        draw: function (doc, sheetInfo) {
            // Get or create guides layer
            var layerName = F.LAYER_GUIDES_PAPER;
            var layer;
            try {
                layer = doc.layers.getByName(layerName);
            } catch (e) {
                layer = doc.layers.add();
                layer.name = layerName;
            }

            // Get margin values
            var g = sheetInfo.gripper || sheetInfo.margin || {};
            var mt = (typeof g === 'object') ? (g.top || 0) : g;
            var mb = (typeof g === 'object') ? (g.bottom || 0) : g;
            var ml = (typeof g === 'object') ? (g.left || 0) : g;
            var mr = (typeof g === 'object') ? (g.right || 0) : g;

            // Sheet bounds
            var sTop = sheetInfo.top;
            var sLeft = sheetInfo.left;
            var sW = sheetInfo.w;
            var sH = sheetInfo.h;
            var sBot = sTop - sH;
            var sRight = sLeft + sW;

            // Draw margin guides
            if (mt > 0) {
                this.drawLine(layer, [sLeft, sTop - mt], [sRight, sTop - mt], F.PREFIX_GUIDE + F.SHEET_M_TOP);
            }
            if (mb > 0) {
                this.drawLine(layer, [sLeft, sBot + mb], [sRight, sBot + mb], F.PREFIX_GUIDE + F.SHEET_M_BOT);
            }
            if (ml > 0) {
                this.drawLine(layer, [sLeft + ml, sTop], [sLeft + ml, sBot], F.PREFIX_GUIDE + F.SHEET_M_LEFT);
            }
            if (mr > 0) {
                this.drawLine(layer, [sRight - mr, sTop], [sRight - mr, sBot], F.PREFIX_GUIDE + F.SHEET_M_RIGHT);
            }

            $.writeln("[SheetGuides] Drew margin guides");
        },

        /**
         * Draw single guide line
         * @param {Layer} layer
         * @param {Array} start - [x, y]
         * @param {Array} end - [x, y]
         * @param {String} name
         */
        drawLine: function (layer, start, end, name) {
            var p = layer.pathItems.add();
            p.setEntirePath([start, end]);
            p.name = name;
            p.filled = false;
            p.stroked = true;
            p.strokeWidth = 0.5;
            p.guides = true;
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("sheet_guides", Module);
    }
})();
