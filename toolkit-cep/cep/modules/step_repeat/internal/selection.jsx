if (!$.global.__TOOLKIT_STEP_REPEAT__) {
    throw new Error("Step Repeat namespace was not initialized.");
}

var StepRepeat = $.global.__TOOLKIT_STEP_REPEAT__;

StepRepeat.selectionErrorMessage = "Select at least 1 unlocked, visible editable art item.";
StepRepeat.tempLayerName = "__TOOLKIT_STEP_REPEAT_TEMP__";
StepRepeat.templateGroupName = "__TOOLKIT_STEP_REPEAT_TEMPLATE__";
StepRepeat.outputGroupName = "STEP_REPEAT_GRID";
StepRepeat.cellGroupPrefix = "STEP_REPEAT_CELL_";

StepRepeat.getSelectionItems = function (doc) {
    var selection = doc && doc.selection ? doc.selection : [];
    var items = [];
    var index;

    for (index = 0; index < selection.length; index += 1) {
        items.push(selection[index]);
    }

    return items;
};

StepRepeat.itemOrParentLocked = function (item) {
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

StepRepeat.itemOrParentHidden = function (item) {
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

StepRepeat.isGuideItem = function (item) {
    try {
        return item.guides === true;
    } catch (error) {
        return false;
    }
};

StepRepeat.isEditableItem = function (item) {
    try {
        if (typeof item.editable !== "undefined") {
            return item.editable !== false;
        }
    } catch (error) {}

    return true;
};

StepRepeat.getUnsupportedReason = function (item) {
    if (!item || typeof item.typename !== "string") {
        return "Selection contains a non-art item.";
    }

    if (StepRepeat.itemOrParentLocked(item)) {
        return item.typename + " is locked.";
    }

    if (StepRepeat.itemOrParentHidden(item)) {
        return item.typename + " is hidden.";
    }

    if (!StepRepeat.isEditableItem(item)) {
        return item.typename + " is not editable.";
    }

    if (StepRepeat.isGuideItem(item)) {
        return item.typename + " guide items are not supported.";
    }

    if (typeof item.duplicate !== "function") {
        return item.typename + " cannot be duplicated.";
    }

    if (typeof item.remove !== "function") {
        return item.typename + " cannot be replaced.";
    }

    try {
        if (!item.geometricBounds || item.geometricBounds.length !== 4) {
            return item.typename + " geometric bounds are unavailable.";
        }
    } catch (error) {
        return item.typename + " geometric bounds are unavailable.";
    }

    return "";
};

StepRepeat.resolveSelectionItems = function (doc) {
    var items = StepRepeat.getSelectionItems(doc);
    var index;
    var unsupportedReason;

    if (!items.length) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_NEEDS_SELECTION",
            StepRepeat.selectionErrorMessage,
            {
                itemCount: 0
            }
        );
    }

    for (index = 0; index < items.length; index += 1) {
        unsupportedReason = StepRepeat.getUnsupportedReason(items[index]);
        if (unsupportedReason) {
            throw StepRepeat.createModuleError(
                "STEP_REPEAT_UNSUPPORTED_ITEM",
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

StepRepeat.canContainGroups = function (container) {
    try {
        return !!(container && container.groupItems && typeof container.groupItems.add === "function");
    } catch (error) {
        return false;
    }
};

StepRepeat.resolveOutputContainer = function (doc, items) {
    var parent = null;
    var index;

    if (items.length) {
        try {
            parent = items[0].parent;
        } catch (error) {
            parent = null;
        }
    }

    if (parent && StepRepeat.canContainGroups(parent)) {
        for (index = 1; index < items.length; index += 1) {
            try {
                if (items[index].parent !== parent) {
                    parent = null;
                    break;
                }
            } catch (parentError) {
                parent = null;
                break;
            }
        }
    } else {
        parent = null;
    }

    if (parent && StepRepeat.canContainGroups(parent)) {
        return parent;
    }

    if (!doc.activeLayer || doc.activeLayer.locked === true || doc.activeLayer.visible === false) {
        throw StepRepeat.createModuleError(
            "STEP_REPEAT_UNSUPPORTED_ITEM",
            "Active layer is unavailable for Step Repeat output."
        );
    }

    return doc.activeLayer;
};

StepRepeat.createTempLayer = function (doc) {
    var layer = doc.layers.add();

    layer.name = StepRepeat.tempLayerName;

    try {
        layer.locked = false;
    } catch (unlockError) {}

    try {
        layer.visible = false;
    } catch (visibleError) {}

    return layer;
};

StepRepeat.createTemplateStage = function (doc, items) {
    var tempLayer = StepRepeat.createTempLayer(doc);
    var templateGroup = tempLayer.groupItems.add();
    var duplicates = [];
    var index;
    var duplicateItem;

    templateGroup.name = StepRepeat.templateGroupName;

    try {
        tempLayer.locked = false;
        tempLayer.visible = true;
    } catch (tempVisibleError) {}

    for (index = 0; index < items.length; index += 1) {
        try {
            duplicateItem = items[index].duplicate(tempLayer, ElementPlacement.PLACEATEND);
            duplicates.push(duplicateItem);
        } catch (error) {
            StepRepeat.cleanupStage({
                tempLayer: tempLayer
            });
            throw StepRepeat.createModuleError(
                "STEP_REPEAT_UNSUPPORTED_ITEM",
                "One of the selected items could not be duplicated.",
                {
                    itemIndex: index,
                    itemType: items[index] && items[index].typename ? items[index].typename : ""
                }
            );
        }
    }

    for (index = 0; index < duplicates.length; index += 1) {
        duplicates[index].move(templateGroup, ElementPlacement.PLACEATEND);
    }

    return {
        tempLayer: tempLayer,
        templateGroup: templateGroup
    };
};

StepRepeat.cleanupStage = function (stage) {
    if (!stage || !stage.tempLayer) {
        return;
    }

    try {
        stage.tempLayer.locked = false;
    } catch (unlockError) {}

    try {
        stage.tempLayer.visible = true;
    } catch (visibleError) {}

    try {
        stage.tempLayer.remove();
    } catch (error) {}
};

StepRepeat.cleanupOutputGroup = function (group) {
    if (!group) {
        return;
    }

    try {
        group.remove();
    } catch (error) {}
};

StepRepeat.removeSourceItems = function (items) {
    var index;

    for (index = items.length - 1; index >= 0; index -= 1) {
        try {
            items[index].remove();
        } catch (error) {
            throw StepRepeat.createModuleError(
                "STEP_REPEAT_FAILED",
                "The original selection could not be replaced cleanly."
            );
        }
    }
};

StepRepeat.selectOutputGroup = function (doc, group) {
    try {
        doc.selection = null;
    } catch (clearError) {}

    try {
        group.selected = true;
    } catch (selectedError) {}

    try {
        doc.selection = [group];
    } catch (selectionError) {}
};
