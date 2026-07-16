if (!$.global.__TOOLKIT_CAMERA_MARKS__) {
    throw new Error("Camera Marks namespace was not initialized.");
}

var CameraMarks = $.global.__TOOLKIT_CAMERA_MARKS__;

CameraMarks.drawRoundForArtboard = function (doc, layer, artboardIndex, rect, request, summary) {
    var group;

    CameraMarks.removeRoundForArtboard(doc, layer, artboardIndex);
    group = CameraMarks.getOrCreateRoundGroup(layer, artboardIndex, rect);
    CameraMarks.drawRoundMarks(
        group,
        rect,
        request.roundOffsetXMm,
        request.roundOffsetYMm
    );
    summary.drawnCount += 4;
    summary.artboardCount += 1;
    summary.artboards.push({
        artboardIndex: artboardIndex,
        offsetXMm: request.roundOffsetXMm,
        offsetYMm: request.roundOffsetYMm
    });
};

CameraMarks.drawRoundMarks = function (group, rect, offsetXMm, offsetYMm) {
    var offsetX = CameraMarks.mmToPt(offsetXMm);
    var offsetY = CameraMarks.mmToPt(offsetYMm);
    var diameter = CameraMarks.mmToPt(5);
    var color = CameraMarks.getProcessBlackColor();

    CameraMarks.addRoundCircle(
        group,
        rect.left + offsetX,
        rect.top - offsetY,
        diameter,
        color
    );

    CameraMarks.addRoundCircle(
        group,
        rect.right - offsetX - diameter,
        rect.top - offsetY,
        diameter,
        color
    );

    CameraMarks.addRoundCircle(
        group,
        rect.right - offsetX - diameter,
        rect.bottom + offsetY + diameter,
        diameter,
        color
    );

    CameraMarks.addRoundCircle(
        group,
        rect.left + offsetX,
        rect.bottom + offsetY + diameter,
        diameter,
        color
    );
};

CameraMarks.addRoundCircle = function (group, left, top, diameter, color) {
    var path = group.pathItems.ellipse(top, left, diameter, diameter, false, true);
    CameraMarks.styleRoundPath(path, color);
    return path;
};

CameraMarks.styleRoundPath = function (path, color) {
    path.name = "MKLINE";
    path.closed = true;
    path.filled = true;
    path.fillColor = color;
    path.stroked = false;
    path.opacity = 100;
};

CameraMarks.getOrCreateRoundGroup = function (layer, artboardIndex, rect) {
    var groupName = CameraMarks.getRoundGroupName(artboardIndex);
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

CameraMarks.removeRoundForArtboard = function (doc, layer, artboardIndex) {
    var groupName = CameraMarks.getRoundGroupName(artboardIndex);
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

    for (i = 0; i < doc.pathItems.length; i += 1) {
        var item = doc.pathItems[i];
        if (!CameraMarks.isRoundPath(item)) {
            continue;
        }
        if (item.layer !== layer) {
            continue;
        }
        if (item.parent.typename === "GroupItem") {
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

CameraMarks.isRoundPath = function (item) {
    return item.name === "MKLINE" && item.closed === true;
};

CameraMarks.getRoundGroupName = function (artboardIndex) {
    return "MarkLine" + String(artboardIndex + 1);
};
