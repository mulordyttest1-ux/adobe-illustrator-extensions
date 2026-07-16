if (typeof ToolkitBridge === "undefined") {
    ToolkitBridge = {};
}

ToolkitBridge._fixtureDocumentNames = [];

ToolkitBridge._encodeResponse = function (payload) {
    var encoder = $.global.Base64;
    if (!encoder || typeof encoder.encode !== "function") {
        throw new Error("Base64 encoder unavailable");
    }

    return encoder.encode(JSON.stringify(payload));
};

ToolkitBridge._success = function (message, data) {
    return {
        success: true,
        message: message || "",
        errorCode: null,
        data: typeof data === "undefined" ? null : data
    };
};

ToolkitBridge._failure = function (message, errorCode) {
    return {
        success: false,
        message: message || "Toolkit host error",
        errorCode: errorCode || "TOOLKIT_HOST_ERROR",
        data: null
    };
};

ToolkitBridge._parsePayload = function (payloadJson) {
    if (!payloadJson) {
        return {};
    }

    return JSON.parse(payloadJson);
};

ToolkitBridge._selectionCount = function () {
    if (!app.documents.length || !app.activeDocument || !app.activeDocument.selection) {
        return 0;
    }

    return app.activeDocument.selection.length;
};

ToolkitBridge._closeFixtureDocuments = function () {
    var closedCount = 0;
    var index;
    var documentRef;
    var trackedNames = {};
    var nameIndex;

    for (nameIndex = 0; nameIndex < ToolkitBridge._fixtureDocumentNames.length; nameIndex += 1) {
        trackedNames[ToolkitBridge._fixtureDocumentNames[nameIndex]] = true;
    }

    for (index = app.documents.length - 1; index >= 0; index -= 1) {
        documentRef = app.documents[index];
        if (trackedNames[documentRef.name]) {
            documentRef.close(SaveOptions.DONOTSAVECHANGES);
            closedCount += 1;
        }
    }

    ToolkitBridge._fixtureDocumentNames = [];

    return closedCount;
};

ToolkitBridge.ping = function () {
    return ToolkitBridge._encodeResponse(
        ToolkitBridge._success("Pong", {
            appName: app.name,
            documentCount: app.documents.length
        })
    );
};

ToolkitBridge.inspectContext = function () {
    var hasActiveDocument = app.documents.length > 0;
    var activeDocumentName = hasActiveDocument && app.activeDocument ? app.activeDocument.name : "";

    return ToolkitBridge._encodeResponse(
        ToolkitBridge._success("Execution context ready.", {
            hasActiveDocument: hasActiveDocument,
            selectionCount: ToolkitBridge._selectionCount(),
            activeDocumentName: activeDocumentName
        })
    );
};

ToolkitBridge.inspectRuntime = function () {
    var runtimeMeta = null;

    try {
        if (typeof ToolkitHostRuntime !== "undefined" && typeof ToolkitHostRuntime.inspect === "function") {
            runtimeMeta = ToolkitHostRuntime.inspect();
        } else if (typeof ToolkitHostBootstrap !== "undefined" && typeof ToolkitHostBootstrap.getRuntimeMeta === "function") {
            runtimeMeta = ToolkitHostBootstrap.getRuntimeMeta();
        }
    } catch (error) {
        return ToolkitBridge._encodeResponse(
            ToolkitBridge._failure(
                error && error.message ? error.message : "Toolkit host runtime inspect failed",
                "TOOLKIT_HOST_RUNTIME_INSPECT_FAILED"
            )
        );
    }

    return ToolkitBridge._encodeResponse(
        ToolkitBridge._success("Toolkit host runtime ready.", runtimeMeta)
    );
};

ToolkitBridge.runCommand = function (payloadJson) {
    try {
        var request = ToolkitBridge._parsePayload(payloadJson);
        if (!request || !request.id) {
            return ToolkitBridge._encodeResponse(
                ToolkitBridge._failure("Toolkit command id is required.", "INVALID_TOOLKIT_REQUEST")
            );
        }

        return ToolkitBridge._encodeResponse(
            ToolkitModuleDispatch.run(request.id, request.payload || {})
        );
    } catch (error) {
        return ToolkitBridge._encodeResponse(
            ToolkitBridge._failure(
                error && error.message ? error.message : "Toolkit command failed",
                "TOOLKIT_HOST_EXCEPTION"
            )
        );
    }
};

ToolkitBridge.debugPrepareSelectionFixture = function (payloadJson) {
    var step = "start";
    try {
        step = "parse-payload";
        var payload = ToolkitBridge._parsePayload(payloadJson);
        var withSelection = payload && payload.withSelection === true;

        step = "close-existing";
        ToolkitBridge._closeFixtureDocuments();

        step = "create-document";
        var documentRef = app.documents.add();
        step = "create-rectangle";
        var item = documentRef.pathItems.rectangle(400, 100, 120, 80);
        step = "style-item";
        item.filled = false;
        item.stroked = true;
        step = "clear-selection";
        documentRef.selection = null;
        if (withSelection) {
            step = "apply-selection";
            item.selected = true;
            documentRef.selection = [item];
        }
        step = "track-document";
        ToolkitBridge._fixtureDocumentNames.push(documentRef.name);
        try {
            step = "activate-document";
            if (typeof documentRef.activate === "function") {
                documentRef.activate();
            }
        } catch (activateError) { }
        try {
            step = "redraw";
            app.redraw();
        } catch (redrawError) { }
        step = "success";

        return ToolkitBridge._encodeResponse(
            ToolkitBridge._success("Fixture prepared.", {
                withSelection: withSelection,
                selectionCount: documentRef.selection ? documentRef.selection.length : 0,
                documentName: documentRef.name
            })
        );
    } catch (error) {
        return ToolkitBridge._encodeResponse(
            ToolkitBridge._failure(
                (error && error.message ? error.message : "Fixture setup failed") + " [step=" + step + "]",
                "TOOLKIT_FIXTURE_SETUP_FAILED"
            )
        );
    }
};

ToolkitBridge.debugCloseSelectionFixture = function () {
    try {
        var closedCount = ToolkitBridge._closeFixtureDocuments();
        return ToolkitBridge._encodeResponse(
            ToolkitBridge._success("Fixture documents closed.", {
                closedCount: closedCount
            })
        );
    } catch (error) {
        return ToolkitBridge._encodeResponse(
            ToolkitBridge._failure(
                error && error.message ? error.message : "Fixture cleanup failed",
                "TOOLKIT_FIXTURE_CLEANUP_FAILED"
            )
        );
    }
};

$.writeln("Toolkit host runtime ready");
