import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildNormalizedConfigState,
    buildPresetOptionsMarkup,
    buildStorageWarningMarkup,
    captureConfigTabUiState,
    resolveFormMetaValues,
    restoreConfigTabUiState
} from './configTabStateService.js';

function createDocument(elements) {
    return {
        getElementById(id) {
            return elements[id] || null;
        }
    };
}

test('resolveFormMetaValues reads hidden preset fields and preserves fallback defaults', () => {
    const meta = resolveFormMetaValues(
        {
            elements: {
                preset_id: { value: 'preset_a4' },
                preset_name: { value: 'A4' }
            }
        },
        { presetId: 'fallback', presetName: 'Fallback' }
    );

    assert.deepEqual(meta, {
        presetId: 'preset_a4',
        presetName: 'A4'
    });
});

test('buildNormalizedConfigState hydrates raw values against the active schema', () => {
    const normalized = buildNormalizedConfigState(
        {
            rawValues: { finish_w: '120' },
            formMeta: { presetId: 'preset_a4', presetName: 'A4' },
            activeSchema: { sections: [{ id: 'base' }] }
        },
        {
            hydratePreset: (preset) => ({
                rawValues: {
                    ...preset.rawValues,
                    normalized: true
                }
            })
        }
    );

    assert.deepEqual(normalized, {
        finish_w: '120',
        normalized: true
    });
});

test('captureConfigTabUiState reads pane state and form metadata from the current document', () => {
    const snapshot = captureConfigTabUiState(
        {
            paneRenderer: {
                readValues() {
                    return { copies: '2' };
                }
            },
            formMeta: { presetId: '', presetName: '' },
            selectedPresetId: ''
        },
        {
            document: createDocument({
                'load-preset-select': { value: 'preset_a4' },
                preset_id: { value: 'preset_a4' },
                preset_name: { value: 'A4' }
            })
        }
    );

    assert.deepEqual(snapshot, {
        formState: { copies: '2' },
        formMeta: {
            presetId: 'preset_a4',
            presetName: 'A4'
        },
        selectedPresetId: 'preset_a4'
    });
});

test('restoreConfigTabUiState writes selected preset and form meta back to the document', () => {
    const elements = {
        'load-preset-select': { value: '' },
        preset_id: { value: '' },
        preset_name: { value: '' }
    };

    restoreConfigTabUiState(
        {
            formMeta: { presetId: 'preset_a4', presetName: 'A4' },
            selectedPresetId: 'preset_a4'
        },
        {
            document: createDocument(elements)
        }
    );

    assert.equal(elements['load-preset-select'].value, 'preset_a4');
    assert.equal(elements.preset_id.value, 'preset_a4');
    assert.equal(elements.preset_name.value, 'A4');
});

test('buildStorageWarningMarkup renders warning HTML only for degraded storage health', () => {
    const warningMarkup = buildStorageWarningMarkup({
        getStorageHealth: () => ({
            reason: 'write_denied',
            message: 'Storage is read-only.'
        })
    });
    const okMarkup = buildStorageWarningMarkup({
        getStorageHealth: () => ({
            reason: 'ok',
            message: ''
        })
    });

    assert.match(warningMarkup, /write_denied/);
    assert.match(warningMarkup, /Storage is read-only/);
    assert.equal(okMarkup, '');
});

test('buildPresetOptionsMarkup renders preset options from the provided list surface', () => {
    const markup = buildPresetOptionsMarkup({
        listPresets: () => ([
            { id: 'preset_a4', label: 'A4' },
            { id: 'preset_a5', label: 'A5' }
        ])
    });

    assert.match(markup, /preset_a4/);
    assert.match(markup, /preset_a5/);
});
