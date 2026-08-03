# AGENTS.md

Huong dan scoped cho `symbol-cep/`.

## Pham vi

- Duoc phep lam viec trong `symbol-cep/` va `libs/shared/`.
- Khong doc/sua `wedding-cep/` hoac `libs/wedding/` tru khi task noi ro.
- Khi route task trong app nay, mo `symbol-cep/FEATURE_MAP.md` cho feature routing va `symbol-cep/ARCHITECTURE.md` cho boundary rules.

## Focus ky thuat

- Panel nay tap trung vao flow imposition: preset, config, preflight/postflight, CEP bridge.
- Boundary quan trong:
  - `cep/js/` co the dung ES6+.
  - `cep/jsx/` phai giu ES3.
- Neu sua bridge hoac host script, uu tien compatibility va payload contract truoc UI polish.

## UX va shared UI

- Dung `UIFeedback` cho toast/loading/error.
- Tranh `alert()`, `confirm()`, `window.alert()`.

## Commands

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm run test:symbol`
- `npm run test:smoke:symbol`
- `npm run test:e2e:symbol` - alias compatibility cho smoke test

## Test note

- `npm run test:symbol` la unit/contract lane cho panel va developer tooling.
- Runtime Illustrator chi duoc xac nhan boi `npm run test:smoke:symbol` tren lane 2026.

## Cross-app note

- Neu thay doi `libs/shared`, ghi ro tac dong den ca `symbol-cep` va `wedding-cep` trong plan.
