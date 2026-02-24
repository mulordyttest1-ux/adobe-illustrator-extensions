---
description: Chạy ESLint với Nx Architecture & Naming Rules
---

# Lint Workflow (Nx Enhanced)

> **Khi nào dùng:** Sau khi sửa code, trước khi báo cáo hoàn thành.
> **Bắt buộc:** Agent PHẢI chạy lint và xử lý tất cả Architecture/Naming Violations.

---

## Lệnh Thực Thi

Chạy từ thư mục gốc (`c:\Projects\adobe-illustrator-extensions`):

// turbo
```bash
npm run lint:wedding
```

(Hoặc `npm run lint:all` để kiểm tra cả Symbol CEP)

---

## Các phân hệ kiểm tra

Lệnh này sử dụng cấu hình tập trung tại `shared/eslint.config.mjs` và bao gồm:

1.  **Architecture Police (`@nx/enforce-module-boundaries`):**
    *   ❌ Cấm `libs/wedding/domain` import từ `app`.
    *   ❌ Cấm `libs` import ngược lên `cep/js`.
    *   ✅ Chỉ cho phép App -> Domain.

2.  **Naming Police (`camelcase`):**
    *   ❌ Report lỗi nếu tên biến là `snake_case`. (Trừ properties của object).
    *   ✅ Yêu cầu `camelCase` cho variable declarations.

3.  **Code Quality:**
    *   `no-var` (Tuyệt đối không dùng var)
    *   `complexity` (Hàm quá phức tạp)
    *   `no-unused-vars` (Biến rác)

---

## Xử lý kết quả

1.  **Architecture/Naming Violations:** 🛑 **BẮT BUỘC SỬA**.
    *   Không được dùng `// eslint-disable` để bypass Architecture.
2.  **Legacy Errors (no-var...):** ⚠️ Có thể bỏ qua nếu đang không sửa file đó.
    *   Nếu sửa file đó, hãy tiện tay fix luôn `no-var` -> `const/let`.
3.  **Bundle Size:**
    *   Lệnh Lint độc lập với Build, nhưng nên chạy Build sau khi Lint xong để chắc chắn.

---

## File cấu hình

- **Config:** `shared/eslint.config.mjs` (Dùng chung cho toàn bộ Monorepo)
- **Plugins:** `@nx/eslint-plugin`
