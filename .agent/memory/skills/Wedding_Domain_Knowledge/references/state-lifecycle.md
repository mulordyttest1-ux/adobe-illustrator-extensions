# State Lifecycle

## Chu trình điển hình

1. panel mở ở trạng thái sạch
2. user nhập liệu
3. validation chạy
4. domain logic enrich dữ liệu
5. adapter gửi update sang Illustrator
6. panel hoặc file đạt trạng thái synced
7. user có thể save hoặc scan lại

## Nhóm state con trong pha processing

- name parsing
- auto prefix generation
- date calculation
- validation

Nếu debug flow, hãy xác định bug đang nằm ở state nào thay vì nhìn toàn tuyến một lúc.
