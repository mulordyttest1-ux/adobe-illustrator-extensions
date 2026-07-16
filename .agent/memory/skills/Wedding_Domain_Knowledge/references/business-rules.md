# Business Rules

## 1. Name parsing

Khi field có type `NAME`, hệ thống có thể tách full name thành các phần dựa trên `{key}_split_idx`.

Flow cơ bản:

1. user nhập full name
2. user hoặc logic chọn `split_idx`
3. hệ thống sinh `.ten`, `.lot`, `.ho_dau`, `.dau`

## 2. Ethnic minority handling

Đây là nhóm rule quan trọng và dễ bỏ sót.

- có thể detect prefix như `H'`, `Y'`, `K'`
- có thể gợi ý `split_idx` khác mặc định
- title case cần giữ được uppercase có chủ đích
- validation cần nới cho một số trường hợp tên dân tộc hoặc ký tự đặc biệt

## 3. Auto prefix generation

Khi cả `ông` và `bà` có dữ liệu, hệ thống có thể sinh prefix tổng hợp như:

- có cả hai -> `Ông Bà:`
- chỉ có ông -> `Ông:`
- chỉ có bà -> `Bà:`
- không có cả hai -> rỗng

## 4. Date auto-fill

`date.tiec` thường là base date.

Auto rules phổ biến:

- `date.le` = cùng ngày
- `date.nhap` = lùi một ngày

User vẫn có thể override nếu flow cho phép.

## 5. Sync mode

Sync mode quyết định field nào có thể reverse sync từ file Illustrator về form.

- `ISOLATED` -> có thể scan ngược
- `NONE` -> không scan ngược

Các field template phức tạp thường không nên reverse sync thô.

## 6. Trigger field

Loại lễ, đặc biệt như `Vu Quy`, có thể quyết định primary position:

- mặc định: `pos1`
- trường hợp đặc biệt: `pos2`

## 7. Deep rules nên nhớ

- font Unicode là assumption an toàn hơn VNI
- thiếu key khi update thường nên xử lý kiểu best effort, tránh popup spam
- adapter thường normalize case khi match TextFrame name
- đừng để user chỉnh derived field rồi mong hệ thống giữ nguyên nếu base field còn đang là source of truth
