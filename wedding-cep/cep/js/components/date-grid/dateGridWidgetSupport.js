export function ensureWidgetController({ controller, controllerClass, refs, warn }) {
    if (controller) {
        return controller;
    }

    warn('[DateGridWidget] Controller not initialized. Call setChangeHandler first.');
    return new controllerClass(refs, null);
}

export function resolveCheckboxBaseKey(refs, ref) {
    const key = Object.keys(refs).find((candidate) => refs[candidate] === ref);
    return key ? key.replace('_auto', '') : null;
}

export function bindDateGridWidgetEvents({ refs, getController }) {
    Object.values(refs).forEach((ref) => {
        if (ref.tagName === 'INPUT' && ref.type === 'number') {
            ref.addEventListener('blur', () => getController().handleBlur(ref));
            ref.addEventListener('input', () => getController().handleInput(ref));
            return;
        }

        if (ref.tagName === 'INPUT' && ref.type === 'checkbox') {
            ref.addEventListener('change', () => {
                const baseKey = resolveCheckboxBaseKey(refs, ref);
                if (baseKey) {
                    getController().handleCheckboxChange(ref, baseKey);
                }
            });
        }
    });
}

export function scheduleDependentRowLocks({ dateConfigs, refs, setTimeout, toggleRowState }) {
    dateConfigs.forEach((config) => {
        if (!config.key.includes('tiec')) {
            setTimeout(() => toggleRowState(refs, config.key, true), 0);
        }
    });
}
