# AGENTS.md

Huong dan scoped cho `wedding-cep/`.

## Pham vi

- Duoc phep lam viec trong `wedding-cep/`, `libs/wedding/`, va `libs/shared/`.
- Khong doc/sua `symbol-cep/` tru khi task noi ro.
- Khi route task trong app nay, mo `wedding-cep/FEATURE_MAP.md` cho feature routing, `wedding-cep/ARCHITECTURE.md` cho boundary rules, va `wedding-cep/PROJECT_STATUS.md` cho health/status.

## Focus ky thuat

- Day la panel legacy hon, can uu tien thay doi nho, co scope ro, va verify ky.
- Boundary quan trong:
  - `cep/js/` co the dung ES6+.
  - `cep/jsx/` phai giu ES3.
- `@wedding/domain` la domain layer; khong dua UI/CEP concerns vao day.

## UX va shared UI

- Dung `UIFeedback` cho toast/loading/error.
- Tranh `alert()`, `confirm()`, `window.alert()`.

## Commands

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:domain:wedding`
- `npm run test:smoke:wedding`
- `npm run test:e2e:wedding` - alias compatibility cho smoke test

## Legacy caution

- Uu tien patch focused thay vi rewrite lan rong.
- Neu thay doi co anh huong architecture, route qua `/plan` truoc.
