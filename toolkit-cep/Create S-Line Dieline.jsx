#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Hay mo mot file Illustrator truoc.");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) {
        alert("Hay chon 1 doi tuong mau de lay kich thuoc 1 o.");
        return;
    }

    var gridInput = prompt(
        "Nhap so cot x so dong (vi du: 7x15)",
        "7x15"
    );
    if (gridInput === null) {
        return;
    }

    var grid = parseGridInput(gridInput);
    if (!grid) {
        alert("Gia tri cot x dong khong hop le.");
        return;
    }

    var extendInput = prompt("Extend (mm):", "3");
    if (extendInput === null) {
        return;
    }

    var extendMm = parseFloat(trimString(extendInput));
    if (isNaN(extendMm) || extendMm < 0) {
        alert("Gia tri extend khong hop le.");
        return;
    }

    var cellBounds = getCombinedGeometricBounds(doc.selection);
    if (!cellBounds) {
        alert("Khong doc duoc kich thuoc doi tuong mau.");
        return;
    }

    var traceStrokeWidth = 1;
    var cellWidth = cellBounds.right - cellBounds.left;
    var cellHeight = cellBounds.top - cellBounds.bottom;
    var stepX = cellWidth - traceStrokeWidth;
    var stepY = cellHeight - traceStrokeWidth;

    if (stepX <= 0 || stepY <= 0) {
        alert("Kich thuoc o mau qua nho de tao S-line.");
        return;
    }

    var artboardIndex = doc.artboards.getActiveArtboardIndex();
    var artRect = getArtboardRect(doc, artboardIndex);
    var traceLayer = getOrCreateLayer(doc, "TraceLayer");

    removeTraceLinesForArtboard(doc, traceLayer, artRect);

    var traceGroup = traceLayer.groupItems.add();
    traceGroup.name = "TRACELINE";

    var traceColor = getTraceLineColor();
    var core = getCoreRect(artRect, stepX, stepY, grid.cols, grid.rows);
    var extendPt = mmToPt(extendMm);

    buildVerticalSLine(traceGroup, core, grid.cols, extendPt, traceColor, traceStrokeWidth);
    buildHorizontalSLine(traceGroup, core, grid.rows, extendPt, traceColor, traceStrokeWidth);

    app.redraw();
    alert(
        "Da tao duong be S-line tren artboard " + (artboardIndex + 1) +
        ".\nCot x dong: " + grid.cols + " x " + grid.rows +
        "\nExtend: " + formatNumber(extendMm) + " mm"
    );
})();

function buildVerticalSLine(group, core, cols, extendPt, color, strokeWidth) {
    var points = [];
    var i;
    var x;

    for (i = cols; i >= 0; i--) {
        x = core.left + (core.stepX * i);
        if (((cols - i) % 2) === 0) {
            points.push([x, core.bottom - extendPt]);
            points.push([x, core.top + extendPt]);
        } else {
            points.push([x, core.top + extendPt]);
            points.push([x, core.bottom - extendPt]);
        }
    }

    createTracePath(group, points, color, strokeWidth);
}

function buildHorizontalSLine(group, core, rows, extendPt, color, strokeWidth) {
    var points = [];
    var i;
    var y;

    for (i = 0; i <= rows; i++) {
        y = core.bottom + (core.stepY * i);
        if ((i % 2) === 0) {
            points.push([core.left - extendPt, y]);
            points.push([core.right + extendPt, y]);
        } else {
            points.push([core.right + extendPt, y]);
            points.push([core.left - extendPt, y]);
        }
    }

    createTracePath(group, points, color, strokeWidth);
}

function createTracePath(group, points, color, strokeWidth) {
    var path = group.pathItems.add();
    path.setEntirePath(points);
    path.name = "TRACELINE";
    path.closed = false;
    path.filled = false;
    path.stroked = true;
    path.strokeWidth = strokeWidth;
    path.strokeColor = color;
    path.strokeCap = StrokeCap.BUTTENDCAP;
    path.strokeJoin = StrokeJoin.MITERENDJOIN;
    path.strokeMiterLimit = 10;
    path.opacity = 100;
    try {
        path.strokeDashes = [];
        path.strokeDashOffset = 0;
    } catch (e) {}
    return path;
}

function getCoreRect(artRect, stepX, stepY, cols, rows) {
    var coreWidth = stepX * cols;
    var coreHeight = stepY * rows;
    var centerX = (artRect.left + artRect.right) / 2;
    var centerY = (artRect.top + artRect.bottom) / 2;

    return {
        left: centerX - (coreWidth / 2),
        top: centerY + (coreHeight / 2),
        right: centerX + (coreWidth / 2),
        bottom: centerY - (coreHeight / 2),
        stepX: stepX,
        stepY: stepY
    };
}

function removeTraceLinesForArtboard(doc, layer, artRect) {
    var groupsToRemove = [];
    var loosePaths = [];
    var i;

    for (i = 0; i < layer.groupItems.length; i++) {
        var group = layer.groupItems[i];
        if (group.name !== "TRACELINE") {
            continue;
        }
        if (!groupBelongsToArtboard(group, artRect)) {
            continue;
        }
        groupsToRemove.push(group);
    }

    for (i = 0; i < doc.pathItems.length; i++) {
        var path = doc.pathItems[i];
        if (path.name !== "TRACELINE") {
            continue;
        }
        if (path.layer !== layer) {
            continue;
        }
        if (path.parent.typename === "GroupItem") {
            continue;
        }
        if (!isNearArtboard(path.geometricBounds, artRect)) {
            continue;
        }
        loosePaths.push(path);
    }

    for (i = 0; i < loosePaths.length; i++) {
        try {
            unlockForEdit(loosePaths[i]);
            loosePaths[i].remove();
        } catch (e1) {}
    }

    for (i = 0; i < groupsToRemove.length; i++) {
        try {
            unlockForEdit(groupsToRemove[i]);
            groupsToRemove[i].remove();
        } catch (e2) {}
    }
}

function getCombinedGeometricBounds(items) {
    var bounds = null;
    var i;
    var itemBounds;

    for (i = 0; i < items.length; i++) {
        itemBounds = getItemGeometricBounds(items[i]);
        if (!itemBounds) {
            continue;
        }
        if (!bounds) {
            bounds = itemBounds;
        } else {
            bounds.left = Math.min(bounds.left, itemBounds.left);
            bounds.top = Math.max(bounds.top, itemBounds.top);
            bounds.right = Math.max(bounds.right, itemBounds.right);
            bounds.bottom = Math.min(bounds.bottom, itemBounds.bottom);
        }
    }

    return bounds;
}

function getItemGeometricBounds(item) {
    try {
        var bounds = item.geometricBounds;
        return {
            left: bounds[0],
            top: bounds[1],
            right: bounds[2],
            bottom: bounds[3]
        };
    } catch (e) {
        return null;
    }
}

function getTraceLineColor() {
    var cmyk = new CMYKColor();
    cmyk.cyan = 0;
    cmyk.magenta = 100;
    cmyk.yellow = 100;
    cmyk.black = 0;
    return cmyk;
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

function groupBelongsToArtboard(group, rect) {
    var bounds;

    try {
        bounds = group.geometricBounds;
    } catch (e) {
        return false;
    }

    return isNearArtboard(bounds, rect);
}

function isNearArtboard(bounds, rect) {
    var centerX = (bounds[0] + bounds[2]) / 2;
    var centerY = (bounds[1] + bounds[3]) / 2;
    return centerX >= rect.left - 30 &&
        centerX <= rect.right + 30 &&
        centerY <= rect.top + 30 &&
        centerY >= rect.bottom - 30;
}

function parseGridInput(value) {
    var normalized = trimString(value).toLowerCase().replace(/\s+/g, "");
    var parts = normalized.split("x");
    var cols;
    var rows;

    if (parts.length !== 2) {
        return null;
    }

    cols = parseInt(parts[0], 10);
    rows = parseInt(parts[1], 10);

    if (isNaN(cols) || isNaN(rows) || cols <= 0 || rows <= 0) {
        return null;
    }

    return {
        cols: cols,
        rows: rows
    };
}

function unlockForEdit(item) {
    try {
        item.locked = false;
    } catch (e1) {}
    try {
        item.hidden = false;
    } catch (e2) {}
}

function mmToPt(value) {
    return value * 2.834645669291339;
}

function trimString(value) {
    return String(value).replace(/^\s+|\s+$/g, "");
}

function formatNumber(value) {
    return String(Math.round(value * 1000) / 1000);
}
