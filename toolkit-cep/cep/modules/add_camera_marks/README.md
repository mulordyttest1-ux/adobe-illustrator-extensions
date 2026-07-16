# Camera Marks

`add_camera_marks` la module host-side da duoc dong goi thanh mot feature island rieng.

## Purpose

- Ve camera marks cho `Line`, `Round`, `Both`, hoac `Smart Line`.
- Ho tro mot artboard, nhieu artboard, hoac tat ca artboard trong cung mot lan chay.
- Toan bo output duoc ghi de vao layer `camera_marks`, sau do khoa lai.

## Prompt Flow

Neu khong truyen payload, module giu nguyen flow nay:

1. Chon mode:
   - `1 = Smart Line`
   - `2 = Line`
   - `3 = Round`
   - `4 = Both`
2. Chon target artboard:
   - `0` = tat ca
   - `2` = mot artboard
   - `1,3,5` = danh sach
   - `1-3` = range
3. Chi mode manual moi hoi offset:
   - `Line`: `X = 7`, `Y = 7`
   - `Round`: `X = 7`, `Y = 30`
   - `Both`: hoi du ca line va round
4. `Smart Line` khong hoi offset. No dung `selection size + 10mm`, neu khong nho hon frame mac dinh `7 x 7` thi fallback ve `7 x 7`.

## Payload Contract

- `markProfile`
- `targetMode`
- `artboardIndex`
- `artboardIndexes`
- `artboardInput`
- `lineOffsetXMm`
- `lineOffsetYMm`
- `roundOffsetXMm`
- `roundOffsetYMm`

## Result Contract

- `targetMode`
- `targetLabel`
- `targetArtboardIndexes`
- `targetRectSource`
- `layerName`
- `layerLocked`
- `overwroteExistingLayer`
- `mode`
- `line.*`
- `round.*`

Smoke va panel-side logic dang dua vao shape nay, nen khong duoc doi neu khong co re-plan.

## Layer And Group Rules

- Dedicated layer: `camera_marks`
- Line group per artboard: `LMarkLine{n}`
- Round group per artboard: `MarkLine{n}`
- Mark path name: `MKLINE`
- Moi lan chay se clear layer cu, ve lai output moi, roi lock layer.

## Acceptance Baseline

Smoke dang khoa cac case nay:

- Manual `Both` tren nhieu artboard
- `Smart Line` tren nhieu artboard tu cung mot selection size
- Layer `camera_marks` bi overwrite roi lock lai
- `Smart Line` khong ve round marks
- Invalid target payload tra `CAMERA_MARKS_INVALID_TARGET` va khong tao layer moi

## Freeze Policy

Module nay da o trang thai `bugfix/spec correction only`.

- Khong them capability moi vao `Camera Marks`
- Neu can behavior moi, uu tien tao module moi
- Neu buoc phai mo rong module nay, phai re-plan truoc
