import { FieldTypeResolver } from '../../logic/ux/input/FieldTypeResolver.js';

const AUTOCOMPLETE_LIST_CLASS = 'autocomplete-list';
const AUTOCOMPLETE_ITEM_CLASS = 'autocomplete-item';
const AUTOCOMPLETE_HINT_CLASS = 'autocomplete-hint';
const MULTILINE_COMMIT_MODE = 'multiline';

let generatedAutocompleteId = 0;

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assignElementClass(element, className) {
    if (!element) {
        return;
    }

    if (typeof element.classList?.add === 'function') {
        element.classList.add(className);
        return;
    }

    if (typeof element.setAttribute === 'function') {
        element.setAttribute('class', className);
        return;
    }

    element.className = className;
}

function sanitizeIdSegment(value = 'field') {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'field';
}

function resolveOwnerInput(documentRef, listContainer, fallbackInput = null) {
    const ownerId = typeof listContainer?.getAttribute === 'function'
        ? listContainer.getAttribute('data-owner-id')
        : null;

    if (!ownerId || typeof documentRef?.getElementById !== 'function') {
        return fallbackInput;
    }

    return documentRef.getElementById(ownerId) || fallbackInput;
}

function resolveListContainer(documentRef, input = null) {
    const controlledListId = typeof input?.getAttribute === 'function'
        ? input.getAttribute('aria-controls')
        : '';

    if (controlledListId && typeof documentRef?.getElementById === 'function') {
        const listById = documentRef.getElementById(controlledListId);
        if (listById) {
            return listById;
        }
    }

    const lists = typeof documentRef?.getElementsByClassName === 'function'
        ? documentRef.getElementsByClassName(AUTOCOMPLETE_LIST_CLASS)
        : [];

    return lists && lists.length ? lists[0] : null;
}

export function isAddressField(key, schema, fieldTypeResolver = FieldTypeResolver, schemaUtils) {
    return fieldTypeResolver.isAddressField(key, schema, schemaUtils);
}

export function ensureAutocompleteCombobox(input, key = 'field') {
    if (!input || typeof input.setAttribute !== 'function') {
        return { ownerId: null, listId: null };
    }

    let ownerId = input.id;
    if (!ownerId) {
        generatedAutocompleteId += 1;
        ownerId = `wedding-autocomplete-${sanitizeIdSegment(key)}-${generatedAutocompleteId}`;
        input.id = ownerId;
    }

    const listId = `${ownerId}__listbox`;
    input.setAttribute('data-autocomplete-owner-id', ownerId);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');

    return { ownerId, listId };
}

export function setAutocompleteExpanded(input, isExpanded) {
    if (!input || typeof input.setAttribute !== 'function') {
        return;
    }

    input.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    if (!isExpanded && typeof input.removeAttribute === 'function') {
        input.removeAttribute('aria-activedescendant');
    }
}

export function closeAutocompleteLists(documentRef, input, keepElement = null) {
    const lists = Array.from(documentRef.getElementsByClassName(AUTOCOMPLETE_LIST_CLASS) || []);

    lists.forEach((list) => {
        const shouldKeep = keepElement
            && (keepElement === list || (typeof list.contains === 'function' && list.contains(keepElement)));

        if (shouldKeep) {
            return;
        }

        const ownerInput = resolveOwnerInput(documentRef, list, input);
        setAutocompleteExpanded(ownerInput, false);

        if (list !== input && list.parentNode) {
            list.parentNode.removeChild(list);
        }
    });

    setAutocompleteExpanded(input, false);
}

export function applyActiveItem(items, currentFocus, input = null) {
    if (!items || !items.length) {
        setAutocompleteExpanded(input, false);
        return -1;
    }

    Array.from(items).forEach((item) => {
        item.classList.remove('autocomplete-active');
        if (typeof item.setAttribute === 'function') {
            item.setAttribute('aria-selected', 'false');
        }
    });

    let nextFocus = currentFocus;
    if (nextFocus >= items.length) {
        nextFocus = 0;
    }
    if (nextFocus < 0) {
        nextFocus = items.length - 1;
    }

    items[nextFocus].classList.add('autocomplete-active');
    if (typeof items[nextFocus].setAttribute === 'function') {
        items[nextFocus].setAttribute('aria-selected', 'true');
    }
    if (typeof input?.setAttribute === 'function') {
        input.setAttribute('aria-activedescendant', items[nextFocus].id || '');
        input.setAttribute('aria-expanded', 'true');
    }
    if (typeof items[nextFocus].scrollIntoView === 'function') {
        items[nextFocus].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    return nextFocus;
}

function resolveAutocompleteView(input, windowRef) {
    if (windowRef) {
        return windowRef;
    }

    if (input?.ownerDocument?.defaultView) {
        return input.ownerDocument.defaultView;
    }

    return globalThis;
}

function resolveScrollOffset(view, primaryKey, fallbackKey) {
    if (!view) {
        return 0;
    }

    if (typeof view[primaryKey] === 'number') {
        return view[primaryKey];
    }

    if (typeof view[fallbackKey] === 'number') {
        return view[fallbackKey];
    }

    return 0;
}

export function positionAutocompleteList(listContainer, input, windowRef = null) {
    if (!listContainer || !input || typeof input.getBoundingClientRect !== 'function') {
        return;
    }

    const rect = input.getBoundingClientRect();
    const view = resolveAutocompleteView(input, windowRef);
    const scrollX = resolveScrollOffset(view, 'scrollX', 'pageXOffset');
    const scrollY = resolveScrollOffset(view, 'scrollY', 'pageYOffset');

    listContainer.style.left = `${scrollX + rect.left}px`;
    listContainer.style.top = `${scrollY + rect.bottom}px`;
    listContainer.style.width = `${rect.width}px`;
}

export function createAutocompleteList(documentRef, input, options = {}) {
    const listContainer = documentRef.createElement('div');
    assignElementClass(listContainer, AUTOCOMPLETE_LIST_CLASS);
    listContainer.id = options.listId || `${input.id}__listbox`;
    listContainer.setAttribute('role', 'listbox');
    listContainer.setAttribute('data-owner-id', options.ownerId || input.id);

    return listContainer;
}

export function highlightMatch(fullAddress, searchTerm) {
    return fullAddress.replace(new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi'), '<strong>$1</strong>');
}

function createAutocompleteHint(documentRef) {
    const hintDiv = documentRef.createElement('div');
    assignElementClass(hintDiv, AUTOCOMPLETE_HINT_CLASS);
    hintDiv.setAttribute('role', 'presentation');
    hintDiv.setAttribute('aria-hidden', 'true');
    hintDiv.textContent = 'Tab/Enter: cung dong | Alt+Enter: xuong dong';
    return hintDiv;
}

export function createAutocompleteItem({
    documentRef,
    optionId,
    highlightedHtml,
    finalValue,
    getFinalValue,
    onSelect
}) {
    const itemDiv = documentRef.createElement('div');
    assignElementClass(itemDiv, AUTOCOMPLETE_ITEM_CLASS);
    itemDiv.id = optionId;
    itemDiv.setAttribute('role', 'option');
    itemDiv.setAttribute('aria-selected', 'false');
    itemDiv.setAttribute('tabindex', '-1');
    itemDiv.innerHTML = highlightedHtml;

    itemDiv.addEventListener('mousedown', (event) => {
        event.preventDefault();
    });

    itemDiv.commitAutocompleteValue = (commitOptions = {}) => {
        const nextValue = typeof getFinalValue === 'function'
            ? getFinalValue(commitOptions)
            : finalValue;

        if (typeof onSelect === 'function') {
            onSelect(nextValue, commitOptions);
        }
    };

    itemDiv.addEventListener('click', () => itemDiv.commitAutocompleteValue());

    return itemDiv;
}

export function getAutocompleteItems(documentRef, input = null) {
    const listContainer = resolveListContainer(documentRef, input);
    if (!listContainer) {
        return [];
    }

    if (typeof listContainer.getElementsByClassName === 'function') {
        return Array.from(listContainer.getElementsByClassName(AUTOCOMPLETE_ITEM_CLASS) || []);
    }

    return [];
}

export function appendAutocompleteMatches({
    documentRef,
    listContainer,
    matches,
    searchTerm,
    adaptiveSeparator,
    input,
    key,
    sourceValue,
    changeCallback,
    buildAutocompleteValue,
    formatAddress,
    closeAllLists,
    setTimeoutFn,
    listId,
    onSelectValue
}) {
    listContainer.appendChild(createAutocompleteHint(documentRef));

    matches.forEach((match, index) => {
        const fullAddress = formatAddress(match, adaptiveSeparator);
        const finalValue = buildAutocompleteValue(sourceValue, match, { formatMode: 'inline' });
        const itemDiv = createAutocompleteItem({
            documentRef,
            optionId: `${listId}__option-${index}`,
            highlightedHtml: highlightMatch(fullAddress, searchTerm),
            finalValue,
            getFinalValue: (commitOptions = {}) => buildAutocompleteValue(sourceValue, match, commitOptions),
            onSelect: (nextValue) => {
                input.value = nextValue;
                if (changeCallback) {
                    changeCallback(key, nextValue);
                }
                closeAllLists();

                const oldBg = input.style.backgroundColor;
                input.style.backgroundColor = '#d1e7dd';
                setTimeoutFn(() => {
                    input.style.backgroundColor = oldBg || '';
                }, 300);

                if (typeof input.focus === 'function') {
                    input.focus();
                }
                if (typeof onSelectValue === 'function') {
                    onSelectValue(nextValue);
                }
            }
        });

        listContainer.appendChild(itemDiv);
    });
}

function handleEmptyAutocompleteKey(event, closeAllLists) {
    if (event.key === 'Tab' || event.key === 'Escape') {
        closeAllLists();
        return -1;
    }

    return null;
}

function handleAutocompleteNavigationKey(event, items, currentFocus, input) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        return applyActiveItem(items, currentFocus + 1, input);
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        return applyActiveItem(items, currentFocus - 1, input);
    }

    return null;
}

function commitAutocompleteItem(item, commitOptions = {}) {
    if (item && typeof item.commitAutocompleteValue === 'function') {
        item.commitAutocompleteValue(commitOptions);
        return;
    }

    if (item && typeof item.click === 'function') {
        item.click();
    }
}

function handleAutocompleteCommitKey(event, items, currentFocus, closeAllLists) {
    if (event.key === 'Enter') {
        if (currentFocus > -1) {
            event.preventDefault();
            commitAutocompleteItem(items[currentFocus], {
                formatMode: event.altKey ? MULTILINE_COMMIT_MODE : 'inline'
            });
            return -1;
        }

        return currentFocus;
    }

    if (event.key === 'Tab') {
        if (currentFocus > -1) {
            event.preventDefault();
            commitAutocompleteItem(items[currentFocus], { formatMode: 'inline' });
            return -1;
        }

        closeAllLists();
        return -1;
    }

    if (event.key === 'Escape') {
        closeAllLists();
        return -1;
    }

    return null;
}

export function handleAutocompleteKeydown(event, items, currentFocus, runtime = {}) {
    const closeAllLists = typeof runtime.closeAllLists === 'function' ? runtime.closeAllLists : () => {};
    const input = runtime.input || null;

    if (!items.length) {
        return handleEmptyAutocompleteKey(event, closeAllLists) ?? currentFocus;
    }

    const navigationFocus = handleAutocompleteNavigationKey(event, items, currentFocus, input);
    if (navigationFocus !== null) {
        return navigationFocus;
    }

    const commitFocus = handleAutocompleteCommitKey(event, items, currentFocus, closeAllLists);
    if (commitFocus !== null) {
        return commitFocus;
    }

    return currentFocus;
}
