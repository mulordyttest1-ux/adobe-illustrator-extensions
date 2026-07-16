import {
    buildBulkInjectionPlans,
    buildCompoundInjectionPlans,
    buildDateClonePlans,
    buildSingleInjectionPlans
} from './manualInjectionPlanner.js';
import { applySelectionPlans, fetchSelectedFrames } from './templateAuthoringIO.js';

function createDeps(overrides = {}) {
    return {
        fetchSelectedFrames: overrides.fetchSelectedFrames || fetchSelectedFrames,
        applySelectionPlans: overrides.applySelectionPlans || applySelectionPlans,
        buildSingleInjectionPlans: overrides.buildSingleInjectionPlans || buildSingleInjectionPlans,
        buildCompoundInjectionPlans: overrides.buildCompoundInjectionPlans || buildCompoundInjectionPlans,
        buildBulkInjectionPlans: overrides.buildBulkInjectionPlans || buildBulkInjectionPlans,
        buildDateClonePlans: overrides.buildDateClonePlans || buildDateClonePlans
    };
}

function buildPlans({ mode, schemaValue, prefix, targetMoc }, frames, deps) {
    switch (mode) {
        case 'single':
            return deps.buildSingleInjectionPlans({ frames, schemaValue });
        case 'compound':
            return deps.buildCompoundInjectionPlans({ frames, schemaValue });
        case 'bulk':
            return deps.buildBulkInjectionPlans({ frames, prefix });
        case 'dateClone':
            return deps.buildDateClonePlans({ frames, targetMoc });
        default:
            return { success: false, reason: 'UNKNOWN_MODE' };
    }
}

function buildSuccessResult(planResult, applyResult) {
    return {
        success: true,
        count: Array.isArray(planResult?.plans) ? planResult.plans.length : 0,
        affected: applyResult?.affected || [],
        keys: Array.isArray(planResult?.keys) ? planResult.keys : [],
        affectedCount: typeof planResult?.affectedCount === 'number'
            ? planResult.affectedCount
            : (Array.isArray(planResult?.plans) ? planResult.plans.length : 0)
    };
}

export async function runManualInjectService(input = {}, overrides = {}) {
    const resolvedHostFacade = input.hostFacade || input.bridge;
    const deps = createDeps(overrides);
    const selectionResult = await deps.fetchSelectedFrames({
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

    const planResult = buildPlans(input, selectionResult.frames, deps);
    if (!planResult.success) {
        return {
            success: false,
            reason: planResult.reason,
            frameCount: planResult.frameCount
        };
    }

    const applyResult = await deps.applySelectionPlans({
        hostFacade: resolvedHostFacade,
        bridge: resolvedHostFacade,
        plans: planResult.plans
    });
    if (!applyResult.success) {
        return {
            success: false,
            reason: 'APPLY_FAILED',
            error: applyResult.error
        };
    }

    return buildSuccessResult(planResult, applyResult);
}
