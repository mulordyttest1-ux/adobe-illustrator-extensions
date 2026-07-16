/**
 * MODULE: App
 * LAYER: Core/Entry (L2)
 * PURPOSE: Thin app entrypoint that boots the runtime registry/composition root.
 */
import { bootSymbolApp } from './features/runtime/appBoot.js';

const App = {
    init() {
        console.log('App Booting...');
        bootSymbolApp();
        console.log('App Initialized');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
