# C2 Scope Lock: Pasteboard Metadata & Template Logic

## Tệptin chịu ảnh hưởng (Impacted Files)
1. **`symbol-cep/cep/jsx/bridge.jsx`**: Endpoint nhận String từ CEP để vẽ TextFrame lên Pasteboard.
2. **`symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`**: Rule trung gian, nhận `info_template` từ Config, thay thế biến (Supplant logic) rồi gọi Bridge.
3. **`symbol-cep/cep/js/features/imposition/action_tab.js`**: Nơi Trigger gọi Orchestrator sau khi áp đặt xong.

## Đối Tượng Tiêu Thụ (Consumers)
- `PostflightOrchestrator`: Thằng này quản lý sinh quyển của các Rules, nó sẽ gọi `PasteboardInfoRule` ở bước cuối.
- `Bridge (JSX)`: Chịu trách nhiệm trực tiếp nói chuyện với Illustrator Document.

## Rủi Ro & Khoanh Vùng (Risk Mitigation)
- **Injection:** Để chống việc nhúng JS độc qua chuỗi cấu hình, chỉ sử dụng Regex `String.prototype.replace(/{([^{}]*)}/g)` thay vì `eval()`.
- **In Lộn Xộn:** Chữ ở ngoài Pasteboard để người vận hành đọc. Để tránh bị chọn nhầm và dễ xóa hàng loạt, ta tạo **GroupItem** mang tên `Symbol_Meta_Info` trên Layer hiện hành, và gán `locked = true`. Không tạo Layer mới để tránh gây loạn cho luồng công việc của người dùng.

-> **Scope Lock: AN TOÀN**. Không đụng đến hệ thống Core Imposition Engine.
