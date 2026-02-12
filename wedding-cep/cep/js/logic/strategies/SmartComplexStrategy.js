/**
 * MODULE: SmartComplexStrategy
 * LAYER: Logic/Strategies
 * PURPOSE: Analyze text frames with existing metadata — precision marker-based replacement
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: SmartComplexStrategy.analyze()
 */

export class SmartComplexStrategy {
    static analyze(content, packet, meta, constants = {}) {
        if (!meta) return null;

        const keys = meta.keys || (meta.mappings ? meta.mappings.map(m => m.key) : []);
        if (!keys || keys.length === 0) return null;
        if (!content) return null;

        const GHOST = constants.CHARS?.GHOST || '\u200B';

        // [FIX CRITICAL] Không dùng cleanContent nữa để tránh lệch Index.
        // Thay vào đó dùng Regex thông minh bắt 1 hoặc nhiều marker (\u200B+)
        // Group 1 ([\s\S]*?) là nội dung bên trong
        const markerRegex = /\u200B+([\s\S]*?)\u200B+/g;

        const matches = [];
        let match;
        while ((match = markerRegex.exec(content)) !== null) {
            matches.push({
                start: match.index, // Index này chính xác 100% trên content gốc
                end: match.index + match[0].length,
                inner: match[1] // Nội dung bên trong (đã bóc vỏ marker)
            });
        }

        // --- RECOVERY MODE (Khi mất marker) ---
        if (matches.length === 0) {
            // Nếu chỉ có 1 Key -> Force DIRECT để cứu
            if (keys.length === 1) {
                const key = keys[0];
                let newVal = Object.prototype.hasOwnProperty.call(packet, key) ? String(packet[key]) : content;
                if (newVal === '') newVal = GHOST;

                return {
                    mode: 'DIRECT',
                    content: newVal,
                    meta: { type: 'stateful', keys: keys, mappings: [] }
                };
            }
            return { mode: 'SKIP', reason: 'NO_MARKERS_FOUND' };
        }

        // --- VALIDATION ---
        if (matches.length !== keys.length) {
            // Nếu số lượng không khớp -> Force DIRECT nếu là Single Key (để tự sửa lỗi)
            if (keys.length === 1) {
                const key = keys[0];
                let newVal = Object.prototype.hasOwnProperty.call(packet, key) ? String(packet[key]) : content;
                // Chuẩn hóa xuống dòng
                newVal = newVal.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                return {
                    mode: 'DIRECT',
                    content: newVal,
                    meta: { type: 'stateful', keys: keys, mappings: [] }
                };
            }
            return { mode: 'SKIP', error: 'STRUCTURE_MISMATCH' };
        }

        // --- CALCULATION (ATOMIC) ---
        const replacements = [];
        let hasChanges = false;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const currentVal = matches[i].inner;

            let newVal = Object.prototype.hasOwnProperty.call(packet, key) ? String(packet[key]) : currentVal;

            // Chuẩn hóa xuống dòng input mới
            newVal = newVal.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            if (newVal === '') newVal = GHOST;

            // So sánh: Nếu khác nhau thì tạo lệnh thay thế
            // Lưu ý: currentVal lấy từ regex đã tự loại bỏ \u200B nên so sánh rất chuẩn
            if (newVal !== currentVal) {
                replacements.push({
                    start: matches[i].start, // Thay thế từ đầu marker mở
                    end: matches[i].end,     // Đến hết marker đóng
                    val: `\u200B${newVal}\u200B` // Bọc lại bằng 1 lớp marker chuẩn duy nhất
                });
                hasChanges = true;
            }
        }

        if (!hasChanges) {
            return { mode: 'SKIP', meta: { type: 'stateful', keys: keys, mappings: [] } };
        }

        // Sort ngược để thay thế an toàn từ dưới lên
        replacements.sort((a, b) => b.start - a.start);

        return {
            mode: 'ATOMIC',
            replacements,
            meta: { type: 'stateful', keys: keys, mappings: [] }
        };
    }
}

