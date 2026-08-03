import test from 'node:test';
import assert from 'node:assert/strict';

import { ConfigTab } from './config_tab.js';

function createCanonicalDraftRepository(savedDrafts) {
    return {
        getDraftById(id) {
            return {
                success: true,
                draft: {
                    modelVersion: 1,
                    id,
                    label: 'Preset A',
                    schemaId: 'standard_imposition',
                    schemaExtensions: { marginRows: [] },
                    values: {
                        finish_w: '120',
                        finish_h: '180'
                    }
                }
            };
        },
        saveDraft(draft) {
            savedDrafts.push(draft);
            return {
                success: true,
                preset: {
                    id: draft.id,
                    label: draft.label,
                    rawValues: {
                        ...draft.values,
                        preset_id: draft.id,
                        preset_name: draft.label
                    }
                }
            };
        },
        getPresets() {
            return [];
        },
        getStorageHealth() {
            return { reason: 'ok', message: '' };
        }
    };
}

test('ConfigTab resetDraft clears the draft and re-renders without persistence side effects', () => {
    const calls = [];
    const tab = new ConfigTab({
        presetRepository: {
            getPresets() {
                return [];
            },
            getStorageHealth() {
                return { reason: 'ok', message: '' };
            }
        }
    });

    tab.render = () => {
        calls.push(['render']);
    };

    tab.resetDraft();

    assert.deepEqual(calls, [
        ['render']
    ]);
});

test('ConfigTab pickSaveOutputDirectory stores the selected path through pane state', async () => {
    const toasts = [];
    const tab = new ConfigTab({
        notifier: {
            showToast(message, tone) {
                toasts.push({ message, tone });
            }
        },
        pickDirectory() {
            return 'C:/Jobs/Output';
        },
        presetRepository: {
            getPresets() {
                return [];
            },
            getStorageHealth() {
                return { reason: 'ok', message: '' };
            }
        }
    });

    tab.readRawValues = () => ({ save_output_dir: '' });
    tab.paneRenderer = {
        applyValues(values) {
            tab.formState = values;
        }
    };

    const picked = await tab.pickSaveOutputDirectory();

    assert.equal(picked, true);
    assert.equal(tab.formState.save_output_dir, 'C:/Jobs/Output');
    assert.deepEqual(toasts, [{
        message: 'Da chon thu muc luu cho ban nhap nay. Hay bam Luu Preset de ap dung cho tab Chay.',
        tone: 'success'
    }]);
});

test('ConfigTab pickSaveOutputDirectory patches the loaded canonical draft only', async () => {
    const toasts = [];
    const savedDrafts = [];
    const tab = new ConfigTab({
        notifier: {
            showToast(message, tone) {
                toasts.push({ message, tone });
            }
        },
        pickDirectory() {
            return 'C:/Jobs/Output';
        },
        presetRepository: createCanonicalDraftRepository(savedDrafts)
    });

    tab.formMeta = {
        presetId: 'preset_a',
        presetName: 'Preset A'
    };
    tab.readRawValues = () => ({ save_output_dir: '' });
    tab.paneRenderer = {
        applyValues(values) {
            tab.formState = values;
        }
    };

    const picked = await tab.pickSaveOutputDirectory();

    assert.equal(picked, true);
    assert.equal(tab.formState.save_output_dir, 'C:/Jobs/Output');
    assert.deepEqual(savedDrafts, [{
        modelVersion: 1,
        id: 'preset_a',
        label: 'Preset A',
        schemaId: 'standard_imposition',
        schemaExtensions: { marginRows: [] },
        values: {
            finish_w: '120',
            finish_h: '180',
            save_output_dir: 'C:/Jobs/Output'
        }
    }]);
    assert.deepEqual(toasts, [{
        message: 'Da ap dung thu muc luu cho preset: Preset A',
        tone: 'success'
    }]);
});

test('ConfigTab folder picker does not write through a legacy-only repository', async () => {
    let legacyWriteCalled = false;
    const tab = new ConfigTab({
        notifier: {
            showToast() {}
        },
        pickDirectory() {
            return 'C:/Jobs/Output';
        },
        presetRepository: {
            getRawPresetById(id) {
                return {
                    id,
                    label: 'Legacy preset',
                    rawValues: {
                        finish_w: '120',
                        finish_h: '180'
                    }
                };
            },
            savePreset(preset) {
                legacyWriteCalled = !!preset;
                return { success: true };
            },
            getPresets() {
                return [];
            },
            getStorageHealth() {
                return { reason: 'ok', message: '' };
            }
        }
    });

    tab.formMeta = { presetId: 'preset_legacy', presetName: 'Legacy preset' };
    tab.readRawValues = () => ({ save_output_dir: '' });
    tab.paneRenderer = {
        applyValues(values) {
            tab.formState = values;
        }
    };

    const picked = await tab.pickSaveOutputDirectory();

    assert.equal(picked, true);
    assert.equal(tab.formState.save_output_dir, 'C:/Jobs/Output');
    assert.equal(legacyWriteCalled, false);
});
