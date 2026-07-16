import { ToolkitCatalogSearch } from '../catalog/moduleCatalogSearch.js';
import {
    clearLauncherSearch,
    createLauncherState,
    getSelectedResult,
    moveSelection,
    setLauncherQuery
} from './launcherState.js';

function getRequiredElement(documentRef, selector) {
    const element = documentRef.querySelector(selector);
    if (!element) {
        throw new Error(`Toolkit shell is missing element: ${selector}`);
    }
    return element;
}

function applyAvailabilityState(target, manifest) {
    if (manifest.enabled !== false) {
        return;
    }

    target.classList.add('is-disabled');
    target.setAttribute('aria-disabled', 'true');
    if (manifest.disabledReason) {
        target.title = manifest.disabledReason;
    }
}

function appendAvailabilityNotice(documentRef, parent, manifest, className) {
    if (manifest.enabled !== false || !manifest.disabledReason) {
        return;
    }

    const warning = documentRef.createElement('span');
    warning.className = className;
    warning.textContent = manifest.disabledReason;
    parent.appendChild(warning);
}

function createButton(documentRef, manifest, className = 'command-button') {
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.commandId = manifest.id;
    button.dataset.commandStatus = manifest.status;
    applyAvailabilityState(button, manifest);

    const label = documentRef.createElement('span');
    label.className = 'command-button-label';
    label.textContent = manifest.buttonLabel;
    button.appendChild(label);

    appendAvailabilityNotice(documentRef, button, manifest, 'command-button-warning');
    return button;
}

function createResultItem(documentRef, manifest, isSelected) {
    const item = documentRef.createElement('li');
    item.className = `result-item${isSelected ? ' is-selected' : ''}`;
    item.dataset.commandId = manifest.id;
    item.dataset.commandStatus = manifest.status;
    item.tabIndex = 0;
    applyAvailabilityState(item, manifest);

    const title = documentRef.createElement('div');
    title.className = 'result-title';
    title.textContent = manifest.buttonLabel;
    item.appendChild(title);

    appendAvailabilityNotice(documentRef, item, manifest, 'result-warning');
    return item;
}

function getShellElements(documentRef) {
    return {
        searchInput: getRequiredElement(documentRef, '#toolkit-search'),
        summary: getRequiredElement(documentRef, '#toolkit-execution-summary'),
        dashboardGroups: getRequiredElement(documentRef, '#dashboard-groups'),
        resultsPanel: getRequiredElement(documentRef, '#results-panel'),
        resultsList: getRequiredElement(documentRef, '#results-list'),
        resultsCount: getRequiredElement(documentRef, '#results-count'),
        reloadButton: getRequiredElement(documentRef, '#btn-reload-panel')
    };
}

function renderDashboard(documentRef, elements, catalog) {
    const cards = catalog.groups.map((group) => {
        const card = documentRef.createElement('section');
        card.className = 'dashboard-group-card';

        const title = documentRef.createElement('h3');
        title.className = 'dashboard-group-title';
        title.textContent = group.category;
        card.appendChild(title);

        const buttonGrid = documentRef.createElement('div');
        buttonGrid.className = 'dashboard-group-buttons';
        group.items.forEach((manifest) => {
            buttonGrid.appendChild(createButton(documentRef, manifest));
        });
        card.appendChild(buttonGrid);

        return card;
    });

    elements.dashboardGroups.replaceChildren(...cards);
}

function renderResults(documentRef, elements, state) {
    elements.resultsCount.textContent = String(state.results.length);
    elements.resultsList.replaceChildren(
        ...state.results.map((manifest, index) => createResultItem(documentRef, manifest, index === state.selectedIndex))
    );

    const isSearching = Boolean(state.query);
    elements.resultsPanel.hidden = !isSearching;
    elements.dashboardGroups.hidden = isSearching;
}

function attachActionHandlers(elements, executeCommand) {
    function handleActionClick(event) {
        const commandElement = event.target.closest('[data-command-id]');
        if (!commandElement) {
            return;
        }

        void executeCommand(commandElement.dataset.commandId);
    }

    elements.dashboardGroups.addEventListener('click', handleActionClick);
    elements.resultsList.addEventListener('click', handleActionClick);
}

function attachSearchHandlers(elements, shellApi) {
    elements.searchInput.addEventListener('input', (event) => {
        shellApi.handleQueryChange(event.target.value);
    });

    elements.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            shellApi.moveSelectionBy(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            shellApi.moveSelectionBy(-1);
            return;
        }

        if (event.key === 'Enter') {
            const selected = shellApi.getSelectedResult();
            if (selected) {
                event.preventDefault();
                void shellApi.executeCommand(selected.id);
            }
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            shellApi.clearSearchIfNeeded();
        }
    });
}

function buildReadySummary(catalog) {
    return catalog.quarantinedCount > 0
        ? `Ready (${catalog.quarantinedCount} quarantined).`
        : 'Ready.';
}

function createExecuteCommand({ elements, refs, commandRunner, focusSearch, syncResults }) {
    return async function executeCommand(commandId) {
        const manifest = refs.catalog.lookup.get(commandId);
        if (!manifest) {
            return null;
        }

        elements.summary.textContent = `Running ${manifest.buttonLabel}...`;
        const result = await commandRunner.runManifest(manifest);
        elements.summary.textContent = result.message;

        refs.state = clearLauncherSearch(refs.state);
        elements.searchInput.value = '';
        syncResults();
        focusSearch();
        return result;
    };
}

function createShellApi({ refs, syncResults, executeCommand }) {
    return {
        executeCommand,
        handleQueryChange(query) {
            const results = ToolkitCatalogSearch.search(refs.searchIndex, query, 12);
            refs.state = setLauncherQuery(refs.state, query, results);
            syncResults();
        },
        moveSelectionBy(offset) {
            refs.state = moveSelection(refs.state, offset);
            syncResults();
        },
        getSelectedResult() {
            return getSelectedResult(refs.state);
        },
        clearSearchIfNeeded() {
            if (!refs.state.query) {
                return;
            }

            refs.state = clearLauncherSearch(refs.state);
            refs.elements.searchInput.value = '';
            syncResults();
        }
    };
}

function bindReloadButton({ elements, reloadPanel, focusSearch }) {
    elements.reloadButton.addEventListener('click', () => {
        void reloadPanel().catch((error) => {
            elements.summary.textContent = error && error.message ? error.message : 'Toolkit reload failed.';
            focusSearch();
        });
    });
}

export function createToolkitShell({ documentRef = document, catalog, commandRunner, reloadPanel }) {
    const elements = getShellElements(documentRef);
    const refs = {
        catalog,
        searchIndex: ToolkitCatalogSearch.createIndex(catalog.modules),
        state: createLauncherState(),
        elements
    };

    function focusSearch() {
        elements.searchInput.focus();
    }

    function syncResults() {
        renderResults(documentRef, elements, refs.state);
    }

    function syncSearchForCurrentQuery() {
        if (!refs.state.query) {
            refs.state = clearLauncherSearch(refs.state);
            syncResults();
            return;
        }

        const results = ToolkitCatalogSearch.search(refs.searchIndex, refs.state.query, 12);
        refs.state = setLauncherQuery(refs.state, refs.state.query, results);
        syncResults();
    }

    const executeCommand = createExecuteCommand({
        elements,
        refs,
        commandRunner,
        focusSearch,
        syncResults
    });
    const shellApi = createShellApi({
        refs,
        syncResults,
        executeCommand
    });

    attachSearchHandlers(elements, shellApi);
    attachActionHandlers(elements, executeCommand);
    bindReloadButton({ elements, reloadPanel, focusSearch });

    return {
        elements,
        renderInitial() {
            renderDashboard(documentRef, elements, refs.catalog);
            syncResults();
            elements.summary.textContent = buildReadySummary(refs.catalog);
        },
        updateCatalog(nextCatalog) {
            refs.catalog = nextCatalog;
            refs.searchIndex = ToolkitCatalogSearch.createIndex(refs.catalog.modules);
            renderDashboard(documentRef, elements, refs.catalog);
            syncSearchForCurrentQuery();
            if (!refs.state.query) {
                elements.summary.textContent = buildReadySummary(refs.catalog);
            }
        },
        focusSearch,
        getState() {
            return refs.state;
        },
        getCatalog() {
            return refs.catalog;
        },
        executeCommand
    };
}
