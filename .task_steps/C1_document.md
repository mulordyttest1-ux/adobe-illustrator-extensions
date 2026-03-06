# 🔎 C1_document: Báo Cáo Khảo Sát Sức Khỏe Kiến Trúc (Architectural Audit)

> **Context:** Thực thi Bước 1 (Trinh Sát) theo lệnh `@[.agent/workflows/runbook.md]` nhằm tìm diệt Code Thừa, Code Rối và các module vi phạm nguyên tắc Decoupling trong dự án Wedding CEP. Tất cả số liệu dựa trên bản Audit codebase mới nhất.

---

## 🚨 1. Điểm Tắc Nghẽn (Bottlenecks) & God Objects (Ôm Đồm)

### 🔴 `DateGridWidget.js` (Báo Động Đỏ)
Từng là một thành phần giao diện đơn thuần, file này nay đã phình to (180 lines) và đang gánh vác quá nhiều trách nhiệm, vi phạm nghiêm trọng **Single Responsibility Principle (SRP)**:
- Vừa quản lý Vòng Đời UI (`create`, `_bindEvents`).
- Vừa nhúng tay sâu vào Logic tính toán (Gọi trực tiếp `DateLogic.computeDependentDate`, `computeLunarFromSolar`).
- Vừa xử lý xác thực (gọi `InputEngine.process`, `InputEngine.validateDateLogic`).
- Vừa trực tiếp ra lệnh cho DOM (`DateGridDOM.updateFieldSilently`, `.toggleRowState`).
- **Hệ lụy:** Tight Coupling (Kết dính chặt). Bất kỳ thay đổi nhỏ nào về Logic Âm Lịch hoặc Quy tắc Valid Input đều buộc phải chọc vào Widget này để sửa.

### 🟡 `app.js` (Báo Động Vàng)
Dù đã được tách hàm `_wireSchemaActions` ở phiên làm việc trước để ép xuống dưới 80 dòng, hàm `init()` và thân file này vẫn mang đậm dấu ấn "Tạp Hóa":
- Chứa toàn bộ Logic Router thủ công (`TabbedPanel`).
- Chứa logic khai báo Biến Toàn Cục (`window.UIFeedback = UIFeedback;`).
- Móc nối (Wire) toàn bộ DOM Events từ Tab 1 (Compact) đến Tab 2 (Schema).
- **Hệ lụy:** Quá khó để Test Độc Lập. Khởi tạo mọi thứ Dồn Cục cùng 1 lúc dẫn tới chậm thời gian bật Panel.

---

## 🧹 2. Dấu Tích Code Thừa / Logic Dư Thừa (Redundancy)

### Đoạn logic thừa trong `SchemaInjector.js`
Trong khi duyệt mảng để xây dựng Kế Hoạch Tiêm `ATOMIC`, logic sort giảm dần mảng `replacements` đang bị lặp lại không cần thiết:
- Ở dòng `174`: `replacements.sort((a, b) => b.start - a.start);`
- Nhưng khi tạo `changes.push(...)`, lại duyệt sinh ra 1 mảng khác `sortedAsc` ở dòng `190` để lấy keys, khiến Complexity của hàm tăng lên.

---

## 📐 3. Đề Xuất Tái Cấu Trúc (Decoupling Strategy)

Nếu được cấp lệnh lên Bước §C3, em đề xuất các mũi khoan sau:

**Mũi khoản 1: Giải phóng `DateGridWidget.js` (The Facade Pattern)**
- Rút toàn bộ logic rẽ nhánh (`_handleBlur`, `_syncFromMaster`) ra một file riêng tên là `DateGridController.js`.
- `DateGridWidget` chỉ giữ đúng 1 vai trò: Phơi bày các sự kiện CustomEvent (vd: `onFieldChange`, `onRowToggle`) cho Controller bắt và xử lý.
- Cách ly hoàn toàn Widget khỏi Domain (`DateLogic`). Chuyển giao trách nhiệm gọi Domain cho Controller.

**Mũi khoản 2: Dependency Injection cho `app.js` (Chống Global Variables)**
- Sử dụng EventBus hoặc Pub/Sub cơ bản để các Action (vd `ScanAction`, `UpdateAction`) mớm kết quả thông báo Toast mà không cần gọi `window.showToast` chềnh ềnh.

---
> 🚦 **CHỈ PHÂN TÍCH - KHÔNG SỬA CODE:** Đây là báo cáo sơ bộ để Sếp cái nhìn toàn cảnh. Mời Sếp đánh giá và chỉ đạo trọng tâm Refactor để em lập Plan Thi Công Cụ Thể (Bước §C3).
