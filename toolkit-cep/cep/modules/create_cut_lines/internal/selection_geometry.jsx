if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.getCombinedGeometricBounds = function (items) {
    var bounds = null;
    var i;
    var itemBounds;

    for (i = 0; i < items.length; i += 1) {
        itemBounds = CutLines.getItemGeometricBounds(items[i]);
        if (!itemBounds) {
            continue;
        }

        if (!bounds) {
            bounds = itemBounds;
        } else {
            bounds.left = Math.min(bounds.left, itemBounds.left);
            bounds.top = Math.max(bounds.top, itemBounds.top);
            bounds.right = Math.max(bounds.right, itemBounds.right);
            bounds.bottom = Math.min(bounds.bottom, itemBounds.bottom);
        }
    }

    return bounds;
};

CutLines.getItemGeometricBounds = function (item) {
    var bounds;

    if (!item) {
        return null;
    }

    try {
        bounds = item.geometricBounds;
    } catch (geometricError) {
        bounds = null;
    }

    if (!bounds || bounds.length !== 4) {
        try {
            bounds = item.visibleBounds;
        } catch (visibleError) {
            bounds = null;
        }
    }

    if (!bounds || bounds.length !== 4) {
        return null;
    }

    return {
        left: bounds[0],
        top: bounds[1],
        right: bounds[2],
        bottom: bounds[3]
    };
};

CutLines.findClippingSource = function (groupItem) {
    var i;

    for (i = 0; i < groupItem.pageItems.length; i += 1) {
        var pageItem = groupItem.pageItems[i];
        if (pageItem.typename === "PathItem" && pageItem.clipping) {
            return pageItem;
        }
        if (pageItem.typename === "CompoundPathItem" && CutLines.compoundHasClipping(pageItem)) {
            return pageItem;
        }
        if (pageItem.typename === "GroupItem") {
            var nested = CutLines.findClippingSource(pageItem);
            if (nested) {
                return nested;
            }
        }
    }

    return null;
};

CutLines.compoundHasClipping = function (compoundItem) {
    var i;

    for (i = 0; i < compoundItem.pathItems.length; i += 1) {
        if (compoundItem.pathItems[i].clipping) {
            return true;
        }
    }

    return false;
};
