if (!$.global.__TOOLKIT_STEP_REPEAT__) {
    throw new Error("Step Repeat namespace was not initialized.");
}

var StepRepeat = $.global.__TOOLKIT_STEP_REPEAT__;

StepRepeat.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

StepRepeat.buildSuccessMessage = function (outcome) {
    var message = "Created " + outcome.count + " repeated cell(s) on active artboard " + (outcome.activeArtboardIndex + 1) + ".";

    if (outcome.rotationApplied) {
        message += " Applied 90-degree auto-rotate for a better fit.";
    }

    if (outcome.marginMm > 0) {
        message += " Margin " + outcome.marginMm + " mm applied.";
    }

    return message;
};

StepRepeat.createResultData = function (outcome) {
    return {
        mode: outcome.mode,
        gapMm: outcome.gapMm,
        marginMm: outcome.marginMm,
        autoRotate90: outcome.autoRotate90,
        rotationApplied: outcome.rotationApplied,
        rows: outcome.rows,
        cols: outcome.cols,
        count: outcome.count,
        activeArtboardIndex: outcome.activeArtboardIndex,
        cellBoundsBefore: outcome.cellBoundsBefore,
        gridBoundsAfter: outcome.gridBoundsAfter
    };
};

StepRepeat.execute = function (payload) {
    var doc;
    var request;
    var sourceItems;
    var outcome;

    if (!app.documents.length) {
        return StepRepeat.createFailure(
            "Open a document before running Step Repeat.",
            "STEP_REPEAT_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;

    try {
        request = StepRepeat.resolveRequest(payload || {});
        if (request === null) {
            return StepRepeat.createFailure(
                "Step Repeat cancelled.",
                "STEP_REPEAT_CANCELLED"
            );
        }

        sourceItems = StepRepeat.resolveSelectionItems(doc);
        outcome = StepRepeat.executeStrategy(doc, sourceItems, request);

        app.redraw();
        return {
            success: true,
            message: StepRepeat.buildSuccessMessage(outcome),
            errorCode: null,
            data: StepRepeat.createResultData(outcome)
        };
    } catch (error) {
        if (error && error.stepRepeatErrorCode) {
            return StepRepeat.createFailure(
                error.message,
                error.stepRepeatErrorCode,
                error.stepRepeatErrorData
            );
        }

        return StepRepeat.createFailure(
            error && error.message ? error.message : "Step Repeat failed.",
            "STEP_REPEAT_FAILED"
        );
    }
};
