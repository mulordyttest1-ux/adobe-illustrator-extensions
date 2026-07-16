import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StrategyOrchestrator } from './StrategyOrchestrator.js';

describe('StrategyOrchestrator', () => {
    it('builds frame plans from collected frame records and skips SKIP plans', () => {
        const calls = [];
        const orchestrator = new StrategyOrchestrator();

        orchestrator.analyze = (content, metadata, packet) => {
            calls.push({ content, metadata, packet });

            if (content === 'Use raw content') {
                return {
                    mode: 'REPLACE',
                    packet,
                    metadata
                };
            }

            return { mode: 'SKIP' };
        };

        const result = orchestrator.planFrames([
            {
                id: 'frame-1',
                raw_content: 'Use raw content',
                content: 'fallback',
                meta_keys: ['pos1.ong']
            },
            {
                id: 'frame-2',
                content: 'Use plain content',
                meta_keys: []
            }
        ], { packet: true });

        assert.deepEqual(calls, [
            {
                content: 'Use raw content',
                metadata: {
                    type: 'stateful',
                    keys: ['pos1.ong'],
                    mappings: []
                },
                packet: { packet: true }
            },
            {
                content: 'Use plain content',
                metadata: null,
                packet: { packet: true }
            }
        ]);
        assert.deepEqual(result, [
            {
                id: 'frame-1',
                plan: {
                    mode: 'REPLACE',
                    packet: { packet: true },
                    metadata: {
                        type: 'stateful',
                        keys: ['pos1.ong'],
                        mappings: []
                    }
                }
            }
        ]);
    });
});
