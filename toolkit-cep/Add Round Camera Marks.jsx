#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Hay mo mot file Illustrator truoc.");
        return;
    }

    var doc = app.activeDocument;
    runExactRoundDrawMode(doc);
})();

function runExactRoundDrawMode(doc) {
    var activeIndex = doc.artboards.getActiveArtboardIndex();
    var targetInput = prompt(
        "Artboard dich cho mark tron:\n0 = Tat ca artboard\nHoac nhap so 1-" + doc.artboards.length,
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

    var markLayer = getOrCreateLayer(doc, "die_marks");
    var i;
    var drawn = 0;

    for (i = 0; i < targetIndexes.length; i++) {
        removeRoundMarksForArtboard(doc, markLayer, targetIndexes[i]);
        drawExactRoundMarks(
            getOrCreateRoundMarkGroupForArtboard(markLayer, targetIndexes[i]),
            getArtboardRect(doc, targetIndexes[i])
        );
        drawn += 4;
    }

    app.redraw();
    alert(
        "Da ve " + drawn + " mark tron theo dung file mau tren " +
        targetIndexes.length + " artboard."
    );
}

function drawExactRoundMarks(group, rect) {
    var edgeMargin = mmToPt(7.5);
    var diameter = mmToPt(5);
    var color = getProcessBlackColor();

    addExactCircle(
        group,
        rect.left + edgeMargin,
        rect.top - edgeMargin,
        diameter,
        color
    );

    addExactCircle(
        group,
        rect.right - edgeMargin - diameter,
        rect.top - edgeMargin,
        diameter,
        color
    );

    addExactCircle(
        group,
        rect.right - edgeMargin - diameter,
        rect.bottom + edgeMargin + diameter,
        diameter,
        color
    );

    addExactCircle(
        group,
        rect.left + edgeMargin,
        rect.bottom + edgeMargin + diameter,
        diameter,
        color
    );
}

function addExactCircle(group, left, top, diameter, color) {
    var path = group.pathItems.ellipse(top, left, diameter, diameter, false, true);
    styleExactRoundMarkPath(path, color);
    return path;
}

function styleExactRoundMarkPath(path, color) {
    path.name = "MKLINE";
    path.closed = true;
    path.filled = true;
    path.fillColor = color;
    path.stroked = false;
    path.opacity = 100;
}

function getOrCreateRoundMarkGroupForArtboard(layer, artboardIndex) {
    var groupName = getRoundMarkGroupName(artboardIndex);
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

function removeRoundMarksForArtboard(doc, layer, artboardIndex) {
    var rect = getArtboardRect(doc, artboardIndex);
    var groupName = getRoundMarkGroupName(artboardIndex);
    var loosePaths = [];
    var i;

    for (i = layer.groupItems.length - 1; i >= 0; i--) {
        try {
            var group = layer.groupItems[i];
            if (group.name !== groupName) {
                continue;
            }
            if (!groupBelongsToArtboard(group, rect) && group.pageItems.length !== 0) {
                continue;
            }
            unlockForEdit(group);
            group.remove();
        } catch (e1) {}
    }

    for (i = 0; i < doc.pathItems.length; i++) {
        var item = doc.pathItems[i];
        if (item.name !== "MKLINE") {
            continue;
        }
        if (item.layer !== layer) {
            continue;
        }
        if (item.parent.typename === "GroupItem") {
            continue;
        }
        if (!isNearArtboard(item.geometricBounds, rect)) {
            continue;
        }
        loosePaths.push(item);
    }

    for (i = 0; i < loosePaths.length; i++) {
        try {
            unlockForEdit(loosePaths[i]);
            loosePaths[i].remove();
        } catch (e2) {}
    }
}

function getOrCreateLayer(doc, layerName) {
    var i;
    for (i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === layerName) {
            unlockForEdit(doc.layers[i]);
            return doc.layers[i];
        }
    }

    var layer = doc.layers.add();
    layer.name = layerName;
    unlockForEdit(layer);
    return layer;
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

function getRoundMarkGroupName(artboardIndex) {
    return "MarkLine" + String(artboardIndex + 1);
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

function trimString(value) {
    return String(value).replace(/^\s+|\s+$/g, "");
}
