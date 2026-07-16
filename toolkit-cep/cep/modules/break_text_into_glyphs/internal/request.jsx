if (!$.global.__TOOLKIT_BREAK_TEXT_GLYPHS__) {
    throw new Error("Break Text into Glyphs namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_GLYPHS__;

TextBreak.resolveRequest = function () {
    return {
        granularity: TextBreak.granularity
    };
};
