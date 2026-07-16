---
description: Internal base contract shared by /plan, /build, and /fix. Not a public workflow.
---

# Core Protocol (Internal Base)

File nay giu protocol dung chung cho 3 workflow public:

- `/plan`
- `/build`
- `/fix`

No khong phai public launcher va khong thay the 3 lenh tren.

## Vai tro

- Dinh nghia invariant dung chung cho moi workflow.
- Chot naming cho artifacts nhu C1/C2.
- Chot validation va reporting contract.
- Lam "hien phap noi bo", khong canh tranh vai tro voi workflow public.

## Instruction precedence

1. `AGENTS.md` gan nhat voi code dang sua.
2. Root `AGENTS.md`.
3. Workflow hien hanh (`/plan`, `/build`, `/fix`).
4. Git history va ghi chu cu, neu ban chu dong tra cuu.

Neu instruction mau thuan nhau, sua tai lieu thay vi giu ca hai cung active.

## Shared invariants

- Doc root `AGENTS.md` truoc, sau do doc nested `AGENTS.md` gan nhat voi module dang sua.
- Request moi phai di qua request normalization truoc khi route vao `/plan`, `/build`, hoac `/fix`.
- He thong nay hoc tu Superpowers ve process quality, nhung van repo-native; khong them plugin/export/command structure ngoai 3 workflow public.
- `.agent/memory/` chi la tai lieu tham khao; khong xem no la session bootstrap chinh.
- Khong them reference moi toi legacy slash commands hoac bootstrap files da deprecate.
- Moi thay doi trong `libs/shared` phai co cross-app impact note.
- Moi task D1>=2, shared, hoac cross-app phai co Review Gate va Verification Gate truoc khi close-out.

## Task tiers (D1)

| D1 | Loai thay doi | Contract |
|:---|:--------------|:---------|
| 1 | Docs / typo / thay doi cuc bo rat nho | Co the lam ngan gon, nhung van phai ghi ro scope va validation |
| 2 | Bug fix hoac thay doi han che trong 1 module | Mini-plan trong chat hoac artifact nho, scope lock ro rang |
| 3 | Feature, refactor, thay doi cross-module/public API | Can `/plan`, C1 report, va implementation plan ro rang truoc khi code |

## Artifact contract

| Artifact | Muc dich | Ten chuan |
|:---------|:---------|:----------|
| Receipt | Normalized request summary | trong chat hoac phan mo dau cua artifact lien quan |
| C1 | Research va alignment report | `.task_steps/c1_<app>_document.md` |
| C2 | Scope lock, impact report, va gate receipt | `.task_steps/c2_<app>_scope.md` |
| Plan | Ke hoach thuc thi | mini-plan trong chat hoac `implementation_plan.md` |

Khong tao artifact moi neu workflow hien hanh da co artifact tuong duong va con dung.

Preferred starting point cho artifact moi:

- C1: `.task_steps/templates/c1_template.md`
- C2: `.task_steps/templates/c2_template.md`

Voi task D1>=3:

- C1 duoc viet theo 2 pass trong cung mot file.
- Pass A = `Direction Brief`:
  - problem restatement
  - 2-3 options that su
  - best practices
  - anti-patterns
  - edge cases
  - counterfactuals
  - chosen direction
  - ly do loai cac option con lai
- Pass B = implementation slices sau khi direction da duoc duyet.
- C1 moi nen theo heading structure tu `c1_template.md`.

## Scope lock

- Liet ke file du kien sua.
- Tim consumers truc tiep cua module/file quan trong.
- Danh gia impact theo module, nhat la khi sua `libs/shared`.
- Giu change set focused; neu scope mo rong dot bien, quay lai `/plan`.
- C2 phai bat dau bang `## Gate Policy` voi cac truong:
  - `Workflow: build|fix`
  - `Task Tier: D1-1|D1-2|D1-3`
  - `Code Change: yes|no`
  - `Shared Change: yes|no`
  - `Cross-App Impact: yes|no`
- Gate requirement duoc suy ra tu `Gate Policy`, khong ghi co tay bang cac flag trung lap.

## Validation contract

- Docs-only change:
  - Co the dung gate nhe va skip build/test, nhung phai ghi ly do.
- Code change trong 1 app:
  - Chay lint/build/test phu hop voi app do.
- Shared change hoac public API change:
  - Nghien ve `lint:all`, build/test rong hon, hoac `verify` neu phu hop.

## Review and verification gates

- `requesting_code_review` la review gate:
  - bat buoc cho D1>=2
  - bat buoc cho thay doi vao `libs/shared`
  - bat buoc cho cross-app impact
- `verification_before_completion` la verification gate:
  - bat buoc cho moi code change truoc khi declare xong
  - neu review gate dan toi sua them code, phai rerun impacted validation truoc khi dong gate
- Gate receipt duoc append vao cuoi C2:
  - `## Review Gate` neu required
  - `## Verification Gate` neu required
- C2 moi nen theo heading structure tu `c2_template.md`.
- Lenh enforcement khuyen dung:
  - `npm run check:gates -- --file .task_steps/<c2-file>.md`
- Khong noi `check:gates` vao `npm run verify`; day la gate rieng cho task dang thuc hien.

## Learning loop

- `anti-pattern analysis` la preventive loop:
  - no thuoc request normalization, `/plan`, `community_first`, va `ideation`.
- `systematic_debugging` la root-cause loop:
  - bat buoc cho `/fix`
  - duoc nap trong `/build` neu implementation drift thanh bug investigation
- `postmortem` la learning loop sau validation:
  - bat buoc cho `/fix`
  - ap dung nhe/co dieu kien cho `/build`
- Lesson chi duoc promote vao `.agent/lessons_learned.md` khi du reusable ngoai task vua lam.

## Error recovery

1. Liet ke 3 gia thuyet doc lap.
2. Isolate de loai tru tung gia thuyet.
3. Sua root cause, khong patch be mat.
4. Chay lai validation.
5. Neu van mo ho hoac scope bien thanh feature/refactor, route ve `/plan`.

## Reporting contract

Close-out nen co:

- file/module da sua
- validation da chay hoac ly do skip
- `Review Gate` neu task yeu cau
- `Verification Gate`
- ket qua `npm run check:gates -- --file <c2>` neu task co C2 gate receipt
- rui ro con lai
- cross-app impact neu co
- postmortem neu workflow hien hanh yeu cau
