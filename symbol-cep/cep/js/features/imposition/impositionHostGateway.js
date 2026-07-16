function encodeUtf8Base64(value) {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(unescape(encodeURIComponent(String(value || ''))));
    }

    if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
        return globalThis.btoa(unescape(encodeURIComponent(String(value || ''))));
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(unescape(encodeURIComponent(String(value || ''))), 'binary').toString('base64');
    }

    throw new Error('Base64 encoder unavailable');
}

export function createImpositionHostGateway({ bridge, csInterface } = {}) {
    return {
        runImpositionEngine(payload) {
            return new Promise((resolve) => {
                csInterface.evalScript(`$._imposition.engine.run("${payload}")`, (resultRaw) => {
                    resolve(resultRaw);
                });
            });
        },

        restoreAutoGrouping(groupName) {
            const payload = encodeUtf8Base64(groupName);
            return bridge.eval(`$.global.Bridge.ungroupAutoGrouped("${payload}")`);
        },

        showGroupCheckDialog(dialog) {
            return bridge.eval(
                `$.global.Bridge.showGroupCheckDialog("${dialog.title}","${dialog.message}","${dialog.primary}","${dialog.secondary}","${dialog.cancel}")`
            );
        },

        checkArtboardGarbage() {
            return bridge.eval('$.global.Bridge.checkArtboardGarbage()');
        },

        clearArtboardGarbage() {
            return bridge.eval('$.global.Bridge.clearArtboardGarbage()');
        },

        drawPasteboardLegend(payloadBase64) {
            return bridge.eval(`Bridge.drawPasteboardLegend("${payloadBase64}")`);
        },

        getActiveDocumentIdentity() {
            return bridge.eval('$.global.Bridge.getActiveDocumentIdentity()');
        },

        saveActiveDocumentAfterImposition(payloadBase64) {
            return bridge.eval(`$.global.Bridge.saveActiveDocumentAfterImposition("${payloadBase64}")`);
        }
    };
}
