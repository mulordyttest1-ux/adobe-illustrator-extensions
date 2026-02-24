/* eslint-disable no-var */
/**
 * MODULE: DomainCore
 * LAYER: Domain/Logic (L1)
 * PURPOSE: Core geometry calculations (Sheet, Frame, Paper Sizes)
 * DEPENDENCIES: MarginEngine (ImpositionDomain.createRulesFromPayload, .calculateMargins)
 * SIDE EFFECTS: None (pure math)
 * EXPORTS: ImpositionDomain.PaperSizes, .calculateSheetGeometry(), .calculateFrame()
 */
// Compatible with: ES3 (ExtendScript) & V8 (CEP/Node)

if (typeof ImpositionDomain === 'undefined') {
    ImpositionDomain = {};
}

(function (exports) {

    // --- CONSTANTS ---
    var MM_TO_PT = 2.834645;

    // --- ENTITIES ---

    exports.PaperSizes = {
        'a4': { w: 210, h: 297 },
        'a3': { w: 420, h: 297 },
        'sra3': { w: 450, h: 320 }
    };

    // --- DOMAIN SERVICES ---

    /**
     * Calculates the new Sheet Geometry based on Config
     * Pure Math: Input Rect -> Output Rect
     * Canonical: "Sheet" (Physical Paper) instead of "Artboard" (AI UI)
     */
    exports.calculateSheetGeometry = function (currentRect, payload) {
        var params = payload.rawValues || {};
        var sheetWidthMm = parseFloat(params.ab_w) || 320;
        var sheetHeightMm = parseFloat(params.ab_h) || 480;

        var sheetWidthPt = sheetWidthMm * MM_TO_PT;
        var sheetHeightPt = sheetHeightMm * MM_TO_PT;

        var newR = currentRect[0] + sheetWidthPt;
        var newB = currentRect[1] - sheetHeightPt;

        return {
            rect: [currentRect[0], currentRect[1], newR, newB],
            widthPt: sheetWidthPt,
            heightPt: sheetHeightPt,
            widthMm: sheetWidthMm,
            heightMm: sheetHeightMm
        };
    };

    /**
     * Calculates the Imposition Internal Frame (Finish, Print)
     * SIMPLIFIED: Bleed removed.
     */
    exports.calculateFrame = function (payload, contentBounds) {
        var geo = payload.geometry;

        // Auto-Detect Size logic
        var isAutoSize = false;
        var finishWidthPt, finishHeightPt;

        if (geo.finish && geo.finish.w > 0 && geo.finish.h > 0) {
            finishWidthPt = geo.finish.w * MM_TO_PT;
            finishHeightPt = geo.finish.h * MM_TO_PT;
        } else {
            isAutoSize = true;
            finishWidthPt = contentBounds.width;
            finishHeightPt = contentBounds.height;
        }

        // Margin Engine Integration
        var rules = (payload.rules && payload.rules.length > 0)
            ? payload.rules
            : exports.createRulesFromPayload(payload);

        var margins = exports.calculateMargins(rules);

        var mTop = margins.top;
        var mBot = margins.bottom;
        var mLeft = margins.left;
        var mRight = margins.right;

        var printWidthPt = finishWidthPt - ((mLeft + mRight) * MM_TO_PT);
        var printHeightPt = finishHeightPt - ((mTop + mBot) * MM_TO_PT);

        return {
            finish: { w: finishWidthPt, h: finishHeightPt },
            print: { w: printWidthPt, h: printHeightPt },
            margins: { top: mTop, bot: mBot, left: mLeft, right: mRight },
            yieldPadding: margins,
            rules: rules,
            isAutoSize: isAutoSize,
            getAbsoluteBounds: function (centerX, centerY) {
                var targetLeft = centerX - (finishWidthPt / 2);
                var targetTop = centerY + (finishHeightPt / 2);
                var fLeft = targetLeft + (mLeft * MM_TO_PT);
                var fTop = targetTop - (mTop * MM_TO_PT);
                return {
                    finish: { w: finishWidthPt, h: finishHeightPt, left: targetLeft, top: targetTop },
                    print: { w: printWidthPt, h: printHeightPt, left: fLeft, top: fTop }
                };
            },
            resizeMode: (payload.rawValues && payload.rawValues.resize_mode) || 'preserve'
        };
    };

})(ImpositionDomain);
