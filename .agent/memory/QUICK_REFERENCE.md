# 🚀 MONOREPO QUICK REFERENCE
> **Context:** Agent Knowledge Base (Monorepo Edition)
> **Updated:** 2026-02-24
> **Governance:** [See GOVERNANCE.md](../GOVERNANCE.md)

---

## 🗺️ PROJECT MAP

| Project | Folder | Type | Status |
| :--- | :--- | :--- | :--- |
| **Monorepo Root** | `./` | Workspace | Active |
| **Wedding CEP** | `wedding-cep/` | Extension | Legacy/Refactoring |
| **Symbol CEP** | `symbol-cep/` | Extension | **Clean Architecture** |
| **Shared** | `shared/` | Libs | Active |

---

## 🔥 CRITICAL PROTOCOLS

### 1. Architecture (Hexagonal)
- **Domain (L1):** Pure Logic (Calculations, Entities). **NO** UI, **NO** CEP/JSX deps.
- **Application (L4):** Use Cases (Orchestration).
- **Adapters (L5):** Interface Implementations (IllustratorAdapter).
- **Infrastructure (L6/L7):** UI (React/HTML), Disk, Network.

### 2. Tech Stack Boundaries
| Layer | Technology | Allowed Syntax |
| :--- | :--- | :--- |
| **CEP (UI/Logic)** | Node.js (V8) | **ES6+** (Class, Arrow, Const/Let) |
| **Host (Illustrator)**| ExtendScript | **ES3 ONLY** (`var`, `function`, `evalFile`) |

### 3. Workflow Shortcuts
- `npm run lint:all` : Check code quality.
- `npm run build:wedding` : Build legacy extension.

---

## 🧩 DOMAIN KNOWLEDGE

### Symbol CEP (Imposition)
- **Goal:** Sắp xếp đối tượng (Symbol) lên trang in (Sheet) theo lưới (Grid) hoặc giải thuật.
- **Key Concepts:** `Sheet`, `Frame` (vùng in), `N-Up` (số lượng con), `Margin` (lề).
- **Flow:** Config UI → ConfigEngine → Rules → JSX → Illustrator Layout.

### Wedding CEP (Cards)
- **Goal:** Điền thông tin thiệp cưới tự động.
- **Key Concepts:** `Groom/Bride`, `Date`, `Venue`, `Guest List`.
- **Legacy:** Đang chuyển đổi từ Monolith sang Hexagonal.

---

## 📚 ACTIVE SKILLS (Memory)
- **[Hexagonal_Rules](skills/Hexagonal_Rules/SKILL.md)**: Quy tắc phân lớp.
- **[Code_Style_Standard](skills/Code_Style_Standard/SKILL.md)**: Naming convention.
- **[ES3_ES6_Boundary](skills/ES3_ES6_Boundary/SKILL.md)**: Tránh syntax error.

---

## 🛠️ TROUBLESHOOTING
- **Panel Trắng?** → Check `localhost:9088` (Symbol) hoặc `9097` (Wedding).
- **CSInterface undefined?** → Check `index.html` script loading order.
- **"EvalScript error"?** → Check ES6 syntax leakage in `.jsx` files.