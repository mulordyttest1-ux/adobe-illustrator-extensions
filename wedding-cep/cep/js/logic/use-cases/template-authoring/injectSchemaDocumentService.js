import { SchemaInjector } from '../../schema/SchemaInjector.js';
import { LayoutUtils } from '../../ux/LayoutUtils.js';

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

export function runInjectSchemaDocumentService({ frames = [], targetType = 'tiec' } = {}, deps = {}) {
    const layoutUtils = deps.layoutUtils || LayoutUtils;
    const schemaInjector = deps.schemaInjector || SchemaInjector;
    const sortedFrames = layoutUtils.sortFrames(frames);
    const computedChanges = schemaInjector.computeChanges(sortedFrames, targetType);
    const changes = normalizeArray(computedChanges?.changes);
    const orphans = normalizeArray(computedChanges?.orphans);
    const missedRequired = normalizeArray(computedChanges?.missedRequired);

    return {
        changes,
        orphans,
        missedRequired,
        hasChanges: changes.length > 0,
        hasOrphans: orphans.length > 0
    };
}
