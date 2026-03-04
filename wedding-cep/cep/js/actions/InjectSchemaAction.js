import { SchemaInjector } from '../logic/SchemaInjector.js';

export const InjectSchemaAction = {
    async execute(ctx, targetType = 'tiec') {
        const { bridge, showToast, button } = ctx;

        try {
            this._setButtonState(button, true);

            const frames = await this._fetchFrames(bridge, showToast);
            if (!frames) return { success: false, error: 'No selection' };

            const changes = SchemaInjector.computeChanges(frames, targetType);
            if (changes.length === 0) {
                showToast('Không tìm thấy từ khóa nào cần tiêm Schema trong vùng chọn.', 'info');
                return { success: true, count: 0 };
            }

            return await this._applyChanges(bridge, changes, showToast);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            this._setButtonState(button, false);
        }
    },

    async _fetchFrames(bridge, showToast) {
        const result = await bridge.readSelectionObjects();
        if (!result || !result.success) {
            showToast('Lỗi đọc Text: ' + (result?.error || 'Unknown'), 'error');
            return null;
        }

        const frames = result.data || [];
        if (frames.length === 0) {
            showToast('Vui lòng bôi đen (chọn) TextFrame trên thiết kế để nhận diện!', 'warning');
            return null;
        }
        return frames;
    },

    async _applyChanges(bridge, changes, showToast) {
        const applyResult = await bridge.applyPlan(changes);
        if (!applyResult || !applyResult.success) {
            showToast('Lỗi ghi đè Text: ' + (applyResult?.error || 'Unknown'), 'error');
            return { success: false, error: applyResult?.error };
        }

        const count = applyResult.updated || 0;
        showToast(`🪄 Đã tiêm thành công ${count} Biến Schema!`, 'success');
        return { success: true, count };
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
