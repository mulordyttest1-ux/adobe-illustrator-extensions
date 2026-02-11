---
description: Deployment Architecture - Symbolic Link từ CEP Extension Folder đến Google Drive
---

# Deployment Architecture

## 🔗 Symbolic Link Setup

Wedding Scripter sử dụng **symbolic link** để deploy code từ Google Drive vào CEP Extension folder của Adobe.

### Cấu trúc

```
SOURCE (Google Drive):
i:\My Drive\script ho tro adobe illustrator\

TARGET (CEP Extension):
C:\Users\<username>\AppData\Roaming\Adobe\CEP\extensions\com.dinhson.weddingscripter\
    ↑
    └── (Symbolic Link)
```

### Extension ID

```
com.dinhson.weddingscripter
```

### Lý do

Dự án được làm việc trên **nhiều máy**, nên nguồn code luôn ở **Google Drive** để sync tự động.

## 🚨 KHI NÀO CẦN BIẾT

### 1. File Editing

Khi edit file trong project, CEP sẽ load từ **symbolic link target** (AppData), nhưng file thực sự ở **source** (Google Drive).

**LUÔN edit file ở:**
```
i:\My Drive\script ho tro adobe illustrator\cep\jsx\illustrator.jsx
```

**CEP sẽ load từ:**
```
C:\Users\mulor\AppData\Roaming\Adobe\CEP\extensions\com.dinhson.weddingscripter\jsx\illustrator.jsx
```

### 2. Testing Changes

Sau khi edit file:
1. ✅ File đã được sửa ở Google Drive
2. ⏳ Symbolic link tự động sync (thường instant)
3. 🔄 **BẮT BUỘC restart Illustrator** để CEP load lại

> **QUAN TRỌNG:** CEP cache file JSX trong memory. Phải restart Illustrator hoàn toàn để thấy thay đổi!

### 3. Debugging File Load

Nếu thay đổi không có hiệu lực:

**Check symbolic link:**
```powershell
Get-Item "C:\Users\$env:USERNAME\AppData\Roaming\Adobe\CEP\extensions\com.dinhson.weddingscripter" | Select-Object LinkType, Target
```

**Expected output:**
```
LinkType      Target
--------      ------
SymbolicLink  {i:\My Drive\script ho tro adobe illustrator\cep}
```

**Verify file sync:**
```powershell
# Check if file exists in both locations
Test-Path "i:\My Drive\script ho tro adobe illustrator\cep\jsx\illustrator.jsx"
Test-Path "C:\Users\$env:USERNAME\AppData\Roaming\Adobe\CEP\extensions\com.dinhson.weddingscripter\jsx\illustrator.jsx"

# Compare file timestamps
(Get-Item "i:\My Drive\script ho tro adobe illustrator\cep\jsx\illustrator.jsx").LastWriteTime
(Get-Item "C:\Users\$env:USERNAME\AppData\Roaming\Adobe\CEP\extensions\com.dinhson.weddingscripter\jsx\illustrator.jsx").LastWriteTime
```

## 🛠️ Setup Command (Reference)

CMD setup đã chạy trước đó (trong `/workflows/setup.md` hoặc tương tự):

```powershell
# Create symbolic link
$source = "i:\My Drive\script ho tro adobe illustrator\cep"
$target = "$env:APPDATA\Adobe\CEP\extensions\com.dinhson.weddingscripter"

# Remove old if exists
if (Test-Path $target) {
    Remove-Item $target -Force -Recurse
}

# Create new symbolic link
New-Item -ItemType SymbolicLink -Path $target -Target $source
```

## ⚠️ Common Issues

### Issue: Thay đổi file không có hiệu lực

**Nguyên nhân:**
1. Chưa restart Illustrator
2. Symbolic link bị break
3. Google Drive đang sync (file lock)

**Giải pháp:**
1. Tắt HOÀN TOÀN Illustrator (check Task Manager)
2. Verify symbolic link
3. Đợi Google Drive sync xong (icon tick xanh)
4. Khởi động lại Illustrator

### Issue: CEP panel không load

**Nguyên nhân:**
- Symbolic link path sai
- Extension ID trong manifest.xml không khớp

**Giải pháp:**
```powershell
# Re-create symbolic link
$source = "i:\My Drive\script ho tro adobe illustrator\cep"
$target = "$env:APPDATA\Adobe\CEP\extensions\com.dinhson.weddingscripter"

Remove-Item $target -Force -Recurse -ErrorAction SilentlyContinue
New-Item -ItemType SymbolicLink -Path $target -Target $source -Force
```

## 📝 Best Practices

1. **ALWAYS edit ở Google Drive source** (`i:\My Drive\...`)
2. **NEVER edit trực tiếp trong AppData** (sẽ bị ghi đè khi sync)
3. **Restart Illustrator sau mỗi thay đổi JSX**
4. **Check Google Drive sync status** trước khi test
5. **Verify file timestamps** nếu nghi ngờ không sync

## 🔍 Agent Guidelines

Khi Agent cần:
- **Edit CEP files:** Luôn edit ở `i:\My Drive\script ho tro adobe illustrator\cep\`
- **Debug load issues:** Check symbolic link trước
- **Verify changes:** Remind user restart Illustrator
- **Test files:** Confirm Google Drive sync complete
