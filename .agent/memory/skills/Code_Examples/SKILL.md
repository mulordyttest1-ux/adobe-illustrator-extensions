---
name: Code_Examples
description: Thư viện code examples thực tế từ Wedding Scripter project - Domain, Adapters, UI, Utilities
---

# Skill: Code Examples Library

> **MỤC ĐÍCH:** Cung cấp working code examples để agent copy-paste và adapt, tránh phải suy luận từ principles

---

## 📚 Structure

```
Code_Examples/
├── SKILL.md (file này - index và hướng dẫn)
├── examples/
│   ├── domain/          (Business logic, pure functions)
│   ├── adapters/        (Illustrator API, BridgeTalk, File I/O)
│   ├── ui/              (ScriptUI components, layouts)
│   └── utilities/       (ES3 helpers, polyfills)
└── templates/           (Boilerplate cho new files)
```

---

## 🎯 Khi nào dùng

| Situation | Look in | Example File |
|:----------|:--------|:-------------|
| Cần xử lý tên người | `domain/` | `name_processor_example.jsx` |
| Cần format date | `domain/` | `date_formatter_example.jsx` |
| Cần validate input | `domain/` | `validation_example.jsx` |
| Cần đọc TextFrame từ AI | `adapters/` | `illustrator_reader_example.jsx` |
| Cần build ScriptUI form | `ui/` | `schema_driven_form_example.jsx` |
| Cần dùng BridgeTalk | `adapters/` | `bridgetalk_example.jsx` |
| Cần ES3 array helpers | `utilities/` | `array_helpers_es3.jsx` |
| Cần tạo module mới | `templates/` | `domain_service_template.jsx` |

---

## 📋 Examples Catalog

### Domain Layer (Business Logic)

| File | Purpose | Lines | When to Use |
|:-----|:--------|:------|:------------|
| `name_processor_example.jsx` | Xử lý tên + role + index | ~80 | Add/modify tên participant |
| `date_formatter_example.jsx` | Parse và format dates | ~60 | Wedding date processing |
| `validation_example.jsx` | Validate user input | ~70 | Form validation |
| `string_helpers_example.jsx` | String manipulation | ~50 | Text processing |

### Adapter Layer

| File | Purpose | Lines | When to Use |
|:-----|:--------|:------|:------------|
| `illustrator_reader_example.jsx` | Read TextFrames from AI doc | ~90 | Scan document |
| `illustrator_writer_example.jsx` | Write to TextFrames | ~80 | Update document |
| `bridgetalk_example.jsx` | Cross-engine communication | ~100 | Palette → Main engine |
| `file_io_example.jsx` | Read/write files | ~70 | Save/load preferences |

### UI Layer

| File | Purpose | Lines | When to Use |
|:-----|:--------|:------|:------------|
| `schema_driven_form_example.jsx` | Build form from schema | ~120 | Dynamic UI generation |
| `custom_widget_example.jsx` | Custom ScriptUI component | ~90 | Special input needs |
| `validation_feedback_example.jsx` | Show validation errors | ~60 | User feedback |

### Utilities

| File | Purpose | Lines | When to Use |
|:-----|:--------|:------|:------------|
| `array_helpers_es3.jsx` | map, filter, reduce for ES3 | ~80 | Array operations in JSX |
| `object_helpers_es3.jsx` | Object utilities | ~70 | Object manipulation |
| `json_polyfill.jsx` | JSON.stringify/parse | ~100 | JSON in ES3 |
| `string_utils.jsx` | Advanced string ops | ~60 | String processing |

### Templates

| File | Purpose | When to Use |
|:-----|:--------|:------------|
| `domain_service_template.jsx` | New domain service | Creating business logic module |
| `adapter_template.jsx` | New adapter | Wrapping external API |
| `ui_component_template.jsx` | New UI component | Custom ScriptUI widget |

---

## 🚀 How to Use

### 1. Identify Need

Tra cứu table ở trên hoặc search trong thư mục `examples/`

### 2. Copy Example

```javascript
// Mở file example
// Copy entire function/module
// Paste vào working file
```

### 3. Adapt to Context

- Đổi tên function/variables cho phù hợp
- Modify logic nếu cần
- Keep structure và patterns

### 4. Test

- Chạy trong Illustrator
- Verify output
- Fix bugs if any

---

## 📖 Reading an Example File

Mỗi example file có structure:

```javascript
/**
 * Example: [Name]
 * 
 * PURPOSE: [What it does]
 * 
 * WHEN TO USE:
 * - [Use case 1]
 * - [Use case 2]
 * 
 * HEXAGONAL LAYER: [Domain/Application/Infrastructure]
 * DEPENDENCIES: [None / List dependencies]
 * 
 * @example
 * [Usage example]
 */

// === MAIN CODE === //
function ExampleFunction() {
    // Implementation with inline comments explaining WHY
}

// === USAGE EXAMPLE (Remove in production) === //
// Test code demonstrating how to use
```

**Format notes:**
- JSDoc header đầy đủ
- Inline comments giải thích WHY not WHAT
- Working code (tested)
- Usage examples at bottom (remove khi copy vào production)

---

## ✅ Quality Standards

All examples PHẢI:
- ✅ **Working** - Tested trong Illustrator
- ✅ **ES3 compliant** - No ES6+ syntax
- ✅ **Self-contained** - Minimal dependencies
- ✅ **Commented** - Explain WHY not WHAT
- ✅ **Realistic** - Real use cases từ project
- ✅ **<100 lines** - Concise và focused

---

## 🔄 Maintenance

**Khi nào update:**
- Code pattern changes trong project
- New common pattern discovered
- Example outdated hoặc wrong

**How to update:**
1. Edit example file
2. Test lại
3. Update this index if needed
4. Commit với clear message

---

## 🆕 Adding New Examples

**Checklist:**

1. [ ] Identify common pattern cần document
2. [ ] Extract từ working code trong project
3. [ ] Simplify và generalize
4. [ ] Add JSDoc header
5. [ ] Add usage example
6. [ ] Test trong Illustrator
7. [ ] Save vào correct category folder
8. [ ] Update catalog table trong SKILL.md này
9. [ ] Cross-reference trong Skills_Index nếu cần

---

## 🔗 Related Skills

- **Coding_Principles** - Principles đằng sau patterns
- **Code_Style_Standard** - Style guide
- **Hexagonal_Rules** - Where to put code
- **ES3_ES6_Boundary** - ES3 constraints

---

**Last Updated:** 2026-01-19  
**Total Examples:** 15 (planned)  
**Status:** In Development (Phase 2)
