if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var SaveCutPackage;

    if (!internalFolder.exists) {
        throw new Error("Save Cut Package internal folder missing: " + internalFolder.fsName);
    }

    SaveCutPackage = {
        moduleId: "save_cut_package"
    };

    $.global.__TOOLKIT_SAVE_CUT_PACKAGE__ = SaveCutPackage;

    internalFiles = [
        "request.jsx",
        "export.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Save Cut Package internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof SaveCutPackage.execute !== "function") {
        throw new Error("Save Cut Package module failed to register execute().");
    }

    $.global.ToolkitModules[SaveCutPackage.moduleId] = function (payload) {
        return SaveCutPackage.execute(payload || {});
    };
})();
