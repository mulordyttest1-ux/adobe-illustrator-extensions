# Boundary Map

## Dùng file này khi nào

- cần biết file nào chạy ở runtime nào
- cần quyết định syntax hoặc API có an toàn không

## Quy tắc vàng

Nhìn vào đường dẫn file trước khi nghĩ đến cú pháp.

| Đường dẫn | Runtime | Mức JS |
|:----------|:--------|:-------|
| `cep/js/**/*.js` | CEP panel / Chromium | ES6+ |
| `cep/jsx/**/*.jsx` | Illustrator host | ES3 |
| `src/**/*.jsx` | Illustrator host | ES3 |
| `src/**/*.js` | Host-side legacy | ES3 |

## Heuristic nhanh

- nếu code chạy trong panel HTML/JS -> CEP-side
- nếu code chạm trực tiếp Illustrator DOM hoặc BridgeTalk host -> nghĩ như ES3
- nếu logic đi qua bridge giữa 2 bên -> tách rõ mỗi phía dùng syntax phù hợp với runtime của nó
