if (!$.global.__TOOLKIT_BREAK_TEXT_GLYPHS__) {
    throw new Error("Break Text into Glyphs namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_GLYPHS__;

TextBreak.removeItems = function (items) {
    var index;

    for (index = items.length - 1; index >= 0; index -= 1) {
        try {
            if (items[index]) {
                items[index].remove();
            }
        } catch (error) {}
    }
};

TextBreak.processFrame = function (sourceFrame) {
    var workingFrame = sourceFrame.duplicate();
    var pieces = [];

    try {
        pieces = TextBreak.splitWorkingFrame(workingFrame);
        if (!pieces.length) {
            TextBreak.removeItems([workingFrame]);
            return null;
        }

        sourceFrame.remove();

        return {
            items: pieces,
            createdCount: pieces.length
        };
    } catch (error) {
        TextBreak.removeItems(pieces);
        TextBreak.removeItems([workingFrame]);
        throw error;
    }
};

TextBreak.selectItems = function (doc, items) {
    var index;

    doc.selection = null;
    for (index = 0; index < items.length; index += 1) {
        try {
            items[index].selected = true;
        } catch (error) {}
    }
};
