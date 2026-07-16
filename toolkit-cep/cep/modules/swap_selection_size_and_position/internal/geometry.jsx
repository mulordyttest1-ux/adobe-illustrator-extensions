if (!$.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__) {
    throw new Error("Swap Size + Position namespace was not initialized.");
}

var SwapSelection = $.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__;

SwapSelection.geometryTolerance = 0.05;

SwapSelection.cloneBounds = function (bounds) {
    return [
        Number(bounds[0]),
        Number(bounds[1]),
        Number(bounds[2]),
        Number(bounds[3])
    ];
};

SwapSelection.clonePoint = function (point) {
    return [
        Number(point[0]),
        Number(point[1])
    ];
};

SwapSelection.getGeometricBounds = function (item) {
    var bounds;
    var result = [];
    var index;

    try {
        bounds = item.geometricBounds;
    } catch (error) {
        bounds = null;
    }

    if (!bounds || bounds.length !== 4) {
        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_UNSUPPORTED_ITEM",
            (item && item.typename ? item.typename : "Item") + " geometric bounds are unavailable.",
            {
                itemType: item && item.typename ? item.typename : ""
            }
        );
    }

    for (index = 0; index < 4; index += 1) {
        if (typeof bounds[index] !== "number" || !isFinite(bounds[index])) {
            throw SwapSelection.createModuleError(
                "SWAP_SELECTION_UNSUPPORTED_ITEM",
                (item && item.typename ? item.typename : "Item") + " geometric bounds are invalid.",
                {
                    itemType: item && item.typename ? item.typename : ""
                }
            );
        }

        result.push(Number(bounds[index]));
    }

    return result;
};

SwapSelection.getBoundsWidth = function (bounds) {
    return Number(bounds[2]) - Number(bounds[0]);
};

SwapSelection.getBoundsHeight = function (bounds) {
    return Number(bounds[1]) - Number(bounds[3]);
};

SwapSelection.getBoundsCenter = function (bounds) {
    return [
        (Number(bounds[0]) + Number(bounds[2])) / 2,
        (Number(bounds[1]) + Number(bounds[3])) / 2
    ];
};

SwapSelection.snapshotItem = function (item) {
    var bounds = SwapSelection.getGeometricBounds(item);

    return {
        item: item,
        typename: item && item.typename ? item.typename : "",
        bounds: bounds,
        center: SwapSelection.getBoundsCenter(bounds),
        width: SwapSelection.getBoundsWidth(bounds),
        height: SwapSelection.getBoundsHeight(bounds)
    };
};

SwapSelection.pointsEqual = function (first, second, tolerance) {
    var epsilon = typeof tolerance === "number" ? tolerance : SwapSelection.geometryTolerance;

    return (
        Math.abs(first[0] - second[0]) <= epsilon &&
        Math.abs(first[1] - second[1]) <= epsilon
    );
};

SwapSelection.boundsEqual = function (first, second, tolerance) {
    var epsilon = typeof tolerance === "number" ? tolerance : SwapSelection.geometryTolerance;
    var index;

    for (index = 0; index < 4; index += 1) {
        if (Math.abs(first[index] - second[index]) > epsilon) {
            return false;
        }
    }

    return true;
};

SwapSelection.averageScalePercent = function (scaleX, scaleY) {
    return (Number(scaleX) + Number(scaleY)) / 2;
};

SwapSelection.translateItemToCenter = function (item, targetCenter) {
    var currentBounds = SwapSelection.getGeometricBounds(item);
    var currentCenter = SwapSelection.getBoundsCenter(currentBounds);

    item.translate(
        Number(targetCenter[0]) - Number(currentCenter[0]),
        Number(targetCenter[1]) - Number(currentCenter[1]),
        true,
        true,
        true,
        true
    );
};

SwapSelection.ensureSnapshotHasArea = function (snapshot) {
    if (Math.abs(snapshot.width) <= SwapSelection.geometryTolerance || Math.abs(snapshot.height) <= SwapSelection.geometryTolerance) {
        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_ZERO_SIZE",
            snapshot.typename + " has zero geometric width or height.",
            {
                itemType: snapshot.typename,
                bounds: SwapSelection.cloneBounds(snapshot.bounds)
            }
        );
    }
};

SwapSelection.resizeItemToBounds = function (item, sourceSnapshot, targetBounds) {
    var targetWidth = SwapSelection.getBoundsWidth(targetBounds);
    var targetHeight = SwapSelection.getBoundsHeight(targetBounds);
    var scaleX;
    var scaleY;
    var lineWidthScale;

    SwapSelection.ensureSnapshotHasArea(sourceSnapshot);

    if (Math.abs(targetWidth) <= SwapSelection.geometryTolerance || Math.abs(targetHeight) <= SwapSelection.geometryTolerance) {
        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_ZERO_SIZE",
            "Target geometric bounds have zero width or height.",
            {
                itemType: sourceSnapshot.typename,
                targetBounds: SwapSelection.cloneBounds(targetBounds)
            }
        );
    }

    scaleX = (targetWidth / sourceSnapshot.width) * 100;
    scaleY = (targetHeight / sourceSnapshot.height) * 100;
    lineWidthScale = SwapSelection.averageScalePercent(scaleX, scaleY);

    try {
        item.resize(
            scaleX,
            scaleY,
            true,
            true,
            true,
            true,
            lineWidthScale,
            Transformation.CENTER
        );
    } catch (error) {
        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_UNSUPPORTED_ITEM",
            sourceSnapshot.typename + " could not be resized.",
            {
                itemType: sourceSnapshot.typename,
                scaleX: scaleX,
                scaleY: scaleY
            }
        );
    }
};
