---
description: Chạy ESLint kiểm tra code quality và architecture boundaries
---

# Lint Workflow

> **Khi nào dùng:** Sau khi sửa code, trước khi báo cáo hoàn thành.
> **Bắt buộc:** Agent PHẢI chạy lint và xử lý tất cả errors trước khi kết thúc task.

---

## Setup (Chỉ chạy 1 lần)

```bash
cd cep
npm install --save-dev eslint
```

> ⚠️ Nếu npm install bị lỗi EBADF (Google Drive sync), thử copy thư mục `cep` ra local temp trước khi install.

---

## Chạy Lint

// turbo
```bash
cd cep && npx eslint js/ --ignore-pattern bundle.js --ignore-pattern "*.test.js" --ignore-pattern "libs/"
```

---

## Xử lý kết quả

1. **0 errors** → ✅ Tiếp tục
2. **Có errors** → Sửa tất cả errors
3. **Có warnings** → Xem xét, sửa nếu hợp lý
4. **KHÔNG ĐƯỢC** thêm `// eslint-disable` comments

---

## File cấu hình

- **Config:** `cep/.eslintrc.cjs`
- **Types:** `cep/js/types.d.ts`
- **Globals:** Đã khai báo trong `.eslintrc.cjs` (match window.* trong app.js)
