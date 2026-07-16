import { CompactFormBindings } from './CompactFormBindings.js';
import { CompactFormState } from './CompactFormState.js';
import { FormComponents } from './FormComponents.js';
import { FormLogic } from './FormLogic.js';

export function createBindingsAdapter(bindings) {
    return {
        createInlineRadio: (key, options, suffix = '', config = {}) => bindings.createInlineRadio(key, options, suffix, config),
        createTextareaWithIdx: (key, rows, hasIdx) => bindings.createTextareaWithIdx(key, rows, hasIdx),
        createInputWithAuto: (key, hasAuto) => bindings.createInputWithAuto(key, hasAuto),
        createTextareaWithAuto: (key, rows, hasAuto) => bindings.createTextareaWithAuto(key, rows, hasAuto),
        createTextarea: (key, rows) => bindings.createTextarea(key, rows),
        setIdxLocked: (isLocked) => bindings.setIdxLocked(isLocked),
        registerButtonRef: (key, element) => bindings.registerButtonRef(key, element),
        mountDateGrid: (container, dateConfigs) => bindings.mountDateGrid(container, dateConfigs)
    };
}

export function initializeCompactFormBuilder(builder, options = {}, deps = {}) {
    const StateClass = deps.StateClass || CompactFormState;
    const BindingsClass = deps.BindingsClass || CompactFormBindings;
    const LogicClass = deps.LogicClass || FormLogic;
    const ComponentsClass = deps.ComponentsClass || FormComponents;

    builder.container = options.container;
    builder.schema = options.schema || {};
    builder.onChange = options.onChange || null;

    builder.state = new StateClass({
        data: options.data || {},
        onChange: builder.onChange
    });
    builder.bindings = new BindingsClass({
        container: builder.container,
        schema: builder.schema,
        state: builder.state
    });

    builder.logic = new LogicClass(builder);
    builder.components = new ComponentsClass({
        container: builder.container,
        schema: builder.schema,
        adapter: createBindingsAdapter(builder.bindings)
    });

    return builder;
}

export function runCompactFormBuild(builder, schedule = setTimeout) {
    if (!builder.container) {
        return builder;
    }

    builder.container.innerHTML = '';
    builder.state.clearRefs();
    builder.bindings.resetTabIndex();

    builder.components.buildFamilyGroup();
    builder.components.buildInfoGroup();
    builder.components.buildVenueGroup();
    builder.components.buildDateGroupWithActions();

    builder.bindings.updateIdxState();

    if (builder.logic) {
        schedule(() => builder.logic.setupAutoVenue(), 0);
    }

    return builder;
}
