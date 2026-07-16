import test from 'node:test';
import assert from 'node:assert/strict';

import { ConfigTab } from './config_tab.js';

test('ConfigTab resetDraft uses the injected persistence seam for last-active state', () => {
    const calls = [];
    const tab = new ConfigTab({
        persistence: {
            saveLastActive(id) {
                calls.push(['saveLastActive', id]);
            }
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

    tab.render = () => {
        calls.push(['render']);
    };

    tab.resetDraft();

    assert.deepEqual(calls, [
        ['saveLastActive', ''],
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

test('ConfigTab pickSaveOutputDirectory auto-applies the folder to the loaded preset only', async () => {
    const toasts = [];
    const savedPresets = [];
    const saveLastActiveCalls = [];
    const tab = new ConfigTab({
        notifier: {
            showToast(message, tone) {
                toasts.push({ message, tone });
            }
        },
        persistence: {
            saveLastActive(id) {
                saveLastActiveCalls.push(id);
            }
        },
        pickDirectory() {
            return 'C:/Jobs/Output';
        },
        presetRepository: {
            getRawPresetById(id) {
                return {
                    id,
                    label: 'Preset A',
                    rawValues: {
                        finish_w: '120',
                        finish_h: '180'
                    }
                };
            },
            savePreset(preset) {
                savedPresets.push(preset);
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
    assert.deepEqual(savedPresets, [{
        id: 'preset_a',
        label: 'Preset A',
        rawValues: {
            finish_w: '120',
            finish_h: '180',
            save_output_dir: 'C:/Jobs/Output'
        }
    }]);
    assert.deepEqual(saveLastActiveCalls, ['preset_a']);
    assert.deepEqual(toasts, [{
        message: 'Da ap dung thu muc luu cho preset: Preset A',
        tone: 'success'
    }]);
});
