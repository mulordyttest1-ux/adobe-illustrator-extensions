# .agent Configuration Directory

**Version:** 3.0 (Nx Monorepo Era)  
**Last Updated:** 2026-02-23  
**Purpose:** Instructions, skills, và workflows cho AI Agent làm việc với Hexagonal Adobe CEP Monorepo  

---

## 📁 Cấu trúc Thư mục

```
.agent/
├── GOVERNANCE.md ⭐ (NORTH STAR - Luật bất biến)
├── README.md (file này)
├── hooks.json (Git hooks config)
│
├── memory/ (Brain / Knowledge base)
│   ├── skills/ (Các kỹ năng cốt lõi)
│   │   ├── Skills_Index/ ⭐ (Directory của tất cả skills)
│   │   ├── Hexagonal_Rules/
│   │   ├── CEP_Standards/
│   │   └── ... 
│   ├── planning/ (Master plans & implementation plans)
│   ├── reports/ (Các bản báo cáo Audit)
│   ├── templates/ (Biểu mẫu Markdown)
│   └── API_SURFACE.md / DEPENDENCY_MAP.md
│
├── workflows/ (Pipeline v4.0 — Plan → Act → Reflect)
│   ├── core_protocol.md ⭐ (ALWAYS loaded)
│   └── skills/ (Progressive Loading)
│       ├── ideation/ feature_dev/ refactoring/
│       ├── testing/ lint/ model_selection/
│       └── handoff/
│
└── scripts/ (PowerShell Utilities)
    ├── create_symlink.ps1
    └── diagnose_debug.ps1
```

---

## 🎯 Reading Protocol (MANDATORY)

### P0 - CRITICAL (PHẢI đọc MỌI session)

**Time: 5-7 phút**  
**Before ANY work:**

1. **`GOVERNANCE.md`** (5 phút) - ĐỌC TOÀN BỘ
   - Note core principles (Hexagonal, Max 200 LOC, Domain purity)

2. **`memory/skills/Skills_Index/SKILL.md`** (2 phút)
   - Identify task type
   - Lookup relevant skills cho task

3. **Relevant skills** (5-10 phút - dynamic)
   - Đọc 1-2 skills relevant to current task
   - Trực tiếp chạy `@[/pre-flight]` để khởi tạo code context

---

## 📋 Task-Triggered Reading (P1 - HIGH Priority)

**Auto-load based on task type:**

| Task Type | Must Read / Execute (P1) |
|:----------|:---------------|
| **Write new code** | Workflow `feature_development` + `Hexagonal_Rules` |
| **Modify existing code** | Workflow `feature_development` + Domain skill |
| **Refactor code** | Workflow `safe_refactor` + `Hexagonal_Rules` |
| **Lint / Verify** | Workflow `lint` |
| **Fix bug** | `Troubleshooting` + `ES3_ES6_Boundary` |
| **CEP/UI work** | `CEP_Standards` + `Hexagonal_Rules` |

---

## 📖 Contextual Reading (P2 - MEDIUM)

**Nên đọc khi:**

- 🆕 First session với project → `Project_Context`
- 🔄 Sau 1 tuần không work → Latest `Session_Handoff.md`
- 🏗️ Big task (>1 ngày) → `MASTER_PLAN.md`
- 🤔 Cần hiểu "TẠI SAO" → `Decision_Log.md`
- 🎓 Learn principles → `Coding_Principles`

---

## 🔍 Reference Only (P3 - LOW)

**Lookup khi cần:**

- Specific error → `Troubleshooting`
- Template cần → `templates/`
- Historical reference → `docs/audits/`

---

## 🚀 Quick Start cho Session Mới

### Checklist (Copy-paste và check off):

```markdown
## Session Start - MANDATORY Checklist

**Thời gian:** 5-7 phút  
**Date:** YYYY-MM-DD

### P0 - CRITICAL
- [ ] `AGENT_PREFERENCES.md` → Language: Tiếng Việt ✅
- [ ] `PROJECT_STATUS.md` → ĐỌC TOÀN BỘ
  - Current phase: _______
  - Next steps: _______
  - Blockers: _______
- [ ] `Skills_Index` → Task type: _______

### Verification (MANDATORY)
- [ ] Q1: Phase hiện tại? A: _______
- [ ] Q2: Next task? A: _______
- [ ] Q3: Blockers? A: _______

### P1 - Task-Triggered
**My task type:** _______ (coding/refactor/debug/etc)

Required skills:
- [ ] Skill 1: _______
- [ ] Skill 2: _______

### ✅ Ready to Work
- [ ] All P0 đã đọc
- [ ] Verification questions answered correctly
- [ ] Relevant P1 skills đã đọc
- [ ] 🚀 START WORK
```

---

## 📝 Session End - Handoff Checklist

**Trước khi kết thúc session:**

1. [ ] **Càn quét Rác & Rối (Dead Code & Messy Wiring Sweep):**
   - Đảm bảo đã xóa sạch code thừa bằng Radar tĩnh (công cụ như `knip` hoặc bằng mắt qua IDE).
   - Đảm bảo các mô-đun tuân thủ đường điện Linear Boot và Hexagonal Boundary.

2. [ ] Update `PROJECT_STATUS.md`:
   - "Last Updated" timestamp
   - "Next Steps" section
   - Add blockers nếu có

2. [ ] Create Session Handoff (nếu big changes):
   - Copy `templates/Session_Handoff.md`
   - Save to `docs/sessions/Session_YYYY-MM-DD_[topic].md`
   - Fill in all sections

3. [ ] Verify Google Drive sync:
   - All new files trong `.agent/`
   - No local-only files

---

## 🔗 Quick Links

### Most Important
- [Governance / Rules](GOVERNANCE.md) ⭐
- [Skills Index](memory/skills/Skills_Index/SKILL.md) 📚

### Implementation
- [API Surface](memory/API_SURFACE.md)
- [Dependency Map](memory/DEPENDENCY_MAP.md)

---

## 🎓 For Human Developers

**Nếu bạn là developer mới:**

1. Đọc `GOVERNANCE.md` để hiểu current state.
2. Explore `memory/skills/Skills_Index/` để xem available skills dặn AI.

**Nếu bạn muốn cập nhật .agent config:**

1. Backup trước: `xcopy .agent .agent_backup /E /I`
2. Make changes
3. Update README.md version number nếu cần

---

## 📊 Quality Score

**Last audit:** 2026-02-23  
**Score:** 10/10 ⭐⭐⭐⭐⭐  
**Status:** v3.0 Production Ready (Nx Monorepo, 0 Cyclomatic Complexity Violations)

**Previous scores:**
- v2.0 (2026-01-19): 9.2/10
- v1.0 (2026-01-15): 8.76/10

---

## 🔄 Version History

| Version | Date | Changes |
|:--------|:-----|:--------|
| 3.0 | 2026-02-23 | Trở lại môi trường Zero God Classes. Áp dụng Nx Hexagonal Boundary Enforcement. |
| 2.1 | 2026-01-21 | Extraction Strategy: Added hooks.json, check-es3/deploy-cep commands, upgraded Hexagonal Skill |
| 2.0 | 2026-01-19 | Priority framework, Vietnamese config, error learning system |
| 1.0 | 2026-01-15 | Initial .agent setup với 9 skills |

---

## ⚠️ CRITICAL RULES

### Rules KHÔNG được vi phạm:

1. ❌ **KHÔNG bao giờ** lưu artifacts trong local machine paths
   - ✅ PHẢI lưu trong `.agent/` directory
   - Lý do: Multi-machine work, Google Drive sync

2. ❌ **KHÔNG bao giờ** skip đọc `PROJECT_STATUS.md`
   - ✅ PHẢI đọc mỗi session
   - Lý do: Single source of truth cho current state

3. ❌ **KHÔNG bao giờ** dùng ES6+ trong `.jsx` files
   - ✅ PHẢI follow `ES3_ES6_Boundary` skill
   - Lý do: ExtendScript chỉ support ES3

4. ❌ **KHÔNG bao giờ** make architectural changes mà không document
   - ✅ PHẢI update `Decision_Log.md`
   - Lý do: Context preservation

---

**Ghi chú:** File này là entry point cho tất cả agents và developers. Giữ cập nhật và concise.
