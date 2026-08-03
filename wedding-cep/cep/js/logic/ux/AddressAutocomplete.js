/**
 * MODULE: AddressAutocomplete
 * LAYER: UX Automation
 * PURPOSE: Fuzzy search for Vietnamese addresses
 * DEPENDENCIES: FuseAddressIndex, CEP host adapter
 * SIDE EFFECTS: CEP file reads during initialization
 * EXPORTS: AddressAutocomplete
 */
import { FuseAddressIndex } from './search/FuseAddressIndex.js';
import {
    createAddressIndexBuilder,
    formatAddressMatch,
    loadAddressAutocompleteData,
    resetAddressAutocompleteState
} from './addressAutocompleteRuntimeSupport.js';

export class AddressAutocomplete {
    static async init({ hostFacade, FuseCtor, createIndex } = {}) {
        if (this.isReady) return;

        try {
            this.data = await loadAddressAutocompleteData(hostFacade);
            const buildIndex = createAddressIndexBuilder(createIndex, FuseCtor);
            this.fuse = buildIndex(this.data);
            this.isReady = true;
        } catch (error) {
            resetAddressAutocompleteState(this);
            console.warn('[AddressAutocomplete] init failed:', error.message);
        }
    }

    static search(query) {
        return FuseAddressIndex.search(this.fuse, query);
    }

    static format(match, separator = ", ") {
        return formatAddressMatch(match, separator);
    }
}

AddressAutocomplete.fuse = null;
AddressAutocomplete.data = [];
AddressAutocomplete.isReady = false;
