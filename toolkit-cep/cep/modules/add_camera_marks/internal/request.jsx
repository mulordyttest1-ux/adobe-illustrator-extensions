if (!$.global.__TOOLKIT_CAMERA_MARKS__) {
    throw new Error("Camera Marks namespace was not initialized.");
}

var CameraMarks = $.global.__TOOLKIT_CAMERA_MARKS__;

CameraMarks.resolveRequest = function (payload, doc) {
    var mode = CameraMarks.resolveMode(payload);
    var targetSelection;
    var offsets;

    if (mode === null) {
        return null;
    }

    targetSelection = CameraMarks.resolveTargetSelection(payload, doc);
    if (targetSelection.cancelled === true) {
        return null;
    }

    offsets = CameraMarks.resolveOffsets(payload, mode, doc);
    if (offsets === null) {
        return null;
    }

    return {
        mode: mode,
        targetRectSource: mode === "smart" ? "smart_line" : "artboard",
        targetMode: targetSelection.mode,
        targetLabel: targetSelection.label,
        targetIndexes: targetSelection.targetIndexes,
        lineOffsetXMm: offsets.lineOffsetXMm,
        lineOffsetYMm: offsets.lineOffsetYMm,
        roundOffsetXMm: offsets.roundOffsetXMm,
        roundOffsetYMm: offsets.roundOffsetYMm,
        smartLine: offsets.smartLine || null
    };
};

CameraMarks.resolveMode = function (payload) {
    var response;

    if (payload && typeof payload.markProfile !== "undefined") {
        return CameraMarks.normalizeMode(payload.markProfile);
    }
    if (payload && typeof payload.mode !== "undefined") {
        return CameraMarks.normalizeMode(payload.mode);
    }

    response = prompt(
        "Camera mark mode:\n1 = Smart Line\n2 = Line\n3 = Round\n4 = Both\n(Ban co the nhap 1/2/3/4 hoac smart/line/round/both)",
        "1"
    );

    if (response === null) {
        return null;
    }

    return CameraMarks.normalizeMode(response);
};

CameraMarks.normalizeMode = function (value) {
    var normalized = String(value).toLowerCase().replace(/^\s+|\s+$/g, "");

    if (normalized === "1" || normalized === "smart" || normalized === "smart_line" || normalized === "smartline" || normalized === "s") {
        return "smart";
    }
    if (normalized === "2" || normalized === "line" || normalized === "l") {
        return "line";
    }
    if (normalized === "3" || normalized === "round" || normalized === "r") {
        return "round";
    }
    if (normalized === "4" || normalized === "both" || normalized === "b") {
        return "both";
    }

    throw new Error("Camera mark mode must be Smart Line, Line, Round, or Both.");
};

CameraMarks.resolveOffsets = function (payload, mode, doc) {
    var hasPayloadOffsets = CameraMarks.payloadHasOffsets(payload, mode);
    var lineOffsetXMm = 7;
    var lineOffsetYMm = 7;
    var roundOffsetXMm = 7;
    var roundOffsetYMm = 30;
    var response;

    if (mode === "smart") {
        return {
            lineOffsetXMm: lineOffsetXMm,
            lineOffsetYMm: lineOffsetYMm,
            roundOffsetXMm: roundOffsetXMm,
            roundOffsetYMm: roundOffsetYMm,
            smartLine: CameraMarks.createSmartLineSeed(doc)
        };
    }

    if (hasPayloadOffsets) {
        if (mode === "line" || mode === "both") {
            lineOffsetXMm = CameraMarks.parseOffsetMm(payload.lineOffsetXMm, 7);
            lineOffsetYMm = CameraMarks.parseOffsetMm(payload.lineOffsetYMm, 7);
        }
        if (mode === "round" || mode === "both") {
            roundOffsetXMm = CameraMarks.parseOffsetMm(payload.roundOffsetXMm, 7);
            roundOffsetYMm = CameraMarks.parseOffsetMm(payload.roundOffsetYMm, 30);
        }

        return {
            lineOffsetXMm: lineOffsetXMm,
            lineOffsetYMm: lineOffsetYMm,
            roundOffsetXMm: roundOffsetXMm,
            roundOffsetYMm: roundOffsetYMm
        };
    }

    if (mode === "line" || mode === "both") {
        response = prompt("Line mark X offset mm (mac dinh 7):", "7");
        if (response === null) {
            return null;
        }
        lineOffsetXMm = CameraMarks.parseOffsetMm(response, 7);

        response = prompt("Line mark Y offset mm (mac dinh 7):", "7");
        if (response === null) {
            return null;
        }
        lineOffsetYMm = CameraMarks.parseOffsetMm(response, 7);
    }

    if (mode === "round" || mode === "both") {
        response = prompt("Round mark X offset mm (mac dinh 7):", "7");
        if (response === null) {
            return null;
        }
        roundOffsetXMm = CameraMarks.parseOffsetMm(response, 7);

        response = prompt("Round mark Y offset mm (mac dinh 30):", "30");
        if (response === null) {
            return null;
        }
        roundOffsetYMm = CameraMarks.parseOffsetMm(response, 30);
    }

    return {
        lineOffsetXMm: lineOffsetXMm,
        lineOffsetYMm: lineOffsetYMm,
        roundOffsetXMm: roundOffsetXMm,
        roundOffsetYMm: roundOffsetYMm
    };
};

CameraMarks.payloadHasOffsets = function (payload, mode) {
    if (!payload) {
        return false;
    }

    if ((mode === "line" || mode === "both") &&
        (typeof payload.lineOffsetXMm !== "undefined" || typeof payload.lineOffsetYMm !== "undefined")) {
        return true;
    }

    if ((mode === "round" || mode === "both") &&
        (typeof payload.roundOffsetXMm !== "undefined" || typeof payload.roundOffsetYMm !== "undefined")) {
        return true;
    }

    return false;
};

CameraMarks.parseOffsetMm = function (value, defaultValue) {
    var normalized = String(typeof value === "undefined" || value === null ? "" : value)
        .replace(",", ".")
        .replace(/^\s+|\s+$/g, "");
    var parsed;

    if (normalized === "") {
        return defaultValue;
    }

    parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed < 0) {
        throw new Error("Camera mark offsets must be numbers >= 0.");
    }

    return parsed;
};

CameraMarks.resolveTargetSelection = function (payload, doc) {
    var artboardCount = doc.artboards.length;
    var activeArtboardIndex = doc.artboards.getActiveArtboardIndex();
    var targetIndexes = null;
    var promptInput;

    if (payload && payload.targetMode === "all") {
        targetIndexes = CameraMarks.buildAllArtboardIndexes(artboardCount);
    } else if (payload && (payload.targetMode === "active" || payload.targetMode === "current")) {
        targetIndexes = [activeArtboardIndex];
    } else if (payload && typeof payload.artboardIndex !== "undefined") {
        targetIndexes = CameraMarks.normalizePayloadArtboardIndex(payload.artboardIndex, artboardCount);
    } else if (payload && typeof payload.artboardIndexes !== "undefined") {
        targetIndexes = CameraMarks.normalizePayloadArtboardIndexes(payload.artboardIndexes, artboardCount);
    } else if (payload && typeof payload.artboardInput !== "undefined") {
        targetIndexes = CameraMarks.parseArtboardPromptInput(payload.artboardInput, artboardCount);
    } else {
        promptInput = prompt(
            "Artboard dich:\n0 = Tat ca artboard\nNhap so 1-" + artboardCount + " cho mot artboard\nHoac nhap danh sach 1,3,5 / range 1-3",
            String(activeArtboardIndex + 1)
        );

        if (promptInput === null) {
            return {
                cancelled: true,
                targetIndexes: null,
                mode: "cancelled",
                label: ""
            };
        }

        targetIndexes = CameraMarks.parseArtboardPromptInput(promptInput, artboardCount);
    }

    return {
        cancelled: false,
        targetIndexes: targetIndexes,
        mode: CameraMarks.describeTargetMode(targetIndexes, artboardCount),
        label: CameraMarks.buildTargetLabel(targetIndexes, artboardCount)
    };
};

CameraMarks.buildAllArtboardIndexes = function (artboardCount) {
    var result = [];
    var i;

    for (i = 0; i < artboardCount; i += 1) {
        result.push(i);
    }

    return result;
};

CameraMarks.normalizePayloadArtboardIndex = function (value, artboardCount) {
    var parsedIndex = parseInt(value, 10);

    if (isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= artboardCount) {
        return null;
    }

    return [parsedIndex];
};

CameraMarks.normalizePayloadArtboardIndexes = function (value, artboardCount) {
    var tag = Object.prototype.toString.call(value);
    var result = [];
    var seen = {};
    var i;
    var parsedIndex;

    if (tag === "[object Array]") {
        for (i = 0; i < value.length; i += 1) {
            parsedIndex = parseInt(value[i], 10);
            if (isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= artboardCount) {
                return null;
            }
            if (!seen[parsedIndex]) {
                seen[parsedIndex] = true;
                result.push(parsedIndex);
            }
        }
        return result;
    }

    return CameraMarks.parseArtboardPromptInput(value, artboardCount);
};

CameraMarks.parseArtboardPromptInput = function (inputValue, artboardCount) {
    var trimmed = CameraMarks.trimString(inputValue);
    var normalized = trimmed.toLowerCase();
    var tokens;
    var result = [];
    var seen = {};
    var i;

    if (trimmed === "") {
        return null;
    }

    if (normalized === "0" || normalized === "all" || normalized === "tatca" || normalized === "tat ca") {
        return CameraMarks.buildAllArtboardIndexes(artboardCount);
    }

    tokens = trimmed.split(",");
    for (i = 0; i < tokens.length; i += 1) {
        if (!CameraMarks.appendArtboardToken(result, seen, CameraMarks.trimString(tokens[i]), artboardCount)) {
            return null;
        }
    }

    if (result.length === 0) {
        return null;
    }

    return result;
};

CameraMarks.appendArtboardToken = function (result, seen, token, artboardCount) {
    var dashParts;
    var startIndex;
    var endIndex;
    var step;
    var cursor;

    if (token === "") {
        return false;
    }

    if (token.indexOf("-") >= 0) {
        dashParts = token.split("-");
        if (dashParts.length !== 2) {
            return false;
        }

        startIndex = CameraMarks.parsePromptArtboardNumber(dashParts[0], artboardCount);
        endIndex = CameraMarks.parsePromptArtboardNumber(dashParts[1], artboardCount);
        if (startIndex === null || endIndex === null) {
            return false;
        }

        step = startIndex <= endIndex ? 1 : -1;
        for (cursor = startIndex; cursor !== endIndex + step; cursor += step) {
            if (!seen[cursor]) {
                seen[cursor] = true;
                result.push(cursor);
            }
        }
        return true;
    }

    startIndex = CameraMarks.parsePromptArtboardNumber(token, artboardCount);
    if (startIndex === null) {
        return false;
    }

    if (!seen[startIndex]) {
        seen[startIndex] = true;
        result.push(startIndex);
    }

    return true;
};

CameraMarks.parsePromptArtboardNumber = function (value, artboardCount) {
    var parsed = parseInt(CameraMarks.trimString(value), 10);

    if (isNaN(parsed) || parsed < 1 || parsed > artboardCount) {
        return null;
    }

    return parsed - 1;
};

CameraMarks.describeTargetMode = function (targetIndexes, artboardCount) {
    if (!targetIndexes) {
        return "invalid";
    }

    if (targetIndexes.length === artboardCount) {
        return "all";
    }

    if (targetIndexes.length === 1) {
        return "single";
    }

    return "list";
};

CameraMarks.buildTargetLabel = function (targetIndexes, artboardCount) {
    var numbers = [];
    var i;

    if (!targetIndexes) {
        return "";
    }

    if (targetIndexes.length === artboardCount) {
        return "all artboards";
    }

    if (targetIndexes.length === 1) {
        return "artboard " + String(targetIndexes[0] + 1);
    }

    for (i = 0; i < targetIndexes.length; i += 1) {
        numbers.push(String(targetIndexes[i] + 1));
    }

    return "artboards " + numbers.join(", ");
};

CameraMarks.trimString = function (value) {
    return String(value).replace(/^\s+|\s+$/g, "");
};
