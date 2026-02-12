/*
    📏 MODULE: YIELD GUIDES (Yield-Level)
    ================================================================================
    📜 COMPLIANCE STANDARDS
    1. SRP: Single Responsibility - Only draw guides inside yield container
    2. Domain Separation: [.agent/domain_separation_standard.md]
    
    PROTOCOL: GUIDE_DRAWER
    - Draws guides inside the yield container (not on artboard)
    - Based on frame.rules and yieldPadding
    - Can also draw visible borders
    ================================================================================
    
    Responsibility: Draw guides and borders inside yield container.
    Interface: draw(container, frame) → void
*/

(function () {
    // Constants
    var PREFIX_GUIDE = 'Guide_';
    var GUIDE_SAFE_ZONE = 'Guide_Safe_Zone';

    var Module = {
        id: "yield_guides",
        version: "1.0.0",

        /**
         * Draw yield guides inside container
         * @param {GroupItem} container - Yield container group
         * @param {Object} frame - Frame spec
         *   - frame.finish: {w, h}
         *   - frame.print: {w, h} - Safe zone dimensions
         *   - frame.yieldPadding: {top, left, right, bottom}
         *   - frame.rules: [{id, edge, val, drawBorder, borderStyle}]
         */
        draw: function (container, frame) {
            var fW = frame.finish.w;
            var fH = frame.finish.h;

            // Calculate margin offsets (mm to pt)
            var m = frame.yieldPadding || { top: 0, left: 0, right: 0, bottom: 0 };
            var mTop = (m.top || 0) * 2.834645;
            var mLeft = (m.left || 0) * 2.834645;

            // A. Draw Safe Zone Guide (Aggregate Result)
            var gTop = (fH / 2) - mTop;
            var gLeft = (-fW / 2) + mLeft;

            var guideSafe = container.pathItems.rectangle(gTop, gLeft, frame.print.w, frame.print.h);
            guideSafe.name = GUIDE_SAFE_ZONE;
            guideSafe.filled = false;
            guideSafe.stroked = true;
            guideSafe.guides = true;
            guideSafe.move(container, ElementPlacement.PLACEATEND);

            // B. Draw Individual Rule Guides + Optional Borders
            this.drawRuleGuides(container, frame);

            $.writeln("[YieldGuides] Drew guides for container: " + container.name);
        },

        /**
         * Draw individual rule guides based on frame.rules
         * @param {GroupItem} container
         * @param {Object} frame
         */
        drawRuleGuides: function (container, frame) {
            if (!frame.rules || frame.rules.length === 0) return;

            var fW = frame.finish.w;
            var fH = frame.finish.h;

            for (var i = 0; i < frame.rules.length; i++) {
                var r = frame.rules[i];
                if (r.val > 0) {
                    var valPt = r.val * 2.834645;
                    var pathCoords = null;

                    // Calculate path based on edge
                    if (r.edge === 'top') {
                        var y = (fH / 2) - valPt;
                        pathCoords = [[-fW / 2, y], [fW / 2, y]];
                    } else if (r.edge === 'bottom') {
                        var y = (-fH / 2) + valPt;
                        pathCoords = [[-fW / 2, y], [fW / 2, y]];
                    } else if (r.edge === 'left') {
                        var x = (-fW / 2) + valPt;
                        pathCoords = [[x, fH / 2], [x, -fH / 2]];
                    } else if (r.edge === 'right') {
                        var x = (fW / 2) - valPt;
                        pathCoords = [[x, fH / 2], [x, -fH / 2]];
                    }

                    if (pathCoords) {
                        // Draw Guide
                        var line = container.pathItems.add();
                        line.setEntirePath(pathCoords);
                        line.name = PREFIX_GUIDE + (r.id || r.type);
                        line.filled = false;
                        line.stroked = true;
                        line.guides = true;
                        line.move(container, ElementPlacement.PLACEATEND);

                        // Draw Visible Border if requested
                        if (r.drawBorder) {
                            this.drawBorder(container, pathCoords, r);
                        }
                    }
                }
            }
        },

        /**
         * Draw visible border line
         * @param {GroupItem} container
         * @param {Array} pathCoords
         * @param {Object} rule
         */
        drawBorder: function (container, pathCoords, rule) {
            var border = container.pathItems.add();
            border.setEntirePath(pathCoords);
            border.name = "Border_" + (rule.id || rule.type);
            border.filled = false;
            border.stroked = true;
            border.guides = false; // NOT a guide, visible stroke
            border.strokeWidth = 0.5;

            // Style
            if (rule.borderStyle === 'dashed') {
                border.strokeDashes = [3, 2];
            }

            // K100 Color
            var black = new CMYKColor();
            black.cyan = 0;
            black.magenta = 0;
            black.yellow = 0;
            black.black = 100;
            border.strokeColor = black;

            border.move(container, ElementPlacement.PLACEATEND);
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("yield_guides", Module);
    }
})();
