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
        throw new Error("Recolor Red internal folder missing: " + internalFolder.fsName);
    }

    RecolorSelection = {
        moduleId: "recolor_selection_red_c0_m100_y100_k0",
        title: "Recolor Red",
        successLabel: "C0 M100 Y100 K0",
        targetColorSpec: {
            cyan: 0,
            magenta: 100,
            yellow: 100,
            black: 0
        }
    };

    $.global.__TOOLKIT_RECOLOR_SELECTION_RED__ = RecolorSelection;

    internalFiles = [
        "request.jsx",
        "selection.jsx",
        "recolor.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Recolor Red internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof RecolorSelection.execute !== "function") {
        throw new Error("Recolor Red module failed to register execute().");
    }

    $.global.ToolkitModules[RecolorSelection.moduleId] = function (payload) {
        return RecolorSelection.execute(payload || {});
    };
})();
