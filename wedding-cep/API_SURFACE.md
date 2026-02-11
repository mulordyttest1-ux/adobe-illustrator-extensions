# 🗺️ API SURFACE MAP

This map lists the primary public APIs available in the Wedding Scripter codebase. Use this as a first reference before searching individual files.

## 🚀 Entry / Actions (L7)
| Module | Function | Description | Location |
|:-------|:---------|:------------|:---------|
| `ScanAction` | `execute(ctx)` | Triggers Illustrator scan & updates UI | `js/actions/ScanAction.js` |
| `UpdateAction` | `execute(ctx)` | Pushes UI data to Illustrator | `js/actions/UpdateAction.js` |
| `SwapAction` | `execute(ctx)` | Swaps POS1 and POS2 data | `js/actions/SwapAction.js` |

## 🕹️ Controllers & Helpers (L6)
| Module | Function | Description | Location |
|:-------|:---------|:------------|:---------|
| `KeyNormalizer` | `normalize(data)` | Cleans scanned keys & enriches dates | `js/controllers/helpers/KeyNormalizer.js` |
| `CompactFormBuilder` | `setData(data)` | Populates form from object | `js/components/CompactFormBuilder.js` |
| `CompactFormBuilder` | `getData()` | Returns current form values | `js/components/CompactFormBuilder.js` |

## 🏗️ Pipeline & Strategy (L4-L5)
| Module | Function | Description | Location |
|:-------|:---------|:------------|:---------|
| `DataValidator` | `analyze(rawArray)` | Converts Bridge array to Healthy Map | `js/logic/pipeline/DataValidator.js` |
| `StrategyOrchestrator`| `analyze(content, meta, packet)` | Computes update plan/strategy | `js/logic/strategies/StrategyOrchestrator.js` |

## 🧠 Domain Logic & Rules (L1)
| Module | Function | Description | Location |
|:-------|:---------|:------------|:---------|
| `WeddingRules` | `isBrideSide(tenLe, config)` | Returns true if ceremony is bride-side | `js/logic/domain/rules.js` |
| `WeddingRules` | `enrichParentPrefixes(data)`| Fixes Ông/Bà based on content | `js/logic/domain/rules.js` |
| `CalendarEngine` | `expandDate(dateObj)` | Returns full lunar/solar info | `js/logic/domain/calendar.js` |
| `NameAnalysis` | `splitFullName(name, idx)`| Splits Vietnamese full names | `js/logic/domain/name.js` |

## 🔌 Infrastructure / Bridge (L0)
| Module | Function | Description | Location |
|:-------|:---------|:------------|:---------|
| `bridge` | `scanDocument()` | Calls `scanWithMetadata` in JSX | `js/bridge.js` |
| `bridge` | `applyPlan(plans)` | Calls `applyPlan` in JSX | `js/bridge.js` |
| `bridge` | `call(fnName, data)`| Low-level CEP -> JSX call | `js/bridge.js` |
