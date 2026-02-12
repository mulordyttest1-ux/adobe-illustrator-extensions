/*
    🧹 MODULE: CLEANUP
    ----------------------------------------------------------------------------
    PROTOCOL: Scenario A (Logic Fix)
    - Edit this file directly.
    - Maintain run(item) signature.
    - See [.agent/plans/modular_architecture_risk_and_roadmap.md] for details.
    ----------------------------------------------------------------------------
    Responsibility: Pre-flight cleanup (Outlines, Expand, Flatten).
    Interface: run(item: PageItem)
    Dependencies: none
*/

(function () {
    var Module = {
        id: "cleanup",
        version: "1.0.0",

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

        cleanupForPrint: function (item) {
            // 1. Text to Outlines
            var textFrames = [];
            function findText(obj) {
                try {
                    if (obj.typename === 'TextFrame') {
                        textFrames.push(obj);
                    } else if (obj.typename === 'GroupItem') {
                        for (var i = 0; i < obj.pageItems.length; i++) {
                            findText(obj.pageItems[i]);
                        }
                    }
                } catch (e) { }
            }
            findText(item);

            for (var i = 0; i < textFrames.length; i++) {
                try { textFrames[i].createOutline(); } catch (e) { }
            }

            // 2. Expand Appearance
            // CRITICAL: Selection must be an ARRAY for some AI versions
            var doc = app.activeDocument;
            // Step 2163 Option C: Removed unused oldSel capture
            doc.selection = null; // Clear first

            try {
                // Must act on the object in the document context
                item.selected = true;
                doc.selection = [item]; // Force array selection

                app.executeMenuCommand('expandStyle'); // Expand Appearance
                app.executeMenuCommand('expand'); // General Expand

                // Cleanup selection
                doc.selection = null;
            } catch (e) {
                // Ignore selection errors, proceed
            }

            // Restore selection if needed? No, cleanup implies changing structure.
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("cleanup", Module);
    } else {
        alert("Error: Core Loader not found for Cleanup Module.");
    }

})();
