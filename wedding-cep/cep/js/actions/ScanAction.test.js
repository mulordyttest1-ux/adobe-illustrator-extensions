import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ScanAction } from './ScanAction.js';

function createButton() {
    return {
        disabled: false,
        textContent: '\uD83D\uDCE5 Scan'
    };
}

describe('ScanAction', () => {
    it('runs the scan flow, recomputes date-grid, and wakes blur-driven UI logic on success', async () => {
        const calls = {
            runScanDocument: [],
            setData: [],
            triggerDateGridCompute: 0,
            scheduleTask: 0,
            wakeFilledCompactTextareas: [],
            toasts: []
        };
        const button = createButton();
        const builder = {
            schema: { STRUCTURE: [] },
            container: { id: 'compact-container' },
            setData(data) {
                calls.setData.push(data);
            },
            triggerDateGridCompute() {
                calls.triggerDateGridCompute += 1;
            }
        };

        const result = await ScanAction.execute(
            {
                hostFacade: {
                    scanDocument: async () => ({
                        success: true,
                        data: [{ id: 'frame-1' }]
                    })
                },
                builder,
                button
            },
            {
                runScanDocument: ({ frames, schema }) => {
                    calls.runScanDocument.push({ frames, schema });
                    return {
                        data: { 'info.ten_le': 'Tan Hon' },
                        count: 1
                    };
                },
                scheduleTask: (task) => {
                    calls.scheduleTask += 1;
                    task();
                },
                wakeFilledCompactTextareas: ({ container }) => {
                    calls.wakeFilledCompactTextareas.push(container);
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: true, count: 1 });
        assert.deepEqual(calls.runScanDocument, [{
            frames: [{ id: 'frame-1' }],
            schema: { STRUCTURE: [] }
        }]);
        assert.deepEqual(calls.setData, [{ 'info.ten_le': 'Tan Hon' }]);
        assert.equal(calls.triggerDateGridCompute, 1);
        assert.equal(calls.scheduleTask, 1);
        assert.deepEqual(calls.wakeFilledCompactTextareas, [{ id: 'compact-container' }]);
        assert.deepEqual(calls.toasts, [{
            message: '\u0110\u00E3 scan 1 tr\u01B0\u1EDDng d\u1EEF li\u1EC7u!',
            type: 'success'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE5 Scan');
    });

    it('shows a bridge error toast and restores button state when scanning returns no data', async () => {
        const button = createButton();
        const calls = {
            toasts: []
        };

        const result = await ScanAction.execute(
            {
                hostFacade: {
                    scanDocument: async () => ({
                        success: false,
                        error: 'Bridge offline'
                    })
                },
                builder: {
                    schema: {}
                },
                button
            },
            {
                runScanDocument: () => {
                    throw new Error('should not run');
                },
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: false, error: 'Bridge offline' });
        assert.deepEqual(calls.toasts, [{
            message: 'Scan th\u1EA5t b\u1EA1i: Bridge offline',
            type: 'error'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE5 Scan');
    });

    it('shows a catch-path error toast and restores button state when the scan flow throws', async () => {
        const button = createButton();
        const calls = {
            toasts: []
        };

        const result = await ScanAction.execute(
            {
                hostFacade: {
                    scanDocument: async () => {
                        throw new Error('Unexpected failure');
                    }
                },
                builder: {
                    schema: {}
                },
                button
            },
            {
                showToast: (message, type) => {
                    calls.toasts.push({ message, type });
                }
            }
        );

        assert.deepEqual(result, { success: false, error: 'Unexpected failure' });
        assert.deepEqual(calls.toasts, [{
            message: 'Scan l\u1ED7i: Unexpected failure',
            type: 'error'
        }]);
        assert.equal(button.disabled, false);
        assert.equal(button.textContent, '\uD83D\uDCE5 Scan');
    });
});
