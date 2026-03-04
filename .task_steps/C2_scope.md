# C2 SCORE: Tab 2 (Manual Schema Injector)
*Dựa trên Kế Hoạch `implementation_plan_tab2.md` và Báo Cáo `C1_document.md`.*

Danh sách các files sẽ bị sửa đổi để dựng tính năng chèn schema thủ công & tiêm siêu tốc tọa độ:

### 📡 1. ExtendScript / Bridge
- `wedding-cep/cep/jsx/illustrator.jsx`: Modifying `readSelectionObjects` function to include the `top` geometric coordinate.
- *Bridge Layer: Không thay đổi.*

### 🖥️ 2. Front-end Core & UI
- `wedding-cep/cep/index.html`: Thêm khu vực DOM cho `<section id="tab-schema">`.
- `wedding-cep/cep/js/app.js`: Đăng ký Tab Navigation `ds-tabs` và bind sự kiện cho module mới.

### ⚙️ 3. Javascript Modules (New)
- `wedding-cep/cep/js/components/modules/SchemaTabComponents.js`: (MỚI) Tập hợp hàm render DOM Grid hệ thống nút Tiêm Nhỏ Lẻ và Tiêm Cụm.
- `wedding-cep/cep/js/actions/ManualInjectAction.js`: (MỚI) Nhận Context tọa độ -> Xử lý Event -> Phóng Schema.

*(Bất kỳ file nào nằm ngoài danh sách này đều an toàn).*
