import { DataValidator } from '../logic/pipeline/DataValidator.js';
import { KeyNormalizer } from '../controllers/helpers/KeyNormalizer.js';
import { WeddingRules, VenueAutomation } from '@wedding/domain';
import { UIFeedback } from '../controllers/helpers/UIFeedback.js';
import { LayoutUtils } from '../logic/ux/LayoutUtils.js';

/**
 * MODULE: ScanAction
 * LAYER: Entry/Actions
 * PURPOSE: Handle Scan button — collect text frames via Bridge, validate, normalize, push to UI
 * DEPENDENCIES: Bridge, DataValidator, KeyNormalizer, CompactFormBuilder, WeddingRules
 * SIDE EFFECTS: DOM (button state, toast)
 * EXPORTS: ScanAction.execute()
 */

export const ScanAction = {
    /**
     * Execute scan action.
     * @param {Object} ctx - Action context
     * @param {Object} ctx.bridge - Bridge instance
     * @param {Object} ctx.builder - CompactFormBuilder instance
     * @param {HTMLButtonElement} ctx.button - Scan button element
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    async execute(ctx) {
        const { bridge, builder, button } = ctx;

        try {
            this._setButtonState(button, true);

            console.log('[ScanAction] Starting scan...');
            const result = await bridge.scanDocument();

            if (!result || !result.success || !result.data) {
                console.error('[ScanAction] Bridge scan failed:', result);
                UIFeedback.showToast('Scan thất bại: ' + (result?.error || 'Không có dữ liệu'), 'error');
                return { success: false, error: result?.error || 'No data' };
            }

            console.log('[ScanAction] Raw data count:', result.data.length);

            // [BUG #03 FIX] Secondary Sort: Left-to-Right
            const sortedFrames = LayoutUtils.sortFrames(result.data);

            const normalized = this._processData(sortedFrames, builder);

            console.log('[ScanAction] Final Data to UI:', normalized);

            builder.setData(normalized);

            if (typeof DateGridWidget !== 'undefined') {
                DateGridWidget.triggerCompute();
            }

            // Smart IDX: trigger blur on name fields to auto-detect ethnic names
            setTimeout(() => {
                const container = builder.container || document;
                container.querySelectorAll('textarea.compact-input').forEach(ta => {
                    if (ta.value) ta.dispatchEvent(new Event('blur'));
                });
            }, 0);

            const count = Object.keys(normalized).length;
            UIFeedback.showToast('Đã scan ' + count + ' trường dữ liệu!', 'success');
            return { success: true, count };

        } catch (err) {
            UIFeedback.showToast('Scan lỗi: ' + err.message, 'error');
            return { success: false, error: err.message };

        } finally {
            this._setButtonState(button, false);
        }
    },

    _setButtonState(button, isScanning) {
        button.disabled = isScanning;
        button.textContent = isScanning ? '⏳' : '📥 Scan';
    },

    _processData(rawData, builder) {
        const validator = new DataValidator();
        const analysis = validator.analyze(rawData);
        console.log('[ScanAction] Healthy Map:', analysis.healthyMap);

        let normalized = KeyNormalizer.normalize(analysis.healthyMap);
        console.log('[ScanAction] Normalized:', normalized);

        normalized = WeddingRules.enrichParentPrefixes(normalized);

        // Set ten_auto checkbox state dựa trên tên scan được (Tư Gia = true, khác = false)
        normalized = VenueAutomation.detectVenueState(normalized);

        const triggerConfig = builder?.schema?.TRIGGER_CONFIG || {
            "Vu Quy": 1, "Thành Hôn": 0, "Tân Hôn": 0, "Báo Hỷ": 0
        };
        const hostType = normalized['ceremony.host_type'];
        const tenLe = normalized['info.ten_le'] || '';

        const isPos1Bride = this._inferBrideSide(hostType, tenLe, triggerConfig);
        console.log('[ScanAction] Side inference:', { hostType, tenLe, isPos1Bride });

        return this._mapHostSides(normalized, isPos1Bride);
    },

    _inferBrideSide(hostType, tenLe, triggerConfig) {
        if (hostType === 'Nhà Gái') return true;
        if (hostType === 'Nhà Trai') return false;
        return WeddingRules.isBrideSide(tenLe, triggerConfig);
    },

    _mapHostSides(normalized, isPos1Bride) {
        if (isPos1Bride) {
            if (normalized['pos1.vithu']) normalized['ui.vithu_nu'] = normalized['pos1.vithu'];
            if (normalized['pos2.vithu']) normalized['ui.vithu_nam'] = normalized['pos2.vithu'];
        } else {
            if (normalized['pos1.vithu']) normalized['ui.vithu_nam'] = normalized['pos1.vithu'];
            if (normalized['pos2.vithu']) normalized['ui.vithu_nu'] = normalized['pos2.vithu'];
        }
        return normalized;
    }
};

