# C2 Mức Độ Ảnh Hưởng (Scope Lock): Postflight Hook

## 1. Mục Tiêu của Pha C2
Khoanh vùng tất cả các component có nguy cơ "chết chùm" nếu chúng ta lắp ráp sai Module Postflight (như việc nhúng thêm Rule vẽ Pasteboard Legend).

## 2. Các File Can Thiệp và "Người Dùng Tiêu Thụ" (Consumers)

### 🔴 File Sửa Đổi: `symbol-cep/cep/jsx/bridge.jsx`
- **Mục tiêu:** Thêm endpoint `Bridge.drawPasteboardLegend(base64Str)`.
- **Rủi Ro:** Thấp. Đây là một file Global Proxy.
- **Consumer của `bridge.jsx`:** Hầu hết quy trình UI. Tuy nhiên do chỉ thêm Hàm độc lập mới nguyên `drawPasteboardLegend` nên KHÔNG ảnh hưởng (Zero footprint) đến các hàm cũ như lưới/rác.

### 🔴 File Sửa Đổi: `symbol-cep/cep/js/features/imposition/action_tab.js`
- **Mục tiêu:** Ngay sau lệnh chạy Lõi (`await this._runImpositionEngineAsync()`), ta chèn lệnh kích hoạt Rule `await this.postflightOrchestrator.runAll(...)`.
- **Rủi Ro:** Trung Bình. Lớp này quản lý UI State (Loading/Done/Error).
- **Scope Lock (Cách chống vỡ):** Do `action_tab.js` chứa Try/Catch Global của UI, `PostflightOrchestrator` bắt buộc thiết kế dạng Try/Catch độc lập. Nếu Postflight lỗi (ví dụ text dài bị lỗi font), Lõi Imposition (thành phẩm 1000 con tem đắt tiền) vẫn phải được giữ nguyên, không được ném Exception lôi cả cục Thành Phẩm đi chết chung.

### 🔴 File Sửa Đổi: `symbol-cep/cep/js/app.js`
- **Mục tiêu:** Nhét instance và constructor chứa `PostflightOrchestrator` xuống nhánh Setup/Init.
- **Rủi Ro:** Rất Thấp. Chỉ là Factory lắp ráp Inject Dependency ở Bootstrap.

### 🟢 File Sinh Mới: 
1. `postflight/PostflightOrchestrator.js`
2. `postflight/rules/PasteboardInfoRule.js`
- Độc lập hoàn toàn, thừa kế Interface Chain of Responsibility có sẵn.

## 3. Chốt Triển Khai (Go/No-Go)
- **Ranh Giới Decoupling (An toàn tuyệt đối):** The execution of Core Engine and UI Loading is completely isolated from the specific implementation details of the rules.
- **Đề nghị:** Chuyển sang §C3 (Duyệt Kế Hoạch Contract đã có ở `implementation_plan.md`).
