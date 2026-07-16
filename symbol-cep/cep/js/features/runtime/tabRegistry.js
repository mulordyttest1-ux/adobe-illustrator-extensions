import { ActionTab } from '../imposition/action_tab.js';
import { ConfigTab } from '../imposition/config_tab.js';
import { WeddingSuiteTab } from '../wedding-suite-standard/WeddingSuiteTab.js';

export const TAB_REGISTRY = [
    {
        key: 'actionTab',
        containerId: 'action-container',
        create(deps) {
            return new ActionTab({
                bridgeInst: deps.bridge,
                configEngine: deps.configEngine,
                csInterface: deps.csInterface,
                hostGateway: deps.impositionHostGateway,
                jobSaveTargetStore: deps.impositionJobSaveTargetStore,
                notifier: deps.notifier,
                postflightOrchestrator: deps.postflightOrchestrator,
                preflightOrchestrator: deps.preflightOrchestrator,
                presetRepository: deps.presetRepository
            });
        }
    },
    {
        key: 'configTab',
        containerId: 'config-container',
        create(deps) {
            return new ConfigTab({
                bridge: deps.bridge,
                notifier: deps.notifier,
                pickDirectory: deps.impositionPickDirectory,
                presetRepository: deps.presetRepository,
                schemaMutationService: deps.schemaMutationService,
                persistence: deps.configPersistence
            });
        }
    },
    {
        key: 'weddingSuiteTab',
        containerId: 'suite-container',
        create(deps) {
            return new WeddingSuiteTab({
                bridge: deps.bridge,
                hostAdapter: deps.weddingSuiteHostGateway,
                pdfScanner: deps.weddingSuitePdfScanner,
                pickDirectory: deps.weddingSuitePickDirectory,
                pickSourceFile: deps.weddingSuitePickSourceFile,
                preferencesStore: deps.weddingSuitePreferencesStore
            });
        }
    }
];
