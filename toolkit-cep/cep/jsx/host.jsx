(function () {
    if (typeof ToolkitHostRuntime === "undefined") {
        ToolkitHostRuntime = {};
    }

    ToolkitHostRuntime._jsxRootPath = new File($.fileName).parent.fsName;

    ToolkitHostRuntime._resolveJsxRoot = function () {
        return new Folder(ToolkitHostRuntime._jsxRootPath);
    };

    ToolkitHostRuntime._lastLoadErrorMessage = "";

    ToolkitHostRuntime._evalBootstrap = function (jsxRootFolder) {
        var bootstrapFile = new File(jsxRootFolder.fsName + "/bootstrap/toolkitHostBootstrap.jsx");
        if (!bootstrapFile.exists) {
            throw new Error("Toolkit host bootstrap missing: " + bootstrapFile.fsName);
        }

        $.evalFile(bootstrapFile);
        return bootstrapFile;
    };

    ToolkitHostRuntime._loadRuntime = function (payloadJson) {
        var jsxRootFolder = ToolkitHostRuntime._resolveJsxRoot();

        ToolkitHostRuntime._evalBootstrap(jsxRootFolder);

        if (typeof ToolkitHostBootstrap === "undefined" || typeof ToolkitHostBootstrap.load !== "function") {
            throw new Error("ToolkitHostBootstrap.load unavailable");
        }

        return ToolkitHostBootstrap.load(payloadJson || "", jsxRootFolder.fsName);
    };

    ToolkitHostRuntime._autoLoadRuntime = function () {
        try {
            ToolkitHostRuntime._loadRuntime("");
            ToolkitHostRuntime._lastLoadErrorMessage = "";
        } catch (error) {
            ToolkitHostRuntime._lastLoadErrorMessage = error && error.message ? error.message : "Toolkit host runtime auto-load failed";
            $.writeln(ToolkitHostRuntime._lastLoadErrorMessage);
        }
    };

    ToolkitHostRuntime.reload = function (payloadJson) {
        var result = ToolkitHostRuntime._loadRuntime(payloadJson || "");
        ToolkitHostRuntime._lastLoadErrorMessage = "";
        return result;
    };

    ToolkitHostRuntime.inspect = function () {
        if (ToolkitHostRuntime._lastLoadErrorMessage) {
            throw new Error(ToolkitHostRuntime._lastLoadErrorMessage);
        }

        ToolkitHostRuntime._evalBootstrap(ToolkitHostRuntime._resolveJsxRoot());

        if (typeof ToolkitHostBootstrap === "undefined" || typeof ToolkitHostBootstrap.inspect !== "function") {
            throw new Error("ToolkitHostBootstrap.inspect unavailable");
        }

        return ToolkitHostBootstrap.inspect();
    };

    ToolkitHostEntry = ToolkitHostRuntime;
    ToolkitHostRuntime._autoLoadRuntime();
    $.writeln("Toolkit host entry loaded");
})();
