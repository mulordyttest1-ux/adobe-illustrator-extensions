const path = require('path');

const REQUIRED_FIELDS = [
    'id',
    'title',
    'buttonLabel',
    'category',
    'order',
    'aliases',
    'description',
    'favoriteRank',
    'requiresDocument',
    'requiresSelection'
];

const INVALID_LEGACY_FIELDS = [
    'confirmMessage'
];

function assertString(value, fieldName, context) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${context}: "${fieldName}" must be a non-empty string`);
    }

    return value.trim();
}

function assertBoolean(value, fieldName, context) {
    if (typeof value !== 'boolean') {
        throw new Error(`${context}: "${fieldName}" must be a boolean`);
    }

    return value;
}

function assertInteger(value, fieldName, context, minValue) {
    if (!Number.isInteger(value) || value < minValue) {
        throw new Error(`${context}: "${fieldName}" must be an integer >= ${minValue}`);
    }

    return value;
}

function normalizeAliases(value, context) {
    if (!Array.isArray(value)) {
        throw new Error(`${context}: "aliases" must be an array`);
    }

    const normalized = [];
    const seen = new Set();

    value.forEach((entry, index) => {
        if (typeof entry !== 'string' || entry.trim() === '') {
            throw new Error(`${context}: aliases[${index}] must be a non-empty string`);
        }

        const trimmed = entry.trim();
        const lowered = trimmed.toLowerCase();
        if (!seen.has(lowered)) {
            normalized.push(trimmed);
            seen.add(lowered);
        }
    });

    if (normalized.length === 0) {
        throw new Error(`${context}: "aliases" must contain at least one alias`);
    }

    return normalized;
}

function normalizeOptionalString(value, fieldName, context) {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value !== 'string') {
        throw new Error(`${context}: "${fieldName}" must be a string when provided`);
    }

    return value.trim();
}

function assertNoLegacyFields(rawManifest, context) {
    INVALID_LEGACY_FIELDS.forEach((fieldName) => {
        if (Object.prototype.hasOwnProperty.call(rawManifest, fieldName)) {
            throw new Error(`${context}: legacy field "${fieldName}" is no longer supported`);
        }
    });
}

function normalizeModuleManifest(rawManifest, context = 'Toolkit module') {
    REQUIRED_FIELDS.forEach((fieldName) => {
        if (!Object.prototype.hasOwnProperty.call(rawManifest, fieldName)) {
            throw new Error(`${context}: missing required field "${fieldName}"`);
        }
    });

    assertNoLegacyFields(rawManifest, context);

    return {
        id: assertString(rawManifest.id, 'id', context),
        title: assertString(rawManifest.title, 'title', context),
        buttonLabel: assertString(rawManifest.buttonLabel, 'buttonLabel', context),
        category: assertString(rawManifest.category, 'category', context),
        order: assertInteger(rawManifest.order, 'order', context, 0),
        aliases: normalizeAliases(rawManifest.aliases, context),
        description: assertString(rawManifest.description, 'description', context),
        favoriteRank: assertInteger(rawManifest.favoriteRank, 'favoriteRank', context, 0),
        requiresDocument: assertBoolean(rawManifest.requiresDocument, 'requiresDocument', context),
        requiresSelection: assertBoolean(rawManifest.requiresSelection, 'requiresSelection', context),
        successMessage: normalizeOptionalString(rawManifest.successMessage, 'successMessage', context)
    };
}

function createModuleDefinition(normalizedManifest, options = {}) {
    const jsxRoot = options.jsxRoot || '';
    const manifestPath = options.manifestPath || '';
    const runPath = options.runPath || '';

    return {
        ...normalizedManifest,
        handler: normalizedManifest.id,
        manifestPath,
        runPath,
        jsxRelativeRunPath: runPath && jsxRoot
            ? path.relative(jsxRoot, runPath).replace(/\\/g, '/')
            : ''
    };
}

module.exports = {
    REQUIRED_FIELDS,
    INVALID_LEGACY_FIELDS,
    normalizeModuleManifest,
    createModuleDefinition
};
