# Adobe Illustrator Extensions — Monorepo

Monorepo chứa các CEP Extension cho Adobe Illustrator.

## Cấu trúc

```
├── .agent/              ← Shared Governance (workflows, hooks, rules)
├── shared/              ← Shared Tooling (eslint config)
├── wedding-cep/         ← Wedding Scripter Extension
├── symbol-cep/          ← Hexagon Symbol Extension
├── package.json         ← Root devDependencies
└── .gitignore
```

## Quick Start

```bash
# Cài đặt dependencies (chỉ cần 1 lần ở root)
npm install

# Lint tất cả project
npm run lint:all

# Build Wedding CEP
npm run build:wedding
```

## Governance

Tất cả rules, workflows, và hooks nằm tại root `.agent/`.
Khi sửa đổi governance, chỉ sửa ở root — tất cả project tự động áp dụng.
