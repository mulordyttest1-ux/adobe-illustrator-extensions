# AGENTS.md

Huong dan scoped cho `libs/shared/`.

## Pham vi

- Thu muc nay la shared library dung cho nhieu panel.
- Moi thay doi tai day deu co tac dong cheo; mac dinh phai qua `/plan`.
- Khi route task trong surface nay, mo `libs/shared/README.md` de xem public surface, boundary, va validation lane truoc khi vao package code.

## Nguyen tac

- Giu API on dinh va tong quat.
- Khong hardcode logic rieng cho `symbol-cep` hoac `wedding-cep`.
- Khong import nguoc tu `symbol-cep/` hoac `wedding-cep/`.
- Neu can callback cho app goi lai, uu tien pattern callback parameter thay vi coupling voi controller cu the.

## Public surface hien tai

```js
import { UIFeedback } from '@shared/cep-ui';

UIFeedback.showToast(message, type);
UIFeedback.showLoading(container, message);
UIFeedback.hideLoading();
UIFeedback.showError(container, message, onRetry);
```

## Commands

- `npm run lint:all`
- `npm run build:all`

## Reporting

- Trong plan va close-out, ghi ro app nao bi anh huong va cach da validate.
