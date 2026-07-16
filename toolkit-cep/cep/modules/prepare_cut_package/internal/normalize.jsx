if (!$.global.__TOOLKIT_PREPARE_CUT_PACKAGE__) {
    throw new Error("Prepare Cut Package namespace was not initialized.");
}

var PrepareCutPackage = $.global.__TOOLKIT_PREPARE_CUT_PACKAGE__;

PrepareCutPackage.cutLayerName = "CUT";
PrepareCutPackage.cameraLayerName = "camera_marks";
PrepareCutPackage.cutGroupPrefix = "CUTLINES_";
PrepareCutPackage.cutPathName = "CutContour";
PrepareCutPackage.cutSpotName = "CutContour";

PrepareCutPackage.unlockItem = function (item) {
    try {
        item.locked = false;
    } catch (lockedError) {}
    try {
        item.hidden = false;
    } catch (hiddenError) {}
    try {
        item.visible = true;
    } catch (visibleError) {}
};

PrepareCutPackage.unlockHierarchy = function (item) {
    var current = item;

    while (current && current.typename !== "Document") {
        PrepareCutPackage.unlockItem(current);
        try {
            current = current.parent || null;
        } catch (error) {
            current = null;
        }
    }
};

PrepareCutPackage.getOrCreateLayer = function (doc, layerName) {
    var i;
    var layer = null;

    for (i = 0; i < doc.layers.length; i += 1) {
        if (doc.layers[i].name === layerName) {
            layer = doc.layers[i];
            break;
        }
    }

    if (!layer) {
        layer = doc.layers.add();
        layer.name = layerName;
    }

    PrepareCutPackage.unlockItem(layer);
    return layer;
};

PrepareCutPackage.findLayerByName = function (doc, layerName) {
    var i;

    for (i = 0; i < doc.layers.length; i += 1) {
        if (doc.layers[i].name === layerName) {
            return doc.layers[i];
        }
    }

    return null;
};

PrepareCutPackage.readTagValue = function (item, tagName) {
    var normalizedName = String(tagName || "");
    var i;

    if (!item || !item.tags) {
        return "";
    }

    for (i = 0; i < item.tags.length; i += 1) {
        if (item.tags[i].name === normalizedName) {
            return String(item.tags[i].value || "");
        }
    }

    return "";
};

PrepareCutPackage.noteContains = function (item, pattern) {
    var noteValue = "";

    if (!item || !pattern) {
        return false;
    }

    try {
        noteValue = String(item.note || "");
    } catch (error) {
        noteValue = "";
    }

    return noteValue.indexOf(pattern) !== -1;
};

PrepareCutPackage.pathUsesCutSpot = function (pathItem) {
    var strokeColor;
    var spot;
    var spotName;

    if (!pathItem || !pathItem.stroked) {
        return false;
    }

    try {
        strokeColor = pathItem.strokeColor;
        spot = strokeColor && strokeColor.spot ? strokeColor.spot : null;
        spotName = spot && spot.name ? String(spot.name) : "";
        return spotName === PrepareCutPackage.cutSpotName;
    } catch (error) {
        return false;
    }
};

PrepareCutPackage.isOwnedCutCandidate = function (item) {
    var moduleByNote = PrepareCutPackage.noteContains(item, '"toolkit.module":"create_cut_lines"');
    var familyByNote = PrepareCutPackage.noteContains(item, '"toolkit.family":"cut_lines"');
    var moduleByTag = PrepareCutPackage.readTagValue(item, "toolkit_module") === "create_cut_lines";
    var familyByTag = PrepareCutPackage.readTagValue(item, "toolkit_family") === "cut_lines";
    var itemName = "";

    if (!item) {
        return false;
    }

    try {
        itemName = String(item.name || "");
    } catch (error) {
        itemName = "";
    }

    if ((moduleByNote && familyByNote) || (moduleByTag && familyByTag)) {
        return true;
    }

    if (item.typename === "GroupItem" && itemName.indexOf(PrepareCutPackage.cutGroupPrefix) === 0) {
        return true;
    }

    if (item.typename === "PathItem") {
        return itemName === PrepareCutPackage.cutPathName && PrepareCutPackage.pathUsesCutSpot(item);
    }

    if (item.typename === "CompoundPathItem") {
        if (itemName === PrepareCutPackage.cutPathName) {
            return true;
        }
        try {
            if (item.pathItems.length > 0) {
                return PrepareCutPackage.pathUsesCutSpot(item.pathItems[0]);
            }
        } catch (compoundError) {}
    }

    return false;
};

PrepareCutPackage.hasOwnedCutAncestor = function (item) {
    var current = null;

    try {
        current = item.parent || null;
    } catch (error) {
        current = null;
    }

    while (current && current.typename !== "Document" && current.typename !== "Layer") {
        if (PrepareCutPackage.isOwnedCutCandidate(current)) {
            return true;
        }
        try {
            current = current.parent || null;
        } catch (parentError) {
            current = null;
        }
    }

    return false;
};

PrepareCutPackage.collectRootCutItems = function (doc) {
    var items = [];
    var i;
    var item;

    for (i = 0; i < doc.pageItems.length; i += 1) {
        item = doc.pageItems[i];
        if (!PrepareCutPackage.isOwnedCutCandidate(item)) {
            continue;
        }
        if (PrepareCutPackage.hasOwnedCutAncestor(item)) {
            continue;
        }
        items.push(item);
    }

    return items;
};

PrepareCutPackage.normalizeCutLayer = function (doc) {
    var targetLayer = PrepareCutPackage.getOrCreateLayer(doc, PrepareCutPackage.cutLayerName);
    var cutItems = PrepareCutPackage.collectRootCutItems(doc);
    var movedCount = 0;
    var index;
    var item;
    var parent;

    for (index = 0; index < cutItems.length; index += 1) {
        item = cutItems[index];
        PrepareCutPackage.unlockHierarchy(item);
        try {
            parent = item.parent || null;
        } catch (parentError) {
            parent = null;
        }

        if (parent !== targetLayer) {
            item.move(targetLayer, ElementPlacement.PLACEATBEGINNING);
            movedCount += 1;
        }
    }

    PrepareCutPackage.unlockItem(targetLayer);

    return {
        layer: targetLayer,
        detectedCutItemCount: cutItems.length,
        movedCutItemCount: movedCount
    };
};

PrepareCutPackage.normalizeCameraLayer = function (doc) {
    var layer = PrepareCutPackage.findLayerByName(doc, PrepareCutPackage.cameraLayerName);
    var result = {
        layer: layer,
        exists: layer !== null,
        visible: false,
        unlocked: false,
        broughtToFront: false
    };

    if (!layer) {
        return result;
    }

    PrepareCutPackage.unlockItem(layer);
    try {
        layer.zOrder(ZOrderMethod.BRINGTOFRONT);
        result.broughtToFront = true;
    } catch (zOrderError) {
        result.broughtToFront = false;
    }

    try {
        result.visible = layer.hidden !== true && layer.visible !== false;
    } catch (visibleError) {
        result.visible = true;
    }

    try {
        result.unlocked = layer.locked !== true;
    } catch (lockedError) {
        result.unlocked = true;
    }

    return result;
};
