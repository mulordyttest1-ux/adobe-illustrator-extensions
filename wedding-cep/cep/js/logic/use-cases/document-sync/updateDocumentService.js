import {
    CalendarEngine,
    NameAnalysis,
    TimeAutomation,
    VenueAutomation,
    WeddingRules
} from '@wedding/domain';
import { WeddingAssembler } from '../../pipeline/assembler.js';
import { Normalizer } from '../../pipeline/normalizer.js';
import { extractSchemaMeta } from '../support/schemaMeta.js';

function createAssemblerDeps(deps = {}) {
    return {
        normalizer: deps.normalizer || Normalizer,
        nameAnalysis: deps.nameAnalysis || NameAnalysis,
        calendarEngine: deps.calendarEngine || CalendarEngine,
        weddingRules: deps.weddingRules || WeddingRules,
        timeAutomation: deps.timeAutomation || TimeAutomation,
        venueAutomation: deps.venueAutomation || VenueAutomation
    };
}

function getTemplateBindings(result) {
    return Array.isArray(result?.templateBindings) ? result.templateBindings : [];
}

function buildFailureResult(rawData, schemaMeta, result) {
    return {
        success: false,
        error: result?.error,
        formData: rawData,
        schemaKeys: schemaMeta.schemaKeys,
        schemaMeta,
        templateBindings: getTemplateBindings(result)
    };
}

function buildSuccessResult(rawData, schemaMeta, result) {
    return {
        success: true,
        updated: result.updated,
        affected: result.affected || [],
        formData: rawData,
        schemaKeys: schemaMeta.schemaKeys,
        schemaMeta,
        templateBindings: getTemplateBindings(result)
    };
}

export async function runUpdateDocumentService({ rawData = {}, schema = null, applyUpdate } = {}, deps = {}) {
    const assembler = deps.assembler || WeddingAssembler;
    const assemblerDeps = createAssemblerDeps(deps);
    const processedData = typeof assembler.assembleWith === 'function'
        ? await assembler.assembleWith(rawData, schema, assemblerDeps)
        : await runLegacyAssemble(assembler, rawData, schema, assemblerDeps);
    const result = await applyUpdate(processedData);
    const schemaMeta = extractSchemaMeta(schema);

    if (!result || !result.success) {
        return buildFailureResult(rawData, schemaMeta, result);
    }

    return buildSuccessResult(rawData, schemaMeta, result);
}

async function runLegacyAssemble(assembler, rawData, schema, assemblerDeps) {
    assembler.setDependencies(assemblerDeps);
    return assembler.assemble(rawData, schema);
}
