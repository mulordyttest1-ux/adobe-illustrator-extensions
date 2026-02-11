# Hướng dẫn Cài đặt - Wedding Scripter CEP Panel

Để thuận tiện cho việc cài đặt trên máy mới, bộ cài đặt tự động đã được tạo tại thư mục `installer/`.

## Cách sử dụng

1. Vào thư mục `installer/` trong project.
2. Chuột phải vào file `setup.bat` -> chọn **Run as administrator**.
3. Chọn chế độ cài đặt:

### Mode 1: Developer Mode (Khuyên dùng cho máy chính)
- **Cơ chế:** Tạo Symlink (Shortcut) từ thư mục `cep/` của project sang thư mục Extensions của Adobe.
- **Ưu điểm:** Bất kỳ thay đổi nào trong code sẽ cập nhật ngay lập tức vào Extension mà không cần copy lại.
- **Yêu cầu:** Thư mục project (Google Drive) phải luôn tồn tại ở vị trí cũ.

### Mode 2: Deployment Mode (Cho máy in/máy nhân viên)
- **Cơ chế:** Copy toàn bộ thư mục `cep/` sang thư mục Extensions của Adobe.
- **Ưu điểm:** Hoạt động độc lập, có thể xóa hoặc di chuyển thư mục project gốc sau khi cài.
- **Nhược điểm:** Cần chạy lại setup nếu có cập nhật code mới.

---

## Cấu hình thủ công (Nếu setup tự động lỗi)

Nếu script không chạy được, bạn có thể làm thủ công như sau:

1. **Registry:**
   Chạy lệnh PowerShell (Admin) để bật chế độ debug (cho phép load unsigned extension):
   ```powershell
   reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
   ```

2. **Copy File:**
   Copy thư mục `cep/` vào đường dẫn:
   ```
   %APPDATA%\Adobe\CEP\extensions\com.dinhson.weddingscripter
   ```

---

## Troubleshooting

- **Lỗi "Access Denied":** Đảm bảo bạn đã chọn **Run as administrator**.
- **Lỗi "Execution Policy":** Script đã có flag `-ExecutionPolicy Bypass` nhưng nếu vẫn bị chặn, hãy mở PowerShell Admin và chạy `Set-ExecutionPolicy RemoteSigned`.
- **Extension không hiện:** Khởi động lại Illustrator. Kiểm tra xem thư mục `com.dinhson.weddingscripter` có tồn tại trong `%APPDATA%\Adobe\CEP\extensions` chưa.
