const readyExpression = `
    (function() {
        const state = window.__WEDDING_APP_READY__;
        return !!(state && state.status === 'ready' && state.compactReady === true);
    })()
`;

const readyDetailsExpression = `
    (function() {
        return window.__WEDDING_APP_READY__ || null;
    })()
`;

function waitForWeddingSchemaExpression(options) {
    return `
        (async function() {
            const timeoutMs = 5000;
            const pollMs = 100;
            const startedAt = Date.now();

            while (Date.now() - startedAt < timeoutMs) {
                const schemaTabBtn = document.querySelector('.ds-tab[data-tab="schema"]');
                if (!schemaTabBtn) return 'FAIL_NO_TAB_BTN';

                schemaTabBtn.click();

                const state = window.__WEDDING_APP_READY__ || null;
                if (state && state.schemaReady === true && (${options.domReadyExpression})) {
                    return ${options.successExpression};
                }

                await new Promise((resolve) => setTimeout(resolve, pollMs));
            }

            return ${options.timeoutExpression};
        })()
    `;
}

function createAutocompleteProbeExpression(options) {
    const {
        refExpression,
        blurTargetExpression = 'null',
        inputText,
        expectedMatch,
        selectMode = 'none',
        requireMatch = true,
        requireFuseRuntime = false,
        focusTimeoutMs = 1000,
        timeoutMs = 2000
    } = options;

    const inputTextJson = JSON.stringify(inputText);
    const expectedMatchJson = JSON.stringify(expectedMatch);
    const selectModeJson = JSON.stringify(selectMode);
    const requireFuseRuntimeJson = JSON.stringify(requireFuseRuntime);
    const blurTargetExpressionJson = blurTargetExpression;

    return `
        (async function() {
            const getItems = () => Array.from(document.querySelectorAll('.autocomplete-item'))
                .map((item) => item.innerText.replace(/\\s+/g, ' ').trim())
                .filter(Boolean);
            const getItemNodes = () => Array.from(document.querySelectorAll('.autocomplete-item'));
            const getListNode = () => document.querySelector('.autocomplete-list');
            const pressKey = (field, key) => {
                field.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
            };

            const getActiveElementId = () => {
                const active = document.activeElement;
                if (!active) return null;
                return active.id || active.getAttribute('name') || active.tagName;
            };

            const buildDiagnostics = (field, patch = {}) => {
                const items = getItems();
                return {
                    ok: false,
                    code: 'FAIL_UNKNOWN',
                    expectedMatch: ${expectedMatchJson},
                    typedValue: ${inputTextJson},
                    focused: !!(field && document.activeElement === field),
                    dropdownOpened: items.length > 0,
                    activeElementId: getActiveElementId(),
                    fieldValue: field ? field.value : null,
                    itemsCount: items.length,
                    firstItems: items.slice(0, 5),
                    inputRole: field ? field.getAttribute('role') : null,
                    listRole: null,
                    ariaExpandedBeforeSelect: field ? field.getAttribute('aria-expanded') : null,
                    ariaExpandedAfterSelect: field ? field.getAttribute('aria-expanded') : null,
                    activeDescendantBeforeSelect: field ? field.getAttribute('aria-activedescendant') : null,
                    firstItemRole: null,
                    ...patch
                };
            };

            try {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const builder = testApi && typeof testApi.getCompactBuilder === 'function'
                    ? testApi.getCompactBuilder()
                    : null;
                const fuseReady = typeof globalThis.Fuse === 'function';
                if (!builder) {
                    return buildDiagnostics(null, { code: 'FAIL_NO_BUILDER', fuseReady });
                }
                if (${requireFuseRuntimeJson} && !fuseReady) {
                    return buildDiagnostics(null, { code: 'FAIL_FUSE_UNAVAILABLE', fuseReady });
                }

                const field = ${refExpression};
                if (!field) {
                    return buildDiagnostics(null, { code: 'FAIL_NO_FIELD', fuseReady });
                }

                const compactTabBtn = document.querySelector('.ds-tab[data-tab="compact"]');
                const compactPanel = document.getElementById('tab-compact');
                const tabDeadline = Date.now() + 1000;
                while (Date.now() < tabDeadline) {
                    if (compactTabBtn) {
                        compactTabBtn.click();
                    }
                    if (compactPanel && compactPanel.classList.contains('active')) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }

                if (!compactPanel || !compactPanel.classList.contains('active')) {
                    return buildDiagnostics(field, { code: 'FAIL_COMPACT_TAB_INACTIVE', fuseReady });
                }

                const focusDeadline = Date.now() + ${focusTimeoutMs};
                field.scrollIntoView({ block: 'center', inline: 'nearest' });

                while (Date.now() < focusDeadline) {
                    field.click();
                    field.focus();
                    if (document.activeElement === field) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }

                if (document.activeElement !== field) {
                    return buildDiagnostics(field, { code: 'FAIL_NOT_FOCUSED', fuseReady });
                }

                document.querySelectorAll('.autocomplete-list').forEach((list) => list.remove());
                field.value = '';
                field.focus();
                const emitInput = () => {
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                };

                let inserted = false;
                if (typeof document.execCommand === 'function') {
                    try {
                        document.execCommand('selectAll', false, null);
                    } catch (error) {
                        // noop
                    }
                    inserted = document.execCommand('insertText', false, ${inputTextJson});
                }

                if (!inserted) {
                    field.value = ${inputTextJson};
                }

                emitInput();

                const startedAt = Date.now();
                let lastInputDispatchAt = startedAt;
                while (Date.now() - startedAt < ${timeoutMs}) {
                    const items = getItems();
                    const matchIndex = items.findIndex((text) => text.includes(${expectedMatchJson}));
                    const hasRequiredMatch = ${requireMatch ? 'matchIndex !== -1' : 'items.length > 0'};

                    if (items.length > 0 && hasRequiredMatch) {
                        const listNode = getListNode();
                        const itemNodes = getItemNodes();
                        let selectedItemText = null;
                        let selectedBy = null;
                        const inputRole = field.getAttribute('role');
                        const listRole = listNode ? listNode.getAttribute('role') : null;
                        let ariaExpandedBeforeSelect = field.getAttribute('aria-expanded');
                        let activeDescendantBeforeSelect = field.getAttribute('aria-activedescendant');
                        let firstItemRole = itemNodes[0] ? itemNodes[0].getAttribute('role') : null;
                        const fieldValueBeforeAction = field.value;

                        if (${selectModeJson} === 'first' && itemNodes[0]) {
                            selectedItemText = items[0];
                            itemNodes[0].click();
                            selectedBy = 'first';
                        } else if (${selectModeJson} === 'match' && matchIndex !== -1 && itemNodes[matchIndex]) {
                            selectedItemText = items[matchIndex];
                            itemNodes[matchIndex].click();
                            selectedBy = 'match';
                        } else if (${selectModeJson} === 'keyboardEnter' || ${selectModeJson} === 'keyboardTab') {
                            pressKey(field, 'ArrowDown');
                            activeDescendantBeforeSelect = field.getAttribute('aria-activedescendant');
                            const activeNode = activeDescendantBeforeSelect
                                ? document.getElementById(activeDescendantBeforeSelect)
                                : null;
                            selectedItemText = activeNode
                                ? activeNode.innerText.replace(/\\s+/g, ' ').trim()
                                : null;
                            firstItemRole = activeNode ? activeNode.getAttribute('role') : firstItemRole;
                            ariaExpandedBeforeSelect = field.getAttribute('aria-expanded');
                            pressKey(field, ${selectModeJson} === 'keyboardEnter' ? 'Enter' : 'Tab');
                            selectedBy = ${selectModeJson};
                        } else if (${selectModeJson} === 'escape') {
                            pressKey(field, 'ArrowDown');
                            activeDescendantBeforeSelect = field.getAttribute('aria-activedescendant');
                            ariaExpandedBeforeSelect = field.getAttribute('aria-expanded');
                            pressKey(field, 'Escape');
                            selectedBy = 'escape';
                        } else if (${selectModeJson} === 'blurOtherField') {
                            const blurTarget = ${blurTargetExpressionJson};
                            if (typeof field.blur === 'function') {
                                field.blur();
                            } else {
                                field.dispatchEvent(new Event('blur'));
                            }

                            if (blurTarget && typeof blurTarget.focus === 'function') {
                                blurTarget.focus();
                            } else if (blurTarget && typeof blurTarget.click === 'function') {
                                blurTarget.click();
                            }
                            await new Promise((resolve) => setTimeout(resolve, 50));
                            selectedBy = 'blurOtherField';
                        }

                        await new Promise((resolve) => setTimeout(resolve, 50));
                        const listAfterAction = getListNode();

                        return {
                            ok: true,
                            code: 'PASS',
                            fuseReady,
                            expectedMatch: ${expectedMatchJson},
                            typedValue: ${inputTextJson},
                            focused: document.activeElement === field,
                            dropdownOpened: true,
                            activeElementId: getActiveElementId(),
                            fieldValue: field.value,
                            itemsCount: items.length,
                            firstItems: items.slice(0, 5),
                            inserted,
                            selectedItemText,
                            selectedBy,
                            fieldValueBeforeAction,
                            inputRole,
                            listRole,
                            ariaExpandedBeforeSelect,
                            ariaExpandedAfterSelect: field.getAttribute('aria-expanded'),
                            activeDescendantBeforeSelect,
                            firstItemRole,
                            controlledListId: field.getAttribute('aria-controls'),
                            dropdownClosedAfterAction: !listAfterAction,
                            itemsCountAfterAction: getItems().length
                        };
                    }

                    if (items.length === 0 && Date.now() - lastInputDispatchAt >= 250) {
                        emitInput();
                        lastInputDispatchAt = Date.now();
                    }

                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                return buildDiagnostics(field, {
                    code: ${requireMatch ? "'FAIL_NO_MATCH_FOUND'" : "'FAIL_NO_ITEMS_FOUND'"},
                    inserted,
                    fuseReady
                });
            } catch (error) {
                return {
                    ok: false,
                    code: 'ERROR',
                    fuseReady: typeof globalThis.Fuse === 'function',
                    expectedMatch: ${expectedMatchJson},
                    typedValue: ${inputTextJson},
                    message: error.message
                };
            }
        })()
    `;
}

function withSelectionFixtureExpression(options) {
    const scenarioJson = JSON.stringify(options.scenario);

    return `
        (async function() {
            const testApi = window.__WEDDING_TEST_API__ || null;
            const legacyBridge = testApi && typeof testApi.getBridge === 'function'
                ? testApi.getBridge()
                : null;
            const hostFacade = testApi && typeof testApi.getHostFacade === 'function'
                ? testApi.getHostFacade()
                : legacyBridge;
            const bridge = hostFacade;
            const debugHost = testApi && typeof testApi.getHostDebug === 'function'
                ? testApi.getHostDebug()
                : null;
            let fixture = null;

            try {
                if (!hostFacade) {
                    return { error: 'hostFacade not found in test API' };
                }

                const escapeForExtendScript = (value) => String(value)
                    .replace(/\\\\/g, '\\\\\\\\')
                    .replace(/'/g, "\\\\'");

                const decodeBridgeResult = (value) => {
                    if (!value) {
                        return null;
                    }

                    const binaryString = atob(value);
                    if (typeof TextDecoder === 'function') {
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i += 1) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        return JSON.parse(new TextDecoder('utf-8').decode(bytes).replace(/^\\uFEFF/, '').trim());
                    }

                    return JSON.parse(binaryString.replace(/^\\uFEFF/, '').trim());
                };

                const callHostSelectionValidation = async (payload) => {
                    if (debugHost && typeof debugHost.evalScript === 'function') {
                        const rawResult = await debugHost.evalScript(
                            "IllustratorBridge.hostSelectionValidation('" + escapeForExtendScript(JSON.stringify(payload || {})) + "')"
                        );
                        return decodeBridgeResult(rawResult);
                    }

                    if (legacyBridge && typeof legacyBridge.call === 'function') {
                        return legacyBridge.call('hostSelectionValidation', payload || {});
                    }

                    throw new Error('hostSelectionValidation debug seam unavailable');
                };

                if (
                    debugHost &&
                    typeof debugHost.getExtensionRootPath === 'function' &&
                    typeof debugHost.evalScript === 'function'
                ) {
                    const extensionRoot = debugHost.getExtensionRootPath();
                    const jsxPath = (String(extensionRoot).replace(/[\\\\/]+$/, '') + '/jsx/illustrator.jsx')
                        .replace(/\\\\/g, '/');

                    await debugHost.evalScript(\`
                        (function() {
                            $.evalFile(new File("\${escapeForExtendScript(jsxPath)}"));
                            return "ready";
                        })()
                    \`);
                } else if (
                    legacyBridge &&
                    legacyBridge.host &&
                    typeof legacyBridge.host.getExtensionRootPath === 'function' &&
                    typeof legacyBridge.host.evalScript === 'function'
                ) {
                    const extensionRoot = legacyBridge.host.getExtensionRootPath();
                    const jsxPath = (String(extensionRoot).replace(/[\\\\/]+$/, '') + '/jsx/illustrator.jsx')
                        .replace(/\\\\/g, '/');

                    await legacyBridge.host.evalScript(\`
                        (function() {
                            $.evalFile(new File("\${escapeForExtendScript(jsxPath)}"));
                            return "ready";
                        })()
                    \`);
                }

                fixture = await callHostSelectionValidation({
                    command: 'setup',
                    scenario: ${scenarioJson}
                });

                if (!fixture || fixture.success !== true) {
                    return {
                        error: fixture && fixture.error ? fixture.error : 'host selection fixture setup failed'
                    };
                }

                ${options.runExpression}
            } catch (error) {
                return {
                    error: error.message
                };
            } finally {
                if (hostFacade) {
                    try {
                        await callHostSelectionValidation({ command: 'cleanup' });
                    } catch (cleanupError) {
                        console.warn('[smoke] hostSelectionValidation cleanup failed:', cleanupError.message);
                    }
                }
            }
        })()
    `;
}

function assertAutocompleteProbePassed(result) {
    if (!result || result.ok !== true) {
        throw new Error('Autocomplete probe failed: ' + JSON.stringify(result));
    }
}

module.exports = {
    assertAutocompleteProbePassed,
    createAutocompleteProbeExpression,
    readyDetailsExpression,
    readyExpression,
    waitForWeddingSchemaExpression,
    withSelectionFixtureExpression
};
