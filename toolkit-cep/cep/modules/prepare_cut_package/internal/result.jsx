if (!$.global.__TOOLKIT_PREPARE_CUT_PACKAGE__) {
    throw new Error("Prepare Cut Package namespace was not initialized.");
}

var PrepareCutPackage = $.global.__TOOLKIT_PREPARE_CUT_PACKAGE__;

PrepareCutPackage.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

PrepareCutPackage.createResultData = function (cutState, cameraState) {
    return {
        cutLayerName: PrepareCutPackage.cutLayerName,
        cameraLayerName: PrepareCutPackage.cameraLayerName,
        detectedCutItemCount: cutState.detectedCutItemCount,
        movedCutItemCount: cutState.movedCutItemCount,
        cameraLayerExists: cameraState.exists,
        cameraLayerVisible: cameraState.visible,
        cameraLayerUnlocked: cameraState.unlocked,
        cameraLayerBroughtToFront: cameraState.broughtToFront
    };
};

PrepareCutPackage.buildSuccessMessage = function (cutState, cameraState) {
    var parts = [];

    parts.push(
        "Prepare Cut Package complete. " +
        cutState.detectedCutItemCount + " cut item(s) checked, " +
        cutState.movedCutItemCount + " moved to layer '" + PrepareCutPackage.cutLayerName + "'."
    );

    if (cameraState.exists) {
        parts.push("camera_marks is visible, unlocked, and brought to front for review.");
    } else {
        parts.push("camera_marks layer was not found.");
    }

    parts.push("Review and adjust the document before running Save Cut.");

    return parts.join(" ");
};

PrepareCutPackage.execute = function () {
    var doc;
    var cutState;
    var cameraState;

    if (!app.documents.length) {
        return PrepareCutPackage.createFailure(
            "Open a document before running Prepare Cut Package.",
            "PREPARE_CUT_PACKAGE_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;

    try {
        cutState = PrepareCutPackage.normalizeCutLayer(doc);
        cameraState = PrepareCutPackage.normalizeCameraLayer(doc);

        return {
            success: true,
            message: PrepareCutPackage.buildSuccessMessage(cutState, cameraState),
            errorCode: null,
            data: PrepareCutPackage.createResultData(cutState, cameraState)
        };
    } catch (error) {
        return PrepareCutPackage.createFailure(
            error && error.message ? error.message : "Prepare Cut Package failed.",
            "PREPARE_CUT_PACKAGE_FAILED"
        );
    }
};
