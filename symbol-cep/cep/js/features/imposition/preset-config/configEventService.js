function resolveForm(documentRef) {
    return documentRef.getElementById('config-form');
}

function resolveModal(documentRef) {
    return documentRef.getElementById('modal-add-field');
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
    await savePreset(event.target, true, tab);
    return true;
}

export function handleConfigChange(event, tab, overrides = {}) {
    const persistence = overrides.persistence || (tab && tab.persistence) || null;
    const loadPreset = overrides.loadPreset || ((id, configTab) => (
        persistence ? persistence.loadPreset(id, configTab) : false
    ));

    if (!event || !event.target || event.target.id !== 'load-preset-select') {
        return false;
    }

    if (event.target.value) {
        loadPreset(event.target.value, tab);
        return true;
    }

    if (tab && typeof tab.resetDraft === 'function') {
        tab.resetDraft();
        return true;
    }

    return false;
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
        await runDry(form, tab);
    }
    return true;
}

async function handlePickSaveOutputDirectory(tab) {
    if (!tab || typeof tab.pickSaveOutputDirectory !== 'function') {
        return false;
    }

    await tab.pickSaveOutputDirectory();
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
    await handler();
    return true;
}
