if (!$.global.__TOOLKIT_STEP_REPEAT_SYMBOL__) {
    throw new Error("Step Repeat Symbol namespace was not initialized.");
}

var StepRepeat = $.global.__TOOLKIT_STEP_REPEAT_SYMBOL__;

StepRepeat.mmToPt = 72 / 25.4;
StepRepeat.defaultMarginMm = 5;

StepRepeat.createModuleError = function (errorCode, message, data) {
    var error = new Error(message);

    error.stepRepeatErrorCode = errorCode;
    error.stepRepeatErrorData = data || null;

    return error;
};

StepRepeat.trimString = function (value) {
    if (typeof value === "undefined" || value === null) {
        return "";
    }

    return String(value).replace(/^\s+|\s+$/g, "");
};

StepRepeat.parseGapMm = function (value) {
    var normalized = StepRepeat.trimString(value);
    var parsed;

    if (!normalized) {
        return 0;
    }

    parsed = parseFloat(normalized.replace(",", "."));

    if (isNaN(parsed) || parsed < 0) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_INVALID_GAP",
            "Gap must be a number >= 0.",
            {
                gapInput: value
            }
        );
    }

    return parsed;
};

StepRepeat.parseMarginMm = function (value) {
    var normalized = StepRepeat.trimString(value);
    var parsed;

    if (!normalized) {
        return StepRepeat.defaultMarginMm;
    }

    parsed = parseFloat(normalized.replace(",", "."));

    if (isNaN(parsed) || parsed < 0) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_INVALID_MARGIN",
            "Margin must be a number >= 0.",
            {
                marginInput: value
            }
        );
    }

    return parsed;
};

StepRepeat.resolveRequest = function (payload) {
    var gapInput;
    var marginInput;
    var promptValue;
    var marginPromptValue;
    var gapMm;
    var marginMm;

    if (payload && typeof payload.gapMm !== "undefined") {
        gapInput = payload.gapMm;
    } else if (payload && typeof payload.gap !== "undefined") {
        gapInput = payload.gap;
    } else {
        promptValue = prompt("Gap (mm):", "0");
        if (promptValue === null) {
            return null;
        }
        gapInput = promptValue;
    }

    gapMm = StepRepeat.parseGapMm(gapInput);
    if (payload && typeof payload.marginMm !== "undefined") {
        marginInput = payload.marginMm;
    } else if (payload && typeof payload.margin !== "undefined") {
        marginInput = payload.margin;
    } else {
        marginPromptValue = prompt("Margin (mm):", String(StepRepeat.defaultMarginMm));
        if (marginPromptValue === null) {
            return null;
        }
        marginInput = marginPromptValue;
    }

    marginMm = StepRepeat.parseMarginMm(marginInput);

    return {
        mode: StepRepeat.mode,
        gapMm: gapMm,
        gapPt: gapMm * StepRepeat.mmToPt,
        marginMm: marginMm,
        marginPt: marginMm * StepRepeat.mmToPt,
        autoRotate90: true
    };
};
