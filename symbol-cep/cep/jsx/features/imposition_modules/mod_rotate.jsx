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
         * Check if rotation should be applied based on rawValues
         * @param {Object} rawValues - UI form values
         * @returns {Object} {enabled, angle}
         */
        parseOptions: function (rawValues) {
            var raw = rawValues || {};

            // DEBUG: Log what we receive
            $.writeln("[Rotate] Raw opt_custom_rotate = " + raw.opt_custom_rotate + " (type: " + typeof raw.opt_custom_rotate + ")");
            $.writeln("[Rotate] Raw custom_rotate_angle = " + raw.custom_rotate_angle);

            // Handle all possible checkbox values: true, 'true', 'on', 1
            var isEnabled = (
                raw.opt_custom_rotate === true ||
                raw.opt_custom_rotate === 'true' ||
                raw.opt_custom_rotate === 'on' ||
                raw.opt_custom_rotate === 1 ||
                raw.opt_custom_rotate === '1'
            );

            var angle = parseFloat(raw.custom_rotate_angle) || 0;

            $.writeln("[Rotate] Parsed: enabled=" + isEnabled + ", angle=" + angle);

            return {
                enabled: isEnabled,
                angle: angle
            };
        },

        /**
         * Convenience method: Parse options + process
         * @param {Document} doc
         * @param {Array} items
         * @param {Object} rawValues - From UI payload
         * @returns {Object} Result
         */
        run: function (doc, items, rawValues) {
            var options = this.parseOptions(rawValues);
            return this.process(doc, items, options);
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("rotate", Module);
    }
})();
