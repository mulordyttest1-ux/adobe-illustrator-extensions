---
description: Core Pipeline — ALWAYS loaded. 3 phases: Plan → Act → Reflect.
version: 4.6
last_updated: 2026-02-26
---

# Core Protocol v4.6

> 🔴 Bắt buộc cho MỌI task sửa/thêm/xóa code. Không ngoại lệ.
> Pipeline: **PLAN → ACT → REFLECT** (3 phases, không phải 2).

---

## §I0 — IDEATION GATE

Khi nhận task **phức tạp** (D1≥3 hoặc task mới hoàn toàn):
→ Load `skills/ideation/SKILL.md`, chạy §I1–§I4 TRƯỚC khi làm bất cứ gì.

Khi nhận task **đơn giản** (fix bug nhỏ, lint, sửa typo):
→ Bỏ qua §I, nhảy thẳng §C0.

User gõ `/skip_ideation` → bypass.

---

## §C0 — AUTO-ROUTE (Chọn Skill) 🔴 [BLOCKER]

Agent đọc frontmatter `skills/*/SKILL.md` rồi chọn skill phù hợp:

| Task Signal | Skill(s) to Load |
|:------------|:-----------------|
| **MỌI task (D1=1→5)** | **`skills/community_first/`** (BẮT BUỘC, luôn load) |
| "refactor", "đổi tên", "di chuyển", "tách" | `skills/refactoring/` |
| "feature mới", "build", "thêm chức năng" | `skills/feature_dev/` + `skills/testing/` |
| "bug", "lỗi", "fix", "test" | `skills/testing/` |
| "lint", "architecture" | `skills/lint/` |
| Task phức tạp (D1≥3) | + `skills/model_selection/` |
| Task đơn giản (1-2 dòng) | Core + community_first only |

Ambiguous → Hỏi User. Complex → Load nhiều skills (Composition).

### §M — Model Recommendation 🔴 [BLOCKER]
Sau khi chọn skill, Agent score D1 và khuyến nghị model:
- **Nếu Recommended = Actual** → Im lặng, tiếp tục.
- **Nếu Recommended ≠ Actual** → Tư vấn ngắn gọn cho User:
  ```
  §M: D1=2 → Task nhẹ, khuyến nghị Flash (tiết kiệm token).
  ⚡ Sếp có muốn chuyển model không? Nếu không, em tiếp tục.
  ```
- **Nếu D1≥3** → Bắt buộc load `skills/model_selection/SKILL.md`, score 6 chiều, in ra OUTPUT CHUẨN như trong docs.

---

## PHASE 1: PLAN (Read-only — KHÔNG sửa code)

> ⛔ **HARD STOP TẠI §C1/§C2:** Agent BẮT BUỘC phải tách riêng các lệnh chạy tool `search_web` (§C1) và `grep` (§C2). Quá trình chạy 2 bước này phải độc lập và có kết quả thật. KHÔNG ĐƯỢC tự bịa ra Best Practice hoặc chém gió ra kết quả grep rồi nhảy ngay sang §C3 trong cùng 1 lần chat.

### §C1 — COMMUNITY FIRST 🔴 [BLOCKER] (Trọng tâm Pipeline)

> 🦁 Load **`skills/community_first/SKILL.md`** — BẢN FULL.
> MỌI task (D1=1 đến D1=5) đều PHẢI chạy. Không ngoại lệ.

**Tóm tắt pipeline (chi tiết trong skill file):**
- **Step 0: DEFINE + QUERY EXPANSION** — 1 câu tiếng Anh + 2-3 search queries
- **Step 1: SEARCH + LỌC NHIỄU** — `search_web` + Rerank (bỏ noise, giữ W3C/MDN/SO)
- **Step 2: EXTRACT** — Trích best practice + anti-pattern + edge case
- **Step 3: ALIGN** — Khớp → tiến. Lệch → DỪNG.
- **Step 4: Codebase Recon** — Đọc governance, dependency map

> ⛔ Agent KHÔNG ĐƯỢC nhảy vào code nếu chưa hoàn thành Step 0–3.
> Suy luận cá nhân mà không kiểm chứng = Parametric Hallucination.

### §C2 — SCOPE LOCK 🔴 [BLOCKER] (Khóa phạm vi)
- [ ] Liệt kê file(s) sẽ sửa (ưu tiên ≤ 3)
- [ ] Bắt buộc gọi `grep` tìm TẤT CẢ consumers gọi đến module đó. Cấm dùng mắt đoán.
- [ ] Đánh giá Impact: sửa A có phá B/C không?
- [ ] Xác nhận KHÔNG break bất kỳ consumer nào

**Adaptive Depth Gate (Trace Depth tối thiểu theo SUM):**

| SUM (D1+D2+D3) | Min Trace Depth | Min Hypotheses (§E1) |
|:---:|:---:|:---:|
| 3–5 | 0 (grep callers chỉ 1 lớp) | 1 (fix trực tiếp) |
| 6–8 | 1 (grep callers) | 2 |
| 9–11 | 2 (grep callers of callers) | 3 |
| 12–15 | 3 (grep + dependency map) | 3 + search_web |

### §C3 — CONTRACT 🔴 [BLOCKER] (Hợp đồng — Tiered theo D1)

| D1 | Loại | Contract |
|:--:|:-----|:---------|
| 1 | Typo, 1-2 dòng | Không cần plan. Sửa → lint → done |
| 2 | Bug fix, logic nhỏ | **Mini-plan trong chat** (3-5 bullet points, user duyệt) |
| 3+ | Feature, refactor lớn | **Full `implementation_plan.md`** → User duyệt → mới code |

**EVIDENCE CHECKLIST (Bắt buộc chèn vào Plan):**
```md
## BẰNG CHỨNG HỢP LỆ (COMPLIANCE EVIDENCE)
- §C0/§M (Model): D1=[x], Model=[x]
- §C1 (Community): Đã search "[query]", kết luận: ...
- §C2 (Scope Lock): Đã grep thấy [x] consumers.
```

Checklist cho mọi mức:
- [ ] Import direction đúng chiều (XUỐNG/NGANG, không NGƯỢC)?
- [ ] Zone Check: 🟢Safe / 🟡Caution / 🔴Danger
- [ ] Files affected ≤ 5? (nếu > 5 → tách task)

**Output Phase 1:** Agent gọi `notify_user` nộp Plan → User approves → qua Phase 2. Mặc định KHÔNG auto-proceed.

---

## PHASE 2: ACT (Write mode — sửa code)

### §C4 — EXECUTE (Thực thi)
- [ ] Code incremental, phase-by-phase
- [ ] Giữa chừng: kiểm tra logic bằng mắt, chưa cần build
- [ ] Build + Lint tập trung ở §C5 (tránh chạy command thừa)
- [ ] Cập nhật `task.md` real-time

### §C5 — VALIDATE 🔴 [BLOCKER] (Nghiệm thu)
- [ ] `npm run verify` → XANH 4/4 (Lint, Build, E2E, Sync)
- [ ] Nếu ĐỎ → chạy §E1 Error Recovery
- [ ] Cập nhật `types.d.ts` nếu public API thay đổi

### §E1 — ERROR RECOVERY (Khi verify fail hoặc Bug Feedback)
1. **Identify & Brainstorm (Anti-Tunnel-Vision) 🔴:** KHOAN vội fix. BẮT BUỘC liệt kê rõ 3 Giả Thuyết (Hypotheses) độc lập từ nông đến sâu (VD: 1. Typo/Syntax/Thiếu file → 2. CSS/Logic sai → 3. Môi trường/Cache).
2. **Isolate & Test Hypotheses:** Dùng công cụ (CDP, bash, Node) để chứng minh hoặc loại trừ từng giả thuyết TRƯỚC khi chọn hướng đi.
3. **Fix:** Sửa root cause (nguyên nhân gốc rễ đã được chứng minh), KHÔNG patch bề mặt.
4. **Verify:** Chạy lại §C5 cho kết quả xanh.
5. **Escalate:** Fail > 3 lần → Hỏi User.

### §E2 — GUARDRAILS (Rào cản cứng)
- ⛔ KHÔNG xóa file production mà không backup
- ⛔ KHÔNG sửa > 5 files trong 1 commit logic
- ⛔ KHÔNG bypass `eslint-disable` cho architecture rules
- ⛔ KHÔNG auto-update workflow files **trừ khi User yêu cầu trực tiếp**
- ⚠️ Zone 🔴 → Chỉ sửa khi User yêu cầu + review

**Output Phase 2:** Working code + passing tests.

---

## PHASE 3: REFLECT (Learn — rút kinh nghiệm)

### §C6 — HARD GATE ⛔ (Compliance Receipt)

> **QUAN TRỌNG:** Agent KHÔNG ĐƯỢC báo cáo kết quả cho User cho đến khi
> hoàn thành TẤT CẢ checkboxes dưới đây. Đánh ✅ mà KHÔNG có bằng chứng = VI PHẠM.

**Verification Evidence (BẮT BUỘC paste output thật):**
- [ ] `npm run lint` → Paste kết quả (hoặc ghi lý do skip nếu chỉ sửa .md)
- [ ] `npm run test:e2e` → Paste kết quả (hoặc ghi lý do skip)
- [ ] `npm run build` → Paste kết quả nếu sửa JS/JSX logic
- [ ] Nếu TẤT CẢ XANH → tiếp. Nếu ĐỎ → chạy §E1, KHÔNG ĐƯỢC skip.

**Compliance Receipt (sau khi có evidence):**
```
§C1 RECON: ✅/❌ | §C2 SCOPE: ✅/❌ | §C3 CONTRACT: D[1-5] [loại plan]
§C4 EXECUTE: ✅/❌ | §C5 VALIDATE: ✅/❌
Skill(s): [loaded skills]
Model: [Recommended=Actual → ✅ | hoặc ghi lý do dùng model khác]
Lint: [PASS/FAIL/SKIP lý do] | Test: [PASS/FAIL/SKIP] | Build: [PASS/FAIL/SKIP]
Error Recovery: [§E1 invoked? Y/N]
```

### §RF1 — LESSONS LEARNED
- Task này có lỗi nào phải fix nhiều lần?
- Có edge case nào bất ngờ?
- Có anti-pattern nào agent suýt mắc?
Output: 1-3 bullets → **Ghi vào `.agent/lessons_learned.md`** (append, không xóa cũ)

### §RF2 — WORKFLOW IMPROVEMENT CHECK
- Workflow hiện tại có bước nào thừa/thiếu?
- Có skill nào cần cập nhật?
Output: Đề xuất (nếu có) → Sếp duyệt → Agent cập nhật

### §RF3 — CONTEXT CLEANUP
- [ ] Kiểm tra `task.md` đã cập nhật đúng trạng thái
- [ ] Ghi RESUME POINT nếu task chưa xong
- [ ] Xóa entries hoàn thành trong task.md

**Output Phase 3:** Evidence + Compliance Receipt + Lessons + Clean state.
