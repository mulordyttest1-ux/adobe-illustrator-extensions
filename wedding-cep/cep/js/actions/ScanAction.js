import { DataValidator } from '../logic/pipeline/DataValidator.js';
import { KeyNormalizer } from '../controllers/helpers/KeyNormalizer.js';
import { WeddingRules } from '../logic/domain/rules.js';

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
     * @param {Function} ctx.showToast - Toast notification function
     * @param {HTMLButtonElement} ctx.button - Scan button element
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    async execute(ctx) {
        const { bridge, builder, showToast, button } = ctx;

        try {
            // 1. UI: Disable button
            button.disabled = true;
            button.textContent = '⏳';

            // 2. Call Bridge to scan document
            console.log('[ScanAction] Starting scan...');
            const result = await bridge.scanDocument();

            if (!result || !result.success || !result.data) {
                console.error('[ScanAction] Bridge scan failed:', result);
                showToast('Scan thất bại: ' + (result?.error || 'Không có dữ liệu'), 'error');
                return { success: false, error: result?.error || 'No data' };
            }

            console.log('[ScanAction] Raw data count:', result.data.length);

            // 3. DataValidator: Array → Object key-value map
            const validator = new DataValidator();
            const analysis = validator.analyze(result.data);
            console.log('[ScanAction] Healthy Map:', analysis.healthyMap);

            let normalized = KeyNormalizer.normalize(analysis.healthyMap);
            console.log('[ScanAction] Normalized:', normalized);

            // 4. Domain Enrichment — Ông/Bà prefix
            normalized = WeddingRules.enrichParentPrefixes(normalized);

            // 5. Inverse Mapping: Storage keys (pos1.vithu) → UI keys (ui.vithu_nam/nu)
            // Uses TRIGGER_CONFIG from schema to determine which side is bride/groom
            const triggerConfig = builder?.schema?.TRIGGER_CONFIG || {
                "Vu Quy": 1, "Thành Hôn": 0, "Tân Hôn": 0, "Báo Hỷ": 0
            };
            const hostType = normalized['ceremony.host_type'];
            const tenLe = normalized['info.ten_le'] || '';

            let isPos1Bride;
            if (hostType === 'Nhà Gái') {
                isPos1Bride = true;
            } else if (hostType === 'Nhà Trai') {
                isPos1Bride = false;
            } else {
                isPos1Bride = WeddingRules.isBrideSide(tenLe, triggerConfig);
            }

            console.log('[ScanAction] Side inference:', { hostType, tenLe, isPos1Bride });

            if (isPos1Bride) {
                if (normalized['pos1.vithu']) normalized['ui.vithu_nu'] = normalized['pos1.vithu'];
                if (normalized['pos2.vithu']) normalized['ui.vithu_nam'] = normalized['pos2.vithu'];
            } else {
                if (normalized['pos1.vithu']) normalized['ui.vithu_nam'] = normalized['pos1.vithu'];
                if (normalized['pos2.vithu']) normalized['ui.vithu_nu'] = normalized['pos2.vithu'];
            }

            console.log('[ScanAction] Final Data to UI:', normalized);

            // 5. Push to UI form
            builder.setData(normalized);

            // 6. Trigger date grid recompute
            if (typeof DateGridWidget !== 'undefined') {
                DateGridWidget.triggerCompute();
            }

            const count = Object.keys(normalized).length;
            showToast('Đã scan ' + count + ' trường dữ liệu!', 'success');
            return { success: true, count };

        } catch (err) {
            showToast('Scan lỗi: ' + err.message, 'error');
            return { success: false, error: err.message };

        } finally {
            button.disabled = false;
            button.textContent = '📥 Scan';
        }
    }
};

