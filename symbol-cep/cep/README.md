# CEP Minimal Shell

A zero-context, execution-ready framework for Adobe CEP extensions.
Optimized for AI Agents.

## Structure

```text
cep/
├── lib/CSInterface.js   # Vendor
├── js/
│   ├── app.js           # Boot
│   ├── bridge.js        # Comm
│   └── config.js        # Env
├── jsx/
│   ├── host.jsx         # Entry
│   └── bridge.jsx       # Global Bridge
├── index.html           # UI
└── manifest.xml         # Config
```

## Usage

1.  **Boot**: `index.html` loads `app.js` -> `app.init()`.
2.  **Host**: `app.bridge.call('func')` -> `jsx/bridge.jsx`.
3.  **Config**: Edit `js/config.js`.

## Extension

*   **Logic**: Add files to `js/` and import in `app.js`.
*   **Host**: Add files to `jsx/` and `#include` in `host.jsx`.
*   **Styles**: Inline in `index.html` or add `css/style.css`.
