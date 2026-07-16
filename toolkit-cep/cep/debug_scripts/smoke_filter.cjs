function normalizeIdList(value) {
    if (typeof value !== 'string') {
        return [];
    }

    const seen = {};
    const ids = [];
    const pieces = value.split(',');
    let index;

    for (index = 0; index < pieces.length; index += 1) {
        const id = String(pieces[index]).trim();

        if (!id || seen[id]) {
            continue;
        }

        seen[id] = true;
        ids.push(id);
    }

    return ids;
}

function parseSmokeCliArgs(argv) {
    const args = Array.isArray(argv) ? argv.slice() : [];
    let moduleValue = null;
    let scenarioValue = null;
    let index;

    for (index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === '--') {
            continue;
        }

        if (arg === '--module') {
            index += 1;
            if (index >= args.length) {
                throw new Error('Missing module id after --module.');
            }
            moduleValue = args[index];
            continue;
        }

        if (arg === '--scenario') {
            index += 1;
            if (index >= args.length) {
                throw new Error('Missing scenario id after --scenario.');
            }
            scenarioValue = args[index];
            continue;
        }

        if (typeof arg === 'string' && arg.indexOf('--module=') === 0) {
            moduleValue = arg.slice('--module='.length);
            continue;
        }

        if (typeof arg === 'string' && arg.indexOf('--scenario=') === 0) {
            scenarioValue = arg.slice('--scenario='.length);
            continue;
        }

        throw new Error(`Unknown smoke argument: ${arg}`);
    }

    if (moduleValue && scenarioValue) {
        throw new Error('Use either --module or --scenario, not both.');
    }

    if (typeof moduleValue !== 'undefined' && moduleValue !== null && !String(moduleValue).trim()) {
        throw new Error('Missing module id after --module.');
    }

    if (typeof scenarioValue !== 'undefined' && scenarioValue !== null && !String(scenarioValue).trim()) {
        throw new Error('Missing scenario id after --scenario.');
    }

    if (moduleValue) {
        return {
            mode: 'module',
            moduleIds: normalizeIdList(moduleValue),
            scenarioIds: []
        };
    }

    if (scenarioValue) {
        return {
            mode: 'scenario',
            moduleIds: [],
            scenarioIds: normalizeIdList(scenarioValue)
        };
    }

    return {
        mode: 'full',
        moduleIds: [],
        scenarioIds: []
    };
}

function uniqueValues(items) {
    const seen = {};
    const result = [];
    let index;

    for (index = 0; index < items.length; index += 1) {
        const item = items[index];

        if (!item || seen[item]) {
            continue;
        }

        seen[item] = true;
        result.push(item);
    }

    return result;
}

function listAvailableModuleIds(registry) {
    return uniqueValues((registry || []).map((scenario) => scenario.moduleId).filter(Boolean));
}

function listAvailableScenarioIds(registry) {
    return (registry || []).map((scenario) => scenario.id);
}

function assertKnownIds(requestedIds, availableIds, noun) {
    const availableLookup = availableIds.reduce((lookup, id) => {
        lookup[id] = true;
        return lookup;
    }, {});
    const unknownIds = requestedIds.filter((id) => !availableLookup[id]);

    if (unknownIds.length > 0) {
        throw new Error(
            `Unknown ${noun}: ${unknownIds.join(', ')}. Available ${noun}s: ${availableIds.join(', ')}`
        );
    }
}

function selectSmokeScenarios(filter, registry) {
    const mode = filter && filter.mode ? filter.mode : 'full';
    const scenarios = Array.isArray(registry) ? registry.filter((scenario) => scenario.enabled !== false) : [];

    if (mode === 'full') {
        return scenarios.filter((scenario) => scenario.includeInFull !== false);
    }

    if (mode === 'module') {
        const availableModuleIds = listAvailableModuleIds(scenarios);
        assertKnownIds(filter.moduleIds || [], availableModuleIds, 'module');
        return scenarios.filter((scenario) => {
            return (
                scenario.scope === 'module' &&
                scenario.includeInModule !== false &&
                filter.moduleIds.indexOf(scenario.moduleId) >= 0
            );
        });
    }

    if (mode === 'scenario') {
        const availableScenarioIds = listAvailableScenarioIds(scenarios);
        assertKnownIds(filter.scenarioIds || [], availableScenarioIds, 'scenario');
        return scenarios.filter((scenario) => filter.scenarioIds.indexOf(scenario.id) >= 0);
    }

    throw new Error(`Unsupported smoke mode: ${mode}`);
}

function formatSmokeSelection(filter, selectedScenarios) {
    if (!filter || filter.mode === 'full') {
        return `full (${selectedScenarios.length} scenarios)`;
    }

    if (filter.mode === 'module') {
        return `module:${filter.moduleIds.join(',')} (${selectedScenarios.length} scenarios)`;
    }

    return `scenario:${filter.scenarioIds.join(',')} (${selectedScenarios.length} scenarios)`;
}

module.exports = {
    formatSmokeSelection,
    listAvailableModuleIds,
    listAvailableScenarioIds,
    normalizeIdList,
    parseSmokeCliArgs,
    selectSmokeScenarios
};
