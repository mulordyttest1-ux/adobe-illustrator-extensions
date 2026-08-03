import { impositionCopy } from '../imposition_copy.js';

function resolveForm(documentRef) {
    return documentRef.getElementById('config-form');
}

function resolveModal(documentRef) {
    return documentRef.getElementById('modal-add-field');
}

async function runTabOperation(tab, name, task) {
    if (tab && typeof tab.runExclusive === 'function') {
        return tab.runExclusive(name, task);
    }

    return task();
}

function showOperationError(tab, error) {
    const message = error && error.message
        ? error.message
        : impositionCopy.persistence.saveError;
    const notifier = tab && tab.notifier;
    if (notifier && typeof notifier.showToast === 'function') {
        notifier.showToast(message, 'error');
    }
}

async function confirmPresetSwitch(tab, event) {
    if (
        !tab ||
        typeof tab.isDirty !== 'function' ||
        !tab.isDirty() ||
        typeof tab.requestDiscardChanges !== 'function'
    ) {
        return true;
    }

    const confirmed = await tab.requestDiscardChanges();
    if (confirmed) {
        return true;
    }

    event.target.value = tab.selectedPresetId || '';
    tab.selectedPresetId = event.target.value;
    return false;
}

function loadSelectedPreset(event, tab, loadPreset) {
    if (!event.target.value) {
        return false;
    }

    try {
        loadPreset(event.target.value, tab);
    } catch (error) {
        showOperationError(tab, error);
    }
    return true;
}

function resetSelectedPreset(tab) {
    if (!tab || typeof tab.resetDraft !== 'function') {
        return false;
    }

    try {
        tab.resetDraft();
    } catch (error) {
        showOperationError(tab, error);
    }
    return true;
}

export async function handleConfigSubmit(event, tab, overrides = {}) {
    const persistence = overrides.persistence || (tab && tab.persistence) || null;
    const savePreset = overrides.savePreset || ((form, allowUpdate, configTab) => (
        persistence ? persistence.handleSave(form, allowUpdate, configTab) : false
    ));

    if (!event || !event.target || event.target.id !== 'config-form') {
        return false;
    }

    event.preventDefault();
    try {
        await runTabOperation(tab, 'save', () => savePreset(event.target, true, tab));
    } catch (error) {
        showOperationError(tab, error);
    }
    return true;
}

export async function handleConfigChange(event, tab, overrides = {}) {
    const persistence = overrides.persistence || (tab && tab.persistence) || null;
    const loadPreset = overrides.loadPreset || ((id, configTab) => (
        persistence ? persistence.loadPreset(id, configTab) : false
    ));

    if (!event || !event.target || event.target.id !== 'load-preset-select') {
        return false;
    }

    if (!await confirmPresetSwitch(tab, event)) {
        return false;
    }

    return event.target.value
        ? loadSelectedPreset(event, tab, loadPreset)
        : resetSelectedPreset(tab);
}

function handleToggleEdit(tab) {
    if (!tab) return true;
    tab.isEditMode = !tab.isEditMode;
    tab.render();
    return true;
}

function handleCancelModal(documentRef) {
    const modal = resolveModal(documentRef);
    if (modal) modal.style.display = 'none';
    return true;
}

function handleConfirmModal(tab) {
    if (tab && typeof tab.handleModalConfirm === 'function') {
        tab.handleModalConfirm();
    }
    return true;
}

async function handleDryRun(tab, documentRef, overrides) {
    const persistence = overrides.persistence || (tab && tab.persistence) || null;
    const runDry = overrides.runDry || ((form, configTab) => (
        persistence ? persistence.handleDryRun(form, configTab) : false
    ));
    const form = resolveForm(documentRef);
    if (form) {
        await runTabOperation(tab, 'dry-run', () => runDry(form, tab));
    }
    return true;
}

async function handlePickSaveOutputDirectory(tab) {
    if (!tab || typeof tab.pickSaveOutputDirectory !== 'function') {
        return false;
    }

    await runTabOperation(tab, 'pick-save-output-dir', () => tab.pickSaveOutputDirectory());
    return true;
}

export async function handleConfigClick(event, tab, overrides = {}) {
    if (!event || !event.target) return false;

    const documentRef = overrides.document || document;
    const actionTarget = typeof event.target.closest === 'function'
        ? event.target.closest('[data-config-action]')
        : null;
    const actionId = actionTarget ? actionTarget.getAttribute('data-config-action') : '';
    const handlers = {
        'btn-toggle-edit': () => handleToggleEdit(tab),
        'btn-cancel-modal': () => handleCancelModal(documentRef),
        'btn-confirm-modal': () => handleConfirmModal(tab),
        'btn-dry-run': () => handleDryRun(tab, documentRef, overrides),
        'pick-save-output-dir': () => handlePickSaveOutputDirectory(tab)
    };

    const handler = handlers[actionId || event.target.id];
    if (!handler) return false;
    try {
        await handler();
    } catch (error) {
        showOperationError(tab, error);
    }
    return true;
}
