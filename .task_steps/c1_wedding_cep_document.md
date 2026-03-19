# C1: Research — Checkbox Authority Problem (Autofill-Only Pattern)
*App: `wedding-cep` | Date: 2026-03-19*

---

## Step 0: DEFINE
> Bài toán: Checkbox `ten_auto` trong form venue/ceremony đang vi phạm nguyên tắc SSOT — nó không chỉ là nút auto-fill bổ trợ mà đang trực tiếp quyết định giá trị `diachi` trong packet khi build. Dẫn đến khi user nhập địa chỉ khác vào ô, địa chỉ vẫn bị overwrite bởi `pos1.diachi`.

---

## Step 1+2: EXTRACT — Cộng Đồng Khẳng Định

### ✅ Best Practice: "Controlled Input SSOT" (React official docs, dev.to)
- Ô input là SINGLE SOURCE OF TRUTH cho dữ liệu.
- Autofill helper chỉ được phép **write vào ô** — không được phép **bypass ô** để đưa dữ liệu trực tiếp vào packet.
- Checkbox "Same as billing address" là ví dụ kinh điển: nó COPY địa chỉ vào ô input, sau đó ô input mới là gốc. Không bao giờ checkbox quyết định giá trị cuối cùng.

### ❌ Anti-Pattern: "Derived State Override" (React docs, medium.com)
- Lỗi xảy ra khi: một prop/flag (checkbox) khởi tạo state, rồi UI render lại, giá trị từ flag đè lên user input → User input bị mất.
- Đây chính xác là bug hiện tại trong `venue.js` > `applyAutoVenue()`.

---

## Step 3: ALIGN — Diagnose Codebase Hiện Tại

### Sơ đồ luồng lỗi:

```
[User gõ ceremony.diachi = "Nhà Riêng XYZ"]
        ↓
[_handleChange] → RAM state = "Nhà Riêng XYZ"
        ↓
[User click Build]
        ↓
[getData()] → packet = { 'ceremony.diachi': 'Nhà Riêng XYZ', 'pos1.diachi': 'ABC', 'ceremony.ten_auto': true }
        ↓
[applyAutoVenue(packet)] ← ĐÂY LÀ CĂN BỆNH
    if _shouldAuto('ceremony') → true (vì ten_auto=true)
        packet['ceremony.diachi'] = packet['ceremony.diachi'] || fallbackAddr
                                  = 'Nhà Riêng XYZ' || 'ABC'  ← My fix OK cho case này
        ⚠️ NHƯNG: Khi ceremony.diachi = '' (empty) → dùng pos1.diachi
```

### Nhưng còn vấn đề sâu hơn ở FormLogic (UI layer):

```
[User đang typing trong ceremony.diachi = "Nhà Riêng XY"]
        ↓
[pos1.diachi input event fires → triggerUpdate()]
        ↓
[_updateAllVenueNames() → _updateVenueSection()]
    if ten_auto.checked → addrEl.value = pos1.diachi  ← OVERWRITE giữa chừng!
```

**FormLogic đang overwrite ô `ceremony.diachi` bất cứ lúc nào `pos1.diachi` thay đổi** trong khi checkbox còn checked — người dùng không thể sửa địa chỉ trong ô mà không bị đẩy lại.

---

## Kết Luận: 2 Vi Phạm SSOT

| Tầng | Vi phạm | File |
|:-----|:--------|:-----|
| UI Layer | `_updateVenueSection` overwrite `ceremony.diachi.value` khi `pos1.diachi` input (live loop) | `FormLogic.js` |
| Data/Build Layer | `applyAutoVenue` override `ceremony.diachi` trong packet dựa theo `ten_auto` flag | `venue.js` |

---

## Giải Pháp Đúng (Best Practice Aligned)

### Nguyên tắc áp dụng: "Autofill writes INTO the box. The box owns the data."

**Fix 1 — `FormLogic.js`:** Thêm `_bindManualInputCancellation` cho ô `ceremony.diachi` / `venue.diachi` — khi user gõ trực tiếp vào ô địa chỉ → uncheck checkbox `ten_auto` → FormLogic không overwrite nữa.

**Fix 2 — `venue.js`:** `applyAutoVenue` không bao giờ touch `ceremony.diachi` / `venue.diachi` trong packet. Địa chỉ đã có trong packet từ `getData()` — đây là source of truth.

---
*Tag: `c1_wedding_cep_document.md` | Signed: Antigravity Researcher — Community First Pipeline*
