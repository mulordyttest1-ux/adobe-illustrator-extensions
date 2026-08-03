import { UIFeedback } from '@shared/cep-ui';
import { runScanDocument } from '../logic/use-cases/scanDocument.js';
import { wakeFilledCompactTextareas } from './support/wakeFilledCompactTextareas.js';

/**
 * MODULE: ScanAction
 * LAYER: Entry/Actions
 * PURPOSE: Handle Scan button - collect text frames via HostFacade, hand off processing, push data to UI
 * DEPENDENCIES: HostFacade, CompactFormBuilder, scanDocument use-case
 * SIDE EFFECTS: DOM (button state, toast)
 * EXPORTS: ScanAction.execute()
 */

export const ScanAction = {
    /**
     * Execute scan action.
     * @param {Object} ctx - Action context
     * @param {Object} ctx.hostFacade - Host facade instance
     * @param {Object} ctx.builder - CompactFormBuilder instance
     * @param {HTMLButtonElement} ctx.button - Scan button element
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    async execute(ctx, deps = {}) {
        const hostFacade = ctx.hostFacade;
        const { builder, button } = ctx;
        const scanDocument = deps.runScanDocument || runScanDocument;
        const showToast = deps.showToast || UIFeedback.showToast;
        const scheduleTask = deps.scheduleTask || ((task) => setTimeout(task, 0));
        const wakeFilledTextareas = deps.wakeFilledCompactTextareas || wakeFilledCompactTextareas;

        try {
            this._setButtonState(button, true);

            console.log('[ScanAction] Starting scan...');
            const result = await hostFacade.scanDocument();
            const scanFailure = this._getScanFailure(result);

            if (scanFailure) {
                console.error('[ScanAction] HostFacade scan failed:', result);
                showToast(scanFailure.message, 'error');
                return scanFailure.result;
            }

            console.log('[ScanAction] Raw data count:', result.data.length);

            const { data, count } = scanDocument({
                frames: result.data,
                schema: builder?.schema
            });

            console.log('[ScanAction] Final data to UI:', data);

            builder.setData(data);
            builder.triggerDateGridCompute();

            this._queueUiWakeUp(builder, scheduleTask, wakeFilledTextareas);

            showToast('\u0110\u00E3 scan ' + count + ' tr\u01B0\u1EDDng d\u1EEF li\u1EC7u!', 'success');
            return { success: true, count };
        } catch (err) {
            showToast('Scan l\u1ED7i: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            this._setButtonState(button, false);
        }
    },

    _setButtonState(button, isScanning) {
        if (!button) return;
        button.disabled = isScanning;
        button.textContent = isScanning ? '\u23F3' : '\uD83D\uDCE5 Scan';
    },

    _getScanFailure(result) {
        if (result && result.success && result.data) {
            return null;
        }

        const error = result?.error || 'No data';
        return {
            message: 'Scan th\u1EA5t b\u1EA1i: ' + (result?.error || 'Kh\u00F4ng c\u00F3 d\u1EEF li\u1EC7u'),
            result: { success: false, error }
        };
    },

    _queueUiWakeUp(builder, scheduleTask, wakeFilledTextareas) {
        scheduleTask(() => {
            wakeFilledTextareas({
                container: builder.container || (typeof document !== 'undefined' ? document : null)
            });
        });
    }
};
