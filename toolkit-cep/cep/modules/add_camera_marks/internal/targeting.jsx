if (!$.global.__TOOLKIT_CAMERA_MARKS__) {
    throw new Error("Camera Marks namespace was not initialized.");
}

var CameraMarks = $.global.__TOOLKIT_CAMERA_MARKS__;

CameraMarks.getArtboardRect = function (doc, artboardIndex) {
    var rect = doc.artboards[artboardIndex].artboardRect;
    return {
        left: rect[0],
        top: rect[1],
        right: rect[2],
        bottom: rect[3]
    };
};

CameraMarks.resolveTargetRect = function (doc, artboardIndex, request) {
    return CameraMarks.getArtboardRect(doc, artboardIndex);
};

CameraMarks.getSelectionRect = function (doc) {
    var selection = doc && doc.selection ? doc.selection : null;
    var rect = null;
    var i;

    if (!selection || selection.length === 0) {
        return null;
    }

    for (i = 0; i < selection.length; i += 1) {
        var itemBounds = CameraMarks.getPageItemBounds(selection[i]);
        if (!itemBounds) {
            continue;
        }

        if (!rect) {
            rect = itemBounds;
            continue;
        }

        rect.left = Math.min(rect.left, itemBounds.left);
        rect.top = Math.max(rect.top, itemBounds.top);
        rect.right = Math.max(rect.right, itemBounds.right);
        rect.bottom = Math.min(rect.bottom, itemBounds.bottom);
    }

    if (!rect || rect.right <= rect.left || rect.top <= rect.bottom) {
        return null;
    }

    return rect;
};

CameraMarks.getPageItemBounds = function (item) {
    var bounds;

    if (!item) {
        return null;
    }

    try {
        bounds = item.visibleBounds;
    } catch (visibleError) {
        bounds = null;
    }

    if (!bounds || bounds.length !== 4) {
        try {
            bounds = item.geometricBounds;
        } catch (geometricError) {
            bounds = null;
        }
    }

    if (!bounds || bounds.length !== 4) {
        return null;
    }

    return {
        left: bounds[0],
        top: bounds[1],
        right: bounds[2],
        bottom: bounds[3]
    };
};

CameraMarks.isNearArtboard = function (bounds, rect) {
    var centerX = (bounds[0] + bounds[2]) / 2;
    var centerY = (bounds[1] + bounds[3]) / 2;

    return centerX >= rect.left - 30 &&
        centerX <= rect.right + 30 &&
        centerY <= rect.top + 30 &&
        centerY >= rect.bottom - 30;
};

CameraMarks.groupBelongsToArtboard = function (group, rect) {
    var i;

    if (group.pageItems.length === 0) {
        return true;
    }

    for (i = 0; i < group.pathItems.length; i += 1) {
        if (group.pathItems[i].name !== "MKLINE") {
            continue;
        }
        if (!CameraMarks.isNearArtboard(group.pathItems[i].geometricBounds, rect)) {
            return false;
        }
    }

    return true;
};

CameraMarks.createSmartLineSeed = function (doc) {
    var defaultLineOffsetMm = 7;
    var smartPaddingMm = 10;
    var selectionRect = CameraMarks.getSelectionRect(doc);
    var smartLine = {
        defaultLineOffsetMm: defaultLineOffsetMm,
        smartPaddingMm: smartPaddingMm,
        selectionWidthMm: null,
        selectionHeightMm: null,
        targetWidthMm: null,
        targetHeightMm: null
    };

    if (selectionRect) {
        smartLine.selectionWidthMm = CameraMarks.ptToMm(selectionRect.right - selectionRect.left);
        smartLine.selectionHeightMm = CameraMarks.ptToMm(selectionRect.top - selectionRect.bottom);
        smartLine.targetWidthMm = smartLine.selectionWidthMm + smartPaddingMm;
        smartLine.targetHeightMm = smartLine.selectionHeightMm + smartPaddingMm;
    }

    return smartLine;
};

CameraMarks.createSmartLinePlanForArtboard = function (doc, artboardIndex, smartLine) {
    var artboardRect = CameraMarks.getArtboardRect(doc, artboardIndex);
    var artboardWidthMm = CameraMarks.ptToMm(artboardRect.right - artboardRect.left);
    var artboardHeightMm = CameraMarks.ptToMm(artboardRect.top - artboardRect.bottom);
    var defaultLineOffsetMm = smartLine.defaultLineOffsetMm;
    var defaultTargetWidthMm = artboardWidthMm - (defaultLineOffsetMm * 2);
    var defaultTargetHeightMm = artboardHeightMm - (defaultLineOffsetMm * 2);
    var smartTargetWidthMm = smartLine.targetWidthMm;
    var smartTargetHeightMm = smartLine.targetHeightMm;
    var plan = {
        offsetXMm: defaultLineOffsetMm,
        offsetYMm: defaultLineOffsetMm,
        smartApplied: false,
        usedDefaultMargin: true,
        fallbackReason: "No valid selection size was available.",
        selectionWidthMm: smartLine.selectionWidthMm,
        selectionHeightMm: smartLine.selectionHeightMm,
        targetWidthMm: defaultTargetWidthMm,
        targetHeightMm: defaultTargetHeightMm,
        defaultTargetWidthMm: defaultTargetWidthMm,
        defaultTargetHeightMm: defaultTargetHeightMm
    };

    if (smartTargetWidthMm !== null && smartTargetHeightMm !== null) {
        plan.targetWidthMm = smartTargetWidthMm;
        plan.targetHeightMm = smartTargetHeightMm;
        plan.fallbackReason = "Smart target was not smaller than the default 7 mm frame.";

        if (smartTargetWidthMm < defaultTargetWidthMm && smartTargetHeightMm < defaultTargetHeightMm) {
            plan.offsetXMm = (artboardWidthMm - smartTargetWidthMm) / 2;
            plan.offsetYMm = (artboardHeightMm - smartTargetHeightMm) / 2;
            plan.smartApplied = true;
            plan.usedDefaultMargin = false;
            plan.fallbackReason = "";
        }
    }

    return plan;
};
