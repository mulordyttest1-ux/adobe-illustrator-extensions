import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runUpdateDocumentService } from './updateDocumentService.js';

function createAssemblerHarness(overrides = {}) {
    const calls = {
        setDependencies: [],
        assemble: [],
        assembleWith: []
    };
    const assembler = {
        setDependencies: (deps) => {
            calls.setDependencies.push(deps);
        },
        assemble: async (rawData, schema) => {
            calls.assemble.push({ rawData, schema });
            if (typeof overrides.assemble === 'function') {
                return overrides.assemble(rawData, schema);
            }
            return { normalized: true, ...rawData };
        },
        assembleWith: async (rawData, schema, deps) => {
            calls.assembleWith.push({ rawData, schema, deps });
            if (typeof overrides.assembleWith === 'function') {
                return overrides.assembleWith(rawData, schema, deps);
            }
            return { normalized: true, ...rawData };
        }
    };

    return { assembler, calls };
}

describe('runUpdateDocumentService', () => {
it('assembles packet data, applies the update callback, and returns update context', async () => {
        const rawData = {
            'ceremony.host_type': 'Nhà Trai',
            'pos1.ong': 'Ông A',
            'date.tiec': '2026-03-23'
        };
        const schema = {
            DERIVED: {
                NAME: [{ suffix: '.ten' }],
                DATE: [{ suffix: '.ngay' }]
            },
            STRUCTURE: [
                {
                    prefix: 'pos1',
                    items: [{ key: 'ong', type: 'person_name' }]
                },
                {
                    items: [{ key: 'date.tiec', type: 'solar_date' }]
                }
            ]
        };
        const { assembler, calls } = createAssemblerHarness({
            assembleWith: async () => ({ packet: 'processed' })
        });
        const applyCalls = [];

        const result = await runUpdateDocumentService({
            rawData,
            schema,
            applyUpdate: async (processedData) => {
                applyCalls.push(processedData);
                return {
                    success: true,
                    updated: 3,
                    affected: [{ id: 'frame-1' }],
                    templateBindings: ['date.tiec.ngay', 'pos1.ong']
                };
            }
        }, { assembler });

        assert.equal(calls.setDependencies.length, 0);
        assert.equal(calls.assemble.length, 0);
        assert.equal(calls.assembleWith.length, 1);
        assert.deepEqual(calls.assembleWith[0].rawData, rawData);
        assert.deepEqual(calls.assembleWith[0].schema, schema);
        assert.deepEqual(applyCalls, [{ packet: 'processed' }]);
        assert.equal(result.success, true);
        assert.equal(result.updated, 3);
        assert.deepEqual(result.affected, [{ id: 'frame-1' }]);
        assert.deepEqual(result.formData, rawData);
        assert.deepEqual(result.schemaKeys, ['pos1.ong', 'pos1.ong.ten', 'date.tiec', 'date.tiec.ngay']);
        assert.deepEqual(result.templateBindings, ['date.tiec.ngay', 'pos1.ong']);
        assert.deepEqual(result.schemaMeta.schemaKeys, result.schemaKeys);
        assert.equal(result.schemaMeta.groupByKey['pos1.ong'], 'Gia \u0111\u00ecnh');
        assert.equal(result.schemaMeta.groupByKey['date.tiec.ngay'], 'Ngay Tiec');
        assert.equal(result.schemaMeta.labelsByKey['date.tiec.ngay'], 'ngay');
    });

    it('returns a structured error result when the update callback reports failure', async () => {
        const rawData = { 'info.ten_le': 'Tan Hon' };
        const schema = { STRUCTURE: [] };
        const { assembler } = createAssemblerHarness();

        const result = await runUpdateDocumentService({
            rawData,
            schema,
            applyUpdate: async () => ({
                success: false,
                error: 'Bridge update failed',
                templateBindings: ['info.ten_le']
            })
        }, { assembler });

        assert.deepEqual(result, {
            success: false,
            error: 'Bridge update failed',
            formData: rawData,
            schemaKeys: [],
            schemaMeta: {
                schemaKeys: [],
                labelsByKey: {},
                groupByKey: {},
                groupRankByKey: {},
                keyRankByKey: {},
                derivedSuffixLabels: {}
            },
            templateBindings: ['info.ten_le']
        });
    });

    it('falls back to legacy assembler wiring when assembleWith is unavailable', async () => {
        const calls = {
            setDependencies: [],
            assemble: []
        };
        const assembler = {
            setDependencies: (deps) => {
                calls.setDependencies.push(deps);
            },
            assemble: async (rawData, schema) => {
                calls.assemble.push({ rawData, schema });
                return { packet: 'legacy-processed' };
            }
        };

        const result = await runUpdateDocumentService({
            rawData: { 'info.ten_le': 'Tan Hon' },
            schema: { STRUCTURE: [] },
            applyUpdate: async () => ({
                success: true,
                updated: 1,
                affected: []
            })
        }, { assembler });

        assert.equal(calls.setDependencies.length, 1);
        assert.deepEqual(calls.assemble, [{
            rawData: { 'info.ten_le': 'Tan Hon' },
            schema: { STRUCTURE: [] }
        }]);
        assert.equal(result.success, true);
        assert.equal(result.updated, 1);
    });
});
