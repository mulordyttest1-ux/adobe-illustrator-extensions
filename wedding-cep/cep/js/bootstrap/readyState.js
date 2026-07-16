const DEFAULT_READY_STATE = Object.freeze({
    status: "booting",
    phase: "init",
    compactReady: false,
    schemaReady: false,
    error: null,
    updatedAt: 0
});

function getWindowRef(deps = {}) {
    return deps.window || window;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export { DEFAULT_READY_STATE };

export function updateReadyState(patch, deps = {}) {
    const targetWindow = getWindowRef(deps);
    const now = deps.now || Date.now;
    const nextState = {
        ...DEFAULT_READY_STATE,
        ...(targetWindow.__WEDDING_APP_READY__ || {}),
        ...patch,
        updatedAt: now()
    };

    targetWindow.__WEDDING_APP_READY__ = nextState;
    return nextState;
}

export function resetReadyState(deps = {}) {
    return updateReadyState({
        status: "booting",
        phase: "init",
        compactReady: false,
        schemaReady: false,
        error: null
    }, deps);
}

export async function waitForReadyState(predicate, options = {}, deps = {}) {
    const timeoutMs = options.timeoutMs || 5000;
    const pollMs = options.pollMs || 50;
    const errorMessage = options.errorMessage || "Wedding app readiness timeout";
    const now = deps.now || Date.now;

    if (options.phase) {
        updateReadyState({ phase: options.phase }, deps);
    }

    const startedAt = now();
    while (now() - startedAt < timeoutMs) {
        const state = getWindowRef(deps).__WEDDING_APP_READY__ || DEFAULT_READY_STATE;
        if (predicate(state)) {
            return state;
        }
        await (deps.sleep || sleep)(pollMs);
    }

    throw new Error(errorMessage);
}
