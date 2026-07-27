// PDF/source session helpers for Wedding Suite Standard.
$.global.WeddingSuiteStandard._readBinaryFile = function (file) {
    var previousEncoding = file.encoding;
    var contents = "";

    file.encoding = "BINARY";
    if (!file.open("r")) {
        file.encoding = previousEncoding;
        throw new Error("Khong mo duoc file PDF de doc so page: " + file.fsName);
    }

    try {
        contents = file.read();
    } finally {
        try {
            file.close();
        } catch (closeErr) { }
        file.encoding = previousEncoding;
    }

    return contents;
};

$.global.WeddingSuiteStandard._extractPdfPageCount = function (contents) {
    var maxCount = 0;
    var pageTreePattern = /\/Type\s*\/Pages[\s\S]{0,4000}?\/Count\s+(\d+)/g;
    var genericCountPattern = /\/Count\s+(\d+)/g;
    var match;

    while ((match = pageTreePattern.exec(contents))) {
        var pageTreeCount = parseInt(match[1], 10);
        if (pageTreeCount > maxCount) {
            maxCount = pageTreeCount;
        }
    }

    if (maxCount > 0) {
        return maxCount;
    }

    while ((match = genericCountPattern.exec(contents))) {
        var genericCount = parseInt(match[1], 10);
        if (genericCount > maxCount) {
            maxCount = genericCount;
        }
    }

    return maxCount;
};

$.global.WeddingSuiteStandard._readPdfPageCount = function (sourceFile) {
    var contents = $.global.WeddingSuiteStandard._readBinaryFile(sourceFile);
    return $.global.WeddingSuiteStandard._extractPdfPageCount(contents);
};

$.global.WeddingSuiteStandard._resolvePdfCropToBox = function () {
    try {
        if (typeof PDFBoxType === "undefined" || !PDFBoxType) {
            return null;
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
    } catch (e) { }

    return null;
};

$.global.WeddingSuiteStandard._snapshotPdfOpenOptions = function () {
    var options = null;
    var cropToBox = null;

    try {
        options = app.preferences.PDFFileOptions;
    } catch (e) { }

    if (!options) {
        return null;
    }

    try {
        cropToBox = options.pDFCropToBox;
    } catch (cropErr) {
        cropToBox = null;
    }

    return {
        pageToOpen: Number(options.pageToOpen) || 1,
        pDFCropToBox: cropToBox
    };
};

$.global.WeddingSuiteStandard._restorePdfOpenOptions = function (snapshot) {
    var options = null;

    if (!snapshot) {
        return;
    }

    try {
        options = app.preferences.PDFFileOptions;
    } catch (e) { }

    if (!options) {
        return;
    }

    try {
        options.pageToOpen = snapshot.pageToOpen;
    } catch (restoreErr) { }

    try {
        options.pDFCropToBox = snapshot.pDFCropToBox;
    } catch (restoreCropErr) { }
};

$.global.WeddingSuiteStandard._openPdfPageDocument = function (sourceFile, pageNumber) {
    var snapshot = $.global.WeddingSuiteStandard._snapshotPdfOpenOptions();
    var options = null;
    var cropToBox = $.global.WeddingSuiteStandard._resolvePdfCropToBox();

    try {
        options = app.preferences.PDFFileOptions;
    } catch (e) { }

    try {
        if (options) {
            options.pageToOpen = pageNumber;
            if (cropToBox !== null) {
                options.pDFCropToBox = cropToBox;
            }
        }
        return app.open(sourceFile);
    } finally {
        $.global.WeddingSuiteStandard._restorePdfOpenOptions(snapshot);
    }
};

$.global.WeddingSuiteStandard._collectArtboardPages = function (doc) {
    var pages = [];
    var i;

    for (i = 0; i < doc.artboards.length; i++) {
        var artboard = doc.artboards[i];
        var rect = artboard.artboardRect;
        pages.push({
            pageNumber: i + 1,
            sourceIndex: i,
            name: artboard.name || ("Page " + (i + 1)),
            widthMm: $.global.WeddingSuiteStandard._ptToMm(rect[2] - rect[0]),
            heightMm: $.global.WeddingSuiteStandard._ptToMm(rect[1] - rect[3])
        });
    }

    return pages;
};

$.global.WeddingSuiteStandard._buildPageDescriptor = function (pageNumber, sourceIndex, name, rect) {
    return {
        pageNumber: pageNumber,
        sourceIndex: sourceIndex,
        name: name || ("Page " + pageNumber),
        widthMm: $.global.WeddingSuiteStandard._ptToMm(rect[2] - rect[0]),
        heightMm: $.global.WeddingSuiteStandard._ptToMm(rect[1] - rect[3])
    };
};

$.global.WeddingSuiteStandard._inspectDocumentManifest = function (doc, sourcePath) {
    var pages = $.global.WeddingSuiteStandard._collectArtboardPages(doc);
    return {
        success: true,
        sourcePath: sourcePath || $.global.WeddingSuiteStandard._getDocumentPath(doc),
        sourceName: doc && doc.name ? doc.name : "",
        totalPages: pages.length,
        pages: pages.slice(0, 5)
    };
};

$.global.WeddingSuiteStandard._getSourceDocument = function (session, sourceIndex) {
    var pageNumber;

    if (!session) {
        return null;
    }

    if (session.kind !== "pdf") {
        return session.doc;
    }

    pageNumber = Number(sourceIndex) + 1;
    if (!(pageNumber > 0)) {
        return null;
    }

    if (!session.pageDocs[pageNumber]) {
        session.pageDocs[pageNumber] = $.global.WeddingSuiteStandard._openPdfPageDocument(session.sourceFile, pageNumber);
    }

    return session.pageDocs[pageNumber];
};

$.global.WeddingSuiteStandard._getSourceArtboardIndex = function (session, sourceIndex) {
    return session && session.kind === "pdf" ? 0 : sourceIndex;
};

$.global.WeddingSuiteStandard._inspectPdfManifest = function (session) {
    var pages = [];
    var totalPages = Math.max(0, Number(session.totalPages) || 0);
    var limit = Math.min(totalPages, 5);
    var i;

    for (i = 1; i <= limit; i++) {
        var doc = $.global.WeddingSuiteStandard._getSourceDocument(session, i - 1);
        if (!doc || !doc.artboards.length) {
            throw new Error("Khong mo duoc page " + i + " cua file PDF.");
        }
        pages.push(
            $.global.WeddingSuiteStandard._buildPageDescriptor(
                i,
                i - 1,
                "Page " + i,
                doc.artboards[0].artboardRect
            )
        );
    }

    return {
        success: true,
        sourcePath: session.sourcePath || "",
        sourceName: session.sourceFile ? (session.sourceFile.displayName || session.sourceFile.name || "") : "",
        totalPages: totalPages,
        pages: pages
    };
};

$.global.WeddingSuiteStandard._inspectSourceSession = function (session) {
    if (session && session.kind === "pdf") {
        return $.global.WeddingSuiteStandard._inspectPdfManifest(session);
    }

    return $.global.WeddingSuiteStandard._inspectDocumentManifest(session.doc, session.sourcePath);
};

$.global.WeddingSuiteStandard._openSourceSession = function (sourcePath) {
    var sourceFile;

    if (!sourcePath) {
        throw new Error("Chua co duong dan file nguon.");
    }

    sourceFile = new File(sourcePath);
    if (!sourceFile.exists) {
        throw new Error("Khong tim thay file nguon: " + sourcePath);
    }

    if ($.global.WeddingSuiteStandard._isPdfSourcePath(sourceFile.fsName)) {
        return {
            kind: "pdf",
            sourceFile: sourceFile,
            sourcePath: sourceFile.fsName,
            totalPages: $.global.WeddingSuiteStandard._readPdfPageCount(sourceFile),
            pageDocs: []
        };
    }

    return {
        kind: "document",
        doc: app.open(sourceFile),
        shouldClose: true,
        sourcePath: sourceFile.fsName
    };
};

$.global.WeddingSuiteStandard._closeSourceSession = function (session) {
    var i;

    if (!session) {
        return;
    }

    if (session.kind === "pdf" && session.pageDocs && session.pageDocs.length) {
        for (i = 0; i < session.pageDocs.length; i++) {
            $.global.WeddingSuiteStandard._safeCloseDocument(session.pageDocs[i]);
        }
        return;
    }

    if (!session.doc || !session.shouldClose) {
        return;
    }

    $.global.WeddingSuiteStandard._safeCloseDocument(session.doc);
};
