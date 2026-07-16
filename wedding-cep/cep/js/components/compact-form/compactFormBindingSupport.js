import { UIFeedback } from '@shared/cep-ui';
import { InputEngine } from '../../logic/ux/InputEngine.js';
import { NameValidator } from '../../logic/ux/validators/NameValidator.js';
import { DateGridWidget } from '../date-grid/DateGridWidget.js';
import { DomFactory } from '../helpers/DomFactory.js';
import { AddressService } from './AddressService.js';
import {
    registerAutoCheckbox,
    registerIdxField,
    registerValueField
} from './fieldBindingHelpers.js';

export function resolveBindingsRuntime(options = {}) {
    return {
        documentRef: options.document || (typeof document !== 'undefined' ? document : null),
        setTimeoutFn: options.setTimeout || setTimeout,
        domFactory: options.domFactory || DomFactory,
        addressService: options.addressService || AddressService,
        inputEngine: options.inputEngine || InputEngine,
        nameValidator: options.nameValidator || NameValidator,
        uiFeedback: options.uiFeedback || UIFeedback,
        dateGridWidget: options.dateGridWidget || new (options.dateGridWidgetClass || DateGridWidget)()
    };
}

export function updateIdxInputState({ root, idxLocked }) {
    const idxInputs = typeof root?.querySelectorAll === 'function'
        ? root.querySelectorAll('.compact-idx')
        : [];

    Array.from(idxInputs || []).forEach((idx) => {
        idx.tabIndex = idxLocked ? -1 : 0;
        idx.disabled = idxLocked;
        idx.style.opacity = idxLocked ? '0.5' : '1';
        idx.style.pointerEvents = idxLocked ? 'none' : 'auto';
    });
}

export function createBoundRadioGroup({
    key,
    options,
    suffix = '',
    config = {},
    domFactory,
    state,
    handleFieldChange
}) {
    const { element, inputs } = domFactory.createRadioGroup(key, options, suffix, config);
    state.registerRef(key, { type: 'radio', elements: inputs });
    inputs.forEach((radio) => {
        radio.addEventListener('change', () => handleFieldChange(key, radio.value));
    });
    return element;
}

export function createBoundTextareaWithIdx({
    key,
    rows,
    hasIdx,
    domFactory,
    state,
    tabIndex,
    bindAddress,
    handleFieldChange,
    runInputNormalization,
    idxLocked,
    syncSuggestedIdx
}) {
    const { element, textarea, idx } = domFactory.createTextareaWithIdx(rows, hasIdx);

    let nextTabIndex = registerValueField({
        element: textarea,
        key,
        tabIndex,
        state,
        handleFieldChange,
        bindAddress,
        runInputNormalization
    });

    if (hasIdx && idx) {
        nextTabIndex = registerIdxField({
            textarea,
            idxInput: idx,
            key,
            tabIndex: nextTabIndex,
            state,
            idxLocked,
            syncSuggestedIdx
        });
    }

    return { element, nextTabIndex };
}

export function createBoundInputWithAuto({
    key,
    hasAuto,
    domFactory,
    state,
    tabIndex,
    bindAddress,
    handleFieldChange,
    runInputNormalization,
    setTimeoutFn
}) {
    const { element, input, checkbox } = domFactory.createInputWithAuto(hasAuto);

    const nextTabIndex = registerValueField({
        element: input,
        key,
        tabIndex,
        state,
        handleFieldChange,
        bindAddress,
        runInputNormalization
    });

    if (checkbox) {
        registerAutoCheckbox({
            checkbox,
            key,
            state,
            handleFieldChange,
            setTimeout: setTimeoutFn
        });
    }

    return { element, nextTabIndex };
}

export function createBoundTextareaWithAuto({
    key,
    rows,
    hasAuto,
    domFactory,
    state,
    tabIndex,
    bindAddress,
    handleFieldChange,
    runInputNormalization,
    setTimeoutFn
}) {
    const { element, textarea, checkbox } = domFactory.createTextareaWithAuto(rows, hasAuto);

    const nextTabIndex = registerValueField({
        element: textarea,
        key,
        tabIndex,
        state,
        handleFieldChange,
        bindAddress,
        runInputNormalization
    });

    if (checkbox) {
        registerAutoCheckbox({
            checkbox,
            key,
            state,
            handleFieldChange,
            setTimeout: setTimeoutFn
        });
    }

    return { element, nextTabIndex };
}

export function createBoundTextarea({
    key,
    rows,
    domFactory,
    state,
    tabIndex,
    bindAddress,
    handleFieldChange,
    runInputNormalization
}) {
    const textarea = domFactory.createTextarea(rows);
    const nextTabIndex = registerValueField({
        element: textarea,
        key,
        tabIndex,
        state,
        handleFieldChange,
        bindAddress,
        runInputNormalization
    });

    return { textarea, nextTabIndex };
}

export function mountDateGridBinding({
    dateGridWidget,
    container,
    dateConfigs,
    refs,
    handleFieldChange
}) {
    dateGridWidget.create(container, dateConfigs, refs);
    dateGridWidget.setChangeHandler((key, value) => handleFieldChange(key, value));
}
