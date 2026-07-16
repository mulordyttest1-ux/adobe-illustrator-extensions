if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.executeSLine = function (selectionBounds, request, runContext) {
    var core;
    var verticalPath;
    var horizontalPath;

    if (!selectionBounds) {
        CutLines.throwError("CUT_LINES_SELECTION_BOUNDS_UNAVAILABLE", "Could not read the selection bounds for S-Line.");
    }

    core = CutLines.getCoreRect(selectionBounds, request.grid.cols, request.grid.rows);
    verticalPath = CutLines.buildVerticalSLine(runContext.strategyGroup, core, request.grid.cols, CutLines.mmToPt(request.extendMm), runContext.color);
    horizontalPath = CutLines.buildHorizontalSLine(runContext.strategyGroup, core, request.grid.rows, CutLines.mmToPt(request.extendMm), runContext.color);

    CutLines.applyMetadata(verticalPath, runContext.metadata);
    CutLines.applyMetadata(horizontalPath, runContext.metadata);

    return {
        createdCount: 2,
        skippedCount: 0,
        grid: {
            cols: request.grid.cols,
            rows: request.grid.rows,
            extendMm: request.extendMm
        }
    };
};

CutLines.getCoreRect = function (bounds, cols, rows) {
    var width = bounds.right - bounds.left;
    var height = bounds.top - bounds.bottom;
    var stepX = width / cols;
    var stepY = height / rows;

    if (stepX <= 0 || stepY <= 0) {
        CutLines.throwError("CUT_LINES_INVALID_GRID", "Selection bounds are too small for the requested S-Line grid.");
    }

    return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        stepX: stepX,
        stepY: stepY
    };
};

CutLines.buildVerticalSLine = function (group, core, cols, extendPt, color) {
    var points = [];
    var i;
    var x;

    for (i = cols; i >= 0; i -= 1) {
        x = core.left + (core.stepX * i);
        if (((cols - i) % 2) === 0) {
            points.push([x, core.bottom - extendPt]);
            points.push([x, core.top + extendPt]);
        } else {
            points.push([x, core.top + extendPt]);
            points.push([x, core.bottom - extendPt]);
        }
    }

    return CutLines.createSLinePath(group, points, color);
};

CutLines.buildHorizontalSLine = function (group, core, rows, extendPt, color) {
    var points = [];
    var i;
    var y;

    for (i = 0; i <= rows; i += 1) {
        y = core.bottom + (core.stepY * i);
        if ((i % 2) === 0) {
            points.push([core.left - extendPt, y]);
            points.push([core.right + extendPt, y]);
        } else {
            points.push([core.right + extendPt, y]);
            points.push([core.left - extendPt, y]);
        }
    }

    return CutLines.createSLinePath(group, points, color);
};

CutLines.createSLinePath = function (group, points, color) {
    var path = group.pathItems.add();
    path.setEntirePath(points);
    CutLines.stylePathItem(path, color);
    return path;
};
