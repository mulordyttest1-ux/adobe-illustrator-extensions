if (!$.global.__TOOLKIT_CAMERA_MARKS__) {
    throw new Error("Camera Marks namespace was not initialized.");
}

var CameraMarks = $.global.__TOOLKIT_CAMERA_MARKS__;

CameraMarks.drawLineForArtboard = function (doc, layer, artboardIndex, rect, request, summary) {
    var maxWidthMm = 330;
    var status = CameraMarks.getMachineWidthStatus(rect, maxWidthMm);
    var group;
    var linePlan = CameraMarks.resolveLinePlanForArtboard(doc, artboardIndex, request);

    if (status.blocked) {
        summary.blockedArtboards.push({
            artboardIndex: artboardIndex,
            widthMm: status.widthMm,
            heightMm: status.heightMm
        });
        return;
    }

    CameraMarks.removeLineForArtboard(doc, layer, artboardIndex);
    group = CameraMarks.getOrCreateLineGroup(layer, artboardIndex, rect);
    CameraMarks.drawLineMarks(
        group,
        rect,
        status.rotateMarkPattern,
        linePlan.offsetXMm,
        linePlan.offsetYMm
    );

    if (status.rotateMarkPattern) {
        summary.rotatedCount += 1;
    }
    summary.drawnCount += 6;
    summary.artboardCount += 1;
    summary.artboards.push({
        artboardIndex: artboardIndex,
        offsetXMm: linePlan.offsetXMm,
        offsetYMm: linePlan.offsetYMm,
        smartApplied: linePlan.smartApplied,
        usedDefaultMargin: linePlan.usedDefaultMargin,
        fallbackReason: linePlan.fallbackReason,
        selectionWidthMm: linePlan.selectionWidthMm,
        selectionHeightMm: linePlan.selectionHeightMm,
        targetWidthMm: linePlan.targetWidthMm,
        targetHeightMm: linePlan.targetHeightMm,
        defaultTargetWidthMm: linePlan.defaultTargetWidthMm,
        defaultTargetHeightMm: linePlan.defaultTargetHeightMm,
        rotated: status.rotateMarkPattern
    });
};

CameraMarks.resolveLinePlanForArtboard = function (doc, artboardIndex, request) {
    if (request.mode === "smart") {
        return CameraMarks.createSmartLinePlanForArtboard(doc, artboardIndex, request.smartLine);
    }

    return {
        offsetXMm: request.lineOffsetXMm,
        offsetYMm: request.lineOffsetYMm,
        smartApplied: false,
        usedDefaultMargin: false,
        fallbackReason: "",
        selectionWidthMm: null,
        selectionHeightMm: null,
        targetWidthMm: null,
        targetHeightMm: null,
        defaultTargetWidthMm: null,
        defaultTargetHeightMm: null
    };
};

CameraMarks.drawLineMarks = function (group, rect, rotatePattern, offsetXMm, offsetYMm) {
    var offsetX = CameraMarks.mmToPt(offsetXMm);
    var offsetY = CameraMarks.mmToPt(offsetYMm);
    var pointSize = CameraMarks.mmToPt(5);
    var strokeWidth = CameraMarks.mmToPt(0.4);
    var color = CameraMarks.getProcessBlackColor();

    CameraMarks.addLineL(
        group,
        [
            [rect.left + offsetX + pointSize, rect.top - offsetY],
            [rect.left + offsetX, rect.top - offsetY],
            [rect.left + offsetX, rect.top - offsetY - pointSize]
        ],
        color,
        strokeWidth
    );

    CameraMarks.addLineL(
        group,
        [
            [rect.right - offsetX - pointSize, rect.top - offsetY],
            [rect.right - offsetX, rect.top - offsetY],
            [rect.right - offsetX, rect.top - offsetY - pointSize]
        ],
        color,
        strokeWidth
    );

    CameraMarks.addLineL(
        group,
        [
            [rect.right - offsetX - pointSize, rect.bottom + offsetY],
            [rect.right - offsetX, rect.bottom + offsetY],
            [rect.right - offsetX, rect.bottom + offsetY + pointSize]
        ],
        color,
        strokeWidth
    );

    CameraMarks.addLineL(
        group,
        [
            [rect.left + offsetX + pointSize, rect.bottom + offsetY],
            [rect.left + offsetX, rect.bottom + offsetY],
            [rect.left + offsetX, rect.bottom + offsetY + pointSize]
        ],
        color,
        strokeWidth
    );

    if (rotatePattern) {
        CameraMarks.addLineSegment(
            group,
            rect.right - offsetX,
            rect.top - CameraMarks.mmToPt(17),
            rect.right - offsetX,
            rect.top - CameraMarks.mmToPt(16.5),
            color,
            strokeWidth
        );

        CameraMarks.addLineSegment(
            group,
            rect.right - offsetX,
            rect.top - CameraMarks.mmToPt(14.5),
            rect.right - offsetX,
            rect.top - CameraMarks.mmToPt(14),
            color,
            strokeWidth
        );
        return;
    }

    CameraMarks.addLineSegment(
        group,
        rect.right - CameraMarks.mmToPt(16.5),
        rect.bottom + offsetY,
        rect.right - CameraMarks.mmToPt(17),
        rect.bottom + offsetY,
        color,
        strokeWidth
    );

    CameraMarks.addLineSegment(
        group,
        rect.right - CameraMarks.mmToPt(14),
        rect.bottom + offsetY,
        rect.right - CameraMarks.mmToPt(14.5),
        rect.bottom + offsetY,
        color,
        strokeWidth
    );
};

CameraMarks.addLineL = function (group, points, color, strokeWidth) {
    var path = group.pathItems.add();
    path.setEntirePath(points);
    CameraMarks.styleLinePath(path, color, strokeWidth);
    return path;
};

CameraMarks.addLineSegment = function (group, x1, y1, x2, y2, color, strokeWidth) {
    var path = group.pathItems.add();
    path.setEntirePath([[x1, y1], [x2, y2]]);
    CameraMarks.styleLinePath(path, color, strokeWidth);
    return path;
};

CameraMarks.styleLinePath = function (path, color, strokeWidth) {
    path.name = "MKLINE";
    path.closed = false;
    path.filled = false;
    path.stroked = true;
    path.strokeWidth = strokeWidth;
    path.strokeColor = color;
    path.strokeCap = StrokeCap.BUTTENDCAP;
    path.strokeJoin = StrokeJoin.MITERENDJOIN;
    path.strokeMiterLimit = 4;
    path.opacity = 100;
    try {
        path.strokeDashes = [];
        path.strokeDashOffset = 0;
    } catch (error) {}
};

CameraMarks.getOrCreateLineGroup = function (layer, artboardIndex, rect) {
    var groupName = CameraMarks.getLineGroupName(artboardIndex);
    var i;

    CameraMarks.unlockItem(layer);

    for (i = 0; i < layer.groupItems.length; i += 1) {
        if (layer.groupItems[i].name === groupName && CameraMarks.groupBelongsToArtboard(layer.groupItems[i], rect)) {
            CameraMarks.unlockItem(layer.groupItems[i]);
            return layer.groupItems[i];
        }
    }

    var group = layer.groupItems.add();
    group.name = groupName;
    return group;
};

CameraMarks.removeLineForArtboard = function (doc, layer, artboardIndex) {
    var groupName = CameraMarks.getLineGroupName(artboardIndex);
    var artboardRect = CameraMarks.getArtboardRect(doc, artboardIndex);
    var loosePaths = [];
    var i;

    for (i = layer.groupItems.length - 1; i >= 0; i -= 1) {
        try {
            var group = layer.groupItems[i];
            if (group.name !== groupName) {
                continue;
            }
            CameraMarks.unlockItem(group);
            group.remove();
        } catch (error1) {}
    }

    for (i = 0; i < layer.pathItems.length; i += 1) {
        var item = layer.pathItems[i];
        if (!CameraMarks.isLinePath(item)) {
            continue;
        }
        if (!CameraMarks.isNearArtboard(item.geometricBounds, artboardRect)) {
            continue;
        }
        loosePaths.push(item);
    }

    for (i = 0; i < loosePaths.length; i += 1) {
        try {
            CameraMarks.unlockItem(loosePaths[i]);
            loosePaths[i].remove();
        } catch (error2) {}
    }
};

CameraMarks.isLinePath = function (item) {
    return item.name === "MKLINE" && item.closed === false;
};

CameraMarks.getLineGroupName = function (artboardIndex) {
    return "LMarkLine" + String(artboardIndex + 1);
};

CameraMarks.getMachineWidthStatus = function (rect, maxWidthMm) {
    var widthMm = CameraMarks.ptToMm(rect.right - rect.left);
    var heightMm = CameraMarks.ptToMm(rect.top - rect.bottom);

    return {
        widthMm: widthMm,
        heightMm: heightMm,
        rotateMarkPattern: widthMm > maxWidthMm + 0.05 && heightMm <= maxWidthMm + 0.05,
        blocked: widthMm > maxWidthMm + 0.05 && heightMm > maxWidthMm + 0.05
    };
};
