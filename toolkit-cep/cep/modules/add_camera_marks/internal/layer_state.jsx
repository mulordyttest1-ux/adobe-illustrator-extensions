if (!$.global.__TOOLKIT_CAMERA_MARKS__) {
    throw new Error("Camera Marks namespace was not initialized.");
}

var CameraMarks = $.global.__TOOLKIT_CAMERA_MARKS__;

CameraMarks.unlockItem = function (item) {
    try {
        item.locked = false;
    } catch (error1) {}
    try {
        item.hidden = false;
    } catch (error2) {}
};

CameraMarks.getProcessBlackColor = function () {
    var cmyk = new CMYKColor();
    cmyk.cyan = 0;
    cmyk.magenta = 0;
    cmyk.yellow = 0;
    cmyk.black = 100;
    return cmyk;
};

CameraMarks.mmToPt = function (value) {
    return value * 2.834645669291339;
};

CameraMarks.ptToMm = function (value) {
    return value / 2.834645669291339;
};

CameraMarks.prepareLayer = function (doc, layerName) {
    var i;
    var layer = null;

    for (i = 0; i < doc.layers.length; i += 1) {
        if (doc.layers[i].name === layerName) {
            layer = doc.layers[i];
            break;
        }
    }

    if (!layer) {
        layer = doc.layers.add();
        layer.name = layerName;
        CameraMarks.unlockItem(layer);
        return {
            layer: layer,
            overwroteExistingLayer: false
        };
    }

    CameraMarks.clearLayer(layer);
    return {
        layer: layer,
        overwroteExistingLayer: true
    };
};

CameraMarks.clearLayer = function (layer) {
    var i;

    CameraMarks.unlockItem(layer);

    for (i = layer.layers.length - 1; i >= 0; i -= 1) {
        try {
            CameraMarks.unlockItem(layer.layers[i]);
            layer.layers[i].remove();
        } catch (removeSubLayerError) {}
    }

    for (i = layer.pageItems.length - 1; i >= 0; i -= 1) {
        try {
            CameraMarks.unlockItem(layer.pageItems[i]);
            layer.pageItems[i].remove();
        } catch (removePageItemError) {}
    }
};

CameraMarks.lockLayer = function (layer) {
    if (!layer) {
        return;
    }

    CameraMarks.unlockItem(layer);
    try {
        layer.locked = true;
    } catch (lockError) {}
    try {
        layer.hidden = false;
    } catch (hiddenError) {}
};

CameraMarks.getLayer = function (doc, layerName) {
    var i;

    for (i = 0; i < doc.layers.length; i += 1) {
        if (doc.layers[i].name === layerName) {
            return doc.layers[i];
        }
    }

    return null;
};
