import {
    initializeCompactFormBuilder,
    runCompactFormBuild
} from './compactFormBuilderSupport.js';

export class CompactFormBuilder {
    constructor(options = {}) {
        initializeCompactFormBuilder(this, options);
    }

    build() {
        return runCompactFormBuild(this);
    }

    get refs() {
        return this.state.refs;
    }

    get data() {
        return this.state.data;
    }

    get _idxLocked() {
        return this.state.idxLocked;
    }

    set _idxLocked(value) {
        this.state.setIdxLocked(value);
    }

    _updateIdxState() {
        this.bindings.updateIdxState();
    }

    _handleChange(key, value) {
        this.state.handleChange(key, value);
    }

    _runInputNormalization(element, key) {
        return this.bindings.runInputNormalization(element, key);
    }

    getData() {
        return this.state.getData();
    }

    setData(data) {
        this.state.setData(data);
    }

    triggerDateGridCompute() {
        this.bindings.triggerDateGridCompute();
    }
}
