if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var PrepareCutPackage;

    if (!internalFolder.exists) {
        throw new Error("Prepare Cut Package internal folder missing: " + internalFolder.fsName);
    }

    PrepareCutPackage = {
        moduleId: "prepare_cut_package"
    };

    $.global.__TOOLKIT_PREPARE_CUT_PACKAGE__ = PrepareCutPackage;

    internalFiles = [
        "normalize.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Prepare Cut Package internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof PrepareCutPackage.execute !== "function") {
        throw new Error("Prepare Cut Package module failed to register execute().");
    }

    $.global.ToolkitModules[PrepareCutPackage.moduleId] = function (payload) {
        return PrepareCutPackage.execute(payload || {});
    };
})();
