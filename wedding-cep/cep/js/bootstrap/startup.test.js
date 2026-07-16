import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    initApp,
    updateReadyState
} from './startup.js';

function createFakeDocument(elements = {}) {
    return {
        readyState: 'complete',
        elements,
        addEventListener() {},
        getElementById(id) {
            return this.elements[id] || null;
        }
    };
}

describe('startup bootstrap', () => {
    it('boots to ready state and hides loading even if hostFacade ping fails', async () => {
        const fakeWindow = {};
        const appElement = { id: 'app-root' };
        const fakeDocument = createFakeDocument({ app: appElement });
        const events = [];
        const fakeHostFacade = {
            id: 'host-facade-mock',
            async testConnection() {
                events.push('hostFacade.testConnection');
                throw new Error('hostFacade unavailable');
            }
        };
        const originalWarn = console.warn;
        console.warn = () => {};

        try {
            await initApp(
                { hostFacade: fakeHostFacade },
                {
                    window: fakeWindow,
                    document: fakeDocument,
                    UIFeedback: {
                        hideLoading: () => events.push('UIFeedback.hideLoading'),
                        showError: (...args) => events.push(['UIFeedback.showError', args])
                    },
                    initCalendarEngine: ({ hostFacade }) => events.push(['initCalendarEngine', hostFacade]),
                    initEthnicNameNormalizer: ({ hostFacade }) => events.push(['initEthnicNameNormalizer', hostFacade]),
                    AddressAutocomplete: {
                        init: async ({ hostFacade }) => events.push(['AddressAutocomplete.init', hostFacade])
                    },
                    SchemaLoader: {
                        load: async ({ hostFacade }) => {
                            events.push(['SchemaLoader.load', hostFacade]);
                            return { id: 'schema-mock' };
                        }
                    },
                    TabbedPanel: class {
                        constructor(options) {
                            events.push('TabbedPanel');
                            options.controllers.compact.init();
                        }
                    },
                    createCompactController: () => ({
                        init: () => {
                            events.push('compact.init');
                            updateReadyState(
                                {
                                    phase: 'compact',
                                    compactReady: true
                                },
                                { window: fakeWindow }
                            );
                        }
                    }),
                    createSchemaController: () => ({
                        init: () => {
                            events.push('schema.init');
                            updateReadyState(
                                {
                                    phase: 'schema',
                                    schemaReady: true
                                },
                                { window: fakeWindow }
                            );
                        }
                    })
                }
            );
        } finally {
            console.warn = originalWarn;
        }

        assert.equal(fakeWindow.__WEDDING_APP_READY__.status, 'ready');
        assert.equal(fakeWindow.__WEDDING_APP_READY__.phase, 'ready');
        assert.equal(fakeWindow.__WEDDING_APP_READY__.compactReady, true);
        assert.equal(fakeWindow.__WEDDING_APP_READY__.error, null);
        assert.ok(events.some((entry) => Array.isArray(entry) && entry[0] === 'initCalendarEngine' && entry[1] === fakeHostFacade));
        assert.ok(events.some((entry) => Array.isArray(entry) && entry[0] === 'AddressAutocomplete.init' && entry[1] === fakeHostFacade));
        assert.ok(events.some((entry) => Array.isArray(entry) && entry[0] === 'SchemaLoader.load' && entry[1] === fakeHostFacade));
        assert.ok(events.includes('TabbedPanel'));
        assert.ok(events.includes('compact.init'));
        assert.ok(events.includes('UIFeedback.hideLoading'));
        assert.equal(events.some((entry) => Array.isArray(entry) && entry[0] === 'UIFeedback.showError'), false);
    });

    it('records error state and shows a startup error when boot fails', async () => {
        const fakeWindow = {};
        const appElement = { id: 'app-root' };
        const fakeDocument = createFakeDocument({ app: appElement });
        const fakeHostFacade = {
            id: 'host-facade-mock',
            async testConnection() {
                return true;
            }
        };
        const showErrorCalls = [];
        let hideLoadingCalls = 0;
        const originalError = console.error;
        console.error = () => {};

        try {
            await initApp(
                {
                    hostFacade: fakeHostFacade
                },
                {
                    window: fakeWindow,
                    document: fakeDocument,
                    UIFeedback: {
                        hideLoading: () => {
                            hideLoadingCalls += 1;
                        },
                        showError: (...args) => {
                            showErrorCalls.push(args);
                        }
                    },
                    initCalendarEngine: async () => {},
                    initEthnicNameNormalizer: async () => {},
                    AddressAutocomplete: {
                        init: async () => {}
                    },
                    SchemaLoader: {
                        load: async ({ hostFacade }) => {
                            assert.equal(hostFacade, fakeHostFacade);
                            throw new Error('schema exploded');
                        }
                    }
                }
            );
        } finally {
            console.error = originalError;
        }

        assert.equal(fakeWindow.__WEDDING_APP_READY__.status, 'error');
        assert.equal(fakeWindow.__WEDDING_APP_READY__.phase, 'error');
        assert.equal(fakeWindow.__WEDDING_APP_READY__.error, 'schema exploded');
        assert.equal(hideLoadingCalls, 1);
        assert.deepEqual(showErrorCalls, [[appElement, 'Lỗi khởi động panel: schema exploded']]);
    });

});
