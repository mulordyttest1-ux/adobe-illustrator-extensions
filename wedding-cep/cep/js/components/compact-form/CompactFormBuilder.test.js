import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CompactFormBuilder } from './CompactFormBuilder.js';
import {
    initializeCompactFormBuilder,
    runCompactFormBuild
} from './compactFormBuilderSupport.js';

describe('compactFormBuilderSupport', () => {
    it('initializes builder runtime and adapter wiring around the compact-form slice', () => {
        class FakeState {
            constructor(options) {
                this.options = options;
                this.refs = { seeded: true };
                this.data = options.data;
            }

            clearRefs() {}
            setIdxLocked(value) {
                this.idxLocked = value;
            }

            handleChange(key, value) {
                this.lastChange = { key, value };
            }

            getData() {
                return this.data;
            }

            setData(data) {
                this.lastSetData = data;
            }
        }

        class FakeBindings {
            constructor(options) {
                this.options = options;
            }

            createInlineRadio(...args) {
                this.lastCall = ['createInlineRadio', ...args];
            }

            createTextareaWithIdx(...args) {
                this.lastCall = ['createTextareaWithIdx', ...args];
            }

            createInputWithAuto(...args) {
                this.lastCall = ['createInputWithAuto', ...args];
            }

            createTextareaWithAuto(...args) {
                this.lastCall = ['createTextareaWithAuto', ...args];
            }

            createTextarea(...args) {
                this.lastCall = ['createTextarea', ...args];
            }

            setIdxLocked(...args) {
                this.lastCall = ['setIdxLocked', ...args];
            }

            registerButtonRef(...args) {
                this.lastCall = ['registerButtonRef', ...args];
            }

            mountDateGrid(...args) {
                this.lastCall = ['mountDateGrid', ...args];
            }
        }

        class FakeLogic {
            constructor(builder) {
                this.builder = builder;
            }
        }

        class FakeComponents {
            constructor(options) {
                this.options = options;
            }
        }

        const builder = {};
        const onChange = () => {};
        const container = { innerHTML: 'dirty' };
        const schema = { field: true };
        const data = { existing: 'value' };

        initializeCompactFormBuilder(builder, { container, schema, data, onChange }, {
            StateClass: FakeState,
            BindingsClass: FakeBindings,
            LogicClass: FakeLogic,
            ComponentsClass: FakeComponents
        });

        assert.equal(builder.container, container);
        assert.equal(builder.schema, schema);
        assert.equal(builder.onChange, onChange);
        assert.deepEqual(builder.state.options, { data, onChange });
        assert.equal(builder.bindings.options.container, container);
        assert.equal(builder.bindings.options.schema, schema);
        assert.equal(builder.bindings.options.state, builder.state);
        assert.equal(builder.logic.builder, builder);
        assert.equal(builder.components.options.container, container);
        assert.equal(builder.components.options.schema, schema);

        const adapter = builder.components.options.adapter;
        adapter.createInlineRadio('info.ten_le', ['Lễ'], '_x', { checkedIndex: -1 });
        assert.deepEqual(builder.bindings.lastCall, ['createInlineRadio', 'info.ten_le', ['Lễ'], '_x', { checkedIndex: -1 }]);

        adapter.createTextareaWithIdx('pos1.ong', 1, true);
        assert.deepEqual(builder.bindings.lastCall, ['createTextareaWithIdx', 'pos1.ong', 1, true]);

        adapter.createInputWithAuto('ceremony.ten', true);
        assert.deepEqual(builder.bindings.lastCall, ['createInputWithAuto', 'ceremony.ten', true]);

        adapter.createTextareaWithAuto('ceremony.ten', 2, true);
        assert.deepEqual(builder.bindings.lastCall, ['createTextareaWithAuto', 'ceremony.ten', 2, true]);

        adapter.createTextarea('venue.diachi', 2);
        assert.deepEqual(builder.bindings.lastCall, ['createTextarea', 'venue.diachi', 2]);

        adapter.setIdxLocked(false);
        assert.deepEqual(builder.bindings.lastCall, ['setIdxLocked', false]);

        adapter.registerButtonRef('clone-le', {});
        assert.deepEqual(builder.bindings.lastCall, ['registerButtonRef', 'clone-le', {}]);

        adapter.mountDateGrid({}, [{ id: 'le' }]);
        assert.deepEqual(builder.bindings.lastCall, ['mountDateGrid', {}, [{ id: 'le' }]]);
    });

    it('runs the build cycle in a stable order and schedules auto-venue setup', () => {
        const steps = [];
        const builder = {
            container: { innerHTML: 'dirty' },
            state: {
                clearRefs() {
                    steps.push('clearRefs');
                }
            },
            bindings: {
                resetTabIndex() {
                    steps.push('resetTabIndex');
                },
                updateIdxState() {
                    steps.push('updateIdxState');
                }
            },
            components: {
                buildFamilyGroup() {
                    steps.push('buildFamilyGroup');
                },
                buildInfoGroup() {
                    steps.push('buildInfoGroup');
                },
                buildVenueGroup() {
                    steps.push('buildVenueGroup');
                },
                buildDateGroupWithActions() {
                    steps.push('buildDateGroupWithActions');
                }
            },
            logic: {
                setupAutoVenue() {
                    steps.push('setupAutoVenue');
                }
            }
        };
        const scheduled = [];

        const result = runCompactFormBuild(builder, (callback, delay) => {
            scheduled.push({ callback, delay });
            return scheduled.length;
        });

        assert.equal(result, builder);
        assert.equal(builder.container.innerHTML, '');
        assert.deepEqual(steps, [
            'clearRefs',
            'resetTabIndex',
            'buildFamilyGroup',
            'buildInfoGroup',
            'buildVenueGroup',
            'buildDateGroupWithActions',
            'updateIdxState'
        ]);
        assert.equal(scheduled.length, 1);
        assert.equal(scheduled[0].delay, 0);

        scheduled[0].callback();
        assert.deepEqual(steps, [
            'clearRefs',
            'resetTabIndex',
            'buildFamilyGroup',
            'buildInfoGroup',
            'buildVenueGroup',
            'buildDateGroupWithActions',
            'updateIdxState',
            'setupAutoVenue'
        ]);
    });

    it('skips build work when the compact form has no container', () => {
        const builder = {
            state: { clearRefs() { throw new Error('should not run'); } },
            bindings: { resetTabIndex() { throw new Error('should not run'); } },
            components: { buildInfoGroup() { throw new Error('should not run'); } }
        };

        assert.equal(runCompactFormBuild(builder), builder);
    });
});

describe('CompactFormBuilder', () => {
    it('keeps public passthrough helpers and build orchestration stable', () => {
        const builder = Object.create(CompactFormBuilder.prototype);
        const steps = [];
        const scheduled = [];
        const state = {
            refs: { field: true },
            data: { value: 'initial' },
            clearRefs() {
                steps.push('clearRefs');
            },
            setIdxLocked(value) {
                this.lastIdxLocked = value;
            },
            handleChange(key, value) {
                this.lastChange = { key, value };
            },
            getData() {
                return { snapshot: true };
            },
            setData(data) {
                this.lastSetData = data;
            }
        };
        const bindings = {
            resetTabIndex() {
                steps.push('resetTabIndex');
            },
            updateIdxState() {
                steps.push('updateIdxState');
            },
            runInputNormalization(element, key) {
                return { element, key, normalized: true };
            },
            triggerDateGridCompute() {
                this.triggered = true;
            }
        };

        builder.container = { innerHTML: 'dirty' };
        builder.state = state;
        builder.bindings = bindings;
        builder.components = {
            buildFamilyGroup() {
                steps.push('buildFamilyGroup');
            },
            buildInfoGroup() {
                steps.push('buildInfoGroup');
            },
            buildVenueGroup() {
                steps.push('buildVenueGroup');
            },
            buildDateGroupWithActions() {
                steps.push('buildDateGroupWithActions');
            }
        };
        builder.logic = {
            setupAutoVenue() {
                steps.push('setupAutoVenue');
            }
        };

        const previousSetTimeout = globalThis.setTimeout;
        globalThis.setTimeout = (callback, delay) => {
            scheduled.push({ callback, delay });
            return scheduled.length;
        };

        try {
            assert.equal(builder.build(), builder);
            assert.equal(builder.refs, state.refs);
            assert.equal(builder.data, state.data);

            builder._idxLocked = false;
            assert.equal(state.lastIdxLocked, false);

            builder._handleChange('info.ten_le', 'Lễ');
            assert.deepEqual(state.lastChange, { key: 'info.ten_le', value: 'Lễ' });

            const normalized = builder._runInputNormalization({ tag: 'input' }, 'venue.ten');
            assert.deepEqual(normalized, {
                element: { tag: 'input' },
                key: 'venue.ten',
                normalized: true
            });

            assert.deepEqual(builder.getData(), { snapshot: true });

            builder.setData({ updated: true });
            assert.deepEqual(state.lastSetData, { updated: true });

            builder.triggerDateGridCompute();
            assert.equal(bindings.triggered, true);

            assert.deepEqual(steps, [
                'clearRefs',
                'resetTabIndex',
                'buildFamilyGroup',
                'buildInfoGroup',
                'buildVenueGroup',
                'buildDateGroupWithActions',
                'updateIdxState'
            ]);
            assert.deepEqual(scheduled, [{ callback: scheduled[0].callback, delay: 0 }]);

            scheduled[0].callback();
            assert.deepEqual(steps, [
                'clearRefs',
                'resetTabIndex',
                'buildFamilyGroup',
                'buildInfoGroup',
                'buildVenueGroup',
                'buildDateGroupWithActions',
                'updateIdxState',
                'setupAutoVenue'
            ]);
        } finally {
            globalThis.setTimeout = previousSetTimeout;
        }
    });
});
