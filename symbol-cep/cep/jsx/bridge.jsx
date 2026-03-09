/**
 * MODULE: Bridge
 * LAYER: Host/Port (L1)
 * PURPOSE: Global endpoints for CEP to call ExtendScript (JSX) functions
 */

if (typeof $.global.Bridge === 'undefined') {
    $.global.Bridge = {};
}

$.global.Bridge.ping = function () {
    return Base64.encode(JSON.stringify({ success: true, msg: "Pong" }));
};

$.global.Bridge._intersects = function (r1, r2) {
    var l1 = Math.min(r1[0], r1[2]);
    var right1 = Math.max(r1[0], r1[2]);
    var t1 = Math.max(r1[1], r1[3]);
    var b1 = Math.min(r1[1], r1[3]);

    var l2 = Math.min(r2[0], r2[2]);
    var right2 = Math.max(r2[0], r2[2]);
    var t2 = Math.max(r2[1], r2[3]);
    var b2 = Math.min(r2[1], r2[3]);

    return !(right2 < l1 || l2 > right1 || b2 > t1 || t2 < b1);
};

$.global.Bridge.checkArtboardGarbage = function () {
    try {
        if (!app.documents.length) return Base64.encode(JSON.stringify({ hasGarbage: false, count: 0 }));
        var doc = app.activeDocument;
        var garbageCount = 0;
        var activeArtboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var abRect = activeArtboard.artboardRect;

        for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            if (layer.locked || !layer.visible) continue;

            for (var j = 0; j < layer.pageItems.length; j++) {
                var item = layer.pageItems[j];
                if (!item.selected) {
                    try {
                        if ($.global.Bridge._intersects(abRect, item.visibleBounds)) {
                            garbageCount++;
                        }
                    } catch (err) {
                        // Ignore items without valid bounds
                    }
                }
            }
        }

        return Base64.encode(JSON.stringify({
            success: true,
            hasGarbage: garbageCount > 0,
            count: garbageCount
        }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};

$.global.Bridge.clearArtboardGarbage = function () {
    try {
        if (!app.documents.length) return Base64.encode(JSON.stringify({ success: true }));
        var doc = app.activeDocument;
        var deletedCount = 0;
        var activeArtboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
        var abRect = activeArtboard.artboardRect;

        for (var i = 0; i < doc.layers.length; i++) {
            var layer = doc.layers[i];
            if (layer.locked || !layer.visible) continue;

            var items = layer.pageItems;
            // Loop backwards to safely remove items from collection
            for (var j = items.length - 1; j >= 0; j--) {
                var item = items[j];
                if (!item.selected) {
                    var isInArtboard = false;
                    try {
                        isInArtboard = $.global.Bridge._intersects(abRect, item.visibleBounds);
                    } catch (err) { }

                    if (isInArtboard) {
                        // Guardrails: Unlock and unhide before deleting
                        if (item.locked) item.locked = false;
                        if (item.hidden) item.hidden = false;
                        item.remove();
                        deletedCount++;
                    }
                }
            }
        }

        return Base64.encode(JSON.stringify({ success: true, deleted: deletedCount }));
    } catch (e) {
        return Base64.encode(JSON.stringify({ success: false, error: e.message }));
    }
};
