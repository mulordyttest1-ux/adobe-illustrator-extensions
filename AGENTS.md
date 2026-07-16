# AGENTS.md

Nguon huong dan chinh cho coding agents trong monorepo nay.

## Muc tieu repo

- Monorepo cho cac Adobe Illustrator CEP extensions.
- App chinh:
  - `symbol-cep/` - Imposition Panel, kien truc moi hon.
  - `wedding-cep/` - Wedding Scripter, con mot so phan legacy.
- Shared code:
  - `libs/shared/cep-ui` - UI helpers dung chung.
  - `libs/wedding/domain` - domain logic thuan, khong phu thuoc CEP/UI.
- Shared tooling:
  - `shared/` - ESLint va tooling cho monorepo.

## Mo hinh instruction

- Doc file nay truoc.
- Sau do doc `AGENTS.md` gan nhat voi module ban dang sua.
- Workflow public chi co 3 lenh:
  - `/plan` - research, scope lock, implementation plan. Khong code.
  - `/build` - implement sau khi plan da duoc duyet, hoac thay doi trivially safe.
  - `/fix` - reproduce, isolate, fix, validate bug.
- Truoc khi route vao 3 lenh tren, agent phai tu chay request normalization cho input user dang van noi.
- Chi tiet protocol dung chung nam trong `.agent/workflows/core_protocol.md`.
- `.agent/memory/` la lop reference con song cho style, architecture, va domain context; khong phai session bootstrap chinh.
- He nay hoc tu Superpowers ve process quality, nhung van giu repo-native architecture; khong copy plugin, command, hay packaging structure cua no.
- Repo khong giu archive instruction trong `.agent`; neu can tra cuu lich su thi dung git history.

## Luat bat bien

- Tat ca file `.jsx`/ExtendScript phai giu tuong thich ES3.
- `libs/wedding/domain` khong duoc import nguoc tu CEP/UI layers.
- Ton trong ranh gioi `symbol-cep` va `wedding-cep`.
- Moi thay doi trong `libs/shared` phai coi la cross-app impact va di qua `/plan` truoc.
- Thay doi D1>=2, shared, hoac cross-app phai di qua Review Gate va Verification Gate truoc khi declare xong.
- Uu tien dung command o root `package.json`.
- Khong them reference moi toi legacy slash commands hoac bootstrap files da deprecate.
- Issue encoding phai duoc xac nhan bang byte/file inspection that su; khong ket luan tu `Get-Content`, terminal render, hay copy text bi vo ma.
- Khong mass-recode product files neu `npm run check:encoding` va smoke tests khong cho thay loi that tren dia.

## Lenh chung

- `npm run lint:symbol`
- `npm run lint:wedding`
- `npm run lint:all`
- `npm run build:symbol`
- `npm run build:wedding`
- `npm run build:all`
- `npm run test:wedding`
- `npm run test:domain:wedding`
- `npm run test:smoke:symbol`
- `npm run test:smoke:wedding`
- `npm run test:smoke:all`
- `npm run test:all`
- `npm run test:e2e:symbol` - alias compatibility cho `npm run test:smoke:symbol`
- `npm run test:e2e:wedding` - alias compatibility cho `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/<c2-file>.md`
- `npm run verify`

## Workflow templates

- C1 moi nen bat dau tu `.task_steps/templates/c1_template.md`
- C2 moi nen bat dau tu `.task_steps/templates/c2_template.md`

## Scoped instructions

- `symbol-cep/AGENTS.md`
- `wedding-cep/AGENTS.md`
- `libs/wedding/domain/AGENTS.md`
- `libs/shared/AGENTS.md`

## Thu tu uu tien khi co xung dot

1. `AGENTS.md` gan nhat voi code dang sua.
2. Root `AGENTS.md`.
3. Workflow hien hanh trong `.agent/workflows/`.
4. Git history va ghi chu cu, neu ban chu dong tra cuu.

Neu hai instruction mau thuan nhau, sua tai lieu thay vi giu ca hai cung "active".
