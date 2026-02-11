# UX Input Enhancement Plan

Nâng cấp lớp UX (`cep/js/logic/ux/`) với hệ thống 3-tier validation.

---

## 🎯 Mục tiêu

| Tier | Hành vi | Ví dụ |
|------|---------|-------|
| **AUTO** | Tự động sửa, không hỏi | Viết hoa chữ cái đầu, chuẩn hóa TP/Q/P |
| **WARNING** | Highlight đỏ, cho phép | Ngày lễ > ngày tiệc, định dạng địa chỉ lạ |
| **MANUAL** | Không normalize | Tên đặc biệt có viết hoa giữa |

---

## 📂 Architecture

```
logic/ux/
├── core/
│   ├── UnicodeNormalizer.js    # NFC normalization
│   └── PatternMatcher.js       # Regex helper
├── normalizers/
│   ├── NameNormalizer.js       # Tên riêng
│   ├── AddressNormalizer.js    # Địa chỉ
│   └── DateNormalizer.js       # Ngày tháng
├── validators/
│   ├── NameValidator.js        # Cảnh báo tên
│   ├── AddressValidator.js     # Cảnh báo địa chỉ
│   └── DateValidator.js        # Cảnh báo ngày
├── InputEngine.js              # Orchestrator
└── constants/
    ├── abbreviations.js        # TP, Q, P, KTX...
    └── patterns.js             # Regex patterns
```

---

## 📋 Rules by Field Type

### 1. NAME (Tên riêng)

**AUTO:**
| Rule | Input | Output |
|------|-------|--------|
| Title Case | `nguyễn văn a` | `Nguyễn Văn A` |
| Trim spaces | `  Nguyễn   ` | `Nguyễn` |

**WARNING:**
| Condition | Message |
|-----------|---------|
| Chỉ có 1 từ | "Tên quá ngắn?" |
| Có số | "Tên chứa số?" |
| Pattern lạ | "Có thể sai chính tả?" |

**MANUAL:** Checkbox "Giữ nguyên" → skip normalize

---

### 2. ADDRESS (Địa chỉ)

**AUTO:**
| Rule | Input | Output |
|------|-------|--------|
| Abbreviation expand | `TP.HCM` | `Thành phố Hồ Chí Minh` |
| Abbreviation expand | `Q.1` | `Quận 1` |
| Abbreviation expand | `P. Bến Nghé` | `Phường Bến Nghé` |
| Fix dash spacing | `15-Lý Thường` | `15 - Lý Thường` |
| Multiple commas | `A,,B` | `A, B` |
| Trailing punctuation | `địa chỉ,` | `địa chỉ` |

**WARNING:**
| Condition | Message |
|-----------|---------|
| Có cả `,` và `-` | "Định dạng hỗn hợp" |
| Dash không có space | "Thiếu space sau gạch" |
| Quá ngắn (<10 ký tự) | "Địa chỉ quá ngắn?" |

---

### 3. DATE (Ngày tháng)

**AUTO:**
| Rule | Input | Output |
|------|-------|--------|
| Pad zero | `5` | `05` |
| Extract from string | `ngày 15` | `15` |

**WARNING:**
| Condition | Message |
|-----------|---------|
| Ngày > 31 | "Ngày không hợp lệ" |
| Tháng > 12 | "Tháng không hợp lệ" |
| Lễ > Tiệc | "Lễ sau Tiệc?" |
| Nhập > Tiệc | "Nhập sau Tiệc?" |

---

## 🔧 Constants Reference

### Abbreviations
```javascript
const ABBREVIATIONS = {
  'TP': 'Thành phố', 'Q': 'Quận', 'P': 'Phường',
  'X': 'Xã', 'H': 'Huyện', 'TT': 'Thị trấn', 'TX': 'Thị xã',
  'Đ': 'Đường', 'KP': 'Khu phố', 'AP': 'Ấp', 'SN': 'Số nhà',
  'KTX': 'Ký túc xá', 'TDP': 'Tổ dân phố', 'NV': 'Nhà văn hóa'
};
```

---

## 🚀 Phased Implementation

| Phase | Tasks |
|-------|-------|
| **1. Core** | UnicodeNormalizer, constants |
| **2. Normalizers** | Name, Address, Date AUTO rules |
| **3. Validators** | WARNING rules |
| **4. Integration** | Hook vào CompactFormBuilder, visual feedback |

---

## ⚠️ User Decisions Required

1. **Manual Mode UI**: Checkbox "Giữ nguyên" đặt ở đâu?
2. **Abbreviation expansion**: Có thể làm text dài hơn - kiểm tra layout

---
---

# 🔮 PHẦN 2: KẾ HOẠCH v2.0 (Smart UX Enhancement)

> **Vision:** Chuyển từ "Công cụ nhập liệu" → "Trợ lý thiết kế"

---

## 🧠 1. Advanced Name Context (Trí tuệ hóa Phân tích Tên)

### Nhận diện văn hóa
| Văn hóa | Keywords | Đặc điểm |
|---------|----------|----------|
| **Tây Nguyên** | Ksor, H'Arn, R'com, Y', K' | Họ đứng đầu |
| **Việt Nam** | Văn, Thị, Nguyễn, Trần | Tên đứng cuối |
| **Nước ngoài** | John, Mary, David, Sarah | Tên đứng đầu |

### Auto-Indexing
```javascript
// Tự động tính split_idx
const AUTO_INDEX = {
  'vietnam': 0,      // Lấy từ cuối: "Nguyễn Văn A" → "A"
  'highland': 1,     // Lấy từ đầu: "Ksor Hin" → "Hin"
  'foreign': 1       // Lấy từ đầu: "John Smith" → "John"
};
```

### Database Structure
```
data/
├── culture_keywords.json    # Từ khóa nhận diện văn hóa
└── name_patterns.json       # Pattern tên theo vùng
```

---

## 📍 2. Contextual Geo-Fencing (Gợi ý Địa chỉ)

### Venue Memory
| Input | Auto-suggest |
|-------|--------------|
| `p. tân lập` | `P. Tân Lập, TP. Buôn Ma Thuột, Đắk Lắk` |
| `xã ea tu` | `X. Ea Tu, H. Cư M'gar, Đắk Lắk` |

### Database Structure (Offline-First)
```
data/
├── geo/
│   ├── daklak_phuong.json      # Phường/Xã Đắk Lắk
│   ├── daklak_quan.json        # Quận/Huyện Đắk Lắk
│   ├── venues_popular.json     # Nhà hàng, khách sạn thường gặp
│   └── streets_common.json     # Đường phổ biến
└── ngay.csv                    # (Existing) Lịch âm dương
```

### Cơ chế học
```
[User nhập] → [Validate] → [Preflight Check ✓] → [Save to Database]
                                    ↓
                           Nút "Lưu địa chỉ mới"
```

---

## 🏗️ v2.0 Architecture (Mở rộng)

```
logic/ux/
├── core/                       # ← v1.0
├── normalizers/                # ← v1.0
├── validators/                 # ← v1.0
├── InputEngine.js              # ← v1.0
├── constants/                  # ← v1.0
│
├── intelligence/               # ← v2.0 NEW
│   ├── NameCultureDetector.js  # Nhận diện văn hóa tên
│   ├── GeoSuggester.js         # Gợi ý địa chỉ
│   └── PreflightValidator.js   # Validate trước khi in
│
└── data/                       # ← v2.0 NEW (Offline DB)
    ├── culture_keywords.json
    ├── geo/
    └── learned_venues.json     # User-contributed data
```

---

## 🚀 v2.0 Phased Roadmap

| Phase | Features | Priority |
|-------|----------|----------|
| **v1.0** | 3-tier validation, normalization | **NOW** |
| **v2.1** | Advanced Name Context | Medium |
| **v2.2** | Geo-Fencing (Đắk Lắk focus) | Medium |
| **v2.3** | Preflight Check trước in | Low |
| **v2.4** | Learning mechanism | Future |

---

## 📋 Data Collection Plan

### culture_keywords.json (Sample)
```json
{
  "highland": ["Ksor", "H'", "Y'", "K'", "R'com", "Êban", "Niê"],
  "vietnam": ["Văn", "Thị", "Nguyễn", "Trần", "Lê", "Phạm"],
  "foreign": ["John", "Mary", "David", "Michael", "Sarah"]
}
```

### daklak_phuong.json (Sample)
```json
[
  { "name": "Tân Lập", "type": "P", "district": "TP. Buôn Ma Thuột" },
  { "name": "Ea Tu", "type": "X", "district": "H. Cư M'gar" }
]
```

---

## ⚠️ v2.0 Technical Considerations

> [!IMPORTANT]
> **Offline-First**: Tất cả data phải load được từ local JSON, không phụ thuộc internet.

> [!WARNING]
> **Data Accuracy**: Cần verify dữ liệu địa danh trước khi add vào database.

> [!NOTE]
> **Learning Loop**: Preflight ✓ → Confirm → Save to learned DB → Available for next time.
