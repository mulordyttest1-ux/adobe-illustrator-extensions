import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    getStableTextFrameId,
    mapTextFramesByStableId,
    selectTextFramesByStableId
} from './textFrameIds.js';

describe('textFrameIds', () => {
    it('prefers illustrator uuid when present', () => {
        const frame = {
            uuid: 'uuid-frame-1',
            top: 10,
            left: 20,
            contents: 'Hello'
        };

        assert.equal(getStableTextFrameId(frame, 7), 'uuid-frame-1');
    });

    it('builds fallback stable ids from coordinates, content length, and index', () => {
        const frame = {
            top: 100.49,
            left: -40.51,
            contents: 'ABCDE'
        };

        assert.equal(getStableTextFrameId(frame, 2), 'tf_100_-41_5_2');
    });

    it('maps and selects frames by stable uuid instead of array index', () => {
        const frames = [
            { uuid: 'frame-a', contents: 'A', top: 1, left: 1 },
            { uuid: 'frame-b', contents: 'B', top: 2, left: 2 },
            { uuid: 'frame-c', contents: 'C', top: 3, left: 3 }
        ];

        const frameMap = mapTextFramesByStableId(frames);
        assert.equal(frameMap['frame-b'], frames[1]);

        const selected = selectTextFramesByStableId(frames, ['frame-c', 'missing', 'frame-a']);
        assert.deepEqual(selected, [frames[2], frames[0]]);
    });
});
