if (!$.global.__TOOLKIT_BREAK_TEXT_WORDS__) {
    throw new Error("Break Text into Words namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_WORDS__;

TextBreak.createFailure = function (message, errorCode, data) {
    return {
        success: false,
        message: message,
        errorCode: errorCode,
        data: data || null
    };
};

TextBreak.buildResultData = function (processedFrameCount, createdFrameCount, skippedReasons) {
    return {
        granularity: TextBreak.granularity,
        processedFrameCount: processedFrameCount,
        createdFrameCount: createdFrameCount,
        skippedItemCount: TextBreak.countSkipReasons(skippedReasons),
        skippedReasons: TextBreak.cloneSkipReasons(skippedReasons)
    };
};

TextBreak.buildSuccessMessage = function (resultData) {
    var label = TextBreak.granularity === "lines"
        ? "line"
        : (TextBreak.granularity === "words" ? "word" : "glyph");
    var message = "Created " + resultData.createdFrameCount + " " + label + " text item(s) from " + resultData.processedFrameCount + " source frame(s).";

    if (resultData.skippedItemCount > 0) {
        message += " Skipped " + resultData.skippedItemCount + " unsupported item(s).";
    }

    return message;
};

TextBreak.execute = function () {
    var doc;
    var selection;
    var collected;
    var createdItems = [];
    var createdFrameCount = 0;
    var processedFrameCount = 0;
    var skippedReasons;
    var resultData;
    var index;
    var itemIndex;
    var processed;

    try {
        if (!app.documents.length) {
            return TextBreak.createFailure(
                "Open a document before running " + TextBreak.title + ".",
                "TEXT_BREAK_REQUIRES_DOCUMENT"
            );
        }

        doc = app.activeDocument;
        selection = doc.selection || [];
        if (!selection.length) {
            return TextBreak.createFailure(
                "Select at least one text object before running " + TextBreak.title + ".",
                "TEXT_BREAK_REQUIRES_SELECTION"
            );
        }

        TextBreak.resolveRequest();
        collected = TextBreak.collectSupportedFrames(selection);
        skippedReasons = TextBreak.cloneSkipReasons(collected.skippedReasons);

        if (!collected.frames.length) {
            return TextBreak.createFailure(
                "No supported point or area text was found in the current selection.",
                "TEXT_BREAK_NO_SUPPORTED_SELECTION",
                TextBreak.buildResultData(0, 0, skippedReasons)
            );
        }

        for (index = 0; index < collected.frames.length; index += 1) {
            try {
                processed = TextBreak.processFrame(collected.frames[index]);
                if (processed && processed.items && processed.items.length) {
                    for (itemIndex = 0; itemIndex < processed.items.length; itemIndex += 1) {
                        createdItems.push(processed.items[itemIndex]);
                    }
                    createdFrameCount += processed.createdCount;
                    processedFrameCount += 1;
                } else {
                    TextBreak.addSkipReason(skippedReasons, "emptyResult");
                }
            } catch (error) {
                if (error && error.textBreakSkipReason) {
                    TextBreak.addSkipReason(skippedReasons, error.textBreakSkipReason);
                } else {
                    TextBreak.addSkipReason(skippedReasons, "frameProcessingFailed");
                }
            }
        }

        resultData = TextBreak.buildResultData(processedFrameCount, createdFrameCount, skippedReasons);

        if (createdFrameCount <= 0 || processedFrameCount <= 0) {
            return TextBreak.createFailure(
                "No split text items were created from the current selection.",
                "TEXT_BREAK_NOTHING_CREATED",
                resultData
            );
        }

        TextBreak.selectItems(doc, createdItems);
        app.redraw();

        return {
            success: true,
            message: TextBreak.buildSuccessMessage(resultData),
            errorCode: null,
            data: resultData
        };
    } catch (error) {
        return TextBreak.createFailure(
            error && error.message ? error.message : TextBreak.title + " failed.",
            error && error.code ? error.code : "TEXT_BREAK_FAILED"
        );
    }
};
