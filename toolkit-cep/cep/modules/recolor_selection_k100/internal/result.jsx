if (!$.global.__TOOLKIT_RECOLOR_SELECTION_K100__) {
    throw new Error("Recolor K100 namespace was not initialized.");
}

var RecolorSelection = $.global.__TOOLKIT_RECOLOR_SELECTION_K100__;

RecolorSelection.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

RecolorSelection.createResultData = function (outcome) {
    return {
        targetColor: outcome.targetColor,
        processedItemCount: outcome.processedItemCount,
        recoloredFillCount: outcome.recoloredFillCount,
        recoloredStrokeCount: outcome.recoloredStrokeCount,
        recoloredTextRangeCount: outcome.recoloredTextRangeCount,
        skippedItemCount: outcome.skippedItemCount,
        skippedReasons: outcome.skippedReasons
    };
};

RecolorSelection.buildSuccessMessage = function (outcome) {
    return "Recolored selection to " + outcome.targetColor.name + ".";
};

RecolorSelection.execute = function (payload) {
    var doc;
    var request;
    var collectionState;
    var outcome;

    if (!app.documents.length) {
        return RecolorSelection.createFailure(
            "Open a document before running " + RecolorSelection.title + ".",
            "RECOLOR_SELECTION_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;

    try {
        request = RecolorSelection.resolveRequest(payload || {});
        collectionState = RecolorSelection.resolveDescriptors(doc);
        outcome = RecolorSelection.performRecolor(doc, collectionState, request);

        return {
            success: true,
            message: RecolorSelection.buildSuccessMessage(outcome),
            errorCode: null,
            data: RecolorSelection.createResultData(outcome)
        };
    } catch (error) {
        if (error && error.recolorErrorCode) {
            return RecolorSelection.createFailure(
                error.message,
                error.recolorErrorCode,
                error.recolorErrorData
            );
        }

        return RecolorSelection.createFailure(
            error && error.message ? error.message : RecolorSelection.title + " failed.",
            "RECOLOR_SELECTION_FAILED"
        );
    }
};
