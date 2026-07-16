# Cut Lines

`create_cut_lines` la module host-side cho ho line cat.

## Purpose

- Tao line cat theo 2 strategy o v1:
  - `Contour`
  - `S-Line`
- Giu mot command duy nhat trong toolkit de sau nay co the them `Stack Cut` vao cung ho feature nay.

## Prompt Flow

Neu khong truyen payload:

1. Chon strategy:
   - `1 = Contour`
   - `2 = S-Line`
2. `Contour`
   - lay line cat tu path/clipping path thuc cua selection hien tai
   - khong con mode rectangle quanh selection
3. `S-Line`
   - nhap `cols x rows`, vi du `10x10`
   - nhap `extend mm`, mac dinh `3`
   - script lay `selection bounds` lam khung ngoai roi ve 2 duong snake de xe selection do thanh grid

## Fixed Production Profile

- Layer: `CUT`
- Spot: `CutContour`
- Stroke width: `0.25pt`
- Path name: `CutContour`
- Layer duoc de mo sau khi script ve xong

## Ownership And Separation Contract

Moi lan chay la append-only:

- khong xoa line cat cu
- tao mot top-level group moi:
  - `CUTLINES_<STRATEGY>_<NNN>`
- tao mot strategy subgroup ben trong:
  - `CUTLINES_CONTOUR`
  - `CUTLINES_SLINE`

Metadata nhan dien duoc ghi bang:

- layer
- spot
- group/path names
- tags
- note

Keys metadata:

- `toolkit.module=create_cut_lines`
- `toolkit.family=cut_lines`
- `toolkit.strategy=contour|sline`
- `toolkit.layer=CUT`
- `toolkit.spot=CutContour`
- `toolkit.run=<run id>`

Ghi chu:

- `note` giu canonical keys nhu tren, vi no on dinh de doc lai.
- `tags` mirror cung metadata bang Illustrator-safe names, vi mot so ky tu nhu `.` khong on dinh tren tag name:
  - `toolkit_module`
  - `toolkit_family`
  - `toolkit_strategy`
  - `toolkit_layer`
  - `toolkit_spot`
  - `toolkit_run`

## Acceptance Baseline

- `Contour` copy duoc path/clipping path hop le vao layer `CUT`
- `Contour` skip item khong support va tra `skippedCount`
- `S-Line` bam theo `selection bounds`, khong bam artboard center
- chay lai nhieu lan khong xoa line cu
- moi lan chay tao mot run group moi co metadata day du
- invalid grid fail sach va khong ve gi

## Future Note

- `Stack Cut` thuoc cung ho feature nay nhung chua nam trong v1.
