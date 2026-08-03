import { ConfirmService } from '../confirm_service.js';
import { impositionCopy } from '../imposition_copy.js';
import { UIFeedback } from '@shared/cep-ui';
import { SchemaMutationService } from '../schema_mutation_service.js';

function createDeps(overrides = {}) {
    return {
        confirm: overrides.confirm || ((config) => ConfirmService.confirm(config)),
        showToast: overrides.showToast || ((message, type) => UIFeedback.showToast(message, type)),
        schemaMutationService: overrides.schemaMutationService || SchemaMutationService,
        document: overrides.document || globalThis.document || null
    };
}

export async function requestRemoveRowFromConfigTab(tab, rowId, label, overrides = {}) {
    const deps = createDeps(overrides);
    const confirmed = await deps.confirm({
        title: impositionCopy.config.removeRowDialog.title,
        message: impositionCopy.config.removeRowDialog.message(label, rowId),
        confirmLabel: impositionCopy.config.removeRowDialog.confirm,
        cancelLabel: impositionCopy.config.removeRowDialog.cancel,
        tone: 'danger'
    });

    if (!confirmed) return false;

    const schema = tab.getActiveSchema();
    if (deps.schemaMutationService.removeMarginRow(schema, rowId)) {
        tab.pruneRemovedRowState(rowId);
        tab.render();
        return true;
    }

    deps.showToast(impositionCopy.config.error.removeRow, 'error');
    return false;
}

export function confirmConfigTabModal(tab, overrides = {}) {
    const deps = createDeps(overrides);
    const modal = deps.document.getElementById('modal-add-field');
    if (!modal) return false;

    const labelInput = deps.document.getElementById('new-field-label');
    const classificationInput = deps.document.getElementById('new-field-classification');
    const label = labelInput ? labelInput.value : '';
    const classification = classificationInput ? classificationInput.value : '';
    const sectionId = modal.dataset.section;

    if (!label) {
        deps.showToast(impositionCopy.config.error.missingFieldName, 'warning');
        return false;
    }

    const fieldDef = deps.schemaMutationService.createMarginRowDefinition({
        label,
        classification
    });

    const schema = tab.getActiveSchema();
    if (sectionId === 'sec_margins' && deps.schemaMutationService.addMarginRow(schema, fieldDef)) {
        modal.style.display = 'none';
        tab.render();
        return true;
    }

    deps.showToast(impositionCopy.config.error.missingSection, 'error');
    return false;
}

export function openConfigTabAddFieldModal(sectionId, overrides = {}) {
    const deps = createDeps(overrides);
    const modal = deps.document.getElementById('modal-add-field');
    if (!modal) return false;

    modal.dataset.section = sectionId;

    const labelInput = deps.document.getElementById('new-field-label');
    if (labelInput) {
        labelInput.value = '';
    }

    const classificationInput = deps.document.getElementById('new-field-classification');
    if (classificationInput) {
        classificationInput.value = 'ADDITIVE';
    }

    modal.style.display = 'flex';
    return true;
}
