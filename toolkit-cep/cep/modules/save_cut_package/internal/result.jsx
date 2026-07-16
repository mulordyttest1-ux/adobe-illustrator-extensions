if (!$.global.__TOOLKIT_SAVE_CUT_PACKAGE__) {
    throw new Error("Save Cut Package namespace was not initialized.");
}

var SaveCutPackage = $.global.__TOOLKIT_SAVE_CUT_PACKAGE__;

SaveCutPackage.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

SaveCutPackage.createResultData = function (request, dieExportState, pdfExportState) {
    return {
        sourceAiPath: request.sourceAiPath,
        aiPath: request.aiPath,
        pdfPath: request.pdfPath,
        dieAiPrefix: SaveCutPackage.dieAiPrefix,
        printPdfPrefix: SaveCutPackage.printPdfPrefix,
        rasterizedLayerCount: dieExportState.rasterizedLayerCount,
        rasterItemCount: dieExportState.rasterItemCount,
        hiddenProtectedLayerCount: pdfExportState.hiddenProtectedLayerCount
    };
};

SaveCutPackage.buildSuccessMessage = function (request, dieExportState, pdfExportState) {
    return (
        "Save Cut Package complete. Source AI synced: " + request.sourceAiPath + ". " +
        "Die AI saved: " + request.aiPath + " (" + dieExportState.rasterizedLayerCount + " print layer(s) rasterized at 300 ppi). " +
        "Print PDF exported: " + request.pdfPath + " (" + pdfExportState.hiddenProtectedLayerCount + " protected layer(s) hidden)."
    );
};

SaveCutPackage.execute = function (payload) {
    var doc;
    var request;
    var sourceAiFile;
    var aiFile;
    var pdfFile;
    var sourceDocPath;
    var dieExportState;
    var pdfExportState;

    if (!app.documents.length) {
        return SaveCutPackage.createFailure(
            "Open a document before running Save Cut Package.",
            "SAVE_CUT_PACKAGE_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;
    request = SaveCutPackage.resolveRequest(payload || {}, doc);

    if (request === null) {
        return SaveCutPackage.createFailure(
            "Save Cut Package cancelled.",
            "SAVE_CUT_PACKAGE_CANCELLED"
        );
    }

    sourceAiFile = SaveCutPackage.createFile(request.sourceAiPath);
    aiFile = SaveCutPackage.createFile(request.aiPath);
    pdfFile = SaveCutPackage.createFile(request.pdfPath);

    try {
        if (SaveCutPackage.pathsEqual(sourceAiFile.fsName, aiFile.fsName)) {
            return SaveCutPackage.createFailure(
                "Die AI output phai khac file nguon AI de tranh ghi de file lam viec.",
                "SAVE_CUT_PACKAGE_AI_OUTPUT_COLLIDES_WITH_SOURCE",
                {
                    sourceAiPath: request.sourceAiPath,
                    aiPath: request.aiPath
                }
            );
        }

        sourceDocPath = SaveCutPackage.saveSourceDocument(doc, sourceAiFile);
        request.sourceAiPath = sourceDocPath;
        dieExportState = SaveCutPackage.exportDieAiPackage(sourceAiFile, aiFile);
        pdfExportState = SaveCutPackage.exportPrintPdfPackage(sourceAiFile, pdfFile);

        try {
            if (typeof doc.activate === "function") {
                doc.activate();
            }
            app.redraw();
        } catch (activateError) {}

        return {
            success: true,
            message: SaveCutPackage.buildSuccessMessage(request, dieExportState, pdfExportState),
            errorCode: null,
            data: SaveCutPackage.createResultData(request, dieExportState, pdfExportState)
        };
    } catch (error) {
        return SaveCutPackage.createFailure(
            error && error.message ? error.message : "Save Cut Package failed.",
            "SAVE_CUT_PACKAGE_FAILED",
            {
                aiPath: request.aiPath,
                pdfPath: request.pdfPath
            }
        );
    }
};
