# Monorepo Migration — Remaining Steps

> **Ngữ cảnh:** Đã migrate từ 2 CEP rời rạc trên Google Drive (I:) sang Monorepo trên `C:\Projects\adobe-illustrator-extensions`.
> **Ngày tạo:** 2026-02-11
> **Conversation gốc:** d42f846e-6cee-4240-8ddc-683d018feec6

---

## ✅ Đã Hoàn Thành
- [x] Tạo cấu trúc Monorepo: `wedding-cep/`, `symbol-cep/`, `shared/`, root `.agent/`
- [x] Copy cả 2 CEP vào monorepo
- [x] Gộp governance vào root `.agent/` (workflows, hooks, AGENT_PREFERENCES)
- [x] Tạo `shared/eslint.config.mjs` (Shared Lint Config)
- [x] Tạo root `package.json`, `.gitignore`, `README.md`
- [x] Tạo per-project `PROJECT_STATUS.md`
- [x] Archive key artifacts vào `.agent/memory/planning/`
- [x] Copy monorepo sang ổ C
- [x] Cài Git, config user
- [x] `git init`

---

## ⏳ Cần Làm Tiếp

### 1. Hoàn tất Git Init
```powershell
cd "C:\Projects\adobe-illustrator-extensions"
git add .
git commit -m "Initial: Monorepo structure"
```

### 2. Install Dependencies & Build
```powershell
npm install
npm run build:wedding
```
> Nếu gặp lỗi Execution Policy:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### 3. Verify Lint
```powershell
npm run lint:wedding
```

### 4. Push lên GitHub
- Tạo repo mới trên [github.com](https://github.com) (Private, KHÔNG init README)
- Chạy:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/adobe-illustrator-extensions.git
git branch -M main
git push -u origin main
```

### 5. Update Illustrator Symlink
- Extension hiện tại đang trỏ về ổ I (cũ)
- Cần update symlink để trỏ về `C:\Projects\adobe-illustrator-extensions\wedding-cep\cep`
- Xem script: `.agent/create_symlink.ps1`

### 6. Xóa Folder Cũ trên ổ I (SAU KHI verify xong)
- `I:\My Drive\script ho tro adobe illustrator\cep\` → Đã có bản copy tại `wedding-cep/cep/`
- `I:\My Drive\script ho tro adobe illustrator\template cep hexagon symbol\` → Đã có bản copy tại `symbol-cep/`

### 7. Mở Workspace Mới
- VS Code → File → Open Folder → `C:\Projects\adobe-illustrator-extensions`
- Agent mới sẽ đọc `.agent/` để hiểu governance

---

## 📋 Governance Architecture (Tóm tắt)
- **Root `.agent/`**: Shared governance (workflows, hooks, rules) — sửa 1 lần, áp dụng cả 2 project
- **`shared/`**: Shared tooling (eslint config)
- **Per-project `PROJECT_STATUS.md`**: Context riêng từng project
- Chi tiết: `.agent/memory/planning/governance_architecture_strategy.md`

---

## 🐛 Known Issues Fixed (Session này)
- **NameValidator.js**: Ethnic names (H Ňĭ Mlô) bị false positive do VietnamesePhonetics. Fix: Skip phonetics khi `isEthnic = true`.
- **Build Pipeline**: Phải chạy `node build.cjs` sau mỗi lần sửa code JS (CEP dùng `bundle.js`).
