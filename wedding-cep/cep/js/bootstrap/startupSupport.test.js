import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    createStartupDeps,
    enableInputAutoSelect,
    resolveOverride,
    waitForDOM
} from './startupSupport.js';

describe('startupSupport', () => {
    it('resolves explicit overrides ahead of defaults', () => {
        assert.equal(resolveOverride({ key: 'override' }, 'key', 'fallback'), 'override');
        assert.equal(resolveOverride({}, 'missing', 'fallback'), 'fallback');
    });

    it('waits for DOMContentLoaded only when the document is still loading', async () => {
        let resolveDom = null;
        const loadingDocument = {
            readyState: 'loading',
            addEventListener(type, handler, options) {
                assert.equal(type, 'DOMContentLoaded');
                assert.equal(options.once, true);
                resolveDom = handler;
            }
        };

        const pending = waitForDOM({ document: loadingDocument });
        assert.equal(typeof resolveDom, 'function');
        resolveDom();
        await pending;

        await waitForDOM({
            document: {
                readyState: 'complete',
                addEventListener() {
                    throw new Error('should not subscribe');
                }
            }
        });
    });

    it('enables input auto-select only for input and textarea targets', () => {
        let focusHandler = null;
        const documentRef = {
            addEventListener(type, handler) {
                assert.equal(type, 'focusin');
                focusHandler = handler;
            }
        };
        let selected = 0;

        enableInputAutoSelect({ document: documentRef });
        focusHandler({
            target: {
                matches(selector) {
                    assert.equal(selector, 'input, textarea');
                    return true;
                },
                select() {
                    selected += 1;
                }
            }
        });
        focusHandler({
            target: {
                matches() {
                    return false;
                },
                select() {
                    throw new Error('should not select');
                }
            }
        });

        assert.equal(selected, 1);
    });

    it('builds startup deps with override-aware wrappers around defaults', () => {
        const appRuntimeState = {};
        const calls = [];
        const fakeDocument = {
            readyState: 'complete',
            addEventListener() {},
            getElementById(id) {
                calls.push(['getElementById', id]);
                return { id };
            }
        };

        const deps = createStartupDeps({
            appRuntimeState,
            overrides: {
                document: fakeDocument
            },
            defaults: {
                UIFeedback: { id: 'ui' },
                AddressAutocomplete: { id: 'autocomplete' },
                SchemaLoader: { id: 'schema' },
                TabbedPanel: { id: 'tabs' },
                CompactFormBuilder: { id: 'builder' },
                SchemaTabComponents: { id: 'schema-tab' },
                initCalendarEngine: { id: 'calendar' },
                initEthnicNameNormalizer: { id: 'ethnic' },
                wireActionButtons: { id: 'wire-actions' },
                wireSchemaActions: { id: 'wire-schema' },
                updateReadyState(patch, resolvedDeps) {
                    calls.push(['updateReadyState', patch, resolvedDeps]);
                },
                resetReadyState(resolvedDeps) {
                    calls.push(['resetReadyState', resolvedDeps]);
                },
                waitForReadyState(predicate, options, resolvedDeps) {
                    calls.push(['waitForReadyState', predicate, options, resolvedDeps]);
                    return 'waited';
                },
                createCompactController(args, resolvedDeps) {
                    calls.push(['createCompactController', args, resolvedDeps]);
                    return 'compact';
                },
                createSchemaController(args, resolvedDeps) {
                    calls.push(['createSchemaController', args, resolvedDeps]);
                    return 'schema';
                },
                loadStartupResources(args, resolvedDeps) {
                    calls.push(['loadStartupResources', args, resolvedDeps]);
                    return 'resources';
                },
                bootTabbedShell(args, resolvedDeps) {
                    calls.push(['bootTabbedShell', args, resolvedDeps]);
                    return 'booted';
                }
            }
        });

        assert.equal(deps.appRuntimeState, appRuntimeState);
        assert.equal(deps.document, fakeDocument);
        assert.deepEqual(deps.UIFeedback, { id: 'ui' });

        deps.updateReadyState({ phase: 'dom' });
        deps.resetReadyState();
        assert.equal(deps.waitForReadyState(() => true, { timeout: 1 }), 'waited');
        assert.equal(deps.createCompactController({ bridge: true }), 'compact');
        assert.equal(deps.createSchemaController({ schema: true }), 'schema');
        assert.equal(deps.loadStartupResources({ host: true }), 'resources');
        assert.equal(deps.bootTabbedShell({ shell: true }), 'booted');
        assert.deepEqual(deps.getAppElement(), { id: 'app' });

        assert.equal(calls[0][0], 'updateReadyState');
        assert.equal(calls[0][2], deps);
        assert.equal(calls[1][0], 'resetReadyState');
        assert.equal(calls[1][1], deps);
        assert.equal(calls.at(-1)[0], 'getElementById');
    });
});
