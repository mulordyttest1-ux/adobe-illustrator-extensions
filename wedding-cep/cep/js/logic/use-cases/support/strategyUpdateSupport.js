export function createFrameCollectFailureResult(result) {
    return {
        success: false,
        error: result ? result.error : 'Collect failed'
    };
}

export function createNoFramesResult(frames = []) {
    if (frames.length > 0) {
        return null;
    }

    return {
        success: true,
        updated: 0,
        affected: [],
        message: 'No frames found',
        templateBindings: []
    };
}

export function createNoPlansResult(plans = [], templateBindings = []) {
    if (plans.length > 0) {
        return null;
    }

    return {
        success: true,
        updated: 0,
        affected: [],
        message: 'No changes needed',
        templateBindings
    };
}

export function createApplyFailureResult(result) {
    return {
        success: false,
        error: result?.error || 'Apply failed'
    };
}

export function createApplySuccessResult(result, templateBindings = []) {
    return {
        success: true,
        updated: result.updated || 0,
        affected: result.affected || [],
        message: result.message,
        templateBindings
    };
}
