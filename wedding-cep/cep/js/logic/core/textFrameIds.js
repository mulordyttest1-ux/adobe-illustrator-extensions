/**
 * MODULE: TextFrameIds
 * LAYER: Logic/Core
 * PURPOSE: Mirror the stable text frame ID contract used at the CEP/JSX boundary
 * DEPENDENCIES: None
 * SIDE EFFECTS: None
 * EXPORTS: getStableTextFrameId, mapTextFramesByStableId, selectTextFramesByStableId
 */

function getContentLength(frame) {
    if (!frame || typeof frame.contents !== 'string') {
        return 0;
    }
    return frame.contents.length;
}

export function getStableTextFrameId(frame, index) {
    if (frame && typeof frame.uuid === 'string' && frame.uuid.length > 0) {
        return frame.uuid;
    }

    const top = Math.round((frame && frame.top) || 0);
    const left = Math.round((frame && frame.left) || 0);
    const contentLength = getContentLength(frame);
    return `tf_${top}_${left}_${contentLength}_${index}`;
}

export function mapTextFramesByStableId(frames = []) {
    const map = {};
    for (let index = 0; index < frames.length; index += 1) {
        const frame = frames[index];
        map[getStableTextFrameId(frame, index)] = frame;
    }
    return map;
}

export function selectTextFramesByStableId(frames = [], ids = []) {
    const frameMap = mapTextFramesByStableId(frames);
    const selected = [];

    for (let index = 0; index < ids.length; index += 1) {
        const match = frameMap[ids[index]];
        if (match) {
            selected.push(match);
        }
    }

    return selected;
}
