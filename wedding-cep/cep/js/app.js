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
import { CalendarEngine } from './logic/domain/calendar.js';
import { NameAnalysis } from './logic/domain/name.js';
import { WeddingRules } from './logic/domain/rules.js';
import { TimeAutomation } from './logic/domain/time.js';
import { VenueAutomation } from './logic/domain/venue.js';
import { SmartContent } from './logic/domain/smart.js';
import { ConflictResolver } from './logic/domain/conflict.js';
import { DataResolver } from './logic/domain/resolver.js';
import { IsolationChecker } from './logic/domain/isolation.js';

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
import { AddressNormalizer } from './logic/ux/normalizers/AddressNormalizer.js';
import { DateNormalizer } from './logic/ux/normalizers/DateNormalizer.js';
import { NameValidator } from './logic/ux/validators/NameValidator.js';
import { AddressValidator } from './logic/ux/validators/AddressValidator.js';
import { DateValidator } from './logic/ux/validators/DateValidator.js';
import { AddressAutocomplete } from './logic/ux/AddressAutocomplete.js';
import { InputEngine } from './logic/ux/InputEngine.js';

// ============================================================
// LAYER 5: Components (depends on UX, Domain)
// ============================================================
import { DateLogic } from './logic/DateLogic.js';
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
window.SmartContent = SmartContent;
window.ConflictResolver = ConflictResolver;
window.DataResolver = DataResolver;
window.IsolationChecker = IsolationChecker;

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

// Controllers
window.UIFeedback = UIFeedback;
window.KeyNormalizer = KeyNormalizer;
window.WeddingProActionHandler = WeddingProActionHandler;
window.ConfigController = ConfigController;

// Actions
window.ScanAction = ScanAction;
window.UpdateAction = UpdateAction;
window.SwapAction = SwapAction;

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



function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
}

function showError(message) {
    const app = document.getElementById('app');
    if (app) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ds-alert ds-alert-danger';
        errorDiv.innerHTML = `<strong>Lỗi:</strong> ${message}`;
        app.prepend(errorDiv);
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}
window.showToast = showToast;

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
                showToast: showToast,
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
                showToast: showToast,
                button: updateBtn
            });
        });
    }

    const swapBtn = document.getElementById('btn-compact-swap');
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            SwapAction.execute({
                builder: window.compactBuilder,
                showToast: showToast
            });
        });
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init() {
    // Auto-select all text on Focus (Tabbing)
    document.addEventListener('focusin', function (e) {
        if (e.target.matches('input, textarea')) {
            e.target.select();
        }
    });

    try {
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Check connection silently
        try { await bridge.testConnection(); } catch { }

        // Initialize tabbed panel with controllers
        new TabbedPanel({
            tabsSelector: '.ds-tab',
            panelsSelector: '.ds-tab-panel',
            controllers: {
                'compact': {
                    init: async () => {
                        const compactContainer = document.getElementById('compact-content');
                        if (!compactContainer) return;

                        await AddressAutocomplete.init();

                        SchemaLoader.load().then(schema => {
                            window.compactBuilder = new CompactFormBuilder({
                                container: compactContainer,
                                schema: schema,
                                onChange: () => { }
                            }).build();

                            wireActionButtons();

                        }).catch(() => {
                            compactContainer.innerHTML = '<p style="color:red">Lỗi load schema</p>';
                        });
                    }
                },
                'settings': {
                    init: () => { }
                }
            },
            onTabChange: () => { }
        });

        // Debug buttons
        const reloadBtn = document.getElementById('btn-reload-panel');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => location.reload());
        }

        hideLoading();

    } catch (error) {
        showError('Lỗi khởi động panel: ' + error.message);
        hideLoading();
    }
}

// ============================================================
// START APPLICATION
// ============================================================
init();
