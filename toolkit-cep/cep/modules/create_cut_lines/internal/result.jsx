if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

CutLines.buildSuccessMessage = function (request, execution, runContext) {
    if (request.strategy === "contour") {
        var message = "Created " + execution.createdCount + " contour cut line(s) on layer '" + CutLines.layerName + "'.";
        if (execution.skippedCount > 0) {
            message += " Skipped " + execution.skippedCount + " unsupported item(s).";
        }
        message += " Group: " + runContext.runGroupName + ".";
        return message;
    }

    return (
        "Created S-Line cut grid " + request.grid.cols + " x " + request.grid.rows +
        " with extend " + CutLines.formatNumber(request.extendMm) +
        " mm on layer '" + CutLines.layerName + "'. Group: " + runContext.runGroupName + "."
    );
};

CutLines.buildResultData = function (request, execution, runContext) {
    return {
        strategy: request.strategy,
        layerName: CutLines.layerName,
        spotName: CutLines.spotName,
        strokeWidthPt: CutLines.strokeWidthPt,
        runGroupName: runContext.runGroupName,
        strategyGroupName: runContext.strategyGroupName,
        createdCount: execution.createdCount,
        skippedCount: execution.skippedCount,
        selectionBounds: runContext.selectionBounds,
        grid: execution.grid || null,
        metadataApplied: true
    };
};

CutLines.cleanupRunGroup = function (runContext) {
    if (!runContext || !runContext.runGroup) {
        return;
    }

    try {
        CutLines.unlockItem(runContext.runGroup);
        runContext.runGroup.remove();
    } catch (error) {}
};

CutLines.execute = function (payload) {
    var doc;
    var request;
    var selection;
    var selectionBounds;
    var runContext;
    var execution;

    try {
        if (!app.documents.length) {
            return CutLines.createFailure(
                "Open a document before running Cut Lines.",
                "CUT_LINES_REQUIRES_DOCUMENT"
            );
        }

        doc = app.activeDocument;
        selection = doc.selection || [];
        if (!selection.length) {
            return CutLines.createFailure(
                "Select at least one object before running Cut Lines.",
                "CUT_LINES_REQUIRES_SELECTION"
            );
        }

        request = CutLines.resolveRequest(payload || {});
        if (request === null) {
            return CutLines.createFailure(
                "Cut Lines cancelled.",
                "CUT_LINES_CANCELLED"
            );
        }

        selectionBounds = CutLines.getCombinedGeometricBounds(selection);
        runContext = CutLines.createRunContext(doc, request.strategy, selectionBounds);

        if (request.strategy === "contour") {
            execution = CutLines.executeContour(selection, runContext);
        } else {
            execution = CutLines.executeSLine(selectionBounds, request, runContext);
        }

        if (execution.createdCount <= 0) {
            CutLines.cleanupRunGroup(runContext);
            return CutLines.createFailure(
                "No cut lines were created from the current selection.",
                "CUT_LINES_NOTHING_CREATED",
                CutLines.buildResultData(request, execution, runContext)
            );
        }

        app.redraw();
        return {
            success: true,
            message: CutLines.buildSuccessMessage(request, execution, runContext),
            errorCode: null,
            data: CutLines.buildResultData(request, execution, runContext)
        };
    } catch (error) {
        CutLines.cleanupRunGroup(runContext);
        return CutLines.createFailure(
            error && error.message ? error.message : "Cut Lines failed.",
            error && error.code ? error.code : "CUT_LINES_FAILED"
        );
    }
};
