if (typeof ToolkitHostBootstrap === "undefined") {
    ToolkitHostBootstrap = {};
}

ToolkitHostBootstrap._createEmptyRuntimeMeta = function () {
    return {
        loadedAtMs: 0,
        loadedModules: [],
        quarantinedModules: [],
        moduleCount: 0,
        quarantinedCount: 0
    };
};

ToolkitHostBootstrap._normalizeLoadOptions = function (optionsOrPayload) {
    if (!optionsOrPayload) {
        return {};
    }

    if (typeof optionsOrPayload === "string") {
        return JSON.parse(optionsOrPayload);
    }

    return optionsOrPayload;
};

ToolkitHostBootstrap._resolveRootFolder = function (rootPath) {
    var folder = new Folder(rootPath || "");
    if (!folder.exists) {
        throw new Error("Toolkit host root missing: " + rootPath);
    }

    return folder;
};

ToolkitHostBootstrap._resolveRelativeFile = function (rootFolder, relativePath) {
    var file = new File(rootFolder.fsName + "/" + relativePath);
    if (!file.exists) {
        throw new Error("Toolkit host file missing: " + file.fsName);
    }

    return file;
};

ToolkitHostBootstrap._resolveAnyFile = function (rootFolder, entry) {
    var file = null;

    if (entry && entry.absolutePath) {
        file = new File(entry.absolutePath);
    } else if (entry && entry.relativePath) {
        file = new File(rootFolder.fsName + "/" + entry.relativePath);
    } else {
        throw new Error("Toolkit module registry entry missing path for " + (entry && entry.id ? entry.id : "unknown"));
    }

    if (!file.exists) {
        throw new Error("Toolkit host file missing: " + file.fsName);
    }

    return file;
};

ToolkitHostBootstrap._evalFile = function (file, loadedFiles) {
    $.evalFile(file);

    if (loadedFiles) {
        loadedFiles.push(file.fsName);
    }

    return file;
};

ToolkitHostBootstrap._evalRelative = function (rootFolder, relativePath, loadedFiles) {
    var file = ToolkitHostBootstrap._resolveRelativeFile(rootFolder, relativePath);
    return ToolkitHostBootstrap._evalFile(file, loadedFiles);
};

ToolkitHostBootstrap._resetRuntimeState = function () {
    $.global.ToolkitGeneratedModuleRegistry = [];
    $.global.ToolkitModules = {};
    $.global.__TOOLKIT_HOST_RUNTIME__ = ToolkitHostBootstrap._createEmptyRuntimeMeta();
    $.global.__TOOLKIT_HOST_RUNTIME_STATE__ = {
        loadedFiles: [],
        registryEntries: [],
        registrySourcePath: "",
        loadedById: {},
        quarantinedById: {}
    };
    ToolkitModuleDispatch = {};
    ToolkitBridge = {};
};

ToolkitHostBootstrap._normalizeRegistryEntries = function (rawEntries, context) {
    var entries = [];
    var seenIds = {};
    var index;
    var rawEntry;
    var entryId;
    var hasRelativePath;
    var hasAbsolutePath;

    if (!(rawEntries instanceof Array)) {
        throw new Error(context + ": registry must be an array");
    }

    for (index = 0; index < rawEntries.length; index += 1) {
        rawEntry = rawEntries[index] || {};
        entryId = typeof rawEntry.id === "string" ? rawEntry.id.replace(/^\s+|\s+$/g, "") : "";
        hasRelativePath = typeof rawEntry.relativePath === "string" && rawEntry.relativePath.replace(/^\s+|\s+$/g, "") !== "";
        hasAbsolutePath = typeof rawEntry.absolutePath === "string" && rawEntry.absolutePath.replace(/^\s+|\s+$/g, "") !== "";

        if (!entryId) {
            throw new Error(context + ": registry entry " + index + " is missing id");
        }
        if (seenIds[entryId]) {
            throw new Error(context + ': duplicate registry id "' + entryId + '"');
        }
        if (!hasRelativePath && !hasAbsolutePath) {
            throw new Error(context + ': registry entry "' + entryId + '" is missing a path');
        }

        seenIds[entryId] = true;
        entries.push({
            id: entryId,
            relativePath: hasRelativePath ? rawEntry.relativePath.replace(/^\s+|\s+$/g, "") : "",
            absolutePath: hasAbsolutePath ? rawEntry.absolutePath.replace(/^\s+|\s+$/g, "") : ""
        });
    }

    return entries;
};

ToolkitHostBootstrap._loadRegistryEntries = function (rootFolder, registryFilePath, loadedFiles) {
    var registryFile = registryFilePath
        ? new File(registryFilePath)
        : new File(rootFolder.fsName + "/../.generated/module_registry.jsx");
    var entries;

    if (!registryFile.exists) {
        throw new Error("Toolkit module registry missing: " + registryFile.fsName);
    }

    $.global.ToolkitGeneratedModuleRegistry = [];
    ToolkitHostBootstrap._evalFile(registryFile, loadedFiles);
    entries = ToolkitHostBootstrap._normalizeRegistryEntries(
        $.global.ToolkitGeneratedModuleRegistry,
        "Toolkit module registry"
    );

    return {
        file: registryFile,
        entries: entries
    };
};

ToolkitHostBootstrap._quarantineModule = function (runtimeState, entryId, reason) {
    delete $.global.ToolkitModules[entryId];
    delete runtimeState.loadedById[entryId];
    runtimeState.quarantinedById[entryId] = reason;
};

ToolkitHostBootstrap._markModuleLoaded = function (runtimeState, entryId) {
    delete runtimeState.quarantinedById[entryId];
    runtimeState.loadedById[entryId] = true;
};

ToolkitHostBootstrap._loadModuleEntry = function (rootFolder, runtimeState, entry) {
    var file;
    var handler;

    delete $.global.ToolkitModules[entry.id];

    try {
        file = ToolkitHostBootstrap._resolveAnyFile(rootFolder, entry);
        ToolkitHostBootstrap._evalFile(file, runtimeState.loadedFiles);
        handler = $.global.ToolkitModules[entry.id];

        if (typeof handler !== "function") {
            ToolkitHostBootstrap._quarantineModule(
                runtimeState,
                entry.id,
                'Toolkit module "' + entry.id + '" did not register a handler'
            );
            return;
        }

        ToolkitHostBootstrap._markModuleLoaded(runtimeState, entry.id);
    } catch (error) {
        ToolkitHostBootstrap._quarantineModule(
            runtimeState,
            entry.id,
            error && error.message ? error.message : 'Toolkit module "' + entry.id + '" failed to load'
        );
    }
};

ToolkitHostBootstrap._publishRuntimeMeta = function (runtimeState) {
    var loadedModules = [];
    var quarantinedModules = [];
    var commandId;
    var runtimeMeta;
    var compareById = function (left, right) {
        if (left.id < right.id) {
            return -1;
        }
        if (left.id > right.id) {
            return 1;
        }
        return 0;
    };

    for (commandId in runtimeState.loadedById) {
        if (runtimeState.loadedById.hasOwnProperty(commandId)) {
            loadedModules.push({ id: commandId });
        }
    }

    for (commandId in runtimeState.quarantinedById) {
        if (runtimeState.quarantinedById.hasOwnProperty(commandId)) {
            quarantinedModules.push({
                id: commandId,
                reason: runtimeState.quarantinedById[commandId]
            });
        }
    }

    loadedModules.sort(compareById);
    quarantinedModules.sort(compareById);

    runtimeMeta = {
        loadedAtMs: (new Date()).getTime(),
        loadedModules: loadedModules,
        quarantinedModules: quarantinedModules,
        moduleCount: runtimeState.registryEntries.length,
        quarantinedCount: quarantinedModules.length
    };

    $.global.__TOOLKIT_HOST_RUNTIME_STATE__ = runtimeState;
    $.global.__TOOLKIT_HOST_RUNTIME__ = runtimeMeta;

    return runtimeMeta;
};

ToolkitHostBootstrap.inspect = function () {
    return $.global.__TOOLKIT_HOST_RUNTIME__ || ToolkitHostBootstrap._createEmptyRuntimeMeta();
};

ToolkitHostBootstrap.getRuntimeMeta = ToolkitHostBootstrap.inspect;

ToolkitHostBootstrap.load = function (optionsOrPayload, jsxRootPathOverride) {
    var jsxRootPath = jsxRootPathOverride || (optionsOrPayload && optionsOrPayload.jsxRootPath ? optionsOrPayload.jsxRootPath : "");
    var rootFolder = ToolkitHostBootstrap._resolveRootFolder(jsxRootPath);
    var runtimeState;
    var registryResult;
    var index;
    var options;

    ToolkitHostBootstrap._resetRuntimeState();
    runtimeState = $.global.__TOOLKIT_HOST_RUNTIME_STATE__;

    ToolkitHostBootstrap._evalRelative(rootFolder, "utils.jsx", runtimeState.loadedFiles);
    options = ToolkitHostBootstrap._normalizeLoadOptions(optionsOrPayload);
    options.jsxRootPath = rootFolder.fsName;
    registryResult = ToolkitHostBootstrap._loadRegistryEntries(
        rootFolder,
        options && options.registryFilePath ? options.registryFilePath : "",
        runtimeState.loadedFiles
    );
    runtimeState.registryEntries = registryResult.entries;
    runtimeState.registrySourcePath = registryResult.file.fsName;
    ToolkitHostBootstrap._evalRelative(rootFolder, "../.generated/module_dispatch.jsx", runtimeState.loadedFiles);
    ToolkitHostBootstrap._evalRelative(rootFolder, "runtime/toolkitBridgeRuntime.jsx", runtimeState.loadedFiles);

    for (index = 0; index < runtimeState.registryEntries.length; index += 1) {
        ToolkitHostBootstrap._loadModuleEntry(rootFolder, runtimeState, runtimeState.registryEntries[index]);
    }

    ToolkitHostBootstrap._publishRuntimeMeta(runtimeState);
    $.writeln("Toolkit host runtime loaded");
    return "TOOLKIT_HOST_RUNTIME_LOADED";
};
