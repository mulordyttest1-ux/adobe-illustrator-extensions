import { LayoutUtils } from '../../ux/LayoutUtils.js';
import { IngestionSanitizer } from '../../pipeline/IngestionSanitizer.js';
import { PlanMetadata } from '../../pipeline/PlanMetadata.js';
import { TemplatePlaceholderCodec } from '../../pipeline/TemplatePlaceholderCodec.js';

function extractCompoundKeys(schemaValue) {
    return schemaValue.split('|').map(token => TemplatePlaceholderCodec.unwrapToken(token));
}

function createDirectPlans(frames, content) {
    return frames.map((frame) => ({
        id: frame.id,
        plan: {
            mode: 'DIRECT',
            content,
            meta: PlanMetadata.clear()
        }
    }));
}

function sortReplacementsDescending(replacements) {
    return [...replacements].sort((a, b) => b.start - a.start);
}

function restoreOriginalIndices(frame, replacements) {
    if (frame && frame._cleanMap) {
        IngestionSanitizer.restoreIndices(replacements, frame._cleanMap);
    }
    return replacements;
}

function buildCloneReplacements(content, targetMoc) {
    const replacements = [];

    for (const placeholder of TemplatePlaceholderCodec.findAll(content)) {
        if (placeholder.key.startsWith('date.tiec.')) {
            replacements.push({
                start: placeholder.start,
                end: placeholder.end,
                val: placeholder.token.replace('date.tiec.', `date.${targetMoc}.`)
            });
            continue;
        }

        if (targetMoc === 'le' && placeholder.key.startsWith('venue.')) {
            replacements.push({
                start: placeholder.start,
                end: placeholder.end,
                val: placeholder.token.replace('venue.', 'ceremony.')
            });
        }
    }

    return replacements;
}

export function buildSingleInjectionPlans({ frames = [], schemaValue } = {}) {
    if (!schemaValue) {
        return { success: false, reason: 'MISSING_SCHEMA_VALUE' };
    }

    return {
        success: true,
        plans: createDirectPlans(frames, schemaValue)
    };
}

export function buildCompoundInjectionPlans({ frames = [], schemaValue } = {}) {
    if (!schemaValue) {
        return { success: false, reason: 'MISSING_SCHEMA_VALUE' };
    }

    const rawKeys = schemaValue.split('|');
    return {
        success: true,
        plans: createDirectPlans(frames, rawKeys.join(' ')),
        keys: extractCompoundKeys(schemaValue)
    };
}

export function buildBulkInjectionPlans({ frames = [], prefix } = {}, deps = {}) {
    if (frames.length !== 4) {
        return {
            success: false,
            reason: 'INVALID_FRAME_COUNT',
            frameCount: frames.length
        };
    }

    const layoutUtils = deps.layoutUtils || LayoutUtils;
    const sortedFrames = layoutUtils.sortFrames(frames);
    const variables = [`{${prefix}.ongba}`, `{${prefix}.ong}`, `{${prefix}.ba}`, `{${prefix}.diachi}`];
    const plans = sortedFrames.map((frame, index) => ({
        id: frame.id,
        plan: {
            mode: 'DIRECT',
            content: variables[index],
            meta: PlanMetadata.clear()
        }
    }));

    return {
        success: true,
        plans
    };
}

export function buildDateClonePlans({ frames = [], targetMoc } = {}) {
    const plans = [];

    for (const frame of frames) {
        const content = frame.text || '';
        const replacements = buildCloneReplacements(content, targetMoc);

        if (replacements.length > 0) {
            restoreOriginalIndices(frame, replacements);
            plans.push({
                id: frame.id,
                plan: {
                    mode: 'ATOMIC',
                    replacements: sortReplacementsDescending(replacements),
                    meta: PlanMetadata.clear()
                }
            });
        }
    }

    if (plans.length === 0) {
        return {
            success: false,
            reason: 'NO_DATE_TIEC_METADATA'
        };
    }

    return {
        success: true,
        plans,
        affectedCount: plans.length
    };
}
