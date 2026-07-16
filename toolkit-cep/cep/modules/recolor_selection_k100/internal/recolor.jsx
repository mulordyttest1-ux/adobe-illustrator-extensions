if (!$.global.__TOOLKIT_RECOLOR_SELECTION_K100__) {
    throw new Error("Recolor K100 namespace was not initialized.");
}

var RecolorSelection = $.global.__TOOLKIT_RECOLOR_SELECTION_K100__;

RecolorSelection.createTargetColor = function (targetColor) {
    var color = new CMYKColor();

    color.cyan = targetColor.cyan;
    color.magenta = targetColor.magenta;
    color.yellow = targetColor.yellow;
    color.black = targetColor.black;

    return color;
};

RecolorSelection.applyDescriptor = function (descriptor, request, counters) {
    if (descriptor.kind === "text") {
        if (descriptor.changeFill) {
            descriptor.item.textRange.characterAttributes.fillColor = RecolorSelection.createTargetColor(request.targetColor);
        }
        if (descriptor.changeStroke) {
            descriptor.item.textRange.characterAttributes.strokeColor = RecolorSelection.createTargetColor(request.targetColor);
        }
        counters.recoloredTextRangeCount += 1;
        counters.processedItemCount += 1;
        return;
    }

    if (descriptor.changeFill) {
        descriptor.item.fillColor = RecolorSelection.createTargetColor(request.targetColor);
        counters.recoloredFillCount += 1;
    }

    if (descriptor.changeStroke) {
        descriptor.item.strokeColor = RecolorSelection.createTargetColor(request.targetColor);
        counters.recoloredStrokeCount += 1;
    }

    counters.processedItemCount += 1;
};

RecolorSelection.performRecolor = function (doc, collectionState, request) {
    var counters = {
        processedItemCount: 0,
        recoloredFillCount: 0,
        recoloredStrokeCount: 0,
        recoloredTextRangeCount: 0
    };
    var index;

    for (index = 0; index < collectionState.descriptors.length; index += 1) {
        try {
            RecolorSelection.applyDescriptor(collectionState.descriptors[index], request, counters);
        } catch (error) {
            throw RecolorSelection.createModuleError(
                "RECOLOR_SELECTION_FAILED",
                error && error.message ? error.message : "Recolor failed.",
                {
                    itemIndex: index,
                    itemType: collectionState.descriptors[index] && collectionState.descriptors[index].itemType ? collectionState.descriptors[index].itemType : ""
                }
            );
        }
    }

    try {
        app.redraw();
    } catch (redrawError) {}

    return {
        targetColor: request.targetColor,
        processedItemCount: counters.processedItemCount,
        recoloredFillCount: counters.recoloredFillCount,
        recoloredStrokeCount: counters.recoloredStrokeCount,
        recoloredTextRangeCount: counters.recoloredTextRangeCount,
        skippedItemCount: RecolorSelection.countSkipReasons(collectionState.skippedReasons),
        skippedReasons: RecolorSelection.cloneSkipReasons(collectionState.skippedReasons)
    };
};
