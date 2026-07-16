# Save Cut Package

`save_cut_package` la module cuoi cho workflow may cat.

## Purpose

- Save/sync file nguon AI dang review/chinh sua.
- Xuat mot file AI co prefix `BAI_BE_` cho gia cong be.
- Xuat mot file PDF co prefix `BAI_IN_` cho in an.
- Khong normalize layer nua; hay chay `prepare_cut_package` truoc neu can dua cut line va camera marks ve trang thai review chuan.

## Prompt Flow

Neu khong truyen payload:

1. Neu document da co duong dan luu `.ai`, module dung file do lam file nguon.
2. Neu document chua duoc luu, module se mo `Save Working Cut Source AI` dialog mot lan de luu file nguon.
3. Module xuat them:
   - `BAI_BE_<ten-file-nguon>.ai`
   - `BAI_IN_<ten-file-nguon>.pdf`

## Payload Contract

- `sourceAiPath`
- `aiOutputPath`
- `pdfOutputPath`

Neu co payload path:

- `sourceAiPath` = file nguon AI de sync document hien tai
- `aiOutputPath` = file AI bai be
- `pdfOutputPath` = file PDF bai in

## Export Rules

- File nguon AI duoc save truoc de dong vai tro nguon xuat
- AI bai be giu vector cho:
  - `CUT`
  - `camera_marks`
- Moi layer in con lai duoc rasterize 300 ppi trong AI bai be
- PDF bai in se an cac layer `CUT` va `camera_marks`
- Sau khi xuat xong, active document van tro lai file dang mo

## Result Contract

- `sourceAiPath`
- `aiPath`
- `pdfPath`
- `dieAiPrefix`
- `printPdfPrefix`
- `rasterizedLayerCount`
- `rasterItemCount`
- `hiddenProtectedLayerCount`

## Acceptance Baseline

- Module sync file nguon AI, xuat duoc AI bai be va PDF bai in
- AI bai be raster phan in 300 ppi nhung van giu `CUT` va `camera_marks` dang vector
- Sau khi xuat PDF, active document van tro lai file AI
