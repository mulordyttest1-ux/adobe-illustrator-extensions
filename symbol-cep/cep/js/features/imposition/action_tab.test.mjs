import test from 'node:test';
import assert from 'node:assert/strict';

import { ActionTab } from './action_tab.js';

function encodeUtf8Base64(value) {
    return Buffer.from(value, 'utf8').toString('base64');
}

function createPresetRepository(getByIdImpl) {
    return {
        getById: getByIdImpl,
        incrementUsage() {
            return { success: true };
        },
        getPresets() {
            return [];
        },
        getStorageHealth() {
            return { reason: 'ok', message: '' };
        }
    };
}

test('ActionTab render dropdown save actions without the overwrite button', () => {
    const tab = new ActionTab({
        notifier: {
            showToast() {}
        }
    });
    const container = { innerHTML: '' };

    tab.filteredPresets = [{
        id: 'preset_save',
        label: 'Preset Save',
        rawValues: {
            save_output_dir: 'C:/Output'
        }
    }];
    tab.selectedIndex = 0;

    tab._renderDropdownContent(container);

    assert.doesNotMatch(container.innerHTML, /data-trigger-mode="overwrite"/);
    assert.doesNotMatch(container.innerHTML, />Luu de</);
    assert.match(container.innerHTML, /data-trigger-mode="save_as_new"/);
});

test('ActionTab render manager save actions without the overwrite button', () => {
    const tab = new ActionTab({
        notifier: {
            showToast() {}
        }
    });
    const container = { innerHTML: '' };

    tab._renderManagerList(container, [{
        id: 'preset_save',
        label: 'Preset Save',
        rawValues: {
            save_output_dir: 'C:/Output'
        }
    }]);

    assert.doesNotMatch(container.innerHTML, /data-trigger-mode="overwrite"/);
    assert.doesNotMatch(container.innerHTML, />Luu de</);
    assert.match(container.innerHTML, /data-trigger-mode="run_only"/);
    assert.match(container.innerHTML, /data-trigger-mode="save_as_new"/);
});

test('ActionTab handleTrigger uses the injected preset repository instead of the concrete data store', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return { id, label: 'Preset A' };
        }),
        notifier: {
            showToast() {}
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async (preset, runContext, saveMode) => {
        calls.push(['runWithPreset', preset.id, preset.label, runContext, saveMode]);
    };

    await tab.handleTrigger('preset_a4');

    assert.deepEqual(calls, [
        ['getById', 'preset_a4'],
        ['renderList'],
        ['runWithPreset', 'preset_a4', 'Preset A', null, 'run_only']
    ]);
});

test('ActionTab handleTrigger routes save_as_new through save-only flow for ordinary save-enabled presets', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                rawValues: {
                    save_output_dir: 'C:/Output',
                    save_filename_prefix: 'Mac dinh'
                }
            };
        }),
        notifier: {
            showToast() {}
        },
        async requestSaveFilenamePrefix(options) {
            calls.push(['requestSaveFilenamePrefix', options.initialValue, options.title]);
            return 'Bai in moi';
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };
    tab.saveOnlyWithPreset = async (preset, runContext, saveMode) => {
        calls.push(['saveOnlyWithPreset', preset.id, preset.rawValues.save_filename_prefix, runContext, saveMode]);
    };

    await tab.handleTrigger('preset_save', null, 'save_as_new');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['requestSaveFilenamePrefix', '', 'Nhap ten file moi'],
        ['renderList'],
        ['saveOnlyWithPreset', 'preset_save', 'Bai in moi', {
            presetId: 'preset_save',
            documentIdentity: null,
            jobKey: '',
            rememberedTarget: null
        }, 'save_as_new']
    ]);
});

test('ActionTab save_as_new prompts with the active AI filename stripped of the generated timestamp', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                rawValues: {
                    save_output_dir: 'C:/Output',
                    save_filename_prefix: 'Mac dinh'
                }
            };
        }),
        hostGateway: {
            async getActiveDocumentIdentity() {
                calls.push(['getActiveDocumentIdentity']);
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    documentPath: "C:/Output/thien nin m15_15'55 3 6.ai",
                    documentName: "thien nin m15_15'55 3 6.ai",
                    isSaved: true
                }));
            }
        },
        jobSaveTargetStore: {
            buildKey(presetId, documentPath) {
                calls.push(['buildKey', presetId, documentPath]);
                return `${presetId}::${documentPath}`;
            },
            get(presetId, documentPath) {
                calls.push(['getRememberedTarget', presetId, documentPath]);
                return null;
            },
            remember() {
                calls.push(['remember']);
                return null;
            }
        },
        notifier: {
            showToast() {}
        },
        async requestSaveFilenamePrefix(options) {
            calls.push(['requestSaveFilenamePrefix', options.initialValue]);
            return 'thien nin m15';
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.saveOnlyWithPreset = async (preset, runContext, saveMode) => {
        calls.push([
            'saveOnlyWithPreset',
            preset.rawValues.save_filename_prefix,
            runContext && runContext.documentIdentity ? runContext.documentIdentity.documentPath : '',
            runContext && runContext.rememberedTarget ? runContext.rememberedTarget.targetPath : '',
            saveMode
        ]);
    };

    await tab.handleTrigger('preset_save', null, 'save_as_new');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['getActiveDocumentIdentity'],
        ['buildKey', 'preset_save', "C:/Output/thien nin m15_15'55 3 6.ai"],
        ['getRememberedTarget', 'preset_save', "C:/Output/thien nin m15_15'55 3 6.ai"],
        ['requestSaveFilenamePrefix', 'thien nin m15'],
        ['renderList'],
        [
            'saveOnlyWithPreset',
            'thien nin m15',
            "C:/Output/thien nin m15_15'55 3 6.ai",
            "C:/Output/thien nin m15_15'55 3 6.ai",
            'save_as_new'
        ]
    ]);
});

test('ActionTab handleTrigger aborts cleanly when save_as_new prompt is cancelled', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                rawValues: {
                    save_output_dir: 'C:/Output'
                }
            };
        }),
        notifier: {
            showToast() {}
        },
        async requestSaveFilenamePrefix() {
            calls.push(['requestSaveFilenamePrefix']);
            return null;
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };

    await tab.handleTrigger('preset_save', null, 'save_as_new');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['requestSaveFilenamePrefix']
    ]);
});

test('ActionTab handleTrigger routes overwrite through save-only flow for ordinary save-enabled presets', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                rawValues: {
                    save_output_dir: 'C:/Output',
                    save_filename_prefix: 'Mac dinh'
                }
            };
        }),
        hostGateway: {
            async getActiveDocumentIdentity() {
                calls.push(['getActiveDocumentIdentity']);
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    documentPath: 'C:/Output/current-open.ai',
                    documentName: 'current-open.ai',
                    isSaved: false
                }));
            }
        },
        jobSaveTargetStore: {
            buildKey(presetId, documentPath) {
                calls.push(['buildKey', presetId, documentPath]);
                return `${presetId}::${documentPath}`;
            },
            get(presetId, documentPath) {
                calls.push(['getRememberedTarget', presetId, documentPath]);
                return null;
            },
            remember() {
                calls.push(['remember']);
                return null;
            }
        },
        notifier: {
            showToast() {}
        },
        async requestSaveFilenamePrefix() {
            calls.push(['requestSaveFilenamePrefix']);
            return 'Khong duoc goi';
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };
    tab.saveOnlyWithPreset = async (preset, runContext, saveMode) => {
        calls.push([
            ['saveOnlyWithPreset', preset.id, runContext && runContext.rememberedTarget ? runContext.rememberedTarget.targetPath : null, saveMode]
        ][0]);
    };

    await tab.handleTrigger('preset_save', null, 'overwrite');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['getActiveDocumentIdentity'],
        ['buildKey', 'preset_save', 'C:/Output/current-open.ai'],
        ['getRememberedTarget', 'preset_save', 'C:/Output/current-open.ai'],
        ['renderList'],
        ['saveOnlyWithPreset', 'preset_save', 'C:/Output/current-open.ai', 'overwrite']
    ]);
});

test('ActionTab handleTrigger blocks overwrite when the current document has no saved path yet', async () => {
    const calls = [];
    const toasts = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                rawValues: {
                    save_output_dir: 'C:/Output'
                }
            };
        }),
        hostGateway: {
            async getActiveDocumentIdentity() {
                calls.push(['getActiveDocumentIdentity']);
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    documentPath: '',
                    documentName: 'Untitled-59',
                    isSaved: false
                }));
            }
        },
        jobSaveTargetStore: {
            buildKey(presetId, documentPath) {
                calls.push(['buildKey', presetId, documentPath]);
                return `${presetId}::${documentPath}`;
            },
            get(presetId, documentPath) {
                calls.push(['getRememberedTarget', presetId, documentPath]);
                return null;
            },
            remember() {
                calls.push(['remember']);
                return null;
            }
        },
        notifier: {
            showToast(message, tone) {
                toasts.push({ message, tone });
            }
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };

    await tab.handleTrigger('preset_save', null, 'overwrite');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['getActiveDocumentIdentity'],
        ['buildKey', 'preset_save', ''],
        ['getRememberedTarget', 'preset_save', '']
    ]);
    assert.deepEqual(toasts, [{
        message: 'File hien tai chua co duong dan luu. Hay Save file nay hoac dung Luu moi lan dau.',
        tone: 'warning'
    }]);
});

test('ActionTab handleTrigger keeps run_only available for save-enabled presets', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                rawValues: {
                    save_output_dir: 'C:/Output'
                }
            };
        }),
        notifier: {
            showToast() {}
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async (preset, runContext, saveMode) => {
        calls.push(['runWithPreset', preset.id, runContext, saveMode]);
    };

    await tab.handleTrigger('preset_save');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['renderList'],
        ['runWithPreset', 'preset_save', null, 'run_only']
    ]);
});

test('ActionTab handleTrigger ignores preset save policy metadata for save buttons', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Save',
                saveActionBehavior: 'run_then_save',
                rawValues: {
                    save_output_dir: 'C:/Output',
                    save_filename_prefix: 'Mac dinh',
                    save_action_behavior: 'run_then_save'
                }
            };
        }),
        notifier: {
            showToast() {}
        },
        async requestSaveFilenamePrefix() {
            calls.push(['requestSaveFilenamePrefix']);
            return 'Ban luu moi';
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };
    tab.saveOnlyWithPreset = async (preset, runContext, saveMode) => {
        calls.push(['saveOnlyWithPreset', preset.id, preset.rawValues.save_filename_prefix, runContext, saveMode]);
    };

    await tab.handleTrigger('preset_save', null, 'save_as_new');

    assert.deepEqual(calls, [
        ['getById', 'preset_save'],
        ['requestSaveFilenamePrefix'],
        ['renderList'],
        ['saveOnlyWithPreset', 'preset_save', 'Ban luu moi', {
            presetId: 'preset_save',
            documentIdentity: null,
            jobKey: '',
            rememberedTarget: null
        }, 'save_as_new']
    ]);
});

test('ActionTab handleTrigger uses the standard save-only flow for Thiệp save_as_new', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Thiệp',
                rawValues: {
                    save_output_dir: 'C:/Output',
                    save_filename_prefix: 'Thiep'
                }
            };
        }),
        notifier: {
            showToast() {}
        },
        async requestSaveFilenamePrefix() {
            calls.push(['requestSaveFilenamePrefix']);
            return 'Thiep moi';
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };
    tab.saveOnlyWithPreset = async (preset, runContext, saveMode) => {
        calls.push(['saveOnlyWithPreset', preset.id, preset.rawValues.save_filename_prefix, runContext, saveMode]);
    };

    await tab.handleTrigger('preset_thiep', null, 'save_as_new');

    assert.deepEqual(calls, [
        ['getById', 'preset_thiep'],
        ['requestSaveFilenamePrefix'],
        ['renderList'],
        ['saveOnlyWithPreset', 'preset_thiep', 'Thiep moi', {
            presetId: 'preset_thiep',
            documentIdentity: null,
            jobKey: '',
            rememberedTarget: null
        }, 'save_as_new']
    ]);
});

test('ActionTab handleTrigger keeps hidden overwrite mode on the save-only route when invoked directly', async () => {
    const calls = [];
    const tab = new ActionTab({
        presetRepository: createPresetRepository((id) => {
            calls.push(['getById', id]);
            return {
                id,
                label: 'Preset Hidden Overwrite',
                rawValues: {
                    save_output_dir: 'C:/Output'
                }
            };
        }),
        hostGateway: {
            async getActiveDocumentIdentity() {
                calls.push(['getActiveDocumentIdentity']);
                return encodeUtf8Base64(JSON.stringify({
                    success: true,
                    documentPath: 'C:/Output/current-open.ai',
                    documentName: 'current-open.ai',
                    isSaved: true
                }));
            }
        },
        jobSaveTargetStore: {
            buildKey(presetId, documentPath) {
                calls.push(['buildKey', presetId, documentPath]);
                return `${presetId}::${documentPath}`;
            },
            get(presetId, documentPath) {
                calls.push(['getRememberedTarget', presetId, documentPath]);
                return null;
            },
            remember() {
                calls.push(['remember']);
                return null;
            }
        },
        notifier: {
            showToast() {}
        }
    });

    tab.renderList = () => {
        calls.push(['renderList']);
    };
    tab.runWithPreset = async () => {
        calls.push(['runWithPreset']);
    };
    tab.saveOnlyWithPreset = async (preset, runContext, saveMode) => {
        calls.push(['saveOnlyWithPreset', preset.id, runContext && runContext.rememberedTarget ? runContext.rememberedTarget.targetPath : null, saveMode]);
    };

    await tab.handleTrigger('preset_hidden_overwrite', null, 'overwrite');

    assert.deepEqual(calls, [
        ['getById', 'preset_hidden_overwrite'],
        ['getActiveDocumentIdentity'],
        ['buildKey', 'preset_hidden_overwrite', 'C:/Output/current-open.ai'],
        ['getRememberedTarget', 'preset_hidden_overwrite', 'C:/Output/current-open.ai'],
        ['renderList'],
        ['saveOnlyWithPreset', 'preset_hidden_overwrite', 'C:/Output/current-open.ai', 'overwrite']
    ]);
});
