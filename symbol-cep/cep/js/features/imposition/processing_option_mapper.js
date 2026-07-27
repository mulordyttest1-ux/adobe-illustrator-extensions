export function serializeFormState(form) {
    const snapshot = {};
    if (!form || !form.elements) return snapshot;

    const radioGroups = {};
    const elements = Array.from(form.elements);

    for (let i = 0; i < elements.length; i += 1) {
        const element = elements[i];
        if (!element || !element.name || element.disabled) continue;

        if (element.type === 'radio') {
            if (radioGroups[element.name]) continue;
            radioGroups[element.name] = true;
            snapshot[element.name] = form.elements[element.name].value || '';
            continue;
        }

        if (element.type === 'checkbox') {
            snapshot[element.name] = !!element.checked;
            continue;
        }

        snapshot[element.name] = element.value;
    }

    return snapshot;
}
