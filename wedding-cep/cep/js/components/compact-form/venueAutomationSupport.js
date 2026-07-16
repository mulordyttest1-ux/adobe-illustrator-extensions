export function getSchemaOptions(schema, key) {
    if (!schema || !Array.isArray(schema.STRUCTURE)) {
        return [];
    }

    for (const group of schema.STRUCTURE) {
        const prefix = group.prefix ? `${group.prefix}.` : '';
        const items = Array.isArray(group.items) ? group.items : [];

        for (const item of items) {
            const fullKey = prefix + item.key;
            if (fullKey === key && Array.isArray(item.options)) {
                return item.options;
            }
        }
    }

    return [];
}

export function getCheckedRadioValue(radioRef, fallbackValue) {
    const checkedRadio = radioRef?.elements?.find((radio) => radio.checked);
    return checkedRadio?.value || fallbackValue;
}

export function setRadioGroupValue(radioRef, targetValue) {
    if (!radioRef?.elements) {
        return false;
    }

    let changed = false;

    radioRef.elements.forEach((radio) => {
        const isTarget = radio.value === targetValue;
        if (radio.checked !== isTarget) {
            radio.checked = isTarget;
            if (isTarget) {
                changed = true;
            }
        }
    });

    return changed;
}

export function syncControlValue(element, nextValue) {
    if (!element || element.value === nextValue) {
        return false;
    }

    element.value = nextValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}
