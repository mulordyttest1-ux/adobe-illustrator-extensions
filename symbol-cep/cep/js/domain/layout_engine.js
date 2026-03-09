/* eslint-disable no-var */
/* global $ */
/**
 * MODULE: LayoutEngine
 * LAYER: Domain/Logic (L1)
 * PURPOSE: N-Up grid layout calculation (placement, rotation, centering)
 * DEPENDENCIES: None (pure math)
 * SIDE EFFECTS: None
 * EXPORTS: ImpositionDomain.calculateNUpLayout()
 */
// Compatible with: ES3 (ExtendScript)

var ImpositionDomain = (typeof $ !== 'undefined' && $.global)
    ? ($.global.ImpositionDomain = $.global.ImpositionDomain || {})
    : (typeof ImpositionDomain !== 'undefined' ? ImpositionDomain : {});

(function (exports) {

    /**
     * N-Up Grid Layout Calculation
     */
    exports.calculateNUpLayout = function (artboardRect, yieldDim, variantCount, spacing, sheetGripper, headToHead) {
        var abL = artboardRect[0];
        var abT = artboardRect[1];
        var abW = artboardRect[2] - artboardRect[0];
        var abH = artboardRect[1] - artboardRect[3];

        if (!spacing) spacing = { x: 0, y: 0 };

        var gripper = _normalizeGripper(sheetGripper);

        var useW = abW - (gripper.left + gripper.right);
        var useH = abH - (gripper.top + gripper.bottom);

        var cols = Math.floor((useW + spacing.x) / (yieldDim.w + spacing.x));
        var rows = Math.floor((useH + spacing.y) / (yieldDim.h + spacing.y));

        if (cols <= 0 || rows <= 0) return [];

        var grid = _calculateGridOrigin(
            abL, abT, gripper, useW, useH,
            cols, rows, yieldDim, spacing
        );

        return _generatePlacements(
            grid, cols, rows, yieldDim, spacing,
            variantCount, headToHead
        );
    };

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

    function _getVariantIndex(row, col, rowsPerVariant, variantCount) {
        if (rowsPerVariant > 0 && row < (rowsPerVariant * variantCount)) {
            var idx = Math.floor(row / rowsPerVariant);
            return (idx >= variantCount) ? variantCount - 1 : idx;
        }
        return col % variantCount;
    }

})(ImpositionDomain);
