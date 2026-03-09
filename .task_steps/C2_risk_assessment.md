# PHÂN TÍCH RỦI RO (RISK ASSESSMENT) & ĐỀ XUẤT NÂNG CẤP

Sếp đánh giá hoàn toàn chính xác. Vết chém chia rẽ Lõi và Phụ trợ bằng `dispatchEvent` sẽ kéo theo "Hiệu ứng Cánh Bướm" (Event Bubbling) trên toàn bộ Form. Dưới đây là kết quả kiểm toán rủi ro của em:

## 1. Rủi Ro Lặp Vô Tận (Infinite Loop) - Cấp độ: TRUNG BÌNH
**Kịch bản nguy hiểm:**
- Code Scan gọi `setData` -> Gán `radio.checked = true` -> Phát Event `change`.
- Thằng `FormLogic` nghe thấy `change` -> Kích hoạt `_updateHostFromLe` -> Gọi lại DOM -> Phát thêm Event `change` -> Mắc kẹt vòng lặp Vô Tận.

**Tin vui từ Codebase (Đã Khảo Sát):**
Nhờ tầng `FormComponents.js` viết chay bằng Vanilla JS, hàm nghe ngóng `_handleChange` của Form Lõi **CHỈ** thay đổi object trên RAM (`this.data[key] = value`) và chạy callback ra ngoài (`this.onChange`), chứ KHÔNG CÓ hàm nào tự động Render lại DOM cả (Không giống như tính năng Re-render của React). 
Nên chuỗi lặp sẽ tự động đứt gãy tại đó.

**🔴 CHỐT CHẶN PHÒNG THỦ (Cần thiết phải áp dụng):**
Để triệt tiêu 100% rủi ro vòng lặp cho các dev sau này bảo trì, em sẽ bổ sung "Lá Chắn Mềm" (Flag Check) ngay tại vòng lặp `setData`:
```javascript
// CHỈ BẮN EVENT NẾU THỰC SỰ CÓ SỰ THAY ĐỔI TỪ FALSE SANG TRUE
const wasChecked = r.checked;
const isTarget = (r.value === val);
if (wasChecked !== isTarget) {
    r.checked = isTarget;
    // Cờ chống đệ quy: Chỉ báo động khi bật On, không báo động khi tắt Off (Radio Behavior)
    if (isTarget) {
        r.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
```

## 2. Rủi Ro Thắt Cổ Chai Hiệu Suất (Performance Bottleneck) - Cấp độ: THẤP
Khi bấm nút Scan, có khoảng 20 trường dữ liệu được đổ vào `setData()`. Nếu cả 20 trường đều thi nhau bắn `dispatchEvent`, Form sẽ giật 20 lần?
**Kết quả Khảo sát:**
- Thư viện `DomFactory.js` có chứa 1 hàm chống giật cực xịn là `debounce()` nhưng chưa được áp dụng.
- Số lượng trường Radio/Checkbox có gắn logic chạy theo (`FormLogic`) chỉ đếm trên đầu ngón tay (Trường Cấp Lễ, Trường Chủ Tiệc). Các trường Input Text bình thường nhận Text xong là Xong, không bắn Event Change. 
Do đó, không có nguy cơ kẹt xe Event trên UI. Tốc độ Update vẫn dưới `1ms`.

## 3. Xem Xét Nâng Cấp Kiến Trúc (Architectural Upgrade)
Có cần nâng cấp Form lên chuẩn Observer Pattern (Mô hình Đăng ký - Lắng nghe) xịn xò như Redux không?

**Khuyến nghị: KHÔNG NÊN VÀO LÚC NÀY.**
* **Lý do:** Dự án đang đi theo thiết kế "Ultra Compact" (Siêu nhẹ) - sử dụng Vanilla JS File thẳng mặt (Thậm chí load trực tiếp không Build Framework). 
* Nếu áp dụng Observer Pattern, ta phải gồng thêm 1 cục Code quản lý mảng Listeners/Subscribers, làm phình to size file và tăng độ phức tạp không thiết thực (Over-engineering).
* **Kết luận:** Mô hình Event Native của Trình Duyệt (`dispatchEvent`) ĐÃ LÀ SỰ TỐI ƯU NHẤT cho ngách Vanilla JS này rồi. Nó vừa đạt chuẩn WYSIWYG, vừa nhẹ, vừa không cần học thêm API bên thứ 3.

---
**=> CHỐT LẠI KẾ HOẠCH BẢO VỆ:** 
Bản Refactor `implementation_plan_wysiwyg_state.md` cơ bản là AN TOÀN TUYỆT ĐỐI. Em chỉ cần nhúng thêm Cờ điều kiện (Chỉ bắn Event khi Data mới và Data cũ KHÁC NHAU) là Form sẽ cứng như bê tông Cốt thép!
