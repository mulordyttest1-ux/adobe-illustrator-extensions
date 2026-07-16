# C2 Scope Lock: Font Encoding Alerts in CEP

## Tệptin chịu ảnh hưởng (Impacted Files)
1. **`symbol-cep/cep/index.html`**: File Entrypoint chịu tải toàn bộ môi trường WebView Chromium. Nếu cấu hình mất đi BOM, JS Load từ đây về sẽ sai mã hóa, nhất là text dùng cho giao diện hay `alert`.

## Đối Tượng Tiêu Thụ (Consumers)
- **Hệ thống Alert nội bộ (`window.alert`)**: Tất cả các lệnh cảnh báo người dùng khi tương tác như thêm mới Config, Lưu file, Lỗi validate. (Cảnh báo "Vui lòng nhập tên", "Lỗi: Không tìm thấy", v.v... đang hiển thị Tiếng Việt bị vỡ font).

## Rủi Ro & Khoanh Vùng (Risk Mitigation)
- **Thêm Charset Tag:** Bổ sung `charset="utf-8"` vào các thẻ `<script>` gọi CSInterface, fuse, và bundle. Đây là giải pháp tiêu chuẩn và vô hại. Nó sẽ ép Chromium Parser đọc đúng file JS theo định dạng phổ quát, bỏ qua môi trường Windows đang chạy chuẩn ANSI hay CP-1252.

-> **Scope Lock: AN TOÀN**. Không có Logic nghiệp vụ chính (Core) nào của hệ thống chịu ảnh hưởng. Việc fix UI Error này là tuyệt đối cô lập.
