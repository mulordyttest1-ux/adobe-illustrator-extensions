if (typeof $.global.SymbolHostValidation === "undefined") {
    $.global.SymbolHostValidation = {};
}

$.global.SymbolHostValidation._encodeResult = function (obj) {
    return Base64.encode(JSON.stringify(obj));
};

$.global.SymbolHostValidation._decodeBridgePayload = function (payload) {
    try {
        return JSON.parse(Base64.decode(payload));
    } catch (e) {
        return {
            success: false,
            error: "Invalid bridge payload: " + e.message,
            raw: payload
        };
    }
};

$.global.SymbolHostValidation._collectSelection = function (doc) {
    var selection = doc.selection || [];
    var typenames = [];
    var names = [];
    var i;

    for (i = 0; i < selection.length; i++) {
        typenames.push(selection[i].typename || "Unknown");
        names.push(selection[i].name || "");
    }

    return {
        selectionCount: selection.length,
        selectedTypenames: typenames,
        selectedNames: names
    };
};

$.global.SymbolHostValidation._snapshot = function (doc, groupName) {
    var snap = $.global.SymbolHostValidation._collectSelection(doc);
    snap.tempGroupExists = !!$.global.Bridge._findGroupByName(doc, groupName);
    return snap;
};

$.global.SymbolHostValidation._arraysEqual = function (a, b) {
    var i;
    if (!a || !b || a.length !== b.length) {
        return false;
    }

    for (i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

$.global.SymbolHostValidation._selectionEqual = function (before, after) {
    return before.selectionCount === after.selectionCount &&
        $.global.SymbolHostValidation._arraysEqual(before.selectedTypenames, after.selectedTypenames) &&
        $.global.SymbolHostValidation._arraysEqual(before.selectedNames, after.selectedNames);
};

$.global.SymbolHostValidation._selectOnly = function (doc, items) {
    var i;

    try {
        doc.activate();
    } catch (activateError) { }

    doc.selection = null;

    for (i = 0; i < items.length; i++) {
        items[i].selected = true;
    }

    doc.selection = items;
    try {
        app.redraw();
    } catch (redrawError) { }
};

$.global.SymbolHostValidation._createFixture = function () {
    var doc = app.documents.add();
    var itemA = doc.pathItems.rectangle(500, 100, 80, 60);
    var itemB = doc.pathItems.rectangle(500, 240, 80, 60);
    var outsider = doc.pathItems.rectangle(360, 420, 70, 50);

    itemA.name = "host_validation_item_a";
    itemB.name = "host_validation_item_b";
    outsider.name = "host_validation_outsider";

    itemA.stroked = true;
    itemA.filled = false;
    itemB.stroked = true;
    itemB.filled = false;
    outsider.stroked = true;
    outsider.filled = false;

    return {
        doc: doc,
        looseItems: [itemA, itemB],
        outsider: outsider
    };
};

$.global.SymbolHostValidation._closeFixture = function (doc) {
    if (!doc) {
        return;
    }

    try {
        doc.close(SaveOptions.DONOTSAVECHANGES);
    } catch (closeErr) {
        try {
            doc.close();
        } catch (ignoreErr) { }
    }
};

$.global.SymbolHostValidation._makeCMYKColor = function (c, m, y, k) {
    var color = new CMYKColor();
    color.cyan = c;
    color.magenta = m;
    color.yellow = y;
    color.black = k;
    return color;
};

$.global.SymbolHostValidation._createCompoundPath = function (doc, left, top, color, name) {
    var outer = doc.pathItems.rectangle(top, left, 90, 70);
    var inner = doc.pathItems.rectangle(top - 15, left + 18, 54, 32);
    var compound = null;

    outer.name = name + "_outer";
    inner.name = name + "_inner";

    outer.filled = true;
    outer.stroked = true;
    inner.filled = true;
    inner.stroked = true;

    outer.fillColor = color;
    outer.strokeColor = color;
    inner.fillColor = color;
    inner.strokeColor = color;

    $.global.SymbolHostValidation._selectOnly(doc, [outer, inner]);
    app.executeMenuCommand("compoundPath");

    if (doc.selection && doc.selection.length) {
        compound = doc.selection[0];
    }

    if (compound) {
        compound.name = name;
    }

    doc.selection = null;
    return compound;
};

$.global.SymbolHostValidation._snapshotColor = function (color) {
    if (!color) {
        return null;
    }

    if (color.typename === "CMYKColor") {
        return {
            typename: color.typename,
            cyan: color.cyan,
            magenta: color.magenta,
            yellow: color.yellow,
            black: color.black
        };
    }

    if (color.typename === "GrayColor") {
        return {
            typename: color.typename,
            gray: color.gray
        };
    }

    if (color.typename === "RGBColor") {
        return {
            typename: color.typename,
            red: color.red,
            green: color.green,
            blue: color.blue
        };
    }

    if (color.typename === "SpotColor") {
        return {
            typename: color.typename,
            tint: color.tint
        };
    }

    return {
        typename: color.typename || "Unknown"
    };
};

$.global.SymbolHostValidation._snapshotPathAppearance = function (pathItem) {
    return {
        name: pathItem.name || "",
        filled: !!pathItem.filled,
        stroked: !!pathItem.stroked,
        fillColor: $.global.SymbolHostValidation._snapshotColor(pathItem.fillColor),
        strokeColor: $.global.SymbolHostValidation._snapshotColor(pathItem.strokeColor)
    };
};

$.global.SymbolHostValidation._collectItemPathSnapshots = function (item, bucket) {
    var i;
    var pathItems;

    if (!item) {
        return;
    }

    if (item.typename === "PathItem") {
        bucket.push($.global.SymbolHostValidation._snapshotPathAppearance(item));
        return;
    }

    if (item.typename === "GroupItem") {
        for (i = 0; i < item.pageItems.length; i++) {
            $.global.SymbolHostValidation._collectItemPathSnapshots(item.pageItems[i], bucket);
        }
        return;
    }

    if (item.typename === "CompoundPathItem") {
        try {
            pathItems = item.pathItems;
        } catch (pathItemsError) {
            pathItems = null;
        }

        if (pathItems && pathItems.length) {
            for (i = 0; i < pathItems.length; i++) {
                bucket.push($.global.SymbolHostValidation._snapshotPathAppearance(pathItems[i]));
            }
        }
    }
};

$.global.SymbolHostValidation._snapshotItemPaths = function (item) {
    var bucket = [];
    $.global.SymbolHostValidation._collectItemPathSnapshots(item, bucket);
    return bucket;
};

$.global.SymbolHostValidation._snapshotTextAppearance = function (textFrame) {
    var attributes = null;

    try {
        attributes = textFrame.textRange.characterAttributes;
    } catch (attributesError) {
        attributes = null;
    }

    if (!attributes) {
        return null;
    }

    return {
        name: textFrame.name || "",
        fillColor: $.global.SymbolHostValidation._snapshotColor(attributes.fillColor),
        strokeColor: $.global.SymbolHostValidation._snapshotColor(attributes.strokeColor)
    };
};

$.global.SymbolHostValidation._itemHasAncestor = function (item, ancestor) {
    var current = item;

    while (current) {
        if (current === ancestor) {
            return true;
        }

        try {
            current = current.parent;
        } catch (parentError) {
            current = null;
        }
    }

    return false;
};

$.global.SymbolHostValidation._collectScopedPathSnapshots = function (doc, scopeRoot) {
    var bucket = [];
    var pathItems;
    var i;

    if (!doc || !doc.pathItems || !scopeRoot) {
        return bucket;
    }

    pathItems = doc.pathItems;

    for (i = 0; i < pathItems.length; i++) {
        if ($.global.SymbolHostValidation._itemHasAncestor(pathItems[i], scopeRoot)) {
            bucket.push($.global.SymbolHostValidation._snapshotPathAppearance(pathItems[i]));
        }
    }

    return bucket;
};

$.global.SymbolHostValidation._countScopedPathItems = function (doc, scopeRoot) {
    return $.global.SymbolHostValidation._collectScopedPathSnapshots(doc, scopeRoot).length;
};

$.global.SymbolHostValidation._findGroupByName = function (doc, name) {
    var groupItems;
    var i;

    if (!doc || !doc.groupItems || !name) {
        return null;
    }

    groupItems = doc.groupItems;

    for (i = 0; i < groupItems.length; i++) {
        if ((groupItems[i].name || "") === name) {
            return groupItems[i];
        }
    }

    return null;
};

$.global.SymbolHostValidation._createTextFrame = function (group, name, contents, fillColor, strokeColor, position) {
    var textFrame = group.textFrames.add();
    var attributes;

    textFrame.name = name;
    textFrame.contents = contents;
    textFrame.position = position || [120, 520];

    attributes = textFrame.textRange.characterAttributes;
    attributes.size = 18;
    attributes.fillColor = fillColor;
    try {
        if (strokeColor) {
            attributes.strokeColor = strokeColor;
        }
    } catch (strokeError) {}

    return textFrame;
};

$.global.SymbolHostValidation._runSelectionClearedScenario = function () {
    var fixture = null;
    var doc = null;
    var autoGroupResult;
    var autoGroupName;
    var before;
    var preRestore;
    var restore;
    var after;

    try {
        if (typeof $.global.Bridge === "undefined") {
            return { success: false, error: "Bridge unavailable" };
        }

        fixture = $.global.SymbolHostValidation._createFixture();
        doc = fixture.doc;

        $.global.SymbolHostValidation._selectOnly(doc, fixture.looseItems);
        autoGroupResult = $.global.Bridge._autoGroupSelection(doc);
        if (!autoGroupResult.success) {
            return { success: false, error: autoGroupResult.error };
        }

        autoGroupName = autoGroupResult.autoGroupName;
        before = $.global.SymbolHostValidation._snapshot(doc, autoGroupName);

        doc.selection = null;
        preRestore = $.global.SymbolHostValidation._collectSelection(doc);

        restore = $.global.SymbolHostValidation._decodeBridgePayload(
            $.global.Bridge.ungroupAutoGrouped(Base64.encode(autoGroupName))
        );
        after = $.global.SymbolHostValidation._snapshot(doc, autoGroupName);

        return {
            success: true,
            scenario: "selection_cleared",
            autoGroupName: autoGroupName,
            before: before,
            preRestore: preRestore,
            after: after,
            restore: restore
        };
    } catch (e) {
        return {
            success: false,
            scenario: "selection_cleared",
            error: e.message
        };
    } finally {
        $.global.SymbolHostValidation._closeFixture(doc);
    }
};

$.global.SymbolHostValidation._runMissingGroupScenario = function () {
    var fixture = null;
    var doc = null;
    var autoGroupResult;
    var autoGroupName;
    var before;
    var beforeFailure;
    var restore;
    var after;
    var fakeGroupName;

    try {
        if (typeof $.global.Bridge === "undefined") {
            return { success: false, error: "Bridge unavailable" };
        }

        fixture = $.global.SymbolHostValidation._createFixture();
        doc = fixture.doc;

        $.global.SymbolHostValidation._selectOnly(doc, fixture.looseItems);
        autoGroupResult = $.global.Bridge._autoGroupSelection(doc);
        if (!autoGroupResult.success) {
            return { success: false, error: autoGroupResult.error };
        }

        autoGroupName = autoGroupResult.autoGroupName;
        before = $.global.SymbolHostValidation._snapshot(doc, autoGroupName);

        $.global.SymbolHostValidation._selectOnly(doc, [fixture.outsider]);
        beforeFailure = $.global.SymbolHostValidation._collectSelection(doc);
        fakeGroupName = autoGroupName + "_missing";

        restore = $.global.SymbolHostValidation._decodeBridgePayload(
            $.global.Bridge.ungroupAutoGrouped(Base64.encode(fakeGroupName))
        );
        after = $.global.SymbolHostValidation._snapshot(doc, autoGroupName);

        return {
            success: true,
            scenario: "missing_group",
            autoGroupName: autoGroupName,
            fakeGroupName: fakeGroupName,
            before: before,
            beforeFailure: beforeFailure,
            after: after,
            restore: restore,
            selectionUntouchedOnFailure: $.global.SymbolHostValidation._selectionEqual(beforeFailure, after)
        };
    } catch (e) {
        return {
            success: false,
            scenario: "missing_group",
            error: e.message
        };
    } finally {
        $.global.SymbolHostValidation._closeFixture(doc);
    }
};

$.global.SymbolHostValidation._runBorderZeroOffsetScenario = function () {
    var fixture = null;
    var doc = null;
    var container;
    var moduleRef;
    var border = null;
    var i;

    try {
        fixture = $.global.SymbolHostValidation._createFixture();
        doc = fixture.doc;
        container = doc.groupItems.add();
        container.name = "border_zero_offset_fixture";

        if (!$._imposition || !$._imposition.modules || !$._imposition.modules.yield_guides) {
            return { success: false, error: "yield_guides module unavailable" };
        }

        moduleRef = $._imposition.modules.yield_guides;
        moduleRef.draw(container, {
            finish: { w: 200, h: 100 },
            print: { w: 200, h: 100 },
            yieldPadding: { top: 0, left: 0, right: 0, bottom: 0 },
            rules: [
                {
                    id: "safe_top",
                    edge: "top",
                    val: 0,
                    drawBorder: true,
                    borderStyle: "dashed"
                }
            ]
        });

        for (i = 0; i < container.pathItems.length; i++) {
            if (container.pathItems[i].name === "Border_safe_top") {
                border = container.pathItems[i];
                break;
            }
        }

        return {
            success: true,
            scenario: "border_zero_offset",
            borderFound: !!border,
            borderGuides: border ? !!border.guides : null,
            borderDashed: border ? !!(border.strokeDashes && border.strokeDashes.length) : null
        };
    } catch (e) {
        return {
            success: false,
            scenario: "border_zero_offset",
            error: e.message
        };
    } finally {
        $.global.SymbolHostValidation._closeFixture(doc);
    }
};

$.global.SymbolHostValidation._runSingleEdgeBorderScenario = function () {
    var fixture = null;
    var doc = null;
    var symbolModule;
    var container;
    var pathNames = [];
    var borderNames = [];
    var i;

    try {
        fixture = $.global.SymbolHostValidation._createFixture();
        doc = fixture.doc;

        if (!$._imposition || !$._imposition.modules || !$._imposition.modules.symbol) {
            return { success: false, error: "symbol module unavailable" };
        }

        symbolModule = $._imposition.modules.symbol;
        container = symbolModule.run(doc, fixture.looseItems[0], {
            finish: { w: 200, h: 100 },
            print: { w: 200, h: 90 },
            yieldPadding: { top: 10, left: 0, right: 0, bottom: 0 },
            rules: [
                {
                    id: "safe_top",
                    edge: "top",
                    val: 10,
                    drawBorder: true,
                    borderStyle: "dashed"
                }
            ],
            isAutoSize: true
        }, "single_edge_border", false);

        if (!container) {
            return { success: false, error: "symbol module did not return container" };
        }

        for (i = 0; i < container.pathItems.length; i++) {
            pathNames.push(container.pathItems[i].name || "");
            if ((container.pathItems[i].name || "").indexOf("Border_") === 0) {
                borderNames.push(container.pathItems[i].name);
            }
        }

        return {
            success: true,
            scenario: "single_edge_border",
            pathNames: pathNames,
            borderNames: borderNames
        };
    } catch (e) {
        return {
            success: false,
            scenario: "single_edge_border",
            error: e.message
        };
    } finally {
        $.global.SymbolHostValidation._closeFixture(doc);
    }
};

$.global.SymbolHostValidation._runK100CompoundScenario = function () {
    var doc = null;
    var autoGroupResult;
    var autoGroupName;
    var autoGroup;
    var groupedContainer;
    var darkCompound;
    var lightCompound;
    var groupedCompound;
    var regularPath;
    var darkColor;
    var groupedDarkColor;
    var lightColor;
    var moduleRef;
    var before;
    var after;
    var metrics;

    try {
        doc = app.documents.add(DocumentColorSpace.CMYK);
        darkColor = $.global.SymbolHostValidation._makeCMYKColor(0, 45, 45, 45);
        groupedDarkColor = $.global.SymbolHostValidation._makeCMYKColor(0, 30, 30, 70);
        lightColor = $.global.SymbolHostValidation._makeCMYKColor(0, 0, 0, 0);

        darkCompound = $.global.SymbolHostValidation._createCompoundPath(
            doc,
            70,
            600,
            darkColor,
            "dark_compound"
        );
        lightCompound = $.global.SymbolHostValidation._createCompoundPath(
            doc,
            220,
            600,
            lightColor,
            "light_compound"
        );
        groupedCompound = $.global.SymbolHostValidation._createCompoundPath(
            doc,
            370,
            600,
            groupedDarkColor,
            "grouped_compound"
        );

        regularPath = doc.pathItems.rectangle(600, 520, 90, 70);
        regularPath.name = "regular_dark_path";
        regularPath.filled = true;
        regularPath.stroked = true;
        regularPath.fillColor = $.global.SymbolHostValidation._makeCMYKColor(0, 60, 60, 30);
        regularPath.strokeColor = $.global.SymbolHostValidation._makeCMYKColor(0, 60, 60, 30);

        if (!darkCompound || !lightCompound || !groupedCompound) {
            return { success: false, error: "Failed to create compound fixture" };
        }

        groupedContainer = doc.groupItems.add();
        groupedContainer.name = "grouped_compound_container";
        groupedCompound.move(groupedContainer, ElementPlacement.PLACEATBEGINNING);

        autoGroup = doc.groupItems.add();
        autoGroup.name = "k100_validation_scope";
        darkCompound.move(autoGroup, ElementPlacement.PLACEATBEGINNING);
        lightCompound.move(autoGroup, ElementPlacement.PLACEATBEGINNING);
        groupedContainer.move(autoGroup, ElementPlacement.PLACEATBEGINNING);
        regularPath.move(autoGroup, ElementPlacement.PLACEATBEGINNING);

        if (!$._imposition || !$._imposition.modules || !$._imposition.modules.color) {
            return { success: false, error: "color module unavailable" };
        }

        before = {
            darkCompound: $.global.SymbolHostValidation._snapshotItemPaths(darkCompound),
            lightCompound: $.global.SymbolHostValidation._snapshotItemPaths(lightCompound),
            groupedCompound: $.global.SymbolHostValidation._snapshotItemPaths(groupedContainer),
            regularPath: $.global.SymbolHostValidation._snapshotItemPaths(regularPath)
        };

        moduleRef = $._imposition.modules.color;
        moduleRef._lastMetrics = null;
        moduleRef.run(autoGroup);
        metrics = moduleRef._lastMetrics || null;

        after = {
            darkCompound: $.global.SymbolHostValidation._snapshotItemPaths(darkCompound),
            lightCompound: $.global.SymbolHostValidation._snapshotItemPaths(lightCompound),
            groupedCompound: $.global.SymbolHostValidation._snapshotItemPaths(groupedContainer),
            regularPath: $.global.SymbolHostValidation._snapshotItemPaths(regularPath)
        };

        return {
            success: true,
            scenario: "k100_compound",
            before: before,
            after: after,
            metrics: metrics
        };
    } catch (e) {
        return {
            success: false,
            scenario: "k100_compound",
            error: e.message
        };
    } finally {
        $.global.SymbolHostValidation._closeFixture(doc);
    }
};

$.global.SymbolHostValidation._runK100PipelineOrderScenario = function () {
    var doc = null;
    var autoGroupResult;
    var autoGroupName;
    var root;
    var groupedContainer;
    var darkTextContainer;
    var darkCompound;
    var lightCompound;
    var groupedCompound;
    var regularPath;
    var darkColor;
    var groupedDarkColor;
    var lightColor;
    var moduleRef;
    var cleanupModule;
    var before;
    var afterOutlineTextPaths;
    var afterK100;
    var afterK100TextPaths;
    var afterCleanupTextPaths;
    var afterCleanupIssues;
    var beforeOutlinePathCount;
    var k100InputPathCount;
    var postCleanupPathCount;
    var metrics;
    var step = "init";

    function isK100Color(color) {
        return !!color &&
            color.typename === "CMYKColor" &&
            Math.abs(Number(color.cyan || 0)) < 0.01 &&
            Math.abs(Number(color.magenta || 0)) < 0.01 &&
            Math.abs(Number(color.yellow || 0)) < 0.01 &&
            Math.abs(Number(color.black || 0) - 100) < 0.01;
    }

    function collectNonLightNonK100(scopeRoot, bucket) {
        var pathItems;
        var pathItem;
        var i;

        if (!doc || !doc.pathItems || !scopeRoot || !moduleRef) {
            return;
        }

        pathItems = doc.pathItems;
        for (i = 0; i < pathItems.length; i++) {
            pathItem = pathItems[i];
            if (!$.global.SymbolHostValidation._itemHasAncestor(pathItem, scopeRoot)) {
                continue;
            }

            try {
                if (pathItem.filled && !moduleRef.isLightColor(pathItem.fillColor) && !isK100Color(pathItem.fillColor)) {
                    bucket.push({
                        kind: "fill",
                        name: pathItem.name || "",
                        color: $.global.SymbolHostValidation._snapshotColor(pathItem.fillColor)
                    });
                }
            } catch (fillError) { }

            try {
                if (pathItem.stroked && !moduleRef.isLightColor(pathItem.strokeColor) && !isK100Color(pathItem.strokeColor)) {
                    bucket.push({
                        kind: "stroke",
                        name: pathItem.name || "",
                        color: $.global.SymbolHostValidation._snapshotColor(pathItem.strokeColor)
                    });
                }
            } catch (strokeError) { }
        }
    }

    try {
        step = "create_document";
        doc = app.documents.add(DocumentColorSpace.CMYK);

        step = "prepare_colors";
        darkColor = $.global.SymbolHostValidation._makeCMYKColor(0, 45, 45, 45);
        groupedDarkColor = $.global.SymbolHostValidation._makeCMYKColor(0, 30, 30, 70);
        lightColor = $.global.SymbolHostValidation._makeCMYKColor(0, 0, 0, 0);

        step = "create_compounds";
        darkCompound = $.global.SymbolHostValidation._createCompoundPath(
            doc,
            70,
            600,
            darkColor,
            "pipeline_dark_compound"
        );
        lightCompound = $.global.SymbolHostValidation._createCompoundPath(
            doc,
            220,
            600,
            lightColor,
            "pipeline_light_compound"
        );
        groupedCompound = $.global.SymbolHostValidation._createCompoundPath(
            doc,
            370,
            600,
            groupedDarkColor,
            "pipeline_grouped_compound"
        );

        regularPath = doc.pathItems.rectangle(600, 520, 90, 70);
        regularPath.name = "pipeline_regular_dark_path";
        regularPath.filled = true;
        regularPath.stroked = true;
        regularPath.fillColor = $.global.SymbolHostValidation._makeCMYKColor(0, 60, 60, 30);
        regularPath.strokeColor = $.global.SymbolHostValidation._makeCMYKColor(0, 60, 60, 30);

        if (!darkCompound || !lightCompound || !groupedCompound) {
            return { success: false, error: "Failed to create pipeline-order compound fixture" };
        }

        step = "create_grouped_compound_container";
        groupedContainer = doc.groupItems.add();
        groupedContainer.name = "pipeline_grouped_compound_container";
        groupedCompound.move(groupedContainer, ElementPlacement.PLACEATBEGINNING);

        step = "create_text_fixture";
        darkTextContainer = doc.groupItems.add();
        darkTextContainer.name = "pipeline_dark_text_container";
        $.global.SymbolHostValidation._createTextFrame(
            darkTextContainer,
            "pipeline_dark_text",
            "K100",
            $.global.SymbolHostValidation._makeCMYKColor(0, 100, 100, 0),
            null,
            [180, 470]
        );

        if (!$._imposition || !$._imposition.modules) {
            return { success: false, error: "Imposition modules unavailable" };
        }
        moduleRef = $._imposition.modules.color;
        cleanupModule = $._imposition.modules.cleanup;

        if (!moduleRef) {
            return { success: false, error: "color module unavailable" };
        }
        if (!cleanupModule || typeof cleanupModule.outlineTextOnly !== "function") {
            return { success: false, error: "cleanup outlineTextOnly unavailable" };
        }

        step = "create_selection_scope";
        root = doc.groupItems.add();
        root.name = "k100_pipeline_validation_scope";
        darkCompound.move(root, ElementPlacement.PLACEATBEGINNING);
        lightCompound.move(root, ElementPlacement.PLACEATBEGINNING);
        groupedContainer.move(root, ElementPlacement.PLACEATBEGINNING);
        regularPath.move(root, ElementPlacement.PLACEATBEGINNING);
        darkTextContainer.move(root, ElementPlacement.PLACEATBEGINNING);

        before = {
            darkCompound: $.global.SymbolHostValidation._snapshotItemPaths(darkCompound),
            lightCompound: $.global.SymbolHostValidation._snapshotItemPaths(lightCompound),
            groupedCompound: $.global.SymbolHostValidation._snapshotItemPaths(groupedContainer),
            regularPath: $.global.SymbolHostValidation._snapshotItemPaths(regularPath)
        };

        step = "count_before_outline";
        beforeOutlinePathCount = $.global.SymbolHostValidation._countScopedPathItems(doc, root);

        step = "outline_text_only";
        cleanupModule.outlineTextOnly(root);
        k100InputPathCount = $.global.SymbolHostValidation._countScopedPathItems(doc, root);
        afterOutlineTextPaths = $.global.SymbolHostValidation._collectScopedPathSnapshots(
            doc,
            $.global.SymbolHostValidation._findGroupByName(doc, "pipeline_dark_text_container") || darkTextContainer
        );

        step = "run_k100";
        moduleRef._lastMetrics = null;
        moduleRef.run(root);
        metrics = moduleRef._lastMetrics || null;
        afterK100TextPaths = $.global.SymbolHostValidation._collectScopedPathSnapshots(
            doc,
            $.global.SymbolHostValidation._findGroupByName(doc, "pipeline_dark_text_container") || darkTextContainer
        );

        afterK100 = {
            darkCompound: $.global.SymbolHostValidation._snapshotItemPaths(darkCompound),
            lightCompound: $.global.SymbolHostValidation._snapshotItemPaths(lightCompound),
            groupedCompound: $.global.SymbolHostValidation._snapshotItemPaths(groupedContainer),
            regularPath: $.global.SymbolHostValidation._snapshotItemPaths(regularPath),
            outlinedTextPaths: afterK100TextPaths
        };

        step = "run_cleanup";
        cleanupModule.run(root);

        step = "snapshot_after_cleanup";
        postCleanupPathCount = $.global.SymbolHostValidation._countScopedPathItems(doc, root);
        afterCleanupTextPaths = $.global.SymbolHostValidation._collectScopedPathSnapshots(
            doc,
            $.global.SymbolHostValidation._findGroupByName(doc, "pipeline_dark_text_container") || darkTextContainer
        );
        afterCleanupIssues = [];
        collectNonLightNonK100(root, afterCleanupIssues);

        return {
            success: true,
            scenario: "k100_pipeline_order",
            stageOrder: ["outlineTextOnly", "k100", "cleanup"],
            before: before,
            beforeOutlinePathCount: beforeOutlinePathCount,
            k100InputPathCount: k100InputPathCount,
            postCleanupPathCount: postCleanupPathCount,
            afterOutlineTextPaths: afterOutlineTextPaths,
            afterK100: afterK100,
            afterCleanupTextPaths: afterCleanupTextPaths,
            afterCleanupIssues: afterCleanupIssues,
            metrics: metrics
        };
    } catch (e) {
        return {
            success: false,
            scenario: "k100_pipeline_order",
            error: step + ": " + e.message
        };
    } finally {
        $.global.SymbolHostValidation._closeFixture(doc);
    }
};

$.global.SymbolHostValidation.runAutoGroupRestoreScenario = function (mode) {
    try {
        if (mode === "selection_cleared") {
            return $.global.SymbolHostValidation._encodeResult(
                $.global.SymbolHostValidation._runSelectionClearedScenario()
            );
        }

        if (mode === "missing_group") {
            return $.global.SymbolHostValidation._encodeResult(
                $.global.SymbolHostValidation._runMissingGroupScenario()
            );
        }

        if (mode === "border_zero_offset") {
            return $.global.SymbolHostValidation._encodeResult(
                $.global.SymbolHostValidation._runBorderZeroOffsetScenario()
            );
        }

        if (mode === "single_edge_border") {
            return $.global.SymbolHostValidation._encodeResult(
                $.global.SymbolHostValidation._runSingleEdgeBorderScenario()
            );
        }

        if (mode === "k100_compound") {
            return $.global.SymbolHostValidation._encodeResult(
                $.global.SymbolHostValidation._runK100CompoundScenario()
            );
        }

        if (mode === "k100_pipeline_order") {
            return $.global.SymbolHostValidation._encodeResult(
                $.global.SymbolHostValidation._runK100PipelineOrderScenario()
            );
        }

        return $.global.SymbolHostValidation._encodeResult({
            success: false,
            error: "Unknown mode: " + mode
        });
    } catch (e) {
        return $.global.SymbolHostValidation._encodeResult({
            success: false,
            error: e.message
        });
    }
};

