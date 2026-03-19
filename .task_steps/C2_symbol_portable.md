# C2 Scope Lock: Portable Configuration Storage

## File chịu ảnh hưởng (Impacted Files)
1.  **`symbol-cep/cep/js/features/imposition/data_store.js`**: 
    - Đây là file trọng tâm. Toàn bộ logic `localStorage` sẽ được thay thế hoặc bọc bởi logic File System (`window.cep.fs`).
    - Cần thêm cơ chế kiểm tra sự tồn tại của thư mục và tệp trước khi đọc/ghi.

## Người tiêu thụ (Consumers)
- `ActionTab`: Gọi `dataStore.getPresets()` để hiển thị danh sách.
- `ConfigPersistence`: Gọi `dataStore.savePreset()` khi người dùng nhấn Lưu.
- `Bridge`: Có thể dùng thông tin từ DataStore để gửi sang JSX.

## Phân tích Rủi ro (Risk Analysis)
- **Cấp độ: Vàng (Caution).** 
- Việc thao tác với File System có rủi ro về quyền truy cập (Permissions). Tuy nhiên, thư mục `Documents` thường có quyền ghi mặc định cho người dùng hiện hành.
- Cần cơ chế **MIGRATE**: Khi người dùng mở bản mới, nếu thấy file JSON chưa có nhưng `localStorage` có dữ liệu, phải tự động copy từ `localStorage` vào file để không làm mất dữ liệu cũ của Sếp.

-> **Scope Lock:** Chỉ can thiệp duy nhất vào Module `DataStore`. Các tầng UI như `ActionTab` sẽ không nhận ra sự thay đổi này (Abstraction Layer được giữ nguyên).
