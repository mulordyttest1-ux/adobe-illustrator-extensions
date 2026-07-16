import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SwapAction } from './SwapAction.js';

describe('SwapAction', () => {
    it('routes builder data through the swap use-case and shows a success toast', () => {
        const calls = {
            runSwapInvitationSides: [],
            setData: [],
            toasts: []
        };
        const builder = {
            getData() {
                return { 'pos1.ong': 'Ong A' };
            },
            setData(data) {
                calls.setData.push(data);
            }
        };

        const result = SwapAction.execute(
            { builder },
            {
                runSwapInvitationSides: ({ data }) => {
                    calls.runSwapInvitationSides.push(data);
                    return {
                        data: { 'pos1.ong': 'Ong B' }
                    };
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: true });
        assert.deepEqual(calls.runSwapInvitationSides, [{ 'pos1.ong': 'Ong A' }]);
        assert.deepEqual(calls.setData, [{ 'pos1.ong': 'Ong B' }]);
        assert.deepEqual(calls.toasts, [{
            message: '\u0110\u00E3 ho\u00E1n \u0111\u1ED5i POS!',
            type: 'success'
        }]);
    });
});
