if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var RasterizeBitmap;

    if (!internalFolder.exists) {
        throw new Error("Rasterize Bitmap internal folder missing: " + internalFolder.fsName);
    }

    RasterizeBitmap = {
        moduleId: "rasterize_bitmap_300_transparent",
        title: "Rasterize Bitmap"
    };

    $.global.__TOOLKIT_RASTERIZE_BITMAP_300_TRANSPARENT__ = RasterizeBitmap;

    internalFiles = [
        "request.jsx",
        "selection.jsx",
        "rasterize.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Rasterize Bitmap internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof RasterizeBitmap.execute !== "function") {
        throw new Error("Rasterize Bitmap module failed to register execute().");
    }

    $.global.ToolkitModules[RasterizeBitmap.moduleId] = function (payload) {
        return RasterizeBitmap.execute(payload || {});
    };
})();
