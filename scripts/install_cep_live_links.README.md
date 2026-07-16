# CEP Live-Link Installer

Chay tu repo da copy sang may moi:

```powershell
node scripts/install_cep_live_links.cjs
```

Hoac:

```cmd
scripts\install_cep_live_links.cmd
```

Mac dinh script tao 6 wrapper trong `%APPDATA%\Adobe\CEP\extensions`:

- `com.dinhson.imposition` - work / cung mot panel work tren Illustrator 2025 + 2026
- `com.dinhson.imposition.panel.test2026` - test / Illustrator 2026 / port `9198`
- `com.dinhson.weddingscripter` - work / cung mot panel work tren Illustrator 2025 + 2026
- `com.dinhson.weddingscripter.panel.test2026` - test / Illustrator 2026 / port `9197`
- `com.dinhson.toolkit` - work / cung mot panel work tren Illustrator 2025 + 2026
- `com.dinhson.toolkit.panel.dev` - test / Illustrator 2026 / port `9099`

Topology khong giong nhau cho ca 3 app:

- `toolkit`
  - wrapper chi giu `CSXS/manifest.xml`, `.debug` cho lane 2026, va `app`
  - `app` la **junction** tro thang vao `toolkit-cep/cep`
  - manifest dung `./app/index.html` va `./app/jsx/...`
- `imposition` va `wedding`
  - wrapper root expose truc tiep cac folder/file runtime can thiet nhu `css`, `data`, `js`, `jsx`, `debug_scripts`, `index.html`, `build.cjs`
  - manifest dung `./index.html` va `./jsx/...`
  - khong co `app` junction

Ly do la `toolkit` da duoc adapt de chay an toan qua `./app`, con `imposition` va `wedding` van resolve mot so tai nguyen tu extension root, nhat la o lane smoke/test 2026.

Script cai dat rewrite noi dung wrapper tai cho. No xoa `app`, `CSXS`, `.debug`, va cac folder/file linked ma wrapper quan ly, nhung khong xoa ca wrapper root de giam loi `EPERM` khi host dang giu handle tren thu muc extension.

Mo hinh host version duoc chot nhu sau:

- wrapper `work` la panel work duy nhat cho nguoi dung, hien o ca Illustrator 2025 va 2026, va khong mo debug gate
- wrapper `test/dev` la panel phu chi de debug/smoke test, chi hien o Illustrator 2026 va moi co `.debug`

Voi `toolkit`, dieu nay co nghia:

- `Toolkit Panel` o 2025 va `Toolkit Panel` o 2026 deu dung chung mot runtime work, live-link thang vao `toolkit-cep/cep`
- `Toolkit Panel (Dev)` chi ton tai o Illustrator 2026 de mo gate debug port `9099`
- sau `npm run build:toolkit`, ca panel work tren 2025, panel work tren 2026, va panel dev tren 2026 deu nhan cung mot bundle/runtime moi

Voi `imposition` va `wedding`, dieu nay co nghia:

- panel work va lane `test2026` van live-link ve repo
- resource root-relative nhu `data/schema.json` hoac `jsx/debug_host_validation.jsx` van resolve duoc nhu truoc khi them `toolkit`
- installer khong dong vao cac wrapper `panel.dev` cu; no chi quan ly wrapper work va `test2026`

Dry run:

```powershell
node scripts/install_cep_live_links.cjs --dry-run
```

Custom extensions root:

```powershell
node scripts/install_cep_live_links.cjs --extensions-root D:\Temp\CEPExtensions
```
