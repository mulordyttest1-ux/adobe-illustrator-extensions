function registerDocumentSyncSmokeTests(runner) {
    runner.addTest(
        'Document Sync scan button populates invitation-side fields through live action wiring',
        `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const bridge = testApi && typeof testApi.getBridge === 'function'
                    ? testApi.getBridge()
                    : null;
                const builder = testApi && typeof testApi.getCompactBuilder === 'function'
                    ? testApi.getCompactBuilder()
                    : null;
                const compactTabBtn = document.querySelector('.ds-tab[data-tab="compact"]');
                const compactPanel = document.getElementById('tab-compact');
                const scanBtn = document.getElementById('btn-compact-scan');

                if (!bridge) return { error: 'bridge not found in test API' };
                if (!builder) return { error: 'compact builder not found in test API' };
                if (!scanBtn) return { error: 'btn-compact-scan not found' };
                if (!compactTabBtn || !compactPanel) return { error: 'compact tab controls missing' };

                const originalScanDocument = bridge.scanDocument;

                try {
                    compactTabBtn.click();
                    const tabDeadline = Date.now() + 1500;
                    while (Date.now() < tabDeadline) {
                        if (compactPanel.classList.contains('active')) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    if (!compactPanel.classList.contains('active')) {
                        return { error: 'compact tab did not become active' };
                    }

                    if (typeof builder.setData === 'function') {
                        builder.setData({});
                    }

                    bridge.scanDocument = async () => ({
                        success: true,
                        data: [
                            {
                                id: 'scan-ten-le',
                                top: 120,
                                left: 10,
                                meta_keys: ['info.ten_le'],
                                raw_content: '\\u200BVu Quy\\u200B'
                            },
                            {
                                id: 'scan-pos1-vithu',
                                top: 110,
                                left: 10,
                                meta_keys: ['pos1.vithu'],
                                raw_content: '\\u200BThiep ben co dau\\u200B'
                            },
                            {
                                id: 'scan-pos2-vithu',
                                top: 100,
                                left: 10,
                                meta_keys: ['pos2.vithu'],
                                raw_content: '\\u200BThiep ben chu re\\u200B'
                            }
                        ]
                    });

                    scanBtn.click();

                    let data = null;
                    const dataDeadline = Date.now() + 2500;
                    while (Date.now() < dataDeadline) {
                        data = builder.data || null;
                        if (
                            data &&
                            data['ui.vithu_nu'] === 'Thiep ben co dau' &&
                            data['ui.vithu_nam'] === 'Thiep ben chu re'
                        ) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    return {
                        success: Boolean(
                            data &&
                            data['ui.vithu_nu'] === 'Thiep ben co dau' &&
                            data['ui.vithu_nam'] === 'Thiep ben chu re'
                        ),
                        mappedBrideInvite: data ? data['ui.vithu_nu'] : null,
                        mappedGroomInvite: data ? data['ui.vithu_nam'] : null,
                        tenLe: data ? data['info.ten_le'] : null,
                        scanBtnDisabled: scanBtn.disabled,
                        scanBtnText: scanBtn.textContent
                    };
                } catch (error) {
                    return { error: error.message };
                } finally {
                    bridge.scanDocument = originalScanDocument;
                }
            })()
        `,
        async (result) => {
            if (result.error) {
                throw new Error('Test Failed: ' + result.error);
            }
            if (result.success !== true) {
                throw new Error('Document Sync scan wiring did not populate invitation-side mapping: ' + JSON.stringify(result));
            }
            if (result.tenLe !== 'Vu Quy') {
                throw new Error('Scan wiring did not preserve info.ten_le through the live flow: ' + JSON.stringify(result));
            }
            if (result.scanBtnDisabled !== false) {
                throw new Error('Scan button did not restore enabled state after live scan wiring: ' + JSON.stringify(result));
            }
        }
    );

    runner.addTest(
        'Document Sync update button applies one real plan through live action wiring',
        `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const bridge = testApi && typeof testApi.getBridge === 'function'
                    ? testApi.getBridge()
                    : null;
                const builder = testApi && typeof testApi.getCompactBuilder === 'function'
                    ? testApi.getCompactBuilder()
                    : null;
                const compactTabBtn = document.querySelector('.ds-tab[data-tab="compact"]');
                const compactPanel = document.getElementById('tab-compact');
                const updateBtn = document.getElementById('btn-compact-update');

                if (!bridge) return { error: 'bridge not found in test API' };
                if (!builder) return { error: 'compact builder not found in test API' };
                if (!updateBtn) return { error: 'btn-compact-update not found' };
                if (!compactTabBtn || !compactPanel) return { error: 'compact tab controls missing' };

                const originalCollectFrames = bridge.collectFrames;
                const originalApplyPlan = bridge.applyPlan;
                const originalReadSelectionObjects = bridge.readSelectionObjects;

                try {
                    compactTabBtn.click();
                    const tabDeadline = Date.now() + 1500;
                    while (Date.now() < tabDeadline) {
                        if (compactPanel.classList.contains('active')) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    if (!compactPanel.classList.contains('active')) {
                        return { error: 'compact tab did not become active' };
                    }

                    if (typeof builder.setData !== 'function') {
                        return { error: 'builder.setData missing' };
                    }

                    builder.setData({
                        'info.ten_le': 'T\\u00e2n H\\u00f4n',
                        'ui.vithu_nam': 'Tr\\u01b0\\u1edfng Nam',
                        'ui.vithu_nu': 'Tr\\u01b0\\u1edfng N\\u1eef'
                    });

                    const applyPlanCalls = [];
                    bridge.collectFrames = async () => ({
                        success: true,
                        data: [
                            {
                                id: 'frame-sync-update-1',
                                top: 10,
                                left: 10,
                                meta_keys: [],
                                raw_content: '{info.ten_le}'
                            }
                        ]
                    });
                    bridge.applyPlan = async (plans) => {
                        applyPlanCalls.push(plans);
                        return {
                            success: true,
                            updated: plans.length,
                            affected: [
                                {
                                    id: 'frame-sync-update-1',
                                    meta_keys: ['info.ten_le'],
                                    raw_content: '\\u200BT\\u00e2n H\\u00f4n\\u200B'
                                }
                            ]
                        };
                    };
                    bridge.readSelectionObjects = async () => ({
                        success: true,
                        data: [
                            {
                                id: 'frame-sync-update-1',
                                meta_keys: ['info.ten_le'],
                                raw_content: '\\u200BT\\u00e2n H\\u00f4n\\u200B'
                            }
                        ]
                    });

                    updateBtn.click();

                    const updateDeadline = Date.now() + 2500;
                    while (Date.now() < updateDeadline) {
                        if (applyPlanCalls.length > 0 && updateBtn.disabled === false) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    const firstPlan = applyPlanCalls[0] && applyPlanCalls[0][0]
                        ? applyPlanCalls[0][0]
                        : null;

                    return {
                        applyPlanCalls: applyPlanCalls.length,
                        firstPlanId: firstPlan ? firstPlan.id : null,
                        firstPlanMode: firstPlan && firstPlan.plan ? firstPlan.plan.mode : null,
                        replacementCount: firstPlan && firstPlan.plan && Array.isArray(firstPlan.plan.replacements)
                            ? firstPlan.plan.replacements.length
                            : 0,
                        firstReplacementValue: firstPlan && firstPlan.plan && Array.isArray(firstPlan.plan.replacements) && firstPlan.plan.replacements[0]
                            ? firstPlan.plan.replacements[0].val
                            : null,
                        updateBtnDisabled: updateBtn.disabled,
                        updateBtnText: updateBtn.textContent
                    };
                } catch (error) {
                    return { error: error.message };
                } finally {
                    bridge.collectFrames = originalCollectFrames;
                    bridge.applyPlan = originalApplyPlan;
                    bridge.readSelectionObjects = originalReadSelectionObjects;
                }
            })()
        `,
        async (result) => {
            if (result.error) {
                throw new Error('Test Failed: ' + result.error);
            }
            if (result.applyPlanCalls !== 1) {
                throw new Error('Expected one real applyPlan call from live update wiring: ' + JSON.stringify(result));
            }
            if (result.firstPlanId !== 'frame-sync-update-1') {
                throw new Error('Update wiring drifted away from the expected frame id: ' + JSON.stringify(result));
            }
            if (result.firstPlanMode !== 'ATOMIC') {
                throw new Error('Expected the live update wiring to generate an ATOMIC plan: ' + JSON.stringify(result));
            }
            if (result.replacementCount < 1) {
                throw new Error('Live update wiring did not generate any replacements: ' + JSON.stringify(result));
            }
            if (!result.firstReplacementValue || result.firstReplacementValue.indexOf('T\u00e2n H\u00f4n') === -1) {
                throw new Error('Live update wiring did not carry the processed value into the replacement payload: ' + JSON.stringify(result));
            }
            if (result.updateBtnDisabled !== false) {
                throw new Error('Update button did not restore enabled state after the live update path: ' + JSON.stringify(result));
            }
        }
    );

    runner.addTest(
        'Document Sync no-op update keeps applyPlan untouched through live action wiring',
        `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const bridge = testApi && typeof testApi.getBridge === 'function'
                    ? testApi.getBridge()
                    : null;
                const builder = testApi && typeof testApi.getCompactBuilder === 'function'
                    ? testApi.getCompactBuilder()
                    : null;
                const compactTabBtn = document.querySelector('.ds-tab[data-tab="compact"]');
                const compactPanel = document.getElementById('tab-compact');
                const updateBtn = document.getElementById('btn-compact-update');

                if (!bridge) return { error: 'bridge not found in test API' };
                if (!builder) return { error: 'compact builder not found in test API' };
                if (!updateBtn) return { error: 'btn-compact-update not found' };
                if (!compactTabBtn || !compactPanel) return { error: 'compact tab controls missing' };

                const originalCollectFrames = bridge.collectFrames;
                const originalApplyPlan = bridge.applyPlan;

                try {
                    compactTabBtn.click();
                    const tabDeadline = Date.now() + 1500;
                    while (Date.now() < tabDeadline) {
                        if (compactPanel.classList.contains('active')) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    if (!compactPanel.classList.contains('active')) {
                        return { error: 'compact tab did not become active' };
                    }

                    if (typeof builder.setData !== 'function') {
                        return { error: 'builder.setData missing' };
                    }

                    builder.setData({
                        'info.ten_le': 'T\\u00e2n H\\u00f4n',
                        'ui.vithu_nam': 'Tr\\u01b0\\u1edfng Nam',
                        'ui.vithu_nu': 'Tr\\u01b0\\u1edfng N\\u1eef'
                    });

                    let applyPlanCalls = 0;
                    bridge.collectFrames = async () => ({
                        success: true,
                        data: [
                            {
                                id: 'frame-sync-noop-1',
                                top: 10,
                                left: 10,
                                meta_keys: ['info.ten_le'],
                                raw_content: '\\u200BT\\u00e2n H\\u00f4n\\u200B'
                            }
                        ]
                    });
                    bridge.applyPlan = async () => {
                        applyPlanCalls += 1;
                        return {
                            success: true,
                            updated: 1,
                            affected: []
                        };
                    };

                    updateBtn.click();

                    const noopDeadline = Date.now() + 1500;
                    while (Date.now() < noopDeadline) {
                        if (updateBtn.disabled === false) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }

                    return {
                        applyPlanCalls,
                        updateBtnDisabled: updateBtn.disabled,
                        updateBtnText: updateBtn.textContent
                    };
                } catch (error) {
                    return { error: error.message };
                } finally {
                    bridge.collectFrames = originalCollectFrames;
                    bridge.applyPlan = originalApplyPlan;
                }
            })()
        `,
        async (result) => {
            if (result.error) {
                throw new Error('Test Failed: ' + result.error);
            }
            if (result.applyPlanCalls !== 0) {
                throw new Error('No-op live update should not reach applyPlan: ' + JSON.stringify(result));
            }
            if (result.updateBtnDisabled !== false) {
                throw new Error('Update button did not restore enabled state after the no-op path: ' + JSON.stringify(result));
            }
        }
    );
}

module.exports = { registerDocumentSyncSmokeTests };
