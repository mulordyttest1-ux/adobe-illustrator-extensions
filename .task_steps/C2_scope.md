# 🔒 Báo Cáo Scope Lock: `DateGridWidget.js`

Tuân thủ đúng quy trình Bước §C2 của Runbook: Khoanh vùng rủi ro rò rỉ trước khi Refactor.

## 1. Điểm Phát Sóng (Exported Interface)
File `DateGridWidget.js` hiện tại đang "bán" ra ngoài 3 API:
1. `create(container, dateConfigs, refs)`
2. `setChangeHandler(fn)`
3. `triggerCompute()`

## 2. Các Mối Phụ Thuộc (Consumers / Consumers Context)
Điềm báo Đỏ: Có tổng cộng 4 Module đang bấu víu vào Widget này.
1. **`js/components/modules/FormComponents.js`**: Gọi hàm `.create()` và gài hàm Change Handler. Nếu ta đổi Signature hàm `create`, file này sẽ sụp.
2. **`js/actions/ScanAction.js`**: Thỉnh thoảng gọi hàm `.triggerCompute()` để ép Widget tính toán lại Âm Lịch sau khi Scan.
3. **`js/controllers/helpers/WeddingProActionHandler.js`**: Cũng gọi `.triggerCompute()` một cách lỏng lẻo thông qua Global Variable.
4. **`js/app.js`**: Export `DateGridWidget` ra `window.DateGridWidget` -> Gây ra tình trạng Global Scope Coupling.

## 3. Bản Án Rủi Ro
- Nếu nhắm mắt đập đi xây lại `DateGridWidget`, ta phải đặc biệt giữ nguyên cái vỏ bọc 3 API ở phần (1) để hệ thống cũ không bị vỡ.
- Hoặc ta phải chuyển mảng Logic Validation ra xa, nhưng bắt buộc Controller mới phải chịu trách nhiệm tính toán `triggerCompute()`.

👉 **Kết luận Scope Lock:** Code Refactor KHÔNG ĐƯỢC CHẠM vào 4 file Consumer. Chỉ được phép dỡ nội thất (ruột) của `DateGridWidget.js` chuyển sang File mới, còn phần Giao Tiếp bên ngoài vẫn phải giữ nguyên.
