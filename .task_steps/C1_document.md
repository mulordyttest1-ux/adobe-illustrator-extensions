# BÁO CÁO C1: KHẢO SÁT LỖI MẤT GỢI Ý ĐỊA CHỈ KHI XUỐNG DÒNG (MULTILINE FUSE.JS)
**Chuẩn quy trình:** `@/communication_search` (RAG-Inspired) / Core Protocol §C1

## 1. Phân Tích Hiện Tượng (Bug Analysis)
**Sếp báo lỗi:** Gõ dòng địa chỉ dài, ép xuống dòng (Ví dụ: `buôn dliê ya a\nkndl`) thì Dropdown Suggestion tự nhiên "tắt điện", không thèm gợi ý nữa.
**Nguyên nhân gốc (Root Cause):** Căn cứ vào mã nguồn tại `AddressService.js` và `AddressAutocomplete.js`, quá trình Mất Kết Nối này là một "Vụ Án Kép" gồm 2 Hung thủ:

- **Hung Thủ 1 (Màng lọc Regex cắt nhầm):** Tại `AddressService.js` (dòng 59), đang có đoạn code:
  `const parts = val.split(/[-,\n]/);`
  Mục đích của nó là khi Sếp gõ Dấu Phẩy `,` hoặc Dấu Gạch Ngang `-`, nó sẽ cắt câu ra để lấy phần đuôi đi tìm kiếm (Ví dụ: "Nhà Trai, Quận 1" -> Chỉ lấy chữ "Quận 1" đi tìm). TUY NHIÊN, ai đó đã viết thêm ký tự `\n` (Xuống dòng) vào đây!
  Trưởng hợp Sếp gõ: `buôn dliê ya a\nkndl`. Lưới Regex này sẽ lấy dao chặt đứt câu thành 2 nửa: Mảng `["buôn dliê ya a", "kndl"]`. Sau đó, nó vác đúng chữ `kndl` bé tẹo (Last Part) ném cho Máy Tìm Kiếm. Dĩ nhiên máy tìm không ra địa chỉ nào tên là "kndl", hệ thống bèn Tắt Dropdown.

- **Hung Thủ 2 (Giới hạn thuật toán Fuse.js):** Theo kết quả tra cứu RAG Search cộng đồng lập trình: Máy quét văn bản Fuzzy Search (Fuse.js) được thế giới thiết kế để tìm kiếm dạng dòng đơn (Single Line String). Nó hoàn toàn KHÔNG tự động hiểu `\n` (Enter) là 1 Khoảng Trắng (Space). Nếu ta ném thẳng chuỗi có dấu `\n` vào lõi Fuse, nó sẽ đứt chuỗi nội bộ và chấm điểm sai lệch so với DB gốc.

## 2. Best Practice Từ Cộng Đồng (Community Resolution)
Cộng đồng Frontend (StackOverflow/Github Fuse.js) chỉ ra tiêu chuẩn (Standard) để ráp Fuse.js vào Ô Nhập Liệu Nhiều Dòng (Textarea):
**"Sanitize Query String Before Engine Processing" (Khử trùng từ khóa trước khi ném vào Lõi Tìm Kiếm)**

- Dữ liệu thật Sếp nhìn thấy trong ô Textarea vẫn phải được bảo toàn nét Xuống Dòng (Bảo toàn UI Data).
- NHƯNG Dữ liệu truyền vô Máy Quét phải được là ủi phẳng phiu. Các dấu `\n` hoặc `\r` bị cán mỏng thành 1 Dấu Cách (Khoảng trắng) bằng lệnh `replace(/[\n\r]+/g, ' ')`. 

## 3. Lời Khuyên (Alignment for Phase C3)
Việc fix lỗi này hoàn toàn không thay đổi hay bóp méo nền tảng Decoupling. Trái lại, nó củng cố cho hệ thống Autocomplete thông minh và chống đứt gãy.
**Phương án thi công:**
1. Tháo gỡ ký tự `\n` ra khỏi chiếc kềm cắt Regex ở `AddressService.js` (Chỉ dùng bộ cắt `/[-,]/`).
2. Tại Lõi lọc Data `AddressAutocomplete.js` (Hàm `search()`), ta trải phẳng từ khóa: thay thế tất cả Dấu Xuống Dòng thành Dấu Cách `normalizedQuery.replace(/[\n\r]+/g, ' ')`. 

Nếu Sếp phê chuẩn chiến dịch bắt sâu C1 này, em xin lệnh khởi thảo Plan C3 và diệt trừ nó nhanh gọn! 🚀
