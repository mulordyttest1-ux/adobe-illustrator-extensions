import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WeddingAssembler } from './assembler.js';

describe('WeddingAssembler', () => {
    it('assembles with injected deps without mutating raw input and supports solar_date keys', async () => {
        const rawData = {
            'date.tiec.ngay': '5',
            'date.tiec.thang': '4',
            'date.tiec.nam': '2027',
            'info.ten_le_idx': 2,
            untouched: 'value'
        };
        const schema = {
            STRUCTURE: [
                {
                    items: [{ key: 'date.tiec', type: 'solar_date' }]
                }
            ],
            TRIGGER_CONFIG: {}
        };
        const calls = {
            normalize: [],
            enrichSplitNames: [],
            enrichParentPrefixes: [],
            loadDatabase: 0,
            expandDate: [],
            enrichTimeLocks: [],
            detectVenueState: [],
            applyAutoVenue: [],
            enrichMappingStrategy: []
        };

        const result = await WeddingAssembler.assembleWith(rawData, schema, {
            normalizer: {
                normalize(packet, inputSchema) {
                    calls.normalize.push({ packet: { ...packet }, schema: inputSchema });
                    return { ...packet, normalized: true };
                }
            },
            nameAnalysis: {
                enrichSplitNames(packet) {
                    calls.enrichSplitNames.push({ ...packet });
                    return { ...packet, splitNames: true };
                }
            },
            weddingRules: {
                enrichParentPrefixes(packet) {
                    calls.enrichParentPrefixes.push({ ...packet });
                    return { ...packet, parentPrefixes: true };
                },
                enrichMappingStrategy(packet, triggerConfig) {
                    calls.enrichMappingStrategy.push({ packet: { ...packet }, triggerConfig });
                    return { ...packet, mappingStrategy: true };
                }
            },
            calendarEngine: {
                _isLoaded: false,
                loadDatabase() {
                    calls.loadDatabase += 1;
                    this._isLoaded = true;
                },
                expandDate(date) {
                    calls.expandDate.push([
                        date.getFullYear(),
                        date.getMonth() + 1,
                        date.getDate()
                    ]);
                    return {
                        ngay: '05',
                        thang: '04',
                        nam: '2027',
                        namyy: '27',
                        thu: 'Thu Bay',
                        ngay_al: '10',
                        thang_al: '03',
                        nam_al: '2027'
                    };
                }
            },
            timeAutomation: {
                enrichTimeLocks(packet, inputSchema) {
                    calls.enrichTimeLocks.push({ packet: { ...packet }, schema: inputSchema });
                    return { ...packet, timeLocks: true };
                }
            },
            venueAutomation: {
                detectVenueState(packet) {
                    calls.detectVenueState.push({ ...packet });
                    return { ...packet, venueState: true };
                },
                applyAutoVenue(packet, options) {
                    calls.applyAutoVenue.push({ packet: { ...packet }, options });
                    return { ...packet, autoVenue: true };
                }
            }
        });

        assert.deepEqual(rawData, {
            'date.tiec.ngay': '5',
            'date.tiec.thang': '4',
            'date.tiec.nam': '2027',
            'info.ten_le_idx': 2,
            untouched: 'value'
        });
        assert.equal(calls.loadDatabase, 1);
        assert.deepEqual(calls.expandDate, [[2027, 4, 5]]);
        assert.equal(calls.normalize[0].packet['info.ten_le_split_idx'], 2);
        assert.equal(calls.normalize[0].packet['date.tiec'], '2027-04-05');
        assert.equal(result['date.tiec.ngay'], '05');
        assert.equal(result['date.tiec.thang'], '04');
        assert.equal(result['date.tiec.nam'], '2027');
        assert.equal(result['date.tiec.namyy'], '27');
        assert.equal(result['date.tiec.thu'], 'Thu Bay');
        assert.equal(result['date.tiec.ngay_al'], '10');
        assert.equal(result['info.ten_le_split_idx'], 2);
        assert.equal(result.mappingStrategy, true);
        assert.equal(result.autoVenue, true);
    });
});
