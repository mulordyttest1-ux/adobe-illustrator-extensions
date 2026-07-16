if (!$.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__) {
    throw new Error("Rasterize Bitmap namespace was not initialized.");
}

var RasterizeBitmap = $.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__;

RasterizeBitmap.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

RasterizeBitmap.createResultData = function (outcome) {
    return {
        selectionCountBefore: outcome.selectionCountBefore,
        rasterItemCountAfter: outcome.rasterItemCountAfter,
        colorModel: outcome.colorModel,
        resolution: outcome.resolution,
        transparent: outcome.transparent,
        bitsPerChannel: outcome.bitsPerChannel,
        boundsBefore: outcome.boundsBefore,
        boundsAfter: outcome.boundsAfter
    };
};

RasterizeBitmap.buildSuccessMessage = function (outcome) {
    return "Rasterized selection to 1 transparent bitmap at " + outcome.resolution + " ppi.";
};

RasterizeBitmap.execute = function (payload) {
    var doc;
    var request;
    var items;
    var outcome;

    if (!app.documents.length) {
        return RasterizeBitmap.createFailure(
            "Open a document before running Rasterize Bitmap.",
            "RASTERIZE_SELECTION_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;

    try {
        request = RasterizeBitmap.resolveRequest(payload || {});
        items = RasterizeBitmap.resolveSelectionItems(doc);
        outcome = RasterizeBitmap.performRasterize(doc, items, request);

        return {
            success: true,
            message: RasterizeBitmap.buildSuccessMessage(outcome),
            errorCode: null,
            data: RasterizeBitmap.createResultData(outcome)
        };
    } catch (error) {
        if (error && error.rasterizeErrorCode) {
            return RasterizeBitmap.createFailure(
                error.message,
                error.rasterizeErrorCode,
                error.rasterizeErrorData
            );
        }

        return RasterizeBitmap.createFailure(
            error && error.message ? error.message : "Rasterize Bitmap failed.",
            "RASTERIZE_SELECTION_FAILED"
        );
    }
};
