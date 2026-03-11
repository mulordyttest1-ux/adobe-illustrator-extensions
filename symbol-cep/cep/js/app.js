/**
 * MODULE: App
 * LAYER: Core/Entry (L2)
 * PURPOSE: App Entry Point — Imports all feature modules and boots the Panel.
 */
import { ActionTab } from './features/imposition/action_tab.js';
import { ConfigTab } from './features/imposition/config_tab.js';
import { Bridge } from './bridge.js';
import { PreflightOrchestrator } from './features/imposition/preflight/PreflightOrchestrator.js';
import { GarbageRule } from './features/imposition/preflight/rules/GarbageRule.js';
import { PostflightOrchestrator } from './features/imposition/postflight/PostflightOrchestrator.js';
import { PasteboardInfoRule } from './features/imposition/postflight/rules/PasteboardInfoRule.js';

const App = {
    init() {
        console.log("🚀 App Booting...");

        // Load Host Logic via CSInterface
        const csInterface = new CSInterface();
        const extensionRoot = csInterface.getSystemPath(CSInterface.EXTENSION) + "/jsx/";
        csInterface.evalScript('$.evalFile("' + extensionRoot + 'host.jsx")');

        // Initialize dependencies
        const bridgeInst = new Bridge();

        // Setup Preflight Orchestrator
        const preflightOrchestrator = new PreflightOrchestrator();
        preflightOrchestrator.registerRule(GarbageRule);

        // Setup Postflight Orchestrator
        const postflightOrchestrator = new PostflightOrchestrator();
        postflightOrchestrator.registerRule(new PasteboardInfoRule());

        // Initialize feature tabs
        const actionTab = new ActionTab(preflightOrchestrator, postflightOrchestrator, bridgeInst);
        actionTab.init('action-container');

        const configTab = new ConfigTab();
        configTab.init('config-container');

        // Expose to window for E2E tests
        window.Imposition = { actionTab, configTab };

        console.log('✅ App Initialized');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

