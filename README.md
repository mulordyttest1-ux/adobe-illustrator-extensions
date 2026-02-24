# Adobe Illustrator Extensions — Monorepo

> **Monorepo chứa các CEP Extension chuyên dụng cho Adobe Illustrator.**
> *Được phát triển với kiến trúc Hexagonal (Domain-Driven Design) để đảm bảo tính ổn định và dễ bảo trì.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Adobe CEP](https://img.shields.io/badge/Adobe-CEP-FF0000.svg)](https://github.com/Adobe-CEP)

---

## 📂 Cấu trúc Dự Án

```bash
├── .agent/              # Governance (workflows, rules, hooks)
├── shared/              # Shared Tooling (ESLint config, helpers)
├── symbol-cep/          # [NEW] Imposition Extension (Clean Architecture)
├── wedding-cep/         # [LEGACY] Wedding Scripter (Đang refactor)
├── package.json         # Root devDependencies
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Yêu Cầu (Prerequisites)
- **Node.js**: v16+ (Khuyên dùng v18 LTS)
- **Adobe Illustrator**: CC 2020 (v24.0) trở lên.
- **OS**: Windows / macOS

### 2. Cài Đặt (Installation)

Chạy lệnh sau tại thư mục gốc để cài đặt dependencies và tạo symlink tự động:

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo Symlink vào thư mục Extensions của Adobe (Yêu cầu Admin/Sudo)
# Windows:
Get-Content .agent/create_symlink.ps1 | PowerShell.exe -noprofile -
# Mac/Linux:
# sh .agent/create_symlink.sh (Chưa implement)
```

> **Lưu ý:** Nếu không chạy script symlink, hãy copy thủ công folder `wedding-cep` và `symbol-cep` vào đường dẫn extensions của Adobe:
> - **Win:** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
> - **Mac:** `/Library/Application Support/Adobe/CEP/extensions/`

### 3. Debugging
1. Mở **Adobe Illustrator**.
2. Vào menu `Window` > `Extensions` > `Imposition Panel (Dev)` hoặc `Wedding Scripter (Dev)`.
3. Mở trình duyệt (Chrome) và truy cập cổng debug:
   - **Symbol CEP:** `http://localhost:9088`
   - **Wedding CEP:** `http://localhost:9097`

---

## 🛠️ Development

### Commands
| Command | Mô tả |
| :--- | :--- |
| `npm run lint:all` | Kiểm tra lỗi cú pháp (Lint) toàn bộ projects. |
| `npm run lint:symbol` | Chỉ lint project Symbol CEP. |
| `npm run lint:wedding` | Chỉ lint project Wedding CEP. |
| `npm run build:wedding` | Build bản production cho Wedding CEP. |

### Architecture Guidelines
Dự án tuân thủ nghiêm ngặt quy chuẩn kiến trúc "Agent Friendly":
- **Small Files:** Max 150 dòng/file.
- **Explicit Deps:** Không dùng biến global ẩn.
- **Layered:** Tách biệt Logic (Domain) và Giao diện (UI).

Xem chi tiết governance tại `.agent/`.

---

## ⚠️ Known Limitations
- **Wedding CEP:** Vẫn sử dụng kiến trúc cũ (Monolithic) ở một số module (`CompactFormBuilder`). Đang trong quá trình refactor.
- **Cross-Platform:** Script tạo symlink hiện chỉ hỗ trợ Windows (PowerShell).

---

## 🤝 Contributing
1. Fork dự án.
2. Tạo branch feature (`git checkout -b feature/AmazingFeature`).
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`).
4. Push lên branch (`git push origin feature/AmazingFeature`).
5. Open một Pull Request.

---

*(c) 2024-2026 DinhSon. All rights reserved.*
