---
description: "Public workflow: reproduce, isolate, fix, va validate bug"
---

# /fix

Workflow public de xu ly bug. `/fix` duoc phep vao code sau khi bug da duoc reproduce va scope da ro.

## Trinh tu thuc hien

1. Doc root `AGENTS.md`, nested `AGENTS.md` gan nhat, va `.agent/workflows/core_protocol.md`.
2. Nap `skills/request_normalization/SKILL.md` va xuat normalized request receipt:
   - symptom/intent
   - route
   - goal
   - success criteria
   - scope guess
   - unknowns can xin them neu can
3. Nap `skills/community_first/SKILL.md` de research symptom, pitfall, va edge cases.
4. Nap `skills/systematic_debugging/SKILL.md` nhu skill mandatory.
5. Nap `skills/testing/SKILL.md` neu can reproduce/test trong Illustrator/CEP.
6. Tao C2 moi tu `.task_steps/templates/c2_template.md`, sau do ghi scope lock vao `.task_steps/c2_<app>_scope.md`.
   - C2 phai mo dau bang `## Gate Policy` gom:
     - `Workflow: fix`
     - `Task Tier: D1-1|D1-2|D1-3`
     - `Code Change: yes|no`
     - `Shared Change: yes|no`
     - `Cross-App Impact: yes|no`
   - Sau `Gate Policy`, ghi:
     - file/module nghi bi anh huong
     - consumers can kiem tra
     - cross-app impact neu co
7. Capture symptom that su:
   - expected vs actual
   - reproduce path hoac ly do chua reproduce duoc
   - scope guess
8. Liet ke 3 gia thuyet doc lap, sau do isolate de loai tru tung gia thuyet.
9. Chi khi root cause da ro moi sua focused; khong patch be mat, tru khi user ro rang chi muon mitigation tam.
10. Neu bug fix can mo rong thanh refactor/feature hoac doi architecture, quay lai `/plan`.
11. Validate bang command va smoke test phu hop.
12. Neu task la D1>=2, dung vao `libs/shared`, hoac co cross-app impact:
    - nap `skills/requesting_code_review/SKILL.md`
    - append `## Review Gate` vao chinh file C2, va rerun impacted validation neu review gate dan toi sua them code
13. Nap `skills/verification_before_completion/SKILL.md` va append `## Verification Gate` vao chinh file C2.
14. Chay lenh khuyen dung truoc khi declare xong:
    - `npm run check:gates -- --file .task_steps/<c2-file>.md`
15. Bat buoc them postmortem:
   - root cause da duoc xac minh
   - false signal/false hypothesis nao tung danh lac huong
   - guardrail/test/query nao dang le phai dung som hon
   - lesson co reusable hay khong
16. Neu lesson du reusable, promote 1 entry ngan vao `.agent/lessons_learned.md`.
17. Bao cao `Symptom`, `Hypotheses`, `Isolation`, `Root Cause`, `Review Gate` (neu task yeu cau), `Verification Gate`, ket qua `check:gates`, residual risk, va `Postmortem`.
