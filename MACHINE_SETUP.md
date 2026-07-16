# Machine Migration Kit

Bộ công cụ này dựng lại môi trường development Windows từ Git, một archive mã hóa và checklist có chủ đích. Nó không sao chép token, phiên đăng nhập, font bản quyền, Adobe binaries hoặc toàn bộ Illustrator preferences.

## Nguồn chuẩn

- Git repository: code và product asset đã review.
- Archive 7-Zip AES-256: staged/unstaged/untracked worktree chưa phân loại cùng inventory.
- Private `codex-workstation-config`: config Codex portable, ba custom skill, rules và plugin manifest.
- Password manager: mật khẩu archive. Không lưu mật khẩu trong repo hoặc cùng archive.
- Drive mã hóa: archive và asset local lớn; không dùng như lịch sử source code.

## Yêu cầu máy mới

- Windows 10/11, Git for Windows và 7-Zip.
- Node.js 24 LTS kèm npm 11. Repo có `.nvmrc` và chặn ngoài khoảng version bằng `engines`.
- Adobe Creative Cloud với Illustrator 2025 và 2026 đã cài/đăng nhập.
- Quyền sử dụng các font cần cho template khách hàng.
- Codex Desktop/CLI; đăng nhập và authorize connector lại trên máy mới.

Kiểm tra nhanh:

```powershell
node --version
npm --version
git --version
7z i
```

## Backup máy cũ

Trước khi backup, review `git status`; tuyệt đối không chạy `git add -A` chỉ để làm sạch màn hình. Chạy:

```powershell
npm run backup:machine -- --destination "I:\My Drive\DeveloperBackups\adobe-illustrator-extensions"
```

Script sẽ:

- tạo `repo.bundle` chứa refs/objects;
- tạo binary patch riêng cho index và working tree;
- chép untracked non-ignored và asset allowlist;
- ghi inventory tool, Illustrator, font và Codex không chứa credentials;
- dừng nếu tên file hoặc nội dung trông giống secret;
- loại cache, logs, sessions và SQLite machine-local;
- tạo archive 7z với AES-256, mã hóa filename, chạy `7z t` và ghi `.sha256` sidecar.

Nếu không đặt `MACHINE_BACKUP_PASSWORD`, 7-Zip sẽ hỏi mật khẩu tương tác. Cách này tránh lưu password trong shell history. Nếu chạy trong automation tạm thời, có thể đặt biến môi trường trong đúng process rồi xóa ngay; không ghi nó vào profile hoặc `.env`.

Git bundle không chứa index, working tree hay untracked files. Vì vậy không được xóa các patch/payload khỏi archive.

## Setup máy mới từ clean clone

```powershell
git clone <private-or-public-repo-url> adobe-illustrator-extensions
cd adobe-illustrator-extensions
npm run setup:dev -- --codex-config C:\Projects\codex-workstation-config
```

`setup:dev` thực hiện theo thứ tự:

1. kiểm tra Windows, Git, Node 24/npm 11, Illustrator 2025/2026 và product template;
2. chạy `npm ci` và cài Git hooks;
3. chạy `npm run verify`;
4. bật `PlayerDebugMode=1` chỉ tại `HKCU\Software\Adobe\CSXS.11` và `CSXS.12`;
5. tạo sáu wrapper bằng `npm run install:cep-live-links`;
6. gọi `install.ps1` của private Codex config nếu truyền `--codex-config`;
7. chạy doctor cuối.

Các chế độ chẩn đoán:

```powershell
npm run setup:dev -- --dry-run
npm run setup:dev -- --skip-verify
npm run doctor:dev
npm run doctor:dev -- --json
```

`doctor:dev` trả exit `0` nếu không có `FAIL`, `1` nếu thiếu requirement và `2` nếu CLI hoặc script lỗi. Wrapper `.panel.dev` legacy và debug port đóng chỉ là `WARN`.

## Restore worktree chưa phân loại

Target phải chưa tồn tại hoặc là thư mục rỗng:

```powershell
npm run restore:machine -- --archive "D:\Backups\adobe-illustrator-extensions-YYYYMMDD-HHMMSS.7z" --target C:\Projects\adobe-illustrator-extensions-restored
```

Restore sẽ clone bundle, apply staged patch vào index, apply unstaged patch vào working tree, copy untracked/assets và so sánh chính xác phần tracked cùng danh sách untracked đã được phép đưa vào manifest. Cache/log/session/SQLite bị loại có chủ đích nên không được kỳ vọng xuất hiện ở target. Nếu contract status khác, script dừng và không tuyên bố thành công.

Không restore đè vào worktree đang có dữ liệu. Sau khi kiểm tra archive ở thư mục tạm, review thay đổi thành các commit có mục đích; không push snapshot hỗn hợp lên remote public.

## Adobe, font và preferences

- Setup không cài Adobe, không phục hồi license, không copy font hoặc application binary.
- Font backup chỉ là inventory filename. Restore các font có giấy phép rồi chạy doctor với `--font-inventory <fonts.json>`.
- Actions, workspaces, keyboard shortcuts và preset chỉ được inventory để người dùng chọn khôi phục thủ công.
- Illustrator 2020 nằm ngoài phạm vi; kit chỉ hỗ trợ 2025/2026.
- Không tự xóa wrapper legacy. Đóng Illustrator và xóa thủ công sau khi xác nhận không còn cần.

## Codex

Private config installer chỉ mang theo cài đặt portable, custom skills, rules và danh sách plugin. Nó loại `auth.json`, SQLite, sessions, logs, cache, project trust, bundled MCP path tuyệt đối và notify machine-local.

Trên máy mới:

1. chạy installer private config;
2. đăng nhập Codex lại;
3. trust repository;
4. reinstall/enable `browser`, `sites`, `visualize`;
5. authorize lại mọi connector;
6. chạy `npm run doctor:dev`.

## Manual acceptance

- `7z t` và SHA-256 của archive hợp lệ; restore thử vào thư mục tạm thành công.
- Clean clone chạy được `npm run setup:dev`.
- Doctor không còn `FAIL`.
- Mở đủ work/test panel trong Illustrator 2025/2026.
- Chạy `npm run verify:smoke` khi các panel test đang mở.
- Codex thấy ba custom skill và ba plugin sau khi đăng nhập/reinstall.

## Troubleshooting

- `Node ... does not match supported major 24`: cài/chọn Node 24 rồi chạy lại `npm ci`.
- Wrapper trỏ sai repo: đóng Illustrator, chạy `npm run install:cep-live-links`, không copy `%APPDATA%` từ máy cũ.
- Debug port đóng: mở đúng test panel trước smoke test; đây chỉ là warning trong doctor.
- Template source thiếu: restore `symbol-cep/wedding suite print template.ai` từ Git rồi chạy `npm run build:symbol`.
- Archive bị từ chối vì secret: di chuyển credential ra password manager, xóa khỏi worktree và tạo backup mới.
