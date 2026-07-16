export function createLauncherState() {
    return {
        query: '',
        results: [],
        selectedIndex: 0
    };
}

export function setLauncherQuery(state, query, results) {
    return {
        query,
        results: results.slice(),
        selectedIndex: results.length > 0 ? 0 : -1
    };
}

export function moveSelection(state, offset) {
    if (!state.results.length) {
        return { ...state, selectedIndex: -1 };
    }

    const currentIndex = state.selectedIndex < 0 ? 0 : state.selectedIndex;
    const nextIndex = (currentIndex + offset + state.results.length) % state.results.length;

    return {
        ...state,
        selectedIndex: nextIndex
    };
}

export function clearLauncherSearch(state) {
    return {
        ...state,
        query: '',
        results: [],
        selectedIndex: -1
    };
}

export function getSelectedResult(state) {
    if (state.selectedIndex < 0 || state.selectedIndex >= state.results.length) {
        return null;
    }

    return state.results[state.selectedIndex];
}
