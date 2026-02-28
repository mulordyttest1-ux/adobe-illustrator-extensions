---
name: Feature Development
description: Load khi build feature mới. Bao gồm MoSCoW, ROI scoring, và context validation.
version: 1.0
---

# Skill: Feature Development

> Extends Core Protocol. Bổ sung planning & validation cho feature mới.

## §F1 — REQUIREMENTS (Yêu cầu)
- User Story: **As a** [user], **I want** [feature], **so that** [benefit]
- MoSCoW: **MUST** / **SHOULD** / **COULD** / **WON'T**
- Edge cases: No doc? Empty selection? Corrupted data? Schema mismatch?

## §F2 — RESEARCH & SCORING
- Search web: `"[feature] UX best practices"`, `"[tech] implementation patterns"`
- Scoring table:

| Feature | Dev Time | Usage % | ROI | Decision |
|:--------|:---------|:--------|:----|:---------|
| Core | ? | ? | ? | ✅/❌ |

- Context Validation: Frequency match? Complexity match? Worth ROI?

## §F3 — USER VALIDATION (CRITICAL)
- ⛔ KHÔNG implement mà chưa hỏi User xác nhận context
- Trình bày plan → Nhận feedback → Điều chỉnh → Mới code

## §F4 — IMPLEMENTATION PHASES
- Phase-by-phase, mỗi phase TEST riêng
- ❌ KHÔNG làm tất cả phases cùng lúc
- Follow §C4 (incremental execution)
- After EACH phase: `npm run build:wedding` → `npm run lint:wedding`

## §F5 — DOCUMENTATION
- [ ] Update `GOVERNANCE.md` (add feature to completed list)
- [ ] Create Walkthrough (What / How / Test Results / Known Issues)
- [ ] Retrospective (What went well? What to improve?)
