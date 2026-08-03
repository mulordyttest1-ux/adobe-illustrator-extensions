if (typeof $.global.WeddingSuiteStandard === "undefined") {
    $.global.WeddingSuiteStandard = {};
}

// Public Wedding Suite Standard endpoints.
$.global.WeddingSuiteStandard.getActiveDocumentDirectory = function () {
    try {
        if (!app.documents.length) {
            return $.global.WeddingSuiteStandard._encodeResult({ success: true, directory: "" });
        }

        return $.global.WeddingSuiteStandard._encodeResult({
            success: true,
            directory: $.global.WeddingSuiteStandard._getDirectoryName($.global.WeddingSuiteStandard._getDocumentPath(app.activeDocument))
        });
    } catch (e) {
        return $.global.WeddingSuiteStandard._encodeResult({ success: false, error: e.message });
    }
};

$.global.WeddingSuiteStandard.getActiveDocumentSourceInfo = function () {
    var doc = null;
    var path = "";
    var name = "";
    var saved = false;
    var isPdf = false;

    try {
        if (!app.documents.length || !app.activeDocument) {
            return $.global.WeddingSuiteStandard._encodeResult({
                success: false,
                code: "NO_ACTIVE_DOCUMENT",
                error: "Khong co file dang mo trong Illustrator."
            });
        }

        doc = app.activeDocument;
        path = $.global.WeddingSuiteStandard._getDocumentPathSafe(doc);
        name = $.global.WeddingSuiteStandard._getBaseName(path || "");
        saved = doc.saved !== false;
        isPdf = /\.pdf$/i.test(String(path || ""));

        if (!saved || !path) {
            return $.global.WeddingSuiteStandard._encodeResult({
                success: false,
                code: "ACTIVE_DOCUMENT_UNSAVED",
                error: "File PDF dang mo chua luu. Hay luu file roi bam lai.",
                path: path,
                name: name,
                isPdf: isPdf,
                saved: saved
            });
        }

        if (!isPdf) {
            return $.global.WeddingSuiteStandard._encodeResult({
                success: false,
                code: "ACTIVE_DOCUMENT_NOT_PDF",
                error: "File dang mo khong phai PDF nguon cho Bo Thiep.",
                path: path,
                name: name,
                isPdf: false,
                saved: true
            });
        }

        return $.global.WeddingSuiteStandard._encodeResult({
            success: true,
            path: path,
            name: name,
            isPdf: true,
            saved: true
        });
    } catch (e) {
        return $.global.WeddingSuiteStandard._encodeResult({
            success: false,
            error: e.message
        });
    }
};

$.global.WeddingSuiteStandard.inspectSource = function (base64Path) {
    var session = null;

    try {
        session = $.global.WeddingSuiteStandard._openSourceSession(
            $.global.WeddingSuiteStandard._decodeBridgeString(Base64.decode(base64Path || ""))
        );
        return $.global.WeddingSuiteStandard._encodeResult(
            $.global.WeddingSuiteStandard._inspectSourceSession(session)
        );
    } catch (e) {
        return $.global.WeddingSuiteStandard._encodeResult({ success: false, error: e.message });
    } finally {
        $.global.WeddingSuiteStandard._closeSourceSession(session);
    }
};

$.global.WeddingSuiteStandard.inspectOpenOutput = function (base64PathPayload) {
    var outputPath = "";
    var doc = null;
    var result = {
        success: true,
        isOpen: false,
        activeMatchesTarget: false,
        activeArtboardIndex: -1,
        envelopeReference: $.global.WeddingSuiteStandard._getEnvelopeReference()
    };

    try {
        outputPath = $.global.WeddingSuiteStandard._resolveOutputPathFromBridgePayload(base64PathPayload);
        doc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(outputPath);
        result.isOpen = !!doc;
        result.outputPath = outputPath;

        try {
            if (app.documents.length && app.activeDocument) {
                result.activeMatchesTarget = $.global.WeddingSuiteStandard._normalizeDocumentPath(
                    $.global.WeddingSuiteStandard._getDocumentPathSafe(app.activeDocument)
                ) === $.global.WeddingSuiteStandard._normalizeDocumentPath(outputPath);
            }
        } catch (activeErr) { }

        try {
            if (app.documents.length && app.activeDocument && app.activeDocument.artboards && typeof app.activeDocument.artboards.getActiveArtboardIndex === 'function') {
                result.activeArtboardIndex = app.activeDocument.artboards.getActiveArtboardIndex();
            }
        } catch (artboardErr) { }
    } catch (inspectErr) {
        result = {
            success: false,
            error: inspectErr.message
        };
    }

    return $.global.WeddingSuiteStandard._encodeResult(result);
};

$.global.WeddingSuiteStandard.markOpenOutputDirty = function (base64PathPayload) {
    var outputPath = "";
    var doc = null;
    var tf = null;
    var result = {
        success: false,
        marked: false,
        saved: null
    };

    try {
        outputPath = $.global.WeddingSuiteStandard._resolveOutputPathFromBridgePayload(base64PathPayload);
        doc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(outputPath);

        if (!doc) {
            result.error = 'open_output_not_found';
            return $.global.WeddingSuiteStandard._encodeResult(result);
        }

        tf = doc.textFrames.add();
        tf.contents = 'dirty';
        tf.position = [0, 0];
        result.saved = doc.saved;
        result.marked = true;
        result.success = true;
    } catch (markErr) {
        result = {
            success: false,
            error: markErr.message
        };
    }

    return $.global.WeddingSuiteStandard._encodeResult(result);
};

$.global.WeddingSuiteStandard.ensureOutputOpen = function (base64PathPayload) {
    var outputPath = "";
    var outputFile = null;
    var doc = null;
    var result = {
        success: false,
        isOpen: false
    };

    try {
        outputPath = $.global.WeddingSuiteStandard._resolveOutputPathFromBridgePayload(base64PathPayload);
        doc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(outputPath);

        if (!doc) {
            outputFile = new File(outputPath);
            if (!outputFile.exists) {
                result.error = 'missing_output_file';
                return $.global.WeddingSuiteStandard._encodeResult(result);
            }

            doc = $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
                return app.open(outputFile);
            });
        }

        $.global.WeddingSuiteStandard._activateOutputDocument(doc);
        result.isOpen = true;
        result.success = true;
        result.outputPath = outputPath;
    } catch (ensureErr) {
        result = {
            success: false,
            error: ensureErr.message
        };
    }

    return $.global.WeddingSuiteStandard._encodeResult(result);
};

$.global.WeddingSuiteStandard.printQaCheck = function (base64PathPayload) {
    var outputPath = "";
    var outputFile = null;
    var doc = null;
    var options = null;
    var jobOptions = null;
    var coordinateOptions = null;
    var printerList = null;
    var result = {
        success: false,
        printed: false,
        artboardRange: "1-2",
        fitToPage: true,
        mode: "direct_print_default_printer"
    };

    try {
        outputPath = $.global.WeddingSuiteStandard._resolveOutputPathFromBridgePayload(base64PathPayload);
        doc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(outputPath);

        if (!doc) {
            outputFile = new File(outputPath);
            if (!outputFile.exists) {
                result.error = "missing_output_file";
                return $.global.WeddingSuiteStandard._encodeResult(result);
            }
            doc = $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
                return app.open(outputFile);
            });
        }

        $.global.WeddingSuiteStandard._activateOutputDocument(doc);

        try {
            printerList = app.printerList;
        } catch (printerErr) {
            printerList = null;
        }

        if (!printerList || !printerList.length) {
            result.error = "Khong tim thay may in mac dinh trong Illustrator.";
            return $.global.WeddingSuiteStandard._encodeResult(result);
        }

        options = new PrintOptions();
        jobOptions = new PrintJobOptions();
        coordinateOptions = new PrintCoordinateOptions();

        jobOptions.printAllArtboards = false;
        jobOptions.artboardRange = "1-2";
        jobOptions.printArea = PrintingBounds.ARTBOARDBOUNDS;
        coordinateOptions.fitToPage = true;
        coordinateOptions.position = PrintPosition.TRANSLATECENTER;

        options.jobOptions = jobOptions;
        options.coordinateOptions = coordinateOptions;

        doc.print(options);

        result.success = true;
        result.printed = true;
        result.printerCount = printerList.length;
        result.outputPath = outputPath;
    } catch (printErr) {
        result = {
            success: false,
            error: printErr.message
        };
    }

    return $.global.WeddingSuiteStandard._encodeResult(result);
};

$.global.WeddingSuiteStandard.buildJob = function (base64Payload) {
    var payload = null;
    var sourceSession = null;
    var outputDoc = null;
    var outputDocContext = null;
    var openedOutputDoc = null;
    var contentLayer = null;
    var pageTemplates = null;
    var specs = null;
    var i;
    var outputPath = "";
    var previousOutputPath = "";
    var existingOutputDoc = null;
    var previousOutputDoc = null;
    var normalizedOutputPath = "";
    var normalizedPreviousOutputPath = "";
    var templatePathUsed = "";
    var previousOutputDelete = null;
    var jobContext = null;
    var pdfStage = null;
    var pdfCommitted = false;
    var debugCapture = false;
    var debugArtifactPath = "";
    var recoveryArtifactPath = "";
    var recoveryWorkingPath = "";
    var recoveryDoc = null;
    var recoveryOpened = false;
    var recoveryOpenWarning = "";
    var preserveWorkingDocument = false;
    var openOutputWarning = "";
    var pdfExportWarning = "";
    var tempCleanupWarning = "";
    var response = null;
    var dirtyError = null;

    try {
        payload = $.global.WeddingSuiteStandard._decodePayload(base64Payload);
        if (!payload || !payload.plan || !payload.plan.valid) {
            throw new Error("Plan wedding suite khong hop le.");
        }

        $.global.WeddingSuiteStandard._refreshPlanPaperStockFromConfig(payload);

        sourceSession = $.global.WeddingSuiteStandard._openSourceSession(payload.sourcePath);

        if (!payload.output || !payload.output.directory) {
            throw new Error("Chua co thu muc luu PDF.");
        }

        $.global.WeddingSuiteStandard._cleanupStaleTempJobs();
        $.global.WeddingSuiteStandard._cleanupLegacyReviewCache();

        outputPath = $.global.WeddingSuiteStandard._buildOutputPath(payload);
        previousOutputPath = $.global.WeddingSuiteStandard._resolvePreviousOutputPath(payload);
        normalizedOutputPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(outputPath);
        normalizedPreviousOutputPath = $.global.WeddingSuiteStandard._normalizeDocumentPath(previousOutputPath);
        debugCapture = !!(payload.debug && payload.debug.captureAiArtifact === true);

        existingOutputDoc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(outputPath);
        if (existingOutputDoc && existingOutputDoc.saved === false) {
            dirtyError = new Error('File bai in hien dang mo va chua luu. Hay luu hoac dong file do roi chay Binh Bo Thiep lai.');
            dirtyError.code = 'OUTPUT_FILE_UNSAVED_OPEN';
            throw dirtyError;
        }
        if (existingOutputDoc) {
            $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
                $.global.WeddingSuiteStandard._closeDocumentRequired(existingOutputDoc, "PDF output cu");
            });
            existingOutputDoc = null;
        }

        if (
            normalizedPreviousOutputPath &&
            normalizedPreviousOutputPath !== normalizedOutputPath
        ) {
            previousOutputDoc = $.global.WeddingSuiteStandard._findOpenDocumentByPath(previousOutputPath);
            if (previousOutputDoc && previousOutputDoc.saved === false) {
                dirtyError = new Error('File bai in hien dang mo va chua luu. Hay luu hoac dong file do roi chay Binh Bo Thiep lai.');
                dirtyError.code = 'OUTPUT_FILE_UNSAVED_OPEN';
                throw dirtyError;
            }
            if (previousOutputDoc) {
                $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
                    $.global.WeddingSuiteStandard._closeDocumentRequired(previousOutputDoc, "PDF output truoc do");
                });
                previousOutputDoc = null;
            }
        }

        jobContext = $.global.WeddingSuiteStandard._createTempJobContext(payload);
        outputDocContext = $.global.WeddingSuiteStandard._createWorkingDocument(payload, jobContext.workingPath);
        outputDoc = outputDocContext.doc;
        contentLayer = outputDocContext.contentLayer;
        templatePathUsed = outputDocContext.templatePathUsed || "";

        specs = $.global.WeddingSuiteStandard._createArtboards(outputDoc, payload.plan);
        if (sourceSession.kind === "pdf") {
            pageTemplates = $.global.WeddingSuiteStandard._buildPdfPageTemplates(
                outputDoc,
                sourceSession.sourceFile,
                payload.plan
            );
        }

        for (i = 0; i < specs.length; i++) {
            if (specs[i].kind === "qa") {
                $.global.WeddingSuiteStandard._renderQaArtboard(contentLayer, specs[i], payload, sourceSession, pageTemplates);
            } else if (specs[i].kind === "envelope") {
                $.global.WeddingSuiteStandard._renderEnvelopeArtboard(contentLayer, specs[i], payload, sourceSession, pageTemplates);
            } else if (specs[i].kind === "production") {
                $.global.WeddingSuiteStandard._renderProductionArtboard(contentLayer, specs[i], payload, sourceSession, pageTemplates);
            } else if (specs[i].kind === "draft") {
                $.global.WeddingSuiteStandard._renderDraftArtboard(contentLayer, specs[i], payload, sourceSession, pageTemplates);
            }
        }

        $.global.WeddingSuiteStandard._removeLayerIfPresent(pageTemplates ? pageTemplates.layer : null);

        if (debugCapture) {
            debugArtifactPath = $.global.WeddingSuiteStandard._captureDebugArtifact(outputDoc, jobContext);
        }

        pdfStage = $.global.WeddingSuiteStandard._stagePdfDocument(
            outputDoc,
            outputPath,
            jobContext.stagedPdfPath
        );
        pdfExportWarning = pdfStage.exportWarning || "";
        $.global.WeddingSuiteStandard._withAlertsSuppressed(function () {
            $.global.WeddingSuiteStandard._closeDocumentRequired(outputDoc, "tai lieu AI tam cua Wedding Suite");
        });
        outputDoc = null;

        outputPath = $.global.WeddingSuiteStandard._commitStagedPdf(pdfStage);
        pdfCommitted = true;
        previousOutputDelete = $.global.WeddingSuiteStandard._removePreviousOutputFilesAfterBuild(
            previousOutputPath,
            outputPath
        );

        try {
            openedOutputDoc = $.global.WeddingSuiteStandard._openOutputDocument(outputPath);
        } catch (openErr) {
            openedOutputDoc = null;
            openOutputWarning = openErr.message;
        }

        response = {
            success: true,
            outputPath: outputPath,
            previousOutputPath: previousOutputPath,
            previousOutputDelete: previousOutputDelete,
            previousOutputDeleteError: previousOutputDelete && previousOutputDelete.error ? previousOutputDelete.error : "",
            templatePathUsed: templatePathUsed,
            artboards: payload.plan.artboards,
            openedOutput: !!openedOutputDoc,
            openOutputWarning: openOutputWarning,
            pdfEditabilityPreserved: pdfStage.preserveEditability !== false,
            pdfExportWarning: pdfExportWarning
        };
        if (debugArtifactPath) {
            response.debugArtifact = {
                path: debugArtifactPath
            };
        }
    } catch (e) {
        if (debugCapture && outputDoc && jobContext && !debugArtifactPath) {
            try {
                debugArtifactPath = $.global.WeddingSuiteStandard._captureDebugArtifact(outputDoc, jobContext);
            } catch (captureErr) { }
        }

        if (
            e &&
            e.code === "WEDDING_SUITE_PDF_EXPORT_FAILED" &&
            outputDoc &&
            jobContext
        ) {
            try {
                recoveryArtifactPath = debugArtifactPath ||
                    $.global.WeddingSuiteStandard._captureDebugArtifact(outputDoc, jobContext);
                $.global.WeddingSuiteStandard._closeDocumentRequired(
                    outputDoc,
                    "tai lieu AI tam cua Wedding Suite"
                );
                outputDoc = null;

                try {
                    recoveryDoc = app.open(new File(recoveryArtifactPath));
                    $.global.WeddingSuiteStandard._activateOutputDocument(recoveryDoc);
                    recoveryOpened = true;
                } catch (openRecoveryErr) {
                    recoveryOpenWarning = openRecoveryErr.message;
                }
            } catch (recoveryErr) {
                preserveWorkingDocument = true;
                recoveryWorkingPath = jobContext.workingPath;
                recoveryOpenWarning = "Khong luu duoc AI phuc hoi; da giu tai lieu rendered dang mo. " +
                    recoveryErr.message;
                $.global.WeddingSuiteStandard._activateOutputDocument(outputDoc);
            }
        }

        response = {
            success: false,
            error: e.message,
            code: e.code || ""
        };
        if (debugArtifactPath) {
            response.debugArtifact = {
                path: debugArtifactPath
            };
        }
        if (recoveryArtifactPath || recoveryWorkingPath) {
            response.recoveryArtifact = {
                path: recoveryArtifactPath || recoveryWorkingPath,
                opened: recoveryOpened || preserveWorkingDocument,
                openWarning: recoveryOpenWarning
            };
        }
    } finally {
        if (outputDoc && !preserveWorkingDocument) {
            $.global.WeddingSuiteStandard._safeCloseDocument(outputDoc);
            outputDoc = null;
        }
        if (pdfStage && !pdfCommitted && pdfStage.tempFile) {
            $.global.WeddingSuiteStandard._removeFileIfExists(pdfStage.tempFile);
        }
        $.global.WeddingSuiteStandard._closeSourceSession(sourceSession);

        if (preserveWorkingDocument && jobContext && jobContext.folder) {
            tempCleanupWarning = "Da giu workspace phuc hoi: " + jobContext.folder.fsName;
        } else {
            tempCleanupWarning = $.global.WeddingSuiteStandard._cleanupTempJob(
                jobContext,
                !!debugArtifactPath || !!recoveryArtifactPath
            );
        }
        if (response && tempCleanupWarning) {
            response.tempCleanupWarning = tempCleanupWarning;
        }
    }

    return $.global.WeddingSuiteStandard._encodeResult(response || {
        success: false,
        error: "Wedding Suite build khong tra ve ket qua."
    });
};
