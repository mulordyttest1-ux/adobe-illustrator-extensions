---
name: Deployment_Architecture
description: Monorepo deployment - Symlink setup cho Wedding CEP và Symbol CEP trong Adobe Illustrator
version: 2.0
---

# Deployment Architecture (Monorepo v2.0)

> **Updated:** 2026-02-25 — Chuyển từ Google Drive sang Monorepo

---

## 🏗️ Monorepo Structure

```
c:\Projects\adobe-illustrator-extensions\    ← ROOT
├── wedding-cep\                             ← Wedding Scripter CEP
│   ├── cep\                                 ← CEP Panel (HTML/JS/JSX)
│   │   ├── index.html
│   │   ├── js\         (ES6+)
│   │   ├── jsx\        (ES3 ExtendScript)
│   │   ├── css\
│   │   └── data\       (schema.json)
│   └── dist\                                ← Build output
│
├── symbol-cep\                              ← Symbol CEP (2nd project)
│   ├── cep\
│   └── dist\
│
├── shared\                                  ← Shared libs (ESLint, testing)
│   ├── eslint.config.mjs
│   └── testing\E2ERunner.cjs
│
├── .agent\                                  ← Agent Knowledge Base
│   ├── workflows\                           ← Workflow Protocol v4.0
│   ├── memory\skills\                       ← Domain Skills
│   └── lessons_learned.md                   ← Persistent lessons
│
└── package.json                             ← Nx monorepo root
```

---

## 🔗 Symlink Setup

CEP extensions load từ `AppData`, nhưng code thật ở monorepo.

### Paths

| CEP | Source (Monorepo) | Target (AppData Symlink) |
|:----|:------------------|:-------------------------|
| Wedding | `c:\Projects\adobe-illustrator-extensions\wedding-cep\cep` | `%APPDATA%\Adobe\CEP\extensions\com.dinhson.weddingscripter` |
| Symbol | `c:\Projects\adobe-illustrator-extensions\symbol-cep\cep` | `%APPDATA%\Adobe\CEP\extensions\com.dinhson.symbolcep` |

### Create Symlink (PowerShell Admin)

```powershell
# Wedding CEP
$source = "c:\Projects\adobe-illustrator-extensions\wedding-cep\cep"
$target = "$env:APPDATA\Adobe\CEP\extensions\com.dinhson.weddingscripter"
if (Test-Path $target) { Remove-Item $target -Force -Recurse }
New-Item -ItemType SymbolicLink -Path $target -Target $source

# Symbol CEP
$source = "c:\Projects\adobe-illustrator-extensions\symbol-cep\cep"
$target = "$env:APPDATA\Adobe\CEP\extensions\com.dinhson.symbolcep"
if (Test-Path $target) { Remove-Item $target -Force -Recurse }
New-Item -ItemType SymbolicLink -Path $target -Target $source
```

Hoặc dùng script `.agent/create_symlink.ps1` (đã có sẵn).

---

## 🔧 Build & Test

```bash
npm run build:wedding       # Build wedding CEP
npm run build:symbol        # Build symbol CEP
npm run lint:wedding        # Lint wedding
npm run lint:all            # Lint monorepo
npm run test:e2e            # Smoke test via CDP
npm run verify              # Full verify (lint + build + e2e + sync)
```

---

## ⚠️ Common Issues

| Issue | Cause | Fix |
|:------|:------|:----|
| Code không thay đổi sau edit | Chưa build lại | `npm run build:wedding` |
| Panel không load | Symlink bị hỏng | Chạy lại `create_symlink.ps1` |
| CEP cache file cũ | Cần restart Illustrator | Tắt hoàn toàn AI → mở lại |
| Debug mode không hoạt động | Registry chưa set | `Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value 1` |

---

## 📝 Agent Guidelines

- **LUÔN edit** ở monorepo (`c:\Projects\adobe-illustrator-extensions\...`)
- **KHÔNG edit** trực tiếp trong `AppData` (symlink target)
- **Build TRƯỚC khi test:** `npm run build:wedding`
- **Restart Illustrator** sau khi sửa JSX files
- Debug: `http://localhost:8097` (Wedding) hoặc port trong `.debug` file
