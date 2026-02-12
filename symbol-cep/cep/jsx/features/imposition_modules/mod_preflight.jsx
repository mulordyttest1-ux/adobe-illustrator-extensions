/*
    ✅ MODULE: PREFLIGHT
    ================================================================================
    📜 COMPLIANCE STANDARDS
    1. SRP: Single Responsibility - Extract metadata from selection
    2. KISS: Keep It Simple - Pure bounds calculation
    
    PROTOCOL: PREFLIGHT
    - Validates selection exists
    - Calculates aggregate visible bounds
    - Returns dimensions in points
    ================================================================================
    
    Responsibility: Extract bounds metadata from Illustrator selection.
    Interface: getSelectionBounds(selection) → {w, h, count}
    
    Community Best Practice: Use visibleBounds (includes stroke + effects)
    Source: Adobe ExtendScript docs, Stack Overflow
*/

(function () {
    var Module = {
        id: "preflight",
        version: "1.0.0",

        /**
         * Get aggregate visible bounds from selection
         * Uses visibleBounds (includes stroke, effects) - industry standard for print
         * 
         * @param {Array} selection - app.activeDocument.selection
         * @returns {Object} {w, h, count, error?}
         *   - w: width in points
         *   - h: height in points
         *   - count: number of selected items
         *   - error: error message if failed
         */
        getSelectionBounds: function (selection) {
            // Validate selection
            if (!selection || selection.length === 0) {
                $.writeln("[Preflight] No selection");
                return { w: 0, h: 0, count: 0, error: "No selection" };
            }

            try {
                // Calculate aggregate bounds
                // Format: [left, top, right, bottom]
                var minX = Infinity;
                var minY = Infinity;
                var maxX = -Infinity;
                var maxY = -Infinity;

                for (var i = 0; i < selection.length; i++) {
                    var item = selection[i];
                    var b = item.visibleBounds;

                    minX = Math.min(minX, b[0]); // left
                    minY = Math.min(minY, b[3]); // bottom
                    maxX = Math.max(maxX, b[2]); // right
                    maxY = Math.max(maxY, b[1]); // top
                }

                var w = maxX - minX;
                var h = maxY - minY;

                $.writeln("[Preflight] Detected bounds: " + w.toFixed(2) + " x " + h.toFixed(2) + " pt");
                $.writeln("[Preflight] Position: left=" + minX.toFixed(2) + ", top=" + maxY.toFixed(2));
                $.writeln("[Preflight] Items: " + selection.length);

                return {
                    left: minX,
                    top: maxY,
                    width: w,
                    height: h,
                    // Legacy compatibility
                    w: w,
                    h: h,
                    count: selection.length
                };

            } catch (e) {
                $.writeln("[Preflight] Error: " + e.message);
                return { left: 0, top: 0, width: 0, height: 0, w: 0, h: 0, count: 0, error: e.message };
            }
        },

        /**
         * Validate selection has content
         * @param {Array} selection
         * @returns {Object} {valid, errors[]}
         */
        validate: function (selection) {
            var errors = [];

            if (!selection || selection.length === 0) {
                errors.push("No items selected");
            }

            return {
                valid: errors.length === 0,
                errors: errors
            };
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("preflight", Module);
    }
})();
