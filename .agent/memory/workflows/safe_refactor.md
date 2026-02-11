---
description: Quy trình refactor an toàn trong môi trường ExtendScript ES3
---

# Workflow: Refactor An Toàn

> **Khi nào dùng:** Khi cần sửa đổi cấu trúc code lớn như đổi tên module, di chuyển file, tách/gộp functions mà không làm gãy hệ thống.

---

## ⚠️ Lưu ý quan trọng

ExtendScript ES3 **KHÔNG CÓ** test framework tích hợp và debug khó khăn. Do đó:
- Refactor phải thận trọng, từng bước nhỏ.
- Luôn có plan rollback.
- Không refactor nhiều thứ cùng lúc.

---

## Bước 0: Chuẩn bị Context

1. Đọc [`Project_Context/SKILL.md`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Project_Context/SKILL.md)
2. Đọc [`Hexagonal_Rules/SKILL.md`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Hexagonal_Rules/SKILL.md)
3. Đọc [`Coding_Principles/SKILL.md`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Coding_Principles/SKILL.md)

---

## Bước 1: Phân tích Impact

### 1.1. Xác định phạm vi thay đổi

```
Câu hỏi cần trả lời:
□ File nào sẽ bị ảnh hưởng?
□ Module nào phụ thuộc vào file này?
□ File này được load ở đâu trong Run_App.js?
□ Có namespace global nào bị thay đổi không?
```

### 1.2. Tìm tất cả references

Tìm kiếm trong toàn bộ project:
- Tên hàm/class sắp đổi
- Namespace đang export
- Đường dẫn file nếu đổi tên/di chuyển

```javascript
// Ví dụ: Nếu đổi tên NameProcessor → NameService
// Tìm tất cả:
// - "NameProcessor" (tên class)
// - "WeddingCore.Domain.NameProcessor" (namespace)
// - load("...NameProcessor.jsx") (đường dẫn)
```

---

## Bước 2: Backup State Hiện tại

### 2.1. Lưu ý các file sẽ sửa

```
Files to modify:
- [ ] src/Modules/WeddingPro/WeddingCore/Domain/NameProcessor.jsx
- [ ] src/Modules/WeddingPro/WeddingCore/index.jsx
- [ ] (list all affected files)
```

### 2.2. Ghi nhớ state hoạt động

Trước khi sửa, chạy script để đảm bảo:
- [ ] Script khởi động thành công
- [ ] UI hiển thị đúng
- [ ] Các function chính hoạt động

---

## Bước 3: Thực hiện Refactor (Từng bước nhỏ)

### Pattern 1: Đổi tên Function/Class

```javascript
// Bước 1: THÊM alias mới, GIỮ tên cũ
function oldName() { ... }
var newName = oldName; // Alias

// Bước 2: Đổi tất cả caller sang tên mới
// (Search & Replace toàn project)

// Bước 3: XÓA alias sau khi xác nhận OK
// function oldName() { ... } // Xóa dòng này
```

### Pattern 2: Di chuyển File

```javascript
// Bước 1: COPY file sang vị trí mới (chưa xóa cũ)

// Bước 2: Cập nhật đường dẫn trong Run_App.js hoặc index.jsx
load("src/NewPath/Module.jsx"); // Đường dẫn mới

// Bước 3: Test xem load đúng không

// Bước 4: XÓA file cũ sau khi xác nhận OK

// Bước 5: Cập nhật tất cả #include hoặc evalFile references
```

### Pattern 3: Tách Function lớn

```javascript
// Bước 1: Copy code ra function mới (KHÔNG xóa code cũ)
function _newHelper() {
    // Code được tách ra
}

// Bước 2: Gọi function mới từ function cũ
function originalFunction() {
    // ... code trước ...
    var result = _newHelper(); // Gọi helper mới
    // ... code sau giữ nguyên ...
}

// Bước 3: Test kỹ

// Bước 4: Dọn dẹp code thừa trong originalFunction
```

### Pattern 4: Gộp Functions

```javascript
// Bước 1: Tạo function mới chứa logic gộp
function mergedFunction(param, mode) {
    if (mode === "A") {
        // Logic từ funcA
    } else {
        // Logic từ funcB
    }
}

// Bước 2: Đổi caller của funcA và funcB sang mergedFunction

// Bước 3: GIỮ funcA, funcB như alias tạm thời
function funcA(param) { return mergedFunction(param, "A"); }
function funcB(param) { return mergedFunction(param, "B"); }

// Bước 4: Test kỹ

// Bước 5: Xóa aliases sau khi ổn định
```

---

## Bước 4: Cập nhật Dependencies

### 4.1. Cập nhật Export

```javascript
// File: index.jsx hoặc file chứa namespace export
$.global.WeddingCore.Domain.NewName = NewName; // Thêm mới
// $.global.WeddingCore.Domain.OldName = OldName; // Comment hoặc xóa cũ
```

### 4.2. Cập nhật Load Order

```javascript
// File: Run_App.js hoặc module index
load("src/NewPath/NewName.jsx"); // Đường dẫn mới
// load("src/OldPath/OldName.jsx"); // Xóa hoặc comment
```

---

## Bước 5: Test từng Layer

### 5.1. Test Infrastructure Layer
```
□ Script khởi động không lỗi
□ Các file được load đúng thứ tự
□ Không có "undefined is not a function"
```

### 5.2. Test Domain Layer
```
□ Business logic hoạt động đúng
□ Data transformation đúng
```

### 5.3. Test UI Layer
```
□ UI hiển thị đúng
□ Buttons hoạt động
□ Data flow từ UI → Domain → Infrastructure OK
```

---

## Bước 6: Dọn dẹp (Cleanup)

Sau khi xác nhận mọi thứ hoạt động:

1. **Xóa aliases tạm thời** đã tạo ở Bước 3
2. **Xóa files cũ** nếu đã di chuyển
3. **Xóa comments "TODO: Remove after refactor"**
4. **Cập nhật documentation** nếu có

---

## Checklist An toàn

### Trước khi bắt đầu
- [ ] Đã đọc Project_Context
- [ ] Đã xác định tất cả files bị ảnh hưởng
- [ ] Script hiện tại đang hoạt động tốt

### Trong khi refactor
- [ ] Thay đổi từng bước nhỏ
- [ ] Tạo alias trước khi xóa
- [ ] Test sau mỗi thay đổi lớn

### Sau khi hoàn thành
- [ ] Script khởi động OK
- [ ] UI hiển thị OK
- [ ] Tất cả functions hoạt động
- [ ] Đã dọn dẹp code tạm

---

## Rollback Plan

Nếu có lỗi không thể fix:

1. **Revert file changes** - Khôi phục nội dung file từ version trước
2. **Kiểm tra namespace** - Đảm bảo các global export đúng
3. **Kiểm tra load order** - Run_App.js load đúng thứ tự
4. **Chạy lại từ đầu** - Tắt/mở Illustrator để reset engine

---

## Common Pitfalls (Bẫy thường gặp)

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| "undefined is not a function" | File chưa được load | Kiểm tra Run_App.js load order |
| "Cannot read property of undefined" | Namespace chưa khởi tạo | Thêm `$.global.NS = $.global.NS \|\| {}` |
| Script chạy nhưng UI trống | Module không export đúng | Kiểm tra `$.global.ModuleName = ...` |
| Lỗi chỉ xảy ra lần thứ 2 | Engine giữ state cũ | Thêm `#targetengine` hoặc restart AI |
