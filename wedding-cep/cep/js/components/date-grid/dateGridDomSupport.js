export function findGridRoot(refs) {
    return refs['date.tiec.ngay']?.closest('.date-grid') || null;
}

export function writeRefValue(ref, value) {
    if (!ref) {
        return;
    }

    if (ref.tagName === 'INPUT') {
        ref.value = String(value).padStart(2, '0');
        return;
    }

    if (ref.el) {
        ref.el.textContent = value;
    }
}

export function toggleEditableRef(ref, isLocked) {
    if (!ref || ref.isComputed) {
        return;
    }

    ref.disabled = isLocked;
    if (isLocked) {
        ref.classList.add('date-input-disabled');
        ref.style.backgroundColor = '#f5f5f7';
        return;
    }

    ref.classList.remove('date-input-disabled');
    ref.style.backgroundColor = '#fff';
}

export function applyErrorVisual(ref, warnings) {
    if (warnings && warnings.length > 0) {
        ref.classList.add('date-input-warning');
        ref.style.backgroundColor = '#ffe6e6';
        ref.title = warnings.map((warning) => warning.message).join('\n');
        ref.dataset.hasError = 'true';
        return;
    }

    ref.classList.remove('date-input-warning');
    ref.style.backgroundColor = 'transparent';
    ref.title = '';
    delete ref.dataset.hasError;
}

export function collectRefValue(ref) {
    if (!ref) {
        return undefined;
    }

    if (ref.tagName === 'INPUT' || ref.tagName === 'SELECT') {
        return ref.value;
    }

    if (ref.isComputed) {
        if (ref.el && ref.el.textContent) {
            return ref.el.textContent;
        }
        if (ref.value !== undefined) {
            return ref.value;
        }
    }

    return undefined;
}

export function canApplyLogicWarning(ref) {
    return Boolean(
        ref
        && ref.tagName === 'INPUT'
        && ref.type === 'number'
        && !ref.dataset.hasError
    );
}

export function applyLogicWarningVisual(ref) {
    ref.classList.add('date-input-logic-warning');
    ref.style.backgroundColor = '#fff3cd';
    ref.dataset.logicStyle = 'true';
}

export function clearLogicWarningVisual(ref) {
    ref.classList.remove('date-input-logic-warning');
    ref.style.backgroundColor = 'transparent';
    delete ref.dataset.logicStyle;
}
