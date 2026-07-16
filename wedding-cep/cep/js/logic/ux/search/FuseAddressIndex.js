const DEFAULT_LIMIT = 15;
const DEFAULT_OPTIONS = {
    keys: [
        { name: "a", weight: 0.5 },
        { name: "s", weight: 0.3 },
        { name: "c", weight: 0.2 }
    ],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
};

function resolveFuseCtor(FuseCtor) {
    if (FuseCtor) return FuseCtor;
    if (typeof globalThis !== "undefined" && globalThis.Fuse) {
        return globalThis.Fuse;
    }
    return null;
}

export const FuseAddressIndex = {
    create(data, options = {}) {
        const ResolvedFuseCtor = resolveFuseCtor(options.FuseCtor);
        if (!ResolvedFuseCtor) {
            throw new Error("Fuse constructor is unavailable");
        }
        return new ResolvedFuseCtor(data, DEFAULT_OPTIONS);
    },

    normalizeQuery(query) {
        if (!query || typeof query !== "string") return "";
        return query.replace(/[\n\r]+/g, " ").toLowerCase().trim();
    },

    search(index, query, limit = DEFAULT_LIMIT) {
        if (!index) return [];

        const normalizedQuery = this.normalizeQuery(query);
        if (!normalizedQuery) return [];

        return index.search(normalizedQuery).slice(0, limit).map((result) => result.item);
    }
};
