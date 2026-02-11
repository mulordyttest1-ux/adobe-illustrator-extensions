---
name: Coding_Principles
description: Bộ nguyên lý lập trình vàng giúp mã nguồn dễ bảo trì, mở rộng và ít lỗi (KISS, DRY, SOLID, YAGNI, POLA, LoD, CQS)
---

# Skill: Nguyên lý Lập trình Vàng (The Philosopher)

## Mục đích
Tài liệu này tổng hợp các nguyên lý lập trình quan trọng nhất, được điều chỉnh cho phù hợp với môi trường **ExtendScript ES3** của Adobe Illustrator. Agent phải tuân thủ các nguyên lý này khi viết hoặc refactor code.

---

## 1. KISS (Keep It Simple, Stupid)
> **Giữ mọi thứ đơn giản nhất có thể.**

### Quy tắc
- Ưu tiên giải pháp đơn giản, dễ hiểu hơn giải pháp "thông minh" nhưng phức tạp.
- Một hàm nên làm một việc duy nhất và làm tốt việc đó.
- Tránh over-engineering: Đừng xây kiến trúc phức tạp cho vấn đề đơn giản.

### Ví dụ áp dụng
```javascript
// ❌ SAI: Quá phức tạp
function getFullName(person) {
    return [person.ho, person.dem, person.ten]
        .filter(function(x) { return x && x.trim(); })
        .reduce(function(acc, cur) { return acc + " " + cur; }, "")
        .trim();
}

// ✅ ĐÚNG: Đơn giản, dễ hiểu
function getFullName(person) {
    var parts = [];
    if (person.ho) parts.push(person.ho);
    if (person.dem) parts.push(person.dem);
    if (person.ten) parts.push(person.ten);
    return parts.join(" ");
}
```

---

## 2. DRY (Don't Repeat Yourself)
> **Mỗi mẩu kiến thức chỉ nên có một biểu diễn duy nhất trong hệ thống.**

### Quy tắc
- Nếu copy-paste code hơn 2 lần → Tạo hàm/module riêng.
- Cấu hình (config) nên tập trung tại một nơi (`Config_Schema.jsx`).
- Logic nghiệp vụ không được trùng lặp giữa UI và Domain.

### Ví dụ áp dụng
```javascript
// ❌ SAI: Copy-paste logic format ngày nhiều nơi
// File A:
var dateStr = day + "/" + month + "/" + year;
// File B:
var display = d + "/" + m + "/" + y;

// ✅ ĐÚNG: Tập trung vào một hàm
// File: Utils/DateFormatter.js
function formatDate(d, m, y) {
    return d + "/" + m + "/" + y;
}
```

### Lưu ý cho ES3
Trong ES3, không có `import/export`. Sử dụng pattern `$.global.ModuleName` để share code:
```javascript
$.global.DateUtils = $.global.DateUtils || {};
$.global.DateUtils.format = function(d, m, y) { ... };
```

---

## 3. SOLID Principles

### 3.1. S - Single Responsibility Principle (SRP)
> **Một class/module chỉ nên có một lý do để thay đổi.**

- `LayoutBuilder.jsx` → Chỉ xây dựng UI.
- `AIDOMRepository.js` → Chỉ đọc/ghi Illustrator DOM.
- `NameProcessor.js` → Chỉ xử lý tách tên.

### 3.2. O - Open/Closed Principle (OCP)
> **Mở cho mở rộng, đóng cho sửa đổi.**

- Thêm widget mới? → Extend `ComponentFactory`, không sửa core.
- Thêm loại lễ mới? → Thêm vào `Schema.LISTS`, không sửa UI logic.

### 3.3. L - Liskov Substitution Principle (LSP)
> **Subtype phải thay thế được base type mà không gây lỗi.**

Trong ES3, áp dụng qua:
- Các Adapter triển khai cùng interface (IRepository).
- Nếu `MockRepository` thay `AIDOMRepository`, Use Case vẫn chạy đúng.

### 3.4. I - Interface Segregation Principle (ISP)
> **Client không nên bị ép phụ thuộc vào interface mà nó không dùng.**

- Tách interface nhỏ: `IReader` (chỉ đọc), `IWriter` (chỉ ghi).
- Tránh "god interface" có 20 methods.

### 3.5. D - Dependency Inversion Principle (DIP)
> **Module cấp cao không phụ thuộc module cấp thấp. Cả hai phụ thuộc abstraction.**

```javascript
// ❌ SAI: Use Case tạo Adapter trực tiếp
function UpdateCardUseCase() {
    this.repo = new AIDOMRepository(); // ❌ Phụ thuộc cứng
}

// ✅ ĐÚNG: Inject Adapter từ ngoài
function UpdateCardUseCase(repository) {
    this.repo = repository; // ✅ Phụ thuộc abstraction
}
```

---

## 4. YAGNI (You Aren't Gonna Need It)
> **Đừng xây dựng tính năng cho đến khi thực sự cần.**

### Quy tắc
- Không viết code "phòng hờ" cho yêu cầu tương lai chưa rõ.
- Không thêm tham số/option "để mai mốt dùng".
- Focus vào yêu cầu hiện tại, refactor khi cần.

### Ví dụ
```javascript
// ❌ SAI: Thêm support cho 10 loại format "phòng hờ"
function formatName(name, format, locale, timezone, options) { ... }

// ✅ ĐÚNG: Chỉ làm điều cần thiết bây giờ
function formatName(name) { ... }
// Khi thực sự cần locale → Refactor sau
```

---

## 5. POLA (Principle of Least Astonishment)
> **Code nên hoạt động theo cách ít gây ngạc nhiên nhất.**

### Quy tắc
- Đặt tên hàm/biến mô tả chính xác hành vi.
- Hàm `getX()` không nên có side-effect (không sửa state).
- Hàm `setX()` nên trả về void/undefined, không trả kết quả tính toán.

### Ví dụ
```javascript
// ❌ SAI: getName() lại sửa đổi dữ liệu
CardEntity.prototype.getName = function() {
    this.accessCount++; // ❌ Side effect bất ngờ
    return this.name;
};

// ✅ ĐÚNG: Tách rõ ràng
CardEntity.prototype.getName = function() {
    return this.name; // Pure getter
};
CardEntity.prototype.recordAccess = function() {
    this.accessCount++;
};
```

---

## 6. LoD (Law of Demeter / Principle of Least Knowledge)
> **Một object chỉ nên nói chuyện với "bạn bè gần gũi".**

### Quy tắc
Một method chỉ nên gọi methods của:
1. Chính object đó (`this`).
2. Tham số được truyền vào.
3. Object mà nó tạo ra.
4. Thuộc tính trực tiếp của nó.

### Ví dụ
```javascript
// ❌ SAI: "Train wreck" - đào sâu nhiều tầng
var city = order.getCustomer().getAddress().getCity();

// ✅ ĐÚNG: Ủy quyền cho object trung gian
var city = order.getShippingCity(); 
// Order tự hỏi Customer, Customer tự hỏi Address
```

---

## 7. CQS (Command Query Separation)
> **Một method hoặc là Command (thay đổi state) hoặc là Query (trả về data), không được cả hai.**

### Quy tắc
- **Query:** Trả về giá trị, không có side-effect. Gọi nhiều lần → cùng kết quả.
- **Command:** Thay đổi state, trả về void/undefined.

### Ví dụ
```javascript
// ❌ SAI: Vừa lưu vừa trả kết quả
CardEntity.prototype.saveAndGetId = function() {
    this.repo.save(this);
    return this.id;
};

// ✅ ĐÚNG: Tách biệt
CardEntity.prototype.save = function() { // Command
    this.repo.save(this);
};
CardEntity.prototype.getId = function() { // Query
    return this.id;
};
```

---

## 8. Separation of Concerns (SoC)
> **Chia hệ thống thành các phần riêng biệt, mỗi phần xử lý một khía cạnh.**

| Concern | Vị trí trong dự án |
|---------|-------------------|
| Business Logic | `Domain/` |
| Use Case Orchestration | `Application/UseCases/` |
| UI Rendering | `Infrastructure/UI/` |
| Data Persistence | `Infrastructure/Illustrator/` |
| Configuration | `Config_Schema.jsx` |

---

## 9. Fail Fast (Thất bại nhanh)
> **Khi phát hiện lỗi, dừng ngay lập tức thay vì tiếp tục với trạng thái không hợp lệ.**

### Quy tắc
- Validate input ở đầu hàm.
- Throw error rõ ràng thay vì return null/undefined âm thầm.

```javascript
// ✅ ĐÚNG: Fail fast với message rõ ràng
function processCard(data) {
    if (!data) throw new Error("processCard: data is required");
    if (!data.name) throw new Error("processCard: name field is required");
    // ... tiếp tục xử lý
}
```

---

## 10. Checklist Áp dụng Nguyên lý

Khi viết hoặc review code, hãy kiểm tra:

- [ ] **KISS:** Giải pháp này có đơn giản nhất chưa?
- [ ] **DRY:** Logic này có bị trùng lặp ở đâu không?
- [ ] **SRP:** Module này có làm quá nhiều việc không?
- [ ] **OCP:** Có thể mở rộng mà không sửa code cũ không?
- [ ] **DIP:** Dependency có được inject từ ngoài không?
- [ ] **YAGNI:** Có đang viết code cho yêu cầu chưa tồn tại không?
- [ ] **POLA:** Tên hàm có phản ánh đúng hành vi không?
- [ ] **LoD:** Có đang "đào sâu" qua nhiều tầng object không?
- [ ] **CQS:** Hàm này là Query hay Command? Có trộn lẫn không?
- [ ] **Fail Fast:** Có validate input ở đầu hàm không?

---

## Tài liệu Tham khảo
- Clean Code - Robert C. Martin
- SOLID Principles: https://en.wikipedia.org/wiki/SOLID
- Law of Demeter: https://en.wikipedia.org/wiki/Law_of_Demeter
