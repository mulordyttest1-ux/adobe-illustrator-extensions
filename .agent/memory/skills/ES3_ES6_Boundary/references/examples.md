# Side-by-side Examples

## 1. Hàm xử lý tên

### CEP-side ES6+

```javascript
class NameProcessor {
    static parse(fullName, index = 0) {
        const words = fullName.trim().split(/\s+/);
        const pos = index === 0 ? words.length - 1 : index - 1;
        return {
            first: words[0] || "",
            last: words[pos] || ""
        };
    }
}
```

### Host-side ES3

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

## 2. Transform array

### CEP-side ES6+

```javascript
const doubled = items.map((x) => x * 2);
```

### Host-side ES3

```javascript
var doubled = [];
for (var i = 0; i < items.length; i++) {
    doubled.push(items[i] * 2);
}
```

## 3. Dùng `this` trong callback

### CEP-side ES6+

```javascript
items.forEach((item) => this.process(item));
```

### Host-side ES3

```javascript
var self = this;
for (var i = 0; i < items.length; i++) {
    self.process(items[i]);
}
```
