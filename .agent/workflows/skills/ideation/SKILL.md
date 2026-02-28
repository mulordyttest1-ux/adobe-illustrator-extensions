---
name: Ideation Protocol
description: Phân tích & làm rõ ý tưởng. Load khi D1≥3 hoặc task mới hoàn toàn. Skip khi fix bug nhỏ, lint, typo.
version: 1.2
last_updated: 2026-02-26
---

# Skill: Ideation Protocol

> Trigger: §I0 gate (D1≥3 hoặc task mới hoàn toàn).
> Output: Ideation Report → Input cho §C1 RECON.
> Bypass: User gõ `/skip_ideation` HOẶC D1<3.

## §I1 — PROBLEM DECOMPOSITION (Phân tách bài toán)
- [ ] Tách yêu cầu cốt lõi thành 2-5 bài toán nhỏ
- [ ] Xác định ràng buộc cứng: tech stack, ES3/ES6, layer rules, file limit
- [ ] Xác định ẩn số: điều gì chưa rõ cần hỏi User?

Output: Danh sách sub-problems + constraints + unknowns.

## §I2 — COMMUNITY WISDOM & BENCHMARKING (BẮT BUỘC)
- [ ] **BẮT BUỘC** dùng `search_web` để "khảo sát thị trường". Trên mạng/cộng đồng người ta đang thiết kế/giải quyết bài toán tương tự như thế nào? Có UX/Pattern nào xịn hơn ý tưởng ban đầu của User không?
- [ ] **Best Practices:** Tiêu chuẩn công nghiệp cho bài toán này?
- [ ] **Anti-patterns:** Cách nào NGHE HAY nhưng đã THẤT BẠI? Tại sao?
- [ ] **Edge Cases:** Tình huống ngoại lệ hay bị bỏ quên?
- [ ] **Technical Debt:** Nếu chọn cách nhanh nhất, hệ quả dài hạn?

> 🔴 **ANTI-SYCOPHANCY (Chống nịnh hót):**
> Khi User gợi ý một giải pháp cụ thể (Solution A), Agent BẮT BUỘC:
> 1. Search **`"[Solution A] drawbacks"` hoặc `"[Solution A] vs alternatives"`**.
> 2. Trong Plan nộp cho User, mục đầu tiên phải là: **"Điểm yếu/rủi ro của hướng Sếp gợi ý: ..."** trước khi được phép liệt kê ưu điểm.
> 3. Nếu cộng đồng có giải pháp tốt hơn → BẮT BUỘC đưa vào Options (§I3) kèm so sánh trực tiếp với Solution A.

Source: **BẮT BUỘC dùng `search_web`** thay vì chỉ dựa vào Parametric Memory.

## §I3 — STRATEGY SELECTION & OPTIONS (Chọn hướng tiếp cận)
- [ ] Từ kết quả §I2, Agent PHẢI tóm tắt lại và đề xuất **2-3 Phương án (Options)** khác nhau để giải quyết bài toán.
- [ ] Mỗi phương án: 1 dòng mô tả + Ưu/Nhược điểm (Trade-offs).
  - *VD: Option A (làm y như sếp), Option B (dùng thư viện ngoài nhanh hơn), Option C (UX xịn hơn).*
- [ ] Chọn hướng TỐI ƯU theo đánh giá của Agent.
- [ ] **⛔ DỪNG LẠI:** Trình bày các Options cho User. Chờ User chốt Phương án rồi mới lập Implementation Plan.
- [ ] Nếu không chắc → Hỏi User trước khi chọn

Output: Bảng so sánh + Hướng đã chọn + Lý do.

## §I4 — CHECKPOINT (Điểm kiểm tra trước khi tiến hành)
- [ ] Hướng đã chọn có vi phạm constraints từ §I1 không?
- [ ] Có edge case nào từ §I2 chưa được cover không?
- [ ] User đã approve hướng đi chưa? (nếu D1≥4)

✅ PASS → Tiến hành §C0 AUTO-ROUTE → §C1 RECON.
❌ FAIL → Quay lại §I1 hoặc hỏi User.
