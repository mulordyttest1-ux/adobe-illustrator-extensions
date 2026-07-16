# Domain Glossary

## Core entities

| Thuật ngữ | Ý nghĩa |
|:----------|:--------|
| `pos1` | Thông tin bên nam hoặc vị trí chính mặc định |
| `pos2` | Thông tin bên nữ hoặc vị trí phụ mặc định |
| `Ông`, `Bà` | Thành phần người lớn trong gia đình hai bên |
| `Con` | Cô dâu hoặc chú rể tùy vị trí |

## Event types

| Thuật ngữ | Vai trò |
|:----------|:--------|
| `Tiệc Cưới` | Event mặc định |
| `Tân Gia` | Event thay thế |
| `Sinh Nhật` | Event thay thế |

## Ceremony types

| Thuật ngữ | Ghi chú |
|:----------|:--------|
| `Tân Hôn` | Trigger mặc định |
| `Thành Hôn` | Trigger mặc định |
| `Vu Quy` | Có thể đổi primary position |
| `Báo Hỷ` | Trigger mặc định |

Rule quan trọng: `trigger` hoặc loại lễ có thể quyết định vị trí nào là primary trong layout.

## Participant order

- nam: `Trưởng Nam`, `Thứ Nam`, `Út Nam`, `Quý Nam`, ...
- nữ: `Trưởng Nữ`, `Thứ Nữ`, `Út Nữ`, `Quý Nữ`, ...

## Location types

| Key prefix | Ý nghĩa |
|:-----------|:--------|
| `ceremony.*` | Dữ liệu nơi làm lễ |
| `venue.*` | Dữ liệu nơi làm tiệc |
| `pos1.diachi` | Địa chỉ bên nam |
| `pos2.diachi` | Địa chỉ bên nữ |

`is_tugia` thường quyết định cách hiển thị "tại tư gia".

## Date types

| Key | Vai trò |
|:----|:--------|
| `date.tiec` | Base date do user nhập |
| `date.le` | Có thể auto-fill cùng ngày |
| `date.nhap` | Có thể auto-fill lùi ngày |

Standard times thường dùng:

- lễ: `09:00`
- tiệc: `11:00`
- nháp: `17:00`
