# Lessons Learned

## L01 - Nx cache after tag change
- Problem: changing Nx scope tags can leave stale cache state and create false lint errors.
- Fix: run `npx nx reset` after editing `nx.tags` in `package.json`.

## L02 - depConstraints cascade failure
- Problem: adding a new scope tag to eslint depConstraints can break all consumers of a lib.
- Fix: prefer `no-restricted-imports` for cross-scope boundaries in this monorepo.

## L03 - eslint-disable-line comment format
- Problem: trailing prose after the rule name can break parsing.
- Fix: use only `// eslint-disable-line rule-name`.

## L04 - Consumer scan before migration
- Problem: missing consumers early creates incomplete migrations.
- Fix: search all imports of the target file before touching it.

## L05 - no-restricted-imports vs Nx depConstraints
- Context: mixed root-relative lint paths made Nx boundary checks brittle.
- Fix: `no-restricted-imports` with glob patterns was more reliable here.

## L06 - Multi-page PDF is not a multi-artboard source by default
- Problem: in Illustrator host code, opening a PDF once and reading `doc.artboards` can silently collapse a multi-page PDF into one default-opened document/page.
- Fix: treat PDF as a page-addressable source, inspect page count from the file, and open pages explicitly with page-specific PDF options instead of assuming AI-style artboard semantics.
