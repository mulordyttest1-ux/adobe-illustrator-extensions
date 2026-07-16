# C1 Research: Portable Configuration for Adobe CEP

## Vấn đề (The Problem)
Hiện tại Symbol CEP đang lưu trữ cấu hình (`presets`) vào `localStorage`.  
`localStorage` của CEP thực chất là một cơ sở dữ liệu SQLite nằm sâu trong Profile của trình duyệt (Chromium) mà Adobe quản lý. Nó **không thể di chuyển** một cách đơn giản sang máy tính khác vì nó gắn liền với User Profile và ID của máy.

## Giải pháp Best Practice (Community Standard)
Để cấu hình có thể "mang đi được" (portable), chúng ta cần chuyển sang cơ chế **File-based Storage**.

1. **Vị trí lưu trữ:** Sử dụng thư mục Home của User (Ví dụ: `~/Documents/SymbolCEP/presets.json` hoặc `%APPDATA%/SymbolCEP/presets.json`). Điều này cho phép người dùng copy tệp này sang máy khác hoặc đồng bộ qua Cloud (Dropbox/OneDrive).
2. **Công nghệ:**
    - Sử dụng `window.cep.fs` (Node.js file system API được CEP phơi ra) để đọc/ghi trực tiếp tệp JSON.
    - Duy trì `localStorage` dưới dạng một lớp đệm (Cache) hoặc bỏ hẳn để dùng file làm Source of Truth duy nhất.

## Đối chiếu Ngữ cảnh (Alignment)
- `libs/wedding` có thể đã có tiền lệ về việc dùng file hệ thống.
- Trong `symbol-cep`, tệp `data_store.js` là nơi duy nhất quản lý việc lưu trữ, nên việc refactor sẽ rất khu trú và an toàn.

-> **Kết luận:** Sẽ chuyển `DataStore` từ `localStorage` sang dùng `window.cep.fs` ghi tệp vào thư mục `Documents`. Tên tệp dự kiến: `symbol_cep_presets.json`.
