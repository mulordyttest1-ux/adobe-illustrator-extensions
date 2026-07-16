import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ManualInjectAction } from './ManualInjectAction.js';

function createButton() {
    return {
        disabled: false,
        innerHTML: 'Inject',
        dataset: {}
    };
}

describe('ManualInjectAction', () => {
    it('applies single injection plans and reports success', async () => {
        const calls = {
            runTemplateAuthoringService: [],
            toasts: []
        };

        const result = await ManualInjectAction.injectSingle(
            { bridge: {}, button: createButton(), schemaValue: '{pos1.ong}' },
            {
                runTemplateAuthoringService: async (input) => {
                    calls.runTemplateAuthoringService.push(input);
                    return {
                        success: true,
                        count: 2,
                        keys: [],
                        affectedCount: 2
                    };
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: true, count: 2 });
        assert.deepEqual(calls.runTemplateAuthoringService, [{
            hostFacade: {},
            bridge: {},
            mode: 'single',
            schemaValue: '{pos1.ong}'
        }]);
        assert.deepEqual(calls.toasts, [{
            message: '\ud83e\ude84 \u0110\u00e3 ti\u00eam {pos1.ong}',
            type: 'success'
        }]);
    });

    it('warns when bulk inject receives an invalid frame count', async () => {
        const toasts = [];
        const result = await ManualInjectAction.injectBulk(
            { bridge: {}, button: createButton(), prefix: 'pos1' },
            {
                runTemplateAuthoringService: async () => ({
                    success: false,
                    reason: 'INVALID_FRAME_COUNT',
                    frameCount: 3
                }),
                showToast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'INVALID_FRAME_COUNT'
        });
        assert.deepEqual(toasts, [{
            message: '\u26a0\ufe0f Vui l\u00f2ng ch\u1ecdn \u0111\u00fang b\u1ed9 4 d\u00f2ng (\u00d4ng B\u00e0, \u00d4ng, B\u00e0, \u0110/C) \u0111\u1ec3 ti\u00eam c\u1ee5m. B\u1ea1n \u0111ang ch\u1ecdn 3 d\u00f2ng.',
            type: 'warning'
        }]);
    });

    it('warns when date clone cannot find any date.tiec metadata', async () => {
        const toasts = [];
        const result = await ManualInjectAction.injectDateClone(
            { bridge: {}, button: createButton(), targetMoc: 'le' },
            {
                runTemplateAuthoringService: async () => ({
                    success: false,
                    reason: 'NO_DATE_TIEC_METADATA'
                }),
                showToast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, {
            success: false,
            error: 'NO_DATE_TIEC_METADATA'
        });
        assert.deepEqual(toasts, [{
            message: '\u26a0\ufe0f Kh\u00f4ng t\u00ecm th\u1ea5y frame n\u00e0o c\u00f3 metadata date.tiec.* \u0111\u1ec3 clone.',
            type: 'warning'
        }]);
    });

    it('returns an apply error when manual inject cannot write plans', async () => {
        const toasts = [];
        const result = await ManualInjectAction.injectCompound(
            { bridge: {}, button: createButton(), schemaValue: '{a}|{b}' },
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
