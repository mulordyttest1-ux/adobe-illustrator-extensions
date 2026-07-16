if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.layerName = "CUT";
CutLines.spotName = "CutContour";
CutLines.strokeWidthPt = 0.25;
CutLines.pathName = "CutContour";
CutLines.groupPrefix = "CUTLINES";

CutLines.unlockItem = function (item) {
    try {
        item.locked = false;
    } catch (error1) {}
    try {
        item.hidden = false;
    } catch (error2) {}
};

CutLines.mmToPt = function (value) {
    return value * 2.834645669291339;
};

CutLines.ptToMm = function (value) {
    return value / 2.834645669291339;
};

CutLines.trimString = function (value) {
    return String(value).replace(/^\s+|\s+$/g, "");
};

CutLines.formatNumber = function (value) {
    return String(Math.round(value * 1000) / 1000);
};

CutLines.getOrCreateLayer = function (doc, layerName) {
    var i;

    for (i = 0; i < doc.layers.length; i += 1) {
        if (doc.layers[i].name === layerName) {
            CutLines.unlockItem(doc.layers[i]);
            return doc.layers[i];
        }
    }

    var layer = doc.layers.add();
    layer.name = layerName;
    CutLines.unlockItem(layer);
    return layer;
};

CutLines.getOrCreateSpotColor = function (doc, spotName) {
    var spot;
    var color;

    try {
        spot = doc.spots.getByName(spotName);
    } catch (error) {
        spot = doc.spots.add();
        spot.name = spotName;
        spot.colorType = ColorModel.SPOT;
        color = new CMYKColor();
        color.cyan = 0;
        color.magenta = 100;
        color.yellow = 0;
        color.black = 0;
        spot.color = color;
    }

    color = new SpotColor();
    color.spot = spot;
    color.tint = 100;
    return color;
};

CutLines.stylePathItem = function (pathItem, color) {
    pathItem.name = CutLines.pathName;
    try {
        pathItem.guides = false;
    } catch (guidesError) {}
    try {
        pathItem.clipping = false;
    } catch (clippingError) {}
    pathItem.filled = false;
    pathItem.stroked = true;
    pathItem.strokeWidth = CutLines.strokeWidthPt;
    pathItem.strokeColor = color;
    pathItem.strokeCap = StrokeCap.BUTTENDCAP;
    pathItem.strokeJoin = StrokeJoin.MITERENDJOIN;
    pathItem.strokeMiterLimit = 10;
    pathItem.opacity = 100;
    try {
        pathItem.strokeDashes = [];
        pathItem.strokeDashOffset = 0;
    } catch (dashError) {}
};

CutLines.styleCompoundPath = function (compoundItem, color) {
    var i;

    for (i = 0; i < compoundItem.pathItems.length; i += 1) {
        CutLines.stylePathItem(compoundItem.pathItems[i], color);
    }
    compoundItem.name = CutLines.pathName;
};
