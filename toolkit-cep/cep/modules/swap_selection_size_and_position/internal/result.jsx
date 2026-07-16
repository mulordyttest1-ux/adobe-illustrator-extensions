if (!$.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__) {
    throw new Error("Swap Size + Position namespace was not initialized.");
}

var SwapSelection = $.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__;

SwapSelection.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

SwapSelection.createResultData = function (outcome) {
    return {
        mode: outcome.mode,
        itemCount: outcome.itemCount,
        firstItemType: outcome.firstItemType,
        secondItemType: outcome.secondItemType,
        firstItemCenterBefore: outcome.firstItemCenterBefore,
        secondItemCenterBefore: outcome.secondItemCenterBefore,
        firstItemCenterAfter: outcome.firstItemCenterAfter,
        secondItemCenterAfter: outcome.secondItemCenterAfter,
        firstItemBoundsBefore: outcome.firstItemBoundsBefore,
        secondItemBoundsBefore: outcome.secondItemBoundsBefore,
        firstItemBoundsAfter: outcome.firstItemBoundsAfter,
        secondItemBoundsAfter: outcome.secondItemBoundsAfter
    };
};

SwapSelection.buildSuccessMessage = function (outcome) {
    if (outcome.mode === "size_and_position") {
        return "Swapped size and position for 2 selected items.";
    }

    return "Swapped positions for 2 selected items.";
};

SwapSelection.execute = function (payload) {
    var doc;
    var request;
    var items;
    var outcome;

    if (!app.documents.length) {
        return SwapSelection.createFailure(
            "Open a document before running " + SwapSelection.title + ".",
            "SWAP_SELECTION_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;
    request = SwapSelection.resolveRequest(payload || {});

    try {
        items = SwapSelection.resolveSelectionItems(doc, request);
        outcome = SwapSelection.performSwap(items, request);

        return {
            success: true,
            message: SwapSelection.buildSuccessMessage(outcome),
            errorCode: null,
            data: SwapSelection.createResultData(outcome)
        };
    } catch (error) {
        if (error && error.swapErrorCode) {
            return SwapSelection.createFailure(
                error.message,
                error.swapErrorCode,
                error.swapErrorData
            );
        }

        return SwapSelection.createFailure(
            error && error.message ? error.message : "Swap Size + Position failed.",
            "SWAP_SELECTION_FAILED"
        );
    }
};
