function getStableTextFrameId(item, index) {
    var contentHash = 0;
    try {
        contentHash = (item.contents && item.contents.length) ? item.contents.length : 0;
    } catch (e) { }
    return item.uuid || ("tf_" + Math.round(item.top || 0) + "_" + Math.round(item.left || 0) + "_" + contentHash + "_" + index);
}
