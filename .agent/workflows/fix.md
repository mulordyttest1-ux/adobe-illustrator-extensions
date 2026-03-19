---
description: "Pha 3: Fix/test bug bằng RAG cộng đồng thay vì tự sáng tạo"
---

# /fix — FIX & TEST BUG

Khi khởi chạy lệnh này, Agent BẮT BUỘC chạy theo trình tự sau (KHÔNG được tự suy luận fix):

1. **[NỘI BỘ - Community First RAG cho Bug]** Tự động nạp `skills/community_first/SKILL.md`. Chạy ANTI-TUNNEL-VISION: Bung 3 giả thuyết độc lập (Nông → Sâu) → SEARCH web với 3 query theo 3 giả thuyết → EXTRACT pitfall và edge case từ cộng đồng.
2. **[NỘI BỘ - CEP Live Testing]** Nạp `skills/testing/SKILL.md` để setup CDP debug hoặc debug script trên Adobe Illustrator nếu cần test thực tế.
3. **[§E1 - Isolate]** Dùng tool (bash, Node, debug script) để chứng minh hoặc loại trừ từng giả thuyết TRƯỚC khi chọn hướng fix.
4. **[FIX]** Sửa root cause đã được chứng minh. KHÔNG patch bề mặt.
5. **[VALIDATE]** Chạy `npm run lint` + kiểm tra thực tế. Nếu vẫn fail: Lặp lại từ bước 1 với giả thuyết mới. Fail >3 lần → Báo Sếp.
