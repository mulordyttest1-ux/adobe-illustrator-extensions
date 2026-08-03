import { normalizeResultData } from '../imposition/postflight/PostflightOrchestrator.js';
import { buildPasteboardLegendPreview } from '../imposition/postflight/rules/PasteboardInfoRule.js';
import { buildLegacyMirrors, buildProcessingOptions, hydratePreset, serializeFormState } from '../imposition/processing_options.js';

function buildSectionSnapshot(schema, sectionId) {
    if (!schema || !schema.sections) return null;

    const section = schema.sections.find((entry) => entry && entry.id === sectionId);
    if (!section) return null;

    const fieldIds = [];
    if (Array.isArray(section.fields)) {
        section.fields.forEach((field) => {
            if (field && field.id) fieldIds.push(field.id);
        });
    }

    if (Array.isArray(section.rows)) {
        section.rows.forEach((row) => {
            if (!row || !row.fields) return;
            Object.keys(row.fields).forEach((edge) => {
                const field = row.fields[edge];
                if (field && field.id) fieldIds.push(field.id);
            });
        });
    }

    return {
        id: section.id,
        fieldIds,
        hasReadOnlySummary: !!(section.readOnlySummary && section.readOnlySummary.length),
        readOnlySummaryIds: section.readOnlySummary ? section.readOnlySummary.map((item) => item.id) : [],
        hasInfoTemplateField: fieldIds.indexOf('info_template') !== -1
    };
}

function buildSchemaSnapshot(schema) {
    return {
        hasSections: !!(schema && schema.sections),
        options: buildSectionSnapshot(schema, 'sec_options'),
        margins: buildSectionSnapshot(schema, 'sec_margins')
    };
}

function buildEmbeddedSchemaSnapshot(sourcePreset) {
    return sourcePreset && sourcePreset.modelVersion === 1
        ? buildSchemaSnapshot(null)
        : buildSchemaSnapshot(sourcePreset && sourcePreset.schema);
}

// eslint-disable-next-line complexity
function buildRuntimeSnapshot(preset, storedPreset, configEngine) {
    if (!preset) return null;

    const sourcePreset = storedPreset || preset;
    const hydrated = hydratePreset(preset);

    return {
        id: hydrated.id || null,
        label: hydrated.label || null,
        compiledRules: configEngine.compileRules(hydrated.schema, hydrated.rawValues),
        processingOptions: hydrated.processingOptions || null,
        options: hydrated.options || null,
        infoTemplate: hydrated.info_template || '',
        pasteboardMode: hydrated.processingOptions && hydrated.processingOptions.postflight
            ? hydrated.processingOptions.postflight.pasteboardMode
            : '',
        rawInfoTemplate: hydrated.rawValues ? (hydrated.rawValues.info_template || '') : '',
        rawPasteboardMode: hydrated.rawValues ? (hydrated.rawValues.pasteboard_mode || '') : '',
        rawValues: hydrated.rawValues || null,
        rawKeys: hydrated.rawValues ? Object.keys(hydrated.rawValues) : [],
        originalRawValues: sourcePreset.rawValues || null,
        originalRawKeys: sourcePreset.rawValues ? Object.keys(sourcePreset.rawValues) : [],
        hasProcessingOptions: !!hydrated.processingOptions,
        schemaSnapshot: buildSchemaSnapshot(hydrated.schema),
        embeddedSchemaSnapshot: buildEmbeddedSchemaSnapshot(sourcePreset)
    };
}

function buildCurrentFormSnapshot(configTab, configEngine) {
    const form = document.getElementById('config-form');
    if (!form) return null;

    const schema = configTab && typeof configTab.getActiveSchema === 'function'
        ? configTab.getActiveSchema()
        : null;
    const rawValues = configTab && typeof configTab.collectFormValues === 'function'
        ? configTab.collectFormValues(form)
        : serializeFormState(form);
    const processingOptions = buildProcessingOptions(rawValues, schema);
    const legacy = buildLegacyMirrors(processingOptions);

    return {
        rawValues,
        compiledRules: configEngine.compileRules(schema, rawValues),
        processingOptions,
        options: legacy.options,
        infoTemplate: legacy.info_template,
        pasteboardMode: processingOptions.postflight ? processingOptions.postflight.pasteboardMode : '',
        activeSchema: buildSchemaSnapshot(schema)
    };
}

function buildDebugHostGateway(mode) {
    return {
        async showGroupCheckDialog() {
            if (mode === 'eval_error') {
                return 'EvalScript error: debug preflight failure';
            }
            if (mode === 'host_failure') {
                return btoa(JSON.stringify({ success: false, error: 'debug failure' }));
            }
            return 'not-base64';
        }
    };
}

// eslint-disable-next-line max-lines-per-function
export function createDebugSurface({
    actionTab,
    configTab,
    configEngine,
    presetRepository,
    preflightRule = null
}) {
    return {
        inspectPresetRuntime(id) {
            const preset = presetRepository.getById(id);
            return buildRuntimeSnapshot(preset, presetRepository.getRawPresetById(id), configEngine);
        },
        inspectPresetShape(preset) {
            return buildRuntimeSnapshot(preset, null, configEngine);
        },
        inspectCurrentFormRuntime() {
            return buildCurrentFormSnapshot(configTab, configEngine);
        },
        inspectActiveSchema() {
            return buildSchemaSnapshot(configTab.getActiveSchema());
        },
        cloneActiveSchema() {
            return JSON.parse(JSON.stringify(configTab.getActiveSchema()));
        },
        applyEphemeralPreset(preset) {
            const hydrated = hydratePreset(preset);
            configTab.setActiveSchema(hydrated.schema);
            configTab.setPresetMeta(hydrated.id || '', hydrated.label || '');
            configTab.setFormState(hydrated.rawValues || {});
            configTab.render();
            return buildRuntimeSnapshot(hydrated, preset, configEngine);
        },
        normalizePostflightResultData(resultData) {
            return normalizeResultData(resultData);
        },
        previewPasteboardLegend(resultData, preset) {
            return buildPasteboardLegendPreview(
                normalizeResultData(resultData),
                hydratePreset(preset || { id: 'debug_preview', label: 'Debug Preview' })
            );
        },
        getLastPostflightSummary() {
            return actionTab.lastPostflightSummary || null;
        },
        async simulatePostflightSuccess(resultData, preset, hostGatewayOverride = null) {
            const originalHostGateway = actionTab.hostGateway;
            if (hostGatewayOverride) {
                actionTab.hostGateway = hostGatewayOverride;
            }

            try {
                await actionTab._handleEngineSuccess(
                    { data: normalizeResultData(resultData) },
                    preset,
                    {}
                );
                return actionTab.lastPostflightSummary || null;
            } finally {
                actionTab.hostGateway = originalHostGateway;
            }
        },
        async simulatePreflightGroupCheckFailure(mode = 'parse_failure') {
            if (!preflightRule) {
                return null;
            }

            return preflightRule.run({ hostGateway: buildDebugHostGateway(mode), notifier: actionTab.notifier }, {});
        },
        inspectStorageHealth(forceRefresh = false) {
            return presetRepository.getStorageHealth(!!forceRefresh);
        },
        setStorageHealthOverride(overrides) {
            const health = presetRepository.setStorageHealthOverride(overrides || {});
            actionTab.render();
            configTab.render();
            return health;
        },
        clearStorageHealthOverride() {
            const health = presetRepository.clearStorageHealthOverride();
            actionTab.render();
            configTab.render();
            return health;
        }
    };
}
