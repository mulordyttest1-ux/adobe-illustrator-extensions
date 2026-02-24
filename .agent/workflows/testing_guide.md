# CEP Testing Guide (Agent Instruction)

> **Mục tiêu:** Hướng dẫn AI Agent và Developer cách test Extension trực tiếp trên Adobe Illustrator (Live Environment).
> **Phạm vi:** Áp dụng cho cả `wedding-cep` và `symbol-cep`.

---

## 1. Prerequisites (Một lần duy nhất)

Để chạy được Extension chưa ký (Unsigned) và debug qua Chrome DevTools:

### 1.1 Enable PlayerDebugMode (Registry Hack)
- Mở PowerShell (Admin):
```powershell
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value 1 -Type String
```
*(Lưu ý: CSXS.11 cho AI 2021+, CSXS.10 cho cũ hơn)*

### 1.2 Tạo Symlink
- Extension phải nằm trong `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions`.
- Sử dụng script `.agent/create_symlink.ps1` để tạo link từ `C:\Projects\adobe-illustrator-extensions\wedding-cep` vào đó.

### 1.3 Cài đặt Dependencies cho Test
- Tại root monorepo:
```bash
npm install chrome-remote-interface --no-save
```
*(Thư viện này dùng để Node.js giao tiếp với CEP qua cổng 8097)*

---

## 2. Quy trình Test (Loop)

### Bước 1: Build Bundle (BẮT BUỘC)
Sau khi sửa code `js/`, phải build lại `bundle.js`. Nếu không, Illustrator vẫn chạy code cũ.
```bash
npm run build:wedding
# hoặc
npm run build:all
```

### Bước 2: Reload Panel (Trên Illustrator)
- Cách 1: Đóng/Mở lại Panel.
- Cách 2: Bấm nút "Reload Panel" trên giao diện (nếu đã implement).
- Cách 3: Dùng script reload (nếu có CDP connection):
  `node wedding-cep/cep/debug_scripts/test_input_reload.js`

### Bước 3: Chạy Test Script
Kiểm tra logic ngay trên môi trường thật (đã reload):

```bash
# Test Input Engine (Validation)
node wedding-cep/cep/debug_scripts/test_input_reload.js

# Test E2E (nếu có)
npm run test:e2e
```

---

## 3. Debugging (Chrome DevTools)

CEP Extension bản chất là một trình duyệt Chrome nhúng.

1. Mở Illustrator → Mở Extension.
2. Mở trình duyệt Chrome/Edge, truy cập: `http://localhost:8097`
3. Chọn "Wedding Scripter".
4. Bạn sẽ thấy Console, Network tab như làm web bình thường.

---

## 4. Troubleshooting

| Lỗi | Nguyên nhân | Cách fix |
|:----|:------------|:---------|
| **Code không thay đổi** | Quên build hoặc quên reload | Chạy `npm run build:wedding` rồi Reload Panel. |
| **Connection Refused** | Panel chưa bật hoặc sai port | Mở Extension lên. Check file `.debug` xem port đúng là 8097 không. |
| **`npm` lỗi policy** | PowerShell chặn script | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| **`require` is not defined** | Dùng cú pháp Node trong CEP | Code CEP chạy trên trình duyệt (ES5/ES6), không có Node runtime. Chỉ dùng `import/export`. |

---

## 5. Agent Protocol (Dành cho AI)

Khi xử lý Testing, Agent PHẢI tuân thủ Mô hình **NÃO AI + TAY GỖ CDP (Hybrid Agentic Testing)**:

### 5.1. Khi User báo Bug (Quy trình Trị Lỗi Tái Phát - Bug Regression)
1. **Phân tích (Não):** Không được vội vã đi sửa file code ngay. Hãy phân tích "Kịch Bản Sinh Lỗi" và ghi ra file nháp.
2. **Dệt Lệnh (Tay):** Viết mã lệnh CDP (Chrome DevTools Protocol) để giả lập click chuột/nhập chữ sao cho lặp lại đúng cái Lỗi đó, thả vào file `wedding-cep/cep/debug_scripts/test_smoke.cjs`.
3. **Thực thi Test:** Gọi `test_smoke.cjs` để xác nhận nó báo FAILED Đỏ (Chứng minh bộ test đã tóm được Lỗi).
4. **Fix Bug:** Tiến hành sửa code JS của dự án để gỡ lỗi.
5. **Xác nhận:** Chạy lại `test_smoke.cjs` báo PASSED Xanh lè. 👉 Xóa sổ Bug vĩnh viễn! Báo cáo thành tích với Sếp.

### 5.2. Khi Xây Dựng Tính Năng Mới (Tự Động Mở Rộng Test)
1. Trong quá trình Sếp yêu cầu Feature mới (Phase 6), Agent phải ĐỘNG NÃO nặn ra 3-5 kịch bản người dùng thao tác sai (Edge Cases) phá hoại form.
2. Embed tự động các bài test chống phá hoại này bằng mã CDP (nhấp chuột, gõ dữ liệu) vào `test_smoke.cjs` để bảo vệ tính năng sếp vừa tạo.

### 5.3. Nhắc nhở Cốt Lõi
- **Đừng đoán mò.** Cứ Build xong là Khởi chạy CDP test để mắt thấy tai nghe.
- **Luôn nhớ Build.** Làm xong phải `run_command("npm run build:wedding")`.
- **Luôn nhớ Reload.** Chạy script `clear_cache.js` trước khi test.
