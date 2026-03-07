# 🔒 Báo Cáo Scope Lock: `app.js` & `showToast` God Function

Tuân thủ đúng quy trình Bước §C2 của Runbook: Khoanh vùng rủi ro rò rỉ của **Báo Động Vàng** - Sự ôm đồm của `app.js`.

## 1. Điểm Khởi Phát Căn Bệnh (The Origin)
File `app.js` (và cả người anh em sinh đôi `main.js`) đang nhồi nhét 3 hàm xử lý Giao Diện rành rành ngay tại Entry Point (Điểm bắt đầu dự án):
- `hideLoading()`
- `showError()`
- `showToast()`

Sau đó, nó gán `window.showToast = showToast` làm hỏng Global Scope. Rút cực, nó còn dùng chiêu trò "Prop Drilling" (truyền tham số qua từng tầng) để ném cái hàm `showToast` này mồi cho hàng loạt lệnh Action.

## 2. Các Mối Phụ Thuộc (Consumers in Danger)
Khi ta gỡ bỏ hàm `showToast` khỏi tham số của `app.js`, ta sẽ làm gãy các file sau (vì chúng đang chờ ngửa tay nhận hàm Toast):
1. **`js/actions/ScanAction.js`**
2. **`js/actions/UpdateAction.js`**
3. **`js/actions/SwapAction.js`**
4. **`js/actions/InjectSchemaAction.js`**
5. **`js/actions/ManualInjectAction.js`**
6. Các file Builder như `CompactFormBuilder.js` thi thoảng gọi `typeof showToast === 'function'`.

Nguy hiểm chéo: File `js/controllers/helpers/UIFeedback.js` sinh ra để điều khiển UI (Toast, Alert, Error), lại đang NẰM BỤI không được gọi đúng thiết kế, để mặc `app.js` giẫm chân lên vai trò của nó.

## 3. Bản Án Rủi Ro
- Nếu nhắm mắt xóa hàm Toast trong `app.js`, 5 file Actions kể trên sẽ báo lỗi "showToast is undefined" khi Sếp bấm nút.
- Ta buộc phải giải phẫu đồng loạt: 
  1) Xóa hàm rác ở `app.js`.
  2) Tháo tham số Toast khỏi 5 vị trí gọi action.
  3) Chèn 1 kênh giao tiếp tập trung (như EventBus hoặc import trực tiếp `UIFeedback`) ở trong bụng các file Action đó.
