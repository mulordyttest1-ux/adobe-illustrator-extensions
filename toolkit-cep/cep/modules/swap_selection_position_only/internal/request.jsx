if (!$.global.__TOOLKIT_SWAP_SELECTION_POSITION_ONLY__) {
    throw new Error("Swap Position Only namespace was not initialized.");
}

var SwapSelection = $.global.__TOOLKIT_SWAP_SELECTION_POSITION_ONLY__;

SwapSelection.createModuleError = function (errorCode, message, data) {
    var error = new Error(message);

    error.swapErrorCode = errorCode;
    error.swapErrorData = data || null;

    return error;
};

SwapSelection.resolveRequest = function (payload) {
    return {
        mode: SwapSelection.mode,
        payload: payload || {}
    };
};
