---
name: Skills_Index
description: Danh mục tổng hợp tất cả Agent Skills - Khi nào dùng skill nào
---

# Skill: Danh mục Skills (The Librarian)

> **MỤC ĐÍCH:** Giúp Agent nhanh chóng xác định cần đọc skill nào cho từng loại task.

---

## 📚 Danh sách Skills

<!-- AUTO-GENERATED-SKILLS-START -->
| # | Skill | Mô tả | Đường dẫn |
|---|-------|-------|-------------|
| 1 | **Agent_Governance** | Quy chuẩn và hướng dẫn modify .agent config để scale trong tương lai | [Link](../Agent_Governance/SKILL.md) |
| 2 | **CEP_Standards** | Bộ quy chuẩn CEP Migration cho dự án Wedding Scripter - UI Guidelines, Code Standards, và Architecture Rules | [Link](../CEP_Standards/SKILL.md) |
| 3 | **Code_Examples** | Thư viện code examples thực tế từ Wedding Scripter project - Domain, Adapters, UI, Utilities | [Link](../Code_Examples/SKILL.md) |
| 4 | **Code_Style_Standard** | Quy chuẩn viết code cho môi trường ExtendScript ES3/Adobe Illustrator - Đặt tên, Comment, Quirks | [Link](../Code_Style_Standard/SKILL.md) |
| 5 | **Coding_Principles** | Bộ nguyên lý lập trình vàng giúp mã nguồn dễ bảo trì, mở rộng và ít lỗi (KISS, DRY, SOLID, YAGNI, POLA, LoD, CQS) | [Link](../Coding_Principles/SKILL.md) |
| 6 | **Deployment_Architecture** | Monorepo deployment - Symlink setup cho Wedding CEP và Symbol CEP trong Adobe Illustrator | [Link](../Deployment_Architecture/SKILL.md) |
| 7 | **ES3_ES6_Boundary** | Quy tắc phân biệt rõ ràng khi nào dùng ES3 (ExtendScript) và khi nào dùng ES6+ (CEP Panel) - Tránh lỗi lặp | [Link](../ES3_ES6_Boundary/SKILL.md) |
| 8 | **Hexagonal_Architecture_Rules** | Quy tắc bắt buộc về Kiến trúc Hexagonal (Ports & Adapters) cho dự án Wedding Scripter. Bao gồm Design Principles, Trade-offs và Red Flags. | [Link](../Hexagonal_Rules/SKILL.md) |
| 9 | **Project_Context** | Tổng quan dự án Wedding Scripter - Bản đồ module, key files, và trạng thái hiện tại để Agent nắm bắt context nhanh chóng | [Link](../Project_Context/SKILL.md) |
| 10 | **Troubleshooting** | FAQ và Common Issues khi làm việc với dự án Wedding Scripter trong môi trường ExtendScript/Illustrator | [Link](../Troubleshooting/SKILL.md) |
| 11 | **Wedding_Domain_Knowledge** | Domain knowledge cho Wedding Card system - Entities, Business Rules, Data Flow | [Link](../Wedding_Domain_Knowledge/SKILL.md) |
<!-- AUTO-GENERATED-SKILLS-END -->

---

## 📄 Templates & Docs

| # | Document | Mô tả | Khi nào dùng |
|---|----------|-------|--------------|
| 1 | **Session_Handoff** | Bàn giao trạng thái session | Cuối session, để session sau tiếp tục |
| 2 | **Decision_Log** | Lịch sử quyết định kiến trúc | Khi cần hiểu TẠI SAO code như vậy |

---

## 🔄 Workflow Architecture v4.0

> **Pipeline:** PLAN → ACT → REFLECT (3 phases)
> **Gọi workflow:** `@[.agent/workflows/core_protocol.md]` + yêu cầu

### Core Protocol (LUÔN load)
| File | Mô tả |
|------|-------|
| [core_protocol.md](../../../workflows/core_protocol.md) | Pipeline 3 pha, Auto-Route, Error Recovery, Guardrails, Reflect |

### Skills (Progressive Loading — chỉ load khi cần)
| # | Skill | Mô tả | Đường dẫn |
|---|-------|-------|-------------|
| 1 | **ideation** | Phân tích ý tưởng (§I1–§I4). Load khi D1≥3 | [Link](../../../workflows/skills/ideation/SKILL.md) |
| 2 | **refactoring** | Alias-first, rollback, ES3 pitfalls | [Link](../../../workflows/skills/refactoring/SKILL.md) |
| 3 | **feature_dev** | MoSCoW, ROI scoring, user validation | [Link](../../../workflows/skills/feature_dev/SKILL.md) |
| 4 | **testing** | CDP, Hybrid Agentic Testing, troubleshooting | [Link](../../../workflows/skills/testing/SKILL.md) |
| 5 | **lint** | Nx boundary rules, ESLint commands | [Link](../../../workflows/skills/lint/SKILL.md) |
| 6 | **model_selection** | Deterministic model selection matrix | [Link](../../../workflows/skills/model_selection/SKILL.md) |
| 7 | **handoff** | Context switch, session checkpoint, resume | [Link](../../../workflows/skills/handoff/SKILL.md) |

---

## 🎯 Task Type Classification (Auto-Route §C0)

**Purpose:** Agent tự match task type → load đúng skills. Xem §C0 trong `core_protocol.md`.

| User Request Patterns | Task Type | Workflow Skills | Memory Skills |
|:----------------------|:----------|:----------------|:--------------|
| "feature mới", "build", "thêm chức năng" | NEW_FEATURE | ideation + feature_dev + testing | Code_Style_Standard |
| "refactor", "đổi tên", "tách", "gộp" | REFACTOR | refactoring + testing | Hexagonal_Rules |
| "bug", "lỗi", "fix", "test" | DEBUG | testing | Troubleshooting |
| "lint", "architecture", "Nx" | LINT | lint | ES3_ES6_Boundary |
| Task phức tạp (D1≥3) | COMPLEX | + ideation + model_selection | Project_Context |
| Task đơn giản (typo, 1-2 dòng) | SIMPLE | Core only | None |

---

## 📚 Ma trận Task → Skills

| Task | Memory Skills | Workflow Skills |
|------|---------------|------------------|
| **Viết tính năng mới** | Project_Context → Hexagonal_Rules | `ideation` → `feature_dev` → `testing` |
| **Sửa giao diện** | CEP_Standards → Code_Style_Standard | `feature_dev` → `testing` |
| **Refactor module** | Hexagonal_Rules → Coding_Principles | `refactoring` → `testing` |
| **Fix bug** | Troubleshooting → ES3_ES6_Boundary | `testing` |
| **Lint / Kiến trúc** | ES3_ES6_Boundary → CEP_Standards | `lint` |

---

## 🚀 Quick Start cho Session Mới

```
1. User gõ @[.agent/workflows/core_protocol.md] + yêu cầu
   ↓
2. Agent đọc core_protocol → chạy §C0 Auto-Route
   ↓
3. Agent load workflow skills phù hợp (0-3 skills)
   ↓
4. Agent load memory skills phù hợp (tra bảng trên)
   ↓
5. Follow pipeline: PLAN → ACT → REFLECT
```

---

## 📁 Đường dẫn Files

### Memory Skills (Domain Knowledge)
- [Project_Context](../Project_Context/SKILL.md)
- [Hexagonal_Rules](../Hexagonal_Rules/SKILL.md)
- [Coding_Principles](../Coding_Principles/SKILL.md)
- [Code_Style_Standard](../Code_Style_Standard/SKILL.md)
- [CEP_Standards](../CEP_Standards/SKILL.md)
- [ES3_ES6_Boundary](../ES3_ES6_Boundary/SKILL.md)
- [Troubleshooting](../Troubleshooting/SKILL.md)
- [Agent_Governance](../Agent_Governance/SKILL.md)
- [Wedding_Domain_Knowledge](../Wedding_Domain_Knowledge/SKILL.md)
- [Deployment_Architecture](../Deployment_Architecture/SKILL.md)
- [Code_Examples](../Code_Examples/SKILL.md)

### Workflow Skills (Process)
- [core_protocol.md](../../../workflows/core_protocol.md) — ALWAYS
- [ideation](../../../workflows/skills/ideation/SKILL.md)
- [refactoring](../../../workflows/skills/refactoring/SKILL.md)
- [feature_dev](../../../workflows/skills/feature_dev/SKILL.md)
- [testing](../../../workflows/skills/testing/SKILL.md)
- [lint](../../../workflows/skills/lint/SKILL.md)
- [model_selection](../../../workflows/skills/model_selection/SKILL.md)
- [handoff](../../../workflows/skills/handoff/SKILL.md)

### Persistent State
- [lessons_learned.md](../../../lessons_learned.md)

---

## 📝 Ghi chú cập nhật

| Ngày | Thay đổi |
|------|----------|
| 2026-01-15 | Khởi tạo danh mục với 4 skills, 1 workflow |
| 2026-01-15 | Cập nhật: 5 skills, 2 workflows hoàn chỉnh |
| 2026-01-17 | Thêm CEP_Standards skill cho CEP Migration (DinhSon) |
| 2026-02-25 | **v4.0** — Cập nhật toàn bộ: 7 workflow skills thay thế 6 legacy workflows |
