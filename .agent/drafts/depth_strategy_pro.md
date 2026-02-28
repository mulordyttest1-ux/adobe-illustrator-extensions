# PLAN (Phần 2): Kiến trúc hóa rào cản ép độ sâu (Architectural Constraints) - Pro Perspective

**Bối cảnh:** Bản kế hoạch trước của Flash mắc một sai lầm cơ bản của Model nhỏ: **Chỉ dùng Prompt Engineering để tự răn đe bản thân** (như "phải tự giải trình trước khi code"). Khi context đủ dài, Flash sẽ "quên" lời hứa này và trở lại lối mòn lười biếng.
Để "ép" độ sáng tạo và độ sâu của Flash, chúng ta không được dùng lời khuyên, mà phải dùng **Rào cản Kiến trúc (Hard Constraints)** trong `core_protocol.md` và `task.md`.

## BẰNG CHỨNG HỢP LỆ (COMPLIANCE EVIDENCE)
- §C0/§M (Model): D1=4, Model=Gemini 2.0 Pro
- §C1 (Community): Frameworks tiên tiến (như LangGraph, AutoGPT) ép Model nhỏ làm việc sâu bằng cách chia nhỏ Context, bắt buộc định lượng Execution, và tách biệt luồng Planning/Acting.
- §C2 (Scope Lock): `core_protocol.md`, `task.md`.

---

## Các Thay Đổi Kiến Trúc Đề Xuất (Pro's Architectural Proposal)

### 1. Định lượng tuyệt đối "Độ Sâu" của §C2 Scope Lock 🔴
Không để Flash tự quyết định bao nhiêu là đủ. Phải ép bằng con số.
- **Thay đổi quy tắc:** Thay vì viết "Tìm các file ảnh hưởng", Core Protocol sẽ quy định **"BẮT BUỘC TRUY VẾT ĐỘ SÂU = 2 (Trace Depth = 2)"**.
- **Cơ chế hoạt động:** 
  - Lớp 1: Gọi `grep` để tìm hàm bị sửa.
  - Lớp 2: Gọi `grep` 1 lần nữa để tìm **các hàm đang gọi đến hàm ở Lớp 1 (Callers of Callers)**.
  - Nếu thiếu output grep của Lớp 2 trong bằng chứng §C2 -> Vi phạm Protocol, cấm code. Thao tác này ép Flash phải nạp thêm ngữ cảnh sâu hơn vào bộ nhớ tạm.

### 2. Tiêm cơ chế Test-Driven Execution (TDE) vào Phase 2
Flash thường code xong mới nghĩ cách test (dẫn đến làm qua loa).
- **Thay đổi quy tắc:** Trước khi cấp quyền dùng tool `replace_file_content` thay đổi mã nguồn, Flash **PHẢI** khởi tạo một Artifact mang tên `verification_checklist.md` (hoặc chèn trực tiếp vào `task.md`).
- **Nội dung bắt buộc:** Định nghĩa chính xác **Lệnh Terminal sẽ chạy (`npm run...`, `node eval...`)** hoặc **Sự thay đổi của UI (DOM/CSS)**.
- **Tại sao nó hiệu quả?** Quá trình viết ra cách để "hành hạ" đoạn code sắp viết sẽ ép bộ não của Flash lường trước các edge-cases trước khi thực sự gõ dòng code đầu tiên.

### 3. Phá vỡ Vòng lặp Mộng du (Decouple the Error Loop) 🔴
Khi Flash gặp lỗi (Verify ĐỎ), nó thường dùng ngay context hiện tại để "chắp vá" thật nhanh.
- **Thay đổi quy tắc:** Đưa luật **"Tẩy não tạm thời / State Reset"** vào mục §E1 của Core Protocol.
- **Cơ chế:** Khi bị lỗi (Fail), Flash bị **CẤM** gọi lại tool `replace_file_content` vào **cùng một file** ngay lập tức.
- Nó bắt buộc phải làm 1 trong 2 hành động:
  1. (Giống Sếp gợi ý): Tạm thời mở 1 file khác (vd: `GOVERNANCE.md` hoặc `.agent/memory/...`) để "đọc lại triết lý" -> Chuyển hướng sự chú ý (Attention Shifting).
  2. Viết ra 3 Giả thuyết như §E1 hiện hành, NHƯNG phải **sử dụng tool gọi console (`run_command`) để ép xuất file log** ra ngoài, sau đó mới dùng tool đọc file log đó. Việc "đường vòng" này phá vỡ vòng lặp Action-Loop ngay tại bộ đệm của Transformer.

---

## Kế hoạch Xác minh (Verification Plan)
1. **Duyệt Plan:** Sếp so sánh 3 "Rào cản Kiến trúc" này của Pro với 3 "Lời dặn dò" của Flash ở Phần 1 xem mức độ "khóa tay" Model lười biếng cái nào chặt chẽ hơn.
2. **Triển khai:** Nếu Sếp duyệt bản Pro này, em sẽ nhúng các Rào cản định lượng này ("Độ sâu = 2", "Test-Driven") thẳng vào `core_protocol.md` và `task.md`.
