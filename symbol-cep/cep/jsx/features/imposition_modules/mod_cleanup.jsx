/*
    f9 MODULE: CLEANUP
    ----------------------------------------------------------------------------
    PROTOCOL: Scenario A (Logic Fix)
    - Edit this file directly.
    - Maintain run(item) signature.
    - See [symbol-cep/AGENTS.md] and [symbol-cep/ARCHITECTURE.md] for current boundaries.
    ----------------------------------------------------------------------------
    Responsibility: Pre-flight cleanup (Outlines, Expand, Flatten).
    Interface: run(item: PageItem)
    Dependencies: none
*/

(function () {
    var Module = {
        id: "cleanup",
        version: "1.1.0",

        /**
         * Main Execution Point
         * @param {PageItem} item - The item to clean (usually the temp group/clone).
         */
        run: function (item) {
            $.writeln("  [CLEANUP] Started on item: " + item);
            this.cleanupForPrint(item);
            $.writeln("  [CLEANUP] Finished.");
        },

        // --- INTERNAL LOGIC ---

        outlineTextOnly: function (item) {
            var textFrames = [];
            var i;

            this._collectTextFrames(item, textFrames);

            for (i = 0; i < textFrames.length; i++) {
                try { textFrames[i].createOutline(); } catch (e) { }
            }
        },

        hasTextFrames: function (item) {
            var textFrames = [];

            this._collectTextFrames(item, textFrames);
            return textFrames.length > 0;
        },

        cleanupForPrint: function (item) {
            this.outlineTextOnly(item);
            this._expandAppearance(item);
        },

        _collectTextFrames: function (obj, bucket) {
            var i;

            try {
                if (!obj || obj.locked || obj.hidden) {
                    return;
                }
            } catch (stateError) {
                return;
            }

            try {
                if (obj.typename === 'TextFrame') {
                    bucket.push(obj);
                    return;
                }
            } catch (typenameError) {
                return;
            }

            try {
                if (obj.typename === 'GroupItem') {
                    for (i = 0; i < obj.pageItems.length; i++) {
                        this._collectTextFrames(obj.pageItems[i], bucket);
                    }
                }
            } catch (groupError) { }
        },

        _expandAppearance: function (item) {
            var doc = app.activeDocument;
            doc.selection = null;

            try {
                item.selected = true;
                doc.selection = [item];

                app.executeMenuCommand('expandStyle');
                app.executeMenuCommand('expand');

                doc.selection = null;
            } catch (e) {
                // Ignore selection errors, proceed
            }
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("cleanup", Module);
    } else {
        alert("Error: Core Loader not found for Cleanup Module.");
    }

})();
