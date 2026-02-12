/*
    🎨 MODULE: COLOR
    Responsibility: Convert objects to K100 (Black).
    Interface: run(item: PageItem)
*/

(function () {
    var Module = {
        id: "color",
        version: "1.0.0",

        /**
         * Main Execution
         * @param {PageItem} item - The root item (Group or Layer) to process.
         */
        run: function (item) {
            $.writeln("  [COLOR] Started K100 conversion...");
            this.convertToK100(item);
            $.writeln("  [COLOR] Finished.");
        },

        // --- INTERNAL LOGIC ---

        convertToK100: function (item) {
            var black = new CMYKColor();
            black.cyan = 0; black.magenta = 0; black.yellow = 0; black.black = 100;

            function process(obj) {
                try {
                    if (obj.locked || obj.hidden) return;

                    if (obj.typename === "GroupItem") {
                        for (var i = 0; i < obj.pageItems.length; i++) process(obj.pageItems[i]);
                    }
                    else if (obj.typename === "CompoundPathItem") {
                        if (obj.pathItems) {
                            for (var j = 0; j < obj.pathItems.length; j++) {
                                checkAndConvert(obj.pathItems[j]);
                            }
                        }
                    }
                    else if (obj.typename === "PathItem") {
                        checkAndConvert(obj);
                    }
                    else if (obj.typename === "TextFrame") {
                        // For text, we might need character attributes
                        // But usually text is outlined by cleanup step first.
                        // If live text exists:
                        var chars = obj.textRange.characterAttributes;
                        // checkAndConvertAttributes(chars); // Simplified
                    }
                } catch (e) { }
            }

            function checkAndConvert(p) {
                if (p.filled) {
                    if (!isLightColor(p.fillColor)) { p.fillColor = black; }
                }
                if (p.stroked) {
                    if (!isLightColor(p.strokeColor)) { p.strokeColor = black; }
                }
            }

            function isLightColor(color) {
                if (!color) return true;
                if (color.typename === "CMYKColor") return (color.cyan + color.magenta + color.yellow + color.black) < 10;
                if (color.typename === "GrayColor") return color.gray < 10;
                if (color.typename === "RGBColor") return (color.red + color.green + color.blue) > 735;
                if (color.typename === "SpotColor") return color.tint < 10;
                return true;
            }

            // Can accept Array or Single Item
            if (item instanceof Array) {
                for (var k = 0; k < item.length; k++) process(item[k]);
            } else {
                process(item);
            }
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("color", Module);
    }

})();
