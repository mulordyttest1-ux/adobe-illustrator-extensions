/*
    💠 MODULE: SYMBOL (Yield-Level)
    ================================================================================
    📜 COMPLIANCE STANDARDS (Required Reading)
    1. Domain Separation: [.agent/domain_separation_standard.md]
    2. Architecture:      [.agent/plans/modular_architecture_risk_and_roadmap.md]
    
    PROTOCOL: SATELLITE_MODULE (Scenario A: Logic Fix)
    - Edit this file directly.
    - Maintain run(item) signature.
    ================================================================================
    
    🏛️ ARCHITECTURE: YIELD GUIDES (Functional)
    ================================================================================
    This module creates the YIELD CONTAINER (Symbol or Group) which holds:
    1. **Content**: The design artwork, resized to fit within the Safe Zone.
    2. **Finish_Bounds**: Invisible frame defining the die-cut line.
    3. **Guides**: Internal guides for margins, all INSIDE the Group.
    
    | Aspect         | YIELD (mod_symbol.jsx)                           |
    | -------------- | ----------------------------------------------- |
    | Purpose        | Functional (Selection Resize, Clipping Target)  |
    | Data Source    | `frame.rules` derived from `sec_margins` schema|
    | Output         | PathItem Guides inside the Container Group      |
    | Target         | `Container_*` GroupItem or Symbol               |
    | Affects Calc   | YES (Determines printable area for content)     |
    
    🔄 DRY NAMING CONVENTION:
    - Guides named: `Guide_[rule.id]` (e.g., `Guide_safe_top`, `Guide_binding_left`)
    - Custom user-added fields become guides automatically via the naming pattern.
    - `FIELD_IDS.PREFIX_GUIDE` is the single source of truth for the prefix.
    ================================================================================
    
    Responsibility: Create Symbol from content.
    Interface: run(doc, item, frame, name) -> SymbolItem | GroupItem
*/

(function () {
    var Module = {
        id: "symbol",
        version: "1.0.0",

        /**
         * Create Yield (Symbol or Group)
         * @param {Document} doc
         * @param {PageItem} item
         * @param {Object} frame
         * @param {String} name
         * @param {Boolean} asSymbol - If true, convert to Symbol; else return Group.
         * @returns {Symbol|GroupItem}
         */
        run: function (doc, item, frame, name, asSymbol) {
            return this.createYield(doc, item, frame, name, asSymbol);
        },

        // --- INTERNAL LOGIC ---

        createYield: function (doc, item, frame, name, asSymbol) {
            // 0. DRY Constants (inlined - FIELD_IDS not available in JSX context)
            // Step 2163 Option C: Removed conditional check
            var PREFIX_CONTAINER = 'Container_';
            var PREFIX_CONTENT = 'Content_';
            var PREFIX_GUIDE = 'Guide_';
            var GUIDE_FINISH = 'Guide_Finish';
            var GUIDE_SAFE_ZONE = 'Guide_Safe_Zone';

            // 1. Prepare Container Group
            var container = doc.groupItems.add();
            container.name = PREFIX_CONTAINER + name;

            // 2. Create Invisible Finish Frame
            var fW = frame.finish.w;
            var fH = frame.finish.h;

            var finishRect = container.pathItems.rectangle(fH / 2, -fW / 2, fW, fH);
            finishRect.name = "Finish_Bounds";
            finishRect.filled = false;
            finishRect.stroked = false;

            // 3. Process Content (Resize & Position)
            var contentGroup = doc.groupItems.add();
            contentGroup.name = PREFIX_CONTENT + name;
            contentGroup.move(container, ElementPlacement.PLACEATEND);

            item.moveToBeginning(contentGroup);

            // CRITICAL: Reset item to container-local coordinates
            // Without this, item retains absolute coords and guides will be offset
            var ib = item.visibleBounds;
            var itemCenterX = ib[0] + (ib[2] - ib[0]) / 2;
            var itemCenterY = ib[1] - (ib[1] - ib[3]) / 2;
            item.translate(-itemCenterX, -itemCenterY);  // Move to container origin

            // Step 2163 Option C: Calculate margins once (DRY)
            // Removed frame.margins fallback - yieldPadding is the canonical source
            var m = frame.yieldPadding || { top: 0, left: 0, right: 0, bottom: 0 };
            var mTop = (m.top || 0) * 2.834645;
            var mLeft = (m.left || 0) * 2.834645;

            // DELEGATE TO RESIZE MODULE (SRP Refactor)
            // mod_resize handles: fitToSafe + centerInSafeZone
            if (!frame.isAutoSize && $._imposition.modules && $._imposition.modules.resize) {
                $._imposition.modules.resize.run(item, frame);
            }

            // DELEGATE TO YIELD GUIDES MODULE (SRP Refactor)
            if ($._imposition.modules && $._imposition.modules.yield_guides) {
                $._imposition.modules.yield_guides.draw(container, frame);
            }

            // C. Finish Guide (Guide_Finish) - The Die Line
            var guideFinish = container.pathItems.rectangle(fH / 2, -fW / 2, fW, fH);
            guideFinish.name = GUIDE_FINISH;
            guideFinish.filled = false;
            guideFinish.stroked = true;
            guideFinish.guides = true;
            guideFinish.move(container, ElementPlacement.PLACEATEND);

            // D. Bleed Guide - REMOVED (User Step 1899)
            // E. Border Drawing - NOW INLINE with Rules (Section B)


            // 5. Finalize (Symbol or Group)
            if (asSymbol) {
                var sym = null;
                try {
                    var finalName = name;
                    var counter = 1;
                    while (true) {
                        try { doc.symbols.getByName(finalName); finalName = name + "_" + counter++; } catch (e) { break; }
                    }

                    sym = doc.symbols.add(container);
                    sym.name = finalName;
                    container.remove();
                    return sym;
                } catch (e) {
                    return null;
                }
            } else {
                return container; // Return the Group
            }
        },

        // Helper: Get Bounds (if needed)
        getItemBounds: function (item) {
            var b = item.visibleBounds;
            return { width: b[2] - b[0], height: b[1] - b[3] };
        }
    };

    // REGISTER
    if (typeof $._imposition !== 'undefined' && $._imposition.registerModule) {
        $._imposition.registerModule("symbol", Module);
    }
})();
