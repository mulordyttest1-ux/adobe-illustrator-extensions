if (!$.global.__TOOLKIT_RECOLOR_SELECTION_RED__) {
    throw new Error("Recolor Red namespace was not initialized.");
}

var RecolorSelection = $.global.__TOOLKIT_RECOLOR_SELECTION_RED__;

RecolorSelection.selectionErrorMessage = "Select at least 1 unlocked, visible editable art item.";

RecolorSelection.createCollectionState = function () {
    return {
        descriptors: [],
        seenItems: [],
        skippedReasons: {},
        doc: null,
        topLevelSelectionCount: 0
    };
};

RecolorSelection.addSkipReason = function (lookup, key) {
    if (!lookup[key]) {
        lookup[key] = 0;
    }

    lookup[key] += 1;
};

RecolorSelection.cloneSkipReasons = function (lookup) {
    var clone = {};
    var key;

    for (key in lookup) {
        if (Object.prototype.hasOwnProperty.call(lookup, key)) {
            clone[key] = lookup[key];
        }
    }

    return clone;
};

RecolorSelection.countSkipReasons = function (lookup) {
    var count = 0;
    var key;

    for (key in lookup) {
        if (Object.prototype.hasOwnProperty.call(lookup, key)) {
            count += lookup[key];
        }
    }

    return count;
};

RecolorSelection.getSelectionItems = function (doc) {
    var selection = doc && doc.selection ? doc.selection : [];
    var items = [];
    var index;

    for (index = 0; index < selection.length; index += 1) {
        items.push(selection[index]);
    }

    return items;
};

RecolorSelection.containsItem = function (items, candidate) {
    var index;

    for (index = 0; index < items.length; index += 1) {
        if (items[index] === candidate) {
            return true;
        }
    }

    return false;
};

RecolorSelection.markSeen = function (state, item) {
    if (RecolorSelection.containsItem(state.seenItems, item)) {
        return false;
    }

    state.seenItems.push(item);
    return true;
};

RecolorSelection.itemOrParentLocked = function (item) {
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

RecolorSelection.itemOrParentHidden = function (item) {
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

RecolorSelection.isEditableItem = function (item) {
    try {
        if (typeof item.editable !== "undefined") {
            return item.editable !== false;
        }
    } catch (error) {}

    return true;
};

RecolorSelection.isGuideItem = function (item) {
    try {
        return item.guides === true;
    } catch (error) {
        return false;
    }
};

RecolorSelection.isGroupItem = function (item) {
    return item && item.typename === "GroupItem";
};

RecolorSelection.isCompoundPathItem = function (item) {
    return item && item.typename === "CompoundPathItem";
};

RecolorSelection.isPathItem = function (item) {
    return item && item.typename === "PathItem";
};

RecolorSelection.isTextFrame = function (item) {
    if (!item || !item.typename) {
        return false;
    }

    return item.typename === "TextFrame" || item.typename === "TextFrameItem";
};

RecolorSelection.isNoColor = function (color) {
    return !!(color && color.typename === "NoColor");
};

RecolorSelection.isSupportedSolidColor = function (color) {
    if (!color || !color.typename) {
        return false;
    }

    return color.typename === "CMYKColor" ||
        color.typename === "RGBColor" ||
        color.typename === "GrayColor" ||
        color.typename === "LabColor" ||
        color.typename === "SpotColor";
};

RecolorSelection.getUnsupportedColorReason = function (color) {
    if (!color || RecolorSelection.isNoColor(color) || RecolorSelection.isSupportedSolidColor(color)) {
        return "";
    }

    if (color.typename === "GradientColor") {
        return "gradientColor";
    }

    if (color.typename === "PatternColor") {
        return "patternColor";
    }

    return "unsupportedColor";
};

RecolorSelection.getTextAttributeColor = function (item, attributeName) {
    var color = null;
    var characters;

    try {
        color = item.textRange.characterAttributes[attributeName];
    } catch (error) {
        color = null;
    }

    if (color) {
        return color;
    }

    try {
        characters = item.textRange.characters;
        if (characters && characters.length > 0) {
            return characters[0].characterAttributes[attributeName];
        }
    } catch (characterError) {}

    return null;
};

RecolorSelection.getUnsupportedItemReason = function (item) {
    if (!item || typeof item.typename !== "string") {
        return "unsupportedItem";
    }

    if (RecolorSelection.itemOrParentLocked(item)) {
        return "lockedItem";
    }

    if (RecolorSelection.itemOrParentHidden(item)) {
        return "hiddenItem";
    }

    if (!RecolorSelection.isEditableItem(item)) {
        return "nonEditableItem";
    }

    if (RecolorSelection.isGuideItem(item)) {
        return "guideItem";
    }

    if (item.typename === "RasterItem") {
        return "rasterItem";
    }

    if (item.typename === "PlacedItem") {
        return "placedItem";
    }

    if (item.typename === "MeshItem") {
        return "meshItem";
    }

    if (item.typename === "PluginItem") {
        return "pluginItem";
    }

    if (item.typename === "NonNativeItem") {
        return "nonNativeItem";
    }

    if (item.typename === "SymbolItem") {
        return "symbolItem";
    }

    return "unsupportedItem";
};

RecolorSelection.getItemBounds = function (item) {
    try {
        if (item && item.visibleBounds && item.visibleBounds.length === 4) {
            return item.visibleBounds;
        }
    } catch (visibleBoundsError) {}

    try {
        if (item && item.geometricBounds && item.geometricBounds.length === 4) {
            return item.geometricBounds;
        }
    } catch (geometricBoundsError) {}

    return null;
};

RecolorSelection.boundsContainBounds = function (containerBounds, subjectBounds, tolerance) {
    var slack = typeof tolerance === "number" ? tolerance : 0;

    if (!containerBounds || !subjectBounds || containerBounds.length !== 4 || subjectBounds.length !== 4) {
        return false;
    }

    return (
        subjectBounds[0] >= (containerBounds[0] - slack) &&
        subjectBounds[1] <= (containerBounds[1] + slack) &&
        subjectBounds[2] <= (containerBounds[2] + slack) &&
        subjectBounds[3] >= (containerBounds[3] - slack)
    );
};

RecolorSelection.collectDetachedCompoundSelection = function (item, state) {
    var compoundBounds;
    var matchedCount = 0;
    var index;
    var candidate;
    var candidateReason;
    var candidateBounds;

    if (!state.doc || state.topLevelSelectionCount !== 1 || !state.doc.pathItems) {
        return 0;
    }

    compoundBounds = RecolorSelection.getItemBounds(item);

    for (index = 0; index < state.doc.pathItems.length; index += 1) {
        candidate = state.doc.pathItems[index];

        try {
            if (candidate.selected !== true) {
                continue;
            }
        } catch (selectedError) {
            continue;
        }

        if (RecolorSelection.containsItem(state.seenItems, candidate)) {
            continue;
        }

        candidateBounds = RecolorSelection.getItemBounds(candidate);
        if (compoundBounds && candidateBounds && !RecolorSelection.boundsContainBounds(compoundBounds, candidateBounds, 0.5)) {
            continue;
        }

        candidateReason = RecolorSelection.getUnsupportedItemReason(candidate);
        if (
            candidateReason &&
            (
                candidateReason !== "unsupportedItem" ||
                (!RecolorSelection.isPathItem(candidate) && !RecolorSelection.isTextFrame(candidate))
            )
        ) {
            RecolorSelection.addSkipReason(state.skippedReasons, candidateReason);
            continue;
        }

        state.seenItems.push(candidate);
        RecolorSelection.collectPathDescriptor(candidate, state);
        matchedCount += 1;
    }

    return matchedCount;
};

RecolorSelection.pushDescriptor = function (state, descriptor) {
    state.descriptors.push(descriptor);
};

RecolorSelection.collectPathDescriptor = function (item, state) {
    var changeFill = false;
    var changeStroke = false;
    var fillColor = null;
    var strokeColor = null;
    var reason = "";

    try {
        if (item.filled === true) {
            fillColor = item.fillColor;
            if (fillColor && !RecolorSelection.isNoColor(fillColor)) {
                reason = RecolorSelection.getUnsupportedColorReason(fillColor);
                if (reason) {
                    RecolorSelection.addSkipReason(state.skippedReasons, reason);
                } else {
                    changeFill = true;
                }
            }
        }
    } catch (fillError) {}

    try {
        if (item.stroked === true) {
            strokeColor = item.strokeColor;
            if (strokeColor && !RecolorSelection.isNoColor(strokeColor)) {
                reason = RecolorSelection.getUnsupportedColorReason(strokeColor);
                if (reason) {
                    RecolorSelection.addSkipReason(state.skippedReasons, reason);
                } else {
                    changeStroke = true;
                }
            }
        }
    } catch (strokeError) {}

    if (!changeFill && !changeStroke) {
        RecolorSelection.addSkipReason(state.skippedReasons, "noRecolorableAppearance");
        return;
    }

    RecolorSelection.pushDescriptor(state, {
        kind: "path",
        item: item,
        itemType: item.typename,
        changeFill: changeFill,
        changeStroke: changeStroke
    });
};

RecolorSelection.collectTextDescriptor = function (item, state) {
    var fillColor = RecolorSelection.getTextAttributeColor(item, "fillColor");
    var strokeColor = RecolorSelection.getTextAttributeColor(item, "strokeColor");
    var fillReason = "";
    var strokeReason = "";
    var changeFill = false;
    var changeStroke = false;

    if (fillColor && !RecolorSelection.isNoColor(fillColor)) {
        fillReason = RecolorSelection.getUnsupportedColorReason(fillColor);
        if (fillReason) {
            RecolorSelection.addSkipReason(state.skippedReasons, fillReason);
        } else {
            changeFill = true;
        }
    }

    if (strokeColor && !RecolorSelection.isNoColor(strokeColor)) {
        strokeReason = RecolorSelection.getUnsupportedColorReason(strokeColor);
        if (strokeReason) {
            RecolorSelection.addSkipReason(state.skippedReasons, strokeReason);
        } else {
            changeStroke = true;
        }
    }

    if (!changeFill && !changeStroke) {
        RecolorSelection.addSkipReason(state.skippedReasons, "noRecolorableAppearance");
        return;
    }

    RecolorSelection.pushDescriptor(state, {
        kind: "text",
        item: item,
        itemType: item.typename,
        changeFill: changeFill,
        changeStroke: changeStroke
    });
};

RecolorSelection.collectItemRecursive = function (item, state) {
    var index;
    var reason;

    if (!item || !RecolorSelection.markSeen(state, item)) {
        return;
    }

    reason = RecolorSelection.getUnsupportedItemReason(item);
    if (reason) {
        if (
            reason !== "unsupportedItem" ||
            (!RecolorSelection.isGroupItem(item) && !RecolorSelection.isCompoundPathItem(item) && !RecolorSelection.isPathItem(item) && !RecolorSelection.isTextFrame(item))
        ) {
            RecolorSelection.addSkipReason(state.skippedReasons, reason);
            return;
        }
    }

    if (RecolorSelection.isGroupItem(item)) {
        for (index = 0; index < item.pageItems.length; index += 1) {
            RecolorSelection.collectItemRecursive(item.pageItems[index], state);
        }
        return;
    }

    if (RecolorSelection.isCompoundPathItem(item)) {
        if (item.pathItems && item.pathItems.length) {
            for (index = 0; index < item.pathItems.length; index += 1) {
                RecolorSelection.collectPathDescriptor(item.pathItems[index], state);
            }
            return;
        }

        if (RecolorSelection.collectDetachedCompoundSelection(item, state) > 0) {
            return;
        }

        return;
    }

    if (RecolorSelection.isPathItem(item)) {
        RecolorSelection.collectPathDescriptor(item, state);
        return;
    }

    if (RecolorSelection.isTextFrame(item)) {
        RecolorSelection.collectTextDescriptor(item, state);
        return;
    }

    RecolorSelection.addSkipReason(state.skippedReasons, "unsupportedItem");
};

RecolorSelection.resolveDescriptors = function (doc) {
    var items = RecolorSelection.getSelectionItems(doc);
    var state = RecolorSelection.createCollectionState();
    var index;

    if (!items.length) {
        throw RecolorSelection.createModuleError(
            "RECOLOR_SELECTION_NEEDS_SELECTION",
            RecolorSelection.selectionErrorMessage,
            {
                itemCount: 0
            }
        );
    }

    state.doc = doc;
    state.topLevelSelectionCount = items.length;

    for (index = 0; index < items.length; index += 1) {
        RecolorSelection.collectItemRecursive(items[index], state);
    }

    if (!state.descriptors.length) {
        throw RecolorSelection.createModuleError(
            "RECOLOR_SELECTION_NO_SUPPORTED_ITEMS",
            "Selection does not contain supported recolorable artwork.",
            {
                skippedItemCount: RecolorSelection.countSkipReasons(state.skippedReasons),
                skippedReasons: RecolorSelection.cloneSkipReasons(state.skippedReasons)
            }
        );
    }

    return state;
};
