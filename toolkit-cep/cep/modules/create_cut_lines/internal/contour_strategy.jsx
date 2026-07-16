if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.resolveTextContourSource = function (textFrame) {
    try {
        if (textFrame && textFrame.textPath) {
            return textFrame.textPath;
        }
    } catch (error) {
        return null;
    }

    return null;
};

CutLines.executeContour = function (selection, runContext) {
    var created = 0;
    var skipped = 0;
    var i;
    var result;

    for (i = 0; i < selection.length; i += 1) {
        result = CutLines.copyContourFromItem(selection[i], runContext);
        created += result.created;
        skipped += result.skipped;
    }

    return {
        createdCount: created,
        skippedCount: skipped
    };
};

CutLines.copyContourFromItem = function (item, runContext) {
    var result = { created: 0, skipped: 0 };
    var duplicatedPath;
    var duplicatedCompound;
    var clippingSource;
    var nestedResult;
    var i;

    if (!item || item.locked || item.hidden) {
        return result;
    }

    if (CutLines.isOwnedCutLineItem(item)) {
        result.skipped += 1;
        return result;
    }

    switch (item.typename) {
        case "PathItem":
            if (!item.guides) {
                duplicatedPath = item.duplicate(runContext.strategyGroup, ElementPlacement.PLACEATBEGINNING);
                CutLines.stylePathItem(duplicatedPath, runContext.color);
                CutLines.applyMetadata(duplicatedPath, runContext.metadata);
                result.created += 1;
            } else {
                result.skipped += 1;
            }
            break;

        case "CompoundPathItem":
            duplicatedCompound = item.duplicate(runContext.strategyGroup, ElementPlacement.PLACEATBEGINNING);
            CutLines.styleCompoundPath(duplicatedCompound, runContext.color);
            CutLines.applyMetadata(duplicatedCompound, runContext.metadata);
            for (i = 0; i < duplicatedCompound.pathItems.length; i += 1) {
                CutLines.applyMetadata(duplicatedCompound.pathItems[i], runContext.metadata);
            }
            result.created += 1;
            break;

        case "GroupItem":
            if (item.clipped) {
                clippingSource = CutLines.findClippingSource(item);
                if (clippingSource) {
                    return CutLines.copyContourFromItem(clippingSource, runContext);
                }
            }

            for (i = 0; i < item.pageItems.length; i += 1) {
                nestedResult = CutLines.copyContourFromItem(item.pageItems[i], runContext);
                result.created += nestedResult.created;
                result.skipped += nestedResult.skipped;
            }
            break;

        case "TextFrame":
            clippingSource = CutLines.resolveTextContourSource(item);
            if (clippingSource) {
                return CutLines.copyContourFromItem(clippingSource, runContext);
            }
            result.skipped += 1;
            break;

        default:
            result.skipped += 1;
            break;
    }

    return result;
};
