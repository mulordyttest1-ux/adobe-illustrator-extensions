if (!$.global.__TOOLKIT_BREAK_TEXT_WORDS__) {
    throw new Error("Break Text into Words namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_WORDS__;

TextBreak.addSkipReason = function (lookup, key) {
    if (!lookup[key]) {
        lookup[key] = 0;
    }

    lookup[key] += 1;
};

TextBreak.cloneSkipReasons = function (lookup) {
    var clone = {};
    var key;

    for (key in lookup) {
        if (Object.prototype.hasOwnProperty.call(lookup, key)) {
            clone[key] = lookup[key];
        }
    }

    return clone;
};

TextBreak.countSkipReasons = function (lookup) {
    var count = 0;
    var key;

    for (key in lookup) {
        if (Object.prototype.hasOwnProperty.call(lookup, key)) {
            count += lookup[key];
        }
    }

    return count;
};

TextBreak.isTextFrame = function (item) {
    if (!item || !item.typename) {
        return false;
    }

    return item.typename === "TextFrame" || item.typename === "TextFrameItem";
};

TextBreak.isGroupItem = function (item) {
    return item && item.typename === "GroupItem";
};

TextBreak.isThreadedText = function (item) {
    var nextFrame = null;
    var previousFrame = null;

    if (!item) {
        return false;
    }

    try {
        nextFrame = item.nextFrame;
    } catch (error) {
        nextFrame = null;
    }

    try {
        previousFrame = item.previousFrame;
    } catch (error) {
        previousFrame = null;
    }

    return !!((nextFrame && nextFrame !== item) || (previousFrame && previousFrame !== item));
};

TextBreak.hasContents = function (item) {
    return !!(item && typeof item.contents === "string" && item.contents.length > 0);
};

TextBreak.containsFrame = function (frames, candidate) {
    var index;

    for (index = 0; index < frames.length; index += 1) {
        if (frames[index] === candidate) {
            return true;
        }
    }

    return false;
};

TextBreak.collectSupportedFrames = function (items) {
    var state = {
        frames: [],
        skippedReasons: {}
    };

    TextBreak.collectFramesRecursive(items || [], state, true);

    return state;
};

TextBreak.collectFramesRecursive = function (items, state, countNonText) {
    var index;
    var item;

    for (index = 0; index < items.length; index += 1) {
        item = items[index];

        if (!item) {
            continue;
        }

        if (TextBreak.isTextFrame(item)) {
            if (item.kind === TextType.PATHTEXT) {
                TextBreak.addSkipReason(state.skippedReasons, "pathText");
                continue;
            }

            if (TextBreak.isThreadedText(item)) {
                TextBreak.addSkipReason(state.skippedReasons, "threadedText");
                continue;
            }

            if (!TextBreak.hasContents(item)) {
                TextBreak.addSkipReason(state.skippedReasons, "emptyText");
                continue;
            }

            if (!TextBreak.containsFrame(state.frames, item)) {
                state.frames.push(item);
            }
            continue;
        }

        if (TextBreak.isGroupItem(item)) {
            TextBreak.collectFramesRecursive(item.pageItems || [], state, false);
            continue;
        }

        if (countNonText) {
            TextBreak.addSkipReason(state.skippedReasons, "nonTextSelection");
        }
    }
};
