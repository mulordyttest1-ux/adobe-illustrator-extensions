# 🏛️ MONOREPO GOVERNANCE
> **Context:** Adobe Illustrator Extensions (CEP)
> **Managed By:** Antigenic AI Agent
> **Status:** Active Nx Monorepo (Zero Cyclomatic Complexity Violations)

---

## 🏗️ Structure Overview (Hexagonal Nx Workspace)

| Path | Description | Tech Stack |
| :--- | :--- | :--- |
| `libs/wedding/domain` | **[PORT]** Core Business Logic (L1-L3) | Typescript/ES6 (Framework Agnostic) |
| `wedding-cep/` | **[ADAPTER]** Legacy Wedding Scripter Extension | JS (ES6) + JSX (ES3) |
| `symbol-cep/` | **[ADAPTER]** Future React/Modern Extension | TS/JS |
| `.agent/` | AI Brain, Memory, Governance, Workflows | Markdown + JSON |
| `shared/` | Shared Tooling (ESLint Nx Boundaries) | Node.js Flat Config |

---

## 🛑 Critical Rules (Luật Bất Biến)

1.  **Strict Hexagonal Layering (Enforced via Nx):**
    -   **Domain (`libs/wedding/domain`):** Pure Logic, No CEP/UI dependencies.
    -   **Adapter (`wedding-cep` / `symbol-cep`):** Connect Domain to UI & ExtendScript.
    -   **Nghiêm cấm:** `libs` không bao giờ được import ngược lên các module CEP. Nx `@nx/enforce-module-boundaries` sẽ chặn lỗi này.

2.  **Code Standards:**
    -   **ES3 Compatibility:** Tất cả file `.jsx` (ExtendScript) phải tương thích ES3 (dùng `var`, không arrow func). Đã có pre-commit hook giám sát.
    -   **File Size & Complexity:** **MAX 200 LOC/file** và Cyclomatic Complexity <= 12. Nếu vượt quá -> Refactor ngay lập tức. Cấm tuyệt đối God Classes.
    -   **Naming Convention:** Biến và hàm *phải* tuân thủ `camelCase` (trừ properties của object). Giám sát bởi ESLint.
    -   **Human Loop (Vòng Lặp Người-Máy):** Tuyệt đối KHÔNG ĐƯỢC tự ý gõ code viết tính năng mới, sửa Regex, UX, Architecture, Refactor hay làm bất cứ tác vụ thay đổi logic nào nếu CHƯA CHỜ User duyệt Bảng Kế Hoạch (`implementation_plan`). Nguyên tắc: **Mọi task đều phải lên Plan -> Xin Duyệt -> Mới được Code.**

3.  **Security:**
    -   Không hardcode secrets.
    -   Luôn có CSP trong `index.html`.

---

## 🧠 Agent Protocol

### 1. Workflows (Dùng lệnh Slash Command)
Agent sử dụng các quy trình chuẩn trong `.agent/workflows/`:
-   `/pre-flight`: Kích hoạt trước khi viết code (Context check & Sanity check).
-   `/lint`: Chạy ESLint để kiểm tra Architecture Boundary & Naming.
-   `/feature_development`: Quy trình chuẩn để build feature / module mới.
-   `/safe_refactor`: Quy trình chia nhỏ file / refactor an toàn cho ExtendScript.

### 2. Knowledge Base
-   `memory/skills/`: Kỹ năng chuyên môn (CEP, Hexagonal, Nx).
-   `memory/planning/`: Các bản kế hoạch kiến trúc lưu trữ.

### 3. Scripts
Các script tiện ích nằm tại `.agent/scripts/` / `package.json`:
-   `create_symlink.ps1`: Tạo link vào Adobe Extensions folder.
-   `npm run build:wedding`: Build bằng esbuild module.

---

## 🔄 Git Hooks (`hooks.json`)
Hệ thống tự động kiểm tra:
1.  **Pre-Commit:** Chặn ES6 syntax trong file `.jsx`.
2.  **Linting:** Đảm bảo Architecture Boundaries từ ESLint.

---

*(c) 2024-2026 DinhSon. Nx Monorepo Governance.*
