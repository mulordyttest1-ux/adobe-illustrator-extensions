---
name: Safe Refactoring
description: Load khi restructuring code — rename, move, split, merge. ExtendScript ES3 cần thận trọng tuyệt đối.
version: 1.0
---

# Skill: Safe Refactoring

> Extends Core Protocol. Bổ sung các bước AN TOÀN cho refactor.
> ⚠️ ExtendScript ES3 KHÔNG CÓ test framework. Phải thận trọng tuyệt đối.

## §R1 — ALIAS FIRST (Trước khi xóa, tạo alias)

| Pattern | Quy trình |
|:--------|:----------|
| Đổi tên hàm | `var newName = oldName;` → Test → Xóa cũ |
| Di chuyển file | Copy sang mới → Đổi load path → Test → Xóa cũ |
| Tách function | Extract helper → Gọi từ gốc → Test → Dọn dẹp |
| Gộp function | Tạo merged → Alias cũ gọi merged → Test → Xóa alias |

## §R2 — ROLLBACK PLAN
- Ghi nhớ state trước refactor (script chạy OK, UI hiển thị OK)
- Nếu lỗi: Revert → Check namespace → Check load order → Restart AI
- Luôn giữ file cũ cho đến khi file mới chạy ổn định

## §R3 — CLEANUP (Sau khi ổn định)
- [ ] Xóa aliases tạm
- [ ] Dead Code Hunting (quét file/hàm mồ côi)
- [ ] Decoupling Audit (kiểm tra circular dependency)
- [ ] **Grep Broken Refs:** `grep -r "tên_file_cũ"` trong `.agent/` và project → sửa tất cả references
- [ ] Chạy §C5 (`npm run verify`)

## §R4 — ES3 PITFALLS

| Lỗi | Nguyên nhân | Fix |
|:-----|:------------|:----|
| `undefined is not a function` | File chưa load | Check load order trong manifest |
| `Cannot read property` | Namespace chưa init | `$.global.NS = $.global.NS \|\| {}` |
| UI trống sau refactor | Module export sai | Check `$.global.ModuleName` |
| Lỗi lần chạy thứ 2 | Engine giữ state cũ | Dùng `#targetengine` hoặc restart |
