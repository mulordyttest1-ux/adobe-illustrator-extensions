# 🧶 DEPENDENCY MAP

This map shows how modules interact across layers. Use this to assess the "Blast Radius" of any change.

## 🔄 Core Data Flow (Scan)
```mermaid
graph TD
    UI[Button: Scan] --> Action[ScanAction.js]
    Action --> Bridge[bridge.js]
    Bridge --> JSX[illustrator.jsx: scanWithMetadata]
    JSX -- returns Base64 --> Bridge
    Bridge -- returns JSON --> Action
    Action --> Validator[DataValidator.js]
    Validator --> Normalizer[KeyNormalizer.js]
    Normalizer --> Rules[WeddingRules.js]
    Rules --> UIBuilder[CompactFormBuilder.setData]
```

## 🔄 Core Data Flow (Update)
```mermaid
graph TD
    UI[Button: Update] --> Action[UpdateAction.js]
    Action --> Bridge[bridge.js]
    Bridge --> Collect[bridge.collectFrames]
    Collect --> JSX_Scan[illustrator.jsx: scanWithMetadata]
    Action --> Orchestrator[StrategyOrchestrator.js]
    Orchestrator --> Strategy[SmartComplexStrategy.js]
    Strategy --> Bridge_Apply[bridge.applyPlan]
    Bridge_Apply --> JSX_Apply[illustrator.jsx: applyPlan]
```

## 🧩 Logic Dependency Graph (UX Layer)
```mermaid
graph TD
    InputEngine --> SchemaUtils
    InputEngine --> NameNormalizer
    InputEngine --> AddressNormalizer
    InputEngine --> DateNormalizer
    InputEngine --> NameValidator
    InputEngine --> AddressValidator
    InputEngine --> DateValidator

    NameValidator -- used by --> PersonName[Type: person_name]
    NameValidator -- used by --> VenueName[Type: venue_name]
    
    AddressService --> AddressAutocomplete
    AddressService --> SchemaUtils
```

## 🏗️ Layer Dependencies (Hexagonal)
- **L7 Actions** depends on: L6 Controllers, L4 Pipeline, L0 Bridge
- **L6 Controllers** depends on: L4 Pipeline, L1 Domain, L3 UX-Components
- **L4 Pipeline** depends on: L1 Domain, L2 Logic
- **L1 Domain** depends on: nothing (PURE)
- **L0 Bridge** depends on: nothing (PURE CEP/JSX Interface)

## ⚠️ High-Risk Mediators
The following files are heavily connected and should be modified with caution:
1. **`js/bridge.js`**: Connects almost everything to JSX.
2. **`js/app.js`**: Composition root, wires all modules.
3. **`js/components/CompactFormBuilder.js`**: Manages the entire UI state.
