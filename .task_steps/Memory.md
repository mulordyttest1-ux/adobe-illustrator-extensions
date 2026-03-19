# 🧠 KHO LƯU TRỮ KIẾN TRÚC & BÀI HỌC XƯƠNG MÁU (Living Documentation)
*Tài liệu lưu truyền từ Session cũ sang Session mới để bảo toàn Context cho Agent.*

## 1. Bài học về Quản Lý Sự Kiện DOM & Form Auto-fill (`e.isTrusted`)
- **Ngữ cảnh:** Dự án có tính năng Auto-fill (VD: Tự chép địa chỉ `Nhà Trai` (POS 1) sang `Địa chỉ Lễ / Tiệc`). Quá trình này dùng Javascript bắn Event Input Ảo (Ghost Event) để xúi hệ thống chạy.
- **Luật thiết kế (Architecture Rule) Cấm Kỵ Nợ Kỹ Thuật:**
  - **Tầng UI / Đồ Họa (VD: Tooltip `AddressService.js`):** BẮT BUỘC dùng cờ `if (!e.isTrusted) return;` để Chặn Đứng Event Ảo. Chỉ có "Người gõ phím thật" mới được phép gọi hàm Render UI. Nếu bỏ màng bọc này, các hàm `closeAllLists()` của Event Ảo sẽ chém sát ván List Dropdown của Thẻ đang có Focus.
  - **Tầng Data / Bộ Nhớ (VD: `CompactFormBuilder.js`):** TUYỆT ĐỐI KHÔNG CHẶN `isTrusted`. Hàm `_handleChange` Lưu Data phải hứng TRỌN MỌI EVENT để nó ghi nhận được Chữ của Form Auto-fill vào RAM. Nếu chặn, UI hiện Text nhưng ấn Build ra giấy Trắng (Desync State Error).

## 2. Kiến Trúc Pipeline (Sắp xếp độ ưu tiên Parser)
- **Ngữ cảnh:** Date Parser Pipeline có thể bị cắn nhầm lịch Âm Dương. Cụm `"Nhằm ngày 26 tháng 12 năm 2026"` nếu bị thẻ Scan Cục Bộ (`DateStandaloneParser`) quét trước thì nó sẽ cướp chữ "12" và "2026", để lại cụm Âm Lịch bị đứt đuôi nòng nọc.
- **Luật thiết kế:** Trong `SchemaInjector.js` (Mảng biến `stage1Pipeline`), KẺ TẦM NHÌN XA (như `DateHeuristicParser`) LUN LUN PHẢI CHẠY TRƯỚC các Parser vét rác / cục bộ. 

## 3. Lọc Nhiễu Fuzzy Search (Fuse.js Tokenization)
- **Ngữ cảnh:** Khách hàng ấn phím Enter nhập cụm: `"TDP \n lsl"`. Thuật toán Fuzzy Search bị chìm trong Bão Nhiễu Điểm Mù, điểm vọt lên > Threshold vứt kết quả.
- **Luật thiết kế:** Tại module gợi ý địa chỉ, phải phân mảnh Regex `val.split(/[-,\n\r]/)` và **CHỈ BẮT DÒNG CUỐI CÙNG (Last Token)** để đem đi Search. Không cho phép Fuse.js ngậm rác từ các dòng Enter phía trên.

## 4. Quản lý TextFrame ID (Stable UUID)
- **Ngữ cảnh:** Adobe Illustrator quản lý Z-Order liên tục. Lấy Index mảng làm ID cho TextFrame là mầm mống lỗi (Bug #01: "Râu ông nọ cắm cằm bà kia").
- **Luật thiết kế:** Luôn khởi tạo UUID ảo (`tf_top_left_contentHash_index`) tại `readSelectionObjects`/`scanWithMetadata` trong `illustrator.jsx`. JS xử lý xong, truyền UUID này xuống để `applyTextChanges` map qua `frameMap` thay vì index ngu ngốc.

## 5. Quy tắc Sắp Xếp Trực Quan 2D (Spatial Layout Sorting)
- **Ngữ cảnh:** Thiệp cưới được thiết kế ngang dọc lung tung. (Bug #03)
- **Luật thiết kế:** Khi làm việc với `Bridge.scanDocument` hoặc mảng selection, BẮT BUỘC dùng `LayoutUtils.sortFrames(frames)` để sắp theo trục [Y giảm dần (Top-Down), X tăng dần (Left-to-Right)] trước khi đưa vào Parser. Đảm bảo logic đọc như Mắt Người.

## 6. Kiến Trúc Ingestion Pipeline (Khử Khuẩn Dữ Liệu Raw)
- **Ngữ cảnh:** Copy text từ CTP (Mẫu In) cũ mang theo hạt `\u200B` hoặc `\u00A0` (khoảng trắng dị), khiến Business Logic (Đặc biệt là Regex) ngậm rác và gãy xương toàn bộ hệ thống.
- **Luật thiết kế:** Sanitize All Entry Points! Bắt buộc phải có một Lớp Tiền Xử Lý Đầu Vào (Nhập Lệu) chuyên dụng là `IngestionSanitizer` lột rác (anti-ghosting) ngay tại giao diện mạng (`bridge.js` Decode) trước khi chuyển lên cho các logic con. TUYỆT ĐỐI KHÔNG phân mảnh xử lý quét rác `.replace` ở những hàm lõi Business Logic.

## 7. Kiến Trúc SSOT cho Venue Address (Checkbox Autofill Pattern)
- **Ngữ cảnh:** Checkbox `ten_auto` (Tư Gia) vừa điều khiển auto-fill UI vừa overwrite địa chỉ trong build pipeline → vi phạm SSOT.
- **Luật thiết kế:**
  1. **Ô input là SSOT** — `ceremony.diachi` / `venue.diachi` là nguồn duy nhất. Không layer nào được bypass chúng.
  2. **`applyAutoVenue()` chỉ update TÊN** — TUYỆT ĐỐI KHÔNG touch `ceremony.diachi` / `venue.diachi`.
  3. **Pattern isTrusted cho địa chỉ** — `_bindAddrInputCancellation()` trong `FormLogic.js`: user gõ thật vào ô địa chỉ → tự uncheck `ten_auto` → live-sync dừng (cùng pattern `_bindManualInputCancellation` cho ô tên).
  4. **detectVenueState 2 điều kiện** — `ten_auto = true` chỉ khi (a) tên = "Tư Gia" AND (b) `ceremony.diachi === pos1.diachi`. Nếu địa chỉ khác (2 nhà) → uncheck.
