# 🚩 DANH SÁCH LỖI & RỦI RO PHÁT HIỆN (AUDIT REPORT)
*Dự án: Wedding CEP - Phase 2 (Tab 2 Schema Injection)*
*Người kiểm định: Antigravity Agent*

---

## 🟥 LỖI NGHIÊM TRỌNG (Cần xử lý ngay)

### 1. Rủi ro Nhận diện Selection (Index Mapping Risk)
- **Mô tả:** Code hiện tại dùng số thứ tự `index` (0, 1, 2...) để định danh TextFrame giữa Web và Illustrator.
- **Hệ quả:** Nếu trong lúc Web đang xử lý (vài miligiây), Sếp click chuột hoặc Illustrator tự sắp xếp lại danh sách Selection, dữ liệu `{pos1.ong}` có thể bị tiêm nhầm vào khung chứa tên Bà.
- **Giải pháp:** Tạm thời gán thêm UUID giả (kết hợp `top` + `left` + `originalText`) để Bridge kiểm tra chéo trước khi ghi đè.

---

## 🟧 LỖI TRUNG BÌNH (Nên cải thiện)

### 2. Tiêm Cụm sai số lượng (Selection Mismatch)
- **Mô tả:** Nút "Tiêm Cụm" hiện tại chỉ kiểm tra `if (length > 3)`. Nếu Sếp chọn 2 đối tượng (VD: Tên con và Địa chỉ), app vẫn sẽ phang biến `{ong}` và `{ba}` vào đó. 
- **Hệ quả:** Sai lệch dữ liệu trầm trọng nếu người dùng chọn thiếu/sai.
- **Giải pháp:** Bắt buộc số lượng Selection phải bằng 3 cho tính năng Tiêm Cụm, hoặc liệt kê rõ danh sách sẽ tiêm trước khi thực hiện.

### 3. Cạnh tranh tọa độ (Y-Axis Conflict)
- **Mô tả:** Nếu Ông và Bà nằm thẳng hàng ngang (cùng một tung độ `top`), thuật toán sắp xếp JS sẽ trả về kết quả ngẫu nhiên (hoặc theo index cũ).
- **Hệ quả:** Thứ tự Ông/Bà bị hoán đổi hên xui.
- **Giải pháp:** Bổ sung **Secondary Sort (Left-to-Right)**. Nếu `top` bằng nhau, khung nào nằm bên Trái hơn sẽ được ưu tiên là `{ong}`.

---

## 🟨 RỦI RO THẤP (Theo dõi thêm)

### 4. Hiệu năng khi chọn diện rộng (Selection Overhead)
- **Mô tả:** Đã gỡ bỏ giới hạn 30 frames theo triết lý YAGNI. 
- **Rủi ro:** Nếu Sếp lỡ tay `Ctrl+A` chọn cả ngàn đối tượng, Illustrator sẽ bị "đơ" khoảng vài giây để serialize dữ liệu gửi qua Bridge.
- **Giải pháp:** Giữ nguyên (Vì thiệp cưới hiếm khi quá phức tạp).

---

## 📝 KẾT LUẬN KIỂM ĐỊNH
**Trạng thái:** 🟢 Có thể sử dụng (Beta) nhưng cần fix Bug #03 để đảm bảo độ tin cậy Tuyệt đối.

---
*Báo cáo này được thực hiện dựa trên quy trình §V (Validation) của @runbook.md.*
