export class CompactFormState {
    constructor(options = {}) {
        this.refs = {};
        this.data = { ...(options.data || {}) };
        this.onChange = options.onChange || null;
        this.idxLocked = true;
    }

    clearRefs() {
        Object.keys(this.refs).forEach((key) => {
            delete this.refs[key];
        });
    }

    registerRef(key, ref) {
        this.refs[key] = ref;
        return ref;
    }

    setIdxLocked(isLocked) {
        this.idxLocked = Boolean(isLocked);
    }

    handleChange(key, value) {
        this.data[key] = value;
        if (this.onChange) {
            this.onChange(key, value, this.data);
        }
    }

    getData() {
        const data = {};
        Object.keys(this.refs).forEach((key) => {
            const ref = this.refs[key];
            if (ref.type === 'radio') {
                const checked = ref.elements.find((radio) => radio.checked);
                data[key] = checked ? checked.value : '';
            } else if (ref.type === 'checkbox') {
                data[key] = ref.checked;
            } else if (ref.isComputed) {
                if (ref.el) {
                    data[key] = ref.el.textContent || '';
                } else if (ref.value !== undefined) {
                    data[key] = ref.value || '';
                }
            } else if (ref.value !== undefined) {
                data[key] = ref.value || '';
            }
        });
        return data;
    }

    setData(data = {}) {
        Object.keys(this.refs).forEach((key) => {
            this._setRefValue(this.refs[key], data[key]);
        });
        this.data = { ...this.data, ...data };
    }

    _setRefValue(ref, value) {
        if (value === undefined) return;

        if (ref.type === 'radio') {
            this._setRadioValue(ref, value);
        } else if (ref.type === 'checkbox') {
            const isTarget = Boolean(value);
            if (ref.checked !== isTarget) {
                ref.checked = isTarget;
                ref.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else if (ref.isComputed) {
            if (value !== null) {
                if (ref.el) {
                    ref.el.textContent = value;
                } else if (ref.value !== undefined) {
                    ref.value = value;
                }
            }
        } else if (ref.value !== undefined && ref.value !== value) {
            ref.value = value;
            ref.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    _setRadioValue(ref, value) {
        let changed = false;
        ref.elements.forEach((radio) => {
            const isTarget = radio.value === value;
            if (radio.checked !== isTarget) {
                radio.checked = isTarget;
                if (isTarget) changed = true;
            }
        });

        if (changed) {
            const checkedRadio = ref.elements.find((radio) => radio.checked);
            if (checkedRadio) {
                checkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
}
