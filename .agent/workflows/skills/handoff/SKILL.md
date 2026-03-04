---
name: Context Handoff
description: Load khi context sắp đầy, đổi conversation, hoặc switch model. Bảo toàn state.
version: 1.0
---

# Skill: Context Handoff

> Load khi context sắp đầy, đổi conversation, hoặc switch model.

## §H1 — DỌN DẸP VÀ CHỐT TRẠNG THÁI (State Preservation)
*Khi context sắp đầy, token burn cao, hoặc kết thúc Milestone*
- [ ] Xóa bỏ/đánh dấu hoàn tất các tác vụ cũ trong `task.md`.
- [ ] Tổng hợp các bài học, quyết định kỹ thuật sâu sắc vào file `.task_steps/Memory.md` (Living Documentation).
- [ ] Ghi chú "RESUME POINT: [Việc cần làm ngay trong Session tiếp theo]" ở đỉnh file `task.md`.
- [ ] Đảm bảo `C1_document.md` hoặc `IMPLEMENTATION_PLAN` vẫn phản ánh đúng thực tế.

## §H2 — KHÔI PHỤC NGỮ CẢNH (Khi mở Cuộc trò chuyện mới)
- [ ] Đọc file `task.md` → Tìm "RESUME POINT" làm mục tiêu trọng tâm tức khắc.
- [ ] Đọc file `.task_steps/Memory.md` → Load nguyên tắc kiến trúc (Architecture constraints).
- [ ] KHÔNG dùng lệnh `view_file` đọc toàn cục dự án để tiết kiệm Token, chỉ đọc 1-2 file codebase thật sự cần sửa.
- [ ] Tiếp tục code từ bước RESUME POINT.

## §H3 — MODEL SWITCH (Khi chuyển model theo §M5)
1. Agent hoàn thành §M5 → Output recommendation
2. Agent chạy §H1 (checkpoint state vào `task.md`)
3. User switch model
4. Model mới chạy §H2 (resume từ checkpoint)

> **Note:** `task.md` là nguồn sự thật duy nhất cho tiến độ.
