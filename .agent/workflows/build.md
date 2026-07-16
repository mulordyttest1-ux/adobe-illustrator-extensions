---
description: "Public workflow: implement approved plan hoac safe scoped change"
---

# /build

Workflow public de thuc thi code. `/build` chi nen bat dau khi da co plan duoc duyet, hoac khi thay doi la trivially safe.

## Trinh tu thuc hien

1. Doc root `AGENTS.md`, nested `AGENTS.md` gan nhat, va `.agent/workflows/core_protocol.md`.
2. Nap `skills/request_normalization/SKILL.md` va xuat normalized request receipt cho thay doi hien tai.
3. Xac nhan da co plan duoc duyet. Neu chua co scope/planning ro rang, route lai `/plan`.
4. Doc `c1_<app>_document.md` neu workflow truoc da tao.
5. Tao C2 moi tu `.task_steps/templates/c2_template.md`, sau do thuc hien scope lock va ghi vao `.task_steps/c2_<app>_scope.md`.
   - C2 phai mo dau bang `## Gate Policy` gom:
     - `Workflow: build`
     - `Task Tier: D1-1|D1-2|D1-3`
     - `Code Change: yes|no`
     - `Shared Change: yes|no`
     - `Cross-App Impact: yes|no`
   - Sau `Gate Policy`, ghi scope lock:
     - file se sua
     - consumers can kiem tra
     - cross-app impact neu co
6. Chia implementation thanh execution slices nho, doc lap, verify duoc.
7. Sau moi slice, checkpoint lai:
   - co dang dung chosen direction khong
   - validation toi thieu cua slice la gi
   - scope co dang drift thanh bug investigation khong
8. Nap `skills/lint/SKILL.md` hoac `skills/testing/SKILL.md` khi scope yeu cau.
9. Neu implementation drift thanh bug investigation, nap `skills/systematic_debugging/SKILL.md` de isolate truoc khi sua tiep.
10. Validate bang command phu hop:
    - theo app dang sua
    - rong hon neu sua shared/public API
11. Neu task la D1>=2, dung vao `libs/shared`, hoac co cross-app impact:
    - nap `skills/requesting_code_review/SKILL.md`
    - append `## Review Gate` vao chinh file C2
12. Nap `skills/verification_before_completion/SKILL.md` truoc close-out va ghi `Verification Gate`:
    - append `## Verification Gate` vao chinh file C2
13. Neu review gate dan toi sua them code, rerun impacted validation truoc khi dong `Verification Gate`.
14. Chay lenh khuyen dung truoc khi declare xong:
    - `npm run check:gates -- --file .task_steps/<c2-file>.md`
15. Neu change khong con trivially safe, co false start, co scope drift, co cross-app impact, hoac validation suyt fail:
   - them micro-postmortem ngan:
     - anti-pattern hay false assumption vua gap
     - guardrail/test dang le phai dung som hon
     - lesson co reusable hay khong
16. Neu micro-postmortem cho thay co lesson du reusable, promote 1 entry ngan vao `.agent/lessons_learned.md`.
17. Bao cao evidence, skip reasons (neu co), `Review Gate` (neu task yeu cau), `Verification Gate`, ket qua `check:gates`, rui ro con lai, va micro-postmortem neu co.
