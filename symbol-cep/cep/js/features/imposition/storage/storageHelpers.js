import { impositionCopy } from '../imposition_copy.js';

export const CURRENT_VERSION = 4;
export const USAGE_STORE_VERSION = 1;
export const LEGACY_LOCALSTORAGE_KEY = 'cep_imposition_presets';

export const STORAGE_REASON_MESSAGES = {
    ok: '',
    missing_target: impositionCopy.storage.reason.missing_target,
    invalid_json: impositionCopy.storage.reason.invalid_json,
    write_denied: impositionCopy.storage.reason.write_denied,
    usage_write_denied: impositionCopy.storage.reason.usage_write_denied
};

export function hasOwn(target, key) {
    return !!target && Object.prototype.hasOwnProperty.call(target, key);
}

export function sanitizeUsageEntry(entry) {
    const safeEntry = entry || {};
    const usageCount = Number.isFinite(Number(safeEntry.usageCount)) ? Number(safeEntry.usageCount) : 0;
    const lastUsedAt = safeEntry.lastUsedAt || null;

    return {
        usageCount,
        lastUsedAt
    };
}

export function stripUsageMetadata(preset) {
    if (!preset) return preset;

    const stripped = { ...preset };
    delete stripped.usageCount;
    delete stripped.lastUsedAt;
    return stripped;
}

export function buildUsageStoreFromPresets(presets) {
    const usageById = {};
    const safePresets = Array.isArray(presets) ? presets : [];

    safePresets.forEach((preset) => {
        if (!preset || !preset.id) return;
        if (!hasOwn(preset, 'usageCount') && !preset.lastUsedAt) return;

        usageById[preset.id] = sanitizeUsageEntry({
            usageCount: preset.usageCount,
            lastUsedAt: preset.lastUsedAt || null
        });
    });

    return usageById;
}

export function normalizeUsageStorePayload(fileData) {
    if (!fileData) {
        return {
            version: USAGE_STORE_VERSION,
            usageById: {}
        };
    }

    const rawUsageById = (fileData.usageById && typeof fileData.usageById === 'object' && !Array.isArray(fileData.usageById))
        ? fileData.usageById
        : ((typeof fileData === 'object' && !Array.isArray(fileData)) ? fileData : {});

    const usageById = {};
    Object.keys(rawUsageById).forEach((presetId) => {
        if (!presetId) return;
        usageById[presetId] = sanitizeUsageEntry(rawUsageById[presetId]);
    });

    return {
        version: fileData.version || USAGE_STORE_VERSION,
        usageById
    };
}

export function mergeUsageIntoPresets(presets, usageById) {
    const safePresets = Array.isArray(presets) ? presets : [];
    const safeUsage = usageById || {};

    return safePresets.map((preset) => {
        if (!preset || !preset.id) return preset;

        const usage = hasOwn(safeUsage, preset.id)
            ? sanitizeUsageEntry(safeUsage[preset.id])
            : sanitizeUsageEntry({
                usageCount: preset.usageCount,
                lastUsedAt: preset.lastUsedAt
            });

        return {
            ...preset,
            usageCount: usage.usageCount,
            lastUsedAt: usage.lastUsedAt
        };
    });
}

export function createStorageHealth(overrides = {}) {
    const health = {
        path: overrides.path || '',
        usagePath: overrides.usagePath || '',
        canReadPresets: overrides.canReadPresets !== undefined ? overrides.canReadPresets : true,
        canWritePresets: overrides.canWritePresets !== undefined ? overrides.canWritePresets : true,
        canWriteUsage: overrides.canWriteUsage !== undefined ? overrides.canWriteUsage : true,
        reason: overrides.reason || 'ok',
        inspectedAt: overrides.inspectedAt || new Date().toISOString()
    };

    health.message = overrides.message !== undefined
        ? overrides.message
        : (STORAGE_REASON_MESSAGES[health.reason] || '');

    return health;
}

export function resolveStorageHealth(report = {}) {
    const base = {
        path: report.path || '',
        usagePath: report.usagePath || '',
        inspectedAt: report.inspectedAt || new Date().toISOString()
    };

    if (report.presetsState === 'missing_target' || report.presetsState === 'read_error') {
        return createStorageHealth({
            ...base,
            canReadPresets: false,
            canWritePresets: false,
            canWriteUsage: !!report.canWriteUsage,
            reason: 'missing_target'
        });
    }

    if (report.presetsState === 'invalid_json') {
        return createStorageHealth({
            ...base,
            canReadPresets: false,
            canWritePresets: false,
            canWriteUsage: !!report.canWriteUsage,
            reason: 'invalid_json'
        });
    }

    if (report.usageState === 'invalid_json') {
        return createStorageHealth({
            ...base,
            canReadPresets: true,
            canWritePresets: !!report.canWritePresets,
            canWriteUsage: !!report.canWriteUsage,
            reason: 'invalid_json'
        });
    }

    if (!report.canWritePresets) {
        return createStorageHealth({
            ...base,
            canReadPresets: true,
            canWritePresets: false,
            canWriteUsage: !!report.canWriteUsage,
            reason: 'write_denied'
        });
    }

    if (!report.canWriteUsage) {
        return createStorageHealth({
            ...base,
            canReadPresets: true,
            canWritePresets: true,
            canWriteUsage: false,
            reason: 'usage_write_denied'
        });
    }

    return createStorageHealth({
        ...base,
        reason: 'ok'
    });
}
