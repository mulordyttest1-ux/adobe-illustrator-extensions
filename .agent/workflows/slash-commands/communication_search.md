---
description: "Trạm Search (Bước 1): Kích hoạt skill community_first để lập báo cáo C1_document.md"
version: 1.1 (Trigger for Community Skill)
---

# 🔎 BƯỚC 1: CỘNG ĐỒNG & NGỮ CẢNH (Communication Search Launcher)

> **MỤC TIÊU CỐT LÕI:**
> Không bao giờ nhảy vào code. KHÔNG BAO GIỜ!

Khi User gõ lệnh `@/communication_search [Yêu Cầu]`, Agent **BẮT BUỘC** thực hiện quy trình sau:

1. **NẠP SKILL:** Dùng công cụ `view_file` để đọc CHẤT XÁM (Logic RAG) từ file gốc:
   👉 `c:\Projects\adobe-illustrator-extensions\.agent\workflows\skills\community_first\SKILL.md`
   
2. **THỰC THI SKILL C1:** Áp dụng NGHIÊM NGẶT Step 0 đến Step 3 của skill vừa nạp. 
   *(Lưu ý: Phải quan sát ngữ cảnh Codebase hiện tại trước khi phán xét kết quả search)*.

3. **XUẤT BÁO CÁO:** Sau khi hoàn thành Step 3 của `community_first/SKILL.md`, Agent tổng hợp thành bản báo cáo và lưu vào `c:\Projects\adobe-illustrator-extensions\.task_steps\C1_document.md`.

4. **DỪNG LẠI:** Yêu cầu User kiểm duyệt bản báo cáo. Không được phép sang Bước C2/C3 thiết kế code.

---

> **Dành cho User:** 
> Sau khi Agent xuất file báo cáo C1 thành công. Sếp đọc lại, nếu đã chuẩn với định hướng của sếp, sếp tiếp tục gõ lệnh tiến công:
> `@[.agent/workflows/runbook.md] Tiến hành code tính năng này dựa trên C1.`
