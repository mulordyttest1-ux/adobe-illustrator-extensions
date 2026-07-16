if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var CutLines;

    if (!internalFolder.exists) {
        throw new Error("Cut Lines internal folder missing: " + internalFolder.fsName);
    }

    CutLines = {
        moduleId: "create_cut_lines"
    };

    $.global.__TOOLKIT_CUT_LINES__ = CutLines;

    internalFiles = [
        "style.jsx",
        "metadata.jsx",
        "selection_geometry.jsx",
        "request.jsx",
        "contour_strategy.jsx",
        "sline_strategy.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Cut Lines internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof CutLines.execute !== "function") {
        throw new Error("Cut Lines module failed to register execute().");
    }

    $.global.ToolkitModules[CutLines.moduleId] = function (payload) {
        return CutLines.execute(payload || {});
    };
})();
