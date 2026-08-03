// Output and temporary-document lifecycle helpers for Wedding Suite Standard.
$.global.WeddingSuiteStandard._safeCloseDocument = function (doc) {
    if (!doc) {
        return;
    }

    try {
        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (e) {
        try {
            doc.close();
        } catch (ignoreErr) { }
    }
};

$.global.WeddingSuiteStandard._isDocumentOpen = function (doc, knownPath) {
    var normalizedKnownPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(knownPath || "");
    var index;
    var candidate;
    var candidatePath;

    if (!doc && !normalizedKnownPath) {
        return false;
    }

    for (index = 0; index < app.documents.length; index += 1) {
        candidate = app.documents[index];
        try {
            if (doc && candidate === doc) {
                return true;
            }
        } catch (identityErr) { }

        if (normalizedKnownPath) {
            candidatePath = $.global.WeddingSuiteStandard._normalizeDocumentPath(
                $.global.WeddingSuiteStandard._getDocumentPathSafe(candidate)
            );
            if (candidatePath && candidatePath === normalizedKnownPath) {
                return true;
            }
        }
    }

    return false;
};

$.global.WeddingSuiteStandard._closeDocumentRequired = function (doc, label) {
    var knownPath;
    var closeError = null;

    if (!doc) {
        return;
    }

    knownPath = $.global.WeddingSuiteStandard._getDocumentPathSafe(doc);
    try {
        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (e) {
        closeError = e;
    }

    if ($.global.WeddingSuiteStandard._isDocumentOpen(doc, knownPath)) {
        throw new Error(
            "Khong the dong " + String(label || "tai lieu tam") +
            (closeError && closeError.message ? ": " + closeError.message : ".")
        );
    }
};

$.global.WeddingSuiteStandard._ensureFolderExists = function (folder) {
    var parentFolder = null;

    if (!folder) {
        return false;
    }

    if (folder.exists) {
        return true;
    }

    try {
        parentFolder = new Folder($.global.WeddingSuiteStandard._getDirectoryName(folder.fsName));
    } catch (parentErr) {
        parentFolder = null;
    }

    if (parentFolder && parentFolder.fsName && parentFolder.fsName !== folder.fsName && !parentFolder.exists) {
        if (!$.global.WeddingSuiteStandard._ensureFolderExists(parentFolder)) {
            return false;
        }
    }

    try {
        return folder.create();
    } catch (createErr) {
        return false;
    }
};

$.global.WeddingSuiteStandard._removeFileIfExists = function (fileOrPath) {
    var file = fileOrPath instanceof File ? fileOrPath : new File(fileOrPath || "");

    if (!file || !file.exists) {
        return true;
    }

    try {
        return file.remove();
    } catch (removeErr) {
        return false;
    }
};

$.global.WeddingSuiteStandard._removeFolderTree = function (folderOrPath) {
    var folder = folderOrPath instanceof Folder ? folderOrPath : new Folder(folderOrPath || "");
    var entries;
    var i;
    var removed = true;

    if (!folder || !folder.exists) {
        return true;
    }

    try {
        entries = folder.getFiles();
    } catch (readErr) {
        return false;
    }

    for (i = 0; i < entries.length; i += 1) {
        if (entries[i] instanceof Folder) {
            if (!$.global.WeddingSuiteStandard._removeFolderTree(entries[i])) {
                removed = false;
            }
        } else if (!$.global.WeddingSuiteStandard._removeFileIfExists(entries[i])) {
            removed = false;
        }
    }

    try {
        if (folder.exists && !folder.remove()) {
            removed = false;
        }
    } catch (removeErr) {
        removed = false;
    }

    return removed;
};

$.global.WeddingSuiteStandard._getTempJobsRoot = function () {
    var folder = new Folder(Folder.temp.fsName + "/symbol_cep_wedding_suite_jobs");

    if (!$.global.WeddingSuiteStandard._ensureFolderExists(folder)) {
        throw new Error("Khong the tao thu muc tam Wedding Suite: " + folder.fsName);
    }

    return folder;
};

$.global.WeddingSuiteStandard._cleanupStaleTempJobs = function () {
    var root;
    var folders;
    var cutoff = new Date().getTime() - (24 * 60 * 60 * 1000);
    var i;
    var modified;

    try {
        root = $.global.WeddingSuiteStandard._getTempJobsRoot();
        folders = root.getFiles(function (entry) {
            return entry instanceof Folder;
        });
    } catch (readErr) {
        return;
    }

    for (i = 0; i < folders.length; i += 1) {
        try {
            modified = folders[i].modified;
            if (modified && modified.getTime && modified.getTime() < cutoff) {
                $.global.WeddingSuiteStandard._removeFolderTree(folders[i]);
            }
        } catch (cleanupErr) { }
    }
};

$.global.WeddingSuiteStandard._cleanupLegacyReviewCache = function () {
    var folder = new Folder(Folder.temp.fsName + "/symbol_cep_wedding_suite_review");
    var files;
    var i;
    var doc;

    if (!folder.exists) {
        return;
    }

    try {
        files = folder.getFiles("*.ai");
    } catch (readErr) {
        return;
    }

    for (i = 0; i < files.length; i += 1) {
        try {
            doc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(files[i].fsName);
            if (doc && doc.saved === false) {
                continue;
            }
            if (doc) {
                $.global.WeddingSuiteStandard._safeCloseDocument(doc);
            }
            $.global.WeddingSuiteStandard._removeFileIfExists(files[i]);
        } catch (cleanupErr) { }
    }

    try {
        if (!folder.getFiles().length) {
            folder.remove();
        }
    } catch (removeFolderErr) { }
};

$.global.WeddingSuiteStandard._createTempJobContext = function (payload) {
    var root = $.global.WeddingSuiteStandard._getTempJobsRoot();
    var stem = payload && payload.output ? payload.output.filenameStem : "job";
    var safeStem = $.global.WeddingSuiteStandard._sanitizeFileSegment(stem);
    var jobId = String(new Date().getTime()) + "_" + Math.floor(Math.random() * 100000) + "_" + safeStem;
    var folder = new Folder(root.fsName + "/" + jobId);

    if (!$.global.WeddingSuiteStandard._ensureFolderExists(folder)) {
        throw new Error("Khong the tao workspace tam Wedding Suite: " + folder.fsName);
    }

    return {
        folder: folder,
        workingPath: String(folder.fsName || "").replace(/\\/g, "/") + "/working.ai",
        artifactPath: String(folder.fsName || "").replace(/\\/g, "/") + "/artifact.ai",
        stagedPdfPath: String(folder.fsName || "").replace(/\\/g, "/") + "/output.pdf"
    };
};

$.global.WeddingSuiteStandard._cleanupTempJob = function (jobContext, keepArtifact) {
    var workingFile;
    var stagedPdfFile;

    if (!jobContext || !jobContext.folder) {
        return "";
    }

    if (!keepArtifact) {
        return $.global.WeddingSuiteStandard._removeFolderTree(jobContext.folder)
            ? ""
            : "Khong xoa duoc workspace tam: " + jobContext.folder.fsName;
    }

    workingFile = new File(jobContext.workingPath || "");
    if (!$.global.WeddingSuiteStandard._removeFileIfExists(workingFile)) {
        return "Khong xoa duoc file working AI tam: " + workingFile.fsName;
    }

    stagedPdfFile = new File(jobContext.stagedPdfPath || "");
    if (!$.global.WeddingSuiteStandard._removeFileIfExists(stagedPdfFile)) {
        return "Khong xoa duoc file PDF tam: " + stagedPdfFile.fsName;
    }

    return "";
};

$.global.WeddingSuiteStandard._saveAiDocumentToPath = function (doc, outputPath) {
    var outputFile = new File(outputPath);
    var outputFolder = outputFile.parent;
    var options = null;

    if (!$.global.WeddingSuiteStandard._ensureFolderExists(outputFolder)) {
        throw new Error("Khong the tao thu muc luu: " + outputFolder.fsName);
    }

    if (!$.global.WeddingSuiteStandard._removeFileIfExists(outputFile)) {
        throw new Error("Khong the ghi de file AI tam: " + outputFile.fsName);
    }

    options = new IllustratorSaveOptions();
    options.pdfCompatible = true;
    doc.saveAs(outputFile, options);

    return String(outputFile.fsName || "").replace(/\\/g, "/");
};

$.global.WeddingSuiteStandard._unlockAllLayers = function (doc) {
    var i;

    if (!doc || !doc.layers) {
        return;
    }

    for (i = 0; i < doc.layers.length; i += 1) {
        try {
            doc.layers[i].locked = false;
        } catch (lockErr) { }
        try {
            doc.layers[i].visible = true;
        } catch (visibleErr) { }
    }
};

$.global.WeddingSuiteStandard._clearDocumentPageItems = function (doc) {
    var i;
    var item = null;

    if (!doc || !doc.pageItems) {
        return;
    }

    $.global.WeddingSuiteStandard._unlockAllLayers(doc);

    for (i = doc.pageItems.length - 1; i >= 0; i -= 1) {
        try {
            item = doc.pageItems[i];
        } catch (itemErr) {
            item = null;
        }

        if (!item) {
            continue;
        }

        try {
            item.locked = false;
        } catch (lockItemErr) { }
        try {
            item.hidden = false;
        } catch (hiddenItemErr) { }
        try {
            if (item.layer) {
                item.layer.locked = false;
                item.layer.visible = true;
            }
        } catch (itemLayerErr) { }

        try {
            item.remove();
        } catch (removeErr) { }
    }
};

$.global.WeddingSuiteStandard._prepareWorkingDocument = function (doc, filenameStem) {
    var i;
    var contentLayer = null;

    if (!doc) {
        throw new Error("Khong mo duoc file template de tao workspace tam.");
    }

    $.global.WeddingSuiteStandard._clearDocumentPageItems(doc);

    for (i = doc.layers.length - 1; i >= 1; i -= 1) {
        $.global.WeddingSuiteStandard._removeLayerIfPresent(doc.layers[i]);
    }

    if (!doc.layers.length) {
        contentLayer = doc.layers.add();
    } else {
        contentLayer = doc.layers[0];
    }

    try {
        contentLayer.locked = false;
    } catch (contentLockErr) { }
    try {
        contentLayer.visible = true;
    } catch (contentVisibleErr) { }
    try {
        contentLayer.name = "WSS_CONTENT";
    } catch (contentNameErr) { }

    for (i = doc.artboards.length - 1; i >= 1; i -= 1) {
        try {
            doc.artboards[i].remove();
        } catch (artboardErr) { }
    }

    if (doc.artboards.length) {
        try {
            doc.artboards[0].name = "QA";
        } catch (qaNameErr) { }
    }

    try {
        doc.name = filenameStem || doc.name;
    } catch (docNameErr) { }

    return contentLayer;
};

$.global.WeddingSuiteStandard._openTemplateWorkingDocument = function (templatePath, workingPath) {
    var templateFile = new File(templatePath || "");
    var workingFile = new File(workingPath || "");

    if (!templatePath || !templateFile.exists) {
        return null;
    }

    if (!$.global.WeddingSuiteStandard._ensureFolderExists(workingFile.parent)) {
        throw new Error("Khong the tao workspace tam: " + workingFile.parent.fsName);
    }

    if (!$.global.WeddingSuiteStandard._removeFileIfExists(workingFile)) {
        throw new Error("Khong the chuan bi working AI tu template: " + workingFile.fsName);
    }

    if (!templateFile.copy(workingFile.fsName)) {
        throw new Error("Khong the clone file template vao workspace tam: " + templateFile.fsName);
    }

    return $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
        return app.open(workingFile);
    });
};

$.global.WeddingSuiteStandard._createWorkingDocument = function (payload, workingPath) {
    var outputDoc = null;
    var contentLayer = null;
    var usedTemplatePath = "";

    outputDoc = $.global.WeddingSuiteStandard._openTemplateWorkingDocument(
        payload ? payload.templatePath : "",
        workingPath
    );

    if (outputDoc) {
        usedTemplatePath = String(payload && payload.templatePath ? payload.templatePath : "").replace(/\\/g, "/");
    }

    if (!outputDoc) {
        outputDoc = app.documents.add(
            DocumentColorSpace.CMYK,
            $.global.WeddingSuiteStandard._mmToPt(payload.plan.qaArtboard.widthMm),
            $.global.WeddingSuiteStandard._mmToPt(payload.plan.qaArtboard.heightMm)
        );
    }

    contentLayer = $.global.WeddingSuiteStandard._prepareWorkingDocument(
        outputDoc,
        payload && payload.output ? payload.output.filenameStem : ""
    );

    return {
        doc: outputDoc,
        contentLayer: contentLayer,
        templatePathUsed: usedTemplatePath
    };
};

$.global.WeddingSuiteStandard._createPdfExportError = function (message, cause) {
    var detail = cause && cause.message ? cause.message : cause;
    var error = new Error(
        String(message || "Khong the xuat PDF tam.") +
        (detail ? " Illustrator bao: " + String(detail) : "")
    );

    error.code = "WEDDING_SUITE_PDF_EXPORT_FAILED";
    error.stage = "pdf_export";
    return error;
};

$.global.WeddingSuiteStandard._stagePdfDocument = function (doc, outputPath, stagedPdfPath) {
    var outputFile = new File(outputPath);
    var outputFolder = outputFile.parent;
    var tempPath = String(stagedPdfPath || "");
    var tempFile = new File(tempPath);
    var options = null;
    var firstError = null;
    var fallbackError = null;
    var preserveEditability = true;

    if (!$.global.WeddingSuiteStandard._ensureFolderExists(outputFolder)) {
        throw $.global.WeddingSuiteStandard._createPdfExportError(
            "Khong the tao thu muc luu PDF: " + outputFolder.fsName
        );
    }

    if (!tempPath || !$.global.WeddingSuiteStandard._ensureFolderExists(tempFile.parent)) {
        throw $.global.WeddingSuiteStandard._createPdfExportError(
            "Khong the tao workspace PDF tam."
        );
    }

    if (!$.global.WeddingSuiteStandard._removeFileIfExists(tempFile)) {
        throw $.global.WeddingSuiteStandard._createPdfExportError(
            "Khong the chuan bi file PDF tam: " + tempFile.fsName
        );
    }

    options = new PDFSaveOptions();
    // Keep Illustrator editing data in the saved PDF so operators can reopen
    // the printer-facing PDF directly in Illustrator and refresh artwork later.
    // We intentionally leave pDFPreset unset so Illustrator applies its default
    // Adobe PDF preset/options on the current workstation.
    options.preserveEditability = true;
    try {
        $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
            doc.saveAs(tempFile, options);
        });
    } catch (saveErr) {
        firstError = saveErr;
    }

    // A failed save can still leave a partial PDF behind. Treat the thrown
    // error as authoritative and never commit that partial artifact.
    if (firstError || !tempFile.exists) {
        if (!$.global.WeddingSuiteStandard._removeFileIfExists(tempFile)) {
            throw $.global.WeddingSuiteStandard._createPdfExportError(
                "Khong the don file PDF tam sau lan xuat dau tien: " + tempFile.fsName,
                firstError
            );
        }

        options = new PDFSaveOptions();
        options.preserveEditability = false;
        preserveEditability = false;
        try {
            $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
                doc.saveAs(tempFile, options);
            });
        } catch (fallbackSaveErr) {
            fallbackError = fallbackSaveErr;
        }
    }

    if (!tempFile.exists) {
        throw $.global.WeddingSuiteStandard._createPdfExportError(
            "Khong the xuat PDF tam.",
            fallbackError || firstError
        );
    }

    return {
        tempFile: tempFile,
        outputFile: outputFile,
        outputPath: String(outputFile.fsName || "").replace(/\\/g, "/"),
        preserveEditability: preserveEditability,
        exportWarning: preserveEditability
            ? ""
            : "PDF nay duoc xuat o che do in thuong vi Illustrator khong giu duoc editability cua artwork."
    };
};

$.global.WeddingSuiteStandard._commitStagedPdf = function (stage) {
    var targetFile;
    var sourceFile;
    var backupFile = null;
    var backupName;
    var targetPath;
    var targetName;
    var targetFolderPath;
    var targetExisted = false;
    var copied = false;

    if (!stage || !stage.tempFile || !stage.outputFile) {
        throw new Error("Khong co PDF tam de commit.");
    }

    sourceFile = stage.tempFile;
    targetFile = new File(stage.outputFile.fsName);
    targetPath = targetFile.fsName;
    targetName = targetFile.name;
    targetFolderPath = targetFile.parent.fsName;
    if (!sourceFile.exists) {
        throw new Error("PDF tam khong ton tai de commit: " + sourceFile.fsName);
    }

    targetExisted = targetFile.exists;
    if (targetExisted) {
        backupName = "__wss_backup_" + String(new Date().getTime()) + "_" + Math.floor(Math.random() * 100000) + ".pdf";
        backupFile = new File(targetFolderPath + "/" + backupName);
        $.global.WeddingSuiteStandard._removeFileIfExists(backupFile);
        if (!targetFile.rename(backupName)) {
            throw new Error("Khong the tam giu PDF output cu truoc khi cap nhat: " + targetPath);
        }
        targetFile = new File(targetPath);
    }

    try {
        copied = sourceFile.copy(targetFile.fsName);
        if (!copied || !targetFile.exists || Number(targetFile.length) !== Number(sourceFile.length)) {
            throw new Error("Khong copy duoc PDF tam sang output: " + targetFile.fsName);
        }

        if (!sourceFile.remove()) {
            throw new Error("Da tao PDF output nhung khong xoa duoc PDF tam: " + sourceFile.fsName);
        }

        if (backupFile && backupFile.exists && !backupFile.remove()) {
            throw new Error("Da tao PDF output nhung khong xoa duoc backup tam: " + backupFile.fsName);
        }
    } catch (commitErr) {
        try {
            if (targetFile.exists) {
                targetFile.remove();
            }
        } catch (removePartialErr) { }

        if (backupFile && backupFile.exists) {
            try {
                backupFile.rename(targetName);
            } catch (restoreErr) { }
        }

        throw commitErr;
    }

    return stage.outputPath;
};

$.global.WeddingSuiteStandard._captureDebugArtifact = function (doc, jobContext) {
    var currentPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(
        $.global.WeddingSuiteStandard._getDocumentPathSafe(doc)
    );
    var workingPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(jobContext.workingPath);
    var workingFile = new File(jobContext.workingPath);
    var artifactFile = new File(jobContext.artifactPath);

    if (currentPath && currentPath === workingPath) {
        doc.save();
    } else {
        $.global.WeddingSuiteStandard._saveAiDocumentToPath(doc, jobContext.workingPath);
    }

    if (!$.global.WeddingSuiteStandard._removeFileIfExists(artifactFile)) {
        throw new Error("Khong the chuan bi AI debug artifact: " + artifactFile.fsName);
    }
    if (!workingFile.exists || !workingFile.copy(artifactFile.fsName)) {
        throw new Error("Khong the tao AI debug artifact: " + artifactFile.fsName);
    }

    return String(artifactFile.fsName || "").replace(/\\/g, "/");
};

$.global.WeddingSuiteStandard._openOutputDocument = function (outputPath) {
    var outputFile = new File(outputPath || "");
    var doc;
    var requestedPath;
    var openedPath;
    var activePath;

    if (!outputFile.exists) {
        throw new Error("Khong tim thay PDF output de mo: " + outputPath);
    }

    doc = $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
        return app.open(outputFile);
    });
    $.global.WeddingSuiteStandard._activateOutputDocument(doc);

    requestedPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(outputPath);
    openedPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(
        $.global.WeddingSuiteStandard._getDocumentPathSafe(doc)
    );
    if (!openedPath || openedPath !== requestedPath) {
        $.global.WeddingSuiteStandard._safeCloseDocument(doc);
        throw new Error("Illustrator da mo sai output thay vi PDF: " + (openedPath || "unknown"));
    }

    try {
        activePath = $.global.WeddingSuiteStandard._normalizeDocumentPath(
            $.global.WeddingSuiteStandard._getDocumentPathSafe(app.activeDocument)
        );
    } catch (activeErr) {
        activePath = "";
    }
    if (activePath !== requestedPath) {
        throw new Error("PDF da mo nhung khong tro thanh tai lieu active: " + outputPath);
    }

    return doc;
};

$.global.WeddingSuiteStandard._resolveOutputPathFromBridgePayload = function (base64PathPayload) {
    return $.global.WeddingSuiteStandard._decodeBridgeString(Base64.decode(base64PathPayload || ""));
};

$.global.WeddingSuiteStandard._buildOutputPath = function (payload) {
    var directory = payload && payload.output ? payload.output.directory : '';
    var filenameStem = payload && payload.output ? payload.output.filenameStem : '';

    return String(directory || '') + '/' + String(filenameStem || 'info') + '.pdf';
};

$.global.WeddingSuiteStandard._resolvePreviousOutputPath = function (payload) {
    if (!payload || !payload.output) {
        return "";
    }

    return String(payload.output.previousOutputPath || "");
};

$.global.WeddingSuiteStandard._removePreviousOutputFilesAfterBuild = function (previousOutputPath, outputPath) {
    var result = {
        attempted: false,
        deletedOutput: false,
        error: ""
    };
    var normalizedPrevious = $.global.WeddingSuiteStandard._normalizeDocumentPath(previousOutputPath);
    var normalizedOutput = $.global.WeddingSuiteStandard._normalizeDocumentPath(outputPath);

    if (!normalizedPrevious || normalizedPrevious === normalizedOutput) {
        return result;
    }

    result.attempted = true;

    if (!$.global.WeddingSuiteStandard._removeFileIfExists(new File(previousOutputPath))) {
        result.error = "Khong xoa duoc PDF cu: " + previousOutputPath;
        return result;
    }
    result.deletedOutput = true;

    return result;
};

$.global.WeddingSuiteStandard._activateOutputDocument = function (doc) {
    if (!doc) {
        return;
    }

    try {
        if (doc.artboards && typeof doc.artboards.setActiveArtboardIndex === 'function') {
            doc.artboards.setActiveArtboardIndex(0);
        }
    } catch (artboardErr) { }

    try {
        if (typeof doc.activate === 'function') {
            doc.activate();
        }
    } catch (activateErr) { }
};

$.global.WeddingSuiteStandard._findOpenDocumentByPath = function (targetPath) {
    var normalizedTargetPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(targetPath);
    var index;

    for (index = 0; index < app.documents.length; index += 1) {
        var doc = app.documents[index];
        var path = $.global.WeddingSuiteStandard._normalizeDocumentPath(
            $.global.WeddingSuiteStandard._getDocumentPathSafe(doc)
        );
        if (path && path === normalizedTargetPath) {
            return doc;
        }
    }

    return null;
};

$.global.WeddingSuiteStandard._withAlertsSuppressed = function (callback) {
    var previousInteractionLevel = null;

    try {
        previousInteractionLevel = app.userInteractionLevel;
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
    } catch (interactionErr) { }

    try {
        return callback();
    } finally {
        if (previousInteractionLevel !== null) {
            try {
                app.userInteractionLevel = previousInteractionLevel;
            } catch (restoreErr) { }
        }
    }
};
