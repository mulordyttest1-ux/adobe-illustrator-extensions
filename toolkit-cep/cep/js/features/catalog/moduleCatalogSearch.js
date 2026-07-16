const DEFAULT_LIMIT = 12;

export function normalizeQuery(query) {
    return String(query || '').trim();
}

function resolveFuse(FuseOverride) {
    if (typeof FuseOverride === 'function') {
        return FuseOverride;
    }

    if (typeof globalThis !== 'undefined' && typeof globalThis.Fuse === 'function') {
        return globalThis.Fuse;
    }

    return null;
}

function createFallbackSearcher(commands) {
    return function fallbackSearch(query, limit) {
        const normalizedQuery = query.toLowerCase();
        const scoredResults = commands
            .map((command) => {
                const title = command.title.toLowerCase();
                const description = command.description.toLowerCase();
                const category = command.category.toLowerCase();
                const aliases = command.aliases.map((alias) => alias.toLowerCase());

                let score = 0;
                if (title === normalizedQuery) score += 120;
                if (title.startsWith(normalizedQuery)) score += 80;
                if (aliases.some((alias) => alias === normalizedQuery)) score += 70;
                if (aliases.some((alias) => alias.startsWith(normalizedQuery))) score += 60;
                if (title.includes(normalizedQuery)) score += 40;
                if (description.includes(normalizedQuery)) score += 20;
                if (category.includes(normalizedQuery)) score += 10;

                return { command, score };
            })
            .filter((entry) => entry.score > 0)
            .sort((left, right) => right.score - left.score || left.command.order - right.command.order);

        return scoredResults.slice(0, limit).map((entry) => entry.command);
    };
}

export const ToolkitCatalogSearch = {
    createIndex(commands, options = {}) {
        const FuseCtor = resolveFuse(options.Fuse);
        if (!FuseCtor) {
            return {
                commands: Object.freeze(commands.slice()),
                fallbackSearch: createFallbackSearcher(commands)
            };
        }

        const fuse = new FuseCtor(commands, {
            includeScore: true,
            threshold: 0.32,
            ignoreLocation: true,
            keys: [
                { name: 'title', weight: 0.45 },
                { name: 'aliases', weight: 0.3 },
                { name: 'description', weight: 0.15 },
                { name: 'category', weight: 0.1 }
            ]
        });

        return {
            commands: Object.freeze(commands.slice()),
            fuse
        };
    },

    search(index, query, limit = DEFAULT_LIMIT) {
        const normalizedQuery = normalizeQuery(query);
        if (!normalizedQuery) {
            return index.commands.slice(0, limit);
        }

        if (index.fallbackSearch) {
            return index.fallbackSearch(normalizedQuery, limit);
        }

        return index.fuse.search(normalizedQuery, { limit }).map((entry) => entry.item);
    }
};
