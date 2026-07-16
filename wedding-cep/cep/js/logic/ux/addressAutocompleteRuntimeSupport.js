import { FuseAddressIndex } from './search/FuseAddressIndex.js';

export const ADDRESS_DATA_PATH = 'data/vn_address_custom.json';
export const ADDRESS_DATA_STRATEGY = 'cep-fs';

export function createAddressIndexBuilder(createIndex, FuseCtor) {
    return createIndex || ((data) => FuseAddressIndex.create(data, { FuseCtor }));
}

export async function loadAddressAutocompleteData(hostFacade) {
    if (!hostFacade) {
        throw new Error('HostFacade is required');
    }

    const { absolutePath, content } = await hostFacade.readExtensionText(ADDRESS_DATA_PATH, {
        strategy: ADDRESS_DATA_STRATEGY
    });

    if (!content) {
        throw new Error(`Address data not found at: ${absolutePath}`);
    }

    return JSON.parse(content);
}

export function resetAddressAutocompleteState(target) {
    target.isReady = false;
    target.fuse = null;
    target.data = [];
    return target;
}

export function formatAddressMatch(match, separator = ', ') {
    if (!match) {
        return null;
    }

    const cleanPath = match.p.replace(/\s*-\s*/g, separator);
    return `${match.c}${separator}${cleanPath}`;
}
