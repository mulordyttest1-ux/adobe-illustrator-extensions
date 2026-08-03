import { buildConfigStateFingerprint } from './config_schema_state.js';

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeSnapshot(snapshot = {}) {
    return {
        schema: clone(snapshot.schema) || null,
        values: clone(snapshot.values) || {},
        meta: clone(snapshot.meta) || {
            presetId: '',
            presetName: ''
        }
    };
}

export class ConfigDraftStore {
    constructor(initial = {}) {
        this.schema = null;
        this.values = {};
        this.meta = {
            presetId: '',
            presetName: ''
        };
        this.baseline = null;

        this.setSnapshot(initial);
        this.markClean();
    }

    setSnapshot(snapshot = {}) {
        const next = normalizeSnapshot(snapshot);
        this.schema = next.schema;
        this.values = next.values;
        this.meta = next.meta;
        return this.getSnapshot();
    }

    setSchema(schema) {
        this.schema = clone(schema) || null;
        return this.getSchema();
    }

    setValues(values) {
        this.values = clone(values) || {};
        return this.getValues();
    }

    setMeta(meta) {
        this.meta = {
            presetId: (meta && meta.presetId) || '',
            presetName: (meta && meta.presetName) || ''
        };
        return this.getMeta();
    }

    getSchema() {
        return clone(this.schema);
    }

    getValues() {
        return clone(this.values) || {};
    }

    getMeta() {
        return clone(this.meta) || {
            presetId: '',
            presetName: ''
        };
    }

    getSnapshot() {
        return normalizeSnapshot({
            schema: this.schema,
            values: this.values,
            meta: this.meta
        });
    }

    markClean(snapshot) {
        this.baseline = normalizeSnapshot(snapshot || this.getSnapshot());
        return this.getBaseline();
    }

    getBaseline() {
        return clone(this.baseline);
    }

    isDirty() {
        if (!this.baseline) return true;

        return buildConfigStateFingerprint({
            schema: this.schema,
            rawValues: this.values,
            formMeta: this.meta
        }) !== buildConfigStateFingerprint({
            schema: this.baseline.schema,
            rawValues: this.baseline.values,
            formMeta: this.baseline.meta
        });
    }
}
