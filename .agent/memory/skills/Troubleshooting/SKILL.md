---
name: Troubleshooting
description: FAQ và Common Issues khi làm việc với dự án Wedding Scripter trong môi trường ExtendScript/Illustrator
---

# Skill: Troubleshooting Guide (The Doctor)

> **MỤC ĐÍCH:** Quick reference khi gặp lỗi. Tìm theo triệu chứng, áp dụng giải pháp.

---

## 🔥 Top 5 Lỗi Thường Gặp Nhất

### 1. "undefined is not a function"

**Triệu chứng:**
```
Error: undefined is not a function
    at [script path]
```

**Nguyên nhân phổ biến:**
| Nguyên nhân | Cách kiểm tra | Cách fix |
|-------------|---------------|----------|
| File chưa được load | Check `Run_App.js` load order | Thêm `load("path/to/file.jsx")` |
| Namespace chưa khởi tạo | Check `$.global.Namespace` | Thêm `$.global.NS = $.global.NS \|\| {}` |
| Hàm gọi trước khi define | Check thứ tự code | Di chuyển function definition lên trước |
| Typo trong tên hàm | Check spelling | Sửa tên đúng |

**Quick Fix:**
```javascript
// Đảm bảo namespace tồn tại
$.global.WeddingCore = $.global.WeddingCore || {};
$.global.WeddingCore.Domain = $.global.WeddingCore.Domain || {};
```

---

### 2. Script chạy nhưng UI không hiện

**Triệu chứng:**
- Không có lỗi trong console
- Không có window/dialog xuất hiện

**Nguyên nhân phổ biến:**
| Nguyên nhân | Cách kiểm tra | Cách fix |
|-------------|---------------|----------|
| `app.documents.length === 0` | Mở file AI trước | Mở file AI rồi chạy lại |
| Window tạo nhưng không show | Check `win.show()` | Đảm bảo gọi `win.show()` |
| Window show nhưng nằm ngoài màn hình | Check `win.center()` | Gọi `win.center()` trước `show()` |
| Exception silent fail | Wrap trong try-catch | Thêm try-catch với alert |

**Quick Fix:**
```javascript
try {
    if (!app.documents.length) {
        alert("Vui long mo file AI truoc!");
        return;
    }
    var win = new Window("palette", "Test");
    win.add("statictext", undefined, "Hello");
    win.center();
    win.show();
} catch (e) {
    alert("Error: " + e.message + "\nLine: " + e.line);
}
```

---

### 3. Lỗi chỉ xảy ra lần chạy thứ 2+

**Triệu chứng:**
- Lần đầu chạy OK
- Lần 2+ bị lỗi hoặc behavior khác

**Nguyên nhân:**
Engine giữ state từ lần chạy trước (persistent engine với `#targetengine`).

**Giải pháp:**
| Option | Cách làm |
|--------|----------|
| Reset engine | Restart Illustrator |
| Clear globals | Thêm cleanup ở đầu script |
| Unique engine name | Đổi `#targetengine "name_v2"` |

**Quick Fix:**
```javascript
// Đầu file - Clear old state
if ($.global.HexCore && $.global.HexCore.currentWindow) {
    try { $.global.HexCore.currentWindow.close(); } catch(e) {}
}
$.global.HexCore = {}; // Reset
```

---

### 4. BridgeTalk không nhận được response

**Triệu chứng:**
- Click button → không có gì xảy ra
- Không có alert/feedback

**Checklist debug:**
```
□ #targetengine name match giữa sender và receiver?
□ BridgeTalk target đúng? ("illustrator", "illustrator-1", etc.)
□ Script receiver có đang chạy?
□ Có error trong onError callback không?
```

**Quick Fix:**
```javascript
// Sender
var bt = new BridgeTalk();
bt.target = "illustrator";
bt.body = 'alert("Test from BT")';
bt.onError = function(e) { 
    alert("BT Error: " + e.body); 
};
bt.onResult = function(r) { 
    alert("BT Result: " + r.body); 
};
bt.send();
```

---

### 5. TextFrame không tìm thấy

**Triệu chứng:**
- Script tìm TextFrame theo name nhưng trả về null/undefined
- Data không được read/write

**Nguyên nhân phổ biến:**
| Nguyên nhân | Cách kiểm tra | Cách fix |
|-------------|---------------|----------|
| Name sai | Check trong Layers panel AI | Sửa tên đúng trong script |
| TextFrame trong group/layer khác | Check parent structure | Dùng recursive search |
| TextFrame bị lock/hidden | Check trong AI | Unlock/unhide |
| Unicode trong name | Check encoding | Dùng exact Unicode string |

**Quick Fix - Recursive search:**
```javascript
function findTextFrameByName(container, name) {
    for (var i = 0; i < container.textFrames.length; i++) {
        if (container.textFrames[i].name === name) {
            return container.textFrames[i];
        }
    }
    // Search in groups
    for (var j = 0; j < container.groupItems.length; j++) {
        var found = findTextFrameByName(container.groupItems[j], name);
        if (found) return found;
    }
    return null;
}

var tf = findTextFrameByName(app.activeDocument, "pos1.ten");
```

---

## 📋 Quick Diagnosis Checklist

Khi gặp lỗi, chạy qua checklist này:

```
1. SYNTAX ERROR?
   □ Trailing comma trong object/array?
   □ Dùng const/let/arrow function? (ES3 không support)
   □ Template literal `${}`? (ES3 không support)

2. RUNTIME ERROR?
   □ File được load đúng thứ tự?
   □ Namespace khởi tạo đầy đủ?
   □ Document đang mở?

3. LOGIC ERROR?
   □ Console.log (dùng $.writeln) để trace
   □ Check giá trị biến tại breakpoint
   □ Simplify code để isolate vấn đề

4. UI ERROR?
   □ Window show() được gọi?
   □ UI elements có bounds đúng?
   □ Parent container orientation đúng?
```

---

## 🛠️ Debug Techniques trong ES3

### Technique 1: Alert Debugging
```javascript
function debugFunction(data) {
    alert("DEBUG: Entering debugFunction");
    alert("DEBUG: data = " + (data ? JSON.stringify(data) : "null"));
    
    // ... code ...
    
    alert("DEBUG: result = " + result);
    return result;
}
```

### Technique 2: $.writeln để Console
```javascript
$.writeln("=== DEBUG START ===");
$.writeln("Variable x: " + x);
$.writeln("Type of x: " + typeof x);
$.writeln("=== DEBUG END ===");
// Xem output trong ExtendScript Toolkit Console
```

### Technique 3: Try-Catch với Line Number
```javascript
try {
    // Risky code
} catch (e) {
    alert(
        "Error: " + e.message + 
        "\nFile: " + e.fileName +
        "\nLine: " + e.line +
        "\nStack: " + (e.stack || "N/A")
    );
}
```

### Technique 4: Conditional Breakpoint
```javascript
// Chỉ dừng khi điều kiện đúng
if (someVar === "problemValue") {
    $.bp(); // Breakpoint (chỉ hoạt động trong ESTK)
}
```

---

## 🔗 Links nhanh

### Error Types
- [MDN JavaScript Errors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors)
- [Adobe Scripting Guide](https://extendscript.docsforadobe.dev/)

### Project Files liên quan
- [Run_App.js](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/Run_App.js) - Entry point, load order
- [Config.js](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/Config.js) - Configuration
- [Code_Style_Standard](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Code_Style_Standard/SKILL.md) - ES3 quirks

---

## 🎓 Kinh Nghiệm Đúc Kết (Lessons Learned)

> **MỤC ĐÍCH:** Track lỗi đã gặp, solution, để agent tự học và tránh lỗi lặp

### 📊 INDEX - Lessons Learned Catalog

| ID | Title | Date | Frequency | Severity | Status |
|:---|:------|:-----|:----------|:---------|:-------|
| 001 | Palette Window Document Access | 2026-01-16 | High (5x) | Critical | Active |
| 002 | ES6 Syntax in JSX Files | 2026-01-15 | Very High (10x+) | High | Active |
| 003 | Namespace Initialization Order | 2026-01-15 | Medium (3x) | Medium | Active |
| 004 | Load Order Dependencies | 2026-01-15 | Medium (3x) | Medium | Active |
| 005 | JSON Stringify in ES3 | 2026-01-17 | Low (2x) | Low | Active |
| 006 | CEP URI Path Issue | 2026-01-25 | High (5x) | Critical | Active |
| 007 | JSON Decode Failed (BOM) | 2026-01-25 | Medium (3x) | High | Active |

**How to use this index:**
- Khi gặp error → Search bằng keyword trong titles
- Đọc lesson tương ứng ở dưới
- Nếu không tìm thấy → Create lesson mới + Update index

**Frequency Guide:**
- Very High: >10 lần
- High: 5-10 lần
- Medium: 2-4 lần
- Low: 1-2 lần

---

### Lesson 001: Palette Window KHÔNG thể truy cập app.activeDocument trực tiếp

**Ngày phát hiện:** 2026-01-16  
**Frequency:** High (5x)  
**Severity:** Critical

**Bối cảnh:**
Khi phát triển tính năng SAVE trong cửa sổ palette (TabbedShell), gặp lỗi `"there is no document"` mặc dù file AI đang mở.

**Triệu chứng:**
- Click button trong palette window
- Truy cập `app.activeDocument` → Lỗi "there is no document"
- Lưu reference `var doc = app.activeDocument` khi UI khởi tạo → Reference trở nên stale

**Nguyên nhân gốc:**
ScriptUI palette windows chạy trong execution context khác với main Illustrator engine. Các references đến Document object không còn valid khi dùng trong event callbacks (onClick, onChanging, etc.).

**Giải pháp ĐÚNG:**
Sử dụng **BridgeTalk** để gửi lệnh đến main Illustrator engine:

```javascript
// WRONG - Sẽ lỗi trong palette window
button.onClick = function() {
    app.activeDocument.saveAs(file); // ERROR!
};

// RIGHT - Dùng BridgeTalk
button.onClick = function() {
    var bt = new BridgeTalk();
    bt.target = "illustrator";
    bt.body = [
        "#targetengine 'session_name';",
        "try {",
        "  var doc = app.activeDocument;", // Works in main engine!
        "  doc.saveAs(new File('" + path + "'));",
        "} catch(e) { alert(e.message); }"
    ].join("\n");
    bt.send();
};
```

**Áp dụng:**
- Mọi thao tác liên quan đến Document (save, read properties, modify) trong palette window phải dùng BridgeTalk
- Xem mẫu: `SessionManager.updateAndReload()` và `SaveController.execute()`

**Prevention Checklist:**
- [ ] Trước khi access `app.activeDocument` trong palette → Check xem có phải palette window context không?
- [ ] Nếu trong palette → Dùng BridgeTalk
- [ ] Test button click TRƯỚC KHI viết too much code

---

### Lesson 002: ES6 Syntax trong JSX Files

**Ngày phát hiện:** 2026-01-15  
**Frequency:** Very High (10x+)  
**Severity:** High

**Triệu chứng:**
- Syntax error khi run script
- "Illegal use of reserved word"
- "Unexpected token =>"
- Script không load, silent fail

**Nguyên nhân:**
ExtendScript chỉ hỗ trợ ES3. Các ES6+ syntax như `const`, `let`, `=>`, template literals KHÔNG work.

**Common Mistakes:**
```javascript
// ❌ WRONG - ES6 syntax
const name = "test";          // const không có
let value = 123;              // let không có
const fn = () => {};          // arrow function không có
const str = `Hello ${name}`;  // template literal không có
const obj = { name, value };  // property shorthand không có

// ✅ RIGHT - ES3 syntax
var name = "test";
var value = 123;
function fn() {}
var str = "Hello " + name;
var obj = { name: name, value: value };
```

**Giải pháp:**
1. **LUÔN check** file extension: `.jsx` = ES3 only
2. **Đọc** `ES3_ES6_Boundary` skill TRƯỚC KHI viết code
3. **Use** `var` instead of `const`/`let`
4. **Use** `function() {}` instead of `() =>`
5. **Use** string concatenation instead of template literals

**Prevention Checklist:**
- [ ] File là `.jsx`? → ES3 mode ON
- [ ] Có dùng `const`/`let`? → Replace bằng `var`
- [ ] Có arrow function? → Replace bằng `function`
- [ ] Có template literal? → Replace bằng `+`

---

### Lesson 003: Namespace Initialization Order

**Ngày phát hiện:** 2026-01-15  
**Frequency:** Medium (3x)  
**Severity:** Medium

**Triệu chứng:**
- "Cannot set property of undefined"
- `$.global.WeddingCore.Domain` is undefined
- Works khi chạy lần 2, lỗi lần đầu

**Nguyên nhân:**
Gán vào namespace chưa được khởi tạo.

**Giải pháp:**
LUÔN khởi tạo namespace hierarchy trước khi dùng:

```javascript
// ✅ RIGHT - Init hierarchy
$.global.WeddingCore = $.global.WeddingCore || {};
$.global.WeddingCore.Domain = $.global.WeddingCore.Domain || {};
$.global.WeddingCore.Domain.NameProcessor = NameProcessor; // Safe

// ❌ WRONG - Assume exists
$.global.WeddingCore.Domain.NameProcessor = NameProcessor; // Error if not init
```

**Best Practice:**
Mỗi file có namespace export, thêm guard ở đầu file:

```javascript
// Đầu file
$.global.WeddingCore = $.global.WeddingCore || {};
$.global.WeddingCore.Domain = $.global.WeddingCore.Domain || {};

// ... code ...

// Cuối file
$.global.WeddingCore.Domain.MyModule = MyModule;
```

---

### Lesson 004: Load Order Dependencies

**Ngày phát hiện:** 2026-01-15  
**Frequency:** Medium (3x)  
**Severity:** Medium

**Triệu chứng:**
- "X is not defined"
- Module A cần module B nhưng B chưa load

**Nguyên nhân:**
Sai thứ tự load trong `Run_App.js` hoặc module index file.

**Giải pháp:**
Load dependencies TRƯỚC khi load module cần nó:

```javascript
// ✅ RIGHT order
load("src/Domain/NameProcessor.jsx");  // No dependencies
load("src/Domain/PersonValidator.jsx"); // Depends on NameProcessor
load("src/UI/FormBuilder.jsx");        // Depends on both above

// ❌ WRONG order
load("src/UI/FormBuilder.jsx");        // ERROR - dependencies not loaded yet
load("src/Domain/NameProcessor.jsx");
```

**Rule of thumb:**
Domain → Application → Infrastructure → UI (bottom-up)

---

### Lesson 005: JSON.stringify không có trong ES3

**Ngày phát hiện:** 2026-01-17  
**Frequency:** Low (2x)  
**Severity:** Low

**Triệu chứng:**
- "JSON is not defined"
- Cần serialize object to string

**Giải pháp:**
Dùng polyfill hoặc custom stringify:

```javascript
// Option 1: Polyfill (trong illustrator.jsx có sẵn)
if (typeof JSON === "undefined") {
    JSON = {
        stringify: function(obj) { /* implementation */ },
        parse: function(str) { /* implementation */ }
    };
}

// Option 2: Manual
function simpleStringify(obj) {
    var result = "{";
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            result += '"' + key + '":"' + obj[key] + '",";
        }
    }
    return result.slice(0, -1) + "}";
}
```

---

### 📝 Template: Thêm Lesson Mới
## 📝 Thêm Issue mới

**Khi gặp lỗi MỚI và đã fix:**

1. Copy template này
2. Assign ID tiếp theo (check INDEX)
3. Fill in all sections
4. Add vào cuối Lessons Learned section (trước template)
5. Update INDEX table với entry mới

**Template:**

```markdown
### Lesson [ID]: [Short Title]

**Ngày phát hiện:** YYYY-MM-DD  
**Frequency:** [Very High/High/Medium/Low]  
**Severity:** [Critical/High/Medium/Low]

**Triệu chứng:**
- [Mô tả những gì user sees]
- [Error messages]

**Nguyên nhân:**
[Root cause explanation]

**Giải pháp:**
[Code examples hoặc steps]

```javascript
// ❌ WRONG
[Bad code example]

// ✅ RIGHT  
[Good code example]
```

**Prevention Checklist:**
- [ ] [Check 1]
- [ ] [Check 2]
```

**Rules:**
- Title ngắn gọn, descriptive
- Code examples PHẢI có both wrong and right
- Prevention checklist giúp agent tự check TRƯỚC KHI code
- Update INDEX frequency khi lỗi lặp lại

---

**Last Updated:** 2026-01-19  
**Total Lessons:** 5  
**Version:** 2.0 (with Error Learning System)
