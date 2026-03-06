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
            const plans = frames.map(frame => ({
                id: frame.id,
                plan: {
                    mode: 'DIRECT',
                    content: schemaValue, // Schema key trực tiếp vào content
                    meta: { type: 'stateful', keys: [], mappings: [] }
                }
            }));

            await this._applyChanges(bridge, plans, showToast, `🪄 Đã tiêm ${schemaValue}`);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
            return;
        } finally {
            this._setButtonState(button, false);
        }
    },

    /**
     * Tiêm Compound — 2 keys trên 1 TextFrame (vd: ho_dau + ten)
     * schemaValue: "{pos1.con_full.ho_dau}|{pos1.con_full.ten}"
     * Logic: Thay toàn bộ content bằng 2 schema keys nối khoảng trắng.
     */
    async injectCompound(ctx) {
        const { bridge, showToast, button, schemaValue } = ctx;
        if (!schemaValue) return;

        try {
            this._setButtonState(button, true);

            const frames = await this._fetchFrames(bridge, showToast);
            if (!frames) return;

            // Tách keys: "{pos1.con_full.ho_dau}|{pos1.con_full.ten}" → rawKeys
            const rawKeys = schemaValue.split('|');
            const keys = rawKeys.map(k => { const m = k.match(/\{([\w.]+)\}/); return m ? m[1] : k; });

            // Content = nối các schema keys bằng khoảng trắng
            const compoundContent = rawKeys.join(' ');
            const plans = frames.map(frame => ({
                id: frame.id,
                plan: {
                    mode: 'DIRECT',
                    content: compoundContent,
                    meta: { type: 'stateful', keys: [], mappings: [] }
                }
            }));

            if (plans.length === 0) return;
            await this._applyChanges(bridge, plans, showToast, `🔗 Đã tiêm compound [${keys.join(' + ')}]`);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
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
            const plans = [];

            for (let i = 0; i < sortedFrames.length; i++) {
                if (variables[i]) {
                    plans.push({
                        id: sortedFrames[i].id,
                        plan: {
                            mode: 'DIRECT',
                            content: variables[i], // Schema key trực tiếp vào content
                            meta: { type: 'stateful', keys: [], mappings: [] }
                        }
                    });
                }
            }

            await this._applyChanges(bridge, plans, showToast, `☄️ Tiêm cụm Top-Down thành công!`);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
            return;
        } finally {
            this._setButtonState(button, false);
        }
    },

    /**
     * Clone metadata tiec → le hoặc nhap cho các frame đang chọn.
     * Frame nào có key chứa "date.tiec." → đổi thành "date.{targetMoc}."
     */
    async injectDateClone(ctx) {
        const { bridge, showToast, button, targetMoc } = ctx; // targetMoc: 'le' | 'nhap'

        try {
            this._setButtonState(button, true);

            const frames = await this._fetchFrames(bridge, showToast);
            if (!frames) return;

            const plans = [];
            for (const frame of frames) {
                // Content giờ chứa schema key trực tiếp (vd: "{date.tiec.ngay}")
                // Tìm tất cả date.tiec key trong content
                const content = frame.text || '';
                const matches = content.match(/\{date\.tiec\.[^}]+\}/g) || [];

                if (matches.length === 0) continue;

                // Swap tiec → targetMoc trong content
                const newContent = content.replace(/date\.tiec\./g, `date.${targetMoc}.`);

                plans.push({
                    id: frame.id,
                    plan: {
                        mode: 'DIRECT',
                        content: newContent,
                        meta: { type: 'stateful', keys: [], mappings: [] }
                    }
                });
            }

            if (plans.length === 0) {
                showToast('⚠️ Không tìm thấy frame nào có metadata date.tiec.* để clone.', 'warning');
                return;
            }

            await this._applyChanges(bridge, plans, showToast,
                `📋 Đã clone ${plans.length} frame sang date.${targetMoc}.*`);

        } catch (err) {
            console.error(err);
            showToast('Lỗi hệ thống: ' + err.message, 'error');
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

    async _applyChanges(bridge, plans, showToast, successMsg) {
        const applyResult = await bridge.applyPlan(plans);
        if (!applyResult || !applyResult.success) {
            showToast('Lỗi ghi đè Text: ' + (applyResult?.error || 'Unknown'), 'error');
            return { success: false, error: applyResult?.error };
        }
        showToast(successMsg, 'success');
        return { success: true, count: plans.length };
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
