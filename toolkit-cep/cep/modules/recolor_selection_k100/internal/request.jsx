if (!$.global.__TOOLKIT_RECOLOR_SELECTION_K100__) {
    throw new Error("Recolor K100 namespace was not initialized.");
}

var RecolorSelection = $.global.__TOOLKIT_RECOLOR_SELECTION_K100__;

RecolorSelection.createModuleError = function (errorCode, message, data) {
    var error = new Error(message);

    error.recolorErrorCode = errorCode;
    error.recolorErrorData = data || null;

    return error;
};

RecolorSelection.cloneTargetColorSpec = function (spec) {
    return {
        name: RecolorSelection.successLabel,
        model: "CMYK",
        cyan: spec.cyan,
        magenta: spec.magenta,
        yellow: spec.yellow,
        black: spec.black
    };
};

RecolorSelection.resolveRequest = function () {
    return {
        targetColor: RecolorSelection.cloneTargetColorSpec(RecolorSelection.targetColorSpec)
    };
};
