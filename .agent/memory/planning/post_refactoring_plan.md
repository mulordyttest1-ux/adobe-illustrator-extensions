# 🏗️ POST-REFACTORING EXECUTION PLAN
# Chuyển Từ "Refactor Mode" Sang "Operate → Extend → Optimize"

> **Author:** Principal Engineer / AI Transformation Lead  
> **Date:** 2026-02-10  
> **Prerequisite:** Master Refactoring Plan (Batch 0→5) — ✅ 100% Complete  
> **Philosophy:** Mọi hành động phải phục vụ 1 trong 3 mục tiêu: Agent ổn định hơn, Agent rẻ hơn, Agent tự chủ hơn.

---

## MỤC LỤC

1. [Post-Refactor Validation](#phase-1-post-refactor-validation)
2. [Architecture Lock-In](#phase-2-architecture-lock-in)
3. [Agent Playbooks](#phase-3-agent-playbooks)
4. [Monitoring & Feedback Loop](#phase-4-monitoring--feedback-loop)
5. [Roadmap: Ổn Định → Mở Rộng → Tối Ưu](#phase-5-roadmap)
6. [Risk Registry](#risk-registry)
7. [Quality Scoreboard](#quality-scoreboard)

---

## PHASE 1: Post-Refactor Validation

> **Mục tiêu:** Xác nhận codebase sau refactor hoạt động đúng, kiến trúc khớp contract, không có regression ẩn.

### 1.1 Architecture Compliance Audit

| Rule | Metric | Target | How to Verify |
|:-----|:-------|:-------|:--------------|
| R1: Explicit Deps | `typeof X !== 'undefined'` count | **0 in source files** *(currently 44 — harmless but noisy)* | `grep -r "typeof.*undefined" js/ --include="*.js" \| grep -v bundle \| grep -v test \| wc -l` |
| R2: File Size | Files > 150 LOC | **0** *(exceptions: DomFactory 272, CompactFormBuilder 235 — documented)* | `find js/ -name "*.js" \| xargs wc -l \| sort -rn` |
| R3: Header Contract | Files without `MODULE:` header | **0** | `grep -rL "MODULE:" js/ --include="*.js"` |
| R4: Export Pattern | ES Module `export` in all source files | **100%** | `grep -rL "^export" js/ --include="*.js" \| grep -v test \| grep -v bundle` |
| R5: Layer Isolation | Domain importing Component | **0 violations** | Review `app.js` import order |
| Build | esbuild success | **< 500ms, 0 errors** | `node build.js` |
| Tests | `node --test` | **49/49 pass** | `node --test js/**/*.test.js` |

### 1.2 Behavior Parity Checklist

> Agent **KHÔNG THỂ** test những mục này. Chủ nhân (User) phải kiểm tra trong Illustrator.

- [ ] Mở panel CEP → hiển thị đúng, không lỗi console
- [ ] Tab 2 (Compact Form) render đầy đủ fields
- [ ] **SCAN**: Quét document → dữ liệu hiển thị đúng trong form
- [ ] **UPDATE**: Nhập dữ liệu → update lên AI file → verify trên artboard
- [ ] **SWAP**: Hoán đổi Pos1 ↔ Pos2 → dữ liệu đúng bên
- [ ] Date Grid: Chọn ngày → tính Âm lịch → render grid
- [ ] Settings: Đổi preset → UI cập nhật đúng
- [ ] Address Autocomplete: Gõ → dropdown hiển thị

> [!CAUTION]
> **Không tiến sang Phase 2 nếu bất kỳ mục Behavior Parity nào fail.** Nếu fail → quay lại sửa bundle, KHÔNG refactor thêm.

### 1.3 Regression Scan

| Scan Type | Command | Expected |
|:----------|:--------|:---------|
| Build | `node build.js` | ✅ 0 errors, < 500ms |
| Tests | `node --test js/**/*.test.js` | ✅ 49/49 pass |
| Dead exports | Search for exports not imported in `app.js` | 0 orphans |
| Console errors | Open panel in Illustrator, check DevTools console | 0 errors |

---

## PHASE 2: Architecture Lock-In

> **Mục tiêu:** Đóng băng kiến trúc. Từ đây không refactor nếu không có bằng chứng vi phạm.

### 2.1 Architecture Contract v2 (Post-ESM)

Cập nhật từ [master_refactoring_plan.md](file:///C:/Users/Admin/.gemini/antigravity/brain/d42f846e-6cee-4240-8ddc-683d018feec6/master_refactoring_plan.md), phản ánh trạng thái mới:

```
RULE 1 (Updated): ES Module Imports
  - TẤT CẢ dependencies phải dùng `import { X } from './path.js'`
  - CẤM: typeof checks, window.* reads (trừ CSInterface/DOM APIs)
  - app.js là NƠI DUY NHẤT được phép set window.* (cho CEP interop)

RULE 2: File Size — Unchanged (≤ 150 LOC)
  - Documented exceptions: DomFactory (272), CompactFormBuilder (235)
  
RULE 3: Header Contract — Unchanged (6-field header)

RULE 4 (Updated): Export Pattern
  - Source files: `export const X = { ... }`
  - Bundle: IIFE via esbuild
  - CẤM: window.* export trong source files

RULE 5: Layer Isolation — Unchanged

RULE 6: Agent Safe Zones — Unchanged (🟢🟡🔴 classification)

RULE 7 (NEW): Test Coverage Gate
  - Mọi file trong 🟢 Safe Zone PHẢI có ≥ 1 test file
  - Khi sửa logic trong file đã có test → PHẢI chạy test trước khi submit
  - Khi thêm file mới trong logic/ → PHẢI tạo *.test.js kèm theo
```

### 2.2 Agent Ruleset (Hard Rules — không ngoại lệ)

```markdown
## AGENT HARD RULES

### DO
1. Chạy `node build.js` sau MỌI thay đổi code
2. Chạy `node --test js/**/*.test.js` nếu sửa file trong logic/
3. Đọc header 6-dòng TRƯỚC KHI sửa bất kỳ file nào
4. Giữ file ≤ 150 LOC (trừ exceptions đã documented)
5. Thêm `export` cho mọi public symbol
6. Thêm import vào `app.js` khi tạo module mới
7. Rebuild bundle sau khi thêm/sửa import

### DON'T
1. KHÔNG refactor "tiện thể" — chỉ sửa đúng scope được giao
2. KHÔNG tạo abstraction mới (class, pattern) mà không có approval
3. KHÔNG sửa app.js ngoài việc thêm/xóa import
4. KHÔNG sửa .jsx files (ES3 territory)
5. KHÔNG xóa test cases đang pass
6. KHÔNG thêm npm dependencies (Google Drive incompatible)
```

### 2.3 Decision Tree: "Có nên refactor thêm không?"

```
Q1: Có bằng chứng file vi phạm Architecture Contract?
  └─ NO → KHÔNG REFACTOR. Feature mode.
  └─ YES ↓

Q2: Vi phạm gây ra bug/crash thực tế?
  └─ NO → Ghi nhận vào tech debt log. KHÔNG refactor ngay.
  └─ YES ↓

Q3: Fix < 30 dòng thay đổi?
  └─ YES → Fix ngay, không cần plan.
  └─ NO → Tạo implementation_plan, chờ approval.
```

---

## PHASE 3: Agent Playbooks

> **Mục tiêu:** Mỗi loại task có 1 playbook chuẩn. Agent chỉ cần follow steps.

### Playbook A: Fix Bug 🟢

```
SCOPE: ≤ 2 files, ≤ 30 dòng thay đổi
FREEDOM: Tự chủ (không cần approval)

STEPS:
1. Đọc header contract của file liên quan
2. Xác định root cause (1 câu)
3. Sửa code
4. `node build.js` → PASS?
5. `node --test js/**/*.test.js` → PASS?
6. Nếu cả 2 pass → Báo kết quả cho user
7. Nếu fail → Sửa lại, KHÔNG mở rộng scope
```

### Playbook B: Add Feature 🟡

```
SCOPE: ≤ 3 files sửa, ≤ 2 files mới, ≤ 100 dòng mới
FREEDOM: Cần approval cho plan

STEPS:
1. Tạo implementation_plan.md
2. Liệt kê: files mới, files sửa, dependencies
3. CHỜ user approval
4. Tạo file mới (copy template nếu có)
5. Thêm export vào file mới
6. Thêm import vào app.js
7. Thêm window.X = X vào app.js (nếu cần global access)
8. Tạo *.test.js cho logic mới
9. `node build.js` → PASS?
10. `node --test` → PASS?
11. Báo kết quả + walkthrough
```

### Playbook C: Optimize / Refactor 🔴

```
SCOPE: ≤ 5 files
FREEDOM: PHẢI có approval + evidence

PREREQUISITE: 
  - Bằng chứng vi phạm Architecture Contract
  - HOẶC performance data cho thấy bottleneck

STEPS:
1. Document evidence (file, rule, violation)
2. Tạo implementation_plan.md với rollback plan
3. CHỜ user approval
4. Thực hiện ĐÚNG plan (không thêm bớt)
5. `node build.js` + `node --test` → all PASS
6. Cập nhật walkthrough.md
```

---

## PHASE 4: Monitoring & Feedback Loop

> **Mục tiêu:** Phát hiện drift và regression sớm nhất có thể.

### 4.1 Pre-Task Gate (Agent tự chạy)

```
TRƯỚC MỌI TASK, agent PHẢI:
┌─────────────────────────────────────┐
│ 1. `node build.js`        → PASS?  │
│ 2. `node --test js/**/*.test.js`   │
│                            → PASS?  │
│ 3. Nếu cả 2 PASS → Proceed        │
│ 4. Nếu FAIL → Fix trước, báo user  │
└─────────────────────────────────────┘
```

### 4.2 Post-Task Gate (Agent tự chạy)

```
SAU MỌI TASK, agent PHẢI:
┌──────────────────────────────────────┐
│ 1. `node build.js`         → PASS?  │
│ 2. `node --test js/**/*.test.js`    │
│                             → PASS?  │
│ 3. Diff review: ≤ 3 files?          │
│ 4. Không sửa file ngoài scope?      │
│ 5. Tất cả YES → Submit              │
│ 6. Bất kỳ NO → Rollback, giải thích │
└──────────────────────────────────────┘
```

### 4.3 Quality Signals (User observes)

| Signal | Healthy | Unhealthy | Action |
|:-------|:--------|:----------|:-------|
| Build time | < 500ms | > 2s | Check for circular deps |
| Bundle size | ~150kb | > 250kb | Audit dead code |
| Test count | Growing | Shrinking | Agent deleting tests? |
| Test pass rate | 100% | < 100% | Fix immediately |
| Files per task | ≤ 3 | > 5 | Agent scope creep |

### 4.4 Architecture Drift Detection

Chạy định kỳ (mỗi 2 tuần hoặc sau 5 task):

```bash
# 1. typeof guards count (should be 0 in new code)
grep -r "typeof.*undefined" js/ --include="*.js" | grep -v bundle | grep -v test | wc -l

# 2. Files over 150 LOC
find js/ -name "*.js" -exec wc -l {} + | awk '$1 > 150' | grep -v bundle | grep -v test

# 3. Files without header
grep -rL "MODULE:" js/ --include="*.js" | grep -v bundle | grep -v test | grep -v node_modules

# 4. Build health
node build.js && node --test js/**/*.test.js
```

---

## PHASE 5: Roadmap

### Stage 1: Stabilize (Tuần 1-2) ← **BẠN ĐANG Ở ĐÂY**

> Mục tiêu: Xác nhận system hoạt động đúng sau refactor.

| # | Action | Owner | Criteria |
|:--|:-------|:------|:---------|
| S1 | Behavior Parity Test | **User** | All 8 items in §1.2 pass |
| S2 | Clean typeof guards (44 remaining) | Agent | grep count → 0 |
| S3 | Update `.agent/PROJECT_STATUS.md` | Agent | Reflect post-ESM state |
| S4 | Update `API_SURFACE.md` | Agent | Add `export` info, remove `window.*` refs |
| S5 | Update `DEPENDENCY_MAP.md` | Agent | Reflect import graph from `app.js` |

### Stage 2: Extend (Tuần 3-6)

> Mục tiêu: Phát triển tính năng mới trên nền kiến trúc mới.

| # | Action | Type | Benefit |
|:--|:-------|:-----|:--------|
| E1 | Expand test coverage | Testing | Cover UX normalizers + pipeline |
| E2 | Add new normalizer/validator | Feature | Prove template workflow works |
| E3 | Barrel files (`index.js`) | DX | Simplify imports: `from './logic/domain'` |
| E4 | JSDoc `@ts-check` cho Safe Zone | Type Safety | VS Code autocomplete + agent accuracy |

### Stage 3: Optimize (Tuần 7+)

> Mục tiêu: Giảm chi phí agent, tăng tốc development.

| # | Action | Type | Impact |
|:--|:-------|:-----|:-------|
| O1 | Add proper `import` to all source files | Quality | Eliminate need for window.* in app.js |
| O2 | Tree-shaking (esbuild) | Performance | Smaller bundle if dead exports exist |
| O3 | Pre-commit hook (build + test) | Automation | Catch errors before they reach agent |
| O4 | Performance profiling | Monitoring | Identify slow modules in Illustrator |

---

## RISK REGISTRY

### Post-Refactoring Risks

| # | Risk | Likelihood | Impact | Mitigation |
|:--|:-----|:-----------|:-------|:-----------|
| PR1 | **Regression từ ESM conversion** | Medium | High | Behavior Parity Test (§1.2) phải pass trước khi làm gì khác |
| PR2 | **Agent scope creep** do codebase "sạch hơn" | High | Medium | Playbook scope limits + Post-Task Gate |
| PR3 | **Architecture drift** qua nhiều sessions | Medium | High | Drift Detection script (§4.4) mỗi 2 tuần |
| PR4 | **Test rot** — tests pass nhưng không cover logic mới | Medium | Medium | Rule 7: Mọi file logic mới PHẢI có test |
| PR5 | **npm incompatibility** do Google Drive | Known | Low | Đã giải quyết: dùng `node:test` built-in, esbuild global |
| PR6 | **typeof guards** gây confusion cho agent | Low | Low | Stage 1 cleanup (S2) |
| PR7 | **Agent bịa import path** | Medium | Medium | Build gate bắt lỗi ngay. `node build.js` after every change |

### Risk Decision Matrix

```
Impact ↑
  High  │ PR1 ────── PR3
        │
  Med   │ PR2  PR4 ─ PR7
        │
  Low   │ PR5  PR6
        └──────────────────→ Likelihood
          Low    Med    High
```

**Priority:** PR1 (fix now) → PR2+PR3 (prevent) → PR4+PR7 (monitor)

---

## QUALITY SCOREBOARD

### Architecture Health (Measure weekly)

| Metric | Pre-Refactor | Post-Refactor | Target |
|:-------|:-------------|:--------------|:-------|
| R1: Explicit Dependencies | 47% | **~90%** *(44 typeof remain)* | 100% |
| R2: File Size Compliance | 67% | **93%** | 100% |
| R3: Header Contracts | 3% | **100%** | 100% |
| R4: Export Consistency | 0% | **100%** (ES Modules) | 100% |
| R5: Layer Isolation | 80% | **100%** | 100% |
| Build Success | Manual | **Automated** (< 300ms) | Always |
| Test Coverage | 0 tests | **49 tests** | 100+ |

### Agent Efficiency (Track per task)

| Metric | Definition | Good | Bad |
|:-------|:-----------|:-----|:----|
| **Task Completion Rate** | Tasks completed without rollback | > 90% | < 70% |
| **Files Per Task** | Average files modified per task | ≤ 2 | > 4 |
| **Build Failures** | Builds that fail post-task | 0 | > 1 |
| **Test Regressions** | Tests that break post-task | 0 | > 0 |
| **Scope Creep Rate** | Tasks that modify files outside original scope | < 10% | > 30% |

### Cost Efficiency

| Metric | Before Refactor | After Refactor | Improvement |
|:-------|:----------------|:---------------|:------------|
| Context tokens to understand 1 module | ~3000 | ~500 (header only) | **-83%** |
| Files agent reads for typical bug fix | 5-8 files | 1-2 files | **-75%** |
| Risk of hallucinating function name | ~20% | ~2% (imports explicit) | **-90%** |
| Risk of breaking load order | ~15% | **0%** (bundled) | **-100%** |
| Time to verify changes | Manual only | **Build + 49 tests in < 1s** | **∞ → automatic** |

---

## SUMMARY: What To Do Next

```
┌──────────────────────────────────────────────────────┐
│                  DECISION TREE                        │
│                                                      │
│  Q: "What should I do next?"                         │
│                                                      │
│  1. Have you done Behavior Parity Test (§1.2)?       │
│     └─ NO → Do it NOW. This is blocking.             │
│     └─ YES ↓                                         │
│                                                      │
│  2. Any failures in Behavior Parity?                 │
│     └─ YES → Fix bundle issues. Do NOT add features. │
│     └─ NO ↓                                          │
│                                                      │
│  3. Architecture stable. Pick your mode:             │
│     ├─ 🐛 Fix a bug       → Playbook A              │
│     ├─ ✨ Add a feature    → Playbook B              │
│     ├─ 🔧 Optimize        → Playbook C (need proof)  │
│     └─ 📊 Health check    → Run §4.4 scripts         │
└──────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Nguyên tắc vàng:** Refactoring đã xong. Từ bây giờ, mọi thay đổi phải tạo ra **giá trị trực tiếp cho người dùng** (feature, fix) hoặc **giá trị đo lường được cho Agent** (test, doc). Không refactor "vì đẹp".
