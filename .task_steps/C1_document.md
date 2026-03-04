# C1: Nâng Cấp Tab 2 — U200B Marker + Metadata (Thay Vì Edit Content)

## DEFINE
> **Bài Toán:** Tab 2 (Schema Injector) hiện tại chỉ dùng ATOMIC replacement thay đổi nội dung text. 
> Nút Update Tab 1 hoạt động hiệu quả hơn: bọc U200B 2 đầu + ghi metadata vào `item.note`. 
> Yêu cầu: nâng cấp Tab 2 lên cùng cơ chế.

## SEARCH (3 Queries)
1. `"Adobe Illustrator CEP ExtendScript item.note metadata best practice TextFrame zero-width space marker"`
2. `"CEP ExtendScript item.note JSON metadata store pitfalls character encoding illustrator"`
3. `"illustrator ExtendScript textFrame characters atomic replacement preserve rich text formatting markers"`

## EXTRACT

### Best Practice ✅
- **`item.note`** là nơi chuẩn để ghi metadata lên TextFrame (string property, không ảnh hưởng display)
- **U200B wrap** (Zero-Width Space) bọc 2 đầu nội dung → giúp script nhận diện lại TextFrame lần sau
- **ATOMIC replacement** qua `item.characters` thay vì `item.contents = "..."` → giữ nguyên Rich Text

### Anti-Pattern ❌
- Ghi đè `textFrame.contents = "..."` trực tiếp → **mất toàn bộ font/size/color** (tài liệu Adobe confirm)
- Dùng `eval()` để parse JSON trong ExtendScript mà không sanitize → lỗi encoding Unicode

### Edge Case ⚠️
- U200B **có thể bị xóa** bởi user nếu họ copy-paste text → Recovery Mode cần có (đã tồn tại trong code)
- ExtendScript JSON parse gặp vấn đề với ký tự Unicode Tiếng Việt → Codebase hiện tại đã giải quyết bằng Base64 encode

## ALIGN — ✅ KHỚP 100%

Codebase hiện tại **đã có sẵn toàn bộ hạ tầng** cần thiết:

| Thành Phần | File | Trạng Thái |
|:-----------|:-----|:-----------|
| `applyPlan` ATOMIC mode | `illustrator.jsx:355` | ✅ Sẵn sàng |
| `applyPlan` DIRECT mode (U200B wrap) | `illustrator.jsx:379` | ✅ Sẵn sàng |
| `plan.meta` → `item.note` | `illustrator.jsx:393` | ✅ Sẵn sàng |
| `FreshStrategy` (quét placeholder → bọc U200B → ghi keys) | `FreshStrategy.js` | ✅ Sẵn sàng |
| `SmartComplexStrategy` (quét marker → thay nội dung) | `SmartComplexStrategy.js` | ✅ Sẵn sàng |
| `scanWithMetadata` (đọc `item.note` + nhận diện U200B) | `illustrator.jsx:217` | ✅ Sẵn sàng |

---

## PHÂN TÍCH LUỒNG NÚT UPDATE (TAB 1)

```
[User nhập data Tab 1] → StrategyOrchestrator.analyzeBatch()
    ├── SmartComplexStrategy (nếu có metadata cũ):
    │   └── Quét \u200B+...\u200B+ → thay nội dung ATOMIC → giữ marker
    └── FreshStrategy (nếu lần đầu, có {placeholder}):
        └── Quét {key} → wrap \u200B{value}\u200B → ghi meta.keys
    
→ Plan gửi xuống ExtendScript qua bridge.applyPlan()
→ illustrator.jsx:
    ├── ATOMIC: thay từng ký tự qua item.characters → giữ Rich Text
    ├── DIRECT: item.contents = "\u200B" + val + "\u200B" → bọc marker
    └── plan.meta → item.note = JSON.stringify(meta) → lưu metadata
```

## PHÂN TÍCH LUỒNG NÚT TIÊM TỰ ĐỘNG (TAB 2 - HIỆN TẠI)

```
[User bôi đen TextFrame → bấm Tiêm] → InjectSchemaAction.execute()
    └── SchemaInjector.computeChanges(frames, 'tiec')
        └── Quét Regex → push replacements [{start, end, val}]
    
→ Plan gửi xuống ExtendScript qua bridge.applyPlan()
→ illustrator.jsx:
    ├── ATOMIC: thay chữ số/từ khóa bằng {schema.key} → ✅ Giữ Rich Text
    └── ❌ KHÔNG có plan.meta → item.note TRỐNG
    └── ❌ KHÔNG bọc U200B quanh {schema.key}
```

## ĐỀ XUẤT NÂNG CẤP

> **Mục tiêu:** Sau khi Tab 2 tiêm Schema xong, nút Update Tab 1 phải nhận diện được TextFrame đó và update value vào đúng chỗ.

### Thay đổi cần làm:

**1. `SchemaInjector.computeChanges()` — Bổ sung U200B wrap + metadata**
- Mỗi replacement `{start, end, val: "{pos1.ong}"}` → đổi thành `val: "\u200B\u200B"` (giá trị rỗng bọc marker, chờ Update điền)
- Thu thập danh sách `keys` từ các placeholder đã quét
- Trả về `plan.meta = { type: "stateful", keys: [...], mappings: [] }`

**2. Không cần sửa `illustrator.jsx`** — vì `applyPlan` đã hỗ trợ:
- Line 393: `if (plan.meta) item.note = JSON.stringify(plan.meta);` ← đã sẵn sàng
- Line 387: `item.contents = "\u200B" + val + "\u200B";` ← đã sẵn sàng

**3. Không cần sửa `bridge.js`** — vì `bridge.applyPlan()` đã có sẵn

### Rủi ro đánh giá: **THẤP**
- Chỉ sửa 1 file JS (`SchemaInjector.js`)
- Hạ tầng ExtendScript + Bridge giữ nguyên 100%
- Recovery Mode đã có sẵn trong `SmartComplexStrategy` phòng trường hợp mất marker

---

> **§C1: ✅ DEFINE="Nâng cấp Tab 2 Schema Inject thêm U200B markers + metadata" | SEARCH=3 queries | EXTRACT=3 findings | ALIGN=KHỚP**
