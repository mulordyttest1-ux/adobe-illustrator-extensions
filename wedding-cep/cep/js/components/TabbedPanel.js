/**
 * MODULE: TabbedPanel
 * LAYER: Components
 * PURPOSE: Tab navigation with lazy loading and controller delegation
 * DEPENDENCIES: None
 * SIDE EFFECTS: DOM (tab switching, lazy content loading)
 * EXPORTS: new TabbedPanel({tabsSelector, panelsSelector, controllers, onTabChange})
 */

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
        this.tabs = document.querySelectorAll(this.tabsSelector);
        this.panels = document.querySelectorAll(this.panelsSelector);

        if (this.tabs.length === 0) {
            console.warn('[TabbedPanel] No tabs found');
            return;
        }

        // Bind click events to tabs
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTo(tabId);
            });
        });

        // Activate the first tab
        const firstTab = this.tabs[0];
        if (firstTab) {
            const firstTabId = firstTab.dataset.tab;
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

        // Update tab buttons
        this.tabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Update panels
        this.panels.forEach(panel => {
            const panelId = panel.id.replace('tab-', '');
            const isActive = panelId === tabId;
            panel.classList.toggle('active', isActive);
        });

        this.activeTabId = tabId;

        // Lazy load content if not loaded yet
        if (!this.loadedTabs.has(tabId)) {
            this._loadTabContent(tabId);
        }

        // Call callback if provided
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
        const controller = this.controllers[tabId];

        if (!controller) {
            console.warn(`[TabbedPanel] No controller for tab: ${tabId}`);
            return;
        }

        const contentContainer = document.getElementById(`${tabId}-content`);

        if (!contentContainer) {
            console.warn(`[TabbedPanel] No content container for tab: ${tabId}`);
            return;
        }

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

