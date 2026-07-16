# ExtendScript ES3

## Dùng file này khi nào

- đang viết `cep/jsx`
- đang chạm host-side legacy code trong `src`
- đang debug lỗi chỉ xuất hiện trong Illustrator host

## Tránh những thứ sau

- `const`, `let`
- arrow function
- template literal
- class syntax
- destructuring
- spread operator
- trailing comma trong literal
- assumption rằng `forEach`, `map`, `filter`, `Object.keys`, `JSON.*` luôn tồn tại

## Ưu tiên dùng

```javascript
var MAX = 10;
var msg = "Hello, " + name + "!";
var double = function (x) { return x * 2; };
```

```javascript
for (var i = 0; i < items.length; i++) {
    var item = items[i];
}
```

## Bẫy phổ biến

- mất context `this` trong callback -> lưu `var self = this`
- copy code từ CEP-side sang host-side mà quên hạ syntax
- rely vào helper hiện đại chưa được polyfill hoặc utility hóa

## Rule of thumb

Nếu không chắc runtime host có chịu được feature nào đó không, đừng dùng nó.
