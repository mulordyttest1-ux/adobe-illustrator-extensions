import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runSwapInvitationSides } from './swapInvitationSides.js';

describe('runSwapInvitationSides', () => {
    it('swaps pos1 and pos2 fields while preserving invitation lines and non-pos fields', () => {
        const result = runSwapInvitationSides({
            data: {
                'pos1.ong': 'Ong Pos 1',
                'pos1.vithu': 'Vi thu pos1',
                'pos2.ong': 'Ong Pos 2',
                'pos2.vithu': 'Vi thu pos2',
                'info.ten_le': 'Tan Hon'
            }
        });

        assert.deepEqual(result.data, {
            'pos1.ong': 'Ong Pos 2',
            'pos1.vithu': 'Vi thu pos1',
            'pos2.ong': 'Ong Pos 1',
            'pos2.vithu': 'Vi thu pos2',
            'info.ten_le': 'Tan Hon'
        });
    });

    it('recomputes auto venue fields from the swapped pos1 address', () => {
        const calls = [];
        const result = runSwapInvitationSides(
            {
                data: {
                    'ceremony.host_type': 'Nh\u00E0 G\u00E1i',
                    'ceremony.ten_auto': true,
                    'ceremony.ten': 'Old ceremony',
                    'ceremony.diachi': 'Old ceremony address',
                    'venue.ten_auto': 'true',
                    'venue.ten': 'Old venue',
                    'venue.diachi': 'Old venue address',
                    'pos1.diachi': 'Address POS1',
                    'pos2.diachi': 'Address POS2'
                }
            },
            {
                venueAutomation: {
                    generateVenueName(hostType) {
                        calls.push(hostType);
                        return `TG ${hostType}`;
                    }
                }
            }
        );

        assert.deepEqual(calls, ['Nh\u00E0 G\u00E1i']);
        assert.equal(result.data['pos1.diachi'], 'Address POS2');
        assert.equal(result.data['pos2.diachi'], 'Address POS1');
        assert.equal(result.data['ceremony.ten'], 'TG Nh\u00E0 G\u00E1i');
        assert.equal(result.data['venue.ten'], 'TG Nh\u00E0 G\u00E1i');
        assert.equal(result.data['ceremony.diachi'], 'Address POS2');
        assert.equal(result.data['venue.diachi'], 'Address POS2');
    });

    it('keeps manual venue fields untouched when auto mode is off', () => {
        const result = runSwapInvitationSides({
            data: {
                'ceremony.host_type': 'Nh\u00E0 Trai',
                'ceremony.ten_auto': false,
                'ceremony.ten': 'Manual ceremony',
                'ceremony.diachi': 'Manual ceremony address',
                'venue.ten_auto': false,
                'venue.ten': 'Manual venue',
                'venue.diachi': 'Manual venue address',
                'pos1.diachi': 'Address POS1',
                'pos2.diachi': 'Address POS2'
            }
        });

        assert.equal(result.data['ceremony.ten'], 'Manual ceremony');
        assert.equal(result.data['ceremony.diachi'], 'Manual ceremony address');
        assert.equal(result.data['venue.ten'], 'Manual venue');
        assert.equal(result.data['venue.diachi'], 'Manual venue address');
    });

    it('defaults missing host type to Nha Trai when auto venue needs recomputing', () => {
        const calls = [];
        const result = runSwapInvitationSides(
            {
                data: {
                    'ceremony.ten_auto': true,
                    'pos1.diachi': 'Address POS1',
                    'pos2.diachi': 'Address POS2'
                }
            },
            {
                venueAutomation: {
                    generateVenueName(hostType) {
                        calls.push(hostType);
                        return `TG ${hostType}`;
                    }
                }
            }
        );

        assert.deepEqual(calls, ['Nh\u00E0 Trai']);
        assert.equal(result.data['ceremony.ten'], 'TG Nh\u00E0 Trai');
        assert.equal(result.data['ceremony.diachi'], 'Address POS2');
    });
});
