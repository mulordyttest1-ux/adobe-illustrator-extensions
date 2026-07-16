(function () {
    var Validation = $.global.WeddingHostValidation || {};

    Validation._fixtureDoc = null;

    Validation._closeFixtureDoc = function () {
        var doc = Validation._fixtureDoc;
        Validation._fixtureDoc = null;

        if (!doc) return false;

        try {
            doc.close(SaveOptions.DONOTSAVECHANGES);
            return true;
        } catch (closeErr) {
            try {
                doc.close();
                return true;
            } catch (ignoreErr) { }
        }

        return false;
    };

    Validation._createTextFrame = function (doc, left, top, text, name) {
        var frame = null;

        if (doc && doc.textFrames && typeof doc.textFrames.pointText === 'function') {
            frame = doc.textFrames.pointText([left, top]);
        } else if (doc && doc.textFrames && typeof doc.textFrames.add === 'function') {
            frame = doc.textFrames.add();
            frame.position = [left, top];
        }

        if (!frame) {
            throw new Error("Could not create fixture text frame");
        }

        frame.contents = String(text);
        if (name) frame.name = name;
        return frame;
    };

    Validation._selectOnly = function (doc, items) {
        var i;
        doc.selection = null;

        for (i = 0; i < items.length; i++) {
            items[i].selected = true;
        }

        doc.selection = items;
    };

    Validation._setupScenario = function (scenario) {
        var doc;
        var frames = [];
        var frameIds = [];
        var i;

        Validation._closeFixtureDoc();

        if (!app || !app.documents) {
            return { success: false, error: "Illustrator app unavailable" };
        }

        doc = app.documents.add();
        Validation._fixtureDoc = doc;

        if (scenario === "inject_orphan") {
            frames.push(Validation._createTextFrame(doc, 100, 500, "37", "fixture_orphan_target"));
            frames.push(Validation._createTextFrame(doc, 240, 500, "Kinh moi", "fixture_orphan_other"));
        } else {
            Validation._closeFixtureDoc();
            return { success: false, error: "Unknown host selection scenario: " + scenario };
        }

        Validation._selectOnly(doc, frames);

        for (i = 0; i < frames.length; i++) {
            frameIds.push(getStableTextFrameId(frames[i], i));
        }

        return {
            success: true,
            fixtureId: doc.name,
            scenario: scenario,
            selectionCount: frames.length,
            frameIds: frameIds,
            orphanId: scenario === "inject_orphan" ? frameIds[0] : null
        };
    };

    Validation.handle = function (payload) {
        var command = payload && payload.command;

        if (command === "setup") {
            return Validation._setupScenario(payload.scenario);
        }

        if (command === "cleanup") {
            return {
                success: true,
                cleaned: Validation._closeFixtureDoc()
            };
        }

        return { success: false, error: "Unknown host selection command: " + command };
    };

    $.global.WeddingHostValidation = Validation;
})();
