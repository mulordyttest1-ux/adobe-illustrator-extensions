/* eslint-disable no-var */
/**
 * MODULE: LayoutEngine
 * LAYER: Domain/Logic (L1)
 * PURPOSE: N-Up grid layout calculation (placement, rotation, centering)
 * DEPENDENCIES: None (pure math)
 * SIDE EFFECTS: None
 * EXPORTS: ImpositionDomain.calculateNUpLayout()
 */
// Compatible with: ES3 (ExtendScript) & V8 (CEP/Node)

if (typeof ImpositionDomain === 'undefined') {
    ImpositionDomain = {};
}

(function (exports) {

    /**
     * N-Up Grid Layout Calculation
     * Strategy: Balanced Stack with Mixed Footer
     *
     * @param {number[]} artboardRect - AI Rect [Left, Top, Right, Bottom]
     * @param {{w: number, h: number}} yieldDim - Yield dimensions in points
     * @param {number} variantCount - Number of variants to distribute
     * @param {{x: number, y: number}} spacing - Gap between yields
     * @param {Object|number} sheetGripper - Sheet edge margins (object or uniform number)
     * @param {boolean} headToHead - Enable 180° rotation on odd rows
     * @returns {Array} placements - List of {x, y, variantIndex, row, col, rotation}
     */
    exports.calculateNUpLayout = function (artboardRect, yieldDim, variantCount, spacing, sheetGripper, headToHead) {
        // 1. Parse artboard dimensions
        var abL = artboardRect[0];
        var abT = artboardRect[1];
        var abW = artboardRect[2] - artboardRect[0];
        var abH = artboardRect[1] - artboardRect[3]; // AI coordinates: Top > Bottom

        if (!spacing) spacing = { x: 0, y: 0 };

        // 2. Normalize Sheet Gripper
        var gripper = _normalizeGripper(sheetGripper);

        // 3. Usable Area
        var useW = abW - (gripper.left + gripper.right);
        var useH = abH - (gripper.top + gripper.bottom);

        // 4. Capacity
        var cols = Math.floor((useW + spacing.x) / (yieldDim.w + spacing.x));
        var rows = Math.floor((useH + spacing.y) / (yieldDim.h + spacing.y));

        if (cols <= 0 || rows <= 0) return [];

        // 5. Grid dimensions & centering
        var grid = _calculateGridOrigin(
            abL, abT, gripper, useW, useH,
            cols, rows, yieldDim, spacing
        );

        // 6. Generate placements
        return _generatePlacements(
            grid, cols, rows, yieldDim, spacing,
            variantCount, headToHead
        );
    };

    /**
     * Normalize sheetGripper input to {top, bottom, left, right}
     * @private
     */
    function _normalizeGripper(sheetGripper) {
        var m = { top: 0, bottom: 0, left: 0, right: 0 };
        if (typeof sheetGripper === 'object' && sheetGripper) {
            m.top = sheetGripper.top || 0;
            m.bottom = sheetGripper.bottom || 0;
            m.left = sheetGripper.left || 0;
            m.right = sheetGripper.right || 0;
        } else {
            var val = parseFloat(sheetGripper) || 0;
            m.top = val; m.bottom = val; m.left = val; m.right = val;
        }
        return m;
    }

    /**
     * Calculate grid origin (top-left corner) for centered placement
     * @private
     */
    function _calculateGridOrigin(abL, abT, gripper, useW, useH, cols, rows, yieldDim, spacing) {
        var gridW = cols * yieldDim.w + (cols - 1) * spacing.x;
        var gridH = rows * yieldDim.h + (rows - 1) * spacing.y;

        var usableL = abL + gripper.left;
        var usableT = abT - gripper.top;

        var usableCX = usableL + (useW / 2);
        var usableCY = usableT - (useH / 2);

        return {
            left: usableCX - (gridW / 2),
            top: usableCY + (gridH / 2)
        };
    }

    /**
     * Generate all cell placements
     * @private
     */
    function _generatePlacements(grid, cols, rows, yieldDim, spacing, variantCount, headToHead) {
        var rowsPerVariant = Math.floor(rows / variantCount);
        var placements = [];

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var variantIndex = _getVariantIndex(r, c, rowsPerVariant, variantCount);
                var rotation = (headToHead && r % 2 !== 0) ? 180 : 0;

                var x = grid.left + (c * (yieldDim.w + spacing.x)) + (yieldDim.w / 2);
                var y = grid.top - (r * (yieldDim.h + spacing.y)) - (yieldDim.h / 2);

                placements.push({
                    x: x,
                    y: y,
                    variantIndex: variantIndex,
                    row: r,
                    col: c,
                    rotation: rotation
                });
            }
        }

        return placements;
    }

    /**
     * Determine variant index for a cell position
     * @private
     */
    function _getVariantIndex(row, col, rowsPerVariant, variantCount) {
        if (rowsPerVariant > 0 && row < (rowsPerVariant * variantCount)) {
            var idx = Math.floor(row / rowsPerVariant);
            return (idx >= variantCount) ? variantCount - 1 : idx;
        }
        return col % variantCount;
    }

})(ImpositionDomain);
