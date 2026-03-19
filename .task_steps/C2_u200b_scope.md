# Báo Cáo Khoanh Vùng Tiền Xử Lý (Ingestion Sanitizer Scope Lock)

Sếp yêu cầu rà soát MỌI ĐIỂM HÚT DATA để cấy `IngestionSanitizer` vào mà không bị lọt lưới. Qua rà quét (Grep Search) toàn bộ mã nguồn, dưới đây là danh sách CÁC NẠN NHÂN đang trực tiếp nuốt dữ liệu sống từ AI:

## 1. Các Hành Động (Actions) Nuốt Data Thô
Hệ thống hiện tại có 5 đầu mối đang gọi hàm `bridge.scanDocument()` hoặc `bridge.readSelectionObjects()`:
1. `cep/js/actions/ScanAction.js` (Dòng 32)
2. `cep/js/actions/PostflightAction.js` (Dòng 17)
3. `cep/js/actions/ManualInjectAction.js` (Dòng 197)
4. `cep/js/actions/InjectSchemaAction.js` (Dòng 67)
5. `cep/js/controllers/helpers/WeddingProActionHandler.js` (Dòng 16)

## 2. Điểm Chốt Chặn Tập Trung (Choke Point)
Nếu chúng ta cấy `IngestionSanitizer` lắt nhắt vào 5 file trên, hệ thống sẽ bị Phân mảnh (Fragmentation) và dễ bề sót lỗi sau này, vi phạm nguyên tắc DRY (Don't Repeat Yourself).

🎯 **Đề xuất Kiến trúc Cấy Ghép (Injection Point):**
Thay vì sửa 5 file Action, ta chỉ cần CHẶN HỌNG ngay tại 1 file duy nhất: **`bridge.js`**.
Các hàm `scanDocument()`, `readSelectionObjects()`, và `collectFrames()` bên trong `bridge.js` sẽ bọc hàm `IngestionSanitizer.sanitizeFrames(res.data)` trước khi `return` kết quả cho 5 thằng kia. 

Kiến trúc này đảm bảo:
- **Tập trung:** Chặn đứng 100% rác U200B ngay từ đường biên giới.
- **An toàn:** 5 module Action phía trên KHÔNG CẦN BIẾT ĐẾN sự tồn tại của Rác. Chúng chỉ việc nhận Dữ liệu Đã Làm Sạch (Sanitized Data).

## Danh sách tệp cần can thiệp (Scope Lock):
- **Tạo mới:** `cep/js/logic/pipeline/IngestionSanitizer.js`
- **Chỉnh sửa:** `cep/js/bridge.js` (Sửa 3 hàm API Methods)
- **Cập nhật:** `C1_document.md` và `task.md`

Tất cả đã được đưa vào vòng kiểm tỏa!
