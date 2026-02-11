---
description: Quy trình chuẩn để build một feature mới - từ planning đến production
---

# Workflow: Professional Feature Development

**Mục đích:** Quy trình build feature chuyên nghiệp, tránh làm đi làm lại, đảm bảo quality và phù hợp context thực tế.

**Case Study:** SCAN Button với Conflict Resolution

---

## 📋 Phase 0: Context Gathering (MUST DO FIRST)

**Mục tiêu:** Hiểu rõ context trước khi code bất cứ thứ gì.

### Step 0.1: Đọc Current State
- [ ] Đọc `PROJECT_STATUS.md` để hiểu architecture hiện tại
- [ ] Đọc `.agent/README.md` để biết conventions
- [ ] Đọc related skills (nếu có) để học best practices
- [ ] Review existing code liên quan

### Step 0.2: Understand Domain Context
- [ ] Feature này giải quyết pain point nào?
- [ ] Ai là user? (Designer, in ấn, admin?)
- [ ] Workflow thực tế như thế nào?
- [ ] Frequency of use? (Dùng nhiều → optimize speed, ít dùng → simple is better)

**Example (SCAN Button):**
```
Pain point: Nhập tay data chậm, dễ lỗi
User: Nhân viên tạo thiệp, làm 50-200 thiệp/ngày
Workflow: Mở template → Scan → Fill → Export
Frequency: Very high (mỗi thiệp 1 lần)
→ Conclusion: Cần NHANH, ít friction, reliable
```

### Step 0.3: Check Existing Code
- [ ] Feature tương tự đã có chưa?
- [ ] Có backup/history của code cũ không?
- [ ] Dependencies nào cần thiết?

**Output:** Document findings vào `planning/` folder

---

## ⚖️ Phase 1: Requirements Analysis

**Mục tiêu:** Define rõ ràng WHAT to build (chưa nghĩ HOW).

### Step 1.1: List Feature Requirements
Format: User story + acceptance criteria

```markdown
**As a** [user type]
**I want** [feature]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
```

### Step 1.2: Prioritize (MoSCoW Method)
- **MUST have:** Core functionality
- **SHOULD have:** Important but not blocking
- **COULD have:** Nice to have
- **WON'T have:** Out of scope

**Example (SCAN):**
```
MUST:
- Scan document TextFrames
- Fill form with scanned data

SHOULD:
- Handle conflicts (duplicate keys)
- Selection mode support

COULD:
- Batch actions
- Confidence scoring

WON'T (initially):
- Auto-save after scan
- History/undo feature
```

### Step 1.3: Identify Edge Cases
- [ ] What if no document open?
- [ ] What if empty selection?
- [ ] What if corrupted data?
- [ ] What if schema mismatch?

**Output:** `planning/[feature]_requirements.md`

---

## 🔍 Phase 2: Research Best Practices

**Mục tiêu:** Học từ experts, KHÔNG tự nghĩ từ đầu.

### Step 2.1: Web Research
Search cho:
- "[feature type] UX best practices"
- "[similar tools] implementation patterns"
- "[technology] conflict resolution design"

**Tools:** `search_web` tool

### Step 2.2: Analyze Findings
Tạo bảng so sánh:

| Pattern | Pros | Cons | Fit Score | Decision |
|---------|------|------|-----------|----------|
| Three-pane view | Clear comparison | Complex UI | 7/10 | Adapt |
| Inline markers | Simple | Confusing | 4/10 | Skip |

### Step 2.3: Document Key Insights
```markdown
## Research Findings

**Pattern 1: [Name]**
- Used by: [Tools]
- Key benefit: [...]
- Our adaptation: [...]

**Pattern 2: [Name]**
...
```

**Output:** `planning/[feature]_research.md`

---

## 🎯 Phase 3: Context Validation

**Mục tiêu:** Đối chiếu research findings với CONTEXT THỰC TẾ của project.

### Step 3.1: Reality Check Questions
For each researched pattern, ask:

1. **Frequency match?**
   - Pattern designed for: [frequency]
   - Our use case: [frequency]
   - Match? YES/NO

2. **Complexity match?**
   - Pattern complexity: HIGH/MEDIUM/LOW
   - User technical level: [...]
   - Match? YES/NO

3. **ROI Analysis**
   - Implementation time: [X hours]
   - Usage frequency: [Y times/day]
   - Value delivered: [Z]
   - ROI = Z / X
   - Worth it? YES/NO

### Step 3.2: Scoring Features
Dùng bảng scoring (như đã làm với SCAN):

| Feature | Dev Time | Usage % | ROI | Decision |
|---------|----------|---------|-----|----------|
| Core scan | 2h | 100% | HIGH | ✅ DO |
| Conflict UI | 4h | 5% | LOW | ❌ SKIP |

**Adjust based on USER feedback!**

### Step 3.3: Get User Validation
**CRITICAL:** ASK user about context before implementing!

```markdown
## Context Questions for User

1. Thiệp cưới workflow thực tế:
   - Có bao giờ quét 1 phần document không?
   - Có bao giờ có duplicate data không?
   
2. Priorities:
   - Speed > Features?
   - Simple > Powerful?
```

**Output:** Updated requirements based on context

---

## 📐 Phase 4: Implementation Planning

**Mục tiêu:** HOW to build với architecture rõ ràng.

### Step 4.1: Architecture Design
```markdown
## Architecture

**Data Flow:**
User → UI → Controller → Bridge → ExtendScript → Illustrator

**Components:**
1. ExtendScript: [Responsibility]
2. Bridge: [Responsibility]
3. UI: [Responsibility]
```

### Step 4.2: Break Down Tasks
Chia thành phases nhỏ, testable:

```markdown
## Implementation Phases

### Phase 1: Core Logic (Backend)
- [ ] Task 1.1
- [ ] Task 1.2

### Phase 2: UI Components
- [ ] Task 2.1

### Phase 3: Integration
- [ ] Task 3.1

### Phase 4: Testing
- [ ] Test scenario 1
```

### Step 4.3: Identify Dependencies
- Files to modify: [list]
- New files to create: [list]
- Breaking changes: [list]
- Risks: [list]

**Output:** `planning/[feature]_implementation_plan.md`

---

## 💻 Phase 5: Implementation

**Mục tiêu:** Code theo plan, incremental, testable.

### Step 5.1: Follow Phases Strictly
- ✅ Complete Phase 1 → Test → Move to Phase 2
- ❌ KHÔNG làm tất cả phases cùng lúc

### Step 5.2: Code Standards
- Follow `Code_Style_Standard` skill
- Follow `ES3_ES6_Boundary` rules
- Follow `Hexagonal_Architecture_Rules`

### Step 5.3: Continuous Testing
After EACH phase:
```bash
# Reload panel
# Test the specific phase
# Fix issues before moving on
```

### Step 5.4: Update Task.md
Mark progress in real-time:
- [/] In progress
- [x] Done

**Output:** Working code, phase by phase

---

## 🧪 Phase 6: Testing & Validation

**Mục tiêu:** Verify feature works in REAL scenarios.

### Step 6.1: Create Test Plan
```markdown
## Test Scenarios

**Scenario 1: Happy Path**
- Steps: [...]
- Expected: [...]
- Actual: [...]
- Status: PASS/FAIL

**Scenario 2: Edge Case**
...
```

### Step 6.2: User Testing
**CRITICAL:** User must test with REAL data!

- [ ] User tests với file production
- [ ] User tests các edge cases thực tế
- [ ] Collect feedback

### Step 6.3: Fix Issues
Priority order:
1. Blockers (prevents core function)
2. Critical bugs (data loss, crashes)
3. UX issues (confusing, slow)
4. Nice-to-haves

**Output:** `planning/[feature]_test_results.md`

---

## 📝 Phase 7: Documentation

**Mục tiêu:** Document cho future maintenance.

### Step 7.1: Update PROJECT_STATUS.md
- Add feature to completed list
- Update architecture if changed
- Note any breaking changes

### Step 7.2: Create Walkthrough
```markdown
# [Feature] Walkthrough

## What Was Built
- [...]

## How It Works
- [flow diagram]

## Testing Results
- [summary]

## Known Issues
- [if any]
```

### Step 7.3: Update Skills (if needed)
If feature introduces new patterns:
- Create new skill OR
- Update existing skill

**Output:** Documented feature

---

## 🎓 Phase 8: Retrospective

**Mục tiêu:** Learn for next time.

### Step 8.1: What Went Well?
- [...]

### Step 8.2: What Could Improve?
- [...]

### Step 8.3: Update This Workflow
If discovered better practices → update this file!

---

## ✅ Checklist Summary

Cho mỗi feature mới:

**Planning:**
- [ ] Gather context (Phase 0)
- [ ] Analyze requirements (Phase 1)
- [ ] Research best practices (Phase 2)
- [ ] Validate with context (Phase 3)
- [ ] Create implementation plan (Phase 4)
- [ ] Get user approval on plan

**Execution:**
- [ ] Implement phase by phase (Phase 5)
- [ ] Test after each phase
- [ ] User validation (Phase 6)
- [ ] Fix critical issues

**Wrap-up:**
- [ ] Documentation (Phase 7)
- [ ] Retrospective (Phase 8)

---

## 🚫 Common Pitfalls to Avoid

1. **Over-engineering:**
   - ❌ Add features "just in case"
   - ✅ Build only what's needed NOW

2. **Research without context:**
   - ❌ Copy patterns blindly
   - ✅ Adapt to YOUR use case

3. **Skip user validation:**
   - ❌ Assume what user needs
   - ✅ ASK and VERIFY

4. **Big bang implementation:**
   - ❌ Code everything then test
   - ✅ Incremental phases

5. **No documentation:**
   - ❌ "Code is self-documenting"
   - ✅ Document WHY and HOW

---

## 📚 Related Skills

- `Code_Style_Standard` - Coding conventions
- `ES3_ES6_Boundary` - Tech stack rules
- `Hexagonal_Architecture_Rules` - Architecture patterns
- `Project_Context` - Understanding the codebase

---

**Version:** 1.0  
**Last Updated:** 2026-01-19  
**Based on:** SCAN Button implementation experience
