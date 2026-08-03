// Artboard, placement, and rendering helpers for Wedding Suite Standard.
$.global.WeddingSuiteStandard._collectArtboardItems = function (doc, artboardIndex) {
    var items = [];
    var artboard = doc.artboards[artboardIndex];
    var rect;
    var pageItems = doc.pageItems;
    var i;

    if (!artboard) {
        return items;
    }

    rect = artboard.artboardRect;

    for (i = 0; i < pageItems.length; i++) {
        var item = pageItems[i];
        try {
            if ($.global.WeddingSuiteStandard._intersects(rect, item.visibleBounds)) {
                items.push(item);
            }
        } catch (e) { }
    }

    return items;
};

$.global.WeddingSuiteStandard._createGrayColor = function (gray) {
    var color = new GrayColor();
    color.gray = gray;
    return color;
};

$.global.WeddingSuiteStandard._createTextFrame = function (layer, contents, x, y, sizePt) {
    var textFrame = layer.textFrames.add();
    textFrame.contents = contents;
    textFrame.position = [x, y];
    textFrame.textRange.characterAttributes.size = sizePt || 10;
    textFrame.textRange.characterAttributes.fillColor = $.global.WeddingSuiteStandard._createGrayColor(100);
    return textFrame;
};

$.global.WeddingSuiteStandard._createPlaceholder = function (layer, rect, label) {
    var top = Math.max(rect[1], rect[3]);
    var left = Math.min(rect[0], rect[2]);
    var width = Math.abs(rect[2] - rect[0]);
    var height = Math.abs(rect[1] - rect[3]);
    var path = layer.pathItems.rectangle(top, left, width, height);

    path.stroked = true;
    path.filled = false;
    path.strokeWidth = 0.75;
    path.strokeColor = $.global.WeddingSuiteStandard._createGrayColor(40);

    if (label) {
        $.global.WeddingSuiteStandard._createTextFrame(layer, label, left + 12, top - 18, 10);
    }

    return path;
};

$.global.WeddingSuiteStandard._getRectMetrics = function (rect) {
    var left = Math.min(rect[0], rect[2]);
    var right = Math.max(rect[0], rect[2]);
    var top = Math.max(rect[1], rect[3]);
    var bottom = Math.min(rect[1], rect[3]);

    return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        width: right - left,
        height: top - bottom
    };
};

$.global.WeddingSuiteStandard._insetRect = function (rect, insetPt) {
    var metrics = $.global.WeddingSuiteStandard._getRectMetrics(rect);
    var safeInset = Math.max(0, Number(insetPt) || 0);
    var width = Math.max(1, metrics.width - (safeInset * 2));
    var height = Math.max(1, metrics.height - (safeInset * 2));

    return $.global.WeddingSuiteStandard._makeRect(
        metrics.left + safeInset,
        metrics.top - safeInset,
        width,
        height
    );
};

$.global.WeddingSuiteStandard._createGuideRect = function (layer, rect, name) {
    var metrics = $.global.WeddingSuiteStandard._getRectMetrics(rect);
    var guide = null;

    try {
        guide = layer.pathItems.rectangle(metrics.top, metrics.left, metrics.width, metrics.height);
        guide.name = name || "WSS_Guide_Rect";
        guide.filled = false;
        guide.stroked = true;
        guide.guides = true;
    } catch (e) {
        return null;
    }

    return guide;
};

$.global.WeddingSuiteStandard._createGuideRectFromSource = function (layer, widthMm, heightMm, name) {
    var widthPt = $.global.WeddingSuiteStandard._mmToPt(Math.max(1, Number(widthMm) || 0));
    var heightPt = $.global.WeddingSuiteStandard._mmToPt(Math.max(1, Number(heightMm) || 0));
    var guide = null;

    try {
        guide = layer.pathItems.rectangle(0, 0, widthPt, heightPt);
        guide.name = name || "WSS_Guide_Source";
        guide.filled = false;
        guide.stroked = true;
    } catch (e) {
        return null;
    }

    return guide;
};

$.global.WeddingSuiteStandard._shrinkGuideFromCenter = function (item, insetMmPerSide, sourceWidthMm, sourceHeightMm) {
    var insetMm = Math.max(0, Number(insetMmPerSide) || 0);
    var widthMm = Math.max(1, Number(sourceWidthMm) || 0);
    var heightMm = Math.max(1, Number(sourceHeightMm) || 0);
    var scaleX = ((widthMm - (insetMm * 2)) / widthMm) * 100;
    var scaleY = ((heightMm - (insetMm * 2)) / heightMm) * 100;

    if (!(scaleX > 0) || !(scaleY > 0)) {
        return;
    }

    try {
        item.resize(scaleX, scaleY, true, true, true, true, 100, Transformation.CENTER);
    } catch (e) { }
};

$.global.WeddingSuiteStandard._getItemBounds = function (item) {
    try {
        return item.geometricBounds;
    } catch (e) { }

    try {
        return item.visibleBounds;
    } catch (fallbackErr) { }

    return null;
};

$.global.WeddingSuiteStandard._getEnvelopeReference = function () {
    return {
        rotationDeg: 45,
        scaleFactor: 1.0052356973391205,
        leftOffsetMm: -108.426264257198,
        topOffsetMm: -108.4262642571
    };
};

$.global.WeddingSuiteStandard._getEnvelopeGuideReference = function () {
    return [
        {
            name: "WSS_Guide_Envelope_Outer",
            closed: true,
            points: [
                { a: [223.104607, 95.771415], l: [223.104607, 95.771415], r: [223.104607, 95.771415], t: "corner" },
                { a: [223.058744, 95.813747], l: [223.058744, 95.813747], r: [223.058744, 95.813747], t: "corner" },
                { a: [223.12222, 95.877244], l: [223.12222, 95.877244], r: [223.129282, 95.887838], t: "corner" },
                { a: [223.175188, 95.947804], l: [223.146938, 95.912513], r: [223.446791, 96.32881], t: "corner" },
                { a: [225.111934, 98.685363], l: [224.621525, 97.969214], r: [226.226681, 100.304601], t: "smooth" },
                { a: [228.470386, 104.047568], l: [227.567254, 102.350708], r: [229.077153, 105.17293], t: "smooth" },
                { a: [229.507532, 106.72163], l: [229.486344, 106.153663], r: [229.507532, 106.72163], t: "corner" },
                { a: [229.507532, 106.725161], l: [229.507532, 106.725161], r: [229.507532, 106.725161], t: "corner" },
                { a: [229.239417, 189.638532], l: [229.239417, 189.638532], r: [229.239417, 189.638532], t: "corner" },
                { a: [189.160339, 229.717611], l: [189.160339, 229.717611], r: [189.160339, 229.717611], t: "corner" },
                { a: [106.945461, 229.911634], l: [106.945461, 229.911634], r: [106.945461, 229.911634], t: "corner" },
                { a: [106.938441, 229.911634], l: [106.938441, 229.911634], r: [106.43395, 229.890468], t: "corner" },
                { a: [104.648874, 229.033221], l: [105.608462, 229.551794], r: [103.685797, 228.514626], t: "smooth" },
                { a: [101.487999, 227.075308], l: [102.57807, 227.812602], r: [99.300751, 225.597169], t: "smooth" },
                { a: [96.333921, 223.318216], l: [97.170002, 223.967337], r: [96.199863, 223.212387], t: "smooth" },
                { a: [96.037556, 223.085393], l: [96.101075, 223.134765], r: [96.00233, 223.060696], t: "corner" },
                { a: [95.970549, 223.032467], l: [95.981143, 223.043061], r: [95.963487, 223.028936], t: "corner" },
                { a: [95.959956, 223.025405], l: [95.959956, 223.025405], r: [95.959956, 223.025405], t: "corner" },
                { a: [95.907073, 223.095965], l: [95.907073, 223.095965], r: [95.907073, 223.095965], t: "corner" },
                { a: [95.903542, 223.095965], l: [95.903542, 223.095965], r: [95.903542, 223.095965], t: "corner" },
                { a: [95.871761, 223.014833], l: [95.871761, 223.014833], r: [95.871761, 223.014833], t: "corner" },
                { a: [95.836492, 223.028936], l: [95.836492, 223.028936], r: [95.836492, 223.028936], t: "corner" },
                { a: [95.751829, 223.067737], l: [95.751829, 223.067737], r: [95.751829, 223.067737], t: "corner" },
                { a: [80.931588, 229.301335], l: [80.931588, 229.301335], r: [80.931588, 229.301335], t: "corner" },
                { a: [55.796171, 229.400102], l: [55.796171, 229.400102], r: [42.228352, 229.449496], t: "corner" },
                { a: [18.736934, 229.505931], l: [26.681497, 229.502421], r: [18.736934, 229.505931], t: "corner" },
                { a: [18.726341, 229.505931], l: [18.726341, 229.505931], r: [15.237406, 229.064959], t: "corner" },
                { a: [5.94874, 223.085393], l: [11.099244, 227.967825], r: [5.87467, 223.018364], t: "smooth" },
                { a: [5.733508, 222.877244], l: [5.804046, 222.947804], r: [2.343275, 219.490586], t: "smooth" },
                { a: [0.089063, 208.621504], l: [0.254858, 213.137055], r: [0.089063, 208.621504], t: "corner" },
                { a: [0.089063, 208.617973], l: [0.089063, 208.617973], r: [0.089063, 208.617973], t: "corner" },
                { a: [0.597129, 144.853389], l: [0.597129, 144.853389], r: [0.597129, 144.853389], t: "corner" },
                { a: [4.02965, 131.345514], l: [4.02965, 131.345514], r: [4.02965, 131.345514], t: "corner" },
                { a: [4.054282, 131.246748], l: [4.054282, 131.246748], r: [4.054282, 131.246748], t: "corner" },
                { a: [4.068407, 131.193822], l: [4.068407, 131.193822], r: [4.068407, 131.193822], t: "corner" },
                { a: [4.011993, 131.179719], l: [4.011993, 131.179719], r: [4.011993, 131.179719], t: "corner" },
                { a: [4.036712, 131.172657], l: [4.036712, 131.172657], r: [4.036712, 131.172657], t: "corner" },
                { a: [4.022587, 131.133856], l: [4.033095, 131.158553], r: [4.022587, 131.133856], t: "corner" },
                { a: [4.022587, 131.130325], l: [4.022587, 131.130325], r: [4.015525, 131.109159], t: "corner" },
                { a: [3.994337, 131.035068], l: [4.004931, 131.07389], r: [3.82148, 130.488267], t: "corner" },
                { a: [2.907754, 127.567278], l: [3.1794, 128.456263], r: [2.279799, 125.503515], t: "smooth" },
                { a: [1.027421, 120.808044], l: [1.524893, 122.910607], r: [0.692299, 119.407526], t: "smooth" },
                { a: [0.477153, 117.562505], l: [0.473622, 118.218667], r: [0.477153, 117.562505], t: "corner" },
                { a: [0.97807, 4.638326], l: [0.97807, 4.638326], r: [0.974539, 3.622324], t: "corner" },
                { a: [2.487969, 1.590321], l: [1.598962, 2.475796], r: [3.366383, 0.711907], t: "smooth" },
                { a: [5.497174, 0.087505], l: [4.498785, 0.094546], r: [5.497174, 0.087505], t: "corner" },
                { a: [117.362999, 0.112181], l: [117.362999, 0.112181], r: [117.881572, 0.108671], t: "corner" },
                { a: [120.029976, 0.574319], l: [118.848179, 0.28857], r: [121.211816, 0.860068], t: "smooth" },
                { a: [124.016383, 1.664412], l: [122.612334, 1.251668], r: [126.828011, 2.489921], t: "smooth" },
                { a: [130.765023, 3.781078], l: [129.646702, 3.414197], r: [130.765023, 3.781078], t: "corner" },
                { a: [131.128395, 3.901032], l: [131.128395, 3.901032], r: [131.128395, 3.901032], t: "corner" },
                { a: [131.220077, 3.93277], l: [131.220077, 3.93277], r: [131.220077, 3.93277], t: "corner" },
                { a: [131.223608, 3.93277], l: [131.223608, 3.93277], r: [131.223608, 3.93277], t: "corner" },
                { a: [131.262452, 3.946874], l: [131.262452, 3.946874], r: [131.262452, 3.946874], t: "corner" },
                { a: [131.269514, 3.925708], l: [131.269514, 3.925708], r: [131.269514, 3.925708], t: "corner" },
                { a: [131.283596, 3.978633], l: [131.283596, 3.978633], r: [131.283596, 3.978633], t: "corner" },
                { a: [131.336521, 3.96453], l: [131.336521, 3.96453], r: [131.336521, 3.96453], t: "corner" },
                { a: [131.43531, 3.939833], l: [131.43531, 3.939833], r: [131.43531, 3.939833], t: "corner" },
                { a: [144.657414, 0.46849], l: [144.657414, 0.46849], r: [144.657414, 0.46849], t: "corner" },
                { a: [208.002212, 0.50729], l: [208.002212, 0.50729], r: [212.507191, 0.673107], t: "corner" },
                { a: [222.183862, 4.871171], l: [218.828942, 1.509189], r: [222.250869, 4.9382], t: "smooth" },
                { a: [222.377907, 5.068726], l: [222.314388, 5.001697], r: [227.235664, 10.258073], t: "smooth" },
                { a: [229.913192, 17.934521], l: [229.475751, 14.445544], r: [229.913192, 17.934521], t: "corner" },
                { a: [229.909661, 17.934521], l: [229.909661, 17.934521], r: [229.916723, 32.772354], t: "corner" },
                { a: [229.168879, 80.556108], l: [229.182961, 79.571866], r: [229.168879, 80.556108], t: "corner" },
                { a: [223.150469, 95.654993], l: [223.150469, 95.654993], r: [223.150469, 95.654993], t: "corner" },
                { a: [223.1152, 95.743187], l: [223.1152, 95.743187], r: [223.1152, 95.743187], t: "corner" }
            ]
        },
        {
            name: "WSS_Guide_Envelope_Inner",
            closed: true,
            points: [
                { a: [223.057181, 95.814941], l: [223.057181, 95.814941], r: [223.057181, 95.814941], t: "corner" },
                { a: [95.905467, 222.970164], l: [95.905467, 222.970164], r: [95.905467, 222.970164], t: "corner" },
                { a: [4.105644, 131.17032], l: [4.105644, 131.17032], r: [4.105644, 131.17032], t: "corner" },
                { a: [131.260889, 4.015097], l: [131.260889, 4.015097], r: [131.260889, 4.015097], t: "corner" }
            ]
        }
    ];
};

$.global.WeddingSuiteStandard._localGuidePointToAbsolutePt = function (artboardRect, pointMm) {
    return [
        artboardRect[0] + $.global.WeddingSuiteStandard._mmToPt(pointMm[0]),
        artboardRect[1] - $.global.WeddingSuiteStandard._mmToPt(pointMm[1])
    ];
};

$.global.WeddingSuiteStandard._createGuidePathFromReference = function (layer, artboardRect, guideSpec) {
    var path = null;
    var anchors = [];
    var points = guideSpec && guideSpec.points ? guideSpec.points : [];
    var i;

    if (!points.length) {
        return null;
    }

    try {
        path = layer.pathItems.add();
        for (i = 0; i < points.length; i += 1) {
            anchors.push(
                $.global.WeddingSuiteStandard._localGuidePointToAbsolutePt(
                    artboardRect,
                    points[i].a
                )
            );
        }
        path.setEntirePath(anchors);
        path.closed = guideSpec.closed !== false;
        path.filled = false;
        path.stroked = true;
        path.name = guideSpec.name || "WSS_Guide_Envelope";

        for (i = 0; i < points.length && i < path.pathPoints.length; i += 1) {
            var pathPoint = path.pathPoints[i];
            var pointSpec = points[i];
            pathPoint.anchor = $.global.WeddingSuiteStandard._localGuidePointToAbsolutePt(artboardRect, pointSpec.a);
            pathPoint.leftDirection = $.global.WeddingSuiteStandard._localGuidePointToAbsolutePt(artboardRect, pointSpec.l);
            pathPoint.rightDirection = $.global.WeddingSuiteStandard._localGuidePointToAbsolutePt(artboardRect, pointSpec.r);
            pathPoint.pointType = pointSpec.t === "smooth" ? PointType.SMOOTH : PointType.CORNER;
        }

        path.guides = true;
    } catch (e) {
        try {
            if (path) {
                path.remove();
            }
        } catch (cleanupErr) { }
        return null;
    }

    return path;
};

$.global.WeddingSuiteStandard._placePageItemByScaleAndPosition = function (item, scaleFactor, positionPt, rotateDegrees) {
    if (rotateDegrees) {
        try {
            item.rotate(rotateDegrees);
        } catch (rotateErr) { }
    }

    if (scaleFactor && scaleFactor !== 1) {
        try {
            item.resize(scaleFactor * 100, scaleFactor * 100);
        } catch (resizeErr) { }
    }

    if (positionPt && positionPt.length >= 2) {
        try {
            item.position = [positionPt[0], positionPt[1]];
        } catch (positionErr) {
            var bounds = $.global.WeddingSuiteStandard._getItemBounds(item);
            if (bounds) {
                item.translate(positionPt[0] - bounds[0], positionPt[1] - bounds[1]);
            }
        }
    }
};

$.global.WeddingSuiteStandard._fitPageItemToRect = function (item, rect, paddingPt, rotate90) {
    var bounds;
    var rectMetrics;
    var currentWidth;
    var currentHeight;
    var scale;
    var boundsMetrics;
    var targetLeft;
    var targetTop;

    paddingPt = Number(paddingPt);
    if (!(paddingPt >= 0)) {
        paddingPt = 12;
    }

    if (rotate90) {
        try {
            item.rotate(90);
        } catch (rotateErr) { }
    }

    try {
        bounds = $.global.WeddingSuiteStandard._getItemBounds(item);
    } catch (e) {
        return;
    }

    if (!bounds) {
        return;
    }

    rectMetrics = $.global.WeddingSuiteStandard._getRectMetrics(rect);
    currentWidth = Math.abs(bounds[2] - bounds[0]);
    currentHeight = Math.abs(bounds[1] - bounds[3]);

    if (currentWidth <= 0 || currentHeight <= 0) {
        return;
    }

    scale = Math.min(
        Math.max(1, rectMetrics.width - (paddingPt * 2)) / currentWidth,
        Math.max(1, rectMetrics.height - (paddingPt * 2)) / currentHeight
    );
    if (!(scale > 0)) {
        return;
    }

    item.resize(scale * 100, scale * 100);
    bounds = $.global.WeddingSuiteStandard._getItemBounds(item);
    if (!bounds) {
        return;
    }

    boundsMetrics = $.global.WeddingSuiteStandard._getRectMetrics(bounds);
    targetLeft = rectMetrics.left + ((rectMetrics.width - boundsMetrics.width) / 2);
    targetTop = rectMetrics.top - ((rectMetrics.height - boundsMetrics.height) / 2);

    try {
        item.position = [targetLeft, targetTop];
    } catch (positionErr) {
        item.translate(targetLeft - boundsMetrics.left, targetTop - boundsMetrics.top);
    }
};

$.global.WeddingSuiteStandard._placePageItemByRect = function (item, rect, rotateDegrees) {
    var bounds;
    var rectMetrics;
    var currentWidth;
    var currentHeight;
    var targetWidth;
    var targetHeight;
    var scaleX;
    var scaleY;

    if (rotateDegrees) {
        try {
            item.rotate(rotateDegrees);
        } catch (rotateErr) { }
    }

    bounds = $.global.WeddingSuiteStandard._getItemBounds(item);
    if (!bounds) {
        return;
    }

    rectMetrics = $.global.WeddingSuiteStandard._getRectMetrics(rect);
    currentWidth = Math.abs(bounds[2] - bounds[0]);
    currentHeight = Math.abs(bounds[1] - bounds[3]);
    targetWidth = Math.max(1, rectMetrics.width);
    targetHeight = Math.max(1, rectMetrics.height);

    if (!(currentWidth > 0) || !(currentHeight > 0)) {
        return;
    }

    scaleX = targetWidth / currentWidth;
    scaleY = targetHeight / currentHeight;

    try {
        item.resize(scaleX * 100, scaleY * 100);
    } catch (resizeErr) {
        return;
    }

    try {
        item.position = [rectMetrics.left, rectMetrics.top];
    } catch (positionErr) {
        bounds = $.global.WeddingSuiteStandard._getItemBounds(item);
        if (!bounds) {
            return;
        }
        item.translate(rectMetrics.left - bounds[0], rectMetrics.top - bounds[1]);
    }
};

$.global.WeddingSuiteStandard._fitGroupToRect = function (group, rect, paddingPt, rotate90) {
    var bounds;
    var targetWidth;
    var targetHeight;
    var currentWidth;
    var currentHeight;
    var scale;
    var centerX;
    var centerY;
    var currentCenterX;
    var currentCenterY;

    paddingPt = Number(paddingPt);
    if (!(paddingPt >= 0)) {
        paddingPt = 12;
    }

    if (rotate90) {
        try {
            group.rotate(90);
        } catch (rotateErr) { }
    }

    try {
        bounds = group.visibleBounds;
    } catch (e) {
        return;
    }

    currentWidth = Math.abs(bounds[2] - bounds[0]);
    currentHeight = Math.abs(bounds[1] - bounds[3]);
    targetWidth = Math.max(1, Math.abs(rect[2] - rect[0]) - (paddingPt * 2));
    targetHeight = Math.max(1, Math.abs(rect[1] - rect[3]) - (paddingPt * 2));

    if (currentWidth <= 0 || currentHeight <= 0) {
        return;
    }

    scale = Math.min(targetWidth / currentWidth, targetHeight / currentHeight);
    if (!(scale > 0)) {
        return;
    }

    group.resize(scale * 100, scale * 100);
    bounds = group.visibleBounds;

    centerX = (rect[0] + rect[2]) / 2;
    centerY = (rect[1] + rect[3]) / 2;
    currentCenterX = (bounds[0] + bounds[2]) / 2;
    currentCenterY = (bounds[1] + bounds[3]) / 2;

    group.translate(centerX - currentCenterX, centerY - currentCenterY);
};

$.global.WeddingSuiteStandard._renderArtboardPreview = function (sourceDoc, artboardIndex, layer, rect, label, rotate90) {
    var items = $.global.WeddingSuiteStandard._collectArtboardItems(sourceDoc, artboardIndex);
    var group = layer.groupItems.add();
    var duplicated = 0;
    var i;

    group.name = "WSS_Preview_" + label;

    for (i = 0; i < items.length; i++) {
        try {
            items[i].duplicate(group, ElementPlacement.PLACEATEND);
            duplicated++;
        } catch (e) { }
    }

    if (!duplicated) {
        return null;
    }

    $.global.WeddingSuiteStandard._fitGroupToRect(group, rect, 10, !!rotate90);
    return group;
};

$.global.WeddingSuiteStandard._buildUsedSourceIndexes = function (plan) {
    var used = {};
    var invitePages = plan && plan.sourcePages ? (plan.sourcePages.invites || []) : [];
    var draftPages = plan && plan.sourcePages ? (plan.sourcePages.drafts || []) : [];
    var draftPage = plan && plan.sourcePages ? plan.sourcePages.draft : null;
    var qaPages = plan && plan.qaPreviewPages ? plan.qaPreviewPages : [];
    var productionSheets = plan && plan.productionSheets ? plan.productionSheets : [];
    var i;

    function remember(sourceIndex) {
        if (Number(sourceIndex) >= 0) {
            used[Number(sourceIndex)] = true;
        }
    }

    if (plan && plan.envelopeArtboard) {
        remember(plan.envelopeArtboard.sourceIndex);
    }

    if (plan && plan.sourcePages && plan.sourcePages.info) {
        remember(plan.sourcePages.info.sourceIndex);
    }

    if (!draftPages.length && draftPage) {
        draftPages = [draftPage];
    }

    for (i = 0; i < draftPages.length; i++) {
        remember(draftPages[i].sourceIndex);
    }

    if (draftPage) {
        remember(draftPage.sourceIndex);
    }

    for (i = 0; i < invitePages.length; i++) {
        remember(invitePages[i].sourceIndex);
    }

    for (i = 0; i < qaPages.length; i++) {
        remember(qaPages[i].sourceIndex);
    }

    for (i = 0; i < productionSheets.length; i++) {
        remember(productionSheets[i].sourcePage ? productionSheets[i].sourcePage.sourceIndex : -1);
        remember(productionSheets[i].topPage ? productionSheets[i].topPage.sourceIndex : -1);
        remember(productionSheets[i].bottomPage ? productionSheets[i].bottomPage.sourceIndex : -1);
    }

    return used;
};

$.global.WeddingSuiteStandard._placeLinkedPdfPage = function (doc, layer, sourceFile, pageNumber, name) {
    var snapshot = $.global.WeddingSuiteStandard._snapshotPdfOpenOptions();
    var options = null;
    var placedItem = null;
    var cropToBox = $.global.WeddingSuiteStandard._resolvePdfCropToBox();

    try {
        options = app.preferences.PDFFileOptions;
    } catch (e) { }

    try {
        if (options) {
            options.pageToOpen = Number(pageNumber) || 1;
            if (cropToBox !== null) {
                options.pDFCropToBox = cropToBox;
            }
        }

        placedItem = doc.placedItems.add();
        placedItem.file = sourceFile;

        if (name) {
            try {
                placedItem.name = name;
            } catch (nameErr) { }
        }

        if (layer) {
            try {
                placedItem.move(layer, ElementPlacement.PLACEATEND);
            } catch (moveErr) { }
        }

        return placedItem;
    } finally {
        $.global.WeddingSuiteStandard._restorePdfOpenOptions(snapshot);
    }
};

$.global.WeddingSuiteStandard._buildPdfPageTemplates = function (doc, sourceFile, plan) {
    var stageLayer = doc.layers.add();
    var usedIndexes = $.global.WeddingSuiteStandard._buildUsedSourceIndexes(plan);
    var templates = {
        layer: stageLayer,
        items: {}
    };
    var sourceIndex;

    stageLayer.name = "WSS_STAGE";

    for (sourceIndex in usedIndexes) {
        if (usedIndexes.hasOwnProperty(sourceIndex)) {
            templates.items[sourceIndex] = $.global.WeddingSuiteStandard._placeLinkedPdfPage(
                doc,
                stageLayer,
                sourceFile,
                Number(sourceIndex) + 1,
                "WSS_Template_Page_" + (Number(sourceIndex) + 1)
            );
        }
    }

    return templates;
};

$.global.WeddingSuiteStandard._removeLayerIfPresent = function (layer) {
    if (!layer) {
        return;
    }

    try {
        layer.remove();
    } catch (e) { }
};

$.global.WeddingSuiteStandard._renderPlacedTemplatePreview = function (pageTemplates, sourceIndex, layer, rect, label, rotate90, paddingPt) {
    var template = pageTemplates && pageTemplates.items
        ? pageTemplates.items[String(Number(sourceIndex))]
        : null;
    var item = null;

    if (!template) {
        return null;
    }

    try {
        item = template.duplicate(layer, ElementPlacement.PLACEATEND);
    } catch (e) {
        return null;
    }

    $.global.WeddingSuiteStandard._fitPageItemToRect(item, rect, Number(paddingPt) || 0, !!rotate90);
    return item;
};

$.global.WeddingSuiteStandard._renderPlacedTemplateExact = function (pageTemplates, sourceIndex, layer, rect, rotateDegrees) {
    var template = pageTemplates && pageTemplates.items
        ? pageTemplates.items[String(Number(sourceIndex))]
        : null;
    var item = null;

    if (!template) {
        return null;
    }

    try {
        item = template.duplicate(layer, ElementPlacement.PLACEATEND);
    } catch (e) {
        return null;
    }

    $.global.WeddingSuiteStandard._placePageItemByRect(item, rect, rotateDegrees || 0);
    return item;
};

$.global.WeddingSuiteStandard._renderPlacedTemplateByReference = function (pageTemplates, sourceIndex, layer, positionPt, scaleFactor, rotateDegrees) {
    var template = pageTemplates && pageTemplates.items
        ? pageTemplates.items[String(Number(sourceIndex))]
        : null;
    var item = null;

    if (!template) {
        return null;
    }

    try {
        item = template.duplicate(layer, ElementPlacement.PLACEATEND);
    } catch (e) {
        return null;
    }

    $.global.WeddingSuiteStandard._placePageItemByScaleAndPosition(
        item,
        Number(scaleFactor) || 1,
        positionPt,
        rotateDegrees || 0
    );
    return item;
};

$.global.WeddingSuiteStandard._renderEnvelopeGuideByReference = function (layer, artboardRect) {
    var guideSpecs = $.global.WeddingSuiteStandard._getEnvelopeGuideReference();
    var guides = [];
    var i;

    for (i = 0; i < guideSpecs.length; i += 1) {
        var guide = $.global.WeddingSuiteStandard._createGuidePathFromReference(
            layer,
            artboardRect,
            guideSpecs[i]
        );
        if (guide) {
            guides.push(guide);
        }
    }

    return guides;
};

$.global.WeddingSuiteStandard._renderBuildSourcePreview = function (pageTemplates, sourceSession, sourceIndex, layer, rect, label, rotate90, paddingPt) {
    if (pageTemplates && sourceSession && sourceSession.kind === "pdf") {
        return $.global.WeddingSuiteStandard._renderPlacedTemplatePreview(
            pageTemplates,
            sourceIndex,
            layer,
            rect,
            label,
            rotate90,
            paddingPt
        );
    }

    return $.global.WeddingSuiteStandard._renderSourcePreview(
        sourceSession,
        sourceIndex,
        layer,
        rect,
        label,
        rotate90
    );
};

$.global.WeddingSuiteStandard._renderSourcePreview = function (sourceSession, sourceIndex, layer, rect, label, rotate90) {
    var sourceDoc = $.global.WeddingSuiteStandard._getSourceDocument(sourceSession, sourceIndex);
    var artboardIndex = $.global.WeddingSuiteStandard._getSourceArtboardIndex(sourceSession, sourceIndex);

    if (!sourceDoc) {
        return null;
    }

    return $.global.WeddingSuiteStandard._renderArtboardPreview(
        sourceDoc,
        artboardIndex,
        layer,
        rect,
        label,
        rotate90
    );
};

$.global.WeddingSuiteStandard._buildQaRects = function (qaRect, previewCount) {
    var outerMarginPt = $.global.WeddingSuiteStandard._mmToPt(5);
    var textBandPt = $.global.WeddingSuiteStandard._mmToPt(12);
    var metrics = $.global.WeddingSuiteStandard._getRectMetrics(qaRect);
    var usableLeft = metrics.left + outerMarginPt;
    var previewTop = metrics.top - outerMarginPt - textBandPt;
    var previewWidth = Math.max(1, metrics.width - (outerMarginPt * 2));
    var previewHeight = Math.max(1, metrics.height - (outerMarginPt * 2) - textBandPt);
    var columns;
    var rows;
    var cellWidth;
    var cellHeight;
    var rects = [];
    var i;

    if (previewCount <= 0) {
        return [];
    }

    columns = Math.min(2, previewCount);
    rows = Math.max(1, Math.ceil(previewCount / 2));
    cellWidth = previewWidth / columns;
    cellHeight = previewHeight / rows;

    for (i = 0; i < previewCount; i++) {
        var row = Math.floor(i / columns);
        var col = i % columns;
        rects.push($.global.WeddingSuiteStandard._makeRect(
            usableLeft + (col * cellWidth),
            previewTop - (row * cellHeight),
            cellWidth,
            cellHeight
        ));
    }

    return rects;
};

$.global.WeddingSuiteStandard._buildQaPreviewRenderRect = function (cellRect, preview) {
    var metrics = $.global.WeddingSuiteStandard._getRectMetrics(cellRect);
    var widthMm;
    var heightMm;
    var targetWidthPt;
    var targetHeightPt;
    var left;
    var top;

    if (!preview || preview.kind !== "draft") {
        return cellRect;
    }

    widthMm = Number(preview.widthMm) || 0;
    heightMm = Number(preview.heightMm) || 0;

    if (!(widthMm > 0) || !(heightMm > 0)) {
        return cellRect;
    }

    if (preview.shouldRotate90) {
        var swapped = widthMm;
        widthMm = heightMm;
        heightMm = swapped;
    }

    targetWidthPt = Math.min(metrics.width, $.global.WeddingSuiteStandard._mmToPt(widthMm));
    targetHeightPt = Math.min(metrics.height, $.global.WeddingSuiteStandard._mmToPt(heightMm));

    left = metrics.left + ((metrics.width - targetWidthPt) / 2);
    top = metrics.top - ((metrics.height - targetHeightPt) / 2);

    return $.global.WeddingSuiteStandard._makeRect(
        left,
        top,
        targetWidthPt,
        targetHeightPt
    );
};

$.global.WeddingSuiteStandard._getEnvelopeOverflowRightMm = function (plan) {
    var reference = $.global.WeddingSuiteStandard._getEnvelopeReference();
    var envelopePage = plan && plan.sourcePages ? plan.sourcePages.envelope : null;
    var rotationRad;
    var scaledWidth;
    var scaledHeight;
    var rotatedWidth;

    if (!envelopePage) {
        return 0;
    }

    rotationRad = Math.abs(Number(reference.rotationDeg) || 0) * Math.PI / 180;
    scaledWidth = (Number(envelopePage.widthMm) || 0) * (Number(reference.scaleFactor) || 1);
    scaledHeight = (Number(envelopePage.heightMm) || 0) * (Number(reference.scaleFactor) || 1);
    rotatedWidth = Math.abs(scaledWidth * Math.cos(rotationRad)) + Math.abs(scaledHeight * Math.sin(rotationRad));

    return Math.max(
        0,
        rotatedWidth - Number(plan.envelopeArtboard.widthMm || 0) - Number(reference.leftOffsetMm || 0)
    );
};

$.global.WeddingSuiteStandard._getEnvelopeOverflowLeftMm = function () {
    var reference = $.global.WeddingSuiteStandard._getEnvelopeReference();

    return Math.max(0, 0 - Number(reference.leftOffsetMm || 0));
};

$.global.WeddingSuiteStandard._createArtboards = function (doc, plan) {
    var gap = $.global.WeddingSuiteStandard._mmToPt(12);
    var envelopeOverflowGap = $.global.WeddingSuiteStandard._mmToPt(
        $.global.WeddingSuiteStandard._getEnvelopeOverflowRightMm(plan) + 12
    );
    var envelopeOverflowLeftGap = $.global.WeddingSuiteStandard._mmToPt(
        $.global.WeddingSuiteStandard._getEnvelopeOverflowLeftMm() + 12
    );
    var left = 0;
    var top = 0;
    var qaRect = $.global.WeddingSuiteStandard._makeRect(
        left,
        top,
        $.global.WeddingSuiteStandard._mmToPt(plan.qaArtboard.widthMm),
        $.global.WeddingSuiteStandard._mmToPt(plan.qaArtboard.heightMm)
    );
    var envelopeLeft = qaRect[2] + Math.max(gap, envelopeOverflowLeftGap);
    var envelopeRect = $.global.WeddingSuiteStandard._makeRect(
        envelopeLeft,
        top,
        $.global.WeddingSuiteStandard._mmToPt(plan.envelopeArtboard.widthMm),
        $.global.WeddingSuiteStandard._mmToPt(plan.envelopeArtboard.heightMm)
    );
    var specs = [
        { kind: "qa", name: "QA", rect: qaRect },
        { kind: "envelope", name: "Envelope", rect: envelopeRect }
    ];
    var productionLeft = envelopeRect[2] + Math.max(gap, envelopeOverflowGap);
    var draftLeft = productionLeft;
    var draftArtboards = plan && plan.draftArtboards ? plan.draftArtboards : [];
    var i;

    if (!draftArtboards.length && plan.draftArtboard) {
        draftArtboards = [plan.draftArtboard];
    }

    doc.artboards[0].artboardRect = qaRect;
    doc.artboards[0].name = "QA";
    doc.artboards.add(envelopeRect);
    doc.artboards[1].name = "Envelope";

    for (i = 0; i < plan.productionSheets.length; i++) {
        var sheet = plan.productionSheets[i];
        var sheetRect = $.global.WeddingSuiteStandard._makeRect(
            productionLeft,
            top,
            $.global.WeddingSuiteStandard._mmToPt(sheet.widthMm),
            $.global.WeddingSuiteStandard._mmToPt(sheet.heightMm)
        );
        specs.push({
            kind: "production",
            name: sheet.artboardName,
            rect: sheetRect,
            sheet: sheet
        });
        doc.artboards.add(sheetRect);
        doc.artboards[doc.artboards.length - 1].name = sheet.artboardName;
        productionLeft = sheetRect[2] + gap;
        draftLeft = productionLeft;
    }

    for (i = 0; i < draftArtboards.length; i++) {
        var draftArtboard = draftArtboards[i];
        var draftRect = $.global.WeddingSuiteStandard._makeRect(
            draftLeft,
            top,
            $.global.WeddingSuiteStandard._mmToPt(draftArtboard.widthMm),
            $.global.WeddingSuiteStandard._mmToPt(draftArtboard.heightMm)
        );
        specs.push({
            kind: "draft",
            name: draftArtboard.artboardName,
            rect: draftRect,
            draft: draftArtboard
        });
        doc.artboards.add(draftRect);
        doc.artboards[doc.artboards.length - 1].name = draftArtboard.artboardName;
        draftLeft = draftRect[2] + gap;
    }

    return specs;
};

$.global.WeddingSuiteStandard._buildQaLines = function (payload) {
    var plan = payload && payload.plan ? payload.plan : null;
    var baseName = $.global.WeddingSuiteStandard._getBaseName(payload.sourcePath || "") || "Unknown source";
    var productionSheets = plan && plan.productionSheets ? plan.productionSheets : [];
    var qaNotes = plan && plan.qaNotes ? plan.qaNotes : [];
    var lines = [
        baseName,
        "1 artboard bao thu, " + productionSheets.length + " artboard thiep"
    ];
    var i;

    for (i = 0; i < qaNotes.length; i++) {
        if (qaNotes[i]) {
            lines.push(String(qaNotes[i]));
        }
    }

    return lines.join("\r");
};

$.global.WeddingSuiteStandard._renderQaArtboard = function (layer, spec, payload, sourceSession, pageTemplates) {
    var rect = spec.rect;
    var rectMetrics = $.global.WeddingSuiteStandard._getRectMetrics(rect);
    var textLeft = rectMetrics.left + $.global.WeddingSuiteStandard._mmToPt(5);
    var textTop = rectMetrics.top - $.global.WeddingSuiteStandard._mmToPt(5);
    var lines = $.global.WeddingSuiteStandard._buildQaLines(payload);
    var previewPages = payload.plan.qaPreviewPages || [];
    var previewRects = $.global.WeddingSuiteStandard._buildQaRects(rect, previewPages.length);
    var i;

    $.global.WeddingSuiteStandard._createTextFrame(layer, lines, textLeft, textTop, 10);

    for (i = 0; i < previewPages.length; i++) {
        var preview = previewPages[i];
        var targetRect = previewRects[i];
        var renderRect = $.global.WeddingSuiteStandard._buildQaPreviewRenderRect(targetRect, preview);
        var guideRect = $.global.WeddingSuiteStandard._insetRect(renderRect, $.global.WeddingSuiteStandard._mmToPt(5));

        $.global.WeddingSuiteStandard._renderPlacedTemplateExact(
            pageTemplates,
            preview.sourceIndex,
            layer,
            renderRect,
            preview.shouldRotate90 ? 90 : 0
        );
        $.global.WeddingSuiteStandard._createGuideRect(layer, guideRect, "WSS_Guide_QA_" + (i + 1));
    }
};

$.global.WeddingSuiteStandard._renderEnvelopeArtboard = function (layer, spec, payload, sourceSession, pageTemplates) {
    var rect = spec.rect;
    var metrics = $.global.WeddingSuiteStandard._getRectMetrics(rect);
    var reference = $.global.WeddingSuiteStandard._getEnvelopeReference();
    var envelopePage = payload && payload.plan && payload.plan.sourcePages
        ? payload.plan.sourcePages.envelope
        : null;
    var targetPosition = [
        metrics.left + $.global.WeddingSuiteStandard._mmToPt(reference.leftOffsetMm),
        metrics.top - $.global.WeddingSuiteStandard._mmToPt(reference.topOffsetMm)
    ];

    $.global.WeddingSuiteStandard._renderPlacedTemplateByReference(
        pageTemplates,
        payload.plan.envelopeArtboard.sourceIndex,
        layer,
        targetPosition,
        reference.scaleFactor,
        reference.rotationDeg
    );

    if (envelopePage) {
        $.global.WeddingSuiteStandard._renderEnvelopeGuideByReference(layer, rect);
    }
};

$.global.WeddingSuiteStandard._buildRowCellRects = function (rowRect, slots) {
    var rects = [];
    var metrics = $.global.WeddingSuiteStandard._getRectMetrics(rowRect);
    var cellWidth = metrics.width / slots;
    var i;

    for (i = 0; i < slots; i++) {
        var cellLeft = metrics.left + (i * cellWidth);
        rects.push($.global.WeddingSuiteStandard._makeRect(
            cellLeft,
            metrics.top,
            cellWidth,
            metrics.height
        ));
    }

    return rects;
};

$.global.WeddingSuiteStandard._buildDeterministicSheetGrid = function (rect) {
    var outerMarginPt = $.global.WeddingSuiteStandard._mmToPt(5);
    var usableLeft = Math.min(rect[0], rect[2]) + outerMarginPt;
    var usableTop = Math.max(rect[1], rect[3]) - outerMarginPt;
    var usableWidth = Math.max(1, Math.abs(rect[2] - rect[0]) - (outerMarginPt * 2));
    var usableHeight = Math.max(1, Math.abs(rect[1] - rect[3]) - (outerMarginPt * 2));
    var rowHeight = usableHeight / 2;
    var topRowRect = $.global.WeddingSuiteStandard._makeRect(usableLeft, usableTop, usableWidth, rowHeight);
    var bottomRowRect = $.global.WeddingSuiteStandard._makeRect(usableLeft, usableTop - rowHeight, usableWidth, rowHeight);

    return {
        topRects: $.global.WeddingSuiteStandard._buildRowCellRects(topRowRect, 4),
        bottomRects: $.global.WeddingSuiteStandard._buildRowCellRects(bottomRowRect, 4),
        topRowRect: topRowRect,
        bottomRowRect: bottomRowRect
    };
};

$.global.WeddingSuiteStandard._buildSheetCellGrid = function (rect, columns, rows) {
    var outerMarginPt = $.global.WeddingSuiteStandard._mmToPt(5);
    var usableLeft = Math.min(rect[0], rect[2]) + outerMarginPt;
    var usableTop = Math.max(rect[1], rect[3]) - outerMarginPt;
    var usableWidth = Math.max(1, Math.abs(rect[2] - rect[0]) - (outerMarginPt * 2));
    var usableHeight = Math.max(1, Math.abs(rect[1] - rect[3]) - (outerMarginPt * 2));
    var safeColumns = Math.max(1, Number(columns) || 1);
    var safeRows = Math.max(1, Number(rows) || 1);
    var cellWidth = usableWidth / safeColumns;
    var cellHeight = usableHeight / safeRows;
    var rects = [];
    var row;
    var column;

    for (row = 0; row < safeRows; row++) {
        for (column = 0; column < safeColumns; column++) {
            rects.push($.global.WeddingSuiteStandard._makeRect(
                usableLeft + (column * cellWidth),
                usableTop - (row * cellHeight),
                cellWidth,
                cellHeight
            ));
        }
    }

    return rects;
};

$.global.WeddingSuiteStandard._renderSinglePageSuiteProductionArtboard = function (layer, sheet, rect, pageTemplates) {
    var cellRects = $.global.WeddingSuiteStandard._buildSheetCellGrid(rect, 2, 2);
    var guideInsetPt = $.global.WeddingSuiteStandard._mmToPt(5);
    var sourcePage = sheet.sourcePage;
    var i;

    if (!sourcePage) {
        return;
    }

    for (i = 0; i < cellRects.length; i++) {
        $.global.WeddingSuiteStandard._renderPlacedTemplateExact(
            pageTemplates,
            sourcePage.sourceIndex,
            layer,
            cellRects[i],
            sourcePage.shouldRotate90 ? 90 : 0
        );
        $.global.WeddingSuiteStandard._createGuideRect(
            layer,
            $.global.WeddingSuiteStandard._insetRect(cellRects[i], guideInsetPt),
            "WSS_Guide_Production_Suite_" + (i + 1)
        );
    }
};

$.global.WeddingSuiteStandard._renderProductionArtboard = function (layer, spec, payload, sourceSession, pageTemplates) {
    var sheet = spec.sheet;
    var grid = $.global.WeddingSuiteStandard._buildDeterministicSheetGrid(spec.rect);
    var topRects = grid.topRects;
    var bottomRects = grid.bottomRects;
    var guideInsetPt = $.global.WeddingSuiteStandard._mmToPt(5);
    var i;

    if (sheet && sheet.layoutMode === "single_page_suite_2x2") {
        $.global.WeddingSuiteStandard._renderSinglePageSuiteProductionArtboard(layer, sheet, spec.rect, pageTemplates);
        return;
    }

    for (i = 0; i < topRects.length; i++) {
        $.global.WeddingSuiteStandard._renderPlacedTemplateExact(
            pageTemplates,
            sheet.topPage.sourceIndex,
            layer,
            topRects[i],
            sheet.topPage.shouldRotate90 ? 90 : 0
        );
        $.global.WeddingSuiteStandard._createGuideRect(
            layer,
            $.global.WeddingSuiteStandard._insetRect(topRects[i], guideInsetPt),
            "WSS_Guide_Production_Top_" + (i + 1)
        );
    }

    for (i = 0; i < bottomRects.length; i++) {
        $.global.WeddingSuiteStandard._renderPlacedTemplateExact(
            pageTemplates,
            sheet.bottomPage.sourceIndex,
            layer,
            bottomRects[i],
            sheet.bottomPage.shouldRotate90 ? 90 : 0
        );
        $.global.WeddingSuiteStandard._createGuideRect(
            layer,
            $.global.WeddingSuiteStandard._insetRect(bottomRects[i], guideInsetPt),
            "WSS_Guide_Production_Bottom_" + (i + 1)
        );
    }
};

$.global.WeddingSuiteStandard._renderDraftArtboard = function (layer, spec, payload, sourceSession, pageTemplates) {
    var draftArtboard = spec && spec.draft
        ? spec.draft
        : (payload && payload.plan ? payload.plan.draftArtboard : null);

    if (!draftArtboard) {
        return;
    }

    $.global.WeddingSuiteStandard._renderPlacedTemplateExact(
        pageTemplates,
        draftArtboard.sourceIndex,
        layer,
        spec.rect,
        0
    );
};
