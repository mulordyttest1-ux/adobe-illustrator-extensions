
# KẾ HOẠCH ĐÁNH GIÁ: CHIẾN LƯỢC MỞ RỘNG DỰA TRÊN DỮ LIỆU NGƯỜI DÙNG (USER-DRIVEN EXTENSIBILITY)

**Mục tiêu:** Xác định lộ trình an toàn để thư viện Automation hấp thụ dữ liệu vận hành (operational data) nhằm tự làm giàu logic mà không cần deploy code mới.

---

## BƯỚC 1: AUDIT HIỆN TRẠNG (BASELINING)
*Trước khi mở rộng, phải đảm bảo nền móng vững chắc.*

**1. Phân loại Logic Automation:**
Tôi sẽ rà soát mã nguồn (Codebase Review) để phân loại logic hiện tại thành 3 nhóm:
*   **Static Hard-Core (Bất biến):** Các logic cốt lõi không bao giờ được thay đổi bởi user (Ví dụ: Thuật toán tính ngày Âm/Dương, quy tắc kết nối Database/File System).
*   **Configurable Logic (Cấu hình):** Các tham số đang để trong file config/constants (Ví dụ: Danh sách từ viết tắt, Regex pattern, Timeout settings). -> *Đây là ứng viên số 1 để mở rộng.*
*   **Dynamic Candidates (Tiềm năng):** Các logic `if-else` phức tạp xử lý edge-cases (Ví dụ: Xử lý tên người dân tộc, format địa chỉ lạ). Hiện tại đang hard-code nhưng thực tế rất đa dạng.

**2. Đánh giá Kiến trúc (Architecture Health Check):**
*   **Decoupling:** Kiểm tra xem Core Engine có đang phụ thuộc chặt vào dữ liệu cứng (Hard-coded constants) không?
    *   *Đạt:* Engine nhận dữ liệu từ `Repository/Provider` interface.
    *   *Chưa đạt:* Engine import trực tiếp file `constants.js`.
*   **Validation Layer:** Hệ thống hiện tại có cơ chế validate dữ liệu đầu vào chặt chẽ không? (Nếu mở rộng data mà không validate kỹ => Crash hệ thống).

---

## BƯỚC 2: PHÂN TÍCH KHOẢNG TRỐNG DỮ LIỆU (GAP ANALYSIS)
*Dữ liệu nằm ở đâu và tại sao chúng ta chưa dùng được?*

**1. Xác định "Data Exhaust" (Dữ liệu khí thải):**
Người dùng đang tạo ra giá trị mà hệ thống đang lãng phí:
*   **Manual Overrides:** Khi Auto-fill điền "A", người dùng sửa lại thành "B". -> *Đây là tín hiệu học quan trọng nhất.*
*   **New Entities:** Người dùng nhập một Địa danh/Tên gọi chưa từng có trong DB.
*   **Repeat Patterns:** Người dùng lặp lại một thao tác sửa lỗi nhiều lần (Ví dụ: Luôn viết hoa tên huyện cụ thể).

**2. Rào cản kỹ thuật (Technical Blockers):**
*   **Rigid Schema:** Cấu trúc dữ liệu hiện tại (JSON/CSV) có cho phép thêm trường mới (dynamic fields) mà không sửa code parser không?
*   **Lack of Persistence:** Hiện tại dữ liệu có được lưu lại sau khi tắt ứng dụng không? (Local Storage, File JSON, hay Database?). Nếu chỉ in-memory -> Không thể học.
*   **Missing Feedback Loop:** Chưa có cơ chế để UI gửi ngược tín hiệu "User đã sửa cái này" về cho Logic Layer.

---

## BƯỚC 3: ĐÁNH GIÁ RỦI RO (RISK ASSESSMENT)
*Mở cửa cho dữ liệu người dùng đồng nghĩa với việc mở cửa cho sự hỗn loạn.*

**1. Rủi ro "Data Poisoning" (Ngộ độc dữ liệu):**
*   Nếu user nhập sai chính tả và hệ thống "học" cái sai đó -> Lần sau hệ thống sẽ tự động điền sai cho tất cả mọi người (hoặc cho chính user đó).
*   *Hệ quả:* Automation trở nên "ngu" đi thay vì thông minh hơn.

**2. Rủi ro Hiệu năng (Performance Degrade):**
*   Thay vì tra cứu Dictionary tĩnh (O(1)), hệ thống phải query dynamic data, merge dữ liệu, xử lý conflict.
*   Với số lượng rule người dùng tạo ra tăng lên hàng nghìn, tốc độ xử lý có bị chậm đi không?

**3. Rủi ro Xung đột Logic (Conflict Rules):**
*   Rule của Hệ thống nói A.
*   Rule của User nói B.
*   Ai thắng? Cơ chế giải quyết xung đột (Conflict Resolution Strategy) hiện tại có chưa?

---

## BƯỚC 4: ĐỀ XUẤT MÔ HÌNH MỞ RỘNG (STRATEGY PROPOSAL)
*Chọn mô hình phù hợp, không over-engineering.*

Tôi đề xuất tiếp cận theo mô hình **"Layered Data Augmentation"** (Tăng cường dữ liệu phân lớp), thay vì Plugin hay Scripting phức tạp.

**Mô hình đề xuất:**
1.  **Core Layer (Read-only):** Dữ liệu chuẩn của thư viện. Luôn đúng, độ tin cậy cao.
2.  **User Layer (Read-Write):** Một file/database riêng biệt chứa các "Override" hoặc "Addition" của user.
3.  **Runtime Merger:** Khi chạy, Engine sẽ load Core, sau đó đè (overlay) User Layer lên trên.

**Các cơ chế cụ thể:**
*   **Dictionary Extension:** Cho phép user thêm từ điển (Ví dụ: Thêm từ viết tắt địa chỉ mới).
*   **Pattern Learning (Template):** Cho phép user lưu một form đã điền làm "Mẫu" để tái sử dụng (Snapshot learning).
*   **Correction Memory:** Ghi nhớ các cặp [Input -> User Correction] để gợi ý cho lần sau.

*Trade-off:*
*   **Ưu điểm:** An toàn tuyệt đối cho Core code. Dễ dàng Reset (chỉ cần xóa User Layer).
*   **Nhược điểm:** Chỉ mở rộng được dữ liệu, không mở rộng được thuật toán xử lý.

---

## BƯỚC 5: ROADMAP TRIỂN KHAI (EXECUTION ROADMAP)

Dựa trên đánh giá, đây là lộ trình 3 pha để nâng cấp thư viện:

### Pha 1: Instrumentation (Gắn cảm biến) - 2 tuần
*Mục tiêu: Chưa học gì cả, chỉ quan sát và thu thập.*
*   **Task:** Xây dựng cơ chế "Capture Event" tại UI. Khi user sửa dữ liệu auto-fill -> Log lại sự kiện đó (Input gốc là gì? User sửa thành gì?).
*   **Output:** Log file hoặc Report cho thấy hành vi sửa lỗi của user.
*   **Quyết định:** Dựa trên report, xác định xem user đang sửa cái gì nhiều nhất để ưu tiên làm tính năng học cái đó.

### Pha 2: Local Dictionary Extension (Mở rộng Tĩnh) - 4 tuần
*Mục tiêu: Cho phép user thêm dữ liệu đơn giản.*
*   **Task:** Tách file cấu hình (ví dụ `abbreviations.json`, `venues.json`) ra khỏi code lõi. Cho phép load thêm file `user_custom.json`.
*   **Guardrails:** Validate chặt chẽ format JSON của user. Nếu lỗi -> Bỏ qua và dùng Core.
*   **UI:** Một giao diện setting đơn giản để user nhập thêm từ khóa.

### Pha 3: Passive Learning (Học thụ động) - Tương lai
*Mục tiêu: Hệ thống tự đề xuất lưu rule.*
*   **Task:** Khi phát hiện user sửa dữ liệu (từ Pha 1), hệ thống hiển thị popup: *"Bạn có muốn tôi nhớ cách sửa này cho lần sau không?"*.
*   **Mechanism:** Nếu User đồng ý -> Ghi vào `user_custom.json` (của Pha 2).

---

## KẾT LUẬN & ĐÁNH GIÁ SẴN SÀNG

**Đánh giá hiện tại:**
Thư viện của bạn đang ở mức **Level 1 (Static Automation)**.
Kiến trúc Hexagonal hiện tại là một lợi thế lớn (Domain tách biệt), giúp việc chèn thêm `UserDataProvider` vào `Application Layer` khá dễ dàng mà không phá vỡ Logic.

**Điều kiện tiên quyết để bắt đầu (Go/No-Go Criteria):**
1.  Code phải tách biệt hoàn toàn Logic và Data (Hard-coded string trong code logic là Blocker).
2.  Phải có cơ chế định danh dữ liệu (ID) ổn định để map giữa Core và User data.
3.  Chấp nhận việc xây dựng thêm một tầng "Data Merger" trung gian.

**Khuyến nghị:** Bắt đầu ngay **Pha 1 (Instrumentation)**. Đừng xây dựng tính năng "Học" vội cho đến khi bạn nhìn thấy log dữ liệu và biết user thực sự cần hệ thống học cái gì.