import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InjectSchemaAction } from './InjectSchemaAction.js';

function createButton() {
    return {
        disabled: false,
        innerHTML: 'Inject',
        dataset: {}
    };
}

describe('InjectSchemaAction', () => {
    it('applies computed changes, warns for orphans, and surfaces missing-required toast', async () => {
        const bridge = {};
        const button = createButton();
        const calls = {
            runTemplateAuthoringService: [],
            selectFramesById: [],
            toasts: []
        };

        const result = await InjectSchemaAction.execute(
            { bridge, button },
            'tiec',
            {
                runTemplateAuthoringService: async (input) => {
                    calls.runTemplateAuthoringService.push(input);
                    return {
                        success: true,
                        count: 1,
                        affected: [{ id: 'f1' }],
                        orphans: [{ id: 'orphan-1' }],
                        missedRequired: ['date.tiec'],
                        hasChanges: true,
                        hasOrphans: true
                    };
                },
                selectFramesById: async (_inputBridge, ids) => {
                    calls.selectFramesById.push(ids);
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: true,
            count: 1,
            affected: [{ id: 'f1' }]
        });
        assert.deepEqual(calls.runTemplateAuthoringService, [{
            mode: 'auto',
            hostFacade: bridge,
            bridge,
            targetType: 'tiec'
        }]);
        assert.deepEqual(calls.selectFramesById, [['orphan-1']]);
        assert.deepEqual(calls.toasts, [
            {
                message: '\u26a0\ufe0f 1 s\u1ed1 r\u1eddi ch\u01b0a ti\u00eam \u0111\u01b0\u1ee3c \u2014 \u0111\u00e3 ch\u1ecdn \u0111\u1ec3 b\u1ea1n ti\u00eam tay.',
                type: 'warning'
            },
            {
                message: 'Thi\u1ebft k\u1ebf c\u00f2n thi\u1ebfu bi\u1ebfn b\u1eaft bu\u1ed9c. H\u00e3y b\u1ed5 sung tr\u01b0\u1edbc khi render.',
                type: 'error'
            }
        ]);
        assert.equal(button.disabled, false);
        assert.equal(button.innerHTML, 'Inject');
    });

    it('returns a read error when selection loading fails', async () => {
        const toasts = [];

        const result = await InjectSchemaAction.execute(
            { bridge: {}, button: createButton() },
            'tiec',
            {
                runTemplateAuthoringService: async () => ({
                    success: false,
                    reason: 'READ_FAILED',
                    error: 'Bridge offline'
                }),
                showToast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'Bridge offline'
        });
        assert.deepEqual(toasts, [{
            message: 'L\u1ed7i \u0111\u1ecdc Text: Bridge offline',
            type: 'error'
        }]);
    });

    it('warns when there is no selected frame', async () => {
        const toasts = [];

        const result = await InjectSchemaAction.execute(
            { bridge: {}, button: createButton() },
            'tiec',
            {
                runTemplateAuthoringService: async () => ({
                    success: false,
                    reason: 'EMPTY_SELECTION'
                }),
                showToast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'No selection'
        });
        assert.deepEqual(toasts, [{
            message: 'Vui l\u00f2ng b\u00f4i \u0111en (ch\u1ecdn) TextFrame tr\u00ean thi\u1ebft k\u1ebf \u0111\u1ec3 nh\u1eadn di\u1ec7n!',
            type: 'warning'
        }]);
    });

    it('returns an apply error when writing plans fails', async () => {
        const toasts = [];
        const result = await InjectSchemaAction.execute(
            { bridge: {}, button: createButton() },
            'tiec',
            {
                runTemplateAuthoringService: async () => ({
                    success: false,
                    reason: 'APPLY_FAILED',
                    error: 'Apply failed'
                }),
                showToast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'Apply failed'
        });
        assert.deepEqual(toasts, [{
            message: 'L\u1ed7i ghi \u0111\u00e8 Text: Apply failed',
            type: 'error'
        }]);
    });
});
