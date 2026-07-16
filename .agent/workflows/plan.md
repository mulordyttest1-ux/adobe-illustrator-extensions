---
description: "Public workflow: research, scope lock, va implementation planning truoc khi code"
---

# /plan

Workflow public de research va lap ke hoach. `/plan` khong duoc viet code.

## Trinh tu thuc hien

1. Doc root `AGENTS.md` va nested `AGENTS.md` gan nhat voi module se sua.
2. Nap `skills/request_normalization/SKILL.md` va xuat normalized request receipt:
   - intent
   - route
   - goal
   - success criteria
   - scope guess
   - constraints
   - unknowns
   - approval needed
3. Nap `skills/community_first/SKILL.md` de research best practice va align voi codebase hien tai.
4. Neu task mo ho hoac la feature/refactor lon, nap them `skills/ideation/SKILL.md`.
5. Neu task phuc tap (D1 >= 3), nap them `skills/model_selection/SKILL.md` neu can danh gia model/effort.
6. Tao C1 moi tu `.task_steps/templates/c1_template.md`, sau do ghi Pass A vao `.task_steps/c1_<app>_document.md` nhu `Direction Brief`.
   - `Direction Brief` bat buoc cho task mo ho, feature, refactor, hoac shared impact.
   - Toi thieu phai co:
     - problem restatement
     - 2-3 options that su
     - best practices
     - anti-patterns
     - edge cases
     - counterfactuals
     - chosen direction
     - ly do loai cac option con lai
7. Dung lai va xin approval cho `Direction Brief` truoc khi viet implementation plan chi tiet.
8. Sau khi direction da duoc duyet, hoan thien Pass B cua C1 theo heading template hoac viet mini-plan trong chat:
   - implementation slices nho, doc lap, verify duoc
   - validation toi thieu cho moi slice
   - consumer sweep neu dung vao `libs/shared` hoac surface shared
9. Xac dinh scope du kien:
   - file/module se anh huong
   - consumers can kiem tra
   - cross-app impact neu dung vao `libs/shared`
10. Xuat implementation plan:
    - task nho: mini-plan trong chat
    - task lon: `implementation_plan.md`
11. Dung lai va cho user duyet. Khong code trong `/plan`.
