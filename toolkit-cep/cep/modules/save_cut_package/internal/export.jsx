if (!$.global.__TOOLKIT_SAVE_CUT_PACKAGE__) {
    throw new Error("Save Cut Package namespace was not initialized.");
}

var SaveCutPackage = $.global.__TOOLKIT_SAVE_CUT_PACKAGE__;

SaveCutPackage.createFile = function (filePath) {
    return new File(SaveCutPackage.normalizeFsPath(filePath));
};

SaveCutPackage.createFolder = function (folderPath) {
    return new Folder(SaveCutPackage.normalizeFsPath(folderPath));
};

SaveCutPackage.pathsEqual = function (leftPath, rightPath) {
    return SaveCutPackage.normalizeFsPath(leftPath).toLowerCase() === SaveCutPackage.normalizeFsPath(rightPath).toLowerCase();
};

SaveCutPackage.ensureFolderExists = function (folder) {
    if (!folder || folder.exists) {
        return true;
    }

    return folder.create();
};

SaveCutPackage.removeFileIfExists = function (file) {
    if (!file || !file.exists) {
        return true;
    }

    try {
        file.remove();
    } catch (error) {}

    return !file.exists;
};

SaveCutPackage.ensureParentFolder = function (file) {
    return SaveCutPackage.ensureFolderExists(file.parent);
};

SaveCutPackage.getCurrentDocumentPath = function (doc) {
    try {
        if (doc && doc.fullName) {
            return SaveCutPackage.normalizeFsPath(doc.fullName.fsName || doc.fullName);
        }
    } catch (error) {}

    return "";
};

SaveCutPackage.saveSourceDocument = function (doc, sourceAiFile) {
    var currentPath = SaveCutPackage.getCurrentDocumentPath(doc);
    var options = null;

    if (!SaveCutPackage.ensureParentFolder(sourceAiFile)) {
        throw new Error("Khong the tao thu muc luu file nguon AI: " + sourceAiFile.parent.fsName);
    }

    if (currentPath && SaveCutPackage.pathsEqual(currentPath, sourceAiFile.fsName) && doc.saved) {
        doc.save();
        return SaveCutPackage.normalizeFsPath(sourceAiFile.fsName);
    }

    if (!SaveCutPackage.removeFileIfExists(sourceAiFile)) {
        throw new Error("Khong the ghi de file nguon AI: " + sourceAiFile.fsName);
    }

    options = new IllustratorSaveOptions();
    options.pdfCompatible = true;
    doc.saveAs(sourceAiFile, options);

    return SaveCutPackage.normalizeFsPath(sourceAiFile.fsName);
};

SaveCutPackage.saveAiDocument = function (doc, aiFile) {
    var options = null;

    if (!SaveCutPackage.ensureParentFolder(aiFile)) {
        throw new Error("Khong the tao thu muc luu AI bai be: " + aiFile.parent.fsName);
    }

    if (!SaveCutPackage.removeFileIfExists(aiFile)) {
        throw new Error("Khong the ghi de file AI bai be: " + aiFile.fsName);
    }

    options = new IllustratorSaveOptions();
    options.pdfCompatible = true;
    doc.saveAs(aiFile, options);

    return SaveCutPackage.normalizeFsPath(aiFile.fsName);
};

SaveCutPackage.exportPdfDocument = function (doc, pdfFile) {
    var options = null;

    if (!SaveCutPackage.ensureParentFolder(pdfFile)) {
        throw new Error("Khong the tao thu muc luu PDF bai in: " + pdfFile.parent.fsName);
    }

    if (!SaveCutPackage.removeFileIfExists(pdfFile)) {
        throw new Error("Khong the ghi de file PDF bai in: " + pdfFile.fsName);
    }

    options = new PDFSaveOptions();
    options.preserveEditability = true;
    doc.saveAs(pdfFile, options);

    return SaveCutPackage.normalizeFsPath(pdfFile.fsName);
};

SaveCutPackage.copyFile = function (sourceFile, targetFile) {
    if (!sourceFile || !sourceFile.exists) {
        throw new Error("Khong tim thay file nguon AI de tao ban xuat: " + (sourceFile ? sourceFile.fsName : ""));
    }

    if (!SaveCutPackage.ensureParentFolder(targetFile)) {
        throw new Error("Khong the tao thu muc tam de tao ban xuat: " + targetFile.parent.fsName);
    }

    if (!SaveCutPackage.removeFileIfExists(targetFile)) {
        throw new Error("Khong the ghi de file tam: " + targetFile.fsName);
    }

    if (!sourceFile.copy(targetFile.fsName)) {
        throw new Error("Khong the tao ban sao tam tu file nguon AI.");
    }

    return targetFile;
};

SaveCutPackage.buildTempCopyFile = function (sourceAiFile, label) {
    var tempFolder = Folder.temp;
    var sourceBaseName = SaveCutPackage.getFileBaseName(sourceAiFile.fsName);
    var fileName = "toolkit_" + String(label || "export") + "_" + new Date().getTime() + "_" + sourceBaseName + ".ai";

    return new File(tempFolder.fsName + "/" + fileName);
};

SaveCutPackage.openTempCopyDocument = function (sourceAiFile, label) {
    var tempCopyFile = SaveCutPackage.buildTempCopyFile(sourceAiFile, label);

    SaveCutPackage.copyFile(sourceAiFile, tempCopyFile);

    return {
        tempFile: tempCopyFile,
        doc: app.open(tempCopyFile)
    };
};

SaveCutPackage.closeDocumentNoSave = function (doc) {
    if (!doc) {
        return;
    }

    try {
        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (error) {}
};

SaveCutPackage.removeTempFile = function (file) {
    if (!file || !file.exists) {
        return;
    }

    try {
        file.remove();
    } catch (error) {}
};

SaveCutPackage.unlockLayerForExport = function (layer) {
    try {
        layer.locked = false;
    } catch (lockedError) {}
    try {
        layer.hidden = false;
    } catch (hiddenError) {}
    try {
        layer.visible = true;
    } catch (visibleError) {}
};

SaveCutPackage.isProtectedLayerName = function (layerName) {
    var normalized = String(layerName || "");

    return normalized === SaveCutPackage.cutLayerName || normalized === SaveCutPackage.cameraLayerName;
};

SaveCutPackage.collectRootLayerItems = function (layer) {
    var items = [];
    var index;
    var item;

    for (index = 0; index < layer.pageItems.length; index += 1) {
        item = layer.pageItems[index];
        if (item.parent === layer) {
            items.push(item);
        }
    }

    return items;
};

SaveCutPackage.createRasterizeOptions = function () {
    var options = new RasterizeOptions();

    options.resolution = 300;
    options.transparency = true;
    options.padding = 0;
    options.convertSpotColors = false;
    options.includeLayers = false;
    options.convertTextToOutlines = false;
    options.antiAliasingMethod = AntiAliasingMethod.ARTOPTIMIZED;

    return options;
};

SaveCutPackage.rasterizeLayerArtwork = function (doc, layer) {
    var rootItems;
    var stagingGroup;
    var bounds;
    var rasterItem;
    var index;

    if (!layer) {
        return null;
    }

    SaveCutPackage.unlockLayerForExport(layer);

    rootItems = SaveCutPackage.collectRootLayerItems(layer);

    if (rootItems.length === 0) {
        return null;
    }

    stagingGroup = layer.groupItems.add();
    stagingGroup.name = "__TOOLKIT_PRINT_STAGE__";

    for (index = 0; index < rootItems.length; index += 1) {
        rootItems[index].move(stagingGroup, ElementPlacement.PLACEATEND);
    }

    bounds = stagingGroup.visibleBounds;
    rasterItem = doc.rasterize(stagingGroup, bounds, SaveCutPackage.createRasterizeOptions());
    rasterItem.name = "PRINT_RASTER_300PPI";

    if (rasterItem.parent !== layer) {
        rasterItem.move(layer, ElementPlacement.PLACEATEND);
    }

    return rasterItem;
};

SaveCutPackage.rasterizePrintableLayers = function (container, doc, counters, protectedContext) {
    var index;
    var layer;
    var isProtected;
    var rasterItem;

    for (index = 0; index < container.layers.length; index += 1) {
        layer = container.layers[index];
        isProtected = protectedContext === true || SaveCutPackage.isProtectedLayerName(layer.name);

        if (!isProtected) {
            rasterItem = SaveCutPackage.rasterizeLayerArtwork(doc, layer);
            if (rasterItem) {
                counters.rasterizedLayerCount += 1;
                counters.rasterItemCount += 1;
            }
        }

        if (layer.layers && layer.layers.length > 0) {
            SaveCutPackage.rasterizePrintableLayers(layer, doc, counters, isProtected);
        }
    }
};

SaveCutPackage.hideProtectedLayersForPrint = function (container, counters) {
    var index;
    var layer;
    var isProtected;

    for (index = 0; index < container.layers.length; index += 1) {
        layer = container.layers[index];
        isProtected = SaveCutPackage.isProtectedLayerName(layer.name);

        if (isProtected) {
            try {
                layer.locked = false;
            } catch (unlockError) {}
            try {
                layer.hidden = true;
            } catch (hideError) {
                try {
                    layer.visible = false;
                } catch (visibleError) {}
            }
            counters.hiddenProtectedLayerCount += 1;
        }

        if (layer.layers && layer.layers.length > 0) {
            SaveCutPackage.hideProtectedLayersForPrint(layer, counters);
        }
    }
};

SaveCutPackage.exportDieAiPackage = function (sourceAiFile, aiFile) {
    var exportContext = null;
    var counters = {
        rasterizedLayerCount: 0,
        rasterItemCount: 0
    };

    try {
        exportContext = SaveCutPackage.openTempCopyDocument(sourceAiFile, "die");
        SaveCutPackage.rasterizePrintableLayers(exportContext.doc, exportContext.doc, counters, false);
        SaveCutPackage.saveAiDocument(exportContext.doc, aiFile);
        return counters;
    } finally {
        if (exportContext) {
            SaveCutPackage.closeDocumentNoSave(exportContext.doc);
            SaveCutPackage.removeTempFile(exportContext.tempFile);
        }
    }
};

SaveCutPackage.exportPrintPdfPackage = function (sourceAiFile, pdfFile) {
    var exportContext = null;
    var counters = {
        hiddenProtectedLayerCount: 0
    };

    try {
        exportContext = SaveCutPackage.openTempCopyDocument(sourceAiFile, "print");
        SaveCutPackage.hideProtectedLayersForPrint(exportContext.doc, counters);
        SaveCutPackage.exportPdfDocument(exportContext.doc, pdfFile);
        return counters;
    } finally {
        if (exportContext) {
            SaveCutPackage.closeDocumentNoSave(exportContext.doc);
            SaveCutPackage.removeTempFile(exportContext.tempFile);
        }
    }
};
