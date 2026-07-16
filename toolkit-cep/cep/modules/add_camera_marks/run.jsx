if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var CameraMarks;

    if (!internalFolder.exists) {
        throw new Error("Camera Marks internal folder missing: " + internalFolder.fsName);
    }

    CameraMarks = {
        moduleId: "add_camera_marks",
        layerName: "camera_marks",
        moduleRoot: moduleRoot,
        internalFolder: internalFolder
    };

    $.global.__TOOLKIT_CAMERA_MARKS__ = CameraMarks;

    internalFiles = [
        "layer_state.jsx",
        "targeting.jsx",
        "request.jsx",
        "line_profile.jsx",
        "round_profile.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Camera Marks internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof CameraMarks.execute !== "function") {
        throw new Error("Camera Marks module failed to register execute().");
    }

    $.global.ToolkitModules[CameraMarks.moduleId] = function (payload) {
        return CameraMarks.execute(payload || {});
    };
})();
