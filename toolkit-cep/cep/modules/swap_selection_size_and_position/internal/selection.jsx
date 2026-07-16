if (!$.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__) {
    throw new Error("Swap Size + Position namespace was not initialized.");
}

var SwapSelection = $.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__;

SwapSelection.selectionErrorMessage = "Select exactly 2 unlocked, visible editable items.";

SwapSelection.getSelectionItems = function (doc) {
    var selection = doc && doc.selection ? doc.selection : [];
    var items = [];
    var index;

    for (index = 0; index < selection.length; index += 1) {
        items.push(selection[index]);
    }

    return items;
};

SwapSelection.isLockedItem = function (item) {
    try {
        return item.locked === true;
    } catch (error) {
        return false;
    }
};

SwapSelection.isHiddenItem = function (item) {
    try {
        if (item.hidden === true) {
            return true;
        }
    } catch (error) {}

    try {
        if (item.visible === false) {
            return true;
        }
    } catch (visibleError) {}

    return false;
};

SwapSelection.isGuideItem = function (item) {
    try {
        return item.guides === true;
    } catch (error) {
        return false;
    }
};

SwapSelection.isEditableItem = function (item) {
    try {
        if (typeof item.editable !== "undefined") {
            return item.editable !== false;
        }
    } catch (error) {}

    return true;
};

SwapSelection.getUnsupportedReason = function (item, mode) {
    if (!item || typeof item.typename !== "string") {
        return "Selection contains a non-art item.";
    }

    if (SwapSelection.isLockedItem(item)) {
        return item.typename + " is locked.";
    }

    if (SwapSelection.isHiddenItem(item)) {
        return item.typename + " is hidden.";
    }

    if (!SwapSelection.isEditableItem(item)) {
        return item.typename + " is not editable.";
    }

    if (SwapSelection.isGuideItem(item)) {
        return item.typename + " guide items are not supported.";
    }

    if (typeof item.translate !== "function") {
        return item.typename + " cannot be translated.";
    }

    if (mode === "size_and_position" && typeof item.resize !== "function") {
        return item.typename + " cannot be resized.";
    }

    return "";
};

SwapSelection.resolveSelectionItems = function (doc, request) {
    var items = SwapSelection.getSelectionItems(doc);
    var unsupportedReason;
    var index;

    if (items.length !== 2) {
        throw SwapSelection.createModuleError(
            "SWAP_SELECTION_NEEDS_TWO_ITEMS",
            SwapSelection.selectionErrorMessage,
            {
                itemCount: items.length,
                mode: request.mode
            }
        );
    }

    for (index = 0; index < items.length; index += 1) {
        unsupportedReason = SwapSelection.getUnsupportedReason(items[index], request.mode);
        if (unsupportedReason) {
            throw SwapSelection.createModuleError(
                "SWAP_SELECTION_UNSUPPORTED_ITEM",
                unsupportedReason,
                {
                    itemCount: items.length,
                    itemIndex: index,
                    itemType: items[index] && items[index].typename ? items[index].typename : ""
                }
            );
        }
    }

    return items;
};
