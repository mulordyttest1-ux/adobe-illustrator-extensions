/*
    📐 MODULE: RESIZE (Pure Geometry)
    ================================================================================
    📜 COMPLIANCE STANDARDS (Required Reading)
    1. Domain Separation: [.agent/domain_separation_standard.md]
    2. SRP:               Single Responsibility Principle
    
    PROTOCOL: GEOMETRY_PROCESSOR
    - Single job: Resize content to fit within frame
    - No side effects on document structure
    - No guide creation
    ================================================================================
    
    Responsibility: Resize content to fit within print/safe zone.
    Interface: fitToSafe(item, frame) -> void (mutates item in place)
*/

(function () {
    var Module = {
        id: "resize",
        version: "1.0.0",

        /**
         * Fit item to safe zone (print area within frame)
         * @param {PageItem} item - Item to resize (mutated in place)
         * @param {Object} frame - Frame spec from ImpositionDomain
         *   - frame.finish: {w, h} - Full dimensions
         *   - frame.print: {w, h} - Printable area
         *   - frame.isAutoSize: boolean - If true, skip resize
         *   - frame.resizeMode: 'preserve'|'fill'
         *   - frame.yieldPadding: {top, left, right, bottom} - mm values
         * @returns {Object} {success, bounds} - Result with final bounds
         */
        fitToSafe: function (item, frame) {
            // Skip if auto-size mode
            if (frame.isAutoSize) {
                $.writeln("[Resize] Skipped: Auto-size mode");
                return { success: true, skipped: true };
            }

            var printW = frame.print.w;
            var printH = frame.print.h;

            // Get current bounds
            var b = item.visibleBounds; // [L, T, R, B]
            var itemW = b[2] - b[0];
            var itemH = b[1] - b[3];

            if (itemW <= 0 || itemH <= 0) {
                $.writeln("[Resize] Skipped: Invalid item dimensions");
                return { success: false, message: "Invalid item dimensions" };
            }

            var resizeMode = frame.resizeMode || 'preserve';
            $.writeln("[Resize] Mode: " + resizeMode + ", Target: " +
                Math.round(printW / 2.834645) + "x" + Math.round(printH / 2.834645) + "mm");

            if (resizeMode === 'fill') {
                // FILL: Stretch to fit exactly (non-uniform scaling)
                // "Accept distortion" mode
                var ratioW = printW / itemW;
                var ratioH = printH / itemH;
                item.resize(ratioW * 100, ratioH * 100, true, true, true, true, 100, Transformation.CENTER);
            } else {
                // PRESERVE: Fit inside (uniform scaling, letterbox)
                var ratio = Math.min(printW / itemW, printH / itemH);
                var pct = ratio * 100;
                item.resize(pct, pct, true, true, true, true, pct, Transformation.CENTER);
            }

            $.writeln("[Resize] Resized successfully");
            return {
                success: true,
                bounds: item.visibleBounds
            };
        },

        /**
         * Center item within safe zone
         * @param {PageItem} item - Item to position
         * @param {Object} frame - Frame spec (finish, print, yieldPadding)
         */
        centerInSafeZone: function (item, frame) {
            var fW = frame.finish.w;
            var fH = frame.finish.h;
            var printW = frame.print.w;
            var printH = frame.print.h;

            // Calculate margin offsets (mm to pt)
            var m = frame.yieldPadding || { top: 0, left: 0, right: 0, bottom: 0 };
            var mTop = (m.top || 0) * 2.834645;
            var mLeft = (m.left || 0) * 2.834645;

            // Safe zone position (relative to origin-centered container)
            var targetTop = (fH / 2) - mTop;
            var targetLeft = (-fW / 2) + mLeft;

            var safeZoneCenterX = targetLeft + (printW / 2);
            var safeZoneCenterY = targetTop - (printH / 2);

            // Current item center
            var currB = item.visibleBounds;
            var currW = currB[2] - currB[0];
            var currH = currB[1] - currB[3];
            var currCenterX = currB[0] + (currW / 2);
            var currCenterY = currB[1] - (currH / 2);

            // Move to safe zone center
            item.translate(safeZoneCenterX - currCenterX, safeZoneCenterY - currCenterY);

            $.writeln("[Resize] Centered in safe zone");
        },

        /**
         * Combined: Resize AND center
         * @param {PageItem} item - Item to process
         * @param {Object} frame - Frame spec
         * @returns {Object} Result
         */
        run: function (item, frame) {
            var resizeResult = this.fitToSafe(item, frame);

            if (resizeResult.success && !resizeResult.skipped) {
                this.centerInSafeZone(item, frame);
            }

            return resizeResult;
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("resize", Module);
    }
})();
