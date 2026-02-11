# Master Plan & Roadmap - Wedding Scripter Project

> **Location:** `i:\My Drive\script ho tro adobe illustrator\.agent\planning\MASTER_PLAN.md`
> **Last Updated:** 2026-01-16
> **Status:** Active

Tài liệu này theo dõi toàn bộ tiến độ dự án, chiến lược phát triển và trạng thái các đầu việc (Tasks). Được lưu trữ trực tiếp trong Workspace để đảm bảo an toàn dữ liệu và đồng bộ (Google Drive).

## 1. Mục tiêu Chiến lược (Objectives)
1.  **Ổn định hóa & Chuẩn hóa:** Xây dựng hệ thống Agent Skills và Workflows để standarize quy trình dev.
2.  **Hiện đại hóa UI:** Nâng cấp giao diện Wedding Pro Script.
3.  **Tối ưu hóa Logic:** Refactor code core theo kiến trúc Hexagonal.

## 2. Lộ trình Triển khai (Roadmap)

### Giai đoạn 1: Xây dựng Nền tảng (Agent Foundation)
*Mục tiêu: Thiết lập môi trường làm việc thông minh cho Agent với đầy đủ context và quy tắc.*

- [x] **Core Structure Setup**
  - [x] Khởi tạo cấu trúc thư mục `.agent` (docs, skills, templates, workflows).
  - [x] Tạo `Config.js` và `Run_App.js` cơ bản.

- [x] **Skill System Development (AI-SOP)**
  - [x] `Hexagonal_Rules`: Quy tắc kiến trúc Ports & Adapters.
  - [x] `Code_Style_Standard`: Quy chuẩn viết code ES3 & Illustrator.
  - [x] `Coding_Principles`: Nguyên lý lập trình (SOLID, KISS, DRY...).
  - [x] `Project_Context`: Bản đồ dự án và Context Awareness.
  - [x] `Skills_Index`: Chỉ mục và hướng dẫn sử dụng Skills.
  - [x] `Troubleshooting`: Hướng dẫn xử lý lỗi thường gặp.

### Giai đoạn 2: Tự động hóa Quy trình (Workflow Automation)
*Mục tiêu: Đóng gói các tác vụ lặp lại thành Workflow chuẩn.*

- [x] **Workflow: Add New Field**
  - [x] Document quy trình thêm trường dữ liệu (`workflows/add_new_field.md`).
- [x] **Workflow: Safe Refactoring**
  - [x] Document quy trình refactor an toàn (`workflows/safe_refactor.md`).
- [ ] **Workflow: UI Upgrade**
  - [ ] Quy trình build/update UI layout.

### Giai đoạn 3: Nâng cấp Sản phẩm (Product Upgrade)
*Mục tiêu: Cải thiện UX/UI và tính năng của script Wedding Pro.*

- [ ] **Refactor Core**
  - [ ] Review và áp dụng Hexagonal Architecture triệt để cho các module cũ.
  - [ ] Tách biệt hoàn toàn UI Logic và Business Logic.

- [ ] **UI Revamp (Wedding Pro)**
  - [ ] Thiết kế lại giao diện hiện đại hơn (Modern UI).
  - [ ] Cải thiện feedback người dùng (Progress bar, Notifications).

- [x] **Feature Expansion (Tab 2: Symbol & Color)**
  - [x] Nghiên cứu & Prototype: Xử lý `SymbolItem` và `Swatch`/`Color` Management.
  - [x] Logic: Auto-replace Symbol, Global Color Adjustment.
  - [x] UI: Tab chức năng mới cho các tool xử lý màu và symbol.

## 3. Backlog (Tasks đang chờ)
Danh sách các đầu việc cụ thể cần thực hiện trong thời gian tới.

### High Priority
- [ ] **Check & Validate Config**: Kiểm tra file `Config.js` hiện tại xem có khớp với `Config_Schema` (nếu có) không.
- [ ] **Consolidate Documentation**: Rà soát lại `Decision_Log.md` và cập nhật các quyết định mới.

### Low Priority
- [ ] Nghiên cứu khả năng tích hợp Unit Test cho .jsx (ExtendScript).
- [ ] Tạo script auto-reload để tăng tốc độ dev UI.

---
**Ghi chú:** Đánh dấu `[x]` vào các ô check box khi hoàn thành công việc. Agent sẽ tự động đọc file này để nắm bắt tiến độ.
