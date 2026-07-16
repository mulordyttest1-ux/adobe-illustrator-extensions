if (!$.global.__TOOLKIT_STEP_REPEAT_SYMBOL__) {
    throw new Error("Step Repeat Symbol namespace was not initialized.");
}

var StepRepeat = $.global.__TOOLKIT_STEP_REPEAT_SYMBOL__;

StepRepeat.geometryTolerance = 0.05;

StepRepeat.cloneBounds = function (bounds) {
    return [
        Number(bounds[0]),
        Number(bounds[1]),
        Number(bounds[2]),
        Number(bounds[3])
    ];
};

StepRepeat.getBoundsWidth = function (bounds) {
    return Number(bounds[2]) - Number(bounds[0]);
};

StepRepeat.getBoundsHeight = function (bounds) {
    return Number(bounds[1]) - Number(bounds[3]);
};

StepRepeat.getBoundsCenter = function (bounds) {
    return [
        (Number(bounds[0]) + Number(bounds[2])) / 2,
        (Number(bounds[1]) + Number(bounds[3])) / 2
    ];
};

StepRepeat.getItemGeometricBounds = function (item) {
    var bounds;
    var index;
    var result = [];

    try {
        bounds = item.geometricBounds;
    } catch (error) {
        bounds = null;
    }

    if (!bounds || bounds.length !== 4) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_UNSUPPORTED_ITEM",
            "Geometric bounds are unavailable."
        );
    }

    for (index = 0; index < 4; index += 1) {
        result.push(Number(bounds[index]));
    }

    return result;
};

StepRepeat.getCombinedGeometricBounds = function (items) {
    var bounds = null;
    var itemBounds;
    var index;

    for (index = 0; index < items.length; index += 1) {
        itemBounds = StepRepeat.getItemGeometricBounds(items[index]);

        if (!bounds) {
            bounds = StepRepeat.cloneBounds(itemBounds);
        } else {
            bounds[0] = Math.min(bounds[0], itemBounds[0]);
            bounds[1] = Math.max(bounds[1], itemBounds[1]);
            bounds[2] = Math.max(bounds[2], itemBounds[2]);
            bounds[3] = Math.min(bounds[3], itemBounds[3]);
        }
    }

    if (!bounds) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_NEEDS_SELECTION",
            StepRepeat.selectionErrorMessage
        );
    }

    return bounds;
};

StepRepeat.getActiveArtboardInfo = function (doc) {
    var index;
    var artboard;
    var bounds;

    if (!doc.artboards || !doc.artboards.length) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_NO_ACTIVE_ARTBOARD",
            "Active artboard is unavailable."
        );
    }

    index = doc.artboards.getActiveArtboardIndex();
    artboard = doc.artboards[index];
    bounds = artboard.artboardRect;

    return {
        index: index,
        bounds: [
            Number(bounds[0]),
            Number(bounds[1]),
            Number(bounds[2]),
            Number(bounds[3])
        ],
        width: Number(bounds[2]) - Number(bounds[0]),
        height: Number(bounds[1]) - Number(bounds[3]),
        center: [
            (Number(bounds[0]) + Number(bounds[2])) / 2,
            (Number(bounds[1]) + Number(bounds[3])) / 2
        ]
    };
};

StepRepeat.getPrintableArtboardInfo = function (artboardInfo, marginPt) {
    var insetBounds = [
        Number(artboardInfo.bounds[0]) + Number(marginPt),
        Number(artboardInfo.bounds[1]) - Number(marginPt),
        Number(artboardInfo.bounds[2]) - Number(marginPt),
        Number(artboardInfo.bounds[3]) + Number(marginPt)
    ];
    var printableWidth = Number(insetBounds[2]) - Number(insetBounds[0]);
    var printableHeight = Number(insetBounds[1]) - Number(insetBounds[3]);

    if (printableWidth <= StepRepeat.geometryTolerance || printableHeight <= StepRepeat.geometryTolerance) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_INVALID_MARGIN",
            "Margin leaves no printable area on the active artboard.",
            {
                marginPt: marginPt,
                artboardBounds: StepRepeat.cloneBounds(artboardInfo.bounds)
            }
        );
    }

    return {
        bounds: insetBounds,
        width: printableWidth,
        height: printableHeight,
        center: [
            (Number(insetBounds[0]) + Number(insetBounds[2])) / 2,
            (Number(insetBounds[1]) + Number(insetBounds[3])) / 2
        ]
    };
};

StepRepeat.calculateFitCount = function (artboardInfo, cellWidth, cellHeight, gapPt) {
    var cols;
    var rows;

    cols = Math.floor((artboardInfo.width + gapPt + StepRepeat.geometryTolerance) / (cellWidth + gapPt));
    rows = Math.floor((artboardInfo.height + gapPt + StepRepeat.geometryTolerance) / (cellHeight + gapPt));

    if (cols < 0) {
        cols = 0;
    }
    if (rows < 0) {
        rows = 0;
    }

    return {
        cols: cols,
        rows: rows,
        count: cols * rows
    };
};

StepRepeat.orientationFitsSingleCell = function (artboardInfo, cellWidth, cellHeight) {
    return (
        cellWidth <= artboardInfo.width + StepRepeat.geometryTolerance &&
        cellHeight <= artboardInfo.height + StepRepeat.geometryTolerance
    );
};

StepRepeat.chooseOrientation = function (artboardInfo, sourceBounds, request) {
    var asIsWidth = StepRepeat.getBoundsWidth(sourceBounds);
    var asIsHeight = StepRepeat.getBoundsHeight(sourceBounds);
    var asIsFit = StepRepeat.calculateFitCount(artboardInfo, asIsWidth, asIsHeight, request.gapPt);
    var rotatedFit = StepRepeat.calculateFitCount(artboardInfo, asIsHeight, asIsWidth, request.gapPt);
    var asIsFitsSingle = StepRepeat.orientationFitsSingleCell(artboardInfo, asIsWidth, asIsHeight);
    var rotatedFitsSingle = StepRepeat.orientationFitsSingleCell(artboardInfo, asIsHeight, asIsWidth);

    if (asIsFit.count <= 0 && rotatedFit.count <= 0) {
        if (!asIsFitsSingle && !rotatedFitsSingle) {
            throw StepRepeat.createModuleError(
                "STEP_REPEAT_CELL_TOO_LARGE",
                "The current selection cell is larger than the active artboard."
            );
        }

        throw StepRepeat.createModuleError(
            "STEP_REPEAT_NOTHING_FITS",
            "Step Repeat could not fit any cell on the active artboard."
        );
    }

    if (request.autoRotate90 && rotatedFit.count > asIsFit.count) {
        return {
            rotationApplied: true,
            cols: rotatedFit.cols,
            rows: rotatedFit.rows,
            count: rotatedFit.count,
            cellWidth: asIsHeight,
            cellHeight: asIsWidth
        };
    }

    return {
        rotationApplied: false,
        cols: asIsFit.cols,
        rows: asIsFit.rows,
        count: asIsFit.count,
        cellWidth: asIsWidth,
        cellHeight: asIsHeight
    };
};

StepRepeat.buildGridPlan = function (doc, sourceBounds, request) {
    var artboardInfo = StepRepeat.getActiveArtboardInfo(doc);
    var printableInfo = StepRepeat.getPrintableArtboardInfo(artboardInfo, request.marginPt);
    var chosen = StepRepeat.chooseOrientation(printableInfo, sourceBounds, request);
    var totalGridWidth = (chosen.cols * chosen.cellWidth) + (Math.max(0, chosen.cols - 1) * request.gapPt);
    var totalGridHeight = (chosen.rows * chosen.cellHeight) + (Math.max(0, chosen.rows - 1) * request.gapPt);
    var startLeft = printableInfo.center[0] - (totalGridWidth / 2);
    var startTop = printableInfo.center[1] + (totalGridHeight / 2);

    return {
        activeArtboardIndex: artboardInfo.index,
        artboardBounds: StepRepeat.cloneBounds(artboardInfo.bounds),
        artboardCenter: artboardInfo.center,
        printableBounds: StepRepeat.cloneBounds(printableInfo.bounds),
        printableCenter: printableInfo.center,
        cellBoundsBefore: StepRepeat.cloneBounds(sourceBounds),
        sourceCenter: StepRepeat.getBoundsCenter(sourceBounds),
        gapMm: request.gapMm,
        gapPt: request.gapPt,
        marginMm: request.marginMm,
        marginPt: request.marginPt,
        autoRotate90: request.autoRotate90,
        rotationApplied: chosen.rotationApplied,
        cols: chosen.cols,
        rows: chosen.rows,
        count: chosen.count,
        cellWidth: chosen.cellWidth,
        cellHeight: chosen.cellHeight,
        gridWidth: totalGridWidth,
        gridHeight: totalGridHeight,
        startLeft: startLeft,
        startTop: startTop
    };
};

StepRepeat.getTargetCenter = function (plan, rowIndex, colIndex) {
    return [
        plan.startLeft + (colIndex * (plan.cellWidth + plan.gapPt)) + (plan.cellWidth / 2),
        plan.startTop - (rowIndex * (plan.cellHeight + plan.gapPt)) - (plan.cellHeight / 2)
    ];
};

StepRepeat.translateItemToCenter = function (item, targetCenter) {
    var currentBounds = StepRepeat.getItemGeometricBounds(item);
    var currentCenter = StepRepeat.getBoundsCenter(currentBounds);

    item.translate(
        Number(targetCenter[0]) - Number(currentCenter[0]),
        Number(targetCenter[1]) - Number(currentCenter[1]),
        true,
        true,
        true,
        true
    );
};

StepRepeat.applyOrientationToTemplate = function (templateGroup, plan) {
    if (!plan.rotationApplied) {
        return;
    }

    try {
        templateGroup.rotate(
            90,
            true,
            true,
            true,
            true,
            Transformation.CENTER
        );
    } catch (error) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_FAILED",
            "The selection cell could not be rotated for Step Repeat Symbol."
        );
    }
};
