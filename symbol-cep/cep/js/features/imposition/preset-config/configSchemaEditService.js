import { ConfirmService } from '../confirm_service.js';
import { impositionCopy } from '../imposition_copy.js';
import { UIFeedback } from '@shared/cep-ui';
import { SchemaMutationService } from '../schema_mutation_service.js';

function createDeps(overrides = {}) {
    return {
        confirm: overrides.confirm || ((config) => ConfirmService.confirm(config)),
        showToast: overrides.showToast || ((message, type) => UIFeedback.showToast(message, type)),
        schemaMutationService: overrides.schemaMutationService || overrides.configEngine || SchemaMutationService,
        document: overrides.document || globalThis.document || null
    };
}

function removeRowById(schema, rowId) {
    let removed = false;

    (schema.sections || []).forEach((section) => {
        if (!Array.isArray(section.rows) || removed) return;
        const nextRows = section.rows.filter((row) => row && row.id !== rowId);
        if (nextRows.length !== section.rows.length) {
            section.rows = nextRows;
            removed = true;
        }
    });

    return removed;
}

export async function requestRemoveFieldFromConfigTab(tab, fieldId, label, overrides = {}) {
    const deps = createDeps(overrides);
    const confirmed = await deps.confirm({
        title: impositionCopy.config.removeFieldDialog.title,
        message: impositionCopy.config.removeFieldDialog.message(label, fieldId),
        confirmLabel: impositionCopy.config.removeFieldDialog.confirm,
        cancelLabel: impositionCopy.config.removeFieldDialog.cancel,
        tone: 'danger'
    });

    if (!confirmed) return false;

    const schema = tab.getActiveSchema();
    if (deps.schemaMutationService.removeField(schema, fieldId)) {
        tab.render();
        return true;
    }

    deps.showToast(impositionCopy.config.error.removeField, 'error');
    return false;
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
    if (removeRowById(schema, rowId)) {
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

    const fieldDef = deps.schemaMutationService.createFieldDefinition({
        label,
        type: 'number',
        classification,
        edge: 'dynamic'
    });

    const schema = tab.getActiveSchema();
    if (deps.schemaMutationService.addField(schema, sectionId, fieldDef)) {
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
