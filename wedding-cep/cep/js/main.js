/**
 * MODULE: Main
 * LAYER: Entry
 * PURPOSE: CEP Panel entry point — init, tab setup, button wiring (delegates to Action modules)
 * DEPENDENCIES: Bridge, TabbedPanel, SchemaLoader, CompactFormBuilder, ScanAction, UpdateAction, SwapAction
 * SIDE EFFECTS: DOM (loading overlay, error display, toast), CEP Bridge
 * EXPORTS: window.AppConfig, window.showToast
 */

(function () {
    'use strict';

    const APP_CONFIG = {
        version: '1.0.0',
        author: 'DinhSon',
        debug: true
    };

    // ========================================
    // INITIALIZATION
    // ========================================

    async function init() {
        // Auto-select all text on Focus (Tabbing)
        document.addEventListener('focusin', function (e) {
            if (e.target.matches('input, textarea')) {
                e.target.select();
            }
        });

        try {
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            await testConnection();

            // Initialize tabbed panel with controllers
            new TabbedPanel({
                tabsSelector: '.ds-tab',
                panelsSelector: '.ds-tab-panel',
                controllers: {
                    'compact': {
                        init: async (_container) => {
                            const compactContainer = document.getElementById('compact-content');
                            if (!compactContainer || !window.CompactFormBuilder) return;

                            if (typeof AddressAutocomplete !== 'undefined') {
                                await AddressAutocomplete.init();
                            }

                            SchemaLoader.load().then(schema => {
                                window.compactBuilder = new CompactFormBuilder({
                                    container: compactContainer,
                                    schema: schema,
                                    onChange: (_key, _value, _data) => { }
                                }).build();

                                // Wire buttons → Action modules
                                wireActionButtons();

                            }).catch(_err => {
                                compactContainer.innerHTML = '<p style="color:red">Lỗi load schema</p>';
                            });
                        }
                    },
                    'settings': {
                        init: (_container) => { }
                    }
                },
                onTabChange: (_tabId) => { }
            });

            setupDebugButtons();
            hideLoading();

        } catch (error) {
            showError('Lỗi khởi động panel: ' + error.message);
            hideLoading();
        }
    }

    // ========================================
    // BUTTON WIRING (delegates to Action modules)
    // ========================================

    function wireActionButtons() {
        const scanBtn = document.getElementById('btn-compact-scan');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                ScanAction.execute({
                    bridge: bridge,
                    builder: window.compactBuilder,
                    showToast: showToast,
                    button: scanBtn
                });
            });
        }

        const updateBtn = document.getElementById('btn-compact-update');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                UpdateAction.execute({
                    bridge: bridge,
                    builder: window.compactBuilder,
                    showToast: showToast,
                    button: updateBtn
                });
            });
        }

        const swapBtn = document.getElementById('btn-compact-swap');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                SwapAction.execute({
                    builder: window.compactBuilder,
                    showToast: showToast
                });
            });
        }
    }

    // ========================================
    // UTILITIES
    // ========================================

    async function testConnection() {
        try {
            return await bridge.testConnection();
        } catch {
            return false;
        }
    }

    function setupDebugButtons() {
        const reloadBtn = document.getElementById('btn-reload-panel');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => location.reload());
        }
    }

    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }
    }

    function showError(message) {
        const app = document.getElementById('app');
        if (app) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'ds-alert ds-alert-danger';
            errorDiv.innerHTML = `<strong>Lỗi:</strong> ${message}`;
            app.prepend(errorDiv);
        }
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ========================================
    // GLOBAL EXPORTS
    // ========================================

    window.AppConfig = APP_CONFIG;
    window.showToast = showToast;

    // ========================================
    // START APPLICATION
    // ========================================

    init();

})();
