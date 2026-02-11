---
name: ES3_ES6_Boundary
description: Quy tắc phân biệt rõ ràng khi nào dùng ES3 (ExtendScript) và khi nào dùng ES6+ (CEP Panel) - Tránh lỗi lặp
---

# Skill: Ranh giới ES3 vs ES6+ (Hybrid Architecture)

## 🚀 TL;DR (Quick Summary)
- **MỤC ĐÍCH:** Tránh SyntaxError do dùng sai JS version theo vị trí file
- **KHI NÀO DÙNG:** Mỗi khi viết code mới hoặc sửa code trong `cep/` hoặc `src/`
- **RULE QUAN TRỌNG:**
  - `cep/js/**/*.js` = **ES6+** OK (arrow, const, let, class)
  - `cep/jsx/**/*.jsx` + `src/**/*` = **ES3 ONLY** (var, function, no arrow)
- **❌ SAI LẦM PHỔ BIẾN:** Dùng arrow function trong `.jsx` file → SyntaxError
- **LIÊN KẾT:** [Code_Style_Standard](../Code_Style_Standard/SKILL.md), [CEP_Standards](../CEP_Standards/SKILL.md)

---

## 1. Nguyên tắc Vàng

> **Quy tắc #1**: Nhìn vào **đường dẫn file** để biết dùng ES nào.

| Đường dẫn | Ngôn ngữ | Môi trường |
| :--- | :--- | :--- |
| `cep/js/**/*.js` | **ES6+** (Modern JS) | Chromium (CEP Panel) |
| `cep/jsx/**/*.jsx` | **ES3** (ExtendScript) | Illustrator Host |
| `src/**/*.jsx` | **ES3** (ExtendScript) | Illustrator Host |
| `src/**/*.js` | **ES3** (Cũ - Sẽ migrate) | Illustrator Host |

---

## 2. ES6+ (Modern JS) - Chỉ dùng trong `cep/js/`

### Được phép dùng:
```javascript
// ✅ Arrow functions
const double = (x) => x * 2;

// ✅ Template literals
const msg = `Hello, ${name}!`;

// ✅ const, let
const MAX = 100;
let counter = 0;

// ✅ Array methods
items.forEach(item => console.log(item));
const doubled = items.map(x => x * 2);
const filtered = items.filter(x => x > 5);

// ✅ async/await
async function fetchData() {
    const result = await bridge.call('scanDocument');
}

// ✅ Classes
class NameProcessor {
    constructor(config) { ... }
    parse(name) { ... }
}

// ✅ Destructuring
const { first, last } = parseName(fullName);

// ✅ Spread operator
const merged = { ...defaults, ...userConfig };

// ✅ Optional chaining (CEP 11+)
const value = config?.nested?.prop;
```

---

## 3. ES3 (ExtendScript) - Dùng trong `cep/jsx/` và `src/`

### KHÔNG được dùng:
```javascript
// ❌ Arrow functions
const fn = () => {};          // SyntaxError

// ❌ Template literals
const msg = `Hello ${name}`;  // SyntaxError

// ❌ const, let
const MAX = 10;               // SyntaxError
let x = 5;                    // SyntaxError

// ❌ Array.forEach, map, filter (trừ khi có Polyfill)
items.forEach(fn);            // TypeError

// ❌ async/await
async function fn() {}        // SyntaxError

// ❌ Classes
class Foo {}                  // SyntaxError

// ❌ Destructuring
const { a, b } = obj;         // SyntaxError

// ❌ Spread operator
const arr = [...items];       // SyntaxError

// ❌ Trailing comma
var obj = { a: 1, };          // SyntaxError in some engines
```

### Phải dùng:
```javascript
// ✅ var thay cho const/let
var MAX = 10;
var counter = 0;

// ✅ function expression thay cho arrow
var double = function(x) { return x * 2; };

// ✅ String concatenation thay cho template literal
var msg = "Hello, " + name + "!";

// ✅ for loop thay cho forEach
for (var i = 0; i < items.length; i++) {
    var item = items[i];
}

// ✅ var self = this trong callback
var self = this;
items.forEach(function(item) {
    self.process(item);
});
```

---

## 4. Checklist Trước Khi Viết Code

Trước khi viết bất kỳ dòng code nào, hãy tự hỏi:

- [ ] **File này nằm ở đâu?**
  - `cep/js/` → Dùng ES6+
  - `cep/jsx/` hoặc `src/` → Dùng ES3

- [ ] **Có đang dùng Arrow Function không?**
  - Nếu đang ở ES3 context → Đổi sang `function() {}`

- [ ] **Có đang dùng const/let không?**
  - Nếu đang ở ES3 context → Đổi sang `var`

- [ ] **Có đang dùng Template Literal không?**
  - Nếu đang ở ES3 context → Đổi sang `"a" + b + "c"`

- [ ] **Có trailing comma không?**
  - Nếu đang ở ES3 context → Xóa dấu phẩy cuối

---

## 5. Ví dụ Thực tế

### Cùng một Logic, hai cách viết:

**ES6+ (cep/js/logic/NameProcessor.js):**
```javascript
class NameProcessor {
    static parse(fullName, index = 0) {
        const words = fullName.trim().split(/\s+/);
        const pos = index === 0 ? words.length - 1 : index - 1;
        return {
            first: words[0] || '',
            last: words[pos] || ''
        };
    }
}
```

**ES3 (cep/jsx/bridge.jsx):**
```javascript
function parseNameES3(fullName, index) {
    var idx = (typeof index === "undefined") ? 0 : index;
    var words = fullName.replace(/^\s+|\s+$/g, "").split(/\s+/);
    var pos = (idx === 0) ? words.length - 1 : idx - 1;
    return {
        first: words[0] || "",
        last: words[pos] || ""
    };
}
```

---

## 6. Khi Nào Cần Polyfill?

Nếu **BẮT BUỘC** phải dùng Array methods trong ES3:

```javascript
// File: cep/jsx/polyfills.jsx
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}
```

> [!CAUTION]
> Chỉ dùng Polyfill khi thực sự cần thiết. Ưu tiên viết code ES3 thuần.

---

## 7. Tài liệu Liên quan

- [Code_Style_Standard](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Code_Style_Standard/SKILL.md) - Chi tiết ES3 quirks
- [CEP_Standards](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/CEP_Standards/SKILL.md) - Kiến trúc CEP Panel
