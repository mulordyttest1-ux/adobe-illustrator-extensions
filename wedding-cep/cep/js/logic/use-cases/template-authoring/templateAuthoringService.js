import { runInjectSchemaService } from './injectSchemaService.js';
import { runManualInjectService } from './manualInjectService.js';

function createDeps(overrides = {}) {
    return {
        runInjectSchemaService: overrides.runInjectSchemaService || runInjectSchemaService,
        runManualInjectService: overrides.runManualInjectService || runManualInjectService
    };
}

export async function runTemplateAuthoringService(input = {}, overrides = {}) {
    const deps = createDeps(overrides);
    const mode = input.mode || 'auto';

    switch (mode) {
        case 'auto':
            return deps.runInjectSchemaService({
                hostFacade: input.hostFacade || input.bridge,
                bridge: input.bridge || input.hostFacade,
                targetType: input.targetType || 'tiec'
            }, overrides);
        case 'single':
        case 'compound':
        case 'bulk':
        case 'dateClone':
            return deps.runManualInjectService(input, overrides);
        default:
            return {
                success: false,
                reason: 'UNKNOWN_MODE'
            };
    }
}
