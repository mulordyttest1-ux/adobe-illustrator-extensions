if (!$.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__) {
    throw new Error("Place All Pages namespace was not initialized.");
}

var PlaceAllPdfPages = $.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__;

PlaceAllPdfPages.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

PlaceAllPdfPages.getBaseName = function (sourceName, sourcePath) {
    var value = String(sourceName || sourcePath || "PDF");
    var slashIndex = Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\"));
    var lastDot;

    if (slashIndex >= 0) {
        value = value.substring(slashIndex + 1);
    }

    lastDot = value.lastIndexOf(".");
    if (lastDot > 0) {
        value = value.substring(0, lastDot);
    }

    return value || "PDF";
};

PlaceAllPdfPages.makeUniqueLayerName = function (doc, baseName) {
    var candidate = baseName;
    var suffix = 2;
    var index;

    while (true) {
        for (index = 0; index < doc.layers.length; index += 1) {
            if (doc.layers[index].name === candidate) {
                candidate = baseName + " " + suffix;
                suffix += 1;
                break;
            }
        }

        if (index >= doc.layers.length) {
            return candidate;
        }
    }
};

PlaceAllPdfPages.makeArtboardName = function (baseName, pageNumber) {
    return "PDF " + baseName + " - Page " + (
        "000" + pageNumber
    ).slice(-3);
};

PlaceAllPdfPages.makeSourceArtboardName = function (baseName, sourceType, pageNumber) {
    if (sourceType === "ai") {
        return "AI " + baseName + " - Artboard " + (
            "000" + pageNumber
        ).slice(-3);
    }

    return PlaceAllPdfPages.makeArtboardName(baseName, pageNumber);
};

PlaceAllPdfPages.createResultData = function (request, placementState, layerName, firstArtboardIndex) {
    return {
        sourcePath: request.sourcePath,
        sourceType: request.sourceType,
        sourceUnitCount: request.pageCount,
        pageCount: request.pageCount,
        linkedItemCount: placementState.items.length,
        artboardCountAdded: placementState.artboardIndexes.length,
        firstArtboardIndex: firstArtboardIndex,
        lastArtboardIndex: firstArtboardIndex + placementState.artboardIndexes.length - 1,
        cropBox: request.cropBox,
        layerName: layerName
    };
};

PlaceAllPdfPages.removeCreatedArtboards = function (doc, indexes) {
    var index;

    for (index = indexes.length - 1; index >= 0; index -= 1) {
        try {
            doc.artboards.remove(indexes[index]);
        } catch (removeError) {}
    }
};

PlaceAllPdfPages.restoreSelection = function (doc, selection) {
    var index;

    try {
        doc.selection = null;
    } catch (clearError) {}

    for (index = 0; index < selection.length; index += 1) {
        try {
            selection[index].selected = true;
        } catch (selectError) {}
    }
};

PlaceAllPdfPages.execute = function (payload) {
    var doc;
    var request;
    var layout;
    var layer;
    var layerName;
    var firstArtboardIndex;
    var placementState = {
        items: [],
        artboardIndexes: []
    };
    var previousArtboardIndex = 0;
    var previousActiveLayer = null;
    var previousSelection = [];
    var index;
    var placement;
    var artboard;
    var pageBaseName;
    var currentSelection;

    if (!app.documents.length) {
        return PlaceAllPdfPages.createFailure(
            "Open a document before running Place All Pages.",
            "PLACE_ALL_PDF_REQUIRES_DOCUMENT"
        );
    }

    doc = app.activeDocument;

    try {
        request = PlaceAllPdfPages.resolveRequest(payload || {}, doc);

        if (doc.artboards.length + request.pageCount > PlaceAllPdfPages.artboardLimit) {
            throw PlaceAllPdfPages.createModuleError(
                "PLACE_ALL_PDF_ARTBOARD_LIMIT",
                "The PDF has too many pages for the remaining Illustrator artboard limit.",
                {
                    existingArtboardCount: doc.artboards.length,
                    pageCount: request.pageCount,
                    artboardLimit: PlaceAllPdfPages.artboardLimit
                }
            );
        }

        previousArtboardIndex = doc.artboards.getActiveArtboardIndex();
        try {
            previousActiveLayer = doc.activeLayer;
        } catch (activeLayerError) {}
        currentSelection = doc.selection || [];
        for (index = 0; index < currentSelection.length; index += 1) {
            previousSelection.push(currentSelection[index]);
        }

        layout = PlaceAllPdfPages.buildPlacements(doc, request.pages);
        pageBaseName = PlaceAllPdfPages.getBaseName(request.sourceName, request.sourcePath);
        layerName = PlaceAllPdfPages.makeUniqueLayerName(
            doc,
            (request.sourceType === "ai" ? "AI Artboards - " : "PDF Pages - ") +
                pageBaseName
        );
        firstArtboardIndex = doc.artboards.length;
        layer = doc.layers.add();
        layer.name = layerName;
        doc.activeLayer = layer;

        for (index = 0; index < layout.placements.length; index += 1) {
            placement = layout.placements[index];
            placementState.items.push(
                PlaceAllPdfPages.placePage(doc, layer, request, placement)
            );

            try {
                artboard = doc.artboards.add(placement.rect);
            } catch (artboardError) {
                throw PlaceAllPdfPages.createModuleError(
                    "PLACE_ALL_PDF_CANVAS_LIMIT",
                    "Illustrator cannot create the remaining PDF page artboards within the current canvas.",
                    {
                        pageNumber: placement.page.pageNumber,
                        message: artboardError && artboardError.message ? artboardError.message : ""
                    }
                );
            }
            placementState.artboardIndexes.push(doc.artboards.length - 1);
            artboard.name = PlaceAllPdfPages.makeSourceArtboardName(
                pageBaseName,
                request.sourceType,
                placement.page.pageNumber
            );
        }

        doc.selection = null;
        doc.artboards.setActiveArtboardIndex(firstArtboardIndex);
        try {
            if (typeof doc.activate === "function") {
                doc.activate();
            }
            app.redraw();
        } catch (activateError) {}

        return {
            success: true,
            message: "Placed " + request.pageCount + " linked " +
                (request.sourceType === "ai" ? "AI artboard(s)" : "PDF page(s)") +
                " and created " +
                request.pageCount + " artboard(s).",
            errorCode: null,
            data: PlaceAllPdfPages.createResultData(
                request,
                placementState,
                layerName,
                firstArtboardIndex
            )
        };
    } catch (error) {
        PlaceAllPdfPages.removeCreatedArtboards(doc, placementState.artboardIndexes);
        try {
            if (layer) {
                layer.remove();
            }
        } catch (removeLayerError) {}
        try {
            if (previousActiveLayer) {
                doc.activeLayer = previousActiveLayer;
            }
        } catch (restoreLayerError) {}
        PlaceAllPdfPages.restoreSelection(doc, previousSelection);
        try {
            doc.artboards.setActiveArtboardIndex(previousArtboardIndex);
        } catch (restoreArtboardError) {}

        if (error && error.placeAllPdfErrorCode) {
            return PlaceAllPdfPages.createFailure(
                error.message,
                error.placeAllPdfErrorCode,
                error.placeAllPdfErrorData
            );
        }

        return PlaceAllPdfPages.createFailure(
            error && error.message ? error.message : "Place All Pages failed.",
            "PLACE_ALL_PDF_PLACE_FAILED"
        );
    }
};
