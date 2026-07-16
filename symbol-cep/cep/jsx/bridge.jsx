/**
 * MODULE: Bridge
 * LAYER: Host/Port (L1)
 * PURPOSE: Global endpoints for CEP to call ExtendScript (JSX) functions
 */

if (typeof $.global.Bridge === 'undefined') {
    $.global.Bridge = {};
}

$.global.Bridge.ping = function () {
    return Base64.encode(JSON.stringify({ success: true, msg: "Pong" }));
};

$.global.Bridge._intersects = function (r1, r2) {
    var l1 = Math.min(r1[0], r1[2]);
    var right1 = Math.max(r1[0], r1[2]);
    var t1 = Math.max(r1[1], r1[3]);
    var b1 = Math.min(r1[1], r1[3]);

    var l2 = Math.min(r2[0], r2[2]);
    var right2 = Math.max(r2[0], r2[2]);
    var t2 = Math.max(r2[1], r2[3]);
    var b2 = Math.min(r2[1], r2[3]);

    return !(right2 < l1 || l2 > right1 || b2 > t1 || t2 < b1);
};

$.global.Bridge._removePasteboardLegendGroups = function (doc, groupName) {
    var removed = 0;
    var groups;
    var i;
    var group;

    try {
        groups = doc.groupItems;
    } catch (err) {
        return removed;
    }

    for (i = groups.length - 1; i >= 0; i--) {
        try {
            group = groups[i];
            if (group && group.name === groupName) {
                group.locked = false;
                group.hidden = false;
                group.remove();
                removed++;
            }
        } catch (removeErr) {
            // Keep slug cleanup best-effort so a stale locked group cannot block production output.
        }
    }

    return removed;
};

$.global.Bridge.checkArtboardGarbage = function () {
    try {
        if (!app.documents.length) return Base64.encode(JSON.stringify({ hasGarbage: false, count: 0 }));
        var doc = app.activeDocument;
        var garbageCount = 0;
        var activeArtboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var abRect = activeArtboard.artboardRect;

        for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            if (layer.locked || !layer.visible) continue;

            for (var j = 0; j < layer.pageItems.length; j++) {
                var item = layer.pageItems[j];
                if (!item.selected) {
                    try {
                        if ($.global.Bridge._intersects(abRect, item.visibleBounds)) {
                            garbageCount++;
                        }
                    } catch (err) {
                        // Ignore items without valid bounds
                    }
                }
            }
        }

        return Base64.encode(JSON.stringify({
            success: true,
            hasGarbage: garbageCount > 0,
            count: garbageCount
        }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge.clearArtboardGarbage = function () {
    try {
        if (!app.documents.length) return Base64.encode(JSON.stringify({ success: true }));
        var doc = app.activeDocument;
        var deletedCount = 0;
        var activeArtboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var abRect = activeArtboard.artboardRect;

        for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            if (layer.locked || !layer.visible) continue;

            var items = layer.pageItems;
            // Loop backwards to safely remove items from collection
            for (var j = items.length - 1; j >= 0; j--) {
                var item = items[j];
                if (!item.selected) {
                    var isInArtboard = false;
                    try {
                        isInArtboard = $.global.Bridge._intersects(abRect, item.visibleBounds);
                    } catch (err) { }

                    if (isInArtboard) {
                        // Guardrails: Unlock and unhide before deleting
                        if (item.locked) item.locked = false;
                        if (item.hidden) item.hidden = false;
                        item.remove();
                        deletedCount++;
                    }
                }
            }
        }

        return Base64.encode(JSON.stringify({ success: true, deleted: deletedCount }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge.drawPasteboardLegend = function (base64Str) {
    try {
        if (!app.documents.length) return Base64.encode(JSON.stringify({ success: false, error: "No document" }));
        var doc = app.activeDocument;
        var decoded = Base64.decode(base64Str);
        var payload;
        var infoText;
        var mode;

        var groupName = "Symbol_Meta_Info";
        var removedCount;

        try {
            payload = JSON.parse(decoded);
        } catch (parseErr) {
            payload = {
                mode: "custom",
                text: decoded
            };
        }

        mode = payload && payload.mode ? String(payload.mode) : "custom";
        infoText = payload && payload.text ? String(payload.text) : "";

        removedCount = $.global.Bridge._removePasteboardLegendGroups(doc, groupName);

        if (mode === "off" || !infoText) {
            return Base64.encode(JSON.stringify({ success: true, cleared: true, removed: removedCount }));
        }

        var group = doc.activeLayer.groupItems.add();
        group.name = groupName;
        group.locked = false;
        group.hidden = false;

        var activeArtboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var rect = activeArtboard.artboardRect; // [left, top, right, bottom]

        var x = rect[0];
        var y = rect[1] + 25; // Offset up into pasteboard (AI Y is positive up)

        var textFrame = group.textFrames.add();
        textFrame.contents = infoText;
        textFrame.position = [x, y];

        // Format
        textFrame.textRange.characterAttributes.size = 8;
        try {
            textFrame.textRange.characterAttributes.fillColor = doc.swatches.getByName("[Registration]").color;
        } catch (err) {
            // Fallback to black if registration swatch not found
        }

        group.locked = true;

        return Base64.encode(JSON.stringify({ success: true }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge._makeAutoGroupName = function () {
    return "SYM_AUTO_GROUP_" + (new Date().getTime()) + "_" + Math.floor(Math.random() * 100000);
};

$.global.Bridge._findGroupByName = function (doc, groupName) {
    var groups = doc.groupItems;
    var i;

    for (i = 0; i < groups.length; i++) {
        if (groups[i].name === groupName) {
            return groups[i];
        }
    }

    return null;
};

$.global.Bridge._autoGroupSelection = function (doc) {
    var autoGroupedItem;
    var autoGroupName;

    try {
        if (!doc) {
            return { success: false, error: "No document" };
        }

        app.executeMenuCommand("group");
        autoGroupedItem = doc.selection && doc.selection.length ? doc.selection[0] : null;

        if (!autoGroupedItem || autoGroupedItem.typename !== "GroupItem") {
            return { success: false, error: "Auto-group did not create a GroupItem" };
        }

        autoGroupName = $.global.Bridge._makeAutoGroupName();
        autoGroupedItem.name = autoGroupName;

        return {
            success: true,
            autoGroupName: autoGroupName
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/**
 * Show group check dialog with 3 buttons.
 * Text is passed as Base64 to avoid encoding issues in JSX.
 *
 * @param {string} base64Title - Base64-encoded dialog title
 * @param {string} base64Msg   - Base64-encoded message body
 * @param {string} base64Btn1  - Base64-encoded button 1 label (auto-group)
 * @param {string} base64Btn2  - Base64-encoded button 2 label (proceed)
 * @param {string} base64Btn3  - Base64-encoded button 3 label (cancel)
 *
 * Returns Base64-encoded JSON:
 *   { result: "single_group" | "auto_grouped" | "proceed_multi" | "cancel" | "empty" }
 */
$.global.Bridge.showGroupCheckDialog = function (base64Title, base64Msg, base64Btn1, base64Btn2, base64Btn3) {
    try {
        if (!app.documents.length) {
            return Base64.encode(JSON.stringify({ success: false, error: "No document open" }));
        }
        var doc = app.activeDocument;
        var sel = doc.selection;

        if (!sel || sel.length === 0) {
            return Base64.encode(JSON.stringify({ success: true, result: "empty" }));
        }

        if (sel.length === 1 && sel[0].typename === "GroupItem") {
            return Base64.encode(JSON.stringify({ success: true, result: "single_group" }));
        }

        // Decode text from Base64 (safe cross-encoding)
        var title = Base64.decode(base64Title);
        var msg   = Base64.decode(base64Msg);
        var lbl1  = Base64.decode(base64Btn1);
        var lbl2  = Base64.decode(base64Btn2);
        var lbl3  = Base64.decode(base64Btn3);

        var count = sel.length;

        var dlg = new Window("dialog", title, undefined);
        dlg.orientation = "column";
        dlg.alignChildren = "fill";
        dlg.spacing = 10;
        dlg.margins = 20;

        var msgText = dlg.add("statictext", undefined, msg.replace("{count}", count), { multiline: true });
        msgText.preferredSize.width = 340;

        var btnRow = dlg.add("group");
        btnRow.orientation = "row";
        btnRow.alignment = "center";
        btnRow.spacing = 8;

        var btnAutoGroup = btnRow.add("button", undefined, lbl1);
        var btnProceed   = btnRow.add("button", undefined, lbl2);
        var btnCancel    = btnRow.add("button", undefined, lbl3);

        var chosenResult = "cancel";

        btnAutoGroup.onClick = function () { chosenResult = "auto_group";    dlg.close(); };
        btnProceed.onClick   = function () { chosenResult = "proceed_multi"; dlg.close(); };
        btnCancel.onClick    = function () { chosenResult = "cancel";        dlg.close(); };

        dlg.show();

        if (chosenResult === "auto_group") {
            var autoGroupResult = $.global.Bridge._autoGroupSelection(doc);
            if (!autoGroupResult.success) {
                return Base64.encode(JSON.stringify({ success: false, error: autoGroupResult.error }));
            }

            return Base64.encode(JSON.stringify({
                success: true,
                result: "auto_grouped",
                autoGroupName: autoGroupResult.autoGroupName
            }));
        }

        return Base64.encode(JSON.stringify({ success: true, result: chosenResult }));

    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge.ungroupAutoGrouped = function (base64GroupName) {
    var doc;
    var groupName;
    var targetGroup;
    var childItems = [];
    var originalSelection = [];
    var selectionAfter;
    var i;

    try {
        if (!app.documents.length) {
            return Base64.encode(JSON.stringify({ success: false, error: "No document" }));
        }

        doc = app.activeDocument;
        groupName = Base64.decode(base64GroupName);

        if (!groupName) {
            return Base64.encode(JSON.stringify({ success: false, error: "Missing auto-group name" }));
        }

        if (doc.selection && doc.selection.length) {
            for (i = 0; i < doc.selection.length; i++) {
                originalSelection.push(doc.selection[i]);
            }
        }

        targetGroup = $.global.Bridge._findGroupByName(doc, groupName);
        if (!targetGroup) {
            return Base64.encode(JSON.stringify({ success: false, error: "Auto-group target not found: " + groupName }));
        }

        for (i = 0; i < targetGroup.pageItems.length; i++) {
            childItems.push(targetGroup.pageItems[i]);
        }

        doc.selection = null;
        targetGroup.locked = false;
        targetGroup.hidden = false;
        targetGroup.selected = true;
        doc.selection = [targetGroup];

        app.executeMenuCommand("ungroup");

        doc.selection = null;
        for (i = 0; i < childItems.length; i++) {
            try {
                childItems[i].selected = true;
            } catch (selectErr) { }
        }
        if (childItems.length) {
            doc.selection = childItems;
        }

        selectionAfter = doc.selection || [];
        return Base64.encode(JSON.stringify({
            success: true,
            groupName: groupName,
            selectionCount: selectionAfter.length
        }));
    } catch (e) {
        try {
            if (app.documents.length) {
                app.activeDocument.selection = null;
                if (originalSelection.length) {
                    for (i = 0; i < originalSelection.length; i++) {
                        try {
                            originalSelection[i].selected = true;
                        } catch (selectBackErr) { }
                    }
                    app.activeDocument.selection = originalSelection;
                }
            }
        } catch (clearErr) { }

        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

/**
 * Ungroup the current selection (undo auto-group after engine run).
 * Calls Illustrator's built-in Ungroup menu command.
 */
$.global.Bridge.ungroupSelection = function () {
    try {
        if (!app.documents.length) {
            return Base64.encode(JSON.stringify({ success: false, error: "No document" }));
        }
        app.executeMenuCommand("ungroup");
        return Base64.encode(JSON.stringify({ success: true }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge._getDocumentPathSafe = function (doc) {
    try {
        if (!doc || !doc.fullName) {
            return "";
        }

        return String(doc.fullName.fsName || "").replace(/\\/g, "/");
    } catch (e) {
        return "";
    }
};

$.global.Bridge._normalizeFilePath = function (path) {
    try {
        if (!path) {
            return "";
        }

        return String(new File(path).fsName || "").replace(/\\/g, "/").toLowerCase();
    } catch (e) {
        return String(path || "").replace(/\\/g, "/").toLowerCase();
    }
};

$.global.Bridge._findOpenDocumentByPath = function (targetPath) {
    var normalizedTarget = $.global.Bridge._normalizeFilePath(targetPath);
    var i;
    var docPath;

    if (!normalizedTarget) {
        return null;
    }

    for (i = 0; i < app.documents.length; i++) {
        docPath = $.global.Bridge._getDocumentPathSafe(app.documents[i]);
        if (docPath && $.global.Bridge._normalizeFilePath(docPath) === normalizedTarget) {
            return app.documents[i];
        }
    }

    return null;
};

$.global.Bridge._stripExtension = function (name) {
    var safeName = String(name || "");
    var dotIndex = safeName.lastIndexOf(".");

    if (dotIndex > 0) {
        return safeName.substring(0, dotIndex);
    }

    return safeName;
};

$.global.Bridge._sanitizeFileStem = function (value) {
    var safeValue = String(value || "");

    safeValue = $.global.Bridge._stripExtension(safeValue);
    safeValue = safeValue.replace(/[\\\/:\*\?"<>\|]/g, "_");
    safeValue = safeValue.replace(/^\s+|\s+$/g, "");
    safeValue = safeValue.replace(/[\. ]+$/g, "");

    return safeValue;
};

$.global.Bridge._joinPath = function (dirPath, fileName) {
    var safeDir = String(dirPath || "");
    if (!safeDir) {
        return String(fileName || "");
    }

    if (/[\\\/]$/.test(safeDir)) {
        return safeDir + fileName;
    }

    return safeDir + "/" + fileName;
};

$.global.Bridge._getFileExtensionLower = function (pathOrName) {
    var safeName = String(pathOrName || "");
    var queryIndex = safeName.indexOf("?");
    var hashIndex = safeName.indexOf("#");
    var dotIndex;

    if (queryIndex >= 0) {
        safeName = safeName.substring(0, queryIndex);
    }
    if (hashIndex >= 0) {
        safeName = safeName.substring(0, hashIndex);
    }

    dotIndex = safeName.lastIndexOf(".");
    if (dotIndex < 0) {
        return "";
    }

    return safeName.substring(dotIndex + 1).toLowerCase();
};

$.global.Bridge._resolveSaveFormat = function (explicitFormat, pathOrName, fallbackFormat) {
    var format = String(explicitFormat || "").toLowerCase();
    var extension;

    if (format === "pdf" || format === "ai") {
        return format;
    }

    extension = $.global.Bridge._getFileExtensionLower(pathOrName);
    if (extension === "pdf" || extension === "ai") {
        return extension;
    }

    fallbackFormat = String(fallbackFormat || "").toLowerCase();
    if (fallbackFormat === "pdf" || fallbackFormat === "ai") {
        return fallbackFormat;
    }

    return "ai";
};

$.global.Bridge._saveDocumentToFileWithFormat = function (doc, outputFile, outputFormat) {
    var options;
    var format = $.global.Bridge._resolveSaveFormat(outputFormat, outputFile ? outputFile.name : "", "ai");

    if (format === "pdf") {
        options = new PDFSaveOptions();
        // Keep Illustrator editing data in PDF output so operators can reopen and adjust the saved production file.
        options.preserveEditability = true;
        doc.saveAs(outputFile, options);
        return "pdf";
    }

    options = new IllustratorSaveOptions();
    doc.saveAs(outputFile, options);
    return "ai";
};

$.global.Bridge._removePreviousOutputFileAfterSave = function (previousPath, outputPath) {
    var previousFile;
    var normalizedPrevious = $.global.Bridge._normalizeFilePath(previousPath);
    var normalizedOutput = $.global.Bridge._normalizeFilePath(outputPath);
    var openPreviousDoc;
    var extension = $.global.Bridge._getFileExtensionLower(previousPath);

    if (!normalizedPrevious) {
        return { attempted: false, deleted: false, reason: "missing_previous_path" };
    }

    if (normalizedPrevious === normalizedOutput) {
        return { attempted: false, deleted: false, reason: "same_as_output" };
    }

    if (extension !== "ai" && extension !== "pdf") {
        return {
            attempted: false,
            deleted: false,
            reason: "previous_not_supported_format",
            error: "Old file is not AI/PDF, skipped cleanup: " + previousPath
        };
    }

    previousFile = new File(previousPath);
    if (!previousFile.exists) {
        return { attempted: false, deleted: false, reason: "previous_missing" };
    }

    openPreviousDoc = $.global.Bridge._findOpenDocumentByPath(previousPath);
    if (openPreviousDoc) {
        return {
            attempted: false,
            deleted: false,
            reason: "previous_file_open",
            error: "Old file is still open in Illustrator: " + previousPath
        };
    }

    try {
        if (previousFile.remove()) {
            return {
                attempted: true,
                deleted: true,
                previousPath: String(previousFile.fsName || previousFile.fullName || previousPath).replace(/\\/g, "/")
            };
        }
    } catch (removeErr) {
        return { attempted: true, deleted: false, error: removeErr.message || String(removeErr) };
    }

    return { attempted: true, deleted: false, error: "Could not delete previous file" };
};

$.global.Bridge._removePreviousAiFileAfterSave = $.global.Bridge._removePreviousOutputFileAfterSave;

$.global.Bridge.getActiveDocumentIdentity = function () {
    var doc;
    var documentPath;

    try {
        if (!app.documents.length) {
            return Base64.encode(JSON.stringify({ success: false, error: "No document" }));
        }

        doc = app.activeDocument;
        documentPath = $.global.Bridge._getDocumentPathSafe(doc);

        return Base64.encode(JSON.stringify({
            success: true,
            documentPath: documentPath,
            documentName: String(doc.name || ""),
            isSaved: doc.saved !== false
        }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge.saveActiveDocumentAfterImposition = function (base64Payload) {
    var payload;
    var doc;
    var outputDirectory;
    var timestampSuffix;
    var docPath;
    var normalizedDocPath;
    var folder;
    var docFile;
    var baseName;
    var customPrefix;
    var resolvedStem;
    var outputName;
    var outputPath;
    var outputFile;
    var openTargetDoc;
    var outputFormat;
    var savedFormat;
    var deleteExistingFirst;
    var targetPath;
    var normalizedTargetPath;
    var previousDocumentPath;
    var deletePreviousAfterSave;
    var previousDeleteResult;

    try {
        if (!app.documents.length) {
            return Base64.encode(JSON.stringify({ success: false, error: "No document" }));
        }

        payload = JSON.parse(Base64.decode(base64Payload || ""));
        outputDirectory = String(payload.outputDirectory || "");
        customPrefix = String(payload.filenamePrefix || "");
        timestampSuffix = String(payload.timestampSuffix || "");
        outputFormat = String(payload.outputFormat || "");
        deleteExistingFirst = payload.deleteExistingFirst !== false;
        targetPath = String(payload.targetPath || "");
        previousDocumentPath = String(payload.previousDocumentPath || "");
        deletePreviousAfterSave = payload.deletePreviousAfterSave === true;

        doc = app.activeDocument;
        docPath = $.global.Bridge._getDocumentPathSafe(doc);
        normalizedDocPath = $.global.Bridge._normalizeFilePath(docPath);

        if (targetPath) {
            outputFile = new File(targetPath);
            outputPath = String(outputFile.fsName || outputFile.fullName || targetPath).replace(/\\/g, "/");
            outputName = String(outputFile.name || "");
            normalizedTargetPath = $.global.Bridge._normalizeFilePath(outputPath);

            if (!outputName) {
                return Base64.encode(JSON.stringify({ success: false, error: "Invalid overwrite target path" }));
            }

            if (normalizedDocPath && normalizedTargetPath === normalizedDocPath) {
                doc.save();
                return Base64.encode(JSON.stringify({
                    success: true,
                    outputPath: String(doc.fullName.fsName || outputPath).replace(/\\/g, "/"),
                    outputName: String(doc.name || outputName)
                }));
            }

            openTargetDoc = $.global.Bridge._findOpenDocumentByPath(outputPath);
            if (openTargetDoc) {
                if (openTargetDoc.saved === false) {
                    return Base64.encode(JSON.stringify({ success: false, error: "Target file is open with unsaved changes" }));
                }
                return Base64.encode(JSON.stringify({ success: false, error: "Target file is already open" }));
            }

            if (deleteExistingFirst && outputFile.exists && !outputFile.remove()) {
                return Base64.encode(JSON.stringify({ success: false, error: "Could not delete existing target file" }));
            }

            savedFormat = $.global.Bridge._saveDocumentToFileWithFormat(
                doc,
                outputFile,
                $.global.Bridge._resolveSaveFormat(outputFormat, outputPath, "ai")
            );

            return Base64.encode(JSON.stringify({
                success: true,
                outputPath: String(outputFile.fsName || outputFile.fullName || outputPath).replace(/\\/g, "/"),
                outputName: outputName,
                outputFormat: savedFormat
            }));
        }

        if (!outputDirectory) {
            return Base64.encode(JSON.stringify({ success: false, error: "Missing output directory" }));
        }

        if (!timestampSuffix) {
            return Base64.encode(JSON.stringify({ success: false, error: "Missing timestamp suffix" }));
        }

        folder = new Folder(outputDirectory);
        if (!folder.exists) {
            return Base64.encode(JSON.stringify({ success: false, error: "Output directory not found" }));
        }

        if (!docPath && !customPrefix) {
            return Base64.encode(JSON.stringify({ success: false, error: "Active document must be saved or a filename prefix is required" }));
        }

        if (docPath) {
            docFile = new File(docPath);
            baseName = $.global.Bridge._stripExtension(docFile.name || doc.name || "");
        } else {
            baseName = customPrefix;
        }
        if (!baseName) {
            return Base64.encode(JSON.stringify({ success: false, error: "Could not resolve active document name" }));
        }

        resolvedStem = $.global.Bridge._sanitizeFileStem(customPrefix || baseName);
        if (!resolvedStem) {
            return Base64.encode(JSON.stringify({ success: false, error: "Invalid save filename prefix" }));
        }

        outputFormat = $.global.Bridge._resolveSaveFormat(outputFormat, previousDocumentPath || docPath || doc.name, "ai");
        outputName = resolvedStem + "_" + timestampSuffix + "." + outputFormat;
        outputPath = $.global.Bridge._joinPath(folder.fsName, outputName);
        outputFile = new File(outputPath);

        openTargetDoc = $.global.Bridge._findOpenDocumentByPath(outputFile.fsName || outputPath);
        if (openTargetDoc) {
            if (openTargetDoc.saved === false) {
                return Base64.encode(JSON.stringify({ success: false, error: "Target file is open with unsaved changes" }));
            }
            return Base64.encode(JSON.stringify({ success: false, error: "Target file is already open" }));
        }

        if (deleteExistingFirst && outputFile.exists && !outputFile.remove()) {
            return Base64.encode(JSON.stringify({ success: false, error: "Could not delete existing target file" }));
        }

        savedFormat = $.global.Bridge._saveDocumentToFileWithFormat(doc, outputFile, outputFormat);
        previousDeleteResult = deletePreviousAfterSave
            ? $.global.Bridge._removePreviousOutputFileAfterSave(previousDocumentPath || docPath, outputFile.fsName || outputPath)
            : { attempted: false, deleted: false };

        return Base64.encode(JSON.stringify({
            success: true,
            outputPath: String(outputFile.fsName || outputFile.fullName || outputPath).replace(/\\/g, "/"),
            outputName: outputName,
            outputFormat: savedFormat,
            previousFileDelete: previousDeleteResult,
            previousFileDeleted: previousDeleteResult && previousDeleteResult.deleted === true,
            previousFileDeleteError: previousDeleteResult && previousDeleteResult.error ? previousDeleteResult.error : ""
        }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};
