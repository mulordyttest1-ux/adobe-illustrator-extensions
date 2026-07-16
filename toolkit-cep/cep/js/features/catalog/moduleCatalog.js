function uniqueAliases(aliases = []) {
    const result = [];
    const seen = new Set();

    aliases.forEach((alias) => {
        const trimmed = String(alias || '').trim();
        if (!trimmed) {
            return;
        }

        const lowered = trimmed.toLowerCase();
        if (!seen.has(lowered)) {
            result.push(trimmed);
            seen.add(lowered);
        }
    });

    return result;
}

function readTrimmedString(value, fallback = '') {
    return String(value || fallback).trim();
}

function readNumber(value, fallback = 0) {
    return Number(value || fallback);
}

function readBoolean(value) {
    return Boolean(value);
}

const CATEGORY_PRIORITY = Object.freeze([
    'Daily Work',
    'Cut Workflow',
    'Text'
]);

const CATEGORY_PRIORITY_LOOKUP = new Map(
    CATEGORY_PRIORITY.map((category, index) => [category, index])
);

function compareCategory(leftCategory, rightCategory) {
    const leftPriority = CATEGORY_PRIORITY_LOOKUP.get(leftCategory);
    const rightPriority = CATEGORY_PRIORITY_LOOKUP.get(rightCategory);

    if (leftPriority !== undefined || rightPriority !== undefined) {
        if (leftPriority === undefined) {
            return 1;
        }

        if (rightPriority === undefined) {
            return -1;
        }

        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
        }
    }

    return leftCategory.localeCompare(rightCategory);
}

function createAvailabilityLookup(hostRuntimeMeta) {
    const quarantinedModules = Array.isArray(hostRuntimeMeta?.quarantinedModules)
        ? hostRuntimeMeta.quarantinedModules
        : [];
    const lookup = new Map();

    quarantinedModules.forEach((entry) => {
        const id = readTrimmedString(entry?.id);
        if (!id) {
            return;
        }

        lookup.set(id, {
            enabled: false,
            status: 'quarantined',
            disabledReason: readTrimmedString(entry?.reason, 'This toolkit module is quarantined.')
        });
    });

    return lookup;
}

function resolveAvailability(manifestId, availabilityLookup) {
    if (availabilityLookup.has(manifestId)) {
        return availabilityLookup.get(manifestId);
    }

    return {
        enabled: true,
        status: 'ready',
        disabledReason: ''
    };
}

export function normalizeToolkitModule(manifest, availabilityLookup = new Map()) {
    const availability = resolveAvailability(readTrimmedString(manifest.id), availabilityLookup);

    return Object.freeze({
        id: readTrimmedString(manifest.id),
        title: readTrimmedString(manifest.title),
        buttonLabel: readTrimmedString(manifest.buttonLabel, manifest.title),
        category: readTrimmedString(manifest.category, 'General'),
        order: readNumber(manifest.order),
        aliases: Object.freeze(uniqueAliases(manifest.aliases || [])),
        description: readTrimmedString(manifest.description),
        favoriteRank: readNumber(manifest.favoriteRank),
        requiresDocument: readBoolean(manifest.requiresDocument),
        requiresSelection: readBoolean(manifest.requiresSelection),
        successMessage: readTrimmedString(manifest.successMessage),
        handler: readTrimmedString(manifest.handler, manifest.id),
        enabled: availability.enabled !== false,
        status: readTrimmedString(availability.status, 'ready'),
        disabledReason: readTrimmedString(availability.disabledReason)
    });
}

function sortModules(left, right) {
    const categoryComparison = compareCategory(left.category, right.category);
    if (categoryComparison !== 0) {
        return categoryComparison;
    }

    if (left.order !== right.order) {
        return left.order - right.order;
    }

    return left.title.localeCompare(right.title);
}

export function createToolkitCatalog(moduleManifests, hostRuntimeMeta = null) {
    const availabilityLookup = createAvailabilityLookup(hostRuntimeMeta);
    const modules = Object.freeze(
        moduleManifests
            .map((manifest) => normalizeToolkitModule(manifest, availabilityLookup))
            .sort(sortModules)
    );
    const lookup = new Map();
    const groupMap = new Map();
    let enabledCount = 0;
    let quarantinedCount = 0;

    modules.forEach((manifest) => {
        lookup.set(manifest.id, manifest);
        if (manifest.enabled) {
            enabledCount += 1;
        } else if (manifest.status === 'quarantined') {
            quarantinedCount += 1;
        }

        if (!groupMap.has(manifest.category)) {
            groupMap.set(manifest.category, []);
        }
        groupMap.get(manifest.category).push(manifest);
    });

    const groups = Object.freeze(
        Array.from(groupMap.entries()).map(([category, items]) => Object.freeze({
            category,
            items: Object.freeze(items.slice())
        }))
    );

    return Object.freeze({
        modules,
        lookup,
        groups,
        hostRuntimeMeta: hostRuntimeMeta || null,
        enabledCount,
        quarantinedCount
    });
}
