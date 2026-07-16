import { GENERATED_TOOLKIT_MODULES } from '../../../.generated/module_catalog.js';
import { createToolkitCatalog } from './moduleCatalog.js';

export function loadGeneratedToolkitCatalog(hostRuntimeMeta = null) {
    return createToolkitCatalog(GENERATED_TOOLKIT_MODULES, hostRuntimeMeta);
}
