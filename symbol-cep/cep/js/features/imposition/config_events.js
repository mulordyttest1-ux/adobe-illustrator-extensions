/**
 * MODULE: ConfigEvents
 * LAYER: UI/Events (L6)
 * PURPOSE: Event binding for config tab shell interactions
 * DEPENDENCIES: ConfigPersistence
 * SIDE EFFECTS: DOM event listeners
 * EXPORTS: ConfigEvents
 */
import {
    handleConfigChange,
    handleConfigClick,
    handleConfigSubmit
} from './preset-config/configEventService.js';

export const ConfigEvents = {
    bindEvents(tab) {
        this._tab = tab;

        tab.container.addEventListener('click', async (event) => {
            await handleConfigClick(event, tab);
        });

        tab.container.addEventListener('submit', async (event) => {
            await handleConfigSubmit(event, tab);
        });

        tab.container.addEventListener('change', (event) => {
            handleConfigChange(event, tab);
        });
    },

    evaluateConditionals() {
        // Tweakpane renderer manages its own visibility and state.
    }
};
