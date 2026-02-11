# ðŸš€ QUICK REFERENCE (Auto-Compiled)

> **Má»¥c Ä‘Ã­ch:** Context nhanh cho Agent (~2K tokens).
> **Source:** ÄÆ°á»£c compile tá»± Ä‘á»™ng tá»« cÃ¡c file SKILL.md. KHÃ”NG sá»­a file nÃ y thá»§ cÃ´ng.
> **Last Build:** 2026-01-25 11:56

---

## ðŸ“ PROJECT OVERVIEW
| Key | Value |
|-----|-------|
| **Project** | Wedding Scripter |
| **Stack** | ES3 (Host) + ES6+ (CEP) |
| **Architecture** | Hexagonal |

---

## ðŸ”¥ EXTRACTED SKILLS (TL;DR)

### [Hexagonal_Rules](skills/Hexagonal_Rules/SKILL.md)
- **MỤC ĐÍCH:** Tách biệt Core (Domain) khỏi Infrastructure để dễ test, dễ mở rộng.
- **KHI NÀO DÙNG:** Khi thêm file mới, refactor, hoặc review code structure.
- **RULE QUAN TRỌNG:**
  - Domain **KHÔNG BAO GIỜ** import từ Infrastructure.
  - Use Case nhận Repository qua **Dependency Injection** (không tự `new`).
  - Logic nằm ở CEP/JS (V8), IO nằm ở ExtendScript/JSX (ES3).
- **❌ SAI LẦM PHỔ BIẾN:** Domain gọi `app.activeDocument` trực tiếp, dùng ES6 trong file .jsx.
- **LIÊN KẾT:** [Project_Context](../Project_Context/SKILL.md), [Coding_Principles](../Coding_Principles/SKILL.md)



### [Code_Style_Standard](skills/Code_Style_Standard/SKILL.md)
- **MỤC ĐÍCH:** Đảm bảo code consistency, dễ đọc, dễ maintain trong môi trường ES3
- **KHI NÀO DÙNG:** Mỗi khi viết code mới hoặc review code
- **RULE QUAN TRỌNG:**
  - Biến/hàm: `camelCase` | Hằng: `UPPER_SNAKE` | Class: `PascalCase`
  - Private: prefix `_` | Boolean: prefix `is/has/can`
  - IIFE wrapper: `(function() { ... })();`
- **❌ SAI LẦM PHỔ BIẾN:** Trailing comma, quên `var self = this` trong callback
- **LIÊN KẾT:** [ES3_ES6_Boundary](../ES3_ES6_Boundary/SKILL.md)



### [ES3_ES6_Boundary](skills/ES3_ES6_Boundary/SKILL.md)
- **MỤC ĐÍCH:** Tránh SyntaxError do dùng sai JS version theo vị trí file
- **KHI NÀO DÙNG:** Mỗi khi viết code mới hoặc sửa code trong `cep/` hoặc `src/`
- **RULE QUAN TRỌNG:**
  - `cep/js/**/*.js` = **ES6+** OK (arrow, const, let, class)
  - `cep/jsx/**/*.jsx` + `src/**/*` = **ES3 ONLY** (var, function, no arrow)
- **❌ SAI LẦM PHỔ BIẾN:** Dùng arrow function trong `.jsx` file → SyntaxError
- **LIÊN KẾT:** [Code_Style_Standard](../Code_Style_Standard/SKILL.md), [CEP_Standards](../CEP_Standards/SKILL.md)



### [Wedding_Domain_Knowledge](skills/Wedding_Domain_Knowledge/SKILL.md)
1.  **Object:** Thiệp Cưới (Wedding Card) với 2 bên (Nam/Nữ) + Lễ + Tiệc.
2.  **Logic:** Tự động tách tên (Họ/Đệm/Tên), tự sinh Prefix (Ông/Bà), tự tính ngày (Lễ/Tiệc/Nháp).
3.  **Flow:** UI (JS) → Packet → Adapter → Illustrator (ES3) update TextFrame.
4.  **Key Rule:** Font Unicode dựng sẵn. TextFrame name match key schema.
5.  **Files:** Schema (`Config_Schema.js`), Logic (`NameProcessor.js`), Adapter (`MetadataAdapter.jsx`).



---

## ðŸ”„ WORKFLOWS
| Workflow | Link |
|----------|------|
| add_new_field | [View](workflows/add_new_field.md) |
| safe_refactor | [View](workflows/safe_refactor.md) |
| resume-session | [View](workflows/resume-session.md) |
| close-session | [View](workflows/close-session.md) |
| feature_development_quick_ref | [View](workflows/feature_development_quick_ref.md) |
| feature_development | [View](workflows/feature_development.md) |