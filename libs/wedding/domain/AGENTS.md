# AGENTS.md

Huong dan scoped cho `libs/wedding/domain/`.

## Pham vi

- Thu muc nay la shared domain package cho quy tac nghiep vu wedding, dung chung va khong phu thuoc CEP/UI.
- Khi route task trong package nay, mo `libs/wedding/domain/README.md` de xac dinh entrypoints, pham vi nghiep vu, va validation lane.
- Mac dinh coi moi thay doi tai day la elevated-risk vi co the tac dong toi `wedding-cep` va cac consumer sau nay.

## Nguyen tac

- Giu package nay pure: khong dua CEP, DOM, bridge, toast, hay panel state vao day.
- Khong import nguoc tu `wedding-cep/`, `symbol-cep/`, hoac `libs/shared/cep-ui`.
- Uu tien thay doi nho, co contract ro, va test bang domain lane truoc khi rely vao app lanes.
- Neu thay doi lam doi business contract cua field, date, name, venue, hoac rule packet shape, route qua `/plan` truoc.

## Public surface hien tai

- `src/index.ts` la public entrypoint duy nhat.
- Lib hien tai export cac module:
  - `calendar.js`
  - `date-logic.js`
  - `name.js`
  - `rules.js`
  - `string.js`
  - `time.js`
  - `venue.js`

## Commands

- `npm run test:domain:wedding`
- `npm --workspace @wedding/domain run lint`
- `npm --workspace @wedding/domain run test`

## Reporting

- Trong plan va close-out, ghi ro consumer nao co the bi anh huong trong `wedding-cep`.
- Neu thay doi chi la docs/routing cho package nay, noi ro khong co runtime/product impact.
