import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProcessingOptions, hydratePreset } from './processing_options.js';

test('hydratePreset defaults legacy pasteboard presets to standard mode', () => {
    const hydrated = hydratePreset({
        id: 'legacy',
        label: 'Legacy',
        info_template: 'old custom text',
        rawValues: {
            info_template: 'old custom text'
        }
    });

    assert.equal(hydrated.rawValues.pasteboard_mode, 'standard');
    assert.equal(hydrated.processingOptions.postflight.pasteboardMode, 'standard');
    assert.equal(hydrated.rawValues.info_template, 'old custom text');
});

test('buildProcessingOptions preserves explicit custom and off pasteboard modes', () => {
    assert.equal(
        buildProcessingOptions({ pasteboard_mode: 'custom', info_template: 'Custom' }).postflight.pasteboardMode,
        'custom'
    );
    assert.equal(
        buildProcessingOptions({ pasteboard_mode: 'off', info_template: 'Custom' }).postflight.pasteboardMode,
        'off'
    );
});
