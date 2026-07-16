# Polyfills Và Helpers

## Dùng file này khi nào

- bạn buộc phải có helper kiểu `map`, `filter`, `reduce`, hoặc JSON helper trong ES3
- bạn đang cân nhắc thêm polyfill vào host-side code

## Nguyên tắc

- ưu tiên viết ES3 thuần trước
- chỉ thêm polyfill hoặc utility khi lợi ích lặp lại đủ rõ
- gom helper vào utility có chủ đích, không copy ad-hoc vào từng file

## Ví dụ

```javascript
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callback, thisArg) {
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}
```

## Khi nào không nên polyfill

- chỉ dùng cho một loop đơn giản có thể viết bằng `for`
- logic host-side quá nhạy, không muốn thay đổi môi trường global
- helper hiện đại có thể được thay bằng utility module rõ ràng hơn
