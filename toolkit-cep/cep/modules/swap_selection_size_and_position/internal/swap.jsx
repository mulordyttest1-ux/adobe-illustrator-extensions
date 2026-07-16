if (!$.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__) {
    throw new Error("Swap Size + Position namespace was not initialized.");
}

var SwapSelection = $.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__;

SwapSelection.ensureSwapWouldChange = function (firstSnapshot, secondSnapshot, request) {
    if (request.mode === "position_only") {
        if (SwapSelection.pointsEqual(firstSnapshot.center, secondSnapshot.center)) {
            throw SwapSelection.createModuleError(
                "SWAP_SELECTION_NOTHING_CHANGED",
                "The selected items already share the same geometric center.",
                {
                    mode: request.mode
                }
            );
        }

        return;
    }

    if (
        SwapSelection.pointsEqual(firstSnapshot.center, secondSnapshot.center) &&
        SwapSelection.boundsEqual(firstSnapshot.bounds, secondSnapshot.bounds)
    ) {
        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_NOTHING_CHANGED",
            "The selected items already share the same geometric center and size.",
            {
                mode: request.mode
            }
        );
    }
};

SwapSelection.captureOutcome = function (request, firstBefore, secondBefore, firstAfter, secondAfter) {
    return {
        mode: request.mode,
        itemCount: 2,
        firstItemType: firstBefore.typename,
        secondItemType: secondBefore.typename,
        firstItemCenterBefore: SwapSelection.clonePoint(firstBefore.center),
        secondItemCenterBefore: SwapSelection.clonePoint(secondBefore.center),
        firstItemCenterAfter: SwapSelection.clonePoint(firstAfter.center),
        secondItemCenterAfter: SwapSelection.clonePoint(secondAfter.center),
        firstItemBoundsBefore: SwapSelection.cloneBounds(firstBefore.bounds),
        secondItemBoundsBefore: SwapSelection.cloneBounds(secondBefore.bounds),
        firstItemBoundsAfter: SwapSelection.cloneBounds(firstAfter.bounds),
        secondItemBoundsAfter: SwapSelection.cloneBounds(secondAfter.bounds)
    };
};

SwapSelection.performPositionSwap = function (items, request) {
    var firstBefore = SwapSelection.snapshotItem(items[0]);
    var secondBefore = SwapSelection.snapshotItem(items[1]);
    var firstAfter;
    var secondAfter;

    SwapSelection.ensureSwapWouldChange(firstBefore, secondBefore, request);

    try {
        SwapSelection.translateItemToCenter(items[0], secondBefore.center);
        SwapSelection.translateItemToCenter(items[1], firstBefore.center);
    } catch (error) {
        if (error && error.swapErrorCode) {
            throw error;
        }

        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_UNSUPPORTED_ITEM",
            "One of the selected items could not be moved."
        );
    }

    firstAfter = SwapSelection.snapshotItem(items[0]);
    secondAfter = SwapSelection.snapshotItem(items[1]);

    return SwapSelection.captureOutcome(request, firstBefore, secondBefore, firstAfter, secondAfter);
};

SwapSelection.performSizeAndPositionSwap = function (items, request) {
    var firstBefore = SwapSelection.snapshotItem(items[0]);
    var secondBefore = SwapSelection.snapshotItem(items[1]);
    var firstAfter;
    var secondAfter;

    SwapSelection.ensureSwapWouldChange(firstBefore, secondBefore, request);
    SwapSelection.ensureSnapshotHasArea(firstBefore);
    SwapSelection.ensureSnapshotHasArea(secondBefore);

    try {
        SwapSelection.resizeItemToBounds(items[0], firstBefore, secondBefore.bounds);
        SwapSelection.translateItemToCenter(items[0], firstBefore.center);
        SwapSelection.resizeItemToBounds(items[1], secondBefore, firstBefore.bounds);
        SwapSelection.translateItemToCenter(items[1], secondBefore.center);
        SwapSelection.translateItemToCenter(items[0], secondBefore.center);
        SwapSelection.translateItemToCenter(items[1], firstBefore.center);
    } catch (error) {
        if (error && error.swapErrorCode) {
            throw error;
        }

        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_UNSUPPORTED_ITEM",
            "One of the selected items could not be resized or moved."
        );
    }

    firstAfter = SwapSelection.snapshotItem(items[0]);
    secondAfter = SwapSelection.snapshotItem(items[1]);

    return SwapSelection.captureOutcome(request, firstBefore, secondBefore, firstAfter, secondAfter);
};

SwapSelection.performSwap = function (items, request) {
    if (request.mode === "size_and_position") {
        return SwapSelection.performSizeAndPositionSwap(items, request);
    }

    return SwapSelection.performPositionSwap(items, request);
};
