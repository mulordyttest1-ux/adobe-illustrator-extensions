if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var SwapSelection;

    if (!internalFolder.exists) {
        throw new Error("Swap Size + Position internal folder missing: " + internalFolder.fsName);
    }

    SwapSelection = {
        moduleId: "swap_selection_size_and_position",
        mode: "size_and_position",
        title: "Swap Size + Position"
    };

    $.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__ = SwapSelection;

    internalFiles = [
        "request.jsx",
        "selection.jsx",
        "geometry.jsx",
        "swap.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Swap Size + Position internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof SwapSelection.execute !== "function") {
        throw new Error("Swap Size + Position module failed to register execute().");
    }

    $.global.ToolkitModules[SwapSelection.moduleId] = function (payload) {
        return SwapSelection.execute(payload || {});
    };
})();
