/**
 * MODULE: DateGridWidget
 * LAYER: Components/DateGrid
 * PURPOSE: Mediator instance for one DateGrid render tree
 * DEPENDENCIES: DateGridRenderer, DateGridDOM, DateGridController
 * SIDE EFFECTS: DOM (via DateGridDOM)
 * EXPORTS: DateGridWidget class
 */
import { DateGridRenderer } from './DateGridRenderer.js';
import { DateGridDOM } from './DateGridDOM.js';
import { DateGridController } from './DateGridController.js';
import {
    bindDateGridWidgetEvents,
    ensureWidgetController,
    scheduleDependentRowLocks
} from './dateGridWidgetSupport.js';

export class DateGridWidget {
    constructor(options = {}) {
        this._refs = {};
        this._controller = null;
        this._renderer = options.renderer || DateGridRenderer;
        this._dateGridDom = options.dateGridDom || DateGridDOM;
        this._controllerClass = options.controllerClass || DateGridController;
        this._setTimeout = options.setTimeout || setTimeout;
        this._warn = options.warn || console.warn;
    }

    create(container, dateConfigs, refs) {
        this._refs = refs || {};
        const grid = this._renderer.render(container, dateConfigs, this._refs);
        this._bindEvents();
        scheduleDependentRowLocks({
            dateConfigs,
            refs: this._refs,
            setTimeout: this._setTimeout,
            toggleRowState: this._dateGridDom.toggleRowState.bind(this._dateGridDom)
        });

        return grid;
    }

    setChangeHandler(fn) {
        this._controller = new this._controllerClass(this._refs, fn);
    }

    _bindEvents() {
        this._controller = ensureWidgetController({
            controller: this._controller,
            controllerClass: this._controllerClass,
            refs: this._refs,
            warn: this._warn
        });
        bindDateGridWidgetEvents({
            refs: this._refs,
            getController: () => this._controller
        });
    }

    triggerCompute() {
        if (this._controller) {
            this._controller.triggerCompute();
        }
    }
}
