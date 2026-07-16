/**
 * MODULE: DomFactory
 * LAYER: Components/Helpers
 * PURPOSE: Pure stateless DOM element factory - creates panels, rows, inputs, selects, checkboxes
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (creates detached elements)
 * EXPORTS: DomFactory.createPanel(), .createRow(), .createLabel(), .createRadioGroup(), etc.
 */
import {
    createButtonElement,
    createColumnElement,
    createDebounced,
    createElement,
    createInputFieldGroup,
    createLabeledCheckboxParts,
    createPanelShell,
    createRadioGroupParts,
    createSelectElement,
    createSeparatorElement,
    createSpanElement,
    createTextareaElement,
    createTextareaFieldGroup,
    createTextareaWithAutoFieldGroup
} from './domFactorySupport.js';

export class DomFactory {
    /**
     * Create a panel with header and body
     * @param {string} title - Panel title
     * @returns {HTMLElement}
     */
    static createPanel(title) {
        return createPanelShell(title).panel;
    }

    /**
     * Create a row container
     * @returns {HTMLElement}
     */
    static createRow() {
        return createElement('div', { className: 'compact-row' });
    }

    /**
     * Create a label
     * @param {string} text - Label text
     * @returns {HTMLElement}
     */
    static createLabel(text) {
        return createElement('span', {
            className: 'compact-label',
            textContent: text
        });
    }

    /**
     * Create inline radio group
     * @param {string} name - Radio group name
     * @param {string[]} options - Radio options
     * @param {string} suffix - Value suffix
     * @param {Object} config - Radio rendering options
     * @returns {{ element: HTMLElement, inputs: HTMLInputElement[] }}
     */
    static createRadioGroup(name, options, suffix = '', config = {}) {
        const { group, inputs } = createRadioGroupParts(name, options, suffix, config);
        return { element: group, inputs };
    }

    /**
     * Create textarea
     * @param {number} rows - Number of rows
     * @returns {HTMLTextAreaElement}
     */
    static createTextarea(rows = 1) {
        return createTextareaElement(rows);
    }

    /**
     * Create textarea with IDX input
     * @param {number} rows - Number of rows
     * @param {boolean} hasIdx - Include IDX input
     * @returns {{ element: HTMLElement, textarea: HTMLTextAreaElement, idx?: HTMLInputElement }}
     */
    static createTextareaWithIdx(rows = 1, hasIdx = false) {
        return createTextareaFieldGroup(rows, hasIdx);
    }

    /**
     * Create textarea with optional auto checkbox
     * @param {number} rows - Number of rows
     * @param {boolean} hasAuto - Include auto checkbox
     * @returns {{ element: HTMLElement, textarea: HTMLTextAreaElement, checkbox?: HTMLInputElement }}
     */
    static createTextareaWithAuto(rows = 2, hasAuto = false) {
        return createTextareaWithAutoFieldGroup(rows, hasAuto);
    }

    /**
     * Create input with optional auto checkbox
     * @param {boolean} hasAuto - Include auto checkbox
     * @returns {{ element: HTMLElement, input: HTMLInputElement, checkbox?: HTMLInputElement }}
     */
    static createInputWithAuto(hasAuto = false) {
        return createInputFieldGroup(hasAuto);
    }

    /**
     * Create select dropdown
     * @param {string[]} options - Select options
     * @param {string} width - CSS width
     * @returns {HTMLSelectElement}
     */
    static createSelect(options, width = '80px') {
        return createSelectElement(options, width);
    }

    /**
     * Create button
     * @param {string} id - Button ID
     * @param {string} label - Button label
     * @param {string} title - Tooltip
     * @returns {HTMLButtonElement}
     */
    static createButton(id, label, title = '') {
        return createButtonElement(id, label, title);
    }

    /**
     * Create separator span
     * @param {string} text - Separator text
     * @returns {HTMLSpanElement}
     */
    static createSeparator(text = '|') {
        return createSeparatorElement(text);
    }

    /**
     * Create styled span (for inline labels)
     * @param {string} text - Text content
     * @param {string} styles - CSS styles
     * @returns {HTMLSpanElement}
     */
    static createSpan(text, styles = '') {
        return createSpanElement(text, styles);
    }

    /**
     * Create column container
     * @param {string} title - Column header text
     * @returns {HTMLElement}
     */
    static createColumn(title = '') {
        return createColumnElement(title);
    }

    /**
     * Create checkbox with label
     * @param {string} labelText - Label text
     * @param {boolean} checked - Initial state
     * @returns {{ element: HTMLElement, checkbox: HTMLInputElement }}
     */
    static createLabeledCheckbox(labelText, checked = true) {
        const { wrapper, checkbox } = createLabeledCheckboxParts(labelText, checked);
        return { element: wrapper, checkbox };
    }

    /**
     * Debounce a function call until the user stops triggering it for `wait` ms.
     */
    static debounce(func, wait) {
        return createDebounced(func, wait);
    }
}
