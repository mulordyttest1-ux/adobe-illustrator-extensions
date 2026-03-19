---
description: "Pha 2: Thực thi code theo quy trình chuẩn §C1→§C5"
---

# /build — THỰC THI CODE

Khi khởi chạy lệnh này, Agent BẮT BUỘC chạy theo trình tự sau (KHÔNG được bỏ bước):

1. **[NỘI BỘ - Load SSOT]** Tự động nạp `skills/core_protocol/SKILL.md` (v4.7 SSOT) để đọc toàn bộ luật gốc + §C1-§C5.
2. **[§C1 - Đọc C1]** Tìm và đọc đúng file báo cáo C1 theo tên app đang làm (VD: `c1_wedding_cep_document.md`). KHÔNG search web lại.
3. **[§C2 - Scope Lock]** Dùng `grep_search` kiểm tra consumers của file sẽ sửa. Ghi kết quả vào `.task_steps/C2_<tên_app>_scope.md`.
4. **[§C3 - Contract]** Xuất Implementation Plan và DỪNG chờ Sếp duyệt. KHÔNG tự động sang bước tiếp khi chưa được phép.
5. **[§C4 - Execute]** Sau khi Sếp duyệt: Viết code incremental từng file, KHÔNG đập sập toàn bộ file cũ.
6. **[§C5 - Validate]** Tự động chạy `npm run lint`. Nếu lỗi Nx architecture, nạp `skills/lint/SKILL.md`. Nếu feature mới cần test, nạp `skills/testing/SKILL.md`.
