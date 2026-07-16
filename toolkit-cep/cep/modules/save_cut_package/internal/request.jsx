if (!$.global.__TOOLKIT_SAVE_CUT_PACKAGE__) {
    throw new Error("Save Cut Package namespace was not initialized.");
}

var SaveCutPackage = $.global.__TOOLKIT_SAVE_CUT_PACKAGE__;

SaveCutPackage.cutLayerName = "CUT";
SaveCutPackage.cameraLayerName = "camera_marks";
SaveCutPackage.sourceAiPromptTitle = "Save Working Cut Source AI";
SaveCutPackage.dieAiPrefix = "BAI_BE_";
SaveCutPackage.printPdfPrefix = "BAI_IN_";

SaveCutPackage.trimString = function (value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
};

SaveCutPackage.normalizeFsPath = function (value) {
    return String(value || "").replace(/\\/g, "/");
};

SaveCutPackage.ensureExtension = function (filePath, extensionWithDot) {
    var normalized = SaveCutPackage.normalizeFsPath(filePath);
    var extension = String(extensionWithDot || "").toLowerCase();

    if (normalized.toLowerCase().slice(-extension.length) === extension) {
        return normalized;
    }

    return normalized + extension;
};

SaveCutPackage.getDocumentAiPath = function (doc) {
    try {
        if (doc && doc.saved && doc.fullName) {
            return SaveCutPackage.normalizeFsPath(doc.fullName.fsName || doc.fullName);
        }
    } catch (error) {}

    return "";
};

SaveCutPackage.getFileBaseName = function (filePath) {
    var normalized = SaveCutPackage.normalizeFsPath(filePath);
    var fileName = normalized.substring(normalized.lastIndexOf("/") + 1);
    var lastDot = fileName.lastIndexOf(".");

    if (lastDot > 0) {
        return fileName.substring(0, lastDot);
    }

    return fileName;
};

SaveCutPackage.getParentFolderPath = function (filePath) {
    var normalized = SaveCutPackage.normalizeFsPath(filePath);
    var lastSlash = normalized.lastIndexOf("/");

    if (lastSlash <= 0) {
        return "";
    }

    return normalized.substring(0, lastSlash);
};

SaveCutPackage.stripKnownOutputPrefixes = function (baseName) {
    var normalized = String(baseName || "");

    if (normalized.indexOf(SaveCutPackage.dieAiPrefix) === 0) {
        return normalized.substring(SaveCutPackage.dieAiPrefix.length);
    }

    if (normalized.indexOf(SaveCutPackage.printPdfPrefix) === 0) {
        return normalized.substring(SaveCutPackage.printPdfPrefix.length);
    }

    return normalized;
};

SaveCutPackage.buildPrefixedSiblingPath = function (sourceAiPath, prefix, extensionWithDot) {
    var folderPath = SaveCutPackage.getParentFolderPath(sourceAiPath);
    var baseName = SaveCutPackage.stripKnownOutputPrefixes(SaveCutPackage.getFileBaseName(sourceAiPath));
    var fileName = String(prefix || "") + baseName + String(extensionWithDot || "");

    if (!folderPath) {
        return SaveCutPackage.normalizeFsPath(fileName);
    }

    return SaveCutPackage.normalizeFsPath(folderPath + "/" + fileName);
};

SaveCutPackage.promptForAiPath = function (doc) {
    var chosenFile = File.saveDialog(SaveCutPackage.sourceAiPromptTitle, "*.ai");

    if (!chosenFile) {
        return null;
    }

    return SaveCutPackage.ensureExtension(chosenFile.fsName, ".ai");
};

SaveCutPackage.resolveRequest = function (payload, doc) {
    var sourceAiPath = SaveCutPackage.trimString(payload && payload.sourceAiPath ? payload.sourceAiPath : "");
    var aiPath = SaveCutPackage.trimString(payload && payload.aiOutputPath ? payload.aiOutputPath : "");
    var pdfPath = SaveCutPackage.trimString(payload && payload.pdfOutputPath ? payload.pdfOutputPath : "");

    if (!sourceAiPath) {
        sourceAiPath = SaveCutPackage.getDocumentAiPath(doc);
    }

    if (!sourceAiPath) {
        sourceAiPath = SaveCutPackage.promptForAiPath(doc);
        if (!sourceAiPath) {
            return null;
        }
    }

    sourceAiPath = SaveCutPackage.ensureExtension(sourceAiPath, ".ai");

    if (!pdfPath) {
        pdfPath = SaveCutPackage.buildPrefixedSiblingPath(sourceAiPath, SaveCutPackage.printPdfPrefix, ".pdf");
    } else {
        pdfPath = SaveCutPackage.ensureExtension(pdfPath, ".pdf");
    }

    if (!aiPath) {
        aiPath = SaveCutPackage.buildPrefixedSiblingPath(sourceAiPath, SaveCutPackage.dieAiPrefix, ".ai");
    } else {
        aiPath = SaveCutPackage.ensureExtension(aiPath, ".ai");
    }

    return {
        sourceAiPath: SaveCutPackage.normalizeFsPath(sourceAiPath),
        aiPath: SaveCutPackage.normalizeFsPath(aiPath),
        pdfPath: SaveCutPackage.normalizeFsPath(pdfPath)
    };
};
