# CEP Installation Guide - Wedding Scripter

> **Author:** DinhSon
> **Date:** 2026-01-17

## Cài đặt CEP Panel

### Bước 1: Enable Debug Mode (Chỉ cần làm 1 lần)

Để Adobe cho phép load extension không có chữ ký:

**Windows:**
```powershell
# Mở PowerShell với quyền Admin và chạy:
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

**macOS:**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

> **Lưu ý:** Thay `11` bằng version phù hợp (CSXS.9, CSXS.10, CSXS.11) tùy phiên bản Adobe.

### Bước 2: Link Extension vào Adobe

**Option A: Symlink (Khuyên dùng)**

```powershell
# Windows PowerShell (Admin)
$source = "G:\My Drive\script ho tro adobe illustrator\cep"
$target = "$env:APPDATA\Adobe\CEP\extensions\com.dinhson.weddingscripter"

# Tạo thư mục CEP nếu chưa có
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Adobe\CEP\extensions"

# Tạo symlink
New-Item -ItemType SymbolicLink -Path $target -Target $source
```

**Option B: Copy thủ công**

Copy toàn bộ thư mục `cep/` vào:
```
C:\Users\<username>\AppData\Roaming\Adobe\CEP\extensions\com.dinhson.weddingscripter\
```

### Bước 3: Khởi động lại Illustrator

1. Đóng hoàn toàn Adobe Illustrator
2. Mở lại Illustrator
3. Vào menu: **Window → Extensions → Wedding Scripter**

### Bước 4: Debug (Tùy chọn)

Để debug CEP panel:

1. Mở Chrome browser
2. Vào URL: `http://localhost:8088`
3. Click vào extension để mở DevTools

---

## Cấu trúc thư mục

```
cep/
├── CSXS/
│   └── manifest.xml          ← Extension config
├── css/
│   └── main.css              ← DinhSon Light Theme
├── js/
│   ├── CSInterface.js        ← Adobe bridge library
│   ├── bridge.js             ← JS ↔ ExtendScript wrapper
│   ├── main.js               ← Entry point
│   ├── components/
│   │   ├── TabbedPanel.js    ← Tab navigation
│   │   └── FormBuilder.js    ← Schema-driven forms
│   └── controllers/
│       ├── WeddingProController.js
│       └── ImpositionController.js
├── jsx/
│   └── bridge.jsx            ← ExtendScript endpoint
├── index.html                ← Main panel HTML
└── .debug                    ← Debug config
```

---

## Troubleshooting

### Panel không xuất hiện trong menu Extensions

1. Kiểm tra đã enable PlayerDebugMode chưa
2. Kiểm tra symlink/copy đúng đường dẫn
3. Khởi động lại Illustrator

### Lỗi "EvalScript error"

1. Mở DevTools (localhost:8088)
2. Check Console tab cho lỗi
3. Kiểm tra path trong `bridge.jsx` đúng không

### Form không load Schema

1. Đảm bảo có file AI đang mở
2. Kiểm tra `Config_Schema.jsx` tồn tại
3. Check ExtendScript Toolkit log
