if (!$.global.ToolkitModules) {
    $.global.ToolkitModules = {};
}

(function () {
    var moduleRoot = new File($.fileName).parent;
    var internalFolder = new Folder(moduleRoot.fsName + "/internal");
    var internalFiles;
    var index;
    var file;
    var TextBreak;

    if (!internalFolder.exists) {
        throw new Error("Break Text into Lines internal folder missing: " + internalFolder.fsName);
    }

    TextBreak = {
        moduleId: "break_text_into_lines",
        granularity: "lines",
        title: "Break Text into Lines"
    };

    $.global.__TOOLKIT_BREAK_TEXT_LINES__ = TextBreak;

    internalFiles = [
        "request.jsx",
        "selection.jsx",
        "split.jsx",
        "placement.jsx",
        "result.jsx"
    ];

    for (index = 0; index < internalFiles.length; index += 1) {
        file = new File(internalFolder.fsName + "/" + internalFiles[index]);
        if (!file.exists) {
            throw new Error("Break Text into Lines internal file missing: " + file.fsName);
        }
        $.evalFile(file);
    }

    if (typeof TextBreak.execute !== "function") {
        throw new Error("Break Text into Lines module failed to register execute().");
    }

    $.global.ToolkitModules[TextBreak.moduleId] = function (payload) {
        return TextBreak.execute(payload || {});
    };
})();
