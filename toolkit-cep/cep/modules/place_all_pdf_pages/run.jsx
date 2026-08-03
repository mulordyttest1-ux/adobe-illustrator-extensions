if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var PlaceAllPdfPages;

    if (!internalFolder.exists) {
        throw new Error("Place All Pages internal folder missing: " + internalFolder.fsName);
    }

    PlaceAllPdfPages = {
        moduleId: "place_all_pdf_pages",
        title: "Place All Pages",
        artboardGap: 20,
        artboardLimit: 1000,
        pageItemPrefix: "Page ",
        aiItemPrefix: "Artboard "
    };

    $.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__ = PlaceAllPdfPages;

    internalFiles = [
        "request.jsx",
        "ai_source.jsx",
        "layout.jsx",
        "placement.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Place All Pages internal file missing: " + internalFiles[index]);
        }
        $.evalFile(file);
    }

    if (typeof PlaceAllPdfPages.execute !== "function") {
        throw new Error("Place All Pages module failed to register execute().");
    }

    $.global.ToolkitModules[PlaceAllPdfPages.moduleId] = function (payload) {
        return PlaceAllPdfPages.execute(payload || {});
    };
})();
