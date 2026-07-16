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
    exports.calculateNUpLayout = function () {
        var input = _normalizeLayoutInput(arguments);
        var artboardRect = input.artboardRect;
        var yieldDim = input.yieldDim;
        var variantCount = input.variantCount;
        var spacing = input.spacing;
        var sheetGripper = input.sheetGripper;
        var headToHead = input.headToHead;
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

        return _generatePlacements({
            grid: _calculateGridOrigin({
                abL: abL,
                abT: abT,
                gripper: gripper,
                useW: useW,
                useH: useH,
                cols: cols,
                rows: rows,
                yieldDim: yieldDim,
                spacing: spacing
            }),
            cols: cols,
            rows: rows,
            yieldDim: yieldDim,
            spacing: spacing,
            variantCount: variantCount,
            headToHead: headToHead
        });
    };

    function _normalizeLayoutInput(argsLike) {
        if (argsLike.length === 1 && typeof argsLike[0] === 'object' && argsLike[0]) {
            return argsLike[0];
        }

        return {
            artboardRect: argsLike[0],
            yieldDim: argsLike[1],
            variantCount: argsLike[2],
            spacing: argsLike[3],
            sheetGripper: argsLike[4],
            headToHead: argsLike[5]
        };
    }

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

    function _calculateGridOrigin(layout) {
        var gridW = layout.cols * layout.yieldDim.w + (layout.cols - 1) * layout.spacing.x;
        var gridH = layout.rows * layout.yieldDim.h + (layout.rows - 1) * layout.spacing.y;

        var usableL = layout.abL + layout.gripper.left;
        var usableT = layout.abT - layout.gripper.top;

        var usableCX = usableL + (layout.useW / 2);
        var usableCY = usableT - (layout.useH / 2);

        return {
            left: usableCX - (gridW / 2),
            top: usableCY + (gridH / 2)
        };
    }

    function _generatePlacements(layout) {
        var rowsPerVariant = Math.floor(layout.rows / layout.variantCount);
        var placements = [];

        for (var r = 0; r < layout.rows; r++) {
            for (var c = 0; c < layout.cols; c++) {
                var variantIndex = _getVariantIndex(r, c, rowsPerVariant, layout.variantCount);
                var rotation = (layout.headToHead && r % 2 !== 0) ? 180 : 0;

                var x = layout.grid.left + (c * (layout.yieldDim.w + layout.spacing.x)) + (layout.yieldDim.w / 2);
                var y = layout.grid.top - (r * (layout.yieldDim.h + layout.spacing.y)) - (layout.yieldDim.h / 2);

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
