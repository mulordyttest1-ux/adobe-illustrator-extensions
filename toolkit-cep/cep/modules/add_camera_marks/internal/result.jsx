if (!$.global.__TOOLKIT_CAMERA_MARKS__) {
    throw new Error("Camera Marks namespace was not initialized.");
}

var CameraMarks = $.global.__TOOLKIT_CAMERA_MARKS__;

CameraMarks.createProfileSummary = function () {
    return {
        drawnCount: 0,
        artboardCount: 0,
        rotatedCount: 0,
        blockedArtboards: [],
        artboards: []
    };
};

CameraMarks.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

CameraMarks.execute = function (payload) {
    var doc;
    var request;
    var layerState;
    var lineLayer;
    var roundLayer = null;
    var i;
    var activeArtboardIndex;
    var lineSummary = CameraMarks.createProfileSummary();
    var roundSummary = CameraMarks.createProfileSummary();
    var totalDrawn = 0;

    if (!app.documents.length) {
        return CameraMarks.createFailure(
            "Open a document before running Camera Marks.",
            "CAMERA_MARKS_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;
    activeArtboardIndex = doc.artboards.getActiveArtboardIndex();
    request = CameraMarks.resolveRequest(payload || {}, doc);

    if (request === null) {
        return {
            success: false,
            message: "Camera Marks cancelled.",
            errorCode: "CAMERA_MARKS_CANCELLED",
            data: {
                activeArtboardIndex: activeArtboardIndex
            }
        };
    }

    if (!request.targetIndexes) {
        return CameraMarks.createFailure(
            "Camera Marks target artboard is not valid.",
            "CAMERA_MARKS_INVALID_TARGET"
        );
    }

    if (request.targetIndexes.length === 0) {
        return CameraMarks.createFailure(
            "No artboards were selected for Camera Marks.",
            "CAMERA_MARKS_NO_TARGETS"
        );
    }

    layerState = CameraMarks.prepareLayer(doc, CameraMarks.layerName);
    request.overwroteExistingLayer = layerState.overwroteExistingLayer;
    lineLayer = layerState.layer;
    if (request.mode === "round" || request.mode === "both") {
        roundLayer = layerState.layer;
    }

    for (i = 0; i < request.targetIndexes.length; i += 1) {
        var artboardIndex = request.targetIndexes[i];
        var rect = CameraMarks.resolveTargetRect(doc, artboardIndex, request);

        if (request.mode === "smart" || request.mode === "line" || request.mode === "both") {
            CameraMarks.drawLineForArtboard(
                doc,
                lineLayer,
                artboardIndex,
                rect,
                request,
                lineSummary
            );
        }

        if (request.mode === "round" || request.mode === "both") {
            CameraMarks.drawRoundForArtboard(
                doc,
                roundLayer,
                artboardIndex,
                rect,
                request,
                roundSummary
            );
        }
    }

    totalDrawn = lineSummary.drawnCount + roundSummary.drawnCount;
    CameraMarks.lockLayer(layerState.layer);
    app.redraw();

    if (totalDrawn === 0) {
        return CameraMarks.createFailure(
            CameraMarks.buildEmptyMessage(request, lineSummary, roundSummary),
            "CAMERA_MARKS_NOTHING_DRAWN",
            CameraMarks.createResultData(activeArtboardIndex, request, lineSummary, roundSummary)
        );
    }

    return {
        success: true,
        message: CameraMarks.buildSuccessMessage(request, lineSummary, roundSummary),
        errorCode: null,
        data: CameraMarks.createResultData(activeArtboardIndex, request, lineSummary, roundSummary)
    };
};

CameraMarks.createResultData = function (activeArtboardIndex, request, lineSummary, roundSummary) {
    var primaryLineArtboard = CameraMarks.getPrimaryArtboardSummary(lineSummary);
    var primaryRoundArtboard = CameraMarks.getPrimaryArtboardSummary(roundSummary);
    var lineSmartAppliedCount = CameraMarks.countSmartAppliedArtboards(lineSummary.artboards);
    var lineDefaultMarginCount = CameraMarks.countUsedDefaultMarginArtboards(lineSummary.artboards);

    return {
        activeArtboardIndex: activeArtboardIndex,
        targetMode: request.targetMode,
        targetLabel: request.targetLabel,
        targetArtboardIndexes: request.targetIndexes,
        targetRectSource: request.targetRectSource,
        layerName: CameraMarks.layerName,
        layerLocked: true,
        overwroteExistingLayer: request.overwroteExistingLayer === true,
        mode: request.mode,
        drawnCount: lineSummary.drawnCount + roundSummary.drawnCount,
        artboardCount: Math.max(lineSummary.artboardCount, roundSummary.artboardCount),
        line: {
            enabled: request.mode === "smart" || request.mode === "line" || request.mode === "both",
            offsetXMm: primaryLineArtboard ? primaryLineArtboard.offsetXMm : request.lineOffsetXMm,
            offsetYMm: primaryLineArtboard ? primaryLineArtboard.offsetYMm : request.lineOffsetYMm,
            drawnCount: lineSummary.drawnCount,
            artboardCount: lineSummary.artboardCount,
            rotatedCount: lineSummary.rotatedCount,
            blockedArtboards: lineSummary.blockedArtboards,
            smartApplied: lineSmartAppliedCount > 0,
            smartAppliedCount: lineSmartAppliedCount,
            usedDefaultMargin: lineDefaultMarginCount > 0,
            usedDefaultMarginCount: lineDefaultMarginCount,
            fallbackReason: primaryLineArtboard ? primaryLineArtboard.fallbackReason : "",
            selectionWidthMm: request.smartLine ? request.smartLine.selectionWidthMm : null,
            selectionHeightMm: request.smartLine ? request.smartLine.selectionHeightMm : null,
            targetWidthMm: primaryLineArtboard ? primaryLineArtboard.targetWidthMm : null,
            targetHeightMm: primaryLineArtboard ? primaryLineArtboard.targetHeightMm : null,
            artboards: lineSummary.artboards
        },
        round: {
            enabled: request.mode === "round" || request.mode === "both",
            offsetXMm: primaryRoundArtboard ? primaryRoundArtboard.offsetXMm : request.roundOffsetXMm,
            offsetYMm: primaryRoundArtboard ? primaryRoundArtboard.offsetYMm : request.roundOffsetYMm,
            drawnCount: roundSummary.drawnCount,
            artboardCount: roundSummary.artboardCount,
            blockedArtboards: roundSummary.blockedArtboards,
            artboards: roundSummary.artboards
        }
    };
};

CameraMarks.buildSuccessMessage = function (request, lineSummary, roundSummary) {
    var parts = [];
    var primaryLineArtboard = CameraMarks.getPrimaryArtboardSummary(lineSummary);
    var lineSmartAppliedCount = CameraMarks.countSmartAppliedArtboards(lineSummary.artboards);
    var lineDefaultMarginCount = CameraMarks.countUsedDefaultMarginArtboards(lineSummary.artboards);

    if (request.overwroteExistingLayer === true) {
        parts.push("Overwrote existing camera_marks layer.");
    }

    parts.push("Camera Marks complete.");
    parts.push("Target: " + request.targetLabel + ".");

    if (request.mode === "smart") {
        if (request.targetIndexes.length === 1 && primaryLineArtboard && primaryLineArtboard.smartApplied) {
            parts.push(
                "Smart Line: " +
                CameraMarks.formatMm(primaryLineArtboard.targetWidthMm) + " x " +
                CameraMarks.formatMm(primaryLineArtboard.targetHeightMm) + " mm from selection size " +
                CameraMarks.formatMm(primaryLineArtboard.selectionWidthMm) + " x " +
                CameraMarks.formatMm(primaryLineArtboard.selectionHeightMm) + " mm."
            );
        } else {
            if (request.smartLine && request.smartLine.selectionWidthMm !== null && request.smartLine.selectionHeightMm !== null) {
                parts.push(
                    "Selection size: " +
                    CameraMarks.formatMm(request.smartLine.selectionWidthMm) + " x " +
                    CameraMarks.formatMm(request.smartLine.selectionHeightMm) + " mm."
                );
            }

            if (lineSmartAppliedCount > 0) {
                parts.push("Smart Line applied on " + lineSmartAppliedCount + " artboard(s).");
            }
            if (lineDefaultMarginCount > 0) {
                parts.push("Default 7 x 7 mm used on " + lineDefaultMarginCount + " artboard(s).");
            }
        }
    } else {
        if (request.mode === "line" || request.mode === "both") {
            parts.push(
                "Line: " + lineSummary.drawnCount + " mark(s) on " + lineSummary.artboardCount +
                " artboard(s) at " + CameraMarks.formatMm(request.lineOffsetXMm) + " x " +
                CameraMarks.formatMm(request.lineOffsetYMm) + " mm."
            );
        }
    }

    if (request.mode === "smart" && lineSummary.artboardCount > 0) {
        parts.push(
            "Line: " + lineSummary.drawnCount + " mark(s) on " + lineSummary.artboardCount + " artboard(s)."
        );
    }

    if ((request.mode === "smart" || request.mode === "line" || request.mode === "both") && lineSummary.rotatedCount > 0) {
        parts.push("Line rotated on " + lineSummary.rotatedCount + " artboard(s).");
    }
    if ((request.mode === "smart" || request.mode === "line" || request.mode === "both") && lineSummary.blockedArtboards.length > 0) {
        parts.push("Line skipped oversized artboards: " + CameraMarks.joinBlockedArtboards(lineSummary.blockedArtboards) + ".");
    }

    if (request.mode === "round" || request.mode === "both") {
        parts.push(
            "Round: " + roundSummary.drawnCount + " mark(s) on " + roundSummary.artboardCount +
            " artboard(s) at " + CameraMarks.formatMm(request.roundOffsetXMm) + " x " +
            CameraMarks.formatMm(request.roundOffsetYMm) + " mm."
        );
    }

    return parts.join(" ");
};

CameraMarks.buildEmptyMessage = function (request, lineSummary, roundSummary) {
    var prefix = request.overwroteExistingLayer === true
        ? "Existing camera_marks layer was overwritten. "
        : "";

    if ((request.mode === "smart" || request.mode === "line" || request.mode === "both") && lineSummary.blockedArtboards.length > 0) {
        if (request.mode === "smart") {
            return prefix + "No smart line camera marks were drawn. Oversized artboards: " + CameraMarks.joinBlockedArtboards(lineSummary.blockedArtboards) + ".";
        }
        if (request.mode === "line") {
            return prefix + "No line camera marks were drawn. Oversized artboards: " + CameraMarks.joinBlockedArtboards(lineSummary.blockedArtboards) + ".";
        }
        return prefix + "No camera marks were drawn. Line artboards were oversized and no round marks were produced.";
    }

    return prefix + "No camera marks were drawn.";
};

CameraMarks.getPrimaryArtboardSummary = function (summary) {
    if (!summary || !summary.artboards || summary.artboards.length === 0) {
        return null;
    }

    return summary.artboards[0];
};

CameraMarks.countSmartAppliedArtboards = function (artboards) {
    var count = 0;
    var i;

    if (!artboards) {
        return 0;
    }

    for (i = 0; i < artboards.length; i += 1) {
        if (artboards[i].smartApplied) {
            count += 1;
        }
    }

    return count;
};

CameraMarks.countUsedDefaultMarginArtboards = function (artboards) {
    var count = 0;
    var i;

    if (!artboards) {
        return 0;
    }

    for (i = 0; i < artboards.length; i += 1) {
        if (artboards[i].usedDefaultMargin) {
            count += 1;
        }
    }

    return count;
};

CameraMarks.joinBlockedArtboards = function (blocked) {
    var parts = [];
    var i;

    for (i = 0; i < blocked.length; i += 1) {
        parts.push(
            String(blocked[i].artboardIndex + 1) +
            " (" + CameraMarks.formatMm(blocked[i].widthMm) + " x " + CameraMarks.formatMm(blocked[i].heightMm) + " mm)"
        );
    }

    return parts.join(", ");
};

CameraMarks.formatMm = function (value) {
    return String(Math.round(value * 10) / 10);
};
