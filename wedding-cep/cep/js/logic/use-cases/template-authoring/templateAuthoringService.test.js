import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runTemplateAuthoringService } from './templateAuthoringService.js';

describe('runTemplateAuthoringService', () => {
    it('routes auto mode through inject schema service with the stable target type contract', async () => {
        const calls = [];
        const result = await runTemplateAuthoringService(
            { mode: 'auto', bridge: { id: 'bridge' }, targetType: 'le' },
            {
                runInjectSchemaService: async (input) => {
                    calls.push(input);
                    return { success: true, count: 1 };
                }
            }
        );

        assert.deepEqual(result, { success: true, count: 1 });
        assert.deepEqual(calls, [{
            hostFacade: { id: 'bridge' },
            bridge: { id: 'bridge' },
            targetType: 'le'
        }]);
    });

    it('routes manual modes through manual inject service without reshaping the input', async () => {
        const calls = [];
        const result = await runTemplateAuthoringService(
            { mode: 'bulk', bridge: { id: 'bridge' }, prefix: 'pos1' },
            {
                runManualInjectService: async (input) => {
                    calls.push(input);
                    return { success: true, count: 4 };
                }
            }
        );

        assert.deepEqual(result, { success: true, count: 4 });
        assert.deepEqual(calls, [{
            mode: 'bulk',
            bridge: { id: 'bridge' },
            prefix: 'pos1'
        }]);
    });

    it('returns a stable unknown-mode failure instead of guessing a branch', async () => {
        const result = await runTemplateAuthoringService({ mode: 'unexpected' });
        assert.deepEqual(result, {
            success: false,
            reason: 'UNKNOWN_MODE'
        });
    });
});
