# 🕹️ COMMAND CENTER - WEDDING SCRIPTER
> **Protocol:** One-File Blackboard
> **Last Updated:** 2026-01-29
> **Mode:** ✅ RELEASE READY

## 🛑 1. CRITICAL RULES (Luật Bất Biến)
*Agent phải tuân thủ tuyệt đối các quy tắc này:*

1.  **CEP Native Only:**
    *   `cep/js/*.js`: **ES6+ OK** (Class, Const, Let, Arrow).
    *   `cep/jsx/*.jsx`: **ES3 Only** (var, function).
    *   **KHÔNG** dùng NPM, Webpack, hoặc external imports.
2.  **UI Philosophy:** "Compact Professional" (Mật độ cao, Padding nhỏ 4px, Font 11px, Label canh trái).
3.  **Forbidden Actions:** Không chạy lệnh CLI cũ. Không tạo file rác ở root. Tất cả tài liệu tham khảo nằm trong `.agent/memory/`.
4.  **Atomic Knowledge Updates:** Bất cứ khi nào tạo/sửa file `SKILL.md`, **BẮT BUỘC** phải chạy script `.agent/memory/scripts/rebuild_index.ps1` ngay lặp tức.
5.  **Active Safeguards:** Hệ thống Hooks (`.agent/hooks.json`) đang hoạt động để chặn ES6 trong file .jsx. KHÔNG bypass các checks này.
6.  **Language Protocol (Ngôn Ngữ):** BẮT BUỘC sử dụng **Tiếng Việt** cho giải thích, báo cáo và giao tiếp với User. Tiếng Anh chỉ dùng cho thuật ngữ kỹ thuật không thể dịch.

---

## ⚠️ 2. ACTIVE NOTES (Lưu Ý Hiện Tại)
*Codebase đang ở trạng thái stable. Không có task đang active.*

| Note | Chi tiết |
|------|----------|
| **Status** | ✅ **RELEASE READY** (Deep Clean Completed) |
| **Testing** | Production Ready (Verified by Audit) |

---


## ⚡ AUTOMATION & COMMANDS (Extraction Strategy)
*   **/check-es3**: Quét lỗi ES6 trong mã nguồn ExtendScript.
*   **/deploy-cep**: Helper để link extension và kiểm tra cài đặt.
*   **Hook: ES3 Guard**: Tự động chặn khi viết `const/let` vào file `.jsx`.
*   **Hook: Deploy Sync**: Nhắc restart AI sau khi build.

---

## 🧠 SYSTEM MEMORY POINTERS (Tự động tra cứu)
*Khi thực hiện task, Agent tự động tìm kiếm kiến thức tại đây:*

*   **⚡ Quick Reference:** `.agent/memory/QUICK_REFERENCE.md` ← **ĐỌC TRƯỚC TIÊN** (~2K tokens)
*   **Coding Standards:** `.agent/memory/skills/Code_Style_Standard/`
*   **Architecture Rules:** `.agent/memory/skills/Hexagonal_Rules/`
*   **CEP/UI Guidelines:** `.agent/memory/skills/CEP_Standards/`
*   **Refactoring Guide:** `.agent/memory/skills/Safe_Refactoring/`
*   **Debugging:** `.agent/memory/skills/Troubleshooting/`
*   **Workflows:** `.agent/memory/workflows/`
*   **Templates:** `.agent/memory/templates/`
*   **Planning Docs:** `.agent/memory/planning/`
---

## 3. COMPLETED TASK LIST
[x] Task C1: Remove Tab 1 (Wedding Pro) - **DONE**
[x] Task C2: Set Compact as default tab - **DONE**
[x] Task C3: Deep cleanup orphaned files - **DONE**
[x] Task C4: UX Input Enhancement - **DONE**
[x] Task C5: Final Production Code Cleanup - **DONE**
[x] Task C6: Refactor DateGridWidget (Split Logic/View/CSS) - **DONE**

---

## 📁 STRUCTURE (CEP Architecture - Cleaned)

```
.agent/                   # 🧠 COMMAND CENTER
├── memory/               #   - Active Knowledge
└── PROJECT_STATUS.md     #   - Command Center
cep/                      # 💎 MAIN CODEBASE
├── index.html            #   - UI Entry
├── css/                  #   - Styles
├── js/
│   ├── bridge.js         #   - CEP ↔ JSX communication
│   ├── components/       #   - UI Components
│   ├── controllers/      #   - Controllers
│   └── logic/            #   - Business Logic (ES6)
└── jsx/
    └── illustrator.jsx   #   - ExtendScript (ES3)
installer/                # 📦 CEP Installer Scripts
```

---

## 🔧 QUICK ACTIONS

### Để bắt đầu task mới:
1. Đọc file này để nắm rules
2. Check `.agent/task.md` để xem task hiện tại
3. [Auto-Generated] Đọc `.agent/memory/QUICK_REFERENCE.md` để lấy context nhanh
4. Nếu cần chi tiết → vào `.agent/memory/skills/[SKILL_NAME]/SKILL.md`

### Khi thêm/sửa Skill:
1. Thêm section `## 🚀 TL;DR` vào đầu file SKILL.md
2. Chạy script: `.agent/memory/scripts/rebuild_index.ps1`
3. Kiểm tra lại `QUICK_REFERENCE.md`

### Khi gặp lỗi:
1. Check `.agent/memory/skills/Troubleshooting/`
2. Check `.agent/memory/planning/` nếu liên quan architecture

---

## 🌐 MULTI-DEVICE NOTES (Google Drive Sync)
- ✅ Cấu trúc folder đơn giản, không dùng symlinks
- ✅ Không dùng absolute paths trong config
- ✅ Tất cả paths trong docs dùng relative format
- ⚠️ Nếu conflict: ưu tiên file có timestamp mới nhất
