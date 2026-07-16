/*
    🔄 MODULE: ROTATE (Post-Layout)
    ================================================================================
    📜 COMPLIANCE STANDARDS
    1. SRP: Single Responsibility - Only rotate placed items
    2. Post-Layout: Runs AFTER layout placement
    
    PROTOCOL: POST_PROCESSOR
    - Operates on already-placed items
    - Does not affect layout calculation
    - Rotates around each item's center
    ================================================================================
    
    Responsibility: Rotate placed items by user-specified angle.
    Interface: process(doc, items, angle) → {status, items}
*/

(function () {
    var Module = {
        id: "rotate",
        version: "1.0.0",

        /**
         * Rotate all placed items
         * @param {Document} doc - Illustrator document
         * @param {Array} items - Placed items from layout
         * @param {Object} options - {angle: number, enabled: boolean}
         * @returns {Object} {status, items}
         */
        process: function (doc, items, options) {
            var angle = parseFloat(options.angle) || 0;
            var enabled = options.enabled;

            if (!enabled || angle === 0) {
                $.writeln("[Rotate] Skipped: Disabled or angle = 0");
                return { status: 'success', items: items, skipped: true };
            }

            $.writeln("[Rotate] Rotating " + items.length + " items by " + angle + "°");

            for (var i = 0; i < items.length; i++) {
                var item = items[i];

                try {
                    // Rotate around item's center point
                    item.rotate(angle, true, true, true, true, Transformation.CENTER);
                } catch (e) {
                    $.writeln("[Rotate] Error rotating item " + i + ": " + e.message);
                }
            }

            $.writeln("[Rotate] Complete");
            return { status: 'success', items: items };
        },

        /**
         * Convenience method: process normalized rotate options
         * @param {Document} doc
         * @param {Array} items
         * @param {Object} options - {enabled, angle}
         * @returns {Object} Result
         */
        run: function (doc, items, options) {
            return this.process(doc, items, options || {});
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("rotate", Module);
    }
})();
