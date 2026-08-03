if (!$.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__) {
    throw new Error("Place All Pages namespace was not initialized.");
}

var PlaceAllPdfPages = $.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__;

PlaceAllPdfPages.resolveCropToBox = function (sourceType) {
    try {
        if (typeof PDFBoxType === "undefined" || !PDFBoxType) {
            return null;
        }
        if (sourceType === "ai" && typeof PDFBoxType.PDFMEDIABOX !== "undefined") {
            return PDFBoxType.PDFMEDIABOX;
        }
        if (typeof PDFBoxType.PDFTRIMBOX !== "undefined") {
            return PDFBoxType.PDFTRIMBOX;
        }
        if (typeof PDFBoxType.PDFCROPBOX !== "undefined") {
            return PDFBoxType.PDFCROPBOX;
        }
        if (typeof PDFBoxType.PDFMEDIABOX !== "undefined") {
            return PDFBoxType.PDFMEDIABOX;
        }
    } catch (error) {}

    return null;
};

PlaceAllPdfPages.snapshotPdfOptions = function () {
    var options = null;
    var internalPageNumber = null;
    var pageToOpen = null;
    var pDFCropToBox = null;

    try {
        options = app.preferences.PDFFileOptions;
    } catch (error) {}

    try {
        if (typeof app.preferences.getIntegerPreference === "function") {
            internalPageNumber = app.preferences.getIntegerPreference("plugin/PDFImport/PageNumber");
        }
    } catch (preferenceError) {}

    if (options) {
        try {
            pageToOpen = Number(options.pageToOpen) || 1;
        } catch (pageError) {}
        try {
            pDFCropToBox = options.pDFCropToBox;
        } catch (cropError) {}
    }

    return {
        pageToOpen: pageToOpen,
        pDFCropToBox: pDFCropToBox,
        internalPageNumber: internalPageNumber
    };
};

PlaceAllPdfPages.restorePdfOptions = function (snapshot) {
    var options = null;

    if (!snapshot) {
        return;
    }

    try {
        options = app.preferences.PDFFileOptions;
    } catch (error) {}

    if (options && snapshot.pageToOpen !== null) {
        try {
            options.pageToOpen = snapshot.pageToOpen;
        } catch (pageError) {}
    }
    if (options) {
        try {
            options.pDFCropToBox = snapshot.pDFCropToBox;
        } catch (cropError) {}
    }
    if (
        snapshot.internalPageNumber !== null &&
        typeof app.preferences.setIntegerPreference === "function"
    ) {
        try {
            app.preferences.setIntegerPreference(
                "plugin/PDFImport/PageNumber",
                snapshot.internalPageNumber
            );
        } catch (restorePreferenceError) {}
    }
};

PlaceAllPdfPages.setPdfPageOptions = function (pageNumber, sourceType) {
    var options = null;
    var cropToBox = PlaceAllPdfPages.resolveCropToBox(sourceType);

    try {
        options = app.preferences.PDFFileOptions;
    } catch (error) {}

    if (options) {
        options.pageToOpen = pageNumber;
        if (cropToBox !== null) {
            options.pDFCropToBox = cropToBox;
        }
    }

    try {
        if (typeof app.preferences.setIntegerPreference === "function") {
            app.preferences.setIntegerPreference("plugin/PDFImport/PageNumber", pageNumber);
        }
    } catch (preferenceError) {}
};

PlaceAllPdfPages.getItemDimensions = function (item) {
    var bounds = item.geometricBounds;

    return {
        left: bounds[0],
        top: bounds[1],
        right: bounds[2],
        bottom: bounds[3],
        width: Math.abs(bounds[2] - bounds[0]),
        height: Math.abs(bounds[1] - bounds[3])
    };
};

PlaceAllPdfPages.translateItemTo = function (item, left, top) {
    var bounds = PlaceAllPdfPages.getItemDimensions(item);
    var deltaX = left - bounds.left;
    var deltaY = top - bounds.top;

    if (typeof item.translate === "function") {
        item.translate(deltaX, deltaY);
    } else {
        item.position = [left, top];
    }
};

PlaceAllPdfPages.assertPlacedSize = function (item, page, sourceType) {
    var dimensions = PlaceAllPdfPages.getItemDimensions(item);
    var tolerance = 2;

    if (
        Math.abs(dimensions.width - page.widthPt) > tolerance ||
        Math.abs(dimensions.height - page.heightPt) > tolerance
    ) {
        throw PlaceAllPdfPages.createModuleError(
            sourceType === "ai"
                ? "PLACE_ALL_AI_PDF_COMPATIBILITY_REQUIRED"
                : "PLACE_ALL_PDF_PLACE_FAILED",
            sourceType === "ai"
                ? "AI artboard " + page.pageNumber +
                    " could not be placed at its artboard size. Save the source with Create PDF Compatible File enabled."
                : "Placed PDF page " + page.pageNumber + " size does not match its TrimBox.",
            {
                pageNumber: page.pageNumber,
                expectedWidthPt: page.widthPt,
                expectedHeightPt: page.heightPt,
                actualWidthPt: dimensions.width,
                actualHeightPt: dimensions.height
            }
        );
    }
};

PlaceAllPdfPages.makeLinkedItemName = function (sourceType, pageNumber) {
    var prefix = sourceType === "ai"
        ? PlaceAllPdfPages.aiItemPrefix
        : PlaceAllPdfPages.pageItemPrefix;

    return prefix + ("000" + pageNumber).slice(-3);
};

PlaceAllPdfPages.placePage = function (doc, layer, request, placement) {
    var snapshot = PlaceAllPdfPages.snapshotPdfOptions();
    var item = null;

    try {
        try {
            PlaceAllPdfPages.setPdfPageOptions(
                placement.page.pageNumber,
                request.sourceType
            );
            item = doc.placedItems.add();
            item.file = request.sourceFile;
            item.name = PlaceAllPdfPages.makeLinkedItemName(
                request.sourceType,
                placement.page.pageNumber
            );
            if (placement.page.rotationDegrees) {
                item.rotate(-placement.page.rotationDegrees);
            }
            PlaceAllPdfPages.assertPlacedSize(
                item,
                placement.page,
                request.sourceType
            );
            PlaceAllPdfPages.translateItemTo(
                item,
                placement.contentRect[0],
                placement.contentRect[1]
            );
            item.move(layer, ElementPlacement.PLACEATEND);
            return item;
        } catch (placementError) {
            if (
                request.sourceType === "ai" &&
                !(placementError && placementError.placeAllPdfErrorCode)
            ) {
                throw PlaceAllPdfPages.createModuleError(
                    "PLACE_ALL_AI_PDF_COMPATIBILITY_REQUIRED",
                    "Unable to place AI artboard " + placement.page.pageNumber +
                        ". Save the source with Create PDF Compatible File enabled.",
                    {
                        pageNumber: placement.page.pageNumber,
                        message: placementError && placementError.message
                            ? placementError.message
                            : String(placementError || "")
                    }
                );
            }
            throw placementError;
        }
    } finally {
        PlaceAllPdfPages.restorePdfOptions(snapshot);
    }
};
