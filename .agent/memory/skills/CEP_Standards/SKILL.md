---
name: CEP_Standards
description: Bộ quy chuẩn CEP Migration cho dự án Wedding Scripter - UI Guidelines, Code Standards, và Architecture Rules
---

# Skill: CEP Migration Standards (DinhSon Edition)

> **MỤC ĐÍCH:** Đây là bộ quy chuẩn PHẢI tuân thủ khi migrate từ ScriptUI sang CEP Panel.
> **OWNER:** DinhSon
> **VERSION:** 1.0.0

---

## 1. Tổng quan Kiến trúc CEP

### 1.1 CEP là gì?

**CEP (Common Extensibility Platform)** là nền tảng mở rộng của Adobe cho phép xây dựng các panel với công nghệ web hiện đại:
- **HTML5** - Cấu trúc giao diện
- **CSS3** - Styling (Light Theme cho DinhSon)
- **JavaScript** - Logic UI (ES6+)
- **ExtendScript** - Giao tiếp với Illustrator DOM

### 1.2 Kiến trúc Tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CEP PANEL (Chromium WebView)                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    HTML/CSS/JavaScript UI                        │ │
│  │  • React/Svelte Components                                       │ │
│  │  • DinhSon Light Theme Design System                             │ │
│  │  • Modern ES6+ Syntax                                            │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                      │
│                    CSInterface.evalScript()                          │
│                               │                                      │
│  ┌────────────────────────────▼────────────────────────────────────┐ │
│  │                    BRIDGE LAYER (jsx/bridge.jsx)                 │ │
│  │  • JSON serialization/deserialization                            │ │
│  │  • Error handling                                                 │ │
│  │  • Unified API endpoints                                          │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                    EXTENDSCRIPT LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    EXISTING HEXAGONAL CORE                        ││
│  │  • Domain/ - Business Entities, Rules                            ││
│  │  • Application/ - Use Cases, Ports                               ││
│  │  • Infrastructure/ - Illustrator Adapters                        ││
│  │  • Modules/ - WeddingPro, Imposition                             ││
│  └──────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Nguyên tắc Vàng

> **Hexagonal Architecture vẫn được giữ nguyên!**

CEP chỉ thay thế layer UI (ScriptUI → HTML), còn:
- ✅ Domain layer: Không đổi
- ✅ Application layer: Không đổi  
- ✅ Infrastructure/Illustrator: Không đổi
- 🔄 Infrastructure/UI: **THAY THẾ hoàn toàn bằng CEP HTML**
- 🔄 BridgeTalk: **THAY THẾ bằng CSInterface**

---

## 2. Cấu trúc Thư mục CEP

### 2.1 Cấu trúc Đề xuất

```
g:/My Drive/script ho tro adobe illustrator/
│
├── cep/                              ← [NEW] CEP Panel Root
│   ├── CSXS/
│   │   └── manifest.xml              ← Extension configuration
│   │
│   ├── css/
│   │   ├── main.css                  ← DinhSon Light Theme
│   │   └── components/               ← Component styles
│   │
│   ├── js/
│   │   ├── main.js                   ← Entry point
│   │   ├── CSInterface.js            ← Adobe's JSX Bridge
│   │   ├── bridge.js                 ← Communication layer
│   │   └── components/               ← UI Components
│   │       ├── TabbedPanel.js
│   │       ├── FormBuilder.js
│   │       └── DatePicker.js
│   │
│   ├── jsx/
│   │   └── bridge.jsx                ← ExtendScript Bridge
│   │
│   ├── index.html                    ← Main panel HTML
│   └── .debug                        ← Debug configuration
│
├── src/                              ← [UNCHANGED] Hexagonal Core
│   ├── Domain/
│   ├── Application/
│   ├── Infrastructure/
│   │   └── Illustrator/              ← Keep these adapters!
│   └── Modules/
│
└── Run_App.js                        ← [DEPRECATED for CEP]
```

### 2.2 Mapping cũ → mới

| ScriptUI (Cũ) | CEP (Mới) |
|---------------|-----------|
| `src/Infrastructure/UI/TabbedShell.js` | `cep/js/components/TabbedPanel.js` |
| `src/Infrastructure/UI/*Controller.js` | `cep/js/controllers/*Controller.js` |
| `src/Modules/*/UI/LayoutBuilder.jsx` | `cep/js/components/FormBuilder.js` |
| `src/Infrastructure/BridgeTalk/*.js` | `cep/js/bridge.js` + `cep/jsx/bridge.jsx` |
| `Run_App.js` | `cep/index.html` + `cep/js/main.js` |

---

## 3. DinhSon Design System (Light Theme)

### 3.1 Tại sao Light Theme?

> **"Làm việc ban ngày, cần giảm điều tiết mắt, tránh contrast cao."** — DinhSon

### 3.2 Color Palette

```css
:root {
  /* === PRIMARY COLORS === */
  --ds-bg-primary: #F5F5F7;           /* Nền chính - Soft white */
  --ds-bg-secondary: #FFFFFF;         /* Nền panels - Pure white */
  --ds-bg-tertiary: #E8E8ED;          /* Nền disabled - Light gray */
  
  /* === TEXT COLORS === */
  --ds-text-primary: #1D1D1F;         /* Text chính - Near black */
  --ds-text-secondary: #6E6E73;       /* Text phụ - Medium gray */
  --ds-text-muted: #8E8E93;           /* Text mờ - Light gray */
  --ds-text-link: #0066CC;            /* Links - Accessible blue */
  
  /* === ACCENT COLORS === */
  --ds-accent-primary: #0066CC;       /* Primary action - Blue */
  --ds-accent-success: #34C759;       /* Success - Green */
  --ds-accent-warning: #FF9500;       /* Warning - Orange */
  --ds-accent-danger: #FF3B30;        /* Error - Red */
  
  /* === BORDERS & SHADOWS === */
  --ds-border-light: #D1D1D6;         /* Border nhẹ */
  --ds-border-dark: #C7C7CC;          /* Border đậm */
  --ds-shadow-soft: 0 2px 8px rgba(0,0,0,0.08);      /* Shadow nhẹ */
  --ds-shadow-medium: 0 4px 16px rgba(0,0,0,0.12);   /* Shadow trung bình */
  
  /* === SPACING (8px Grid) === */
  --ds-space-xs: 4px;
  --ds-space-sm: 8px;
  --ds-space-md: 16px;
  --ds-space-lg: 24px;
  --ds-space-xl: 32px;
  
  /* === TYPOGRAPHY === */
  --ds-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --ds-font-size-sm: 12px;
  --ds-font-size-md: 14px;
  --ds-font-size-lg: 16px;
  --ds-font-size-xl: 20px;
  
  /* === BORDER RADIUS === */
  --ds-radius-sm: 4px;
  --ds-radius-md: 8px;
  --ds-radius-lg: 12px;
}
```

### 3.3 Component Styles Base

```css
/* === PANEL/CARD === */
.ds-panel {
  background: var(--ds-bg-secondary);
  border: 1px solid var(--ds-border-light);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-md);
  box-shadow: var(--ds-shadow-soft);
}

/* === INPUT FIELD === */
.ds-input {
  width: 100%;
  padding: var(--ds-space-sm) var(--ds-space-md);
  border: 1px solid var(--ds-border-light);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-md);
  background: var(--ds-bg-secondary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ds-input:focus {
  outline: none;
  border-color: var(--ds-accent-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
}

/* === BUTTON PRIMARY === */
.ds-btn-primary {
  background: var(--ds-accent-primary);
  color: #FFFFFF;
  border: none;
  padding: var(--ds-space-sm) var(--ds-space-lg);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.ds-btn-primary:hover {
  background: #0055B3;
}

/* === BUTTON SECONDARY === */
.ds-btn-secondary {
  background: var(--ds-bg-tertiary);
  color: var(--ds-text-primary);
  border: 1px solid var(--ds-border-light);
  padding: var(--ds-space-sm) var(--ds-space-lg);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-font-size-md);
  cursor: pointer;
  transition: background 0.2s;
}

.ds-btn-secondary:hover {
  background: var(--ds-border-light);
}

/* === TABS === */
.ds-tabs {
  display: flex;
  border-bottom: 1px solid var(--ds-border-light);
  margin-bottom: var(--ds-space-md);
}

.ds-tab {
  padding: var(--ds-space-sm) var(--ds-space-md);
  border: none;
  background: transparent;
  color: var(--ds-text-secondary);
  font-size: var(--ds-font-size-md);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.ds-tab:hover {
  color: var(--ds-text-primary);
}

.ds-tab.active {
  color: var(--ds-accent-primary);
  border-bottom-color: var(--ds-accent-primary);
}

/* === PANEL HEADER === */
.ds-panel-header {
  font-size: var(--ds-font-size-lg);
  font-weight: 600;
  color: var(--ds-text-primary);
  margin-bottom: var(--ds-space-md);
  padding-bottom: var(--ds-space-sm);
  border-bottom: 1px solid var(--ds-border-light);
}
```

### 3.4 Accessibility Guidelines

| Guideline | Rule |
|-----------|------|
| **Contrast Ratio** | Text phải có contrast ≥ 4.5:1 với background |
| **Focus Visible** | Mọi interactive element phải có focus ring rõ ràng |
| **Font Size** | Minimum 14px cho body text |
| **Touch Target** | Minimum 44x44px cho buttons |
| **Animations** | Respect `prefers-reduced-motion` |

---

## 4. Code Standards cho CEP

### 4.1 JavaScript (ES6+)

```javascript
// ✅ GOOD: Modern ES6+
const processCard = async (cardData) => {
  const { name, date, address } = cardData;
  
  try {
    const result = await bridge.evalScript('processCard', { name, date, address });
    return result;
  } catch (error) {
    console.error('[CEP] Process error:', error);
    throw error;
  }
};

// ❌ BAD: ES3 style in CEP Panel (OK for ExtendScript only)
var processCard = function(cardData) {
  var name = cardData.name;
  // ...
};
```

### 4.2 Bridge Communication

```javascript
// cep/js/bridge.js
class Bridge {
  constructor() {
    this.cs = new CSInterface();
  }

  /**
   * Call ExtendScript function with JSON data.
   * @param {string} fnName - Function name in bridge.jsx
   * @param {Object} data - Data to pass
   * @returns {Promise<any>} Parsed result
   */
  async evalScript(fnName, data = {}) {
    const jsonArg = JSON.stringify(data);
    const script = `CEPBridge.${fnName}('${this._escapeQuotes(jsonArg)}')`;
    
    return new Promise((resolve, reject) => {
      this.cs.evalScript(script, (result) => {
        if (result === 'EvalScript error.') {
          reject(new Error(`ExtendScript error in ${fnName}`));
        } else {
          try {
            resolve(JSON.parse(result));
          } catch {
            resolve(result);
          }
        }
      });
    });
  }

  _escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
  }
}

export const bridge = new Bridge();
```

```javascript
// cep/jsx/bridge.jsx (ExtendScript - ES3!)
var CEPBridge = CEPBridge || {};

/**
 * Generic JSON-in, JSON-out wrapper.
 * @param {string} jsonStr - JSON string from CEP panel
 * @returns {string} JSON result
 */
CEPBridge.processCard = function(jsonStr) {
  try {
    // ES3: Use eval for JSON parsing (or external JSON2 polyfill)
    var data = eval('(' + jsonStr + ')');
    
    // Call existing Use Case
    var result = HexCore.handleUpdate(app.activeDocument, data);
    
    return JSON.stringify({ success: true, message: result });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.message });
  }
};
```

### 4.3 File Naming Convention

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TabbedPanel.js`, `DatePicker.js` |
| Utilities | camelCase | `formatDate.js`, `validateInput.js` |
| Styles | kebab-case | `main.css`, `date-picker.css` |
| ExtendScript | camelCase | `bridge.jsx`, `hexCore.jsx` |

---

## 5. manifest.xml Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="8.0" ExtensionBundleId="com.dinhson.weddingscripter" ExtensionBundleVersion="1.0.0"
                   ExtensionBundleName="Wedding Scripter" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ExtensionList>
        <Extension Id="com.dinhson.weddingscripter.panel" Version="1.0.0"/>
    </ExtensionList>
    
    <ExecutionEnvironment>
        <HostList>
            <!-- Illustrator CC 2020+ -->
            <Host Name="ILST" Version="[24.0,99.9]"/>
        </HostList>
        <LocaleList>
            <Locale Code="All"/>
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="11.0"/>
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    
    <DispatchInfoList>
        <Extension Id="com.dinhson.weddingscripter.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./index.html</MainPath>
                    <ScriptPath>./jsx/bridge.jsx</ScriptPath>
                </Resources>
                <Lifecycle>
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>Wedding Scripter</Menu>
                    <Geometry>
                        <Size>
                            <Height>600</Height>
                            <Width>400</Width>
                        </Size>
                        <MinSize>
                            <Height>400</Height>
                            <Width>300</Width>
                        </MinSize>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>
```

---

## 6. Migration Checklist

### Pre-Migration

- [ ] Backup toàn bộ dự án (already done: `backup_2026-01-17.zip`)
- [ ] Document tất cả UI components hiện tại
- [ ] List tất cả callbacks và event handlers
- [ ] Identify dependencies giữa modules

### During Migration

- [ ] Tạo CEP structure
- [ ] Migrate component-by-component, test từng bước
- [ ] Keep ExtendScript core UNCHANGED
- [ ] Use Bridge layer để gọi existing Use Cases

### Post-Migration

- [ ] Test full workflow
- [ ] Verify error handling
- [ ] Document changes in Decision_Log.md
- [ ] Update Project_Context skill

---

## 7. Debugging CEP

### Enable Debug Mode

Create `.debug` file in `cep/`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.dinhson.weddingscripter.panel">
        <HostList>
            <Host Name="ILST" Port="8088"/>
        </HostList>
    </Extension>
</ExtensionList>
```

### Open Chrome DevTools

1. Open Chrome browser
2. Navigate to: `http://localhost:8088`
3. Click on your extension to open DevTools

### ExtendScript Debugging

Use `$.writeln()` và ExtendScript Toolkit hoặc VS Code + ExtendScript Debugger extension.

---

## Tài liệu Liên quan

- [Hexagonal_Rules](file:///g:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Hexagonal_Rules/SKILL.md)
- [Code_Style_Standard](file:///g:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Code_Style_Standard/SKILL.md)
- [Project_Context](file:///g:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/skills/Project_Context/SKILL.md)
- [Adobe CEP Resources](https://github.com/AdobeExchangeConnect/Application-Configurations)
 
 ---
 
 ## 8. CEP File System & Node.js
 
 ### 8.1 Node.js Integration
 
 Để dùng Node.js (`require`, `fs`, `path`), bắt buộc phải có flag trong `manifest.xml`:
 
 ```xml
 <CEFCommandLine>
     <Parameter>--enable-nodejs</Parameter>
     <Parameter>--mixed-context</Parameter>
 </CEFCommandLine>
 ```
 
 ### 8.2 The "file:///" URI Problem
 
 **Vấn đề:** `CSInterface.getSystemPath()` trả về URI (`file:///C:/...`) trên Windows.
 **Hậu quả:** Node.js `fs` module KHÔNG hiểu URI này → Error `ENOENT` hoặc `path invalid`.
 
 **Giải pháp (Standard Sanitization):**
 
 ```javascript
 function getSafePath(uri) {
     let path = decodeURI(uri);
     if (path.startsWith('file:///')) {
         path = path.substring(8);
     } else if (path.startsWith('file://')) {
         path = path.substring(7);
     }
     // Remove leading slash on Windows (e.g. /C:/ -> C:/)
     if (/^\/[a-zA-Z]:/.test(path)) {
         path = path.substring(1);
     }
     return path;
 }
 
 const extPath = getSafePath(cs.getSystemPath(CSInterface.EXTENSION));
 ```
 
 ### 8.3 Logging Best Practices
 
 1. **Location:**
    - Tránh `Program Files` (Extension root) nếu user không chạy Admin.
    - An toàn nhất: `SystemPath.MY_DOCUMENTS` hoặc `SystemPath.USER_DATA`.
    - Debugging: Project root (`.agent/`) OK nếu dev environment.
 
 2. **Fallback Strategy:**
    - Luôn check `typeof require === 'function'`.
    - Fallback về `window.cep.fs.writeFile` (CEP Native) nếu Node fail.

