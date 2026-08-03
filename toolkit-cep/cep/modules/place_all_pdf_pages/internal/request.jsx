if (!$.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__) {
    throw new Error("Place All Pages namespace was not initialized.");
}

var PlaceAllPdfPages = $.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__;

PlaceAllPdfPages.createModuleError = function (errorCode, message, data) {
    var error = new Error(message);

    error.placeAllPdfErrorCode = errorCode;
    error.placeAllPdfErrorData = data || null;

    return error;
};

PlaceAllPdfPages.trimString = function (value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
};

PlaceAllPdfPages.normalizePath = function (value) {
    return PlaceAllPdfPages.trimString(value).replace(/\\/g, "/");
};

PlaceAllPdfPages.isFiniteNumber = function (value) {
    return typeof value === "number" && isFinite(value);
};

PlaceAllPdfPages.assertPositiveFinite = function (value, label) {
    var numericValue = Number(value);

    if (!PlaceAllPdfPages.isFiniteNumber(numericValue) || numericValue <= 0) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_PDF_INVALID_MANIFEST",
            "PDF " + label + " must be a positive finite number."
        );
    }

    return numericValue;
};

PlaceAllPdfPages.normalizeRotation = function (value) {
    var rotation = Number(value || 0);
    var normalized = ((rotation % 360) + 360) % 360;

    if (normalized !== 0 && normalized !== 90 && normalized !== 180 && normalized !== 270) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_PDF_INVALID_MANIFEST",
            "PDF page rotation is not supported: " + rotation
        );
    }

    return normalized;
};

PlaceAllPdfPages.resolveSourceFile = function (payload) {
    var sourcePath = PlaceAllPdfPages.normalizePath(payload && payload.sourcePath);
    var sourceFile;

    if (!sourcePath) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_PDF_INVALID_MANIFEST",
            "A PDF or AI source path is required."
        );
    }

    sourceFile = new File(sourcePath);
    if (!sourceFile.exists) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_PDF_UNREADABLE",
            "The selected source no longer exists: " + sourceFile.fsName
        );
    }

    return sourceFile;
};

PlaceAllPdfPages.resolveSourceType = function (payload, sourceFile) {
    var requestedType = PlaceAllPdfPages.trimString(
        payload && payload.sourceType
    ).toLowerCase();
    var sourcePath = PlaceAllPdfPages.normalizePath(
        sourceFile && sourceFile.fsName
    ).toLowerCase();
    var inferredType = /\.ai$/.test(sourcePath) ? "ai" :
        (/\.pdf$/.test(sourcePath) ? "pdf" : "");

    if (
        (requestedType !== "pdf" && requestedType !== "ai") ||
        !inferredType ||
        requestedType !== inferredType
    ) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_SOURCE_UNSUPPORTED",
            "The selected source must be a PDF or AI file."
        );
    }

    return requestedType;
};

PlaceAllPdfPages.normalizePageDescriptor = function (rawPage, index) {
    var page = rawPage || {};
    var pageNumber = Number(page.pageNumber);
    var widthPt = PlaceAllPdfPages.assertPositiveFinite(page.widthPt, "page width");
    var heightPt = PlaceAllPdfPages.assertPositiveFinite(page.heightPt, "page height");
    var rotationDegrees = PlaceAllPdfPages.normalizeRotation(page.rotationDegrees);

    if (pageNumber !== index + 1) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_PDF_INVALID_MANIFEST",
            "PDF page order is invalid at index " + index + "."
        );
    }

    return {
        pageNumber: pageNumber,
        widthPt: widthPt,
        heightPt: heightPt,
        rotationDegrees: rotationDegrees,
        sourceLabel: PlaceAllPdfPages.trimString(page.sourceLabel || "")
    };
};

PlaceAllPdfPages.resolveRequest = function (payload, doc) {
    var pages = payload && payload.pages instanceof Array ? payload.pages : [];
    var pageCount = Number(payload && payload.pageCount);
    var normalizedPages = [];
    var sourceFile = PlaceAllPdfPages.resolveSourceFile(payload);
    var sourceType = PlaceAllPdfPages.resolveSourceType(payload, sourceFile);
    var index;

    if (sourceType === "ai") {
        pages = PlaceAllPdfPages.inspectAiArtboards(sourceFile, doc);
        pageCount = pages.length;
    }

    if (!pages.length || !pageCount || pageCount !== pages.length) {
        throw PlaceAllPdfPages.createModuleError(
            "PLACE_ALL_PDF_INVALID_MANIFEST",
            "The source page manifest is empty or inconsistent."
        );
    }

    for (index = 0; index < pages.length; index += 1) {
        normalizedPages.push(PlaceAllPdfPages.normalizePageDescriptor(pages[index], index));
    }

    return {
        sourceFile: sourceFile,
        sourceType: sourceType,
        sourcePath: PlaceAllPdfPages.normalizePath(payload.sourcePath),
        sourceName: PlaceAllPdfPages.trimString(payload.sourceName || ""),
        pageCount: pageCount,
        cropBox: sourceType === "ai" ? "artboard" : "trim",
        pages: normalizedPages
    };
};
