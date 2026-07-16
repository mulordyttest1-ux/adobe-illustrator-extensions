/**
 * MODULE: TabbedPanel
 * LAYER: Components
 * PURPOSE: Tab navigation with lazy loading, controller delegation, and transient overlay cleanup
 * DEPENDENCIES: tabbedPanelSupport
 * SIDE EFFECTS: DOM (tab switching, lazy content loading, tab-scoped overlay teardown)
 * EXPORTS: new TabbedPanel({tabsSelector, panelsSelector, controllers, onTabChange})
 */
import {
    bindTabClickHandlers,
    cleanupTabbedOverlays,
    getFirstTabId,
    resolveTabLoadContext,
    resolveTabbedDom,
    syncTabbedState
} from './tabbedPanelSupport.js';

export class TabbedPanel {
    /**
     * Create a TabbedPanel instance.
     * @param {Object} options - Configuration options
     * @param {string} options.tabsSelector - CSS selector for tab buttons
     * @param {string} options.panelsSelector - CSS selector for tab panels
     * @param {Object} options.controllers - Map of tab ID to controller
     * @param {function} [options.onTabChange] - Callback when tab changes
     */
    constructor(options = {}) {
        this.tabsSelector = options.tabsSelector || '.ds-tab';
        this.panelsSelector = options.panelsSelector || '.ds-tab-panel';
        this.controllers = options.controllers || {};
        this.onTabChange = options.onTabChange || null;
        this._document = options.document || document;
        this._warn = options.warn || console.warn;
        this._cleanupOverlays = options.cleanupOverlays || ((documentRef) => cleanupTabbedOverlays(documentRef));

        this.tabs = [];
        this.panels = [];
        this.activeTabId = null;
        this.loadedTabs = new Set();

        this._init();
    }

    /**
     * Initialize the tabbed panel.
     * @private
     */
    _init() {
        const dom = resolveTabbedDom({
            tabsSelector: this.tabsSelector,
            panelsSelector: this.panelsSelector,
            documentRef: this._document
        });
        this.tabs = dom.tabs;
        this.panels = dom.panels;

        if (this.tabs.length === 0) {
            this._warn('[TabbedPanel] No tabs found');
            return;
        }

        bindTabClickHandlers({
            tabs: this.tabs,
            onSelect: (tabId) => {
                this.switchTo(tabId);
            }
        });

        const firstTabId = getFirstTabId(this.tabs);
        if (firstTabId) {
            this.switchTo(firstTabId);
        }
    }

    /**
     * Switch to a specific tab.
     * @param {string} tabId - The tab ID to switch to
     */
    switchTo(tabId) {
        if (!tabId || tabId === this.activeTabId) {
            return;
        }

        this._cleanupOverlays(this._document);
        syncTabbedState({
            tabs: this.tabs,
            panels: this.panels,
            tabId
        });
        this.activeTabId = tabId;

        if (!this.loadedTabs.has(tabId)) {
            this._loadTabContent(tabId);
        }

        if (this.onTabChange) {
            this.onTabChange(tabId);
        }
    }

    /**
     * Load tab content using its controller.
     * @param {string} tabId - The tab ID to load
     * @private
     */
    async _loadTabContent(tabId) {
        const loadContext = resolveTabLoadContext({
            tabId,
            controllers: this.controllers,
            documentRef: this._document,
            warn: this._warn
        });
        if (!loadContext) {
            return;
        }
        const { controller, contentContainer } = loadContext;

        try {
            // Show loading state
            contentContainer.innerHTML = `
                <div class="ds-flex-center ds-p-lg">
                    <div class="ds-loading" style="width: 24px; height: 24px;"></div>
                </div>
            `;

            // Initialize controller
            if (typeof controller.init === 'function') {
                await controller.init(contentContainer);
            } else if (typeof controller.render === 'function') {
                controller.render(contentContainer);
            }

            this.loadedTabs.add(tabId);


        } catch (error) {

            contentContainer.innerHTML = `
                <div class="ds-alert ds-alert-danger">
                    <strong>Lỗi tải module:</strong> ${error.message}
                </div>
            `;
        }
    }

    /**
     * Get the currently active tab ID.
     * @returns {string} Active tab ID
     */
    getActiveTab() {
        return this.activeTabId;
    }

    /**
     * Check if a tab has been loaded.
     * @param {string} tabId - The tab ID to check
     * @returns {boolean} True if loaded
     */
    isLoaded(tabId) {
        return this.loadedTabs.has(tabId);
    }

    /**
     * Force reload a tab's content.
     * @param {string} tabId - The tab ID to reload
     */
    async reload(tabId) {
        this.loadedTabs.delete(tabId);
        await this._loadTabContent(tabId);
    }
}

