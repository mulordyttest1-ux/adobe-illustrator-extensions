# Data Flow

## 1. Form -> packet -> domain enrichment

1. user nhập dữ liệu ở CEP panel
2. UI harvest raw values
3. domain logic enrich packet:
   - split name
   - auto prefix
   - date derivation
   - validation
4. packet enriched được gửi cho adapter

## 2. Packet -> Illustrator update

1. CEP-side gửi enriched packet sang adapter hoặc bridge
2. host-side tìm TextFrame theo key hoặc naming convention
3. adapter cập nhật contents
4. Illustrator redraw và trả kết quả

## 3. Illustrator -> reverse sync

1. user bấm scan
2. adapter đọc raw frame data
3. hệ thống lọc theo schema và sync mode
4. reconstruct base values nếu có thể
5. form được populate lại

## Những điểm hay gây bug

- key frame không khớp schema
- scan nhầm field không được phép reverse sync
- packet đã enrich nhưng adapter vẫn kỳ vọng raw field
- text trong file dùng format template khó parse ngược
