# DEPENDENCY MAP — Wedding Scripter CEP

> **Purpose:** Agent biết sửa module X sẽ ảnh hưởng đến đâu (blast radius).  
> **Last Updated:** 2026-02-10  
> **Format:** `Module ← [consumers]` (ai DÙNG module này)

---

## Logic/Core (Foundation — nhiều consumer)

```
StringUtils ← [Normalizer, NameNormalizer, AddressNormalizer]
DateUtils   ← [CalendarEngine, DateLogic, DateGridWidget]
```

## Logic/Domain (Business Rules)

```
CalendarEngine   ← [WeddingAssembler, DateLogic, DateGridWidget]
NameAnalysis     ← [WeddingAssembler]
WeddingRules     ← [WeddingAssembler, FormLogic]
TimeAutomation   ← [WeddingAssembler]
VenueAutomation  ← [WeddingAssembler, FormLogic]
```

## Logic/Pipeline (Data Processing)

```
Normalizer        ← [WeddingAssembler]
Validator         ← [WeddingAssembler, main.js (update flow)]
WeddingAssembler  ← [Bridge.updateWithStrategy, main.js (update handler)]
DataValidator     ← [StrategyOrchestrator]
```

## Logic/Strategies (Text Frame Processing)

```
FreshStrategy         ← [StrategyOrchestrator]
SmartComplexStrategy  ← [StrategyOrchestrator]
StrategyOrchestrator  ← [Bridge.updateWithStrategy]
```

## Logic/UX (Input Processing)

```
InputEngine        ← [CompactFormBuilder._runInputNormalization]
NameNormalizer     ← [InputEngine]
AddressNormalizer  ← [InputEngine]
DateNormalizer     ← [InputEngine]
NameValidator      ← [InputEngine]
AddressValidator   ← [InputEngine]
DateValidator      ← [InputEngine, DateGridWidget]
UnicodeNormalizer  ← [NameNormalizer, AddressNormalizer] (optional)
VietnamesePhonetics ← [NameValidator] (optional)
UX_ABBREVIATIONS   ← [AddressNormalizer] (global constant)
```

## Components (UI Layer)

```
Bridge             ← [main.js (scan, update, swap)]
CompactFormBuilder ← [main.js (compact tab init)]
DateGridWidget     ← [CompactFormBuilder]
DateGridRenderer   ← [DateGridWidget]
DateLogic          ← [DateGridWidget]
DomFactory         ← [CompactFormBuilder, FormComponents, DateGridRenderer]
FormComponents     ← [CompactFormBuilder]
FormLogic          ← [CompactFormBuilder]
ConfigController   ← [main.js (settings tab)]
TabbedPanel        ← [main.js]
```

---

## Blast Radius Guide

| Module | Consumers | Blast Radius | Zone |
|:-------|:----------|:-------------|:-----|
| `StringUtils` | 3 | 🟡 Medium | 🟢 Safe |
| `DateUtils` | 3 | 🟡 Medium | 🟢 Safe |
| `CalendarEngine` | 3 | 🟡 Medium | 🟡 Caution |
| `WeddingAssembler` | 2 | 🔴 High | 🟡 Caution |
| `Bridge` | 1 (main.js) | 🔴 Critical | 🔴 Danger |
| `CompactFormBuilder` | 1 (main.js) | 🔴 High | 🔴 Danger |
| `InputEngine` | 1 | 🟡 Medium | 🟡 Caution |
| `NameNormalizer` | 1 | 🟢 Low | 🟢 Safe |
| `DateNormalizer` | 1 | 🟢 Low | 🟢 Safe |
| `FreshStrategy` | 1 | 🟢 Low | 🟢 Safe |
| `DomFactory` | 3 | 🟡 Medium | 🟢 Safe |

---

## Data Flow (Left → Right)

```
UI Input
  → InputEngine
    → [NameNormalizer | AddressNormalizer | DateNormalizer]
    → [NameValidator | AddressValidator | DateValidator]
  → CompactFormBuilder.data
    → main.js (collect form data)
      → WeddingAssembler.assemble()
        → Normalizer → NameAnalysis → WeddingRules → CalendarEngine → TimeAutomation → VenueAutomation
      → Bridge.updateWithStrategy()
        → Bridge.collectFrames() → StrategyOrchestrator
          → [FreshStrategy | SmartComplexStrategy]
        → Bridge.call('applyPlan')
          → IllustratorBridge.applyPlan() (ExtendScript)
```
