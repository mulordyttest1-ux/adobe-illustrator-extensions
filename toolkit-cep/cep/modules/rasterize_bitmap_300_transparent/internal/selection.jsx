if (!$.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__) {
    throw new Error("Rasterize Bitmap namespace was not initialized.");
}

var RasterizeBitmap = $.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__;

RasterizeBitmap.selectionErrorMessage = "Select at least 1 unlocked, visible editable art item.";
RasterizeBitmap.stagingGroupName = "__TOOLKIT_RASTERIZE_STAGE__";
RasterizeBitmap.outputItemName = "RASTERIZE_BITMAP_300PPI";

RasterizeBitmap.getSelectionItems = function (doc) {
    var selection = doc && doc.selection ? doc.selection : [];
    var items = [];
    var index;

    for (index = 0; index < selection.length; index += 1) {
        items.push(selection[index]);
    }

    return items;
};

RasterizeBitmap.itemOrParentLocked = function (item) {
    var current = item;

    while (current && current.typename !== "Document") {
        try {
            if (current.locked === true) {
                return true;
            }
        } catch (error) {}

        try {
            current = current.parent;
        } catch (parentError) {
            current = null;
        }
    }

    return false;
};

RasterizeBitmap.itemOrParentHidden = function (item) {
    var current = item;

    while (current && current.typename !== "Document") {
        try {
            if (current.hidden === true) {
                return true;
            }
        } catch (hiddenError) {}

        try {
            if (current.visible === false) {
                return true;
            }
        } catch (visibleError) {}

        try {
            current = current.parent;
        } catch (parentError) {
            current = null;
        }
    }

    return false;
};

RasterizeBitmap.isGuideItem = function (item) {
    try {
        return item.guides === true;
    } catch (error) {
        return false;
    }
};

RasterizeBitmap.isEditableItem = function (item) {
    try {
        if (typeof item.editable !== "undefined") {
            return item.editable !== false;
        }
    } catch (error) {}

    return true;
};

RasterizeBitmap.canContainGroups = function (container) {
    try {
        return !!(container && container.groupItems && typeof container.groupItems.add === "function");
    } catch (error) {
        return false;
    }
};

RasterizeBitmap.getUnsupportedReason = function (item) {
    if (!item || typeof item.typename !== "string") {
        return "Selection contains a non-art item.";
    }

    if (RasterizeBitmap.itemOrParentLocked(item)) {
        return item.typename + " is locked.";
    }

    if (RasterizeBitmap.itemOrParentHidden(item)) {
        return item.typename + " is hidden.";
    }

    if (!RasterizeBitmap.isEditableItem(item)) {
        return item.typename + " is not editable.";
    }

    if (RasterizeBitmap.isGuideItem(item)) {
        return item.typename + " guide items are not supported.";
    }

    if (typeof item.move !== "function") {
        return item.typename + " cannot be rasterized from the current selection.";
    }

    return "";
};

RasterizeBitmap.resolveSelectionItems = function (doc) {
    var items = RasterizeBitmap.getSelectionItems(doc);
    var index;
    var unsupportedReason;

    if (!items.length) {
        throw RasterizeBitmap.createModuleError(
            "RASTERIZE_SELECTION_NEEDS_SELECTION",
            RasterizeBitmap.selectionErrorMessage,
            {
                itemCount: 0
            }
        );
    }

    for (index = 0; index < items.length; index += 1) {
        unsupportedReason = RasterizeBitmap.getUnsupportedReason(items[index]);
        if (unsupportedReason) {
            throw RasterizeBitmap.createModuleError(
                "RASTERIZE_SELECTION_FAILED",
                unsupportedReason,
                {
                    itemIndex: index,
                    itemType: items[index] && items[index].typename ? items[index].typename : ""
                }
            );
        }
    }

    return items;
};

RasterizeBitmap.resolveAnchorParent = function (items) {
    var anchorParent = null;

    if (items.length) {
        try {
            anchorParent = items[0].parent;
        } catch (error) {
            anchorParent = null;
        }
    }

    if (!RasterizeBitmap.canContainGroups(anchorParent)) {
        throw RasterizeBitmap.createModuleError(
            "RASTERIZE_SELECTION_FAILED",
            "The first selected item's parent cannot contain rasterized output."
        );
    }

    return anchorParent;
};

RasterizeBitmap.createStagingGroup = function (anchorParent) {
    var stagingGroup = anchorParent.groupItems.add();

    stagingGroup.name = RasterizeBitmap.stagingGroupName;
    return stagingGroup;
};

RasterizeBitmap.selectRasterItem = function (doc, rasterItem) {
    try {
        doc.selection = null;
    } catch (clearError) {}

    try {
        rasterItem.selected = true;
    } catch (selectedError) {}

    try {
        doc.selection = [rasterItem];
    } catch (selectionError) {}
};
