---
name: Hexagonal_Architecture_Rules
description: Quy tắc bắt buộc về Kiến trúc Hexagonal (Ports & Adapters) cho dự án Wedding Scripter. Bao gồm Design Principles, Trade-offs và Red Flags.
---

# Skill: Quy tắc Kiến trúc Hexagonal (The Guardian)

## 🚀 TL;DR (Quick Summary)
- **MỤC ĐÍCH:** Tách biệt Core (Domain) khỏi Infrastructure để dễ test, dễ mở rộng.
- **KHI NÀO DÙNG:** Khi thêm file mới, refactor, hoặc review code structure.
- **RULE QUAN TRỌNG:**
  - Domain **KHÔNG BAO GIỜ** import từ Infrastructure.
  - Use Case nhận Repository qua **Dependency Injection** (không tự `new`).
  - Logic nằm ở CEP/JS (V8), IO nằm ở ExtendScript/JSX (ES3).
- **❌ SAI LẦM PHỔ BIẾN:** Domain gọi `app.activeDocument` trực tiếp, dùng ES6 trong file .jsx.
- **LIÊN KẾT:** [Project_Context](../Project_Context/SKILL.md), [Coding_Principles](../Coding_Principles/SKILL.md)

---

## 1. Architectural Principles (Nguyên lý Kiến trúc)

### 1.1 Modularity & Global Namespace Hygiene (Trong môi trường ES3)
- **Nguyên lý:** ExtendScript dùng chung một Global Scope cho tất cả script đang chạy. Việc ô nhiễm (pollution) global scope là tối kỵ.
- **Áp dụng:**
  - Mọi code ExtendScript phải được bọc trong **IIFE** (Immediately Invoked Function Expression) hoặc namespace object (ví dụ `var WeddingApp = {}`).
  - Module hóa phải rõ ràng: Mỗi file chỉ chịu trách nhiệm một việc (Single Responsibility).

### 1.2 Separation of Engine (CEP vs ExtendScript)
- **Nguyên lý:** Adobe Extensions chạy trên 2 engine khác nhau: Chromium (V8, hiện đại) và Illustrator (SpiderMonkey cũ, chậm).
- **Áp dụng:** "Brain in CEP, Hands in Illustrator".
  - **CEP (JS):** Xử lý logic phức tạp, tính toán, API calls, regex nặng.
  - **ExtendScript (JSX):** Chỉ thực hiện các thao tác DOM (get/set properties) đơn giản nhất có thể.

### 1.3 Defensive Programming at Boundaries
- **Nguyên lý:** Giao tiếp giữa CEP và ExtendScript (qua `CSInterface`) là điểm yếu nhất và dễ crash nhất.
- **Áp dụng:**
  - Validate dữ liệu chặt chẽ ở CEP *trước* khi gửi xuống JSX.
  - Xử lý lỗi (Error Handling) ở mọi boundary call. JSX phải luôn trả về JSON string hợp lệ hoặc error code, không bao giờ `throw` exception ra ngoài mà không catch.

---

## 2. Trade-Off Analysis (Phân tích Đánh đổi)

### 2.1 Direct DOM Access vs. Abstracted Repository
- **Option A: Direct DOM Access (Script gọi thẳng `app.activeDocument`)**
  - *Pros:* Nhanh, viết ít code ban đầu.
  - *Cons:* Khó test, gắn chặt logic với API Illustrator, khó bảo trì khi API đổi.
- **Option B: Repository Pattern (Hexagonal)**
  - *Pros:* Dễ test (mock repository), tách biệt logic khỏi UI/DOM, code sạch.
  - *Cons:* Viết nhiều file hơn (Interface, Implementation), hơi dư thừa cho script nhỏ < 100 dòng.
- **🚨 Decision:** Với Wedding Scripter (Project lớn), **BẮT BUỘC dùng Option B**.

### 2.2 CEP-First vs. ExtendScript-Heavy
- **Option A: ExtendScript-Heavy (Logic nằm ở .jsx)**
  - *Pros:* Gần DOM, không cần serialize JSON qua lại.
  - *Cons:* ES3 cũ kỹ, thiếu feature (không `map`, `filter`, `json`), debug khó, đóng băng UI Illustrator khi chạy nặng.
- **Option B: CEP-First (Logic nằm ở .js)**
  - *Pros:* JS hiện đại (ES6+), async/await, không block UI chính, thư viện phong phú.
  - *Cons:* Overhead khi serialize dữ liệu gửi qua lại.
- **🚨 Decision:** **CEP-First**. Chỉ dùng ExtendScript để "Scan" (đọc) và "Commit" (ghi). Mọi xử lý ở giữa làm tại CEP.

---

## 3. Tổng quan Kiến trúc Hexagonal

```
┌─────────────────────────────────────────────────────────┐
│                    DRIVING ADAPTERS                     │
│              (UI, Scripts, Controllers)                 │
│                         │                               │
│                         ▼                               │
│    ┌────────────────────────────────────────────┐       │
│    │              INPUT PORTS                   │       │
│    │         (Interfaces / Giao kèo)            │       │
│    │                    │                       │       │
│    │                    ▼                       │       │
│    │  ┌────────────────────────────────────┐    │       │
│    │  │           CORE (DOMAIN)            │    │       │
│    │  │  - Entities (CardEntity.js)        │    │       │
│    │  │  - Use Cases (UpdateCardUseCase)   │    │       │
│    │  │  - Business Rules                  │    │       │
│    │  └────────────────────────────────────┘    │       │
│    │                    │                       │       │
│    │                    ▼                       │       │
│    │             OUTPUT PORTS                   │       │
│    │        (IRepository interfaces)            │       │
│    └────────────────────────────────────────────┘       │
│                         │                               │
│                         ▼                               │
│                  DRIVEN ADAPTERS                        │
│     (AIDOMRepository, SessionAdapter, BridgeTalk)       │
50: └─────────────────────────────────────────────────────────┘
```

---

## 4. Quy tắc Vàng (Golden Rules)

### Quy tắc #1: Domain là Vua (Domain is King)
> **Domain KHÔNG BAO GIỜ được phụ thuộc vào bất kỳ lớp nào khác.**
- ✅ `Domain/CardEntity.js` chỉ chứa pure JavaScript logic.
- ❌ `Domain/` KHÔNG được `import` hay `$.evalFile()` từ `Infrastructure/` hoặc `UI/`.

### Quy tắc #2: Luồng Dependency Một Chiều
`UI -> UseCases -> Domain <- Infrastructure`
Use Case định nghĩa Interface (Port), Infrastructure implement Interface đó (Adapter).

### Quy tắc #3: No Hidden Dependencies
- Không dùng biến toàn cục (`Global vars`) để truyền dữ liệu.
- Mọi dependency phải được inject qua Constructor (Dependency Injection).

---

## 5. Red Flags (Cờ Đỏ - Dấu hiệu Code Tồi)

### 🚩 Architecture Anti-patterns
- **God Object:** Một file `Main.jsx` làm tất cả mọi thứ 3000 dòng.
- **Leaky Abstraction:** `Domain` entity chứa thuộc tính `textFrameItem` của Illustrator (lẽ ra chỉ nên chứa `textString`).
- **Circular Dependency:** A require B, B require A.

### 🚩 Adobe/ExtendScript Specific Red Flags
- **Sử dụng cú pháp ES6 trong .jsx:** `const`, `let`, `=>` (Sẽ crash ngay lập tức).
- **Tight Coupling UI & Logic:** Button click handler chứa trực tiếp logic for-loop xử lý dữ liệu.
- **Hardcoded Paths:** `C:\Users\Admin`. Phải dùng relative path hoặc `Folder.myDocuments`.
- **Silent Failures:** Try-catch nuốt lỗi mà không log hay thông báo cho user (trong context CEP).

---

## 6. Cấu trúc Thư mục Chuẩn
(Giữ nguyên như cũ)
```
/src
  ├── /Domain            [CORE]
  ├── /Application       [CORE - Use Cases, Ports]
  ├── /Infrastructure    [ADAPTERS]
  │     ├── /Illustrator (AIDOMRepository.js)
  │     ├── /UI          (MainController.js)
  └── /Shared            [Utils]
```

## 7. Checklist Khi Viết Code Mới (Refined)

- [ ] **Layer Check:** Code này thuộc lớp nào? (Domain, App, Infra?)
- [ ] **Dependency Check:** Class này có import ngược chiều không?
- [ ] **ES3 Check:** Nếu file là `.jsx`, có lỡ tay dùng `const`/`let` không?
- [ ] **Validation Check:** Inputs từ UI đã được validate tại CEP chưa?
