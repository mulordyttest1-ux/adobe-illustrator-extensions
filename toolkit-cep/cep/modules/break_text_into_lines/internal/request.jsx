if (!$.global.__TOOLKIT_BREAK_TEXT_LINES__) {
    throw new Error("Break Text into Lines namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_LINES__;

TextBreak.resolveRequest = function () {
    return {
        granularity: TextBreak.granularity
    };
};
