if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var RecolorSelection;

    if (!internalFolder.exists) {
        throw new Error("Recolor K100 internal folder missing: " + internalFolder.fsName);
    }

    RecolorSelection = {
        moduleId: "recolor_selection_k100",
        title: "Recolor K100",
        successLabel: "K100",
        targetColorSpec: {
            cyan: 0,
            magenta: 0,
            yellow: 0,
            black: 100
        }
    };

    $.global.__TOOLKIT_RECOLOR_SELECTION_K100__ = RecolorSelection;

    internalFiles = [
        "request.jsx",
        "selection.jsx",
        "recolor.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Recolor K100 internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof RecolorSelection.execute !== "function") {
        throw new Error("Recolor K100 module failed to register execute().");
    }

    $.global.ToolkitModules[RecolorSelection.moduleId] = function (payload) {
        return RecolorSelection.execute(payload || {});
    };
})();
