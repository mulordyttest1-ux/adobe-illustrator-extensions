---
name: Code_Style_Standard
description: Quy chuẩn viết code cho môi trường ExtendScript ES3/Adobe Illustrator - Đặt tên, Comment, Quirks
---

# Skill: Quy chuẩn Code (The Craftsman)

## 🚀 TL;DR (Quick Summary)
- **MỤC ĐÍCH:** Đảm bảo code consistency, dễ đọc, dễ maintain trong môi trường ES3
- **KHI NÀO DÙNG:** Mỗi khi viết code mới hoặc review code
- **RULE QUAN TRỌNG:**
  - Biến/hàm: `camelCase` | Hằng: `UPPER_SNAKE` | Class: `PascalCase`
  - Private: prefix `_` | Boolean: prefix `is/has/can`
  - IIFE wrapper: `(function() { ... })();`
- **❌ SAI LẦM PHỔ BIẾN:** Trailing comma, quên `var self = this` trong callback
- **LIÊN KẾT:** [ES3_ES6_Boundary](../ES3_ES6_Boundary/SKILL.md)

---

## Mục đích
Tài liệu này định nghĩa **quy chuẩn viết code** cho dự án Wedding Scripter, tối ưu cho môi trường **ExtendScript ES3** của Adobe Illustrator. Agent phải tuân thủ các quy chuẩn này khi viết code mới hoặc refactor.

---

## 1. Quy tắc Đặt tên (Naming Conventions)

### 1.1. Biến và Hàm: camelCase
```javascript
// ✅ ĐÚNG
var userName = "Nguyễn Văn A";
var totalCount = 10;
function calculateTotalPrice() { ... }
function getUserById(id) { ... }

// ❌ SAI
var user_name = "...";      // snake_case
var UserName = "...";       // PascalCase cho biến
var TOTALCOUNT = 10;        // ALL_CAPS cho biến thường
```

### 1.2. Hằng số: UPPER_SNAKE_CASE
```javascript
// ✅ ĐÚNG
var MAX_RETRY_COUNT = 3;
var DEFAULT_FONT_SIZE = 12;
var API_ENDPOINT = "https://...";

// Lưu ý: ES3 không có `const`, nên dùng `var` + convention
```

### 1.3. Class/Constructor: PascalCase
```javascript
// ✅ ĐÚNG
function CardEntity(data) { ... }
function UpdateCardUseCase(repo) { ... }
function AIDOMRepository(doc) { ... }

// ❌ SAI
function cardEntity(data) { ... }  // camelCase cho constructor
function card_entity(data) { ... } // snake_case
```

### 1.4. Module/Namespace: PascalCase
```javascript
// ✅ ĐÚNG
$.global.WeddingCore = $.global.WeddingCore || {};
$.global.HexCore = $.global.HexCore || {};
WeddingCore.Domain = WeddingCore.Domain || {};

// ❌ SAI
$.global.weddingCore = ...;  // camelCase cho namespace
```

### 1.5. Private Members: Prefix với underscore `_`
```javascript
// ✅ ĐÚNG: Đánh dấu internal/private
CardEntity.prototype._internalState = null;
CardEntity.prototype._parseRawData = function() { ... };

// Public method (không prefix)
CardEntity.prototype.getName = function() { ... };
```

### 1.6. Boolean Variables: Prefix với `is`, `has`, `can`, `should`
```javascript
// ✅ ĐÚNG
var isLoading = true;
var hasPermission = false;
var canEdit = user.role === "admin";
var shouldRender = data.length > 0;

// ❌ SAI
var loading = true;      // Không rõ là boolean
var permission = false;  // Có thể là object
```

### 1.7. Event Handlers: Prefix với `on` hoặc `handle`
```javascript
// ✅ ĐÚNG
button.onClick = function() { ... };
function handleFormSubmit(event) { ... }
function onDateChange(newDate) { ... }

// ❌ SAI
button.click = function() { ... };    // Không rõ là handler
function formSubmit(event) { ... };   // Có thể là action
```

---

## 2. Quy tắc Comment

### 2.1. File Header: JSDoc Style
```javascript
/**
 * MODULE: NameProcessor
 * Trách nhiệm: Xử lý tách và chuẩn hóa tên người Việt Nam.
 * 
 * [DOMAIN] - Thuộc lớp Domain, không phụ thuộc Infrastructure.
 */
```

### 2.2. Function Documentation: JSDoc
```javascript
/**
 * Tách tên đầy đủ thành các phần (Họ, Đệm, Tên).
 * @param {string} fullName - Tên đầy đủ, ví dụ: "Nguyễn Văn A"
 * @param {number} [splitIndex=0] - Vị trí tách (0 = auto)
 * @returns {Object} Object chứa {ho, dem, ten}
 * @example
 *   splitName("Nguyễn Văn A") // => {ho: "Nguyễn", dem: "Văn", ten: "A"}
 */
function splitName(fullName, splitIndex) { ... }
```

### 2.3. Inline Comments: Giải thích "Tại sao", không phải "Cái gì"
```javascript
// ❌ SAI: Nói cái gì đang xảy ra (hiển nhiên từ code)
var total = price * quantity; // Tính tổng

// ✅ ĐÚNG: Giải thích tại sao
// Nhân thêm 1.1 để bù phí vận chuyển ước tính (10%)
var total = price * quantity * 1.1;
```

### 2.4. TODO/FIXME/HACK Comments
```javascript
// TODO: Cần thêm validation cho trường hợp tên có ký tự đặc biệt
// FIXME: Bug khi fullName chứa nhiều khoảng trắng liên tiếp
// HACK: Workaround cho lỗi ScriptUI trên macOS Monterey
```

### 2.5. Section Separators
```javascript
// ========================================
// SECTION: PRIVATE METHODS
// ========================================

// --- Helper: Format Date ---
function formatDate() { ... }

// --- Helper: Parse Input ---
function parseInput() { ... }
```

---

## 3. ES3 Quirks & Gotchas

### 3.1. Không có `const` và `let`
```javascript
// ❌ KHÔNG HOẠT ĐỘNG trong ES3
const MAX = 10;
let counter = 0;

// ✅ Chỉ dùng `var`
var MAX = 10;        // Convention: UPPER_CASE = constant
var counter = 0;
```

### 3.2. Không có Arrow Functions
```javascript
// ❌ KHÔNG HOẠT ĐỘNG
var double = x => x * 2;
items.forEach(item => { ... });

// ✅ Dùng function expression
var double = function(x) { return x * 2; };
for (var i = 0; i < items.length; i++) { ... }
```

### 3.3. Không có Template Literals
```javascript
// ❌ KHÔNG HOẠT ĐỘNG
var msg = `Hello, ${name}!`;

// ✅ Dùng string concatenation
var msg = "Hello, " + name + "!";
```

### 3.4. Không có `Array.forEach()`, `map()`, `filter()`, `reduce()`
```javascript
// ❌ KHÔNG HOẠT ĐỘNG (trừ khi có Polyfill)
items.forEach(function(item) { ... });
var doubled = items.map(function(x) { return x * 2; });

// ✅ Dùng for loop truyền thống
for (var i = 0; i < items.length; i++) {
    var item = items[i];
    // ...
}

// Hoặc load Polyfill từ Shared/Polyfills.js
```

### 3.5. Không có `Object.keys()`, `Object.values()`
```javascript
// ❌ KHÔNG HOẠT ĐỘNG
var keys = Object.keys(myObj);

// ✅ Dùng for-in loop
var keys = [];
for (var key in myObj) {
    if (myObj.hasOwnProperty(key)) {
        keys.push(key);
    }
}
```

### 3.6. Không có `JSON.parse()` / `JSON.stringify()` (mặc định)
```javascript
// ❌ Có thể không hoạt động trên mọi phiên bản AI
var obj = JSON.parse(jsonString);

// ✅ Kiểm tra trước khi dùng, hoặc dùng Polyfill
if (typeof JSON === "undefined") {
    // Load JSON polyfill
}
```

### 3.7. `this` trong Callback bị mất context
```javascript
// ❌ SAI: `this` sẽ không trỏ đến CardEntity
CardEntity.prototype.processItems = function() {
    this.items.forEach(function(item) {
        this.handleItem(item); // ❌ `this` là undefined hoặc global
    });
};

// ✅ ĐÚNG: Lưu `this` vào biến
CardEntity.prototype.processItems = function() {
    var self = this;
    for (var i = 0; i < this.items.length; i++) {
        self.handleItem(this.items[i]); // ✅ Dùng `self`
    }
};
```

### 3.8. Trailing Comma gây lỗi IE/ES3
```javascript
// ❌ SAI: Trailing comma
var config = {
    name: "Test",
    value: 123,  // ← Dấu phẩy thừa cuối cùng
};

// ✅ ĐÚNG: Không có trailing comma
var config = {
    name: "Test",
    value: 123   // ← Không có dấu phẩy
};
```

### 3.9. Illustrator-Specific: `$.evalFile()` và `#include`
```javascript
// Cách 1: Dùng $.evalFile() (Khuyến nghị cho dynamic path)
var rootDir = new File($.fileName).parent;
$.evalFile(new File(rootDir.fsName + "/src/Utils/Helper.js"));

// Cách 2: Dùng #include (Chỉ cho static path)
#include "src/Utils/Helper.js"
```

---

## 4. Cấu trúc File Chuẩn

### 4.1. Template cho Module mới
```javascript
/**
 * MODULE: [ModuleName]
 * Trách nhiệm: [Mô tả ngắn gọn]
 * 
 * [LAYER_TAG] - Ví dụ: [DOMAIN], [INFRASTRUCTURE], [UI]
 */
(function () {
    // ========================================
    // SECTION: DEPENDENCIES / NAMESPACE
    // ========================================
    $.global.WeddingCore = $.global.WeddingCore || {};
    $.global.WeddingCore.Domain = $.global.WeddingCore.Domain || {};

    // ========================================
    // SECTION: PRIVATE HELPERS
    // ========================================
    function _helperFunction() {
        // ...
    }

    // ========================================
    // SECTION: MAIN LOGIC
    // ========================================
    var Module = {};

    Module.publicMethod = function (param) {
        // ...
    };

    // ========================================
    // SECTION: EXPORT
    // ========================================
    $.global.WeddingCore.Domain.ModuleName = Module;

})();
```

### 4.2. Template cho Constructor/Class
```javascript
/**
 * CLASS: CardEntity
 * Trách nhiệm: Đại diện cho một thiệp cưới trong Domain.
 */
(function () {
    /**
     * @constructor
     * @param {Object} data - Dữ liệu khởi tạo
     */
    function CardEntity(data) {
        this._data = data || {};
        this.name = data.name || "";
    }

    // --- Public Methods ---
    CardEntity.prototype.getName = function () {
        return this.name;
    };

    CardEntity.prototype.setName = function (newName) {
        this.name = newName;
    };

    // --- Private Methods ---
    CardEntity.prototype._validate = function () {
        // ...
    };

    // Export
    $.global.WeddingCore = $.global.WeddingCore || {};
    $.global.WeddingCore.Domain = $.global.WeddingCore.Domain || {};
    $.global.WeddingCore.Domain.CardEntity = CardEntity;

})();
```

---

## 5. Checklist Code Review

Trước khi hoàn thành code, kiểm tra:

### Naming
- [ ] Biến/hàm dùng `camelCase`?
- [ ] Hằng số dùng `UPPER_SNAKE_CASE`?
- [ ] Constructor dùng `PascalCase`?
- [ ] Boolean có prefix `is/has/can/should`?
- [ ] Private member có prefix `_`?

### Comments
- [ ] File có header mô tả Module và Layer?
- [ ] Hàm phức tạp có JSDoc?
- [ ] Comment giải thích "tại sao" chứ không phải "cái gì"?

### ES3 Compliance
- [ ] Không dùng `const`, `let`, arrow function?
- [ ] Không dùng template literal?
- [ ] Không có trailing comma?
- [ ] Dùng `var self = this` trong callback?
- [ ] Dùng for-loop thay vì forEach/map?

### Structure
- [ ] File wrapped trong IIFE `(function() { ... })();`?
- [ ] Export đúng namespace?
- [ ] Không có global variable leak?

---

## Tài liệu Tham khảo
- Adobe ExtendScript API: https://extendscript.docsforadobe.dev/
- JavaScript ES3 Specification
- Dự án hiện tại: [`Config_Schema.jsx`](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/src/Modules/WeddingPro/Config_Schema.jsx)
