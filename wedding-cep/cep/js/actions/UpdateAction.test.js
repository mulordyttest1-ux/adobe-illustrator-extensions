import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UpdateAction } from './UpdateAction.js';

function createButton() {
    return {
        disabled: false,
        textContent: 'Update'
    };
}

describe('UpdateAction', () => {
    it('routes the processed packet through strategy update and stays silent on success', async () => {
        const bridge = { id: 'bridge-1' };
        const button = createButton();
        const builder = {
            getData() {
                return {
                    'info.ten_le': 'Tan Hon',
                    'ui.vithu_nam': 'Truong Nam',
                    'ui.vithu_nu': 'Truong Nu'
                };
            }
        };
        const calls = {
            runUpdateDocument: [],
            runApplyStrategyUpdate: [],
            toasts: []
        };

        const result = await UpdateAction.execute(
            { hostFacade: bridge, builder, button },
            {
                getSchema: () => ({ STRUCTURE: [] }),
                runUpdateDocument: async ({ rawData, schema, applyUpdate }) => {
                    calls.runUpdateDocument.push({ rawData, schema });
                    const applyResult = await applyUpdate({ packet: 'processed' });
                    return {
                        success: applyResult.success,
                        updated: applyResult.updated,
                        affected: applyResult.affected,
                        formData: rawData,
                        schemaKeys: ['info.ten_le'],
                        schemaMeta: {
                            schemaKeys: ['info.ten_le'],
                            labelsByKey: { 'info.ten_le': 'Loai Le' },
                            groupByKey: { 'info.ten_le': 'Thong tin' },
                            groupRankByKey: { 'info.ten_le': 0 },
                            keyRankByKey: { 'info.ten_le': 0 },
                            derivedSuffixLabels: {}
                        },
                        templateBindings: ['info.ten_le']
                    };
                },
                runApplyStrategyUpdate: async ({ hostFacade: inputHostFacade, packet }) => {
                    calls.runApplyStrategyUpdate.push({ bridge: inputHostFacade, packet });
                    return {
                        success: true,
                        updated: 2,
                        affected: [{ id: 'frame-1' }]
                    };
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: true, updated: 2 });
        assert.deepEqual(calls.runApplyStrategyUpdate, [{
            bridge,
            packet: { packet: 'processed' }
        }]);
        assert.deepEqual(calls.toasts, []);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE4 Update');
    });

    it('shows an error toast when the strategy update path reports failure', async () => {
        const button = createButton();
        const calls = {
            runApplyStrategyUpdate: [],
            toasts: []
        };

        const result = await UpdateAction.execute(
            {
                hostFacade: { id: 'bridge-2' },
                builder: {
                    getData() {
                        return {
                            'pos1.ong': 'Ong A',
                            'info.ten_le': 'Tan Hon',
                            'ui.vithu_nam': 'Truong Nam',
                            'ui.vithu_nu': 'Truong Nu'
                        };
                    }
                },
                button
            },
            {
                getSchema: () => ({ STRUCTURE: [] }),
                runUpdateDocument: async ({ applyUpdate }) => {
                    const applyResult = await applyUpdate({ packet: 'processed' });
                    return {
                        success: false,
                        error: applyResult.error
                    };
                },
                runApplyStrategyUpdate: async ({ hostFacade, packet }) => {
                    calls.runApplyStrategyUpdate.push({ bridge: hostFacade, packet });
                    return {
                        success: false,
                        error: 'Strategy failed'
                    };
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: false, error: 'Strategy failed' });
        assert.deepEqual(calls.toasts, [{
            message: 'L\u1ed7i: Strategy failed',
            type: 'error'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE4 Update');
    });

    it('shows an info toast when update completes as a no-op', async () => {
        const button = createButton();
        const calls = {
            toasts: []
        };

        const result = await UpdateAction.execute(
            {
                hostFacade: { id: 'bridge-noop' },
                builder: {
                    getData() {
                        return {
                            'info.ten_le': 'Tan Hon',
                            'ui.vithu_nam': 'Truong Nam',
                            'ui.vithu_nu': 'Truong Nu'
                        };
                    }
                },
                button
            },
            {
                getSchema: () => ({ STRUCTURE: [] }),
                runUpdateDocument: async () => ({
                    success: true,
                    updated: 0,
                    affected: [],
                    formData: { 'info.ten_le': 'Tan Hon' },
                    schemaKeys: ['info.ten_le'],
                    schemaMeta: {
                        schemaKeys: ['info.ten_le'],
                        labelsByKey: { 'info.ten_le': 'Loai Le' },
                        groupByKey: { 'info.ten_le': 'Thong tin' },
                        groupRankByKey: { 'info.ten_le': 0 },
                        keyRankByKey: { 'info.ten_le': 0 },
                        derivedSuffixLabels: {}
                    },
                    templateBindings: []
                }),
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: true, updated: 0 });
        assert.deepEqual(calls.toasts, [{
            message: 'Kh\u00f4ng c\u00f3 thay \u0111\u1ed5i n\u00e0o \u0111\u01b0\u1ee3c \u00e1p d\u1ee5ng trong v\u00f9ng ch\u1ecdn hi\u1ec7n t\u1ea1i.',
            type: 'info'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE4 Update');
    });

    it('blocks update when required radio selections are still empty', async () => {
        const button = createButton();
        const calls = {
            toasts: [],
            runUpdateDocument: 0
        };

        const result = await UpdateAction.execute(
            {
                hostFacade: { id: 'bridge-missing-radio' },
                builder: {
                    getData() {
                        return {
                            'info.ten_le': 'Tan Hon',
                            'ui.vithu_nam': 'Truong Nam',
                            'ui.vithu_nu': ''
                        };
                    }
                },
                button
            },
            {
                getSchema: () => ({ STRUCTURE: [] }),
                runUpdateDocument: async () => {
                    calls.runUpdateDocument += 1;
                    return { success: true, updated: 1 };
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'MISSING_REQUIRED_SELECTIONS',
            missingSelections: ['ui.vithu_nu']
        });
        assert.equal(calls.runUpdateDocument, 0);
        assert.deepEqual(calls.toasts, [{
            message: 'Ch\u01b0a ch\u1ecdn: V\u1ecb Th\u1ee9 N\u1eef. Vui l\u00f2ng ch\u1ecdn tr\u01b0\u1edbc khi Update.',
            type: 'error'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE4 Update');
    });

    it('restores button state and shows a catch-path error when setup throws', async () => {
        const button = createButton();
        const toasts = [];

        const result = await UpdateAction.execute(
            {
                hostFacade: { id: 'bridge-3' },
                builder: {
                    getData() {
                        return {};
                    }
                },
                button
            },
            {
                getSchema: () => {
                    throw new Error('Schema missing');
                },
                showToast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'Schema missing'
        });
        assert.deepEqual(toasts, [{
            message: 'Update l\u1ed7i: Schema missing',
            type: 'error'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE4 Update');
    });
});
