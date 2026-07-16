if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.getStrategyCode = function (strategy) {
    if (strategy === "contour") {
        return "CONTOUR";
    }
    if (strategy === "sline") {
        return "SLINE";
    }
    return "UNKNOWN";
};

CutLines.padNumber = function (value, width) {
    var result = String(value);
    while (result.length < width) {
        result = "0" + result;
    }
    return result;
};

CutLines.findNextRunSequence = function (layer, strategyCode) {
    var prefix = CutLines.groupPrefix + "_" + strategyCode + "_";
    var maxValue = 0;
    var i;

    for (i = 0; i < layer.groupItems.length; i += 1) {
        var name = layer.groupItems[i].name || "";
        if (name.indexOf(prefix) !== 0) {
            continue;
        }

        var suffix = parseInt(name.substring(prefix.length), 10);
        if (!isNaN(suffix) && suffix > maxValue) {
            maxValue = suffix;
        }
    }

    return maxValue + 1;
};

CutLines.findTagByName = function (item, tagName) {
    var i;
    var normalizedTagName = CutLines.normalizeTagName(tagName);

    if (!item || !item.tags) {
        return null;
    }

    for (i = 0; i < item.tags.length; i += 1) {
        if (item.tags[i].name === normalizedTagName) {
            return item.tags[i];
        }
    }

    return null;
};

CutLines.normalizeTagName = function (tagName) {
    return String(tagName || "").replace(/[^A-Za-z0-9_\-]/g, "_");
};

CutLines.setTag = function (item, tagName, tagValue) {
    var tag;
    var normalizedTagName = CutLines.normalizeTagName(tagName);

    if (!item || !item.tags) {
        return;
    }

    tag = CutLines.findTagByName(item, tagName);
    if (!tag) {
        try {
            tag = item.tags.add();
            tag.name = normalizedTagName;
        } catch (error) {
            tag = null;
        }
    }

    if (tag) {
        try {
            tag.value = String(tagValue);
        } catch (error2) {}
    }
};

CutLines.setNote = function (item, metadata) {
    var noteValue;
    var keys;
    var i;
    var parts = [];

    if (!item) {
        return;
    }

    keys = [];
    for (i in metadata) {
        if (metadata.hasOwnProperty(i)) {
            keys.push(i);
        }
    }

    keys.sort();
    for (i = 0; i < keys.length; i += 1) {
        parts.push('"' + keys[i] + '":"' + String(metadata[keys[i]]).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"');
    }

    noteValue = "{" + parts.join(",") + "}";
    try {
        item.note = noteValue;
    } catch (error) {}
};

CutLines.applyMetadata = function (item, metadata) {
    var key;

    if (!item) {
        return;
    }

    for (key in metadata) {
        if (metadata.hasOwnProperty(key)) {
            CutLines.setTag(item, key, metadata[key]);
        }
    }

    CutLines.setNote(item, metadata);
};

CutLines.isOwnedCutLineItem = function (item) {
    var current = item;
    var noteValue = "";

    while (current) {
        try {
            noteValue = current.note || "";
        } catch (error) {
            noteValue = "";
        }

        if (
            noteValue.indexOf('"toolkit.module":"create_cut_lines"') !== -1 &&
            noteValue.indexOf('"toolkit.family":"cut_lines"') !== -1
        ) {
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

CutLines.createSelectionBoundsPayload = function (bounds) {
    if (!bounds) {
        return null;
    }

    return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        widthPt: bounds.right - bounds.left,
        heightPt: bounds.top - bounds.bottom,
        widthMm: CutLines.ptToMm(bounds.right - bounds.left),
        heightMm: CutLines.ptToMm(bounds.top - bounds.bottom)
    };
};

CutLines.createRunContext = function (doc, strategy, selectionBounds) {
    var layer = CutLines.getOrCreateLayer(doc, CutLines.layerName);
    var color = CutLines.getOrCreateSpotColor(doc, CutLines.spotName);
    var strategyCode = CutLines.getStrategyCode(strategy);
    var sequence = CutLines.findNextRunSequence(layer, strategyCode);
    var runId = CutLines.padNumber(sequence, 3);
    var runGroupName = CutLines.groupPrefix + "_" + strategyCode + "_" + runId;
    var strategyGroupName = CutLines.groupPrefix + "_" + strategyCode;
    var runGroup = layer.groupItems.add();
    var strategyGroup = runGroup.groupItems.add();
    var metadata = {
        "toolkit.module": CutLines.moduleId,
        "toolkit.family": "cut_lines",
        "toolkit.strategy": strategy,
        "toolkit.layer": CutLines.layerName,
        "toolkit.spot": CutLines.spotName,
        "toolkit.run": runId
    };

    runGroup.name = runGroupName;
    strategyGroup.name = strategyGroupName;

    CutLines.applyMetadata(runGroup, metadata);
    CutLines.applyMetadata(strategyGroup, metadata);

    return {
        layer: layer,
        color: color,
        strategy: strategy,
        strategyCode: strategyCode,
        runId: runId,
        runGroup: runGroup,
        strategyGroup: strategyGroup,
        runGroupName: runGroupName,
        strategyGroupName: strategyGroupName,
        metadata: metadata,
        selectionBounds: CutLines.createSelectionBoundsPayload(selectionBounds)
    };
};
