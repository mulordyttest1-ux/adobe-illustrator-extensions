# Scenarios And Pitfalls

## Common scenarios

### 1. Thêm participant mới

1. thêm field vào schema
2. xác định type và sync mode
3. nếu là `NAME`, nghĩ luôn đến `split_idx` và derived fields
4. kiểm tra UI render và update path

### 2. Đổi ngày tiệc

1. user sửa `date.tiec`
2. các mốc liên quan có thể auto-fill lại
3. verify derived fields và output sang Illustrator

### 3. Reverse sync từ file

1. scan raw TextFrames
2. lọc theo sync mode
3. map key về schema
4. populate form

## Common pitfalls

### 1. TextFrame naming không khớp

Schema key và tên frame lệch nhau sẽ làm update hoặc scan thất bại im lặng.

### 2. Sync mode bị chọn sai

Field template hoặc field có formatting phức tạp không nên reverse sync như field isolated đơn giản.

### 3. Thiếu `split_idx`

Field `NAME` không có `split_idx` thường parse không đúng hoặc không ổn định.

### 4. User sửa derived field

Nếu base field vẫn là source of truth, derived field có thể bị overwrite ở lần enrich tiếp theo.

### 5. Assumption sai về font

Unicode là baseline an toàn hơn. Nếu file thực dùng VNI, output có thể sai dù flow logic đúng.
