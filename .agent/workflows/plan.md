---
description: "Pha 1: Trinh sát cộng đồng + xuất kế hoạch triển khai"
---

# /plan — NGHIÊN CỨU & LÊN KẾ HOẠCH

Khi khởi chạy lệnh này, Agent BẮT BUỘC chạy theo trình tự sau (KHÔNG được bỏ bước):

1. **[NỘI BỘ - Community First RAG]** Tự động nạp `skills/community_first/SKILL.md`. Chạy toàn bộ Step 0→3: DEFINE bài toán → SEARCH web tìm Best Practice → EXTRACT tinh hoa → ALIGN với codebase hiện tại.
2. **[NỘI BỘ - Model Check]** Nếu task phức tạp (D1≥3), nạp `skills/model_selection/SKILL.md` để đề xuất model phù hợp.
3. **[NỘI BỘ - Ideation]** Nếu yêu cầu mơ hồ hoặc task hoàn toàn mới, nạp `skills/ideation/SKILL.md` để làm rõ trước khi research.
4. **[XUẤT BÁO CÁO C1]** Lưu kết quả research vào `.task_steps/c1_<tên_app>_document.md`. TUYỆT ĐỐI KHÔNG lưu gộp thành `C1_document.md`.
5. **[XUẤT KẾ HOẠCH]** Dựa vào C1, xuất Implementation Plan (mini-plan trong chat nếu D1≤2, hoặc file nếu D1≥3).
6. **[DỪNG]** Chờ Sếp duyệt kế hoạch. TUYỆT ĐỐI CẤM viết code ở bước này.
