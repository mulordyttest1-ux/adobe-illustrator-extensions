import { SchemaInjector } from '../logic/SchemaInjector.js';
import { UIFeedback } from '../controllers/helpers/UIFeedback.js';
import { LayoutUtils } from '../logic/ux/LayoutUtils.js';
import { PostflightAction } from './PostflightAction.js';

export const InjectSchemaAction = {
    async execute(ctx, targetType = 'tiec') {
        const { bridge, button } = ctx;

        try {
            this._setButtonState(button, true);

            const frames = await this._fetchFrames(bridge);
            if (!frames) return { success: false, error: 'No selection' };

            // [BUG #03 FIX] Secondary Sort: Left-to-Right
            const sortedFrames = LayoutUtils.sortFrames(frames);

            const { changes, orphans, missedRequired } = SchemaInjector.computeChanges(sortedFrames, targetType);

            if (changes.length === 0 && orphans.length === 0) {
                UIFeedback.showToast('Không tìm thấy từ khóa nào cần tiêm Schema trong vùng chọn.', 'info');
                return { success: true, count: 0 };
            }

            let result = { success: true, count: 0, affected: [] };
            if (changes.length > 0) {
                result = await this._applyChanges(bridge, changes);
            }

            // Cảnh báo số rời
            if (orphans.length > 0) {
                const orphanIds = orphans.map(f => f.id);
                bridge.selectFramesById(orphanIds).catch(() => { });
                UIFeedback.showToast(
                    `⚠️ ${orphans.length} số rời chưa tiêm được — đã chọn để bạn tiêm tay.`,
                    'warning'
                );
            }

            // Cảnh báo trường bắt buộc thiếu
            if (missedRequired.length > 0) {
                UIFeedback.showToast(
                    `❌ Thiếu trường bắt buộc: ${missedRequired.join(', ')}. Kiểm tra thiết kế!`,
                    'error'
                );
            }

            // TRIGGER POSTFLIGHT VALIDATION (Phase 2 Heuristics)
            await PostflightAction.execute(ctx, result.affected || [], {
                missedKeys: missedRequired,
                phase: 'template'
            });

            return result;

        } catch (err) {
            console.error(err);
            UIFeedback.showToast('Lỗi hệ thống: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            this._setButtonState(button, false);
        }
    },

    async _fetchFrames(bridge) {
        const result = await bridge.readSelectionObjects();
        if (!result || !result.success) {
            UIFeedback.showToast('Lỗi đọc Text: ' + (result?.error || 'Unknown'), 'error');
            return null;
        }

        const frames = result.data || [];
        if (frames.length === 0) {
            UIFeedback.showToast('Vui lòng bôi đen (chọn) TextFrame trên thiết kế để nhận diện!', 'warning');
            return null;
        }
        return frames;
    },

    async _applyChanges(bridge, changes) {
        const applyResult = await bridge.applyPlan(changes);
        if (!applyResult || !applyResult.success) {
            UIFeedback.showToast('Lỗi ghi đè Text: ' + (applyResult?.error || 'Unknown'), 'error');
            return { success: false, error: applyResult?.error };
        }

        const count = applyResult.updated || 0;
        // NOTE: No toast here — PostflightWidget will report success/failure after validation
        return { success: true, count, affected: applyResult.affected || [] };
    },

    _setButtonState(button, isProcessing) {
        if (!button) return;
        button.disabled = isProcessing;
        if (isProcessing) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '⏳ Đang xử lý...';
        } else if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
};
