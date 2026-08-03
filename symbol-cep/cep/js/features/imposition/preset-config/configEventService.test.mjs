import test from 'node:test';
import assert from 'node:assert/strict';

import {
    handleConfigChange,
    handleConfigClick,
    handleConfigSubmit
} from './configEventService.js';

test('handleConfigSubmit prevents default and delegates preset save only for config-form', async () => {
    const calls = [];
    const event = {
        target: { id: 'config-form' },
        preventDefault() {
            calls.push('preventDefault');
        }
    };

    const handled = await handleConfigSubmit(event, { id: 'tab' }, {
        savePreset: async (form, allowUpdate, tab) => {
            calls.push(['savePreset', form.id, allowUpdate, tab.id]);
        }
    });

    assert.equal(handled, true);
    assert.deepEqual(calls, [
        'preventDefault',
        ['savePreset', 'config-form', true, 'tab']
    ]);
});

test('handleConfigChange loads a preset when dropdown has a value and resets draft when blank', async () => {
    const calls = [];
    const tab = {
        resetDraft() {
            calls.push('resetDraft');
        }
    };

    const handledLoad = await handleConfigChange(
        { target: { id: 'load-preset-select', value: 'preset_a4' } },
        tab,
        {
            loadPreset: (id) => calls.push(['loadPreset', id])
        }
    );

    const handledReset = await handleConfigChange(
        { target: { id: 'load-preset-select', value: '' } },
        tab,
        {
            loadPreset: (id) => calls.push(['loadPreset', id])
        }
    );

    assert.equal(handledLoad, true);
    assert.equal(handledReset, true);
    assert.deepEqual(calls, [
        ['loadPreset', 'preset_a4'],
        'resetDraft'
    ]);
});

test('handleConfigChange cancels a dirty draft without loading the next preset', async () => {
    const calls = [];
    const select = {
        id: 'load-preset-select',
        value: 'preset_next',
        dataset: {},
        setAttribute(name, value) {
            this.dataset[name] = value;
        }
    };
    const tab = {
        selectedPresetId: 'preset_current',
        isDirty() {
            return true;
        },
        async requestDiscardChanges() {
            calls.push('requestDiscardChanges');
            return false;
        }
    };

    const handled = await handleConfigChange(
        { target: select },
        tab,
        {
            loadPreset: () => calls.push('loadPreset')
        }
    );

    assert.equal(handled, false);
    assert.equal(select.value, 'preset_current');
    assert.deepEqual(calls, ['requestDiscardChanges']);
});

test('handleConfigClick routes edit toggle, modal actions, and dry run through the workflow service', async () => {
    const calls = [];
    const modal = { style: { display: 'flex' } };
    const tab = {
        isEditMode: false,
        render() {
            calls.push('render');
        },
        handleModalConfirm() {
            calls.push('confirmModal');
        }
    };

    await handleConfigClick(
        { target: { id: 'btn-toggle-edit' } },
        tab,
        {
            document: {
                getElementById() {
                    return null;
                }
            }
        }
    );

    await handleConfigClick(
        { target: { id: 'btn-cancel-modal' } },
        tab,
        {
            document: {
                getElementById(id) {
                    return id === 'modal-add-field' ? modal : null;
                }
            }
        }
    );

    await handleConfigClick(
        { target: { id: 'btn-confirm-modal' } },
        tab,
        {
            document: {
                getElementById() {
                    return null;
                }
            }
        }
    );

    await handleConfigClick(
        { target: { id: 'btn-dry-run' } },
        tab,
        {
            document: {
                getElementById(id) {
                    return id === 'config-form' ? { id: 'config-form' } : null;
                }
            },
            runDry: async (form) => {
                calls.push(['dryRun', form.id]);
            }
        }
    );

    assert.equal(tab.isEditMode, true);
    assert.equal(modal.style.display, 'none');
    assert.deepEqual(calls, [
        'render',
        'confirmModal',
        ['dryRun', 'config-form']
    ]);
});

test('handleConfigClick routes save-output directory picker actions through the tab seam', async () => {
    const calls = [];
    const handled = await handleConfigClick(
        {
            target: {
                id: '',
                closest(selector) {
                    if (selector === '[data-config-action]') {
                        return {
                            getAttribute() {
                                return 'pick-save-output-dir';
                            }
                        };
                    }
                    return null;
                }
            }
        },
        {
            async pickSaveOutputDirectory() {
                calls.push('pickSaveOutputDirectory');
            }
        },
        {
            document: {
                getElementById() {
                    return null;
                }
            }
        }
    );

    assert.equal(handled, true);
    assert.deepEqual(calls, ['pickSaveOutputDirectory']);
});
