# C2 Scope Lock: Font Encoding & Date Processing Logic

## Tệptin chịu ảnh hưởng (Impacted Files)
1. **`wedding-cep/cep/index.html`**: File nạp bundle. Lỗi font (Mojibake) thường xảy ra do thẻ `<script src="js/bundle.js">` thiếu định nghĩa charset utf-8 rõ ràng, làm Chromium (CEP) nhận nhầm thành ANSI trên Windows.
2. **`wedding-cep/cep/js/logic/validators/GlobalDateValidator.js`**: Tầng logic kiểm định ngày mồ côi (Global Truth).
3. **`wedding-cep/cep/js/app.js`**: Điểm neo báo lỗi khởi động (UIFeedback).

## Đối Tượng Tiêu Thụ (Consumers)
- **UIFeedback (Toast / Alert):** Tất cả các lệnh báo lỗi Tiếng Việt.
- **DateFallbackParser:** Phụ thuộc 100% vào `GlobalDateValidator.js` để vét máng các con số.

## Rủi Ro & Khoanh Vùng (Risk Mitigation)
- **Encoding Drift:** Không đổi cấu hình esbuild (vì nó đã là `utf-8`), chỉ thêm `charset="utf-8"` vào thẻ script trong HTML để ép CEP phải đọc đúng định dạng.
- **Logic False Negative:** Nếu nới lỏng `GlobalDateValidator`, ta có nguy cơ nhận sai mốc ngày. Giải pháp: Ràng buộc nếu xuất hiện > 1 ngày thì ta chuyển sang cảnh báo thay vì `return null` (Giữ nguyên mốc đầu tiên tìm thấy hoặc loại bỏ tính toàn cục cho ngày, chỉ giữ tính toàn cục cho Tháng/Năm để DateFallbackParser sử dụng).

-> **Scope Lock: AN TOÀN**. Chỉnh sửa ở tầng Validator và UI nạp thẻ, không làm sập các Pipeline chính.
