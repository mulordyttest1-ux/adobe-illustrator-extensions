#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Hay mo mot file Illustrator truoc.");
        return;
    }

    var doc = app.activeDocument;
    runExactDrawMode(doc);
})();

function runExactDrawMode(doc) {
    var maxWidthMm = 330;
    var activeIndex = doc.artboards.getActiveArtboardIndex();
    var targetInput = prompt(
        "Artboard dich:\n0 = Tat ca artboard\nHoac nhap so 1-" + doc.artboards.length,
        String(activeIndex + 1)
    );
    if (targetInput === null) {
        return;
    }

    var targetIndexes = resolveTargetIndexesForDraw(targetInput, doc.artboards.length);
    if (!targetIndexes) {
        alert("Artboard dich khong hop le.");
        return;
    }
    if (targetIndexes.length === 0) {
        alert("Khong co artboard dich nao de xu ly.");
        return;
    }

    var markLayer = doc.activeLayer;
    var i;
    var drawn = 0;
    var drawnArtboards = 0;
    var rotatedCount = 0;
    var blocked = [];

    for (i = 0; i < targetIndexes.length; i++) {
        var artboardIndex = targetIndexes[i];
        var rect = getArtboardRect(doc, artboardIndex);
        var status = getMachineWidthStatus(rect, maxWidthMm);
        var group;

        if (status.blocked) {
            blocked.push({
                artboardIndex: artboardIndex,
                widthMm: status.widthMm,
                heightMm: status.heightMm
            });
            continue;
        }

        removeMarksForArtboard(doc, artboardIndex);
        group = getOrCreateMarkGroupForArtboard(markLayer, artboardIndex);
        drawExactSampleMarks(group, rect, status.rotateMarkPattern);
        if (status.rotateMarkPattern) {
            rotatedCount++;
        }
        drawn += 6;
        drawnArtboards++;
    }

    app.redraw();
    if (drawnArtboards === 0) {
        alert(buildMachineLimitMessage(maxWidthMm, blocked));
        return;
    }
    alert(buildDrawResultMessage(drawn, drawnArtboards, maxWidthMm, rotatedCount, blocked));
}

function drawExactSampleMarks(group, rect, rotatePattern) {
    var offset = mmToPt(7);
    var pointSize = mmToPt(5);
    var strokeWidth = mmToPt(0.4);
    var color = getProcessBlackColor();

    addExactL(
        group,
        [
            [rect.left + offset + pointSize, rect.top - offset],
            [rect.left + offset, rect.top - offset],
            [rect.left + offset, rect.top - offset - pointSize]
        ],
        color,
        strokeWidth
    );

    addExactL(
        group,
        [
            [rect.right - offset - pointSize, rect.top - offset],
            [rect.right - offset, rect.top - offset],
            [rect.right - offset, rect.top - offset - pointSize]
        ],
        color,
        strokeWidth
    );

    addExactL(
        group,
        [
            [rect.right - offset - pointSize, rect.bottom + offset],
            [rect.right - offset, rect.bottom + offset],
            [rect.right - offset, rect.bottom + offset + pointSize]
        ],
        color,
        strokeWidth
    );

    addExactL(
        group,
        [
            [rect.left + offset + pointSize, rect.bottom + offset],
            [rect.left + offset, rect.bottom + offset],
            [rect.left + offset, rect.bottom + offset + pointSize]
        ],
        color,
        strokeWidth
    );

    if (rotatePattern) {
        addExactLine(
            group,
            rect.right - offset,
            rect.top - mmToPt(17),
            rect.right - offset,
            rect.top - mmToPt(16.5),
            color,
            strokeWidth
        );

        addExactLine(
            group,
            rect.right - offset,
            rect.top - mmToPt(14.5),
            rect.right - offset,
            rect.top - mmToPt(14),
            color,
            strokeWidth
        );
        return;
    }

    addExactLine(
        group,
        rect.right - mmToPt(16.5),
        rect.bottom + offset,
        rect.right - mmToPt(17),
        rect.bottom + offset,
        color,
        strokeWidth
    );

    addExactLine(
        group,
        rect.right - mmToPt(14),
        rect.bottom + offset,
        rect.right - mmToPt(14.5),
        rect.bottom + offset,
        color,
        strokeWidth
    );
}

function addExactL(group, points, color, strokeWidth) {
    var path = group.pathItems.add();
    path.setEntirePath(points);
    styleExactMarkPath(path, color, strokeWidth);
    return path;
}

function addExactLine(group, x1, y1, x2, y2, color, strokeWidth) {
    var path = group.pathItems.add();
    path.setEntirePath([[x1, y1], [x2, y2]]);
    styleExactMarkPath(path, color, strokeWidth);
    return path;
}

function styleExactMarkPath(path, color, strokeWidth) {
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
    } catch (e) {}
}

function getOrCreateMarkGroupForArtboard(layer, artboardIndex) {
    var groupName = getMarkGroupName(artboardIndex);
    var rect = getArtboardRect(layer.parent, artboardIndex);
    var i;
    unlockForEdit(layer);

    for (i = 0; i < layer.groupItems.length; i++) {
        if (layer.groupItems[i].name === groupName && groupBelongsToArtboard(layer.groupItems[i], rect)) {
            unlockForEdit(layer.groupItems[i]);
            return layer.groupItems[i];
        }
    }

    var group = layer.groupItems.add();
    group.name = groupName;
    return group;
}

function removeMarksForArtboard(doc, artboardIndex) {
    var rect = getArtboardRect(doc, artboardIndex);
    var toRemove = [];
    var i;

    for (i = 0; i < doc.pathItems.length; i++) {
        var item = doc.pathItems[i];
        if (item.name !== "MKLINE") {
            continue;
        }
        if (!isNearArtboard(item.geometricBounds, rect)) {
            continue;
        }
        toRemove.push(item);
    }

    for (i = 0; i < toRemove.length; i++) {
        try {
            unlockForEdit(toRemove[i]);
            toRemove[i].remove();
        } catch (e) {}
    }

    cleanupEmptyMarkGroups(doc, artboardIndex);
}

function getArtboardRect(doc, artboardIndex) {
    var rect = doc.artboards[artboardIndex].artboardRect;
    return {
        left: rect[0],
        top: rect[1],
        right: rect[2],
        bottom: rect[3]
    };
}

function isNearArtboard(bounds, rect) {
    var centerX = (bounds[0] + bounds[2]) / 2;
    var centerY = (bounds[1] + bounds[3]) / 2;
    return centerX >= rect.left - 30 &&
        centerX <= rect.right + 30 &&
        centerY <= rect.top + 30 &&
        centerY >= rect.bottom - 30;
}

function resolveTargetIndexesForDraw(inputValue, artboardCount) {
    var trimmed = trimString(inputValue);
    var result = [];
    var i;

    if (trimmed === "0") {
        for (i = 0; i < artboardCount; i++) {
            result.push(i);
        }
        return result;
    }

    var single = parseArtboardNumber(trimmed, artboardCount);
    if (single === null) {
        return null;
    }

    result.push(single);
    return result;
}

function parseArtboardNumber(value, artboardCount) {
    var parsed = parseInt(trimString(value), 10);
    if (isNaN(parsed) || parsed < 1 || parsed > artboardCount) {
        return null;
    }
    return parsed - 1;
}

function getMarkGroupName(artboardIndex) {
    return "LMarkLine" + String(artboardIndex + 1);
}

function cleanupEmptyMarkGroups(doc, artboardIndex) {
    var expectedName = getMarkGroupName(artboardIndex);
    var i;

    for (i = doc.groupItems.length - 1; i >= 0; i--) {
        try {
            var group = doc.groupItems[i];
            if (group.name !== expectedName) {
                continue;
            }
            if (group.pageItems.length !== 0) {
                continue;
            }
            unlockForEdit(group);
            group.remove();
        } catch (e) {}
    }
}

function getMachineWidthStatus(rect, maxWidthMm) {
    var widthMm = ptToMm(rect.right - rect.left);
    var heightMm = ptToMm(rect.top - rect.bottom);

    return {
        widthMm: widthMm,
        heightMm: heightMm,
        rotateMarkPattern: widthMm > maxWidthMm + 0.05 && heightMm <= maxWidthMm + 0.05,
        blocked: widthMm > maxWidthMm + 0.05 && heightMm > maxWidthMm + 0.05
    };
}

function buildDrawResultMessage(drawn, artboardCount, maxWidthMm, rotatedCount, blocked) {
    var message = "Da ve " + drawn + " mark theo dung toa do file mau tren " + artboardCount + " artboard.";

    if (rotatedCount > 0) {
        message += "\nTu dong xoay 90 do pattern mark tren " + rotatedCount + " artboard de gioi han ngang " + maxWidthMm + " mm.";
    }
    if (blocked.length > 0) {
        message += "\nBo qua artboard qua kho: " + joinBlockedArtboards(blocked) + ".";
    }

    return message;
}

function buildMachineLimitMessage(maxWidthMm, blocked) {
    var message = "Khong co artboard nao nam trong gioi han ngang " + maxWidthMm + " mm.";
    if (blocked.length > 0) {
        message += "\nArtboard qua kho: " + joinBlockedArtboards(blocked) + ".";
    }

    return message;
}

function joinBlockedArtboards(blocked) {
    var parts = [];
    var i;

    for (i = 0; i < blocked.length; i++) {
        parts.push(
            String(blocked[i].artboardIndex + 1) +
            " (" + formatMm(blocked[i].widthMm) + " x " + formatMm(blocked[i].heightMm) + " mm)"
        );
    }

    return parts.join(", ");
}

function formatMm(value) {
    return String(Math.round(value * 10) / 10);
}

function groupBelongsToArtboard(group, rect) {
    var i;

    if (group.pageItems.length === 0) {
        return true;
    }

    for (i = 0; i < group.pathItems.length; i++) {
        if (group.pathItems[i].name !== "MKLINE") {
            continue;
        }
        if (!isNearArtboard(group.pathItems[i].geometricBounds, rect)) {
            return false;
        }
    }

    return true;
}

function unlockForEdit(item) {
    try {
        item.locked = false;
    } catch (e1) {}
    try {
        item.hidden = false;
    } catch (e2) {}
}

function getProcessBlackColor() {
    var cmyk = new CMYKColor();
    cmyk.cyan = 0;
    cmyk.magenta = 0;
    cmyk.yellow = 0;
    cmyk.black = 100;
    return cmyk;
}

function mmToPt(value) {
    return value * 2.834645669291339;
}

function ptToMm(value) {
    return value / 2.834645669291339;
}

function trimString(value) {
    return String(value).replace(/^\s+|\s+$/g, "");
}
