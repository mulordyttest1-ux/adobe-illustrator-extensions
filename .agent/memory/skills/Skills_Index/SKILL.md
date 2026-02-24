---
name: Skills_Index
description: Danh mục tổng hợp tất cả Agent Skills - Khi nào dùng skill nào
---

# Skill: Danh mục Skills (The Librarian)

> **MỤC ĐÍCH:** Giúp Agent nhanh chóng xác định cần đọc skill nào cho từng loại task.

---

## 📚 Danh sách Skills

| # | Skill | Mô tả | Khi nào đọc |
|---|-------|-------|-------------|
| 1 | **Project_Context** | Bản đồ dự án, key files, data flow | 🚀 **ĐẦU TIÊN** khi bắt đầu session mới |
| 2 | **Agent_Governance** | Quy chuẩn modify .agent, quality gates, scaling framework | 📋 **KHI MUỐN THAY ĐỔI** .agent config |
| 3 | **Wedding_Domain_Knowledge** | Domain glossary, business rules, entities | Khi cần hiểu nghiệp vụ Wedding, add fields |
| 4 | **Hexagonal_Rules** | Quy tắc kiến trúc Hexagonal | Khi thêm file mới, refactor, hoặc review |
| 5 | **Coding_Principles** | KISS, DRY, SOLID, YAGNI, POLA, LoD, CQS | Khi viết code mới hoặc refactor |
| 6 | **Code_Style_Standard** | Naming, comments, ES3 quirks | Khi viết code mới |
| 7 | **ES3_ES6_Boundary** | Ranh giới ES3/ES6+, tránh lỗi lặp | ⚠️ **BẮT BUỘC** khi viết code mới |
| 8 | **Code_Examples** | Working code examples từ project | Khi cần template/pattern để copy |
| 9 | **Troubleshooting** | FAQ, common issues, debug techniques | Khi gặp lỗi cần fix nhanh |
| 10 | **CEP_Standards** | UI Guidelines, Light Theme, CEP Architecture | 🎨 Khi migrate sang CEP hoặc build HTML panel |
| 11 | **Skills_Index** | Danh mục skills & workflows | Tra cứu nhanh skill/workflow cần dùng |


---

## 📄 Templates & Docs

| # | Document | Mô tả | Khi nào dùng |
|---|----------|-------|--------------|
| 1 | **Session_Handoff** | Bàn giao trạng thái session | Cuối session, để session sau tiếp tục |
| 2 | **Decision_Log** | Lịch sử quyết định kiến trúc | Khi cần hiểu TẠI SAO code như vậy |

---

## 🔄 Danh sách Workflows (Dùng Slash Command)

| # | Workflow / Command | Mô tả | Khi nào dùng |
|---|----------|-------|--------------|
| 1 | `@[/feature_development]` | Xây dựng tính năng mới | Chuẩn quy trình 6 bước để viết code |
| 2 | `@[/safe_refactor]` | Refactor an toàn | Sửa code lớn, đổi tên, chẻ nhỏ file |
| 3 | `@[/pre-flight]` | Chuẩn bị trước cất cánh | Đọc Context, Rule Architecture trước khi code |
| 4 | `@[/lint]` | Kiểm tra chất lượng | Rà soát lỗi Naming và Module Boundary |

---

## 🎯 Task Type Classification (For Priority Framework)

**Purpose:** Giúp agent xác định task type để load đúng skills (P1 priority)

### Task Classification Guide

| User Request Patterns | Task Type | Auto-Read Skills |
|:----------------------|:----------|:-----------------|
| \"Add field\", \"new module\", \"viết tính năng\" | NEW_FEATURE | feature_development workflow + Code_Style_Standard |
| \"Refactor\", \"restructure\", \"move file\" | REFACTOR | safe_refactor workflow + Hexagonal_Rules |
| \"Fix bug\", \"lỗi\", \"error\", \"không chạy\" | DEBUG | Troubleshooting |
| \"Check code\", \"kiểm tra\" | LINT | lint workflow + ES3_ES6_Boundary |
| \"Clean up\", \"Nx\", \"kiến trúc\" | ARCHITECTURE| Hexagonal_Rules + CEP_Standards |

### Classification Algorithm

```
1. Extract keywords từ user request
2. Match với patterns trong table above
3. If match → Use mapped task type
4. If không match → Default to "GENERAL" (read ES3_ES6_Boundary only)
5. Load skills theo task type mapping
```

---

## 📚 Ma trận Task → Skills (Updated cho Priority Framework)

| Task | Skills cần đọc | Workflow |
|------|----------------|----------|
| **Viết tính năng mới** | Project_Context → Hexagonal_Rules | `@[/feature_development]` |
| **Sửa giao diện** | Project_Context → Code_Style_Standard | `@[/feature_development]` |
| **Refactor module** | Hexagonal_Rules → Coding_Principles | `@[/safe_refactor]` |
| **Kiểm tra tiêu chuẩn** | Khởi tạo qua Pre-flight | `@[/lint]` |
| **Kiến trúc Nx** | Hexagonal_Rules → CEP_Standards | `@[/pre-flight]` |

---

## 🚀 Quick Start cho Session Mới

Khi bắt đầu session mới với dự án này:

```
1. Đọc Project_Context/SKILL.md
   ↓
2. Xác định loại task
   ↓
3. Tra bảng "Ma trận Task → Skills" ở trên
   ↓
4. Đọc skills liên quan
   ↓
5. Nếu có workflow phù hợp → Follow workflow
```

---

## 📁 Đường dẫn Files

### Skills
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

### Workflows
- [feature_development.md](../../../workflows/feature_development.md)
- [feature_development_quick_ref.md](../../../workflows/feature_development_quick_ref.md)
- [safe_refactor.md](../../../workflows/safe_refactor.md)
- [pre-flight.md](../../../workflows/pre-flight.md)
- [lint.md](../../../workflows/lint.md)

---

## 📝 Ghi chú cập nhật

| Ngày | Thay đổi |
|------|----------|
| 2026-01-15 | Khởi tạo danh mục với 4 skills, 1 workflow |
| 2026-01-15 | Cập nhật: 5 skills, 2 workflows hoàn chỉnh |
| 2026-01-17 | Thêm CEP_Standards skill cho CEP Migration (DinhSon) |
