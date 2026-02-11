---
description: Quét toàn bộ mã nguồn extendscript (.jsx) để phát hiện và báo cáo các cú pháp ES6 không hợp lệ (ES3 scan).
---

# Command: check-es3

Lệnh này sẽ quét đệ quy các thư mục mã nguồn ExtendScript (`cep/jsx/` và `src/`) để tìm các từ khóa ES6 bị cấm như `const`, `let`, `=>`.

## Quy trình thực hiện

1.  **Xác định phạm vi:**
    -   Thư mục mục tiêu: `cep/jsx/`, `src/Infrastructure/Illustrator/`.
    -   File mục tiêu: Tất cả các file có đuôi `.jsx`.

2.  **Thực thi quét (Scan):**
    -   Sử dụng `grep` với regex để tìm:
        -   `const ` (Space after const to avoid false positives like constant)
        -   `let `
        -   `=>` (Arrow function)
        -   Backticks (Template literals)
    
3.  **Báo cáo (Report):**
    -   Liệt kê danh sách các file vi phạm.
    -   Hiển thị số dòng và đoạn code vi phạm.
    -   Nếu không tìm thấy lỗi: Báo "✅ Codebase chuẩn ES3 Clean".
    -   Nếu tìm thấy lỗi: Báo "❌ Phát hiện vi phạm ES3" và liệt kê chi tiết.

4.  **Đề xuất sửa lỗi (Auto-suggest):**
    -   `const`, `let` -> Thay bằng `var`.
    -   `() => {}` -> Thay bằng `function() {}`.
    -   Backticks -> Thay bằng string concatenation + escape characters.

## Cách sử dụng

Gõ `/check-es3` trong khung chat. Agent sẽ tự động chạy công cụ `run_command` để thực hiện grep tìm kiếm.
