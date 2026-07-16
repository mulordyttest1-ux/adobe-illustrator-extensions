const {
  assertAutocompleteProbePassed,
  createAutocompleteProbeExpression,
  waitForWeddingSchemaExpression,
  withSelectionFixtureExpression,
} = require('../smoke_helpers.cjs');

function registerSchemaSmokeTests(runner) {
  runner.addTest(
    'Tab 2 Schema Injector UI Rendering',
    waitForWeddingSchemaExpression({
      domReadyExpression: `
                document.getElementById('btn-bulk-pos1') &&
                document.getElementById('btn-single-pos1-ong') &&
                document.getElementById('btn-single-venue-diachi') &&
                document.getElementById('btn-inject-auto')
            `,
      successExpression: `({
                tabFound: true,
                bulkBtnText: document.getElementById('btn-bulk-pos1').innerText,
                singleBtnText: document.getElementById('btn-single-pos1-ong').innerText,
                autoBtnText: document.getElementById('btn-inject-auto').innerText
            })`,
      timeoutExpression: `('FAIL_BUTTONS_MISSING\\nHTML is: ' + (document.getElementById('schema-content') ? document.getElementById('schema-content').innerHTML : 'No Container'))`,
    }),
    async (result) => {
      if (typeof result === 'string' && result.startsWith('FAIL')) {
        throw new Error(result);
      }
      if (
        !result.tabFound ||
        !result.bulkBtnText ||
        !result.singleBtnText ||
        !result.autoBtnText
      ) {
        throw new Error(
          'Tab 2 UI did not render correctly. Data: ' + JSON.stringify(result),
        );
      }
      if (
        !result.bulkBtnText.includes('POS 1') ||
        result.singleBtnText !== '{ong}' ||
        !result.autoBtnText ||
        result.autoBtnText.length < 5
      ) {
        throw new Error(
          'Tab 2 labels drifted unexpectedly. Data: ' + JSON.stringify(result),
        );
      }
    },
  );

  runner.addTest(
    'Nút Compound {ho+ten} và {lot+ten}: UI + Logic',
    waitForWeddingSchemaExpression({
      domReadyExpression: `
                document.getElementById('btn-single-pos1-con_ho_ten') &&
                document.getElementById('btn-single-pos1-con_lot_ten') &&
                window.__WEDDING_TEST_API__ &&
                window.__WEDDING_TEST_API__.modules &&
                window.__WEDDING_TEST_API__.modules.manualInjectAction &&
                typeof window.__WEDDING_TEST_API__.modules.manualInjectAction.injectCompound === 'function'
            `,
      successExpression: `(() => {
                const hoTenBtn = document.getElementById('btn-single-pos1-con_ho_ten');
                const lotTenBtn = document.getElementById('btn-single-pos1-con_lot_ten');
                const hoTenSchema = hoTenBtn.dataset.schema;
                const lotTenSchema = lotTenBtn.dataset.schema;
                if (!hoTenSchema.includes('|') || !lotTenSchema.includes('|')) return 'FAIL_SCHEMA_NO_PIPE';

                const raw = '{pos1.con_full.ho_dau}|{pos1.con_full.ten}';
                const keys = raw.split('|').map(k => { const m = k.match(/\\{([\\w.]+)\\}/); return m ? m[1] : k; });

                return {
                    uiHoTenFound: true,
                    uiLotTenFound: true,
                    hoTenSchema,
                    lotTenSchema,
                    parsedKeys: keys
                };
            })()`,
      timeoutExpression: `'FAIL_COMPOUND_BTNS_MISSING'`,
    }),
    async (result) => {
      if (typeof result === 'string' && result.startsWith('FAIL')) {
        throw new Error(result);
      }
      if (!result.uiHoTenFound || !result.uiLotTenFound) {
        throw new Error('Nút compound chưa render trong UI');
      }
      if (
        !result.hoTenSchema.includes('ho_dau') ||
        !result.hoTenSchema.includes('ten')
      ) {
        throw new Error('Schema ho+ten sai: ' + result.hoTenSchema);
      }
      if (
        !result.lotTenSchema.includes('lot') ||
        !result.lotTenSchema.includes('ten')
      ) {
        throw new Error('Schema lot+ten sai: ' + result.lotTenSchema);
      }
    },
  );

  runner.addTest(
    'Multiline Address Autocomplete (Bug Fix C1)',
    createAutocompleteProbeExpression({
      refExpression: `builder.refs['pos1.diachi'] || builder.refs['ceremony.diachi']`,
      inputText: 'TDP Doan Ket\nlsl',
      expectedMatch: 'Lien Son Lak',
      selectMode: 'none',
      requireMatch: false,
      requireFuseRuntime: true,
      timeoutMs: 2500,
    }),
    async (result) => {
      assertAutocompleteProbePassed(result);
      const normalizeAscii = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\u0111/g, 'd')
          .replace(/\u0110/g, 'D');
      if (result.fuseReady !== true) {
        throw new Error(
          'Fuse vendor runtime contract is not satisfied: ' +
            JSON.stringify(result),
        );
      }
      if (
        !result.firstItems.some((item) =>
          normalizeAscii(item).includes('Lien Son Lak'),
        )
      ) {
        throw new Error(
          'Expected multiline autocomplete suggestion was not present: ' +
            JSON.stringify(result),
        );
      }
    },
  );

  runner.addTest(
    'DateHeuristic vs DateStandalone Priority Fix',
    `
            (function() {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const schemaInjector = testApi && testApi.modules ? testApi.modules.schemaInjector : null;
                if (!schemaInjector) return 'FAIL_NO_INJECTOR';
                const frames = [
                    { id: 'f1', text: '12/08/2026' }
                ];
                const result = schemaInjector.computeChanges(frames, 'tiec');
                return JSON.stringify(result);
            })()
        `,
    async (result) => {
      if (result.startsWith('FAIL')) {
        throw new Error(result);
      }
      const data = JSON.parse(result);
      if (!data.changes || data.changes.length === 0) {
        throw new Error('Không có schema nào được tạo ra');
      }
      const replacementValues = data.changes
        .flatMap((change) =>
          change.plan && Array.isArray(change.plan.replacements)
            ? change.plan.replacements
            : [],
        )
        .map((replacement) => replacement.val);
      if (
        !replacementValues.includes('{date.tiec.ngay}') ||
        !replacementValues.includes('{date.tiec.thang}')
      ) {
        throw new Error(
          'Date schema replacements drifted unexpectedly: ' +
            JSON.stringify(data),
        );
      }

      const replacements = data.changes[0].plan.replacements.map(
        (replacement) => replacement.val,
      );
      const hasAmLichToken = replacements.some((value) => /_al\}/.test(value));

      if (hasAmLichToken) {
        throw new Error(
          'FAIL: Numeric date sample should stay on duong lich tokens only. Cac bien duoc tiem: ' +
            JSON.stringify(replacements),
        );
      }
    },
  );

  runner.addTest(
    'Bulk Inject keeps the canonical top-down mapping contract in live schema flow',
    `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const bridge = testApi && typeof testApi.getBridge === 'function'
                    ? testApi.getBridge()
                    : null;
                const schemaTabBtn = document.querySelector('.ds-tab[data-tab="schema"]');
                const schemaPanel = document.getElementById('tab-schema');
                const bulkButton = document.getElementById('btn-bulk-pos1');

                if (!bridge) return { error: 'bridge not found in test API' };
                if (!schemaTabBtn || !schemaPanel) return { error: 'schema tab controls missing' };
                if (!bulkButton) return { error: 'btn-bulk-pos1 not found' };

                const originalReadSelectionObjects = bridge.readSelectionObjects;
                const originalApplyPlan = bridge.applyPlan;

                try {
                    schemaTabBtn.click();

                    const tabDeadline = Date.now() + 1500;
                    while (Date.now() < tabDeadline) {
                        if (schemaPanel.classList.contains('active')) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    if (!schemaPanel.classList.contains('active')) {
                        return { error: 'schema tab did not become active' };
                    }

                    let applyPlanCalls = 0;
                    let capturedPlans = null;
                    bridge.readSelectionObjects = async () => ({
                        success: true,
                        data: [
                            { id: 'bulk-mid', text: 'mid', top: 200, left: 10 },
                            { id: 'bulk-bottom', text: 'bottom', top: 100, left: 10 },
                            { id: 'bulk-top', text: 'top', top: 400, left: 10 },
                            { id: 'bulk-upper-mid', text: 'upper-mid', top: 300, left: 10 }
                        ]
                    });
                    bridge.applyPlan = async (plans) => {
                        applyPlanCalls += 1;
                        capturedPlans = plans;
                        return {
                            success: true,
                            updated: Array.isArray(plans) ? plans.length : 0,
                            affected: (plans || []).map((plan) => ({
                                id: plan.id,
                                text: 'Đã tiêm'
                            }))
                        };
                    };

                    bulkButton.click();

                    const applyDeadline = Date.now() + 4000;
                    while (Date.now() < applyDeadline) {
                        if (applyPlanCalls === 1 && bulkButton.disabled === false) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    return {
                        applyPlanCalls,
                        buttonDisabled: bulkButton.disabled,
                        planIds: Array.isArray(capturedPlans) ? capturedPlans.map((plan) => plan.id) : [],
                        planContents: Array.isArray(capturedPlans) ? capturedPlans.map((plan) => plan.plan.content) : []
                    };
                } catch (error) {
                    return { error: error.message };
                } finally {
                    bridge.readSelectionObjects = originalReadSelectionObjects;
                    bridge.applyPlan = originalApplyPlan;
                }
            })()
        `,
    async (result) => {
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.applyPlanCalls !== 1) {
        throw new Error(
          'Expected bulk inject to reach applyPlan exactly once: ' +
            JSON.stringify(result),
        );
      }
      if (result.buttonDisabled !== false) {
        throw new Error(
          'Bulk inject button did not restore enabled state: ' +
            JSON.stringify(result),
        );
      }
      if (
        JSON.stringify(result.planIds) !==
        JSON.stringify([
          'bulk-top',
          'bulk-upper-mid',
          'bulk-mid',
          'bulk-bottom',
        ])
      ) {
        throw new Error(
          'Bulk inject frame order drifted unexpectedly: ' +
            JSON.stringify(result),
        );
      }
      if (
        JSON.stringify(result.planContents) !==
        JSON.stringify([
          '{pos1.ongba}',
          '{pos1.ong}',
          '{pos1.ba}',
          '{pos1.diachi}',
        ])
      ) {
        throw new Error(
          'Bulk inject content order drifted unexpectedly: ' +
            JSON.stringify(result),
        );
      }
    },
  );

  runner.addTest(
    'Auto Inject surfaces missing required template fields through toast-only wiring',
    `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const bridge = testApi && typeof testApi.getBridge === 'function'
                    ? testApi.getBridge()
                    : null;
                const schemaTabBtn = document.querySelector('.ds-tab[data-tab="schema"]');
                const schemaPanel = document.getElementById('tab-schema');
                const autoButton = document.getElementById('btn-inject-auto');

                if (!bridge) return { error: 'bridge not found in test API' };
                if (!schemaTabBtn || !schemaPanel) return { error: 'schema tab controls missing' };
                if (!autoButton) return { error: 'btn-inject-auto not found' };

                const originalReadSelectionObjects = bridge.readSelectionObjects;
                const originalApplyPlan = bridge.applyPlan;
                const originalSelectFramesById = bridge.selectFramesById;
                const staleToastClose = document.querySelector('#toast-container .toast-close');
                if (staleToastClose) {
                    staleToastClose.click();
                    await new Promise((resolve) => setTimeout(resolve, 400));
                }

                try {
                    schemaTabBtn.click();

                    const tabDeadline = Date.now() + 1500;
                    while (Date.now() < tabDeadline) {
                        if (schemaPanel.classList.contains('active')) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    if (!schemaPanel.classList.contains('active')) {
                        return { error: 'schema tab did not become active' };
                    }

                    let applyPlanCalls = 0;
                    bridge.readSelectionObjects = async () => ({
                        success: true,
                        data: [
                            { id: 'fixture-auto-date', text: '12/08/2026' }
                        ]
                    });
                    bridge.applyPlan = async (plans) => {
                        applyPlanCalls += 1;
                        return {
                            success: true,
                            updated: Array.isArray(plans) ? plans.length : 0,
                            affected: (plans || []).map((plan) => ({
                                id: plan.id,
                                text: 'Đã tiêm'
                            }))
                        };
                    };
                    bridge.selectFramesById = async () => ({ success: true });

                    autoButton.click();

                    let toastText = '';
                    let widgetFound = false;
                    const widgetDeadline = Date.now() + 4000;
                    while (Date.now() < widgetDeadline) {
                        widgetFound = Boolean(document.getElementById('postflight-report-widget'));
                        const toastContainer = document.getElementById('toast-container');
                        toastText = toastContainer
                            ? toastContainer.textContent.replace(/\\s+/g, ' ').trim()
                            : '';

                        if (
                            toastText.includes('Thiết kế còn thiếu biến bắt buộc. Hãy bổ sung trước khi render.') &&
                            autoButton.disabled === false
                        ) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    return {
                        applyPlanCalls,
                        toastText,
                        widgetFound,
                        buttonDisabled: autoButton.disabled
                    };
                } catch (error) {
                    return { error: error.message };
                } finally {
                    bridge.readSelectionObjects = originalReadSelectionObjects;
                    bridge.applyPlan = originalApplyPlan;
                    bridge.selectFramesById = originalSelectFramesById;
                }
            })()
        `,
    async (result) => {
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.applyPlanCalls !== 1) {
        throw new Error(
          'Expected auto inject to reach applyPlan exactly once: ' +
            JSON.stringify(result),
        );
      }
      if (result.widgetFound !== false) {
        throw new Error(
          'Legacy report widget should not render after auto inject anymore: ' +
            JSON.stringify(result),
        );
      }
      if (
        !result.toastText.includes(
          'Thiết kế còn thiếu biến bắt buộc. Hãy bổ sung trước khi render.',
        )
      ) {
        throw new Error(
          'Missing-required toast did not surface after auto inject: ' +
            JSON.stringify(result),
        );
      }
      if (result.buttonDisabled !== false) {
        throw new Error(
          'Auto inject button did not restore enabled state: ' +
            JSON.stringify(result),
        );
      }
    },
  );

  runner.addTest(
    'Auto Inject selects the real orphan frame in Illustrator selection',
    withSelectionFixtureExpression({
      scenario: 'inject_orphan',
      runExpression: `
                const schemaTabBtn = document.querySelector('.ds-tab[data-tab="schema"]');
                const schemaPanel = document.getElementById('tab-schema');
                const autoButton = document.getElementById('btn-inject-auto');
                const initialSelection = await bridge.readSelectionObjects();
                if (!initialSelection || !initialSelection.success) {
                    return { error: 'initial selection read failed', initialSelection };
                }
                if (!schemaTabBtn || !schemaPanel || !autoButton) {
                    return { error: 'schema auto inject controls missing' };
                }

                const tabDeadline = Date.now() + 1500;
                while (Date.now() < tabDeadline) {
                    schemaTabBtn.click();
                    if (schemaPanel.classList.contains('active')) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }

                if (!schemaPanel.classList.contains('active')) {
                    return { error: 'schema tab did not become active' };
                }

                autoButton.click();

                let finalSelection = null;
                const selectionDeadline = Date.now() + 5000;
                while (Date.now() < selectionDeadline) {
                    finalSelection = await bridge.readSelectionObjects();
                    if (
                        finalSelection &&
                        finalSelection.success &&
                        Array.isArray(finalSelection.data) &&
                        finalSelection.data.length === 1 &&
                        finalSelection.data[0].id === fixture.orphanId
                    ) {
                        return {
                            success: true,
                            orphanId: fixture.orphanId,
                            initialSelectionIds: initialSelection.data.map((frame) => frame.id),
                            finalSelectionIds: finalSelection.data.map((frame) => frame.id)
                        };
                    }

                    await new Promise((resolve) => setTimeout(resolve, 100));
                }

                return {
                    success: false,
                    orphanId: fixture.orphanId,
                    initialSelectionIds: initialSelection.data.map((frame) => frame.id),
                    finalSelection
                };
            `,
    }),
    async (result) => {
      if (result.error) {
        throw new Error(result.error + ' :: ' + JSON.stringify(result));
      }
      if (
        !Array.isArray(result.initialSelectionIds) ||
        result.initialSelectionIds.length < 2
      ) {
        throw new Error(
          'Expected >=2 selected frames before auto inject: ' +
            JSON.stringify(result),
        );
      }
      if (result.success !== true) {
        throw new Error(
          'Auto inject did not narrow selection to the orphan frame: ' +
            JSON.stringify(result),
        );
      }
      if (
        !Array.isArray(result.finalSelectionIds) ||
        result.finalSelectionIds[0] !== result.orphanId
      ) {
        throw new Error(
          'Final selection did not match orphan frame: ' +
            JSON.stringify(result),
        );
      }
    },
  );
}

module.exports = { registerSchemaSmokeTests };
