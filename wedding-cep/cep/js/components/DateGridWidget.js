/**
 * MODULE: DateGridWidget
 * LAYER: Components
 * PURPOSE: Mediator — init calendar, render view, bind events, orchestrate data flow
 * DEPENDENCIES: DateGridRenderer, DateLogic, DateGridDOM, CalendarEngine, InputEngine
 * SIDE EFFECTS: DOM (via DateGridDOM)
 * EXPORTS: DateGridWidget.create(), .triggerCompute(), .setChangeHandler()
 */
import { DateGridRenderer } from './DateGridRenderer.js';
import { DateGridDOM } from './helpers/DateGridDOM.js';
import { DateGridController } from '../controllers/DateGridController.js';

export const DateGridWidget = {
    _refs: {},
    _controller: null,

    create(container, dateConfigs, refs) {
        this._refs = refs || {};
        const grid = DateGridRenderer.render(container, dateConfigs, this._refs);
        this._bindEvents();

        dateConfigs.forEach(config => {
            if (!config.key.includes('tiec')) {
                setTimeout(() => DateGridDOM.toggleRowState(this._refs, config.key, true), 0);
            }
        });

        return grid;
    },

    setChangeHandler(fn) {
        // Initialize Controller with refs and the Change Handler
        this._controller = new DateGridController(this._refs, fn);
    },

    _bindEvents() {
        if (!this._controller) {
            console.warn("[DateGridWidget] Controller not initialized. Call setChangeHandler first.");
            // Fallback instantiate if out of order
            this._controller = new DateGridController(this._refs, null);
        }

        Object.values(this._refs).forEach(ref => {
            if (ref.tagName === 'INPUT' && ref.type === 'number') {
                ref.addEventListener('blur', () => this._controller.handleBlur(ref));
                ref.addEventListener('input', () => this._controller.handleInput(ref));
            } else if (ref.tagName === 'INPUT' && ref.type === 'checkbox') {
                ref.addEventListener('change', () => {
                    const key = Object.keys(this._refs).find(k => this._refs[k] === ref);
                    if (key) {
                        const baseKey = key.replace('_auto', '');
                        this._controller.handleCheckboxChange(ref, baseKey);
                    }
                });
            }
        });
    },

    // --- Public API (Delegates to Controller) ---

    triggerCompute() {
        if (this._controller) {
            this._controller.triggerCompute();
        }
    }
};

