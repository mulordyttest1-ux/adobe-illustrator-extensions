if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var StepRepeat;

    if (!internalFolder.exists) {
        throw new Error("Step Repeat internal folder missing: " + internalFolder.fsName);
    }

    StepRepeat = {
        moduleId: "step_repeat",
        mode: "plain",
        title: "Step Repeat"
    };

    $.global.__TOOLKIT_STEP_REPEAT__ = StepRepeat;

    internalFiles = [
        "request.jsx",
        "selection.jsx",
        "fitting.jsx",
        "plain_strategy.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Step Repeat internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof StepRepeat.execute !== "function") {
        throw new Error("Step Repeat module failed to register execute().");
    }

    $.global.ToolkitModules[StepRepeat.moduleId] = function (payload) {
        return StepRepeat.execute(payload || {});
    };
})();
