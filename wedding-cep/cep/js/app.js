/**
 * MODULE: App (Composition Root)
 * LAYER: Entry
 * PURPOSE: Single entry point — imports all modules, wires dependencies, boots application
 * DEPENDENCIES: All modules
 * SIDE EFFECTS: DOM, CEP Bridge
 * EXPORTS: None (entry point)
 */

// ============================================================
// LAYER 0: Core Utilities (zero dependencies)
// ============================================================
import { StringUtils } from './logic/core/string.js';
import { DateUtils } from './logic/core/date.js';

// ============================================================
// LAYER 1: Domain Logic (depends on Core only)
// ============================================================
import {
    CalendarEngine,
    NameAnalysis,
    WeddingRules,
    TimeAutomation,
    VenueAutomation,
    DateLogic
} from '@wedding/domain';

// ============================================================
// LAYER 2: Pipeline (depends on Domain)
// ============================================================
import { Normalizer } from './logic/pipeline/normalizer.js';
import { Validator } from './logic/pipeline/validator.js';
import { DataValidator } from './logic/pipeline/DataValidator.js';
import { WeddingAssembler } from './logic/pipeline/assembler.js';

// ============================================================
// LAYER 3: Strategies (depends on Pipeline)
// ============================================================
import { FreshStrategy } from './logic/strategies/FreshStrategy.js';
import { SmartComplexStrategy } from './logic/strategies/SmartComplexStrategy.js';
import { StrategyOrchestrator } from './logic/strategies/StrategyOrchestrator.js';

// ============================================================
// LAYER 4: UX Automation (depends on Domain, Core)
// ============================================================
import { UX_ABBREVIATIONS, UX_ABBREVIATIONS_REVERSE } from './logic/ux/constants/abbreviations.js';
import { UX_PATTERNS } from './logic/ux/constants/patterns.js';
import { UnicodeNormalizer } from './logic/ux/core/UnicodeNormalizer.js';
import { VietnamesePhonetics } from './logic/ux/validators/VietnamesePhonetics.js';
import { NameNormalizer } from './logic/ux/normalizers/NameNormalizer.js';
import { EthnicNameNormalizer } from './logic/ux/normalizers/EthnicNameNormalizer.js';
import { AddressNormalizer } from './logic/ux/normalizers/AddressNormalizer.js';
import { DateNormalizer } from './logic/ux/normalizers/DateNormalizer.js';
import { NameValidator } from './logic/ux/validators/NameValidator.js';
import { AddressValidator } from './logic/ux/validators/AddressValidator.js';
import { DateValidator } from './logic/ux/validators/DateValidator.js';
import { AddressAutocomplete } from './logic/ux/AddressAutocomplete.js';
import { InputEngine } from './logic/ux/InputEngine.js';
import { LayoutUtils } from './logic/ux/LayoutUtils.js';

// ============================================================
// LAYER 5: Components (depends on UX, Domain)
// ============================================================
// (DateLogic moved to Layer 1 block)
import { TabbedPanel } from './components/TabbedPanel.js';
import { DateGridRenderer } from './components/DateGridRenderer.js';
import { DateGridDOM } from './components/helpers/DateGridDOM.js';
import { DateGridWidget } from './components/DateGridWidget.js';
import { DomFactory } from './components/helpers/DomFactory.js';
import { AddressService } from './components/modules/AddressService.js';
import { FormLogic } from './components/modules/FormLogic.js';
import { FormComponents } from './components/modules/FormComponents.js';
import { CompactFormBuilder } from './components/CompactFormBuilder.js';

// ============================================================
// LAYER 6: Controllers (depends on Components)
// ============================================================
import { UIFeedback } from './controllers/helpers/UIFeedback.js';
import { KeyNormalizer } from './controllers/helpers/KeyNormalizer.js';
import { WeddingProActionHandler } from './controllers/helpers/WeddingProActionHandler.js';
import { ConfigController } from './controllers/ConfigController.js';

// ============================================================
// LAYER 7: Actions (depends on Controllers, Components)
// ============================================================
import { ScanAction } from './actions/ScanAction.js';
import { UpdateAction } from './actions/UpdateAction.js';
import { SwapAction } from './actions/SwapAction.js';
import { ManualInjectAction } from './actions/ManualInjectAction.js';
import { InjectSchemaAction } from './actions/InjectSchemaAction.js';
import { PostflightAction } from './actions/PostflightAction.js';

// ============================================================
// LAYER 8: Infrastructure (Bridge, SchemaLoader)
// ============================================================
import { Bridge } from './bridge.js';
import { SchemaLoader } from './schemaLoader.js';

// ============================================================
// EXPOSE GLOBALS (Required for CEP interop & cross-module refs)
// ============================================================
// Modules that are referenced via globals in templates, event handlers,
// or dynamic typeof checks need to be on window.

// Core & Domain
window.StringUtils = StringUtils;
window.DateUtils = DateUtils;
window.CalendarEngine = CalendarEngine;
window.NameAnalysis = NameAnalysis;
window.WeddingRules = WeddingRules;
window.TimeAutomation = TimeAutomation;
window.VenueAutomation = VenueAutomation;

// Pipeline
window.Normalizer = Normalizer;
window.Validator = Validator;
window.DataValidator = DataValidator;
window.WeddingAssembler = WeddingAssembler;

// Strategies
window.FreshStrategy = FreshStrategy;
window.SmartComplexStrategy = SmartComplexStrategy;
window.StrategyOrchestrator = StrategyOrchestrator;

// UX
window.UX_ABBREVIATIONS = UX_ABBREVIATIONS;
window.UX_ABBREVIATIONS_REVERSE = UX_ABBREVIATIONS_REVERSE;
window.UX_PATTERNS = UX_PATTERNS;
window.UnicodeNormalizer = UnicodeNormalizer;
window.VietnamesePhonetics = VietnamesePhonetics;
window.NameNormalizer = NameNormalizer;
window.AddressNormalizer = AddressNormalizer;
window.DateNormalizer = DateNormalizer;
window.NameValidator = NameValidator;
window.AddressValidator = AddressValidator;
window.DateValidator = DateValidator;
window.AddressAutocomplete = AddressAutocomplete;
window.InputEngine = InputEngine;
window.EthnicNameNormalizer = EthnicNameNormalizer;
window.LayoutUtils = LayoutUtils;

// Components
window.DateLogic = DateLogic;
window.TabbedPanel = TabbedPanel;
window.DateGridRenderer = DateGridRenderer;
window.DateGridDOM = DateGridDOM;
window.DateGridWidget = DateGridWidget;
window.DomFactory = DomFactory;
window.AddressService = AddressService;
window.FormLogic = FormLogic;
window.FormComponents = FormComponents;
window.CompactFormBuilder = CompactFormBuilder;
import { SchemaTabComponents } from './components/modules/SchemaTabComponents.js';
window.SchemaTabComponents = SchemaTabComponents;

// Controllers
window.UIFeedback = UIFeedback;
window.KeyNormalizer = KeyNormalizer;
window.WeddingProActionHandler = WeddingProActionHandler;
window.ConfigController = ConfigController;

// Actions
window.ScanAction = ScanAction;
window.UpdateAction = UpdateAction;
window.SwapAction = SwapAction;
window.ManualInjectAction = ManualInjectAction;
window.InjectSchemaAction = InjectSchemaAction;
window.PostflightAction = PostflightAction;

// Infrastructure
window.SchemaLoader = SchemaLoader;

// ============================================================
// BRIDGE INSTANCE (singleton)
// ============================================================
const bridge = new Bridge();
window.bridge = bridge;

// ============================================================
// APPLICATION CONFIG
// ============================================================
const APP_CONFIG = {
    version: '1.0.0',
    author: 'DinhSon',
    debug: true
};
window.AppConfig = APP_CONFIG;

// ============================================================
// UTILITIES
// ============================================================



// ============================================================
// BUTTON WIRING (delegates to Action modules)
// ============================================================

function wireActionButtons() {
    const scanBtn = document.getElementById('btn-compact-scan');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            ScanAction.execute({
                bridge: bridge,
                builder: window.compactBuilder,
                button: scanBtn
            });
        });
    }

    const updateBtn = document.getElementById('btn-compact-update');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            UpdateAction.execute({
                bridge: bridge,
                builder: window.compactBuilder,
                button: updateBtn
            });
        });
    }

    const swapBtn = document.getElementById('btn-compact-swap');
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            SwapAction.execute({
                builder: window.compactBuilder
            });
        });
    }



    const reloadBtn = document.getElementById('btn-reload-panel');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => location.reload());
    }
}

function _wireSchemaActions(schemaRefs, bridge) {
    // Wire Action Auto
    const btnAuto = schemaRefs['btn-inject-auto'];
    if (btnAuto) {
        btnAuto.addEventListener('click', () => {
            InjectSchemaAction.execute({ bridge, button: btnAuto });
        });
    }

    // Wire Action Bulk
    ['pos1', 'pos2'].forEach(prefix => {
        const btn = schemaRefs[`btn-bulk-${prefix}`];
        if (btn) {
            btn.addEventListener('click', () => {
                ManualInjectAction.injectBulk({ bridge, button: btn, prefix });
            });
        }
    });

    // Wire Action Date (10 nút date.tiec.* + 2 nút clone)
    Object.keys(schemaRefs).forEach(key => {
        if (key.startsWith('btn-date-')) {
            const btn = schemaRefs[key];
            if (key === 'btn-date-clone-le' || key === 'btn-date-clone-nhap') {
                btn.addEventListener('click', () => {
                    ManualInjectAction.injectDateClone({
                        bridge, button: btn,
                        targetMoc: btn.dataset.cloneTarget
                    });
                });
            } else {
                // Nút tiêm đơn date
                btn.addEventListener('click', () => {
                    ManualInjectAction.injectSingle({
                        bridge, button: btn,
                        schemaValue: btn.dataset.schema
                    });
                });
            }
        }
    });

    // Wire Action Single (bao gồm nút compound ho+ten, lot+ten)
    Object.keys(schemaRefs).forEach(key => {
        if (key.startsWith('btn-single-')) {
            const btn = schemaRefs[key];
            btn.addEventListener('click', () => {
                const schemaValue = btn.dataset.schema;
                // Nút compound: value có dạng "key1|key2"
                if (schemaValue && schemaValue.includes('|')) {
                    ManualInjectAction.injectCompound({
                        bridge, button: btn,
                        schemaValue
                    });
                } else {
                    ManualInjectAction.injectSingle({
                        bridge, button: btn,
                        schemaValue
                    });
                }
            });
        }
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

async function _waitForDOM() {
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }
}

function _initCalendarEngine() {
    try {
        const cs = new CSInterface();
        let rootPath = cs.getSystemPath(CSInterface.EXTENSION);
        if (rootPath.startsWith('file://')) rootPath = rootPath.substring(7);
        if (navigator.platform.indexOf('Win') > -1 && rootPath.startsWith('/') && rootPath[2] === ':') {
            rootPath = rootPath.substring(1);
        }
        rootPath = decodeURIComponent(rootPath);
        const csvPath = rootPath + '/data/ngay.csv';

        let fs;
        if (typeof window.require === 'function') {
            fs = window.require('fs');
        } else if (typeof require === 'function') {
            fs = require('fs');
        }

        if (fs && fs.existsSync(csvPath)) {
            const content = fs.readFileSync(csvPath, 'utf8');
            CalendarEngine.loadDatabase(content);
        } else {
            console.warn('[App] CalendarEngine database not found:', csvPath);
        }
    } catch (e) {
        console.error('[App] Failed to init CalendarEngine:', e);
    }
}

function _initEthnicNameNormalizer() {
    try {
        const cs = new CSInterface();
        let rootPath = cs.getSystemPath(CSInterface.EXTENSION);
        if (rootPath.startsWith('file://')) rootPath = rootPath.substring(7);
        if (navigator.platform.indexOf('Win') > -1 && rootPath.startsWith('/') && rootPath[2] === ':') {
            rootPath = rootPath.substring(1);
        }
        rootPath = decodeURIComponent(rootPath);
        const jsonPath = rootPath + '/data/ethnic_names.json';

        let fs;
        if (typeof window.require === 'function') {
            fs = window.require('fs');
        } else if (typeof require === 'function') {
            fs = require('fs');
        }

        if (fs && fs.existsSync(jsonPath)) {
            const content = fs.readFileSync(jsonPath, 'utf8');
            const data = JSON.parse(content);
            EthnicNameNormalizer.init(data);

            // Bridge: inject suggestIdx from UX layer → Domain layer
            NameAnalysis.setSuggestIdxFn((name) => NameValidator.suggestIdx(name));
            console.log('[App] EthnicNameNormalizer ready');
        } else {
            console.warn('[App] ethnic_names.json not found:', jsonPath);
        }
    } catch (e) {
        console.error('[App] Failed to init EthnicNameNormalizer:', e);
    }
}

async function init() {
    // Auto-select all text on Focus (Tabbing)
    document.addEventListener('focusin', function (e) {
        if (e.target.matches('input, textarea')) {
            e.target.select();
        }
    });

    try {
        await _waitForDOM();
        _initCalendarEngine();

        // Check connection silently
        try { await bridge.testConnection(); } catch (e) {
            console.warn('[App] Bridge connection failed silently', e);
        }

        // 1. Preload Core Dependencies
        await AddressAutocomplete.init();
        _initEthnicNameNormalizer();
        const schema = await SchemaLoader.load();

        // 2. Initialize Tab Navigation & Render Forms
        new TabbedPanel({
            tabsSelector: '.ds-tab',
            panelsSelector: '.ds-tab-panel',
            controllers: {
                'compact': {
                    init: () => {
                        const compactContainer = document.getElementById('compact-content');
                        if (compactContainer && schema) {
                            compactContainer.innerHTML = ''; // Clear lazy-load spinner
                            window.compactBuilder = new CompactFormBuilder({
                                container: compactContainer,
                                schema: schema,
                                onChange: () => { }
                            }).build();
                            wireActionButtons();
                        }
                    }
                },
                'schema': {
                    init: () => {
                        const schemaContainer = document.getElementById('schema-content');
                        if (schemaContainer) {
                            // Render UI
                            const schemaRefs = {};
                            const schemaBuilder = new SchemaTabComponents(schemaContainer, schemaRefs);
                            schemaBuilder.render();

                            // Wire Action
                            _wireSchemaActions(schemaRefs, bridge);
                        }
                    }
                },
                'settings': { init: () => { } }
            },
            onTabChange: () => { }
        });

        // 3. Debug & Utilities
        // Reload button now wired via wireActionButtons() inside Compact Tab logic

        // 5. System Ready
        UIFeedback.hideLoading();

    } catch (error) {
        console.error('[App] Boot Failed:', error);
        UIFeedback.showError(document.getElementById('app'), 'Lỗi khởi động panel: ' + error.message);
        UIFeedback.hideLoading();
    }
}

// ============================================================
// START APPLICATION
// ============================================================
init();
