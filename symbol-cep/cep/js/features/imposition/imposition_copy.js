const SECTION_TITLES = {
    sec_artboard: 'Khổ in',
    sec_sheet_layout: 'Biên giấy',
    sec_size: 'Thành phẩm',
    sec_resize_mode: 'Resize',
    sec_options: 'Xử lý',
    sec_output_save: 'Lưu',
    sec_marks: 'Marks',
    sec_margins: 'Biên',
    pasteboard: 'Ghi chu in',
    schema: 'Schema'
};

const EDGE_LABELS = {
    left: 'Trái',
    right: 'Phải',
    top: 'Trên',
    bottom: 'Dưới'
};

export function getSectionTitle(section) {
    if (!section) return '';
    return SECTION_TITLES[section.id] || section.title || section.id || '';
}

export function getEdgeLabel(edge) {
    return EDGE_LABELS[edge] || edge || '';
}

export function formatRuntimeError(error) {
    let message = String(error || '').trim();

    if (!message || message === 'Unknown Error') {
        return 'Lỗi dàn trang: Lỗi không xác định.';
    }

    if (message === 'Invalid Engine Response Format') {
        return 'Lỗi dàn trang: Phản hồi từ engine không hợp lệ.';
    }

    message = message.replace(/^Layout Error:\s*/i, 'Lỗi bố cục: ');
    message = message.replace(/^Imposition Error:\s*/i, '');

    if (/^Lỗi /i.test(message) || /^Cảnh báo/i.test(message)) {
        return message;
    }

    return `Lỗi dàn trang: ${message}`;
}

export const impositionCopy = {
    shell: {
        subtitle: 'Chạy Preset và chỉnh cấu hình',
        tablistLabel: 'Điều hướng panel',
        tabs: {
            action: 'Chạy',
            config: 'Cấu hình'
        },
        reload: 'Tải lại panel',
        loading: {
            action: 'Đang tải danh sách...',
            config: 'Đang tải cấu hình...'
        }
    },
    action: {
        eyebrow: 'Preset',
        title: 'Chạy nhanh hoặc quản lý Preset',
        searchLabel: 'Tìm Preset',
        mode: {
            ariaLabel: 'Chế độ Preset',
            run: 'Chạy',
            manage: 'Quản lý'
        },
        placeholder: {
            run: 'Gõ tên Preset để chạy...',
            manage: 'Lọc Preset để quản lý...'
        },
        hint: {
            run: 'Tìm nhanh Preset gần đây và nhấn Enter để chạy.',
            manage: 'Quản lý Preset đã lưu, chạy lại khi cần và xóa an toàn.'
        },
        empty: {
            run: 'Không tìm thấy Preset phù hợp.',
            manage: 'Không tìm thấy Preset nào để quản lý.',
            manageInitial: 'Chưa có Preset nào. Hãy tạo mới ở tab Cấu hình.'
        },
        usageNeverRun: 'Chưa chạy',
        buttons: {
            runPreset: 'Chạy Preset',
            delete: 'Xóa'
        },
        saveAfterRun: {
            missingDirectory: 'Preset chua co thu muc luu. Hay chon thu muc roi Luu Preset lai.',
            promptTitle: 'Nhap tien to ten file',
            promptPlaceholder: 'Vi du: bai in thiep cuoi',
            promptConfirm: 'Chay va luu',
            promptCancel: 'Huy',
            promptRequired: 'Vui long nhap tien to ten file truoc khi chay.',
            promptMessage(label) {
                return label
                    ? `Preset "${label}" se luu AI sau khi binh. Hay nhap tien to ten file cho lan chay nay.`
                    : 'Preset nay se luu AI sau khi binh. Hay nhap tien to ten file cho lan chay nay.';
            },
            success(outputName) {
                return outputName
                    ? `Da luu bai in: ${outputName}`
                    : 'Da luu bai in thanh cong.';
            },
            previousDeleteWarning(error) {
                return error
                    ? `Da luu ban moi, nhung chua xoa duoc file cu: ${error}`
                    : 'Da luu ban moi, nhung chua xoa duoc file cu.';
            },
            failure(error) {
                return error
                    ? `Binh xong nhung luu that bai: ${error}`
                    : 'Binh xong nhung luu that bai.';
            },
            unavailable: 'Khong the goi buoc luu sau khi binh.',
            pickerUnavailable: 'Khong mo duoc hop chon thu muc luu tren may nay.',
            pickerError: 'Mo hop chon thu muc luu that bai.',
            pickerSelected: 'Da chon thu muc luu cho ban nhap nay. Hay bam Luu Preset de ap dung cho tab Chay.',
            pickerAppliedToPreset(label) {
                return label
                    ? `Da ap dung thu muc luu cho preset: ${label}`
                    : 'Da ap dung thu muc luu cho preset hien tai.';
            },
            pickerApplyFailed(error) {
                return error
                    ? `Da chon thu muc nhung chua ap dung vao preset: ${error}. Hay bam Luu Preset thu cong.`
                    : 'Da chon thu muc nhung chua ap dung vao preset. Hay bam Luu Preset thu cong.';
            }
        },
        deleteDialog: {
            title: 'Xóa Preset này?',
            confirm: 'Xóa Preset',
            cancel: 'Giữ lại Preset',
            message(label) {
                return label
                    ? `Preset "${label}" sẽ bị xóa khỏi danh sách đã lưu. Thao tác này không hoàn tác được.`
                    : 'Preset này sẽ bị xóa khỏi danh sách đã lưu. Thao tác này không hoàn tác được.';
            }
        },
        deleteError: 'Không thể xóa Preset.',
        autoGroupRestoreWarning: 'Cảnh báo: không thể khôi phục Auto-Group an toàn.',
        postflightWarning: 'Cảnh báo: có tác vụ hậu kiểm chưa hoàn tất.'
    },
    config: {
        eyebrow: 'Preset',
        title: 'Mở Preset hoặc tạo nháp mới',
        editHint: 'Đang sửa cấu trúc Schema. Nút thêm/xóa trường đã được bật.',
        compactHint: 'Bảng điều khiển đã gom các thông số thường dùng để bạn quét và nhập nhanh hơn.',
        toggleEdit: {
            on: 'Đóng sửa cấu trúc',
            off: 'Sửa cấu trúc'
        },
        presetLabel: 'Preset',
        presetPlaceholder: '-- Chọn Preset --',
        footerEyebrow: 'Lưu / chạy',
        footerLabel: 'Tên Preset',
        footerPlaceholder: 'Ví dụ: Catalogue A4',
        dryRunTitle: 'Chạy thử với giá trị hiện tại, không lưu Preset',
        dryRun: 'Chạy nháp',
        save: 'Lưu Preset',
        footerHint: 'Chạy nháp không lưu Preset. Chỉ lưu khi bạn muốn giữ lại cấu hình hiện tại.',
        saveFolderButton: 'Chon thu muc',
        modal: {
            title: 'Thêm hàng mới',
            helper: 'Chỉ dùng khi bạn đang chỉnh Schema. Hàng mới sẽ xuất hiện ngay trong section đang mở.',
            fieldLabel: 'Tên hàng',
            fieldPlaceholder: 'Ví dụ: Bù xéo',
            classificationLabel: 'Loại logic',
            classification: {
                baseline: 'Cơ bản (Baseline - An toàn/Xén)',
                structural: 'Cấu trúc (Structural - Gáy/Rãnh)',
                additive: 'Cộng thêm (Additive - Bù/Keo)'
            },
            cancel: 'Hủy',
            confirm: 'Thêm hàng'
        },
        removeFieldDialog: {
            title: 'Xóa trường khỏi Schema?',
            confirm: 'Xóa trường',
            cancel: 'Hủy',
            message(label, fieldId) {
                const target = label || fieldId;
                return `Trường "${target}" sẽ bị bỏ khỏi Schema đang chỉnh. Bạn có thể thêm lại sau nếu cần.`;
            }
        },
        removeRowDialog: {
            title: 'Xóa hàng khỏi Schema?',
            confirm: 'Xóa hàng',
            cancel: 'Hủy',
            message(label, rowId) {
                const target = label || rowId;
                return `Hàng "${target}" sẽ bị bỏ khỏi Schema đang chỉnh.`;
            }
        },
        error: {
            removeField: 'Lỗi: không xóa được trường đã chọn.',
            removeRow: 'Lỗi: không xóa được hàng đã chọn.',
            missingFieldName: 'Vui lòng nhập tên.',
            missingSection: 'Lỗi: không tìm thấy section hợp lệ.'
        }
    },
    pane: {
        sectionTitles: SECTION_TITLES,
        edgeLabels: EDGE_LABELS,
        border: {
            toggle: 'Viền',
            styleAria(label) {
                return `Kiểu viền cho ${label}`;
            },
            toggleAria(label) {
                return `Vẽ viền cho ${label}`;
            },
            styles: {
                solid: 'Solid',
                dashed: 'Dash'
            }
        },
        pasteboardLabel: 'Mau ghi chu in',
        pasteboard: {
            note: 'Slug duoc ghi ngoai artboard de nguoi in doc nhanh thong tin san xuat.',
            modeLabel: 'Cach ghi',
            modes: {
                standard: 'Mau chuan',
                custom: 'Tuy chinh',
                off: 'Tat'
            },
            previewLabel: 'Se ghi',
            emptyPreview: 'Khong ghi slug.',
            tokenLabel: 'Chen placeholder',
            previewPresetName: 'Preset'
        },
        schema: {
            note: 'Chỉ dùng khi bạn cần thêm hoặc xóa trường khỏi Schema hiện tại.',
            empty: 'Không có trường động để xóa.',
            remove: 'Xóa'
        },
        readOnlyHeading: 'Luồng cố định'
    },
    persistence: {
        missingPresetName: 'Vui lòng nhập tên Preset.',
        saveError: 'Không thể lưu Preset.',
        actionTabMissing: 'Lỗi: Action tab chưa sẵn sàng.',
        dryRunFallbackName: '[Nháp]',
        dryRunSuffix: 'Nháp',
        saveSuccess: {
            created(label) {
                return `Đã tạo Preset mới: ${label}`;
            },
            updated(label) {
                return `Đã cập nhật Preset: ${label}`;
            }
        },
        renameConflict: {
            title: 'Đổi tên Preset đang chỉnh?',
            message(oldLabel, newLabel) {
                return `Bạn đang đổi tên từ "${oldLabel}" sang "${newLabel}". Chọn cập nhật Preset cũ, lưu thành Preset mới hoặc quay lại để chỉnh tiếp.`;
            },
            confirm: 'Cập nhật Preset cũ',
            cancel: 'Lưu thành Preset mới',
            dismiss: 'Quay lại chỉnh tên'
        }
    },
    storage: {
        reason: {
            missing_target: 'Không tìm thấy nơi lưu Preset. Hãy kiểm tra symlink dữ liệu tại data/presets.json.',
            invalid_json: 'Preset storage có dữ liệu JSON không hợp lệ. Hãy kiểm tra tệp preset/usage và backup.',
            write_denied: 'Không thể ghi vào nơi lưu Preset chính. Hãy kiểm tra quyền ghi hoặc symlink target.',
            usage_write_denied: 'Không thể cập nhật thống kê sử dụng Preset. Bạn vẫn có thể chạy Preset, nhưng usage sẽ không được lưu.'
        }
    },
    preflight: {
        groupCheck: {
            title: 'Kiểm tra Group',
            message: 'Phát hiện {count} đối tượng rời (chưa Group).\n\n- Chọn "Tự động Group" nếu bạn quên group.\n- Chọn "Giữ nguyên" nếu bạn cố ý không group.',
            primary: 'Tự động Group',
            secondary: 'Giữ nguyên',
            cancel: 'Dừng',
            emptySelection: 'Chưa chọn đối tượng nào. Vui lòng chọn nội dung cần xếp trước khi chạy.',
            selectionError: 'Lỗi kiểm tra vùng chọn',
            checkUnavailable: 'Kh\u00f4ng th\u1ec3 ki\u1ec3m tra Group tr\u01b0\u1edbc khi ch\u1ea1y. Vui l\u00f2ng t\u1ea3i l\u1ea1i panel v\u00e0 th\u1eed l\u1ea1i.'
        },
        garbage: {
            title: 'Tiền kiểm',
            confirmMessage(count) {
                return `Cảnh báo: phát hiện ${count} cụm vật thể (rác) đang không được chọn trên Artboard.\\n\\nNếu tiếp tục, file ghép có thể đè lên phần rác này và làm hỏng bản in.\\n\\nBạn có muốn tự động xóa rác để tiếp tục không?`;
            },
            clearError: 'Lỗi khi xóa rác',
            checkUnavailable: 'Kh\u00f4ng th\u1ec3 ki\u1ec3m tra r\u00e1c tr\u00ean Artboard tr\u01b0\u1edbc khi ch\u1ea1y. Vui l\u00f2ng t\u1ea3i l\u1ea1i panel v\u00e0 th\u1eed l\u1ea1i.',
            clearUnavailable: 'Kh\u00f4ng th\u1ec3 x\u00f3a r\u00e1c tr\u00ean Artboard do l\u1ed7i k\u1ebft n\u1ed1i v\u1edbi Illustrator. Vui l\u00f2ng th\u1eed l\u1ea1i.',
            unavailable: 'Kh\u00f4ng th\u1ec3 ho\u00e0n t\u1ea5t b\u01b0\u1edbc ti\u1ec1n ki\u1ec3m r\u00e1c tr\u00ean Artboard. Vui l\u00f2ng t\u1ea3i l\u1ea1i panel v\u00e0 th\u1eed l\u1ea1i.'
        }
    }
};

impositionCopy.action.buttons.overwrite = 'Luu de';
impositionCopy.action.buttons.saveAsNew = 'Luu moi';
impositionCopy.action.saveAfterRun.missingOverwriteTarget = 'File hien tai chua co duong dan luu. Hay Save file nay hoac dung Luu moi lan dau.';
impositionCopy.action.saveAfterRun.explicitModeRequired = 'Preset nay co 2 cach luu. Hay chon Luu de hoac Luu moi.';
impositionCopy.action.saveAfterRun.promptTitle = 'Nhap ten file moi';
impositionCopy.action.saveAfterRun.promptConfirm = 'Luu moi';
impositionCopy.action.saveAfterRun.promptMessage = function (label) {
    return label
        ? `Preset "${label}" se tao file AI moi sau khi binh. Hay nhap tien to ten file cho lan chay nay.`
        : 'Preset nay se tao file AI moi sau khi binh. Hay nhap tien to ten file cho lan chay nay.';
};
