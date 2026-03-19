---
name: Core Protocol (v4.6)
description: LUẬT GỐC + RUNBOOK — PLAN→ACT→REFLECT. File SSOT duy nhất. Chứa toàn bộ quy tắc §I0, §C0–§C6, §E1–§E2, §RF1–§RF3 VÀ quy trình thực thi chi tiết §C1–§C5.
version: 4.7
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

---

## §C0 — AUTO-ROUTE (Chọn Skill) 🔴 [BLOCKER]

| Task Signal | Skill(s) to Load |
|:------------|:-----------------|
| **MỌI task (D1=1→5)** | Gọi `@/communication_search` TRƯỚC TIÊN để trinh sát |
| "refactor", "đổi tên", "di chuyển", "tách" | `skills/refactoring/` |
| "feature mới", "build", "thêm chức năng" | `skills/feature_dev/` + `skills/testing/` |
| "bug", "lỗi", "fix", "test" | `skills/testing/` |
| "lint", "architecture" | `skills/lint/` |
| Task phức tạp (D1≥3) | + `skills/model_selection/` |

### §M — Model Recommendation 🔴 [BLOCKER]
- **Nếu D1≥3** → Bắt buộc load `skills/model_selection/SKILL.md`.
- **Nếu khuyến nghị ≠ thực tế** → Tư vấn ngắn gọn cho User trước khi tiếp tục.

---

## PHASE 1: PLAN (Read-only — KHÔNG sửa code)

### §C1 — COMMUNICATION SEARCH 🔴 [BLOCKER]
> Được chạy độc lập qua lệnh `/communication_search`
1. Grep xem dự án đang dùng ES3, ES6, React hay Node.js.
2. Dùng `search_web` tìm Best Practice trên StackOverflow / Github.
3. Đối chiếu kết quả web với context Codebase (nếu web bảo "dùng fetch" mà dự án ES3 → search tiếp workaround).
4. Lưu kết quả vào `.task_steps/c1_<tên_app>_document.md`.

### §C2 — SCOPE LOCK 🔴 [BLOCKER]
- Liệt kê file(s) sẽ sửa (ưu tiên ≤ 3).
- Bắt buộc gọi `grep` tìm TẤT CẢ consumers. Cấm đoán bằng mắt.
- Đánh giá Impact: sửa A có phá B/C không?

### §C3 — CONTRACT 🔴 [BLOCKER]
| D1 | Loại | Contract |
|:--:|:-----|:---------|
| 1 | Typo | Không cần plan. Sửa → lint → done |
| 2 | Bug nhỏ | Mini-plan trong chat (3-5 bullets, user duyệt) |
| 3+ | Feature/refactor lớn | Full `implementation_plan.md` → User duyệt → mới code |

---

## PHASE 2: ACT — RUNBOOK (§C1→§C5) 🔴 [SSOT]

> **LƯU Ý:** Đây là phần Runbook đã được hợp nhất vào Core Protocol (SSOT Pattern). KHÔNG có file `runbook/SKILL.md` độc lập nào tồn tại nữa.

### §C1 — ĐỌC TÀI LIỆU TIỀN TRẠM
- Bắt buộc dùng tool đọc ĐÚNG FILE BÁO CÁO C1 THEO TÊN APP VỪA LÀM.
  - Ví dụ: `c1_wedding_cep_document.md` hoặc `c1_symbol_cep_document.md`.
- File nằm trong thư mục `.task_steps/`. KHÔNG được tự ý search web ở bước này.
- LUẬT FOLDER: Đang làm app nào chỉ đọc C1 của app đó. Cấm truy cập chéo.

### §C2 — SCOPE LOCK 🔴 [BLOCKER]
- Dùng `grep_search` tìm TẤT CẢ consumers của module dự định sửa. Cấm đoán bằng mắt.
- Ghi kết quả vào `.task_steps/C2_<tên_app>_scope.md`.
- Đánh giá Impact: sửa A có phá B/C không? Xác nhận KHÔNG break consumer nào.

### §C3 — CONTRACT 🔴 [BLOCKER]
| D1 | Loại | Contract |
|:--:|:-----|:---------|
| 1 | Typo | Không cần plan. Sửa → lint → done |
| 2 | Bug nhỏ | Mini-plan trong chat (3-5 bullets, user duyệt) |
| 3+ | Feature/refactor lớn | Full `implementation_plan.md` → User duyệt → mới code |
**BẮT BUỘC DỪNG và xin Sếp duyệt trước khi sang §C4. KHÔNG được auto-proceed.**

### §C4 — EXECUTE
- Code incremental, phase-by-phase. Cấm đập sập toàn bộ file nếu không được cho phép.
- Cập nhật `task.md` real-time.

### §C5 — VALIDATE 🔴 [BLOCKER]
- `npm run lint` và `npm run build` → XANH.
- Nếu ĐỎ → chạy §E1 Error Recovery.
- (Nạp `skills/lint/SKILL.md` nếu dính lỗi Nx architecture.)

### §E1 — ERROR RECOVERY
1. Liệt kê 3 Giả Thuyết độc lập từ nông đến sâu.
2. Isolate & Test từng giả thuyết bằng tool.
3. Fix root cause (không patch bề mặt).
4. Verify lại §C5.
5. Fail > 3 lần → Hỏi User.

### §E2 — GUARDRAILS
- ⛔ KHÔNG xóa file production mà không backup.
- ⛔ KHÔNG sửa > 5 files trong 1 commit logic.
- ⛔ KHÔNG bypass `eslint-disable` cho architecture rules.

---

## PHASE 3: REFLECT

### §C6 — COMPLIANCE RECEIPT (BẮT BUỘC trước khi báo cáo User)
```
§C1 RECON: ✅/❌ | §C2 SCOPE: ✅/❌ | §C3 CONTRACT: D[1-5] [loại plan]
§C4 EXECUTE: ✅/❌ | §C5 VALIDATE: ✅/❌
Skill(s): [loaded skills]
Lint: [PASS/FAIL/SKIP] | Test: [PASS/FAIL/SKIP] | Build: [PASS/FAIL/SKIP]
```

### §RF1 — LESSONS LEARNED
- Rút bài học → ghi vào `.agent/lessons_learned.md` (append, không xóa cũ).

### §RF2 — WORKFLOW IMPROVEMENT CHECK
- Đề xuất cải tiến workflow nếu có → Sếp duyệt → Agent cập nhật.

### §RF3 — CONTEXT CLEANUP
- Cập nhật `task.md` đúng trạng thái, ghi RESUME POINT nếu chưa xong.
