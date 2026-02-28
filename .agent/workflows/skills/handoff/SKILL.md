---
name: Context Handoff
description: Load khi context sắp đầy, đổi conversation, hoặc switch model. Bảo toàn state.
version: 1.0
---

# Skill: Context Handoff

> Load khi context sắp đầy, đổi conversation, hoặc switch model.

## §H1 — SESSION CHECKPOINT (Khi context sắp đầy hoặc task dở dang)
- [ ] Ghi state hiện tại vào `task.md` (progress %)
- [ ] Ghi tóm tắt findings vào compliance report
- [ ] Kiểm tra `task.md` đã cập nhật đúng trạng thái
- [ ] Ghi "RESUME POINT: [mô tả bước tiếp theo]" vào `task.md`

## §H2 — RESUME (Khi mở conversation mới)
- [ ] Đọc `task.md` → Tìm "RESUME POINT"
- [ ] Đọc compliance report → Nắm context
- [ ] Đọc `GOVERNANCE.md` → Cập nhật state
- [ ] Tiếp tục từ bước ghi trong RESUME POINT

## §H3 — MODEL SWITCH (Khi chuyển model theo §M5)
1. Agent hoàn thành §M5 → Output recommendation
2. Agent chạy §H1 (checkpoint state vào `task.md`)
3. User switch model
4. Model mới chạy §H2 (resume từ checkpoint)

> **Note:** `task.md` là nguồn sự thật duy nhất cho tiến độ.
