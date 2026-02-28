---
name: Lint (Nx Enhanced)
description: Load khi lint fails hoặc cần fix Nx architecture/naming violations.
version: 1.0
---

# Skill: Lint (Nx Enhanced)

> Extends Core Protocol §C5.

## §L1 — COMMANDS

// turbo
```bash
npm run lint:wedding    # Wedding CEP
npm run lint:all        # Toàn bộ Monorepo
```

## §L2 — RULES

| Rule | Level | Action |
|:-----|:------|:-------|
| `@nx/enforce-module-boundaries` | 🛑 Error | BẮT BUỘC sửa. Không `eslint-disable` |
| `camelcase` | ⚠️ Warning | Sửa nếu đang sửa file đó |
| `no-var` | 🛑 Error | Đổi sang `const/let` |
| `complexity` | ⚠️ Warning | Tách hàm nếu > 12 |
| `no-unused-vars` | 🛑 Error | Xóa biến rác |

## §L3 — CONFIG
- **File:** `shared/eslint.config.mjs`
- **Plugin:** `@nx/eslint-plugin`
- **Globals:** `CSInterface`, `Bridge`, etc. (xem trong config)
