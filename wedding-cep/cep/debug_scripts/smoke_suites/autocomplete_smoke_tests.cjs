const {
    assertAutocompleteProbePassed,
    createAutocompleteProbeExpression
} = require('../smoke_helpers.cjs');

function registerAutocompleteSmokeTests(runner) {
    runner.addTest(
        'Address Autocomplete Adaptive Separator',
        createAutocompleteProbeExpression({
            refExpression: `builder.refs['pos2.diachi']`,
            inputText: 'Thôn A, lsl',
            expectedMatch: '',
            selectMode: 'first',
            requireMatch: false,
            timeoutMs: 2500
        }),
        async (result) => {
            assertAutocompleteProbePassed(result);
            if (result.inputRole !== 'combobox' || result.listRole !== 'listbox') {
                throw new Error('Autocomplete semantics mismatch: ' + JSON.stringify(result));
            }
            if (result.firstItemRole !== 'option' || result.ariaExpandedBeforeSelect !== 'true') {
                throw new Error('Autocomplete ARIA state mismatch: ' + JSON.stringify(result));
            }
            if (!result.selectedItemText || result.selectedBy !== 'first') {
                throw new Error('Autocomplete did not commit the first visible item: ' + JSON.stringify(result));
            }
            if (typeof result.fieldValue !== 'string' || !result.fieldValue.includes(',')) {
                throw new Error('Expected inherited comma separator, got: ' + JSON.stringify(result));
            }
        }
    );

    runner.addTest(
        'Address Autocomplete Keyboard Combobox Contract',
        createAutocompleteProbeExpression({
            refExpression: `builder.refs['pos1.diachi']`,
            inputText: 'Thôn A, lsl',
            expectedMatch: '',
            selectMode: 'keyboardEnter',
            requireMatch: false,
            timeoutMs: 2500
        }),
        async (result) => {
            assertAutocompleteProbePassed(result);
            if (result.selectedBy !== 'keyboardEnter') {
                throw new Error('Expected keyboard selection path, got: ' + JSON.stringify(result));
            }
            if (!result.activeDescendantBeforeSelect) {
                throw new Error('Expected active descendant before keyboard selection: ' + JSON.stringify(result));
            }
            if (result.inputRole !== 'combobox' || result.listRole !== 'listbox' || result.firstItemRole !== 'option') {
                throw new Error('Combobox semantics mismatch during keyboard selection: ' + JSON.stringify(result));
            }
            if (result.ariaExpandedBeforeSelect !== 'true' || result.ariaExpandedAfterSelect !== 'false') {
                throw new Error('Expected combobox to open before select and close after select: ' + JSON.stringify(result));
            }
            if (typeof result.fieldValue !== 'string' || !result.fieldValue.includes(',')) {
                throw new Error('Expected keyboard selection to update the field value: ' + JSON.stringify(result));
            }
        }
    );

    runner.addTest(
        'Address Autocomplete Keyboard Tab Commit',
        createAutocompleteProbeExpression({
            refExpression: `builder.refs['pos1.diachi']`,
            inputText: 'Thôn A, lsl',
            expectedMatch: '',
            selectMode: 'keyboardTab',
            requireMatch: false,
            timeoutMs: 2500
        }),
        async (result) => {
            assertAutocompleteProbePassed(result);
            if (result.selectedBy !== 'keyboardTab') {
                throw new Error('Expected keyboard Tab selection path, got: ' + JSON.stringify(result));
            }
            if (!result.activeDescendantBeforeSelect || result.dropdownClosedAfterAction !== true) {
                throw new Error('Expected Tab path to highlight and close the popup: ' + JSON.stringify(result));
            }
            if (result.ariaExpandedAfterSelect !== 'false' || result.itemsCountAfterAction !== 0) {
                throw new Error('Expected Tab path to collapse the combobox cleanly: ' + JSON.stringify(result));
            }
            if (result.fieldValueBeforeAction === result.fieldValue) {
                throw new Error('Expected Tab selection to change the field value: ' + JSON.stringify(result));
            }
        }
    );

    runner.addTest(
        'Address Autocomplete Escape Closes Without Mutation',
        createAutocompleteProbeExpression({
            refExpression: `builder.refs['pos1.diachi']`,
            inputText: 'Thôn A, lsl',
            expectedMatch: '',
            selectMode: 'escape',
            requireMatch: false,
            timeoutMs: 2500
        }),
        async (result) => {
            assertAutocompleteProbePassed(result);
            if (result.selectedBy !== 'escape') {
                throw new Error('Expected Escape path, got: ' + JSON.stringify(result));
            }
            if (!result.activeDescendantBeforeSelect || result.dropdownClosedAfterAction !== true) {
                throw new Error('Expected Escape to close an active popup: ' + JSON.stringify(result));
            }
            if (result.ariaExpandedAfterSelect !== 'false' || result.itemsCountAfterAction !== 0) {
                throw new Error('Expected Escape to collapse the combobox cleanly: ' + JSON.stringify(result));
            }
            if (result.fieldValueBeforeAction !== result.fieldValue) {
                throw new Error('Expected Escape to preserve the typed value: ' + JSON.stringify(result));
            }
        }
    );

}

module.exports = { registerAutocompleteSmokeTests };
