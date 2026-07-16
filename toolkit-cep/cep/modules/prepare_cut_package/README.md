# Prepare Cut Package

`prepare_cut_package` la buoc review truoc khi save/export bo file may cat.

## Purpose

- Thu hoi toan bo cut line cua toolkit ve dung layer `CUT`.
- Dua layer `camera_marks` len tren cung, mo khoa, va hien ra de operator kiem tra.
- Khong save AI hay export PDF; sau khi review xong moi chay `save_cut_package`.

## Prompt Flow

Neu khong truyen payload, module khong hoi gi them. No chay thang tren document hien tai.

## Normalization Rules

- Layer cut chuan: `CUT`
- Layer mark be chuan: `camera_marks`
- Camera marks layer luon:
  - `visible`
  - `unlock`
  - `bring to front`
- Cut line toolkit duoc nhan dien theo note/tags/naming cua `create_cut_lines`
- Neu cut line bi keo sang layer/group khac, module se dua no ve root cua layer `CUT`

## Result Contract

- `cutLayerName`
- `cameraLayerName`
- `detectedCutItemCount`
- `movedCutItemCount`
- `cameraLayerExists`
- `cameraLayerVisible`
- `cameraLayerUnlocked`
- `cameraLayerBroughtToFront`

## Acceptance Baseline

- Cut line toolkit bi doi layer/group van duoc dua ve `CUT`
- Layer `camera_marks` tro thanh visible + unlock + top layer intent
- Document giu nguyen de operator review/chinh tay truoc khi save
