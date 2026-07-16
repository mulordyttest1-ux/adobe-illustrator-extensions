#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Hay mo mot file Illustrator truoc.");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length === 0) {
        alert("Hay chon doi tuong can tao CutContour.");
        return;
    }

    var mode = prompt(
        "Tao CutContour:\n1 = Lay tu path/clipping path dang co\n2 = Tao 1 khung chu nhat quanh selection",
        "1"
    );
    if (mode === null) {
        return;
    }
    mode = trimString(mode);
    if (mode !== "1" && mode !== "2") {
        alert("Chi nhap 1 hoac 2.");
        return;
    }

    var spotName = prompt("Ten spot color:", "CutContour");
    if (spotName === null) {
        return;
    }
    spotName = trimString(spotName);
    if (!spotName) {
        spotName = "CutContour";
    }

    var widthInput = prompt("Do day stroke (pt):", "0.25");
    if (widthInput === null) {
        return;
    }
    var strokeWidth = parseFloat(widthInput);
    if (isNaN(strokeWidth) || strokeWidth <= 0) {
        alert("Stroke width khong hop le.");
        return;
    }

    var layerName = prompt("Ten layer de contour:", "CUT");
    if (layerName === null) {
        return;
    }
    layerName = trimString(layerName);
    if (!layerName) {
        layerName = "CUT";
    }

    var layer = getOrCreateLayer(doc, layerName);
    var cutColor = getOrCreateSpotColor(doc, spotName);
    var created = 0;
    var skipped = 0;

    if (mode === "1") {
        var i;
        for (i = 0; i < doc.selection.length; i++) {
            var result = copyContourFromItem(doc.selection[i], layer, cutColor, strokeWidth, spotName);
            created += result.created;
            skipped += result.skipped;
        }
    } else {
        var offsetInput = prompt("Khoang no ra cho khung (mm):", "0");
        if (offsetInput === null) {
            return;
        }
        var offsetMm = parseFloat(offsetInput);
        if (isNaN(offsetMm)) {
            alert("Gia tri offset khong hop le.");
            return;
        }

        var bounds = getCombinedBounds(doc.selection);
        if (!bounds) {
            alert("Khong doc duoc kich thuoc selection.");
            return;
        }

        var offsetPt = mmToPt(offsetMm);
        var rect = layer.pathItems.rectangle(
            bounds.top + offsetPt,
            bounds.left - offsetPt,
            (bounds.right - bounds.left) + (offsetPt * 2),
            (bounds.top - bounds.bottom) + (offsetPt * 2)
        );
        stylePathItem(rect, cutColor, strokeWidth, spotName);
        created = 1;
    }

    app.redraw();

    if (created === 0) {
        alert(
            "Khong tao duoc CutContour.\n\n" +
            "- Neu doi tuong la image/placed item, hay chon clipping path\n" +
            "- Hoac chay lai script va chon mode 2 de tao khung chu nhat"
        );
        return;
    }

    var message = "Da tao " + created + " CutContour tren layer '" + layer.name + "'.";
    if (skipped > 0) {
        message += "\nBo qua " + skipped + " doi tuong khong co path.";
    }
    alert(message);
})();

function copyContourFromItem(item, targetLayer, color, strokeWidth, spotName) {
    var result = { created: 0, skipped: 0 };
    if (!item || item.locked || item.hidden) {
        return result;
    }

    switch (item.typename) {
        case "PathItem":
            if (!item.guides) {
                var duplicatedPath = item.duplicate(targetLayer, ElementPlacement.PLACEATBEGINNING);
                stylePathItem(duplicatedPath, color, strokeWidth, spotName);
                result.created++;
            } else {
                result.skipped++;
            }
            break;

        case "CompoundPathItem":
            var duplicatedCompound = item.duplicate(targetLayer, ElementPlacement.PLACEATBEGINNING);
            styleCompoundPath(duplicatedCompound, color, strokeWidth, spotName);
            result.created++;
            break;

        case "GroupItem":
            if (item.clipped) {
                var clippingSource = findClippingSource(item);
                if (clippingSource) {
                    return copyContourFromItem(clippingSource, targetLayer, color, strokeWidth, spotName);
                }
            }

            var i;
            for (i = 0; i < item.pageItems.length; i++) {
                var nestedResult = copyContourFromItem(item.pageItems[i], targetLayer, color, strokeWidth, spotName);
                result.created += nestedResult.created;
                result.skipped += nestedResult.skipped;
            }
            break;

        case "TextFrame":
            if (item.textPath) {
                return copyContourFromItem(item.textPath, targetLayer, color, strokeWidth, spotName);
            }
            result.skipped++;
            break;

        default:
            result.skipped++;
            break;
    }

    return result;
}

function findClippingSource(groupItem) {
    var i;
    for (i = 0; i < groupItem.pageItems.length; i++) {
        var pageItem = groupItem.pageItems[i];
        if (pageItem.typename === "PathItem" && pageItem.clipping) {
            return pageItem;
        }
        if (pageItem.typename === "CompoundPathItem" && compoundHasClipping(pageItem)) {
            return pageItem;
        }
        if (pageItem.typename === "GroupItem") {
            var nested = findClippingSource(pageItem);
            if (nested) {
                return nested;
            }
        }
    }
    return null;
}

function compoundHasClipping(compoundItem) {
    var i;
    for (i = 0; i < compoundItem.pathItems.length; i++) {
        if (compoundItem.pathItems[i].clipping) {
            return true;
        }
    }
    return false;
}

function styleCompoundPath(compoundItem, color, strokeWidth, spotName) {
    var i;
    for (i = 0; i < compoundItem.pathItems.length; i++) {
        stylePathItem(compoundItem.pathItems[i], color, strokeWidth, spotName);
    }
    compoundItem.name = spotName;
}

function stylePathItem(pathItem, color, strokeWidth, spotName) {
    pathItem.name = spotName;
    pathItem.guides = false;
    try {
        pathItem.clipping = false;
    } catch (e) {}
    pathItem.filled = false;
    pathItem.stroked = true;
    pathItem.strokeWidth = strokeWidth;
    pathItem.strokeColor = color;
}

function getOrCreateSpotColor(doc, spotName) {
    var spot;
    try {
        spot = doc.spots.getByName(spotName);
    } catch (e) {
        spot = doc.spots.add();
        spot.name = spotName;
        spot.colorType = ColorModel.SPOT;
        var cmyk = new CMYKColor();
        cmyk.cyan = 0;
        cmyk.magenta = 100;
        cmyk.yellow = 0;
        cmyk.black = 0;
        spot.color = cmyk;
    }

    var color = new SpotColor();
    color.spot = spot;
    color.tint = 100;
    return color;
}

function getOrCreateLayer(doc, layerName) {
    try {
        return doc.layers.getByName(layerName);
    } catch (e) {
        var layer = doc.layers.add();
        layer.name = layerName;
        return layer;
    }
}

function getCombinedBounds(items) {
    var bounds = null;
    var i;
    for (i = 0; i < items.length; i++) {
        var itemBounds = getItemBounds(items[i]);
        if (!itemBounds) {
            continue;
        }
        if (!bounds) {
            bounds = itemBounds;
        } else {
            bounds.left = Math.min(bounds.left, itemBounds.left);
            bounds.top = Math.max(bounds.top, itemBounds.top);
            bounds.right = Math.max(bounds.right, itemBounds.right);
            bounds.bottom = Math.min(bounds.bottom, itemBounds.bottom);
        }
    }
    return bounds;
}

function getItemBounds(item) {
    try {
        var bounds = item.visibleBounds;
        return {
            left: bounds[0],
            top: bounds[1],
            right: bounds[2],
            bottom: bounds[3]
        };
    } catch (e) {
        return null;
    }
}

function mmToPt(value) {
    return value * 2.834645669291339;
}

function trimString(value) {
    return String(value).replace(/^\s+|\s+$/g, "");
}
