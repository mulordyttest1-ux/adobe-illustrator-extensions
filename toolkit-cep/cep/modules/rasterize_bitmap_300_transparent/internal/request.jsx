if (!$.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__) {
    throw new Error("Rasterize Bitmap namespace was not initialized.");
}

var RasterizeBitmap = $.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__;

RasterizeBitmap.createModuleError = function (errorCode, message, data) {
    var error = new Error(message);

    error.rasterizeErrorCode = errorCode;
    error.rasterizeErrorData = data || null;

    return error;
};

RasterizeBitmap.resolveRequest = function () {
    return {
        colorModel: RasterizationColorModel.BITMAP,
        colorModelName: "bitmap",
        resolution: 300,
        transparency: true,
        backgroundBlack: false,
        clippingMask: false,
        padding: 0,
        convertSpotColors: false,
        includeLayers: false,
        convertTextToOutlines: false,
        antiAliasingMethod: AntiAliasingMethod.ARTOPTIMIZED
    };
};
