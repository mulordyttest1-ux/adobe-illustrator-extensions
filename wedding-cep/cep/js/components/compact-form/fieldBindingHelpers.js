export function registerValueField({
    element,
    key,
    tabIndex,
    state,
    handleFieldChange,
    bindAddress,
    runInputNormalization
}) {
    element.tabIndex = tabIndex;
    state.registerRef(key, element);
    element.addEventListener('input', () => handleFieldChange(key, element.value));
    bindAddress(element, key);
    element.addEventListener('blur', () => runInputNormalization(element, key));
    return tabIndex + 1;
}

export function registerIdxField({
    textarea,
    idxInput,
    key,
    tabIndex,
    state,
    idxLocked,
    syncSuggestedIdx
}) {
    idxInput.tabIndex = idxLocked ? -1 : tabIndex;
    state.registerRef(`${key}_idx`, idxInput);
    textarea.addEventListener('blur', () => {
        if (state.idxLocked) {
            syncSuggestedIdx(textarea, idxInput);
        }
    });
    return idxLocked ? tabIndex : tabIndex + 1;
}

export function registerAutoCheckbox({
    checkbox,
    key,
    state,
    handleFieldChange,
    setTimeout
}) {
    state.registerRef(`${key}_auto`, checkbox);
    checkbox.addEventListener('change', () => handleFieldChange(`${key}_auto`, checkbox.checked));
    setTimeout(() => handleFieldChange(`${key}_auto`, true), 100);
}

export function syncSuggestedIdx(textarea, idxInput, nameValidator) {
    const suggested = nameValidator.suggestIdx(textarea.value);
    if (suggested !== 0) {
        idxInput.value = suggested;
        idxInput.style.backgroundColor = '#fff3cd';
        idxInput.title = '\u0110\u00e3 t\u1ef1 nh\u1eadn di\u1ec7n t\u00ean \u0111\u1ed3ng b\u00e0o';
    } else {
        idxInput.value = 0;
        idxInput.style.backgroundColor = '';
        idxInput.title = '';
    }
    return suggested;
}

export function applyNormalizationFeedback(element, result = {}, uiFeedback) {
    const warnings = Array.isArray(result.warnings) ? result.warnings : [];
    if (warnings.length > 0) {
        const isError = warnings.some((warning) => warning.severity === 'error');
        element.style.borderColor = isError ? '#e74c3c' : '#f1c40f';
        element.style.backgroundColor = isError ? '#fff5f5' : '#fffbf0';
        element.title = warnings.map((warning) => warning.message).join('\n');
        uiFeedback.showToast(warnings[0].message, isError ? 'error' : 'warning');
        return;
    }

    element.style.borderColor = '';
    element.style.backgroundColor = '';
    element.title = '';
}
