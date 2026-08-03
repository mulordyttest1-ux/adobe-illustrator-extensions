if (!$.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__) {
    throw new Error("Place All Pages namespace was not initialized.");
}

var PlaceAllPdfPages = $.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__;

PlaceAllPdfPages.normalizeComparablePath = function (value) {
    return PlaceAllPdfPages.normalizePath(value).toLowerCase();
};

PlaceAllPdfPages.getDocumentPath = function (doc) {
    try {
        if (doc && doc.fullName && doc.fullName.fsName) {
            return PlaceAllPdfPages.normalizePath(doc.fullName.fsName);
        }
    } catch (error) {}

    return "";
};

PlaceAllPdfPages.findOpenDocumentByPath = function (sourcePath) {
    var normalizedSourcePath = PlaceAllPdfPages.normalizeComparablePath(sourcePath);
    var index;
    var doc;
    var docPath;

    for (index = 0; index < app.documents.length; index += 1) {
        doc = app.documents[index];
        docPath = PlaceAllPdfPages.normalizeComparablePath(
            PlaceAllPdfPages.getDocumentPath(doc)
        );
        if (docPath && docPath === normalizedSourcePath) {
            return doc;
        }
    }

    return null;
};

PlaceAllPdfPages.withAlertsSuppressed = function (callback) {
    var previousInteractionLevel = null;

    try {
        previousInteractionLevel = app.userInteractionLevel;
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    } catch (interactionError) {}

    try {
        return callback();
    } finally {
        if (previousInteractionLevel !== null) {
            try {
                app.userInteractionLevel = previousInteractionLevel;
            } catch (restoreError) {}
        }
    }
};

PlaceAllPdfPages.activateDocument = function (doc) {
    try {
        if (doc && typeof doc.activate === "function") {
            doc.activate();
        }
    } catch (activateError) {}
};

PlaceAllPdfPages.buildAiArtboardPages = function (sourceDoc) {
    var pages = [];
    var index;
    var artboard;
    var rect;

    if (!sourceDoc || !sourceDoc.artboards || !sourceDoc.artboards.length) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_AI_INSPECT_FAILED",
            "The selected AI file does not contain any artboards."
        );
    }

    for (index = 0; index < sourceDoc.artboards.length; index += 1) {
        artboard = sourceDoc.artboards[index];
        rect = artboard.artboardRect;
        pages.push({
            pageNumber: index + 1,
            widthPt: PlaceAllPdfPages.assertPositiveFinite(
                Math.abs(rect[2] - rect[0]),
                "artboard width"
            ),
            heightPt: PlaceAllPdfPages.assertPositiveFinite(
                Math.abs(rect[1] - rect[3]),
                "artboard height"
            ),
            rotationDegrees: 0,
            sourceLabel: String(artboard.name || "")
        });
    }

    return pages;
};

PlaceAllPdfPages.inspectAiArtboards = function (sourceFile, targetDoc) {
    var sourcePath = PlaceAllPdfPages.normalizePath(sourceFile && sourceFile.fsName);
    var targetPath = PlaceAllPdfPages.getDocumentPath(targetDoc);
    var sourceDoc = null;
    var openedByModule = false;
    var pages = null;
    var inspectionError = null;
    var closeError = null;

    if (
        sourcePath &&
        targetPath &&
        PlaceAllPdfPages.normalizeComparablePath(sourcePath) ===
            PlaceAllPdfPages.normalizeComparablePath(targetPath)
    ) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_AI_SAME_AS_TARGET",
            "The active document cannot place itself as a linked AI source."
        );
    }

    sourceDoc = PlaceAllPdfPages.findOpenDocumentByPath(sourcePath);
    if (sourceDoc === targetDoc) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_AI_SAME_AS_TARGET",
            "The active document cannot place itself as a linked AI source."
        );
    }
    if (sourceDoc && sourceDoc.saved === false) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_AI_SOURCE_UNSAVED",
            "Save the open AI source before placing all of its artboards."
        );
    }

    try {
        if (!sourceDoc) {
            sourceDoc = PlaceAllPdfPages.withAlertsSuppressed(function () {
                return app.open(sourceFile);
            });
            openedByModule = true;
        }

        pages = PlaceAllPdfPages.buildAiArtboardPages(sourceDoc);
    } catch (error) {
        inspectionError = error;
    } finally {
        if (openedByModule && sourceDoc) {
            try {
                PlaceAllPdfPages.withAlertsSuppressed(function () {
                    sourceDoc.close(SaveOptions.DONOTSAVECHANGES);
                });
            } catch (sourceCloseError) {
                closeError = sourceCloseError;
            }
        }
        PlaceAllPdfPages.activateDocument(targetDoc);
    }

    if (inspectionError) {
        if (inspectionError.placeAllPdfErrorCode) {
            throw inspectionError;
        }
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_AI_INSPECT_FAILED",
            "Unable to inspect the selected AI artboards.",
            {
                message: inspectionError && inspectionError.message
                    ? inspectionError.message
                    : String(inspectionError || "")
            }
        );
    }
    if (closeError) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_AI_INSPECT_FAILED",
            "The AI source was inspected but could not be closed safely.",
            {
                message: closeError && closeError.message
                    ? closeError.message
                    : String(closeError || "")
            }
        );
    }

    return pages;
};
