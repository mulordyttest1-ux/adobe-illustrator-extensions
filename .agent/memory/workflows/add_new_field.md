---
description: Quy trình chuẩn để thêm một trường dữ liệu mới vào form Wedding Pro
---

# Workflow: Thêm Trường Dữ liệu Mới

> **Khi nào dùng:** Khi cần thêm một field mới vào form nhập liệu thiệp cưới (ví dụ: thêm trường "Số điện thoại", "Email", v.v.)

---

## Bước 0: Chuẩn bị Context

1. Đọc file [`Project_Context/SKILL.md`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Project_Context/SKILL.md) để nắm cấu trúc dự án.
2. Xác định trường mới thuộc nhóm nào trong Schema:
   - Thông tin cố định → `THÔNG TIN CỐ ĐỊNH`
   - Thông tin gia đình → `VỊ TRÍ 1` hoặc `VỊ TRÍ 2`
   - Địa điểm → `NƠI LÀM LỄ` hoặc `ĐỊA ĐIỂM TIỆC`
   - Thời gian → `THỜI GIAN`

---

## Bước 1: Khai báo trong Schema

**File:** [`Config_Schema.jsx`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/src/Modules/WeddingPro/Config_Schema.jsx)

```javascript
// Tìm mảng STRUCTURE, thêm item vào group phù hợp
var STRUCTURE = [
    {
        group: "VỊ TRÍ 1 (POS 1)", prefix: "pos1", items: [
            // ... existing items ...
            
            // ✅ THÊM TRƯỜNG MỚI Ở ĐÂY
            { 
                key: "phone",           // Key duy nhất
                label: "Số ĐT",         // Nhãn hiển thị
                type: TYPE.TEXT,        // Loại: TEXT, NAME, SELECT, DATE, CHECKBOX
                sync_mode: SYNC_MODE.ISOLATED  // Cho phép đọc ngược từ file
            }
        ]
    }
];
```

**Lưu ý:**
- `key` phải unique trong toàn bộ Schema.
- Nếu có `prefix` trong group, key đầy đủ sẽ là `prefix.key` (ví dụ: `pos1.phone`).
- Chọn `sync_mode`:
  - `ISOLATED`: Trường độc lập, có thể đọc ngược từ file AI.
  - `NONE`: Không đọc ngược (dùng cho template phức tạp).

// turbo
## Bước 2: Kiểm tra UI tự động render

**Không cần sửa file nào nếu trường đơn giản!**

`LayoutBuilder.jsx` sẽ tự động render dựa trên `type`:
- `TYPE.TEXT` → EditText đơn giản
- `TYPE.NAME` → EditText + Index selector
- `TYPE.SELECT` → RadioButtons
- `TYPE.CHECKBOX` → Checkbox
- `TYPE.DATE` → DateWidget phức hợp

**Kiểm tra:** Chạy script, xem trường mới có hiển thị đúng không.

---

## Bước 3: (Tùy chọn) Custom UI Component

**Chỉ cần nếu:** Trường cần giao diện đặc biệt không có sẵn.

**File:** [`ComponentFactory.jsx`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/src/Modules/WeddingPro/WeddingCore/UI/ComponentFactory.jsx)

```javascript
// Thêm hàm factory mới
Factory.createPhoneInput = function(parent, label, value) {
    var g = parent.add("group");
    g.orientation = "row";
    
    var lbl = g.add("statictext", undefined, label + ":");
    lbl.preferredSize.width = 50;
    
    var txt = g.add("edittext", [0,0,150,25], value || "");
    // Thêm validation nếu cần
    
    return { group: g, txt: txt };
};
```

**File:** [`LayoutBuilder.jsx`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/src/Modules/WeddingPro/WeddingCore/UI/LayoutBuilder.jsx)

```javascript
// Trong vòng lặp render, thêm case mới
else if (item.type === "phone") { // Custom type
    var ctrls = Factory.createPhoneInput(pnl, item.label, val);
    uiRefs[fullKey] = { type: 'text', control: ctrls.txt };
}
```

---

## Bước 4: (Tùy chọn) Xử lý nghiệp vụ đặc biệt

**Chỉ cần nếu:** Trường có logic xử lý phức tạp (validate, transform, derive).

**File:** Tùy thuộc logic:
- Validate format → `Domain/` (tạo Validator mới)
- Transform data → `Domain/` hoặc `Utils/`
- Derive từ trường khác → `WeddingPacketOrchestrator.jsx`

---

## Bước 5: Kiểm tra đọc/ghi từ file AI

**File:** [`AIReader.jsx`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/src/Modules/WeddingPro/WeddingCore/Adapters/AIReader.jsx)

Nếu trường cần đọc từ TextFrame trong file AI:
1. Tìm hàm `scan()`.
2. Thêm logic map từ TextFrame name/content sang key trong packet.

```javascript
// Ví dụ: Đọc TextFrame có tên "pos1.phone"
if (tf.name === "pos1.phone") {
    packet["pos1.phone"] = tf.contents;
}
```

---

## Bước 6: Test End-to-End

1. **Mở file AI mẫu** có TextFrame cho trường mới (nếu cần).
2. **Chạy script** → Kiểm tra trường hiển thị đúng trong UI.
3. **Nhập dữ liệu** → Click UPDATE.
4. **Kiểm tra file AI** → Dữ liệu được ghi đúng vào TextFrame.

---

## Checklist Hoàn thành

- [ ] Trường đã khai báo trong `Config_Schema.jsx`
- [ ] UI hiển thị đúng (tự động hoặc custom)
- [ ] Dữ liệu được harvest đúng khi click UPDATE
- [ ] (Nếu cần) Logic nghiệp vụ đã implement
- [ ] (Nếu cần) Đọc/ghi từ file AI hoạt động
- [ ] Test end-to-end thành công

---

## Rollback (Nếu có lỗi)

1. Xóa item vừa thêm trong `STRUCTURE` của `Config_Schema.jsx`.
2. Xóa code custom trong `ComponentFactory.jsx` và `LayoutBuilder.jsx` (nếu có).
3. Chạy lại script để đảm bảo không còn lỗi.
