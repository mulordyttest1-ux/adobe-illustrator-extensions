/**
 * AddressService.js (compact-form)
 * Owns compact-form autocomplete UI behavior for address fields.
 * Runtime search is delegated to AddressAutocomplete; Fuse stays behind FuseAddressIndex.
 */
import { AddressAutocomplete } from '../../logic/ux/AddressAutocomplete.js';
import {
    DEFAULT_ADDRESS_SEPARATOR,
    findAddressComponentSeparators,
    normalizeAddressComponentSeparators,
    resolveCanonicalAddressSeparator
} from '../../logic/ux/addressSeparatorPolicy.js';
import { DomFactory } from '../helpers/DomFactory.js';
import {
    appendAutocompleteMatches,
    closeAutocompleteLists,
    createAutocompleteList,
    ensureAutocompleteCombobox,
    getAutocompleteItems,
    handleAutocompleteKeydown,
    isAddressField,
    positionAutocompleteList
} from './addressAutocompleteSupport.js';

const MULTILINE_ADDRESS_SEPARATOR = '\n';

function formatMultilineAddressTail(match, inlineSeparator) {
    if (!match) {
        return null;
    }

    const inlineAddress = AddressAutocomplete.format(match, inlineSeparator);
    if (!inlineAddress || !match.c || !match.p) {
        return inlineAddress;
    }

    const cleanPath = String(match.p).replace(/\s*-\s*/g, inlineSeparator);
    return `${match.c}${MULTILINE_ADDRESS_SEPARATOR}${cleanPath}`;
}

export class AddressService {
    static deriveSearchContext(val) {
        const rawValue = typeof val === 'string' ? val : '';
        const lastLineBreak = Math.max(rawValue.lastIndexOf('\n'), rawValue.lastIndexOf('\r'));
        const separators = findAddressComponentSeparators(rawValue);
        const lastSeparator = separators.length > 0 ? separators[separators.length - 1] : null;
        const newlineBoundary = lastLineBreak >= 0
            ? {
                start: lastLineBreak,
                end: lastLineBreak + 1,
                separator: DEFAULT_ADDRESS_SEPARATOR,
                type: 'newline'
            }
            : null;
        const boundary = lastSeparator && (!newlineBoundary || lastSeparator.end > newlineBoundary.end)
            ? lastSeparator
            : newlineBoundary;

        if (boundary && boundary.type === 'newline') {
            const prefix = rawValue.slice(0, boundary.end);
            return {
                rawValue,
                prefix,
                prefixValue: prefix,
                lastPart: rawValue.slice(boundary.end).trim(),
                adaptiveSeparator: DEFAULT_ADDRESS_SEPARATOR,
                separatorKind: 'newline'
            };
        }

        if (!boundary) {
            return {
                rawValue,
                prefix: '',
                prefixValue: '',
                lastPart: rawValue.trim(),
                adaptiveSeparator: DEFAULT_ADDRESS_SEPARATOR,
                separatorKind: 'none'
            };
        }

        return {
            rawValue,
            prefix: rawValue.slice(0, boundary.end),
            prefixValue: rawValue.slice(0, boundary.start).trimEnd(),
            lastPart: rawValue.slice(boundary.end).trim(),
            adaptiveSeparator: boundary.separator,
            separatorKind: boundary.type
        };
    }

    static hasUsableSearchTerm(val) {
        return this.deriveSearchContext(val).lastPart.length >= 2;
    }

    static buildAutocompleteValue(val, match, options = {}) {
        const context = this.deriveSearchContext(val);
        const canonicalSeparator = options.separator || resolveCanonicalAddressSeparator({
            fieldKey: options.fieldKey,
            currentValue: val,
            formData: options.formData
        });
        const isMultilineCommit = options.formatMode === 'multiline';
        const fullAddress = isMultilineCommit
            ? formatMultilineAddressTail(match, canonicalSeparator)
            : AddressAutocomplete.format(match, canonicalSeparator);

        if (!fullAddress) {
            return context.separatorKind === 'newline'
                ? context.prefix
                : context.prefixValue || context.prefix;
        }

        if (context.separatorKind === 'newline') {
            return context.prefix + fullAddress;
        }

        const normalizedPrefix = context.prefixValue
            ? normalizeAddressComponentSeparators(context.prefixValue, canonicalSeparator)
            : '';

        return normalizedPrefix
            ? `${normalizedPrefix}${canonicalSeparator}${fullAddress}`
            : fullAddress;
    }

    static _createRuntime(input, key, changeCallback, options = {}) {
        const documentRef = input?.ownerDocument || document;
        const windowRef = documentRef?.defaultView || globalThis;
        const setTimeoutFn = documentRef?.defaultView?.setTimeout || setTimeout;
        let currentFocus = -1;
        let activeListContainer = null;

        return {
            input,
            key,
            changeCallback,
            container: options.container || null,
            runtimeContext: options.runtimeContext || {},
            documentRef,
            windowRef,
            setTimeoutFn,
            ...ensureAutocompleteCombobox(input, key),
            getCurrentFocus() {
                return currentFocus;
            },
            setCurrentFocus(value) {
                currentFocus = value;
            },
            getActiveListContainer() {
                return activeListContainer;
            },
            setActiveListContainer(value) {
                activeListContainer = value;
            }
        };
    }

    static _getFormData(runtime) {
        const getFormData = runtime?.runtimeContext?.getFormData;
        return typeof getFormData === 'function' ? getFormData() || {} : {};
    }

    static _resolveCanonicalSeparator(runtime, currentValue = '') {
        return resolveCanonicalAddressSeparator({
            fieldKey: runtime.key,
            currentValue,
            formData: this._getFormData(runtime)
        });
    }

    static _closeLists(runtime, element = null) {
        closeAutocompleteLists(runtime.documentRef, runtime.input, element);
        runtime.setCurrentFocus(-1);
        runtime.setActiveListContainer(null);
    }

    static _repositionActiveList(runtime) {
        const activeListContainer = runtime.getActiveListContainer();
        if (!activeListContainer || !activeListContainer.parentNode) {
            return;
        }

        positionAutocompleteList(activeListContainer, runtime.input, runtime.windowRef);
    }

    static _performSearch(runtime, val) {
        if (runtime.documentRef.activeElement !== runtime.input) {
            return;
        }

        if (!val || !AddressAutocomplete.isReady) {
            this._closeLists(runtime);
            return;
        }

        const { lastPart } = this.deriveSearchContext(val);
        if (!this.hasUsableSearchTerm(val)) {
            this._closeLists(runtime);
            return;
        }

        const formData = this._getFormData(runtime);
        const canonicalSeparator = this._resolveCanonicalSeparator(runtime, val);
        const matches = AddressAutocomplete.search(lastPart);
        if (matches.length === 0) {
            this._closeLists(runtime);
            return;
        }

        this._closeLists(runtime);
        const listContainer = createAutocompleteList(runtime.documentRef, runtime.input, {
            ownerId: runtime.ownerId,
            listId: runtime.listId
        });
        appendAutocompleteMatches({
            documentRef: runtime.documentRef,
            listContainer,
            matches,
            searchTerm: lastPart,
            adaptiveSeparator: canonicalSeparator,
            input: runtime.input,
            key: runtime.key,
            sourceValue: val,
            changeCallback: runtime.changeCallback,
            listId: runtime.listId,
            buildAutocompleteValue: (sourceValue, match, commitOptions = {}) => this.buildAutocompleteValue(sourceValue, match, {
                fieldKey: runtime.key,
                formData,
                formatMode: commitOptions.formatMode,
                separator: canonicalSeparator
            }),
            formatAddress: (match, separator) => AddressAutocomplete.format(match, separator),
            closeAllLists: () => this._closeLists(runtime),
            setTimeoutFn: runtime.setTimeoutFn
        });

        runtime.documentRef.body.appendChild(listContainer);
        runtime.setActiveListContainer(listContainer);
        this._repositionActiveList(runtime);
        runtime.input.setAttribute('aria-expanded', 'true');
    }

    static _scheduleClose(runtime) {
        runtime.setTimeoutFn(() => {
            if (runtime.documentRef.activeElement === runtime.input) {
                return;
            }

            this._closeLists(runtime);
        }, 0);
    }

    static _handleInput(runtime, event, debouncedSearch) {
        if (!event.isTrusted) {
            return;
        }

        if (!this.hasUsableSearchTerm(runtime.input.value)) {
            this._closeLists(runtime);
        }
        debouncedSearch(runtime.input.value);
    }

    static _handleKeydown(runtime, event) {
        if (
            (event.key === 'ArrowDown' || event.key === 'ArrowUp')
            && getAutocompleteItems(runtime.documentRef, runtime.input).length === 0
            && AddressAutocomplete.isReady
            && this.hasUsableSearchTerm(runtime.input.value)
        ) {
            this._performSearch(runtime, runtime.input.value);
        }

        const items = getAutocompleteItems(runtime.documentRef, runtime.input);
        const currentFocus = handleAutocompleteKeydown(
            event,
            items,
            runtime.getCurrentFocus(),
            {
                closeAllLists: () => this._closeLists(runtime),
                input: runtime.input
            }
        );
        runtime.setCurrentFocus(currentFocus);
    }

    /**
     * Bind address autocomplete dropdown behavior.
     */
    /* eslint-disable-next-line max-params */
    static bind(input, key, changeCallback, container = null, schema = null, runtimeContext = {}) {
        if (!isAddressField(key, schema)) {
            return;
        }

        const runtime = this._createRuntime(input, key, changeCallback, {
            container,
            runtimeContext
        });
        const debouncedSearch = DomFactory.debounce((val) => this._performSearch(runtime, val), 300);

        input.addEventListener('input', (event) => {
            this._handleInput(runtime, event, debouncedSearch);
        });
        input.addEventListener('keydown', (event) => {
            this._handleKeydown(runtime, event);
        });
        input.addEventListener('blur', () => {
            this._scheduleClose(runtime);
        });
        input.addEventListener('focusout', () => {
            this._scheduleClose(runtime);
        });

        if (container) {
            container.addEventListener('scroll', () => {
                this._repositionActiveList(runtime);
            }, true);
        }

        if (typeof runtime.windowRef?.addEventListener === 'function') {
            runtime.windowRef.addEventListener('resize', () => {
                this._repositionActiveList(runtime);
            });
        }
    }
}
