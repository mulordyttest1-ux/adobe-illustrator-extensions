# .agent Configuration Directory

**Version:** 2.1  
**Last Updated:** 2026-01-21  
**Purpose:** Instructions, skills, và workflows cho AI Agent làm việc với Wedding Scripter project

**📍 Đọc ngay:** [NAVIGATION_MAP.md](docs/NAVIGATION_MAP.md) - Bản đồ duyệt đầy đủ

---

## 📁 Cấu trúc Thư mục

```
.agent/
├── AGENT_PREFERENCES.md ⚙️ (Language, style preferences)
├── PROJECT_STATUS.md ⭐ (NORTH STAR - đọc ĐẦU TIÊN)
├── README.md (file này)
├── task.md (Current task tracking)
│
├── skills/ (9 skills - Knowledge base)
│   ├── CEP_Standards/
│   ├── Code_Style_Standard/
│   ├── Coding_Principles/
│   ├── Deployment_Architecture/
│   ├── ES3_ES6_Boundary/
│   ├── Hexagonal_Rules/
│   ├── Project_Context/
│   ├── Skills_Index/ ⭐ (Directory của tất cả skills)
│   └── Troubleshooting/
│
├── workflows/ (Quy trình chuẩn)
│   ├── add_new_field.md
│   └── safe_refactor.md
│
├── docs/ (Documentation, decisions)
│   ├── CEP_PROGRESS.md
│   ├── Decision_Log.md
│   ├── Structure_Compliance.md
│   ├── agent_weakness_analysis.md
│   ├── agent_priority_framework.md
│   └── sessions/ (Session handoffs)
│
├── planning/ (Roadmaps, plans)
│   ├── MASTER_PLAN.md
│   ├── agent_v2_implementation_plan.md
│   ├── Imposition_Module_Plan.md
│   └── Imposition_Walkthrough.md
│
└── templates/
    └── Session_Handoff.md
```

---

## 🎯 Reading Protocol (MANDATORY)

### P0 - CRITICAL (PHẢI đọc MỌI session)

**Time: 5-7 phút**  
**Before ANY work:**

1. **`AGENT_PREFERENCES.md`** (30 giây)
   - Confirm language (Tiếng Việt)
   - File location rules (trong `.agent/` only)

2. **`PROJECT_STATUS.md`** (5 phút) - ĐỌC TOÀN BỘ
   - Note current phase
   - Note next steps
   - Note known blockers/issues

3. **`docs/CLI_TOM_TAT.md`** (2 phút) - MỚI ⭐
   - Biết 18 lệnh có sẵn
   - Tự động chọn lệnh phù hợp (xem CLI_AUTO_SELECTION.md)
   - Không cần user chỉ rõ lệnh

4. **`skills/Skills_Index/SKILL.md`** (2 phút)
   - Identify task type
   - Lookup relevant skills cho task

5. **Relevant skills** (5-10 phút - dynamic)
   - Đọc 1-2 skills relevant to current task
   - See "Task-Triggered Reading" table below

### ✅ Verification Questions (MANDATORY)

Agent PHẢI trả lời ĐÚNG trước khi start work:

1. **"Dự án hiện tại đang ở phase nào?"**
   - Answer from PROJECT_STATUS.md

2. **"Next immediate task là gì?"**
   - Answer from PROJECT_STATUS.md

3. **"Có blockers/issues nào không?"**
   - Answer from PROJECT_STATUS.md

**Nếu không trả lời được** → RE-READ PROJECT_STATUS.md

---

## 📋 Task-Triggered Reading (P1 - HIGH Priority)

**Auto-load based on task type:**

| Task Type | Must Read (P1) |
|:----------|:---------------|
| **Write new code** | `ES3_ES6_Boundary` + `Hexagonal_Rules` + `Code_Style_Standard` |
| **Modify existing code** | `ES3_ES6_Boundary` + relevant domain skill |
| **Refactor code** | `Hexagonal_Rules` + `workflows/safe_refactor.md` |
| **Add field to form** | `workflows/add_new_field.md` + `Code_Style_Standard` |
| **Fix bug** | `Troubleshooting` + `ES3_ES6_Boundary` |
| **Make architecture decision** | `Hexagonal_Rules` + `docs/Decision_Log.md` |
| **CEP/UI work** | `CEP_Standards` + `Hexagonal_Rules` |
| **Setup/deployment** | `Deployment_Architecture` |

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

1. [ ] Update `PROJECT_STATUS.md`:
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
- [Agent Preferences](AGENT_PREFERENCES.md) ⚙️
- [Project Status](PROJECT_STATUS.md) ⭐
- [Skills Index](skills/Skills_Index/SKILL.md) 📚

### Documentation
- [Decision Log](docs/Decision_Log.md)
- [Master Plan](planning/MASTER_PLAN.md)
- [Weakness Analysis](docs/agent_weakness_analysis.md)
- [Priority Framework](docs/agent_priority_framework.md)

### Implementation
- [v2.0 Implementation Plan](planning/agent_v2_implementation_plan.md)
- [Task Tracking](task.md)

---

## 🎓 For Human Developers

**Nếu bạn là developer mới:**

1. Đọc `AGENT_PREFERENCES.md` để hiểu preferences
2. Đọc `PROJECT_STATUS.md` để hiểu current state
3. Đọc `skills/Project_Context/` để overview project
4. Explore `skills/Skills_Index/` để xem available skills

**Nếu bạn muốn cập nhật .agent config:**

1. Backup trước: `xcopy .agent .agent_backup /E /I`
2. Make changes
3. Update README.md version number nếu cần
4. Document trong changelog

---

## 📊 Quality Score

**Last audit:** 2026-01-19  
**Score:** 9.2/10 ⭐⭐⭐⭐  
**Status:** v2.0 Production Ready

**Previous scores:**
- v1.0 (2026-01-15): 8.76/10
- v1.5 (Planning): 9.0/10

---

## 🔄 Version History

| Version | Date | Changes |
|:--------|:-----|:--------|
| 2.1 | 2026-01-21 | Extraction Strategy: Added hooks.json, check-es3/deploy-cep commands, upgraded Hexagonal Skill |
| 2.0 | 2026-01-19 | Priority framework, Vietnamese config, error learning system |
| 1.5 | 2026-01-19 | Consolidation, README created |
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
