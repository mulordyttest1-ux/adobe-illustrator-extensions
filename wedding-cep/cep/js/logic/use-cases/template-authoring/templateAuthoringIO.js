export async function fetchSelectedFrames({ hostFacade, bridge }) {
    const resolvedHostFacade = hostFacade || bridge;
    const result = await resolvedHostFacade.readSelectionObjects();

    if (!result || !result.success) {
        return {
            success: false,
            reason: 'READ_FAILED',
            error: result?.error || 'Unknown'
        };
    }

    const frames = result.data || [];
    if (frames.length === 0) {
        return {
            success: false,
            reason: 'EMPTY_SELECTION',
            frames: []
        };
    }

    return {
        success: true,
        frames
    };
}

export async function applySelectionPlans({ hostFacade, bridge, plans }) {
    const resolvedHostFacade = hostFacade || bridge;
    if (!Array.isArray(plans) || plans.length === 0) {
        return {
            success: true,
            updated: 0,
            affected: []
        };
    }

    const result = await resolvedHostFacade.applyPlan(plans);
    if (!result || !result.success) {
        return {
            success: false,
            error: result?.error || 'Unknown'
        };
    }

    return {
        success: true,
        updated: result.updated || 0,
        affected: result.affected || []
    };
}
