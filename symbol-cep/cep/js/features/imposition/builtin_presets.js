/**
 * BuiltinPresets: Standard Configurations for the System
 * Maps UI fields to the Margin Rule Engine via schema-based configuration.
 * 
 * REMOVED FIELDS (Step 2163 - Option C Cleanup):
 * ─────────────────────────────────────────────────────
 * - bleed_top, bleed_bottom, bleed_left, bleed_right (Removed Step 1899)
 * - opt_draw_border (Replaced by per-row {row.id}_draw_border)
 * - border_style (Replaced by per-row {row.id}_border_style)
 * - border_weight (Hardcoded to 0.5pt in mod_symbol.jsx)
 * - border_edges (Replaced by per-margin checkbox toggles)
 * 
 * DEPRECATED (No longer supported):
 * ─────────────────────────────────────────────────────
 * - payload.geometry.safe (Must use payload.schema.sections)
 * - payload.geometry.finish (Must use payload.schema sec_size fields)
 * - frame.margins (Must use frame.yieldPadding)
 */

export const BuiltinPresets = [
    {
        id: "standard_imposition",
        name: "Căn Lề Chuẩn (Standard)",
        version: "2.0",
        description: "Cấu hình tiêu chuẩn: An toàn, Gáy sách, Rãnh xé, tự động tính khổ và hỗ trợ vẽ viền.",
        sections: [
            {
                id: "sec_artboard",
                title: "Khổ in (Sheet Size)",
                layout: "grid-2",
                fields: [
                    { id: "ab_w", label: "Rộng (Width)", type: "number", placeholder: "mm" },
                    { id: "ab_h", label: "Cao (Height)", type: "number", placeholder: "mm" }
                ]
            },
            {
                id: "sec_sheet_layout",
                title: "Bố cục Trang in (Sheet Layout Matrix)",
                layout: "matrix",
                headers: ["Trái (Left)", "Phải (Right)", "Trên (Top)", "Dưới (Bottom)"],
                rows: [
                    {
                        id: "row_gripper",
                        label: "Biên Giấy (Sheet Margins)",
                        classification: "STRUCTURAL",
                        fields: {
                            left: { id: "sheet_m_left", binding: false, placeholder: "mm" },
                            right: { id: "sheet_m_right", binding: false, placeholder: "mm" },
                            top: { id: "sheet_m_top", binding: false, placeholder: "Nhíp (mm)" },
                            bottom: { id: "sheet_m_bot", binding: false, placeholder: "mm" }
                        }
                    }
                ]
            },
            {
                id: "sec_size",
                title: "Kích thước Thành phẩm (mm)",
                layout: "grid-2",
                fields: [
                    { id: "finish_w", label: "Rộng (Width)", type: "number", step: 0.1, placeholder: "Auto", protected: true },
                    { id: "finish_h", label: "Cao (Height)", type: "number", step: 0.1, placeholder: "Auto", protected: true }
                ]
            },
            {
                id: "sec_resize_mode",
                title: "Chế độ Resize (Geometry Decision)",
                layout: "stack",
                semantic: "GEOMETRY_LOCK",
                fields: [
                    {
                        id: "resize_mode",
                        type: "radio",
                        label: "Chế độ co giãn thiết kế:",
                        options: [
                            { val: "preserve", txt: "🔒 Giữ tỷ lệ (Preserve Ratio) - Không méo" },
                            { val: "fill", txt: "📐 Lấp đầy khung (Fill Frame) - Chấp nhận méo" }
                        ],
                        default: "preserve",
                        protected: true,
                        binding: false
                    }
                ]
            },
            {
                id: "sec_options",
                title: "Tùy chọn Xử lý (Pipeline Order)",
                layout: "stack",
                fields: [
                    { id: "opt_clone", label: "01. [Bắt buộc] Tạo bản sao (Isolation)", type: "checkbox", default: true, protected: true },
                    { id: "opt_cleanup", label: "02. Làm sạch (Pre-flight Cleanup)", type: "checkbox", default: true, protected: true },
                    { id: "opt_k100", label: "03. Chuyển màu đen (K100)", type: "checkbox", default: true, protected: true },
                    { id: "opt_mod_layout_checkpoint", label: "04. Resize selection", type: "checkbox", default: true, protected: true, disabled: true, semantic: "CHECKPOINT", binding: false },
                    { id: "opt_symbol_mode", label: "05. Tạo Symbol (Proxy Asset)", type: "checkbox", default: true, protected: true },
                    { id: "opt_layout_head_to_head", label: "06. Xếp kiểu đấu đầu (Head-to-Head 180°)", type: "checkbox", default: false, note: "Xoay ngược hàng chẵn" },
                    { id: "opt_n_up", label: "07. Bình dàn trang (N-Up Layout)", type: "checkbox", default: true, protected: true },
                    { id: "opt_custom_rotate", label: "08. Xoay toàn bộ thiết kế (Custom Rotation)", type: "checkbox", default: false, binding: false },
                    { id: "custom_rotate_angle", label: "___ Góc xoay (độ)", type: "number", default: 0, binding: false, note: "VD: 90, 180, 45..." },
                    {
                        id: "align_position",
                        label: "09. Căn vị trí (Alignment)",
                        type: "select",
                        options: [
                            { val: "tl", txt: "↖ Top-Left" },
                            { val: "tc", txt: "↑ Top-Center" },
                            { val: "tr", txt: "↗ Top-Right" },
                            { val: "ml", txt: "← Middle-Left" },
                            { val: "mc", txt: "● Center" },
                            { val: "mr", txt: "→ Middle-Right" },
                            { val: "bl", txt: "↙ Bottom-Left" },
                            { val: "bc", txt: "↓ Bottom-Center" },
                            { val: "br", txt: "↘ Bottom-Right" }
                        ],
                        default: "tl",
                        binding: false
                    },
                    {
                        id: "info_template",
                        label: "10. Mẫu thông tin Pasteboard (Template)",
                        type: "textarea",
                        placeholder: "{count} tem - Khổ {width}x{height}",
                        binding: false,
                        note: "Biến hỗ trợ: {preset_name}, {count}, {width}, {height}, {timestamp}"
                    }
                ]
            },
            {
                id: "sec_marks",
                title: "Cấu hình Mark Xén (Trim Marks)", // Tiêu đề riêng, dễ nhìn
                layout: "stack", // Xếp dọc chuẩn, không hack
                fields: [
                    {
                        id: "opt_draw_marks",
                        label: "08. Kích hoạt vẽ Mark xén",
                        type: "checkbox",
                        default: true,
                        binding: false
                    },
                    {
                        id: "mark_len",
                        label: "___ Độ dài Mark (mm)", // Thêm prefix ___ để thụt đầu dòng giả lập cấp con
                        type: "number",
                        default: 5,
                        binding: false
                    },
                    {
                        id: "mark_weight",
                        label: "___ Độ dày nét (pt)",
                        type: "number",
                        default: 0.5,
                        binding: false
                    },
                    {
                        id: "mark_style_hybrid",
                        label: "___ Style: 1 đầu Solid / 1 đầu Dash",
                        type: "checkbox",
                        default: true,
                        binding: false,
                        note: "Giúp phân biệt đường cắt và đường gấp."
                    }
                ]
            },
            {
                id: "sec_margins",
                title: "Thiết lập Biên (Margins - Matrix)",
                layout: "matrix",
                headers: ["Trái (Left)", "Phải (Right)", "Trên (Top)", "Dưới (Bottom)"],
                rows: [
                    {
                        id: "row_safe",
                        label: "Vùng An Toàn",
                        classification: "BASELINE",
                        fields: {
                            left: { id: "safe_left", placeholder: "mm", protected: true, binding: { classification: "BASELINE", edge: "left" } },
                            right: { id: "safe_right", placeholder: "mm", protected: true, binding: { classification: "BASELINE", edge: "right" } },
                            top: { id: "safe_top", placeholder: "mm", protected: true, binding: { classification: "BASELINE", edge: "top" } },
                            bottom: { id: "safe_bottom", placeholder: "mm", protected: true, binding: { classification: "BASELINE", edge: "bottom" } }
                        },
                        // NEW: Per-row border toggle
                        borderControl: {
                            id: "safe_draw_border",
                            label: "Vẽ viền (Draw Border)",
                            default: false,
                            styleId: "safe_border_style"
                        }
                    }
                ]
            }
        ]
    }
];
