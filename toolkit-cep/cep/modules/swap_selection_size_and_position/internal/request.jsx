if (!$.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__) {
    throw new Error("Swap Size + Position namespace was not initialized.");
}

var SwapSelection = $.global.__TOOLKIT_SWAP_SELECTION_SIZE_AND_POSITION__;

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
