import { runInjectSchemaDocument } from '../injectSchemaDocument.js';
import { applySelectionPlans, fetchSelectedFrames } from './templateAuthoringIO.js';

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function buildSuccessResult(injectionResult, applyResult = null) {
    const changes = normalizeArray(injectionResult?.changes);
    const orphans = normalizeArray(injectionResult?.orphans);
    const missedRequired = normalizeArray(injectionResult?.missedRequired);

    return {
        success: true,
        changes,
        orphans,
        missedRequired,
        hasChanges: changes.length > 0,
        hasOrphans: orphans.length > 0,
        count: applyResult?.updated || 0,
        affected: applyResult?.affected || []
    };
}

export async function runInjectSchemaService({ hostFacade, bridge, targetType = 'tiec' } = {}, deps = {}) {
    const resolvedHostFacade = hostFacade || bridge;
    const fetchSelectedFramesImpl = deps.fetchSelectedFrames || fetchSelectedFrames;
    const applySelectionPlansImpl = deps.applySelectionPlans || applySelectionPlans;
    const runInjectSchemaDocumentImpl = deps.runInjectSchemaDocument || runInjectSchemaDocument;
    const selectionResult = await fetchSelectedFramesImpl({
        hostFacade: resolvedHostFacade,
        bridge: resolvedHostFacade
    });
    if (!selectionResult.success) {
        return {
            success: false,
            reason: selectionResult.reason,
            error: selectionResult.error
        };
    }

    const injectionResult = runInjectSchemaDocumentImpl({
        frames: selectionResult.frames,
        targetType
    });
    const baseResult = buildSuccessResult(injectionResult);

    if (!baseResult.hasChanges) {
        return baseResult;
    }

    const applyResult = await applySelectionPlansImpl({
        hostFacade: resolvedHostFacade,
        bridge: resolvedHostFacade,
        plans: baseResult.changes
    });
    if (!applyResult.success) {
        return {
            success: false,
            reason: 'APPLY_FAILED',
            error: applyResult.error
        };
    }

    return buildSuccessResult(injectionResult, applyResult);
}
