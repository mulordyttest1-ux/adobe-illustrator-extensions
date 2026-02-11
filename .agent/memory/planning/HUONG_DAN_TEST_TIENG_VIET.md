# Hướng Dẫn Test Wedding Pro (Sau Refactor)

**Ngày:** 2026-01-19  
**Thời gian:** 10-15 phút  
**Mục đích:** Kiểm tra xem code sau khi refactor còn chạy đúng không

---

## 🎯 Bạn Cần Làm Gì?

### Bước 1: Mở Illustrator và Panel (2 phút)

1. **Mở Adobe Illustrator** (nếu đang chạy thì restart lại)
2. Trong Illustrator: **Window** → **Extensions** → **Wedding Scripter**
3. Panel sẽ hiện ra bên phải màn hình

### Bước 2: Kiểm Tra Console (1 phút)

**Mở Chrome DevTools:**
- Cách 1: Vào tab "Cài đặt" → Click "🔧 Chẩn đoán hệ thống"
- Cách 2: Mở browser `http://localhost:8088` (đã mở sẵn rồi)

**Xem Console:**
- Trong DevTools, click tab **"Console"**
- Xem có lỗi màu đỏ không

✅ **TỐT** - Thấy dòng này:
```
[WeddingProController] Initialized
```

❌ **LỖI** - Thấy chữ màu đỏ, ví dụ:
```
WeddingProRenderer is not defined
```

**→ Báo cho tôi:** "Console có lỗi" hoặc "Console OK"

---

### Bước 3: Test Cơ Bản (5 phút)

#### Test A: Xem UI có hiển thị đúng không?

1. Click tab **"Wedding Pro"** trong panel
2. Xem form có hiện ra không

✅ **PASS:** Thấy form với nhiều ô nhập liệu  
❌ **FAIL:** Màn hình trắng hoặc loading mãi

**→ Báo cho tôi:** "UI hiện đúng" hoặc "UI lỗi"

---

#### Test B: Nút SCAN có chạy không?

1. Click nút **"SCAN"** (hoặc "RESCAN")
2. Xem có thông báo gì không

✅ **PASS:** Thấy toast "Đã quét lại thành công"  
❌ **FAIL:** Không có gì xảy ra, hoặc báo lỗi

**→ Báo cho tôi:** "Scan OK" hoặc "Scan lỗi"

---

#### Test C: Logic tự động có hoạt động không?

1. Tìm ô nhập **"POS1 - Địa chỉ"**
2. Gõ vào: `123 Nguyễn Văn Linh`
3. Kéo xuống, tìm checkbox **"Ceremony - Tự động tên"**
4. Tick vào checkbox đó
5. Xem ô **"Ceremony - Tên"** và **"Ceremony - Địa chỉ"** có tự động điền không

✅ **PASS:** Ô tự động điền "Tư gia nhà trai" và địa chỉ  
❌ **FAIL:** Không có gì xảy ra

**→ Báo cho tôi:** "Logic OK" hoặc "Logic lỗi"

---

#### Test D: Nút SWAP có hoạt động không?

1. Ô **"POS1 - Tên"** gõ: `Nguyễn Văn A`
2. Ô **"POS2 - Tên"** gõ: `Trần Thị B`
3. Click nút **"SWAP"**
4. Xem 2 tên có đổi chỗ cho nhau không

✅ **PASS:** POS1 bây giờ là "Trần Thị B", POS2 là "Nguyễn Văn A"  
❌ **FAIL:** Không đổi

**→ Báo cho tôi:** "Swap OK" hoặc "Swap lỗi"

---

#### Test E: Nút Debug (🐞) có hoạt động không?

1. Click nút **🐞** (icon con bọ)
2. Xem có popup hiện ra không

✅ **PASS:** Popup hiện ra với JSON data  
❌ **FAIL:** Không có gì xảy ra

**→ Báo cho tôi:** "Debug OK" hoặc "Debug lỗi"

---

## 📝 Cách Báo Cáo Kết Quả Cho Tôi

**Cách đơn giản nhất - Copy/paste mẫu này:**

```
Kết quả test:
- Console: OK / Có lỗi
- UI: Hiện đúng / Lỗi
- Scan: OK / Lỗi
- Logic: OK / Lỗi
- Swap: OK / Lỗi
- Debug: OK / Lỗi
```

**Nếu có lỗi màu đỏ trong Console:**
- Copy dòng lỗi đó
- Paste cho tôi

**Ví dụ báo cáo:**
```
Kết quả test:
- Console: OK
- UI: Hiện đúng
- Scan: OK
- Logic: OK
- Swap: OK
- Debug: OK

Tất cả đều PASS!
```

**Hoặc:**
```
Kết quả test:
- Console: Có lỗi - "WeddingProRenderer is not defined"
- UI: Lỗi - màn hình trắng
- (không test tiếp được)
```

---

## ❓ Câu Hỏi Thường Gặp

**Q: Tôi không thấy tab "Wedding Pro"?**  
A: Check lại panel có mở đúng không (Window → Extensions → Wedding Scripter)

**Q: Console ở đâu?**  
A: Trong DevTools (localhost:8088), tab "Console" ở trên cùng

**Q: Tôi phải test hết 5 cái không?**  
A: Không nhất thiết. Test được bao nhiêu báo bấy nhiêu. Nếu Console lỗi ngay từ đầu, báo luôn không cần test tiếp.

**Q: Báo cáo ở đâu?**  
A: Reply lại chat này, paste kết quả theo mẫu ở trên.

---

**Chúc bạn test thuận lợi! Có gì không hiểu cứ hỏi tôi.** ✌️
