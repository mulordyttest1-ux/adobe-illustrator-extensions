if (!$.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__) {
    throw new Error("Rasterize Bitmap namespace was not initialized.");
}

var RasterizeBitmap = $.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__;

RasterizeBitmap.cloneBounds = function (bounds) {
    if (!bounds || bounds.length !== 4) {
        return null;
    }

    return [bounds[0], bounds[1], bounds[2], bounds[3]];
};

RasterizeBitmap.getBoundsWidth = function (bounds) {
    return Math.abs(bounds[2] - bounds[0]);
};

RasterizeBitmap.getBoundsHeight = function (bounds) {
    return Math.abs(bounds[1] - bounds[3]);
};

RasterizeBitmap.getVisibleBounds = function (item) {
    try {
        return RasterizeBitmap.cloneBounds(item.visibleBounds);
    } catch (error) {
        return null;
    }
};

RasterizeBitmap.getFallbackBounds = function (item) {
    try {
        return RasterizeBitmap.cloneBounds(item.geometricBounds);
    } catch (error) {
        return null;
    }
};

RasterizeBitmap.resolveItemBounds = function (item) {
    var bounds = RasterizeBitmap.getVisibleBounds(item);

    if (!bounds) {
        bounds = RasterizeBitmap.getFallbackBounds(item);
    }

    return bounds;
};

RasterizeBitmap.ensureUsableBounds = function (bounds) {
    if (!bounds || bounds.length !== 4) {
        throw RasterizeBitmap.createModuleError(
            "RASTERIZE_SELECTION_EMPTY_BOUNDS",
            "The current selection has no rasterizable bounds."
        );
    }

    if (RasterizeBitmap.getBoundsWidth(bounds) <= 0 || RasterizeBitmap.getBoundsHeight(bounds) <= 0) {
        throw RasterizeBitmap.createModuleError(
            "RASTERIZE_SELECTION_EMPTY_BOUNDS",
            "The current selection has empty rasterize bounds.",
            {
                bounds: bounds
            }
        );
    }

    return bounds;
};

RasterizeBitmap.createRasterizeOptions = function (request) {
    var options = new RasterizeOptions();

    options.colorModel = request.colorModel;
    options.resolution = request.resolution;
    options.transparency = request.transparency;
    options.backgroundBlack = request.backgroundBlack;
    options.clippingMask = request.clippingMask;
    options.padding = request.padding;
    options.convertSpotColors = request.convertSpotColors;
    options.includeLayers = request.includeLayers;
    options.convertTextToOutlines = request.convertTextToOutlines;
    options.antiAliasingMethod = request.antiAliasingMethod;

    return options;
};

RasterizeBitmap.moveItemsToStagingGroup = function (items, stagingGroup) {
    var index;

    for (index = 0; index < items.length; index += 1) {
        items[index].move(stagingGroup, ElementPlacement.PLACEATEND);
    }
};

RasterizeBitmap.ensureRasterParent = function (rasterItem, anchorParent) {
    try {
        if (rasterItem.parent !== anchorParent) {
            rasterItem.move(anchorParent, ElementPlacement.PLACEATEND);
        }
    } catch (error) {}
};

RasterizeBitmap.readBitsPerChannel = function (rasterItem) {
    try {
        if (typeof rasterItem.bitsPerChannel !== "undefined") {
            return rasterItem.bitsPerChannel;
        }
    } catch (error) {}

    return 1;
};

RasterizeBitmap.performRasterize = function (doc, items, request) {
    var anchorParent = RasterizeBitmap.resolveAnchorParent(items);
    var stagingGroup = RasterizeBitmap.createStagingGroup(anchorParent);
    var selectionCountBefore = items.length;
    var boundsBefore;
    var rasterItem;
    var boundsAfter;

    RasterizeBitmap.moveItemsToStagingGroup(items, stagingGroup);
    boundsBefore = RasterizeBitmap.ensureUsableBounds(RasterizeBitmap.resolveItemBounds(stagingGroup));

    try {
        rasterItem = doc.rasterize(
            stagingGroup,
            boundsBefore,
            RasterizeBitmap.createRasterizeOptions(request)
        );
    } catch (error) {
        throw RasterizeBitmap.createModuleError(
            "RASTERIZE_SELECTION_FAILED",
            error && error.message ? error.message : "Rasterize failed."
        );
    }

    if (!rasterItem) {
        throw RasterizeBitmap.createModuleError(
            "RASTERIZE_SELECTION_FAILED",
            "Illustrator did not return a raster item."
        );
    }

    try {
        rasterItem.name = RasterizeBitmap.outputItemName;
    } catch (nameError) {}

    RasterizeBitmap.ensureRasterParent(rasterItem, anchorParent);

    try {
        app.redraw();
    } catch (redrawError) {}

    boundsAfter = RasterizeBitmap.resolveItemBounds(rasterItem);
    RasterizeBitmap.selectRasterItem(doc, rasterItem);

    return {
        selectionCountBefore: selectionCountBefore,
        rasterItemCountAfter: 1,
        colorModel: request.colorModelName,
        resolution: request.resolution,
        transparent: request.transparency,
        bitsPerChannel: RasterizeBitmap.readBitsPerChannel(rasterItem),
        boundsBefore: boundsBefore,
        boundsAfter: boundsAfter || boundsBefore
    };
};
