// Shared core helpers for Wedding Suite Standard.
if (typeof $.global.WeddingSuiteStandard === "undefined") {
    $.global.WeddingSuiteStandard = {};
}

$.global.WeddingSuiteStandard.runtimeContractVersion = "pdf-only-output-v2";

$.global.WeddingSuiteStandard._encodeResult = function (obj) {
    return Base64.encode(
        $.global.WeddingSuiteStandard._encodeBridgeString(JSON.stringify(obj))
    );
};

$.global.WeddingSuiteStandard._decodePayload = function (base64Payload) {
    return JSON.parse($.global.WeddingSuiteStandard._decodeBridgeString(Base64.decode(base64Payload || "")));
};

$.global.WeddingSuiteStandard._encodeBridgeString = function (value) {
    try {
        return encodeURIComponent(String(value || ""));
    } catch (e) {
        return String(value || "");
    }
};

$.global.WeddingSuiteStandard._decodeBridgeString = function (value) {
    try {
        return decodeURIComponent(String(value || ""));
    } catch (e) {
        return String(value || "");
    }
};

$.global.WeddingSuiteStandard._mmToPt = function (value) {
    return Number(value || 0) * 2.834645669;
};

$.global.WeddingSuiteStandard._ptToMm = function (value) {
    return Number(value || 0) / 2.834645669;
};

$.global.WeddingSuiteStandard._makeRect = function (left, top, widthPt, heightPt) {
    return [left, top, left + widthPt, top - heightPt];
};

$.global.WeddingSuiteStandard._intersects = function (r1, r2) {
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

$.global.WeddingSuiteStandard._getDocumentPath = function (doc) {
    try {
        if (doc && doc.fullName) {
            return doc.fullName.fsName;
        }
    } catch (e) { }

    return "";
};

$.global.WeddingSuiteStandard._getDocumentPathSafe = function (doc) {
    try {
        if (doc && doc.fullName && doc.fullName.fsName) {
            return String(doc.fullName.fsName || '').replace(/\\/g, '/');
        }
    } catch (fullNameErr) { }

    try {
        return String($.global.WeddingSuiteStandard._getDocumentPath(doc) || '').replace(/\\/g, '/');
    } catch (docPathErr) { }

    return '';
};

$.global.WeddingSuiteStandard._normalizeDocumentPath = function (path) {
    try {
        return String(new File(path).fsName || '').replace(/\\/g, '/').toLowerCase();
    } catch (e) {
        return String(path || '').replace(/\\/g, '/').toLowerCase();
    }
};

$.global.WeddingSuiteStandard._readJsonFile = function (file) {
    var raw = "";

    if (!file || !file.exists) {
        return null;
    }

    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) {
            return null;
        }
        raw = file.read();
        file.close();
        return JSON.parse(String(raw || ""));
    } catch (e) {
        try {
            if (file.opened) {
                file.close();
            }
        } catch (closeErr) { }
        return null;
    }
};

$.global.WeddingSuiteStandard._resolvePaperStockConfigFile = function (payload) {
    var templatePath = String(payload && payload.templatePath ? payload.templatePath : "");
    var templateFile;
    var configFile;

    if (!templatePath) {
        return null;
    }

    try {
        templateFile = new File(templatePath);
        configFile = new File(templateFile.parent.fsName + "/data/wedding_suite_paper_stocks.json");
        return configFile.exists ? configFile : null;
    } catch (e) {
        return null;
    }
};

$.global.WeddingSuiteStandard._findPaperStockConfigEntry = function (config, stockId) {
    var stocks = config && config.stocks instanceof Array ? config.stocks : [];
    var i;

    for (i = 0; i < stocks.length; i += 1) {
        if (String(stocks[i] && stocks[i].id ? stocks[i].id : "") === String(stockId || "")) {
            return stocks[i];
        }
    }

    return null;
};

$.global.WeddingSuiteStandard._replaceStockLabel = function (artboardName, oldLabel, newLabel) {
    var name = String(artboardName || "");
    var oldSuffix = oldLabel ? " | " + String(oldLabel) : "";
    var separatorIndex;

    if (oldSuffix && name.substring(name.length - oldSuffix.length) === oldSuffix) {
        return name.substring(0, name.length - oldSuffix.length) + " | " + newLabel;
    }

    separatorIndex = name.lastIndexOf(" | ");
    return separatorIndex >= 0
        ? name.substring(0, separatorIndex) + " | " + newLabel
        : name + " | " + newLabel;
};

$.global.WeddingSuiteStandard._refreshPlanPaperStockFromConfig = function (payload) {
    var plan = payload && payload.plan ? payload.plan : null;
    var currentStock = plan && plan.paperStock ? plan.paperStock : null;
    var configFile;
    var config;
    var configuredStock;
    var widthMm;
    var heightMm;
    var label;
    var oldLabel;
    var previewCount;
    var columns;
    var rows;
    var usableWidthMm;
    var usableHeightMm;
    var sheets;
    var i;

    if (!plan || !currentStock || !currentStock.id) {
        return false;
    }

    configFile = $.global.WeddingSuiteStandard._resolvePaperStockConfigFile(payload);
    config = $.global.WeddingSuiteStandard._readJsonFile(configFile);
    configuredStock = $.global.WeddingSuiteStandard._findPaperStockConfigEntry(config, currentStock.id);
    widthMm = Number(configuredStock && configuredStock.widthMm);
    heightMm = Number(configuredStock && configuredStock.heightMm);
    if (!(widthMm > 0) || !(heightMm > 0)) {
        return false;
    }

    label = String(configuredStock.label || configuredStock.id || currentStock.id);
    oldLabel = String(currentStock.label || "");
    plan.paperStock = {
        id: String(configuredStock.id || currentStock.id),
        label: label,
        widthMm: widthMm,
        heightMm: heightMm
    };

    usableWidthMm = Math.max(0, widthMm - 10);
    usableHeightMm = Math.max(0, heightMm - 10);
    plan.usableWidthMm = usableWidthMm;
    plan.usableHeightMm = usableHeightMm;

    previewCount = plan.qaPreviewPages && plan.qaPreviewPages.length
        ? plan.qaPreviewPages.length
        : 1;
    columns = Math.min(2, previewCount);
    rows = Math.max(1, Math.ceil(previewCount / 2));
    if (plan.qaArtboard) {
        plan.qaArtboard.widthMm = 10 + (columns * (usableWidthMm / 4));
        plan.qaArtboard.heightMm = 22 + (rows * (usableHeightMm / 2));
    }

    sheets = plan.productionSheets || [];
    for (i = 0; i < sheets.length; i += 1) {
        sheets[i].widthMm = widthMm;
        sheets[i].heightMm = heightMm;
        sheets[i].artboardName = $.global.WeddingSuiteStandard._replaceStockLabel(
            sheets[i].artboardName,
            oldLabel,
            label
        );
    }

    return true;
};

$.global.WeddingSuiteStandard._getDirectoryName = function (path) {
    var normalized = String(path || "").replace(/\\/g, "/");
    var lastSlash = normalized.lastIndexOf("/");
    return lastSlash > 0 ? normalized.substring(0, lastSlash) : "";
};

$.global.WeddingSuiteStandard._getBaseName = function (path) {
    var normalized = String(path || "").replace(/\\/g, "/");
    var lastSlash = normalized.lastIndexOf("/");
    return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
};

$.global.WeddingSuiteStandard._stripExtension = function (filename) {
    var safeName = String(filename || "");
    var lastDot = safeName.lastIndexOf(".");
    return lastDot > 0 ? safeName.substring(0, lastDot) : safeName;
};

$.global.WeddingSuiteStandard._sanitizeFileSegment = function (value) {
    var safeValue = String(value || "")
        .replace(/[^\w.-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    return safeValue || "job";
};

$.global.WeddingSuiteStandard._truncateText = function (value, maxLength) {
    var text = String(value || "");
    var limit = Number(maxLength) || 0;

    if (!(limit > 0) || text.length <= limit) {
        return text;
    }

    if (limit <= 3) {
        return text.substring(0, limit);
    }

    return text.substring(0, limit - 3) + "...";
};

$.global.WeddingSuiteStandard._isPdfSourcePath = function (path) {
    return /\.pdf$/i.test(String(path || ""));
};
