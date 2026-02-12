if (typeof $.global.Bridge === 'undefined') {
    $.global.Bridge = {};
}

$.global.Bridge.ping = function () {
    return Base64.encode(JSON.stringify({ success: true, msg: "Pong" }));
};
