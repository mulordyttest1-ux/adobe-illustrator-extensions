if (!$.global.__TOOLKIT_BREAK_TEXT_WORDS__) {
    throw new Error("Break Text into Words namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_WORDS__;

TextBreak.resolveRequest = function () {
    return {
        granularity: TextBreak.granularity
    };
};
