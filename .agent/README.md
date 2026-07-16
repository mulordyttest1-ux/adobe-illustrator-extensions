# .agent Internal Directory

Thu muc nay giu control plane gon cho he thong agent trong repo: workflows, gate skills, helper scripts, va mot so thin wrappers/reference stores con consumer ro rang.

## Active surface

- Repo-wide instructions:
  - `/AGENTS.md`
- Scoped instructions:
  - `/symbol-cep/AGENTS.md`
  - `/wedding-cep/AGENTS.md`
  - `/libs/wedding/domain/AGENTS.md`
  - `/libs/shared/AGENTS.md`
- Public workflows:
  - `.agent/workflows/plan.md`
  - `.agent/workflows/build.md`
  - `.agent/workflows/fix.md`
- Internal base contract:
  - `.agent/workflows/core_protocol.md`
- Internal front-door:
  - `.agent/workflows/skills/request_normalization/SKILL.md`
- Internal gate skills:
  - `.agent/workflows/skills/systematic_debugging/SKILL.md`
  - `.agent/workflows/skills/verification_before_completion/SKILL.md`
  - `.agent/workflows/skills/requesting_code_review/SKILL.md`

## Active tree map

- `workflows/core_protocol.md`
  - Internal contract dung chung cho `/plan`, `/build`, `/fix`.
- `workflows/plan.md`, `workflows/build.md`, `workflows/fix.md`
  - Ba workflow public duy nhat.
- `workflows/skills/`
  - Support skills chi nap khi workflow can, gom normalization, debugging, review, verification, va planning helpers.
- `memory/skills/`
  - Chi giu thin wrappers hoac reference stores duoc consumer dang song dung toi.
- `lessons_learned.md`
  - Persistent lessons da du reusable.

## Maintainer rules

- Root `AGENTS.md` la repo-wide instruction source duy nhat.
- Nested `AGENTS.md` la noi dat rule theo module.
- `.agent/README.md` la maintainer map duy nhat trong `.agent`.
- File nay la ban do dieu huong mong, khong co muc tieu mirror day du moi thu muc dang song trong `.agent/workflows/skills/`.
- He thong hoc tinh than process tu Superpowers, nhung khong copy command layer, plugin manifests, hay packaging structure cua no.
- Khong them compatibility shim, generated map, hay indexing layer moi vao `.agent`.
- Khong them `commands/` hoac native-export folders cho tool khac neu chua co nhu cau ro rang.
- `.agent/memory/` chi duoc giu:
  - thin wrapper tro ve repo SSOT
  - reference store con consumer ro rang
- Neu mot wrapper/noi dung duplicate repo docs hoac external skill, xoa surface du thua thay vi maintain song song.
- Neu mot tai lieu khong con consumer ro rang, xoa khoi repo thay vi giu "tam de sau".
- Khi co xung dot, sua SSOT hien hanh thay vi de hai file song song.
