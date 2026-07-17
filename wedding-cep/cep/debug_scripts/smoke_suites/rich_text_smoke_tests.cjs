function registerRichTextSmokeTests(runner) {
    runner.addTest(
        'Rich text superscript applies through Illustrator host plan',
        `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const debugHost = testApi && typeof testApi.getHostDebug === 'function'
                    ? testApi.getHostDebug()
                    : null;

                if (!debugHost || typeof debugHost.evalScript !== 'function') {
                    return { error: 'debug host evalScript unavailable' };
                }
                if (typeof debugHost.getExtensionRootPath !== 'function') {
                    return { error: 'debug host extension root unavailable' };
                }

                const escapeForExtendScript = (value) => String(value)
                    .replace(/\\\\/g, '\\\\\\\\')
                    .replace(/'/g, "\\\\'");
                const extensionRoot = debugHost.getExtensionRootPath();
                const jsxPath = (String(extensionRoot).replace(/[\\\\/]+$/, '') + '/jsx/illustrator.jsx')
                    .replace(/\\\\/g, '/');

                const script = \`
                    (function() {
                        $.evalFile(new File('\${escapeForExtendScript(jsxPath)}'));

                        var doc = app.documents.add();
                        var result = {
                            success: false,
                            directBaselineWorks: false,
                            applyPlanBaselineWorks: false,
                            directBaseline: null,
                            directNormalBaseline: null,
                            planBaseline: null,
                            planNormalBaseline: null,
                            applyResult: null,
                            content: null,
                            error: null
                        };

                        function createFrame(text, left, top) {
                            var frame = null;
                            if (doc.textFrames && typeof doc.textFrames.pointText === 'function') {
                                frame = doc.textFrames.pointText([left, top]);
                            } else {
                                frame = doc.textFrames.add();
                                frame.position = [left, top];
                            }
                            frame.contents = text;
                            return frame;
                        }

                        function baselineAt(frame, index) {
                            return frame.characters[index].characterAttributes.baselinePosition;
                        }

                        try {
                            var direct = createFrame('terexa Nguyen Thi An', 100, 500);
                            direct.characters[0].characterAttributes.baselinePosition = FontBaselineOption.SUPERSCRIPT;
                            direct.characters[7].characterAttributes.baselinePosition = FontBaselineOption.NORMALBASELINE;
                            result.directBaseline = String(baselineAt(direct, 0));
                            result.directNormalBaseline = String(baselineAt(direct, 7));
                            result.directBaselineWorks = baselineAt(direct, 0) === FontBaselineOption.SUPERSCRIPT &&
                                baselineAt(direct, 7) === FontBaselineOption.NORMALBASELINE;

                            var planned = createFrame('terexa Nguyen Thi An', 100, 450);
                            var frameId = getStableTextFrameId(planned, 1);
                            doc.selection = null;
                            var plan = [{
                                id: frameId,
                                plan: {
                                    mode: 'STYLE',
                                    resetRanges: [{ start: 0, end: planned.contents.length, baseline: 'normal' }],
                                    styleRanges: [{ start: 0, end: 6, baseline: 'superscript' }],
                                    meta: { keys: ['pos1.con_full'] }
                                }
                            }];

                            result.applyResult = IllustratorBridge.applyPlan(JSON.stringify(plan));
                            result.content = planned.contents;
                            result.planBaseline = String(baselineAt(planned, 0));
                            result.planNormalBaseline = String(baselineAt(planned, 7));
                            result.applyPlanBaselineWorks = baselineAt(planned, 0) === FontBaselineOption.SUPERSCRIPT &&
                                baselineAt(planned, 7) === FontBaselineOption.NORMALBASELINE;
                            result.success = result.directBaselineWorks && result.applyPlanBaselineWorks;
                        } catch (error) {
                            result.error = error.message;
                        } finally {
                            try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (closeError) { }
                        }

                        return JSON.stringify(result);
                    })()
                \`;

                const raw = await debugHost.evalScript(script);
                try {
                    return JSON.parse(raw);
                } catch (error) {
                    return { error: 'Could not parse Illustrator superscript smoke result', raw };
                }
            })()
        `,
        async (result) => {
            if (result.error) {
                throw new Error(result.error + ' :: ' + JSON.stringify(result));
            }
            if (result.directBaselineWorks !== true) {
                throw new Error('Illustrator did not accept direct superscript baseline control: ' + JSON.stringify(result));
            }
            if (result.applyPlanBaselineWorks !== true) {
                throw new Error('applyPlan did not preserve superscript baseline control: ' + JSON.stringify(result));
            }
            if (result.content !== 'terexa Nguyen Thi An') {
                throw new Error('Superscript smoke mutated customer text: ' + JSON.stringify(result));
            }
        }
    );

    runner.addTest(
        'Document Sync update renders saint prefix as superscript in Illustrator',
        `
            (async () => {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const debugHost = testApi && typeof testApi.getHostDebug === 'function'
                    ? testApi.getHostDebug()
                    : null;
                const builder = testApi && typeof testApi.getCompactBuilder === 'function'
                    ? testApi.getCompactBuilder()
                    : null;
                const updateBtn = document.getElementById('btn-compact-update');
                const compactTabBtn = document.querySelector('.ds-tab[data-tab="compact"]');
                const compactPanel = document.getElementById('tab-compact');

                if (!debugHost || typeof debugHost.evalScript !== 'function') {
                    return { error: 'debug host evalScript unavailable' };
                }
                if (typeof debugHost.getExtensionRootPath !== 'function') {
                    return { error: 'debug host extension root unavailable' };
                }
                if (!builder || typeof builder.setData !== 'function') {
                    return { error: 'compact builder setData unavailable' };
                }
                if (!updateBtn || !compactTabBtn || !compactPanel) {
                    return { error: 'compact update controls unavailable' };
                }

                const escapeForExtendScript = (value) => String(value)
                    .replace(/\\\\/g, '\\\\\\\\')
                    .replace(/'/g, "\\\\'");
                const extensionRoot = debugHost.getExtensionRootPath();
                const jsxPath = (String(extensionRoot).replace(/[\\\\/]+$/, '') + '/jsx/illustrator.jsx')
                    .replace(/\\\\/g, '/');

                const evalJson = async (script) => {
                    const raw = await debugHost.evalScript(script);
                    try {
                        return JSON.parse(raw);
                    } catch (error) {
                        return { error: 'Could not parse Illustrator result', raw };
                    }
                };

                const setup = await evalJson(\`
                    (function() {
                        $.evalFile(new File('\${escapeForExtendScript(jsxPath)}'));
                        var doc = app.documents.add();
                        var frame = null;
                        if (doc.textFrames && typeof doc.textFrames.pointText === 'function') {
                            frame = doc.textFrames.pointText([100, 500]);
                        } else {
                            frame = doc.textFrames.add();
                            frame.position = [100, 500];
                        }
                        frame.contents = '{pos1.con_full}';
                        frame.name = 'saint_prefix_update_fixture';
                        doc.selection = null;
                        return JSON.stringify({
                            success: true,
                            frameId: getStableTextFrameId(frame, 0),
                            initialContent: frame.contents
                        });
                    })()
                \`);

                if (!setup || setup.success !== true) {
                    return { error: 'fixture setup failed', setup };
                }

                try {
                    compactTabBtn.click();
                    const tabDeadline = Date.now() + 1500;
                    while (Date.now() < tabDeadline) {
                        if (compactPanel.classList.contains('active')) break;
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                    if (!compactPanel.classList.contains('active')) {
                        return { error: 'compact tab did not become active', setup };
                    }

                    builder.setData({
                        'info.ten_le': 'T\\u00e2n H\\u00f4n',
                        'ui.vithu_nam': 'Tr\\u01b0\\u1edfng Nam',
                        'ui.vithu_nu': 'Tr\\u01b0\\u1edfng N\\u1eef',
                        'pos1.con_full': 'te-rê-sa Nguyễn Thị An',
                        'pos1.con_full_split_idx': 0
                    });

                    updateBtn.click();

                    let status = null;
                    const deadline = Date.now() + 5000;
                    while (Date.now() < deadline) {
                        status = await evalJson(\`
                            (function() {
                                var doc = app.activeDocument;
                                var frame = doc.textFrames[0];
                                var text = frame.contents;
                                var prefix = 'te-rê-sa';
                                var start = text.indexOf(prefix);
                                var ordinaryStart = start >= 0 ? start + prefix.length + 1 : -1;
                                var result = {
                                    success: false,
                                    content: text,
                                    start: start,
                                    prefixLength: prefix.length,
                                    baselinePrefix: null,
                                    baselineOrdinary: null,
                                    prefixSuperscript: false,
                                    ordinaryNormal: false,
                                    note: frame.note
                                };

                                if (start >= 0) {
                                    result.baselinePrefix = String(frame.characters[start].characterAttributes.baselinePosition);
                                    result.prefixSuperscript = frame.characters[start].characterAttributes.baselinePosition === FontBaselineOption.SUPERSCRIPT;
                                }
                                if (ordinaryStart >= 0 && ordinaryStart < frame.characters.length) {
                                    result.baselineOrdinary = String(frame.characters[ordinaryStart].characterAttributes.baselinePosition);
                                    result.ordinaryNormal = frame.characters[ordinaryStart].characterAttributes.baselinePosition === FontBaselineOption.NORMALBASELINE;
                                }
                                result.success = result.prefixSuperscript && result.ordinaryNormal;
                                return JSON.stringify(result);
                            })()
                        \`);

                        if (status && status.success === true && updateBtn.disabled === false) {
                            break;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }

                    return {
                        setup,
                        updateBtnDisabled: updateBtn.disabled,
                        status
                    };
                } finally {
                    await evalJson(\`
                        (function() {
                            try {
                                if (app.documents.length > 0) {
                                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
                                }
                                return JSON.stringify({ success: true });
                            } catch (error) {
                                return JSON.stringify({ success: false, error: error.message });
                            }
                        })()
                    \`);
                }
            })()
        `,
        async (result) => {
            if (result.error) {
                throw new Error(result.error + ' :: ' + JSON.stringify(result));
            }
            if (!result.status || result.status.success !== true) {
                throw new Error('Live update did not render saint prefix superscript: ' + JSON.stringify(result));
            }
            if (!result.status.content || result.status.content.indexOf('te-rê-sa Nguyễn Thị An') === -1) {
                throw new Error('Live update mutated or missed customer text: ' + JSON.stringify(result));
            }
            if (result.updateBtnDisabled !== false) {
                throw new Error('Update button did not restore after superscript live update: ' + JSON.stringify(result));
            }
        }
    );
}

module.exports = { registerRichTextSmokeTests };
