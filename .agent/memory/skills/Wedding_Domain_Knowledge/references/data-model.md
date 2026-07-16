# Data Model

## Field structure pattern

Format chung: `{prefix}.{key}`

Ví dụ: `pos1.ong`

## Prefixes chính

| Prefix | Ý nghĩa |
|:-------|:--------|
| `pos1` | Vị trí 1 |
| `pos2` | Vị trí 2 |
| `ceremony` | Dữ liệu nơi làm lễ |
| `venue` | Dữ liệu nơi làm tiệc |
| `date` | Thông tin ngày giờ |
| `info` | Thông tin chung |
| `ui` | Dữ liệu UI-specific |

## Field types

| Type | Ý nghĩa | Ghi chú |
|:-----|:--------|:--------|
| `TEXT` | Text thường | bất kỳ chuỗi hợp lệ |
| `NAME` | Tên người | thường cần `split_idx` |
| `SELECT` | Dropdown | phải khớp options |
| `DATE` | Ngày | dùng format chuẩn của form |
| `CHECKBOX` | Boolean | `true/false` |

## Derived fields

### Từ field `NAME`

- `.ten`
- `.lot`
- `.ho_dau`
- `.dau`

### Từ field `DATE`

- `.gio`, `.phut`
- `.thu`
- `.ngay`, `.thang`, `.nam`
- `.namyy`
- `.ngay_al`, `.thang_al`, `.nam_al`

## Rule of thumb

- user nên sửa base field, không sửa derived field trực tiếp nếu flow đang tự sinh
- nếu thêm field `NAME`, thường phải nghĩ luôn đến `split_idx` và derived fields
