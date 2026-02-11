---
description: Hỗ trợ quy trình deploy và kiểm tra cài đặt extension CEP vào Illustrator.
---

# Command: deploy-cep

Lệnh này hỗ trợ quy trình kiểm tra môi trường và cài đặt Extension (deployment helper).

## Quy trình thực hiện

1.  **Kiểm tra Symlink (Verify Install):**
    -   Agent sẽ kiểm tra xem thư mục Extension của Adobe Illustrator có chứa Symlink trỏ đến dự án hiện tại chưa.
    -   Vị trí check thường là:
        -   **Windows:** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\` hoặc `%APPDATA%\Adobe\CEP\extensions\`
        -   Tên folder project: `com.wedding.scripter` (hoặc tên tương ứng trong `CSXS/manifest.xml`).

2.  **Xử lý kết quả:**
    -   **Trường hợp A: Chưa cài đặt (Missing Link):**
        -   Thông báo cho user: "⚠️ Extension chưa được link."
        -   Đề xuất chạy file cài đặt: `installer/setup.bat` (nếu có).
        -   Sử dụng `run_command` để chạy file setup nếu user đồng ý.

    -   **Trường hợp B: Đã cài đặt (Linked):**
        -   Thông báo: "✅ Extension đã được link đúng cách."
        -   Nhắc nhở quan trọng: "**Hãy Restart Illustrator** để áp dụng thay đổi nếu bạn vừa sửa manifest hoặc file jsx."
    
3.  **Hỗ trợ Debug (Optional):**
    -   Hỏi user có muốn bật `PlayerDebugMode` (để debug CEP) không?
    -   Command: Chỉnh sửa Registry `HKEY_CURRENT_USER/Software/Adobe/CSXS.11` (hoặc version tương ứng) key `PlayerDebugMode` = 1.

## Cách sử dụng

Gõ `/deploy-cep` trong khung chat. Agent sẽ thực hiện các bước kiểm tra trên.
