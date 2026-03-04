/**
 * ManualInjectAction.js
 * Xử lý logic tiêm Schema thủ công (Single mode) và theo Cụm Tọa độ (Bulk mode)
 */

export const ManualInjectAction = {
    /**
     * Tiêm thủ công 1 biến ({pos1.ong}) vào toàn bộ các TextFrames đang chọn
     */
    async injectSingle(ctx) {
        const { bridge, showToast, button, schemaValue } = ctx;
        if (!schemaValue) return;

        try {
            this._setButtonState(button, true);

            const frames = await this._fetchFrames(bridge, showToast);
            if (!frames) return;

            const changes = frames.map(frame => ({
                id: frame.id,
                newText: schemaValue // Đè thẳng chữ cứng vào Text Frame
            }));

            await this._applyChanges(bridge, changes, showToast, `🪄 Đã tiêm ${schemaValue}`);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
            return;
        } finally {
            this._setButtonState(button, false);
        }
    },

    /**
     * Tiêm Cụm Top-Down dựa trên thuộc tính 'top' của TextFrame
     * @param {string} prefix 'pos1' hoặc 'pos2'
     */
    async injectBulk(ctx) {
        const { bridge, showToast, button, prefix } = ctx;

        try {
            this._setButtonState(button, true);

            const frames = await this._fetchFrames(bridge, showToast);
            if (!frames) return;

            if (frames.length !== 3) {
                showToast(`⚠️ Vui lòng chọn đúng bộ 3 dòng (Ông, Bà, Đ/C) để tiêm cụm. Bạn đang chọn ${frames.length} dòng.`, 'warning');
                return;
            }

            // Theo báo cáo C1_document.md: Illustrator tọa độ Y hướng lên. top càng bự -> chữ càng cao.
            // Sắp xếp Mảng từ Cao -> Thấp. 
            // Audit Fix: Thêm secondary sort theo 'left' (Trái -> Phải) nếu cùng 'top'.
            const sortedFrames = [...frames].sort((a, b) => {
                const aTop = parseFloat(a.top) || 0;
                const bTop = parseFloat(b.top) || 0;
                if (Math.abs(aTop - bTop) < 0.1) { // Gần như bằng nhau
                    const aLeft = parseFloat(a.left) || 0;
                    const bLeft = parseFloat(b.left) || 0;
                    return aLeft - bLeft; // Trái sang phải
                }
                return bTop - aTop;
            });

            // Map variables top-down
            const variables = [`{${prefix}.ong}`, `{${prefix}.ba}`, `{${prefix}.diachi}`];
            const changes = [];

            for (let i = 0; i < sortedFrames.length; i++) {
                if (variables[i]) {
                    changes.push({
                        id: sortedFrames[i].id,
                        newText: variables[i]
                    });
                }
            }

            await this._applyChanges(bridge, changes, showToast, `☄️ Tiêm cụm Top-Down thành công!`);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
            return;
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
            showToast('⚠️ Vui lòng bôi đen (chọn) phần chữ trên thiết kế AI!', 'warning');
            return null;
        }
        return frames;
    },

    async _applyChanges(bridge, changes, showToast, successMsg) {
        const applyResult = await bridge.applyTextChanges(changes);
        if (!applyResult || !applyResult.success) {
            showToast('Lỗi ghi đè Text: ' + (applyResult?.error || 'Unknown'), 'error');
            return { success: false, error: applyResult?.error };
        }
        showToast(successMsg, 'success');
        return { success: true, count: changes.length };
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
