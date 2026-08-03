# Symbol Config Refactor Plan

1. Freeze characterization for all stored presets and isolate the legacy
   runtime adapter.
2. Add `PresetDraft`, serializer, migrator, and runtime adapter contracts.
3. Add `ConfigDraftStore` and connect it to ConfigTab dirty-state seams.
4. Move repository and ConfigTab persistence to `getDraftById()` and
   `saveDraft()`, keeping old public facades during migration.
5. Add the nine-section renderer registry in groups A, B, and C.
6. Remove circular mapping from the active config path, update architecture
   docs, and keep the legacy adapter as a read-only compatibility island.
7. Run encoding, lint, build, unit, and Illustrator 2026 smoke gates.

## Completion Pass

8. Make Config persistence canonical-only:
   - require `getDraftById()` and `saveDraft()` for Config load/save;
   - keep `getPresets()` and `hydratePreset()` only on the Action Tab/runtime
     compatibility facade;
   - remove Config-side `savePreset()`, raw-entry, and legacy hydration
     fallbacks.
9. Split the remaining standard control construction from
   `ConfigPaneRenderer` into a context-injected control adapter.
10. Keep all DOM labels, event routing, state updates, preset output, and
    Illustrator behavior unchanged.
11. Validate with Symbol unit tests, build, lint, and Illustrator 2026 smoke
    only.
