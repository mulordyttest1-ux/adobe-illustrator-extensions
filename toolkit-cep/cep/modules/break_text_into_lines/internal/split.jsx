if (!$.global.__TOOLKIT_BREAK_TEXT_LINES__) {
    throw new Error("Break Text into Lines namespace was not initialized.");
}

var TextBreak = $.global.__TOOLKIT_BREAK_TEXT_LINES__;

TextBreak.getGranularityCollectionFor = function (text, granularity) {
    if (granularity === "lines") {
        return text.lines;
    }
    if (granularity === "words") {
        return text.words;
    }
    return text.characters;
};

TextBreak.getGranularityCollection = function (text) {
    return TextBreak.getGranularityCollectionFor(text, TextBreak.granularity);
};

TextBreak.createSkipFailure = function (reasonKey, message) {
    var error = new Error(message || reasonKey);
    error.textBreakSkipReason = reasonKey;
    return error;
};

TextBreak.convertJustification = function (text) {
    var justification = TextBreak.getJustification(text);
    var shrink;
    var expand;

    if (!justification || !/JUSTIFY/.test(justification.toString())) {
        return;
    }

    shrink = 80;
    expand = (1 / shrink) * 10000;
    text.resize(shrink, shrink);

    switch (justification) {
    case Justification.FULLJUSTIFY:
    case Justification.FULLJUSTIFYLASTLINELEFT:
        TextBreak.setJustification(text, Justification.LEFT);
        break;
    case Justification.FULLJUSTIFYLASTLINECENTER:
        TextBreak.setJustification(text, Justification.CENTER);
        break;
    case Justification.FULLJUSTIFYLASTLINERIGHT:
        TextBreak.setJustification(text, Justification.RIGHT);
        break;
    }

    text.resize(expand, expand);
};

TextBreak.getJustification = function (text) {
    var ranges = text.textRanges;
    var index;
    var paragraph;

    for (index = 0; index < ranges.length; index += 1) {
        paragraph = ranges[index].paragraphAttributes;

        try {
            return paragraph.justification;
        } catch (error) {}
    }

    return null;
};

TextBreak.setJustification = function (text, alignment) {
    var ranges = text.textRanges;
    var index;
    var paragraph;

    for (index = 0; index < ranges.length; index += 1) {
        paragraph = ranges[index].paragraphAttributes;

        try {
            paragraph.justification = alignment;
        } catch (error) {}
    }
};

TextBreak.getLanguage = function (text) {
    var ranges = text.textRanges;
    var index;
    var attributes;

    for (index = 0; index < ranges.length; index += 1) {
        attributes = ranges[index].characterAttributes;

        try {
            return attributes.language;
        } catch (error) {}
    }

    return null;
};

TextBreak.getLeading = function (text) {
    var language = TextBreak.getLanguage(text);
    var startIndex = language === LanguageType.JAPANESE ? 0 : 1;
    var ranges = text.textRanges;
    var index;
    var attributes;

    for (index = startIndex; index < ranges.length; index += 1) {
        attributes = ranges[index].characterAttributes;

        try {
            return attributes.leading;
        } catch (error) {}
    }

    return 0;
};

TextBreak.getRotationAngle = function (item) {
    var matrix = item.matrix;
    return Math.atan2(matrix.mValueB, matrix.mValueA);
};

TextBreak.cloneAnchor = function (anchor) {
    return [anchor[0], anchor[1]];
};

TextBreak.hasLinefeed = function (value) {
    return /^\r|^\u0003/.test(value || "");
};

TextBreak.hasTrailingPunctuation = function (text, wordRange) {
    var index = wordRange.end;
    var contents;

    if (index >= text.textRanges.length) {
        return false;
    }

    contents = text.textRanges[index].contents;
    return /,|\.|:|;/.test(contents);
};

TextBreak.getTrailingPunctuationPosition = function (text) {
    var match = /(,|\.|:|;)\s*/g;
    match.exec(text.contents);
    return match.lastIndex - 1;
};

TextBreak.removeContents = function (text, start, end) {
    var index;

    for (index = end - 1; index >= start; index -= 1) {
        text.textRanges[index].remove();
    }

    return text;
};

TextBreak.moveToAnchor = function (text, basePosition) {
    var left = text.anchor[0];
    var top = text.anchor[1];
    text.translate(basePosition.x - left, basePosition.y - top);
    return text;
};

TextBreak.moveNextLine = function (text) {
    var angle = TextBreak.getRotationAngle(text);
    var leading = TextBreak.getLeading(text);
    var x = leading * Math.sin(angle);
    var y = leading * Math.cos(angle) * -1;

    if (text.orientation === TextOrientation.VERTICAL) {
        x = leading * Math.cos(angle) * -1;
        y = leading * Math.sin(angle) * -1;
    }

    text.textRanges[0].remove();
    text.translate(x, y);
    return text;
};

TextBreak.changeToLeftAlignment = function (text, justification) {
    var top = text.top;
    var left = text.left;
    var shrink = 80;
    var expand = (1 / shrink) * 10000;

    text.resize(shrink, shrink);

    switch (justification) {
    case Justification.CENTER:
    case Justification.RIGHT:
        TextBreak.setJustification(text, Justification.LEFT);
        break;
    }

    text.resize(expand, expand);
    text.top = top;
    text.left = left;
};

TextBreak.changeToRightAlignment = function (text, justification) {
    var top = text.top;
    var left = text.left;

    switch (justification) {
    case Justification.LEFT:
    case Justification.CENTER:
        TextBreak.setJustification(text, Justification.RIGHT);
        break;
    }

    text.top = top;
    text.left = left;
};

TextBreak.resetAlignment = function (text, justification) {
    var top = text.top;
    var left = text.left;
    var shrink = 80;
    var expand = (1 / shrink) * 10000;

    text.resize(shrink, shrink);
    TextBreak.setJustification(text, justification);
    text.resize(expand, expand);
    text.top = top;
    text.left = left;
};

TextBreak.getTrailingAnchorPosition = function (text) {
    var justification = TextBreak.getJustification(text);
    var top = text.top;
    var left = text.left;
    var shrink = 80;
    var expand = (1 / shrink) * 10000;
    var anchor;

    text.resize(shrink, shrink);

    switch (justification) {
    case Justification.LEFT:
    case Justification.CENTER:
        TextBreak.setJustification(text, Justification.RIGHT);
        break;
    case Justification.RIGHT:
        TextBreak.setJustification(text, Justification.LEFT);
        break;
    }

    text.resize(expand, expand);
    text.top = top;
    text.left = left;

    anchor = {
        x: text.anchor[0],
        y: text.anchor[1]
    };

    TextBreak.resetAlignment(text, justification);
    return anchor;
};

TextBreak.removeLeadingSpace = function (text) {
    var justification = TextBreak.getJustification(text);
    var firstRange;

    TextBreak.changeToRightAlignment(text, justification);
    firstRange = text.textRanges[0];

    if (firstRange && /^\s/.test(firstRange.contents)) {
        firstRange.remove();
    }

    TextBreak.resetAlignment(text, justification);
};

TextBreak.removeTrailingSpaces = function (textRange) {
    var end = textRange.end - 1;

    if (/\s+$/.test(textRange.contents) && end >= 0) {
        textRange.textRanges[end].remove();
    }
};

TextBreak.removeNullCharacter = function (text) {
    if (!text.contents) {
        text.remove();
        return false;
    }

    return true;
};

TextBreak.captureSegmentSpecsFor = function (text, granularity) {
    var collection = TextBreak.getGranularityCollectionFor(text, granularity);
    var specs = [];
    var index;
    var segment;
    var end;

    for (index = 0; index < collection.length; index += 1) {
        segment = collection[index];
        end = segment.end;

        if (
            granularity === "words" &&
            end < text.textRanges.length &&
            /,|\.|:|;/.test(text.textRanges[end].contents)
        ) {
            end += 1;
        }

        specs.push({
            start: segment.start,
            end: end
        });
    }

    return specs;
};

TextBreak.captureSegmentSpecs = function (text) {
    return TextBreak.captureSegmentSpecsFor(text, TextBreak.granularity);
};

TextBreak.capturePointLineSpecs = function (text) {
    var specs = [];
    var start = 0;
    var index;
    var value;

    for (index = 0; index < text.textRanges.length; index += 1) {
        value = text.textRanges[index].contents;

        if (TextBreak.hasLinefeed(value)) {
            specs.push({
                start: start,
                end: index
            });
            start = index + 1;
        }
    }

    if (start < text.textRanges.length) {
        specs.push({
            start: start,
            end: text.textRanges.length
        });
    }

    if (!specs.length && text.contents) {
        specs.push({
            start: 0,
            end: text.textRanges.length
        });
    }

    return specs;
};

TextBreak.splitSegment = function (text, segment, granularity) {
    var mode = granularity || TextBreak.granularity;
    var justification = TextBreak.getJustification(text);
    var position;
    var trailingItem;
    var end;
    var last;

    if (text.lines.length === 1) {
        TextBreak.changeToLeftAlignment(text, justification);
    }

    position = {
        x: text.anchor[0],
        y: text.anchor[1]
    };

    trailingItem = text.duplicate();
    end = (mode === "words" && TextBreak.hasTrailingPunctuation(text, segment))
        ? TextBreak.getTrailingPunctuationPosition(text)
        : segment.end;
    last = text.textRanges.length;

    text = TextBreak.removeContents(text, end, last);
    text = TextBreak.moveToAnchor(text, position);

    trailingItem = TextBreak.removeContents(trailingItem, 0, end);
    if (TextBreak.hasLinefeed(trailingItem.contents)) {
        trailingItem = TextBreak.moveNextLine(trailingItem);
    } else {
        position = TextBreak.getTrailingAnchorPosition(text);
        trailingItem = TextBreak.moveToAnchor(trailingItem, position);
    }

    if (!trailingItem.contents) {
        trailingItem.remove();
        trailingItem = null;
    }

    if (text.lines.length === 1) {
        TextBreak.resetAlignment(text, justification);
        if (trailingItem) {
            TextBreak.resetAlignment(trailingItem, justification);
        }
    }

    TextBreak.removeTrailingSpaces(text.textRange);
    return trailingItem;
};

TextBreak.isolateRange = function (text, start, end) {
    var last = text.textRanges.length;

    TextBreak.removeContents(text, end, last);
    TextBreak.removeContents(text, 0, start);
    return text;
};

TextBreak.removeLeadingLinefeeds = function (text) {
    while (
        text &&
        text.textRanges &&
        text.textRanges.length &&
        TextBreak.hasLinefeed(text.textRanges[0].contents)
    ) {
        text.textRanges[0].remove();
    }

    return text;
};

TextBreak.applyGranularityCleanup = function (pieces) {
    var cleaned = [];
    var index;
    var piece;

    for (index = 0; index < pieces.length; index += 1) {
        piece = pieces[index];

        if (!piece) {
            continue;
        }

        if (TextBreak.granularity === "words") {
            TextBreak.removeLeadingSpace(piece);
        } else if (TextBreak.granularity === "characters") {
            if (!TextBreak.removeNullCharacter(piece)) {
                continue;
            }
        }

        cleaned.push(piece);
    }

    return cleaned;
};

TextBreak.applyTextAttributes = function (target, source) {
    var justification = TextBreak.getJustification(source);

    try {
        target.orientation = source.orientation;
    } catch (error) {}

    try {
        target.textRange.characterAttributes = source.textRange.characterAttributes;
    } catch (error) {}

    if (justification !== null) {
        try {
            target.paragraphs[0].paragraphAttributes.justification = justification;
        } catch (error) {}
    }
};

TextBreak.createPointTextFromTemplate = function (text) {
    var doc = app.activeDocument;
    var output = doc.textFrames.pointText([0, 0]);

    output.contents = text.contents;
    TextBreak.applyTextAttributes(output, text);

    try {
        output.left = text.left;
        output.top = text.top;
    } catch (error) {
        throw TextBreak.createSkipFailure(
            "areaTextPlacementNotReliable",
            "Unable to create stable point-text placement from the selected area text."
        );
    }

    return output;
};

TextBreak.createIsolatedDuplicate = function (source, start, end) {
    return TextBreak.isolateRange(source.duplicate(), start, end);
};

TextBreak.getPointLineAdvance = function (source) {
    var angle = TextBreak.getRotationAngle(source);
    var leading = TextBreak.getLeading(source);

    if (!leading || leading <= 0) {
        try {
            leading = source.textRange.characterAttributes.size * 1.2;
        } catch (error) {
            leading = 14.4;
        }
    }

    if (source.orientation === TextOrientation.VERTICAL) {
        return {
            x: leading * Math.cos(angle) * -1,
            y: leading * Math.sin(angle) * -1
        };
    }

    return {
        x: leading * Math.sin(angle),
        y: leading * Math.cos(angle) * -1
    };
};

TextBreak.measurePointLineAnchors = function (source) {
    var lineSpecs = TextBreak.capturePointLineSpecs(source);
    var advance = TextBreak.getPointLineAdvance(source);
    var anchors = [];
    var baseAnchor = source.anchor;
    var index;

    for (index = 0; index < lineSpecs.length; index += 1) {
        anchors.push({
            x: baseAnchor[0] + (advance.x * index),
            y: baseAnchor[1] + (advance.y * index)
        });
    }

    return anchors;
};

TextBreak.buildPointLineFrames = function (source) {
    var lineSpecs = TextBreak.capturePointLineSpecs(source);
    var lineAnchors = TextBreak.measurePointLineAnchors(source);
    var lineFrames = [];
    var index;
    var lineFrame;

    if (lineSpecs.length !== lineAnchors.length) {
        throw TextBreak.createSkipFailure(
            "pointTextPrecisionBlocked",
            "Point text line measurements did not match the source line count."
        );
    }

    try {
        for (index = 0; index < lineSpecs.length; index += 1) {
            lineFrame = TextBreak.createIsolatedDuplicate(source, lineSpecs[index].start, lineSpecs[index].end);
            TextBreak.removeLeadingLinefeeds(lineFrame);
            TextBreak.moveToAnchor(lineFrame, lineAnchors[index]);
            lineFrames.push(lineFrame);
        }

        return lineFrames;
    } catch (error) {
        TextBreak.removeItems(lineFrames);
        throw error;
    }
};

TextBreak.measurePointSegmentAnchor = function (lineFrame, start) {
    var prefix;
    var anchor;

    if (start <= 0) {
        return {
            x: lineFrame.anchor[0],
            y: lineFrame.anchor[1]
        };
    }

    prefix = TextBreak.createIsolatedDuplicate(lineFrame, 0, start);

    try {
        TextBreak.removeLeadingLinefeeds(prefix);

        if (!prefix.contents) {
            return {
                x: lineFrame.anchor[0],
                y: lineFrame.anchor[1]
            };
        }

        anchor = TextBreak.getTrailingAnchorPosition(prefix);
        prefix.remove();
        return anchor;
    } catch (error) {
        try {
            prefix.remove();
        } catch (removeError) {}
        throw error;
    }
};

TextBreak.splitPointLineFrame = function (lineFrame) {
    var segmentSpecs = TextBreak.captureSegmentSpecs(lineFrame);
    var outputs = [];
    var index;
    var output;
    var anchor;
    var cleaned;

    try {
        for (index = 0; index < segmentSpecs.length; index += 1) {
            anchor = TextBreak.measurePointSegmentAnchor(lineFrame, segmentSpecs[index].start);
            output = TextBreak.createIsolatedDuplicate(lineFrame, segmentSpecs[index].start, segmentSpecs[index].end);
            TextBreak.moveToAnchor(output, anchor);
            cleaned = TextBreak.applyGranularityCleanup([output]);

            if (cleaned.length) {
                outputs.push(cleaned[0]);
            }
        }

        return outputs;
    } catch (error) {
        TextBreak.removeItems(outputs);
        throw error;
    }
};

TextBreak.splitPointSourceFrame = function (frame) {
    var lineFrames = TextBreak.buildPointLineFrames(frame);
    var outputs = [];
    var index;
    var pieces;

    if (TextBreak.granularity === "lines") {
        try {
            frame.remove();
        } catch (error) {}
        return lineFrames;
    }

    try {
        for (index = 0; index < lineFrames.length; index += 1) {
            pieces = TextBreak.splitPointLineFrame(lineFrames[index]);
            outputs = outputs.concat(pieces);
        }

        try {
            frame.remove();
        } catch (removeError) {}
        TextBreak.removeItems(lineFrames);
        return outputs;
    } catch (error) {
        try {
            frame.remove();
        } catch (removeError) {}
        TextBreak.removeItems(outputs);
        TextBreak.removeItems(lineFrames);
        throw error;
    }
};

TextBreak.splitAreaWorkingFrame = function (frame) {
    var specs = TextBreak.captureSegmentSpecs(frame);
    var pieces = [];
    var index;
    var temp;
    var output;

    try {
        for (index = 0; index < specs.length; index += 1) {
            temp = frame.duplicate();
            temp = TextBreak.isolateRange(temp, specs[index].start, specs[index].end);
            temp = TextBreak.applyGranularityCleanup([temp]);

            if (!temp.length) {
                continue;
            }

            output = TextBreak.createPointTextFromTemplate(temp[0]);
            pieces.push(output);
            TextBreak.removeItems(temp);
        }

        try {
            frame.remove();
        } catch (error) {}

        return pieces;
    } catch (error) {
        TextBreak.removeItems(pieces);
        throw error.textBreakSkipReason
            ? error
            : TextBreak.createSkipFailure(
                "areaTextPlacementNotReliable",
                "Unable to place split area text reliably."
            );
    }
};

TextBreak.splitWorkingFrame = function (frame) {
    if (frame.kind === TextType.AREATEXT) {
        return TextBreak.splitAreaWorkingFrame(frame);
    }

    return TextBreak.splitPointSourceFrame(frame);
};
