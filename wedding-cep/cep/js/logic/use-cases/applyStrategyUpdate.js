import { StrategyOrchestrator } from '../strategies/StrategyOrchestrator.js';
import {
    createApplyFailureResult,
    createApplySuccessResult,
    createFrameCollectFailureResult,
    createNoFramesResult,
    createNoPlansResult
} from './support/strategyUpdateSupport.js';
import { extractTemplateBindingsFromFrames } from './support/templateBindings.js';

function resolveStrategyDeps(deps = {}) {
    return {
        collectFrames: deps.collectFrames || ((hostFacade) => hostFacade.collectFrames()),
        applyPlan: deps.applyPlan || ((hostFacade, plans) => hostFacade.applyPlan(plans)),
        createOrchestrator: deps.createOrchestrator || (() => new StrategyOrchestrator())
    };
}

async function readFrames(hostFacade, collectFrames) {
    const collectResult = await collectFrames(hostFacade);
    if (!collectResult || !collectResult.success) {
        return createFrameCollectFailureResult(collectResult);
    }

    return {
        success: true,
        frames: collectResult.data || []
    };
}

async function applyStrategyPlans(hostFacade, plans, templateBindings, applyPlan) {
    const result = await applyPlan(hostFacade, plans);
    if (!result || !result.success) {
        return createApplyFailureResult(result);
    }

    return createApplySuccessResult(result, templateBindings);
}

export async function runApplyStrategyUpdate({ hostFacade, bridge, packet } = {}, deps = {}) {
    const resolvedHostFacade = hostFacade || bridge;
    if (!resolvedHostFacade) {
        throw new Error('runApplyStrategyUpdate requires a hostFacade');
    }

    const resolvedDeps = resolveStrategyDeps(deps);

    try {
        const frameResult = await readFrames(resolvedHostFacade, resolvedDeps.collectFrames);
        if (!frameResult.success) {
            return frameResult;
        }

        const noFramesResult = createNoFramesResult(frameResult.frames);
        if (noFramesResult) {
            return noFramesResult;
        }

        const templateBindings = extractTemplateBindingsFromFrames(frameResult.frames);
        const plans = resolvedDeps.createOrchestrator().planFrames(frameResult.frames, packet);
        const noPlansResult = createNoPlansResult(plans, templateBindings);
        if (noPlansResult) {
            return noPlansResult;
        }

        return await applyStrategyPlans(resolvedHostFacade, plans, templateBindings, resolvedDeps.applyPlan);
    } catch (error) {
        return { success: false, error: error.message };
    }
}
