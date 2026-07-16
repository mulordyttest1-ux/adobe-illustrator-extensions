# AGENTS.md

Huong dan scoped cho `toolkit-cep/`.

## Pham vi

- Duoc phep lam viec trong `toolkit-cep/` va `libs/shared/` khi co reuse that su.
- Khong doc/sua `wedding-cep/` hoac `symbol-cep/` tru khi task noi ro consumer impact.
- Khi route task trong app nay, mo `toolkit-cep/FEATURE_MAP.md` cho feature routing va `toolkit-cep/ARCHITECTURE.md` cho boundary rules.

## Focus ky thuat

- Day la utility launcher panel, khong phai app domain lon.
- Muc tieu shell: sau khi bo khung xong, them mot module `one-click host action` khong duoc sua runtime shell.
- Boundary quan trong:
  - `cep/js/` co the dung ES6+.
  - `cep/jsx/` phai giu ES3.
  - auto-discovery chi duoc xay ra luc build, khong runtime folder scan.

## UX va shared UI

- Dung `UIFeedback` cho toast/loading/error.
- Tranh `alert()`, `confirm()`, `window.alert()`.
- V1 la `dashboard + search`, khong tabbed shell, khong custom module view.

## Commands

- `npm run lint:toolkit`
- `npm run build:toolkit`
- `npm run test:toolkit`
- `npm run test:smoke:toolkit`
- `npm run test:smoke:toolkit:module -- --module <module-id[,module-id]>`
- `npm run test:smoke:toolkit:scenario -- --scenario <scenario-id[,scenario-id]>`
- `npm run toolkit:new-module`
- `npm run check:toolkit:shell-freeze`
- `npm run hooks:install`

## Verification policy

- Module-only work trong `cep/modules/**` khong duoc mac dinh chay full smoke.
- Everyday lane cho module work:
  - `npm run lint:toolkit`
  - `npm run build:toolkit`
  - `npm run test:toolkit`
  - `npm run test:smoke:toolkit:module -- --module <module-id>`
- `test:smoke:toolkit:module` chay **stable representative subset** cua module do; lane sau hon van co the goi bang `test:smoke:toolkit:scenario`.
- Neu sua nhieu module cung luc, chay focused smoke cho union cac module lien quan.
- Chi escalate sang `npm run test:smoke:toolkit` khi:
  - cham frozen shell/runtime
  - doi smoke harness chung
  - dong batch lon / milestone
  - dieu tra bug co tuong tac cheo
- `npm run test:smoke:toolkit` la **stable aggregate lane**, khong co nghia la no phai chua moi scenario debug sau.
- Module production moi khong duoc xem la done neu chua co it nhat mot focused smoke scenario gan dung `moduleId`.

## Frozen shell guard

- `toolkit-cep` shell/runtime/build contract dang o che do frozen cho V1 `one-click host action`.
- Safe zone cho feature binh thuong:
  - `toolkit-cep/cep/modules/**`
  - `toolkit-cep/cep/debug_scripts/**`
  - toolkit docs va test files
- Frozen shell zone:
  - `toolkit-cep/cep/js/**` tru build output
  - `toolkit-cep/cep/jsx/**`
  - `toolkit-cep/cep/index.html`
  - `toolkit-cep/cep/css/style.css`
  - `toolkit-cep/cep/CSXS/manifest.xml`
  - `toolkit-cep/cep/build.cjs`
  - `toolkit-cep/cep/scripts/**`
- Neu cham vao frozen shell zone, agent/implementer phai dung lai va xin approval truoc khi dung `TOOLKIT_ALLOW_SHELL_CHANGE=1`.
- Chay `npm run hooks:install` mot lan tren may local de bat pre-commit guard.

## Runtime note

- Live smoke test cua app nay chi duoc chay tren Illustrator 2026 qua debug port `9099`.
- Khong duoc them helper panel/invisible panel neu chua co trigger that su.
