# CEP-side ES6+

## Dùng file này khi nào

- đang sửa code trong `cep/js`
- đang viết logic panel, UI helper, hoặc orchestration phía Chromium

## Những thứ an toàn hơn ở CEP-side

- `const`, `let`
- arrow function
- template literal
- array helpers hiện đại như `map`, `filter`, `forEach`
- class syntax
- destructuring
- spread operator

## Quy tắc thực dụng

- vẫn nên bám style của repo hiện tại, đừng lạm dụng sugar nếu module xung quanh không dùng
- CEP-side có thể hiện đại hơn, nhưng đừng để assumption đó rò sang host-side code
- nếu dữ liệu sẽ đi vào Illustrator host, normalize shape và format trước khi bridge

## Ví dụ ngắn

```javascript
const double = (x) => x * 2;
const msg = `Hello, ${name}!`;

const filtered = items.filter((x) => x > 5);
```
