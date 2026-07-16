export function getDocumentRef(deps = {}) {
    return deps.document || document;
}

export function resolveTabbedDom({
    tabsSelector,
    panelsSelector,
    documentRef = getDocumentRef()
}) {
    return {
        tabs: documentRef.querySelectorAll(tabsSelector),
        panels: documentRef.querySelectorAll(panelsSelector)
    };
}

export function bindTabClickHandlers({ tabs, onSelect }) {
    tabs.forEach((tab) => {
        tab.addEventListener('click', (event) => {
            onSelect(event.target.dataset.tab);
        });
    });
}

export function getFirstTabId(tabs = []) {
    return tabs[0] ? tabs[0].dataset.tab : null;
}

export function cleanupTabbedOverlays(documentRef = getDocumentRef()) {
    const autocompleteLists = typeof documentRef?.getElementsByClassName === 'function'
        ? Array.from(documentRef.getElementsByClassName('autocomplete-list') || [])
        : [];

    autocompleteLists.forEach((list) => {
        const ownerId = typeof list.getAttribute === 'function'
            ? list.getAttribute('data-owner-id')
            : null;
        const ownerInput = ownerId && typeof documentRef?.getElementById === 'function'
            ? documentRef.getElementById(ownerId)
            : null;

        if (ownerInput && typeof ownerInput.setAttribute === 'function') {
            ownerInput.setAttribute('aria-expanded', 'false');
            if (typeof ownerInput.removeAttribute === 'function') {
                ownerInput.removeAttribute('aria-activedescendant');
            }
        }

        if (list.parentNode && typeof list.parentNode.removeChild === 'function') {
            list.parentNode.removeChild(list);
        }
    });

}

export function syncTabbedState({ tabs, panels, tabId }) {
    tabs.forEach((tab) => {
        const isActive = tab.dataset.tab === tabId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
        const panelId = panel.id.replace('tab-', '');
        const isActive = panelId === tabId;
        panel.classList.toggle('active', isActive);
    });
}

export function resolveTabLoadContext({
    tabId,
    controllers = {},
    documentRef = getDocumentRef(),
    warn = console.warn
}) {
    const controller = controllers[tabId];
    if (!controller) {
        warn(`[TabbedPanel] No controller for tab: ${tabId}`);
        return null;
    }

    const contentContainer = documentRef.getElementById(`${tabId}-content`);
    if (!contentContainer) {
        warn(`[TabbedPanel] No content container for tab: ${tabId}`);
        return null;
    }

    return { controller, contentContainer };
}
