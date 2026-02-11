# Hướng Dẫn Testing: Wedding Pro Refactor

**Date:** 2026-01-19  
**Duration:** 15-20 phút  
**Mục tiêu:** Verify refactor WeddingProController hoạt động đúng

---

## 🚀 Bước 1: Chuẩn Bị (2 phút)

### 1.1 Khởi động Illustrator
```powershell
# Nếu Illustrator đang chạy, restart để load code mới
taskkill /F /IM Illustrator.exe
# Sau đó mở Illustrator bằng tay
```

### 1.2 Mở CEP Panel
1. Adobe Illustrator → **Window** → **Extensions** → **Wedding Scripter**
2. Panel xuất hiện ở bên phải

### 1.3 Mở Chrome DevTools (QUAN TRỌNG!)
1. CEP Panel → Click tab **"Cài đặt"**
2. Scroll xuống → Click **"🔧 Chẩn đoán hệ thống"**
3. **HOẶC** mở browser: `http://localhost:8088`
4. Select **"Wedding Scripter"** từ dropdown
5. Click vào tab **Console**

---

## 🧪 Bước 2: Quick Smoke Test (3 phút)

### 2.1 Check Console Errors
**Trong Chrome DevTools Console:**

✅ **GOOD - Nên thấy:**
```
[Main] Wedding Scripter CEP Panel v1.0.0
[WeddingProController] Initialized
```

❌ **BAD - KHÔNG nên thấy:**
```
WeddingProRenderer is not defined
WeddingProLogicHandler is not defined
Uncaught ReferenceError
```

**Nếu thấy lỗi** → STOP, báo ngay kết quả

### 2.2 Check UI Load
**Trong CEP Panel:**
1. Click tab **"Wedding Pro"**
2. Check xem form có hiển thị không

✅ **PASS:** Form hiện với 2 cột, các field input
❌ **FAIL:** "Đang tải..." không biến mất, hoặc blank screen

---

## 🎯 Bước 3: Core Tests (10 phút)

### Test A: Document Scan (2 phút)

**Prep:**
1. Mở hoặc tạo file `.ai` bất kỳ (có hoặc không có text frames)
2. CEP Panel → Wedding Pro tab

**Action:**
1. Click button **"SCAN"** (hoặc **"RESCAN"**)

**Expected:**
- ✅ Loading indicator xuất hiện
- ✅ Console log: `[ActionHandler] Rescan...`
- ✅ Toast message: "Đã quét lại thành công"
- ✅ Form fields populated (nếu có data) HOẶC empty (nếu file mới)

**Result:** ☐ PASS  ☐ FAIL

---

### Test B: Field Logic Automation (3 phút)

**Action:**
1. Trong form, tìm field **"POS1 - Địa chỉ"**
2. Nhập: `123 Nguyễn Văn Linh`
3. Scroll xuống, tìm checkbox **"Ceremony - Tự động tên"**
4. Check checkbox đó

**Expected:**
- ✅ Field **"Ceremony - Tên"** tự động fill = `"Tư gia nhà trai"`
- ✅ Field **"Ceremony - Địa chỉ"** tự động fill = `"123 Nguyễn Văn Linh"`
- ✅ Console log: `Field changed: ceremony.ten_auto...`

**Result:** ☐ PASS  ☐ FAIL

---

### Test C: SWAP Button (2 phút)

**Action:**
1. Fill **POS1 - Tên:** `Nguyễn Văn A`
2. Fill **POS1 - Role:** `Chú rể`
3. Fill **POS2 - Tên:** `Trần Thị B`
4. Fill **POS2 - Role:** `Cô dâu`
5. Click button **"SWAP"**

**Expected:**
- ✅ POS1 bây giờ = `Trần Thị B`, `Cô dâu`
- ✅ POS2 bây giờ = `Nguyễn Văn A`, `Chú rể`
- ✅ Toast: "Đã hoán đổi vị trí 1 và 2"

**Result:** ☐ PASS  ☐ FAIL

---

### Test D: Debug Modal (2 phút)

**Action:**
1. Click button **🐞** (Debug button)

**Expected:**
- ✅ Modal overlay xuất hiện
- ✅ JSON data hiển thị trong modal
- ✅ Button "Copy JSON" visible
- ✅ Click ngoài modal → modal đóng

**Result:** ☐ PASS  ☐ FAIL

---

### Test E: UPDATE Button (1 phút - Optional)

**⚠️ CHỈ test nếu có file .ai với TextFrames**

**Action:**
1. Fill data vào form
2. Click **"UPDATE"**

**Expected:**
- ✅ Console: ExtendScript call triggered
- ✅ Toast: "Cập nhật thành công!" (nếu có data valid)

**Result:** ☐ PASS  ☐ FAIL  ☐ SKIP

---

## 📊 Bước 4: Tổng Kết (2 phút)

### Checklist Tổng

- [ ] Test A (Scan): PASS / FAIL
- [ ] Test B (Logic): PASS / FAIL
- [ ] Test C (Swap): PASS / FAIL
- [ ] Test D (Debug): PASS / FAIL
- [ ] Test E (Update): PASS / FAIL / SKIP

**Console Errors Count:** _____

**Overall Result:**
- ✅ **ALL PASS** → Refactor SUCCESS! 🎉
- ⚠️ **1-2 FAIL** → Minor issues, có thể fix
- ❌ **3+ FAIL** → Major issues, cần rollback

---

## 🐛 Nếu Có Lỗi

**Copy thông tin sau:**
1. Screenshot Console errors (DevTools)
2. Which test failed?
3. Actual behavior vs Expected

**Paste vào đây hoặc báo Agent**

---

## ✅ Sau Khi Test Xong

**Báo kết quả cho Agent:**
```
Test Results:
- Test A: PASS/FAIL
- Test B: PASS/FAIL
- Test C: PASS/FAIL
- Test D: PASS/FAIL
- Test E: PASS/FAIL/SKIP
- Console Errors: có/không (paste if yes)
```

Agent sẽ:
- Update PROJECT_STATUS.md
- Document issues nếu có
- Plan fixes hoặc proceed to next phase

---

**Happy Testing! 🧪**
