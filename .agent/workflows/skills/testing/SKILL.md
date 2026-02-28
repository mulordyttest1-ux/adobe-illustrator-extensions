---
name: CEP Live Testing
description: Load khi test, debug, fix bug trên Adobe Illustrator. Bao gồm CDP setup và Hybrid Agentic Testing.
version: 1.0
---

# Skill: CEP Live Testing

> Extends Core Protocol §C5. Hướng dẫn test trực tiếp trên Adobe Illustrator.

## §T1 — PREREQUISITES (Một lần duy nhất)
- Registry: `Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value 1`
- Symlink: chạy `.agent/create_symlink.ps1`
- CDP: `npm install chrome-remote-interface --no-save`

## §T2 — TEST LOOP (Sau mỗi sửa code)
1. `npm run build:wedding` (BẮT BUỘC)
2. Reload Panel (đóng/mở hoặc CDP reload script)
3. `npm run test:e2e` hoặc `node test_smoke.cjs`

## §T3 — DEBUGGING
- Chrome DevTools: `http://localhost:8097` → Chọn "Wedding Scripter"
- Console, Network tab hoạt động như web bình thường

## §T4 — HYBRID AGENTIC TESTING

### Bug Regression (Quy trình Trị Lỗi Tái Phát):
1. **Phân tích** (Não): Không vội sửa. Phân tích kịch bản sinh lỗi
2. **Dệt lệnh** (Tay): Viết CDP test vào `test_smoke.cjs` → Xác nhận **FAILED ĐỎ**
3. **Fix bug:** Sửa code JS
4. **Xác nhận:** Chạy lại → **PASSED XANH** → Xóa sổ Bug

### Feature Testing (Tự động mở rộng):
1. Agent tự suy luận 3-5 edge cases phá hoại
2. Embed CDP test tự động vào `test_smoke.cjs`
3. Chạy `npm run test:e2e` trước khi bàn giao

## §T5 — TROUBLESHOOTING

| Lỗi | Fix |
|:-----|:----|
| Code không thay đổi | `npm run build:wedding` + Reload Panel |
| Connection Refused | Mở Extension, check `.debug` port 8097 |
| npm lỗi policy | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `require` not defined | CEP = browser, dùng `import/export` |

## §T6 — NHẮC NHỞ
- **Luôn nhớ Build** trước khi test: `npm run build:wedding`
- **Luôn nhớ Reload** Panel trước khi test
- **Báo cáo kiểm thử:** PHẢI ghi rõ các case đã test + kết quả
