# API SURFACE — Wedding Scripter CEP

> **Purpose:** Agent đọc file này THAY VÌ mở 43+ files để biết tên hàm, tham số, và file location.  
> **Last Updated:** 2026-02-10  
> **Rule:** Khi sửa/thêm public API → cập nhật file này.

---

## Logic/Core

### StringUtils — `js/logic/core/string.js`
```
.clean(str) → string                        // Remove extra whitespace, trim
.toProperCase(str) → string                  // Vietnamese Title Case
.removeAccents(str) → string                 // Strip diacritics (Nguyễn → Nguyen)
.isEmpty(str) → boolean                      // Check empty after trim
```

### DateUtils — `js/logic/core/date.js`
```
.parseDate(str) → Date|null                  // "YYYY-MM-DD" → Date object
.formatDate(date, pattern?) → string         // Date → "DD/MM/YYYY"
.getDayOfWeek(date) → string                 // Date → "Thứ Hai"
.getDiffDays(d1, d2) → number               // Days between two dates
.addDays(date, days) → Date                  // Add/subtract days
```

---

## Logic/Domain

### CalendarEngine — `js/logic/domain/calendar.js`
```
.loadDatabase(csvPath) → void                // Load lunar calendar CSV (uses fs.readFileSync)
.getLunarDate(day, month, year) → LunarDate|null   // Solar → Lunar
.getSolarDate(lunarDay, lunarMonth, yearTxt) → SolarDate|null   // Lunar → Solar
.expandDate(packet) → Object                 // Enrich packet with lunar info, day of week
```

### NameAnalysis — `js/logic/domain/name.js`
```
.splitFullName(fullName, index?) → { ten, lot, ho_dau, dau, full }
.enrichSplitNames(packet) → Object           // Find *_split_idx keys, add derived name fields
```

### WeddingRules — `js/logic/domain/rules.js`
```
.generateParentPrefix(hasOng, hasBa) → string       // "Ông Bà:", "Ông:", "Bà:", ""
.enrichParentPrefixes(packet) → Object               // Add ongba prefix for both positions
.isBrideSide(leName, triggerConfig?) → boolean        // Detect bride/groom from ceremony name
.getSideState(leName, triggerConfig?) → 0|1           // 0=Trai, 1=Gái
.enrichMappingStrategy(packet, triggerConfig?) → Object  // Set pos1/pos2 vithu mapping
```

### TimeAutomation — `js/logic/domain/time.js`
```
.STANDARD_TIMES                              // { 'date.tiec': {h,m}, 'date.le': {h,m}, 'date.nhap': {h,m} }
.isStandardTime(key, h, m) → boolean        // Check if time matches standard
.shouldLock(h, m, standard) → boolean        // Check if field should be locked
.enrichTimeLocks(packet, schema) → Object    // Add lock flags, fill defaults
```

### VenueAutomation — `js/logic/domain/venue.js`
```
.generateVenueName(hostType) → string        // "Nhà Trai" → "Tư Gia Nhà Trai"
.detectVenueState(packet) → Object           // Detect is_tugia from text
.applyAutoVenue(packet, options?) → Object   // Apply auto venue names + addresses
```

---

## Logic/Pipeline

### Normalizer — `js/logic/pipeline/normalizer.js`
```
.normalize(packet, schema) → Object          // Clean, trim all fields
.applyProperCase(value) → string             // Title case for names
```

### Validator — `js/logic/pipeline/validator.js`
```
.validate(packet) → { valid, errors[] }      // Check required fields (ten_le, date, names)
.isFieldValid(value) → boolean               // Basic non-empty check
```

### WeddingAssembler — `js/logic/pipeline/assembler.js`
```
.setDependencies(deps) → void                // Inject: Normalizer, CalendarEngine, etc.
.assemble(rawData) → Object                  // Full pipeline: normalize→names→parents→dates→time→venue→mapping
```

### DataValidator — `js/logic/pipeline/DataValidator.js`  (Class)
```
new DataValidator()
.analyze(rawItems) → { healthyMap, brokenList }   // Parse markers, classify healthy/broken
.heal(brokenList, healthyMap) → fixes[]            // Reconstruct broken items from consensus
```

---

## Logic/Strategies

### StrategyOrchestrator — `js/logic/strategies/StrategyOrchestrator.js`
```
.analyze(frames, packet) → plans[]           // Orchestrate strategy selection per frame
.encodeMeta(meta) → string                   // Encode metadata to item note
.decodeMeta(noteStr) → Object|null           // Decode metadata from item note
```

### FreshStrategy — `js/logic/strategies/FreshStrategy.js`  (Class)
```
FreshStrategy.analyze(content, packet, meta, constants?) → plan|null
  // mode: 'ATOMIC', replacements[], meta
```

### SmartComplexStrategy — `js/logic/strategies/SmartComplexStrategy.js`  (Class)
```
SmartComplexStrategy.analyze(content, packet, meta, constants?) → plan|null
  // mode: 'ATOMIC'|'DIRECT'|'SKIP', replacements[]|content, meta
```

---

## Logic/UX

### InputEngine — `js/logic/ux/InputEngine.js`
```
.process(value, fieldKey, options?) → { value, applied[], warnings[] }
  // Routes to type-specific normalizer + validator
```

### NameNormalizer — `js/logic/ux/normalizers/NameNormalizer.js`
```
.normalize(value, options?) → { value, applied[] }   // Title Case, Unicode NFC
.extractFirstName(fullName, splitIdx?) → string       // Last word (VN style)
```

### AddressNormalizer — `js/logic/ux/normalizers/AddressNormalizer.js`
```
.normalize(value, options?) → { value, applied[] }    // Title Case + abbreviation uppercase
```

### DateNormalizer — `js/logic/ux/normalizers/DateNormalizer.js`
```
.normalize(value, options?) → { value, applied[] }    // Smart typo fix, zero padding
  // options.type: 'day'|'month'|'year'|'hour'|'minute'
```

### NameValidator — `js/logic/ux/validators/NameValidator.js`
```
.validate(value) → { valid, warnings[] }     // Check numbers, special chars, surname, phonetics
```

### AddressValidator — `js/logic/ux/validators/AddressValidator.js`
```
.validate(value) → { valid, warnings[] }     // Mixed separators, typo detection, Telex errors
```

### DateValidator — `js/logic/ux/validators/DateValidator.js`
```
.validate(value, type) → { valid, warnings[] }        // Range check (day 1-31, month 1-12)
.validateDateLogic(data) → { valid, warnings[] }      // Cross-validate: sequence, past date, gaps
```

---

## Components

### Bridge — `js/bridge.js`  (Class)
```
new Bridge()
.call(fnName, data?) → Promise<Object>       // Call ExtendScript function
.scanDocument() → Promise<{success, data}>   // Scan AI document text frames
.updateWithStrategy(packet) → Promise<{success, updated}>  // Full update pipeline
.collectFrames() → Promise<{success, data}>  // Collect frames with metadata
```

### TabbedPanel — `js/components/TabbedPanel.js`  (Class)
```
new TabbedPanel({ tabsSelector, panelsSelector, controllers, onTabChange })
```

### CompactFormBuilder — `js/components/CompactFormBuilder.js`
```
.build(container, schema) → void             // Render form from schema
.getData() → Object                          // Get current form data
.setData(data) → void                        // Set form data
.refs → Object                               // DOM element references
```

### DateGridWidget — `js/components/DateGridWidget.js`
```
.init(container, schema, options?) → void    // Initialize grid
.triggerCompute() → void                      // Force recomputation
.getData() → Object                          // Get date/time data
.setDataFromExternal(data) → void            // Set data from scan
```

### DomFactory — `js/components/helpers/DomFactory.js`
```
.createPanel(title) → HTMLElement
.createRow() → HTMLElement
.createLabel(text) → HTMLElement
.createTextarea(id, opts?) → HTMLTextAreaElement
.createInput(id, opts?) → HTMLInputElement
.createButton(text, onClick) → HTMLButtonElement
.createCheckbox(id, label, onChange) → HTMLElement
.createSelect(id, options, onChange) → HTMLSelectElement
.createRadioGroup(name, options, onChange) → HTMLElement
```

### ConfigController — `js/controllers/ConfigController.js`
```
.init(container, config) → void              // Render config sliders
.load() → Object                             // Load from localStorage
.save(settings) → void                       // Save to localStorage
.apply(settings) → void                      // Apply CSS variables
```

---

## ExtendScript (ES3)

### IllustratorBridge — `jsx/illustrator.jsx`
```
IllustratorBridge.ping() → JSON string
IllustratorBridge.collectFrames() → JSON string    // Scan text frames + metadata
IllustratorBridge.scanWithMetadata() → JSON string // Extended scan
IllustratorBridge.applyPlan(jsonStr) → JSON string // Apply replacement plans
```
