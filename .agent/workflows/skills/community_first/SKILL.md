---
name: Community First (RAG-inspired)
description: Trọng tâm của toàn bộ Pipeline. BẮT BUỘC cho MỌI task (D1=1→D1=5). Chống Parametric Hallucination bằng tra cứu cộng đồng.
version: 1.2
last_updated: 2026-02-26
---

# Skill: Community First ⛔

> 🦁 **"Sư tử vồ thỏ cũng phải dùng hết sức."**
> MỌI task, dù nhỏ nhất, đều PHẢI chạy skill này. Không ngoại lệ.
> §C1 trong `core_protocol.md` là entry point. File này là bản FULL.

---

## Tại sao đốt token ở đây?

### Parametric Memory vs RAG

| Cách tiếp cận | Mô tả | Rủi ro |
|:-------------|:------|:-------|
| **Parametric Memory** | LLM tự suy luận từ data huấn luyện | Hallucination, phát minh lại bánh xe, lệch kiến trúc |
| **RAG (Retrieval-Augmented)** | Tra cứu → Tổng hợp → Tinh chỉnh | Token cost lên nhưng accuracy tăng mạnh |

### 3 điểm mù chí mạng mà Community Check giải quyết

1. **Knowledge Cutoff:** LLM chỉ biết data đến ngày training. API thay đổi tháng trước → kế hoạch "chết" từ dòng đầu.
2. **Edge Cases / "Vết xe đổ":** Con người & LLM thường chỉ nghĩ Happy Path. Cộng đồng = những người đã thất bại và chia sẻ bài học.
3. **Chi phí suy luận:** Tra cứu 500-1000 token → agent chuyển từ **sáng tạo** sang **tổng hợp & tinh chỉnh**. Rẻ hơn 3-10x so với tự suy luận rồi sửa.

### ROI thực tế từ dự án này

| Case | Không có Community Check | Có Community Check |
|:-----|:------------------------|:-------------------|
| [Complex UI Interaction Bug] | Sửa thử sai nhiều lần = tốn kém token | Search "[specific technical symptom]" → 1 lần chuẩn |
| [New Architectural Pattern] | Tự thiết kế sai chuẩn / anti-pattern | Search "[feature] best practice" → đúng hướng từ đầu |

---

## Pipeline: 5 bước (DEFINE → SEARCH → EXTRACT → ALIGN → RECON)

### Step 0: DEFINE + QUERY EXPANSION

**Mục đích:** Xác định rõ BÀI TOÁN trước khi search. Câu hỏi mơ hồ = kết quả rác.

**Cách làm:**
1. Viết **1 câu tiếng Anh** mô tả BÀI TOÁN (không phải solution)
   - ✅ "[Technical symptom] between [Component A] and [Event/State] in [Framework/Language]"
   - ❌ "How to fix [Component]" (quá mơ hồ)

2. Từ câu đó, mở rộng thành **2-3 search queries** ở các góc nhìn khác nhau:
   - **(1) Góc kỹ thuật:** Thuật ngữ chính xác của bài toán
     - VD: `"[Technical terms] [Architecture pattern] [Language/Engine]"`
   - **(2) Góc UX/Pattern:** Best practice ở góc người dùng
     - VD: `"[Feature/Interaction] accessibility/UX best practice"`
   - **(3) Góc niche/stack:** Nếu bài toán liên quan đến stack cụ thể
     - VD: `"[Specific Framework/Library] [Component/API] [Issue]"`
   
   > 🔴 **ANTI-TUNNEL-VISION (Khi Fix Bug):** 
   > Nếu task là fix bug/error recovery, **CẤM** search theo 1 giả thuyết duy nhất bị cố chấp. Phải bung query theo 3 giả thuyết độc lập (Nông → Sâu).
   > - *VD khi UI không lên:* `"[Platform] [View] blank"` (Chung) / `"[CSS Framework] layout rendering bug"` (Giả thuyết Styling) / `"[Runtime Engine] cache invalidation"` (Giả thuyết Môi trường).

3. Nếu D1≥3 và đã chạy §I1 (Ideation) → dùng output §I1 làm input

### Step 1: SEARCH + LỌC NHIỄU (Retrieve & Rerank)

**Mục đích:** Truy xuất cộng đồng, loại bỏ nhiễu.

**Cách làm:**
1. `search_web` với 2-3 queries từ Step 0
2. **SAU KHI có kết quả → LỌC NHIỄU (Attention Dilution Prevention):**

   | Giữ ✅ | Bỏ ❌ |
   |:-------|:------|
   | Official docs, Verified forums (top answers) | Dự án dùng [Stack A] nhưng ví dụ ở [Stack B] |
   | GitHub Issues, Foundation specs | Nguồn không chính thống, comment đùa cợt |
   | Bài viết có date gần nhất (1-2 năm đổ lại) | Nguồn quá cũ / Outdated API |
   | Code examples match stack hiện tại | Code dùng công nghệ/version không liên quan |

3. **Fallback cho bài toán ngách/legacy system (Niche/Legacy):**
   - Search 1: niche query → 0 kết quả?
   - Search 2: mở rộng sang "vanilla JS equivalent"
   - Vẫn 0 → ghi "Niche, no community data" → tự giải quyết có ghi chú rõ

### Step 2: EXTRACT (Synthesis — Tổng hợp tinh hoa)

**Mục đích:** Chắt lọc 2-3 findings CỐT LÕI từ kết quả search. Không copy paste nguyên bài.

**Bắt buộc trích các loại sau:**
- [ ] **Best practice:** Cộng đồng làm thế nào? Standard solution là gì?
- [ ] **Anti-pattern / Pitfall:** Cách nào TƯỞNG ĐÚNG nhưng SAI? *(bắt buộc, chống confirmation bias)*
- [ ] **Edge case & Silly mistakes:** Tình huống ngoại lệ hay bị quên? Có ai từng mắc lỗi sơ đẳng (như sai đường dẫn, thiếu file, sai quyền đọc ổ đĩa) gây ra lỗi y hệt không? *(Tránh suy nghĩ quá phức tạp)*

**Ví dụ output Step 2:**
```
EXTRACT:
1. Best: Dùng mousedown + preventDefault trên item, giữ blur trên input (W3C combobox pattern)
2. Anti: Dùng setTimeout(200) trên blur → race condition trên slow devices (SO #12345)
3. Edge: Tab key phải đóng list nhưng vẫn chuyển focus sang ô tiếp theo
```

### Step 3: ALIGN (So sánh approach vs community)

**Mục đích:** Kiểm tra hướng giải quyết dự kiến có KHỚP với cộng đồng không.

| Kết quả | Hành động |
|:--------|:----------|
| **KHỚP** | Ghi "Aligned with [source]", tiến hành |
| **LỆCH** | ⛔ DỪNG. Giải thích tại sao đi khác. Điều chỉnh hoặc xin User confirm |
| **Community dùng syntax/version mới** | Ghi chú "[Version constraint] compatibility?" trước khi áp dụng |
| **Không có community data** | Ghi "Niche path, self-reasoning with caution" |
| **User đã gợi ý hướng đi** | ⚠️ Counterfactual Check: search drawbacks của hướng User. Nếu cộng đồng có hướng tốt hơn → BÁO thẳng, KHÔNG nịnh. |

### Step 4: Codebase Recon

-   [ ] Đọc `GOVERNANCE.md`, `types.d.ts`, `DEPENDENCY_MAP.md` (nếu liên quan)
-   [ ] Tư duy mở rộng: đề xuất thêm case user chưa nghĩ tới

---

## Hard Rules ⛔

> ⛔ Agent KHÔNG ĐƯỢC nhảy vào code nếu chưa hoàn thành Step 0–3.
> Suy luận cá nhân mà không kiểm chứng = **Parametric Hallucination**.
> Định hướng đúng > tốc độ. Đi đúng đường 1 lần > chạy sai 3 lần.

## Compliance Receipt Line

Sau khi hoàn thành, ghi vào §C6:
```
§C1: ✅ DEFINE="[1 câu]" | SEARCH=[N queries] | EXTRACT=[N findings] | ALIGN=[Khớp/Lệch]
```
