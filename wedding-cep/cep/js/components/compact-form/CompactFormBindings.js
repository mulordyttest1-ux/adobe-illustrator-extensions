import {
    applyNormalizationFeedback,
    syncSuggestedIdx
} from './fieldBindingHelpers.js';
import {
    createBoundInputWithAuto,
    createBoundRadioGroup,
    createBoundTextarea,
    createBoundTextareaWithAuto,
    createBoundTextareaWithIdx,
    mountDateGridBinding,
    resolveBindingsRuntime,
    updateIdxInputState
} from './compactFormBindingSupport.js';

export class CompactFormBindings {
    constructor(options = {}) {
        const runtime = resolveBindingsRuntime(options);
        this.container = options.container || null;
        this.schema = options.schema || {};
        this.state = options.state;
        this.document = runtime.documentRef;
        this.setTimeout = runtime.setTimeoutFn;
        this.domFactory = runtime.domFactory;
        this.addressService = runtime.addressService;
        this.inputEngine = runtime.inputEngine;
        this.nameValidator = runtime.nameValidator;
        this.uiFeedback = runtime.uiFeedback;
        this.dateGridWidget = runtime.dateGridWidget;
        this._tabIndex = 1;
    }

    resetTabIndex() {
        this._tabIndex = 1;
    }

    registerButtonRef(key, element) {
        return this.state.registerRef(key, element);
    }

    handleFieldChange(key, value) {
        this.state.handleChange(key, value);
    }

    setIdxLocked(isLocked) {
        this.state.setIdxLocked(isLocked);
        this.updateIdxState();
    }

    updateIdxState() {
        const root = this.container || this.document;
        updateIdxInputState({
            root,
            idxLocked: this.state.idxLocked
        });
    }

    createInlineRadio(key, options, suffix = '', config = {}) {
        return createBoundRadioGroup({
            key,
            options,
            suffix,
            config,
            domFactory: this.domFactory,
            state: this.state,
            handleFieldChange: (nextKey, value) => {
                this.handleFieldChange(nextKey, value);
            }
        });
    }

    createTextareaWithIdx(key, rows, hasIdx) {
        const { element, nextTabIndex } = createBoundTextareaWithIdx({
            key,
            rows,
            hasIdx,
            domFactory: this.domFactory,
            state: this.state,
            tabIndex: this._tabIndex,
            handleFieldChange: (nextKey, value) => this.handleFieldChange(nextKey, value),
            bindAddress: (input, nextKey) => this._bindAddress(input, nextKey),
            runInputNormalization: (input, nextKey) => this.runInputNormalization(input, nextKey),
            idxLocked: this.state.idxLocked,
            syncSuggestedIdx: (input, idxInput) => this._syncSuggestedIdx(input, idxInput)
        });
        this._tabIndex = nextTabIndex;

        return element;
    }

    createInputWithAuto(key, hasAuto) {
        const { element, nextTabIndex } = createBoundInputWithAuto({
            key,
            hasAuto,
            domFactory: this.domFactory,
            state: this.state,
            tabIndex: this._tabIndex,
            handleFieldChange: (nextKey, value) => this.handleFieldChange(nextKey, value),
            bindAddress: (elementRef, nextKey) => this._bindAddress(elementRef, nextKey),
            runInputNormalization: (elementRef, nextKey) => this.runInputNormalization(elementRef, nextKey),
            setTimeoutFn: this.setTimeout
        });
        this._tabIndex = nextTabIndex;

        return element;
    }

    createTextareaWithAuto(key, rows, hasAuto) {
        const { element, nextTabIndex } = createBoundTextareaWithAuto({
            key,
            rows,
            hasAuto,
            domFactory: this.domFactory,
            state: this.state,
            tabIndex: this._tabIndex,
            handleFieldChange: (nextKey, value) => this.handleFieldChange(nextKey, value),
            bindAddress: (elementRef, nextKey) => this._bindAddress(elementRef, nextKey),
            runInputNormalization: (elementRef, nextKey) => this.runInputNormalization(elementRef, nextKey),
            setTimeoutFn: this.setTimeout
        });
        this._tabIndex = nextTabIndex;

        return element;
    }

    createTextarea(key, rows) {
        const { textarea, nextTabIndex } = createBoundTextarea({
            key,
            rows,
            domFactory: this.domFactory,
            state: this.state,
            tabIndex: this._tabIndex,
            handleFieldChange: (nextKey, value) => this.handleFieldChange(nextKey, value),
            bindAddress: (elementRef, nextKey) => this._bindAddress(elementRef, nextKey),
            runInputNormalization: (elementRef, nextKey) => this.runInputNormalization(elementRef, nextKey)
        });
        this._tabIndex = nextTabIndex;

        return textarea;
    }

    mountDateGrid(container, dateConfigs) {
        mountDateGridBinding({
            dateGridWidget: this.dateGridWidget,
            container,
            dateConfigs,
            refs: this.state.refs,
            handleFieldChange: (key, value) => this.handleFieldChange(key, value)
        });
    }

    triggerDateGridCompute() {
        this.dateGridWidget.triggerCompute();
    }

    runInputNormalization(element, key) {
        const formData = this.state.getData();
        const result = this.inputEngine.process(element.value, key, { formData }, this.schema);

        if (result.value !== element.value) {
            element.value = result.value;
            this.handleFieldChange(key, result.value);
        }

        this._applyNormalizationFeedback(element, result);
        return result;
    }

    _bindAddress(input, key) {
        this.addressService.bind(
            input,
            key,
            (nextKey, value) => this.handleFieldChange(nextKey, value),
            this.container,
            this.schema,
            {
                getFormData: () => this.state.getData()
            }
        );
    }

    _syncSuggestedIdx(textarea, idxInput) {
        return syncSuggestedIdx(textarea, idxInput, this.nameValidator);
    }

    _applyNormalizationFeedback(element, result = {}) {
        applyNormalizationFeedback(element, result, this.uiFeedback);
    }
}
