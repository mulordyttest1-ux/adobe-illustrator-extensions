import { UIFeedback } from '@shared/cep-ui';

import { Bridge } from '../../bridge.js';
import { ConfirmService } from '../imposition/confirm_service.js';
import { ConfigEngine } from '../imposition/config_engine.js';
import { createConfigPersistence } from '../imposition/config_persistence.js';
import { pickImpositionDirectory } from '../imposition/impositionDirectoryPicker.js';
import { createImpositionHostGateway } from '../imposition/impositionHostGateway.js';
import { createJobSaveTargetStore } from '../imposition/jobSaveTargetStore.js';
import { createCepPresetRepository } from '../imposition/preset_repository.js';
import { PreflightOrchestrator } from '../imposition/preflight/PreflightOrchestrator.js';
import { PostflightOrchestrator } from '../imposition/postflight/PostflightOrchestrator.js';
import { SchemaMutationService } from '../imposition/schema_mutation_service.js';
import { createWeddingSuiteBridgeAdapter, pickDirectory, pickSourceFile } from '../wedding-suite-standard/bridgeAdapter.js';
import { scanPdfManifest } from '../wedding-suite-standard/pdfManifestScanner.js';
import { createWeddingSuitePreferencesStore } from '../wedding-suite-standard/preferencesStore.js';
import { createDebugSurface } from './debugSurface.js';
import { POSTFLIGHT_RULE_REGISTRY, PREFLIGHT_RULE_REGISTRY } from './ruleRegistry.js';
import { TAB_REGISTRY } from './tabRegistry.js';

export function shouldEnableDebugByDefault(storage = null) {
    try {
        if (window.__IMPOSITION_DEBUG__ === true) return true;
        const targetStorage = storage || window.localStorage;
        return targetStorage.getItem('imposition_debug') === '1';
    } catch {
        return false;
    }
}

export function loadHostScripts(csInterface) {
    const extensionRoot = csInterface.getSystemPath(CSInterface.EXTENSION) + '/jsx/';
    csInterface.evalScript(`$.evalFile("${extensionRoot}host.jsx")`);
}

export function instantiateRules(orchestrator, registry) {
    (registry || []).forEach((entry) => {
        const rule = typeof entry === 'function' && typeof entry.prototype?.run === 'function'
            ? new entry()
            : (typeof entry === 'function' ? entry() : entry);
        orchestrator.registerRule(rule);
    });
    return orchestrator;
}

export function bootTabs(tabRegistry, deps) {
    return (tabRegistry || []).reduce((acc, descriptor) => {
        const tab = descriptor.create(deps);
        tab.init(descriptor.containerId);
        acc[descriptor.key] = tab;
        return acc;
    }, {});
}

// eslint-disable-next-line complexity
export function createAppDependencies(overrides = {}) {
    const csInterface = overrides.csInterface || new CSInterface();
    const bridge = overrides.bridge || new Bridge();
    const presetRepository = overrides.presetRepository || createCepPresetRepository();
    const preflightOrchestrator = instantiateRules(
        overrides.preflightOrchestrator || new PreflightOrchestrator(),
        overrides.preflightRuleRegistry || PREFLIGHT_RULE_REGISTRY
    );
    const postflightOrchestrator = instantiateRules(
        overrides.postflightOrchestrator || new PostflightOrchestrator(),
        overrides.postflightRuleRegistry || POSTFLIGHT_RULE_REGISTRY
    );
    const notifier = overrides.notifier || {
        showToast(message, tone) {
            UIFeedback.showToast(message, tone);
        }
    };
    const impositionHostGateway = overrides.impositionHostGateway || createImpositionHostGateway({
        bridge,
        csInterface
    });
    const impositionJobSaveTargetStore = overrides.impositionJobSaveTargetStore || createJobSaveTargetStore(
        typeof window !== 'undefined' ? window.localStorage : null
    );
    const weddingSuitePreferencesStore = overrides.weddingSuitePreferencesStore || createWeddingSuitePreferencesStore(
        typeof window !== 'undefined' ? window.localStorage : null
    );
    const weddingSuiteHostGateway = overrides.weddingSuiteHostGateway || createWeddingSuiteBridgeAdapter(bridge);

    return {
        bridge,
        configEngine: overrides.configEngine || ConfigEngine,
        configPersistence: overrides.configPersistence || createConfigPersistence({ presetRepository }),
        impositionPickDirectory: overrides.impositionPickDirectory || pickImpositionDirectory,
        csInterface,
        impositionHostGateway,
        impositionJobSaveTargetStore,
        notifier,
        postflightOrchestrator,
        preflightOrchestrator,
        presetRepository,
        schemaMutationService: overrides.schemaMutationService || SchemaMutationService,
        weddingSuiteHostGateway,
        weddingSuitePdfScanner: overrides.weddingSuitePdfScanner || scanPdfManifest,
        weddingSuitePickDirectory: overrides.weddingSuitePickDirectory || pickDirectory,
        weddingSuitePickSourceFile: overrides.weddingSuitePickSourceFile || pickSourceFile,
        weddingSuitePreferencesStore
    };
}

export function createImpositionRuntime(tabs, deps) {
    const runtime = {
        ...tabs,
        debug: undefined,
        enableDebug() {
            if (!this.debug) {
                this.debug = createDebugSurface({
                    actionTab: tabs.actionTab,
                    configTab: tabs.configTab,
                    configEngine: deps.configEngine,
                    presetRepository: deps.presetRepository,
                    preflightRule: PREFLIGHT_RULE_REGISTRY[0]
                });
            }
            return this.debug;
        },
        disableDebug() {
            this.debug = undefined;
            ConfirmService.dismissIfOpen();
        },
        isDebugEnabled() {
            return !!this.debug;
        },
        dismissTransientUi() {
            ConfirmService.dismissIfOpen();
        }
    };

    return runtime;
}

export function bootSymbolApp(overrides = {}) {
    const deps = createAppDependencies(overrides);
    loadHostScripts(deps.csInterface);

    const storageHealth = deps.presetRepository.inspectStorage();
    const tabs = bootTabs(overrides.tabRegistry || TAB_REGISTRY, deps);

    ConfirmService.dismissIfOpen();

    if (storageHealth && storageHealth.reason !== 'ok' && storageHealth.message) {
        deps.notifier.showToast(storageHealth.message, 'warning');
    }

    const runtime = createImpositionRuntime(tabs, deps);
    window.Imposition = runtime;

    if (shouldEnableDebugByDefault()) {
        runtime.enableDebug();
    }

    return {
        deps,
        runtime,
        tabs
    };
}
