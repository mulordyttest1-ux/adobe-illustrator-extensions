export const PAPER_STOCK_CONFIG_RELATIVE_PATH = 'data/wedding_suite_paper_stocks.json';

export const FALLBACK_PAPER_STOCKS = {
    anh_kim_483x320: {
        id: 'anh_kim_483x320',
        label: 'Anh kim 483 x 320',
        widthMm: 483,
        heightMm: 320
    },
    f180_480x330: {
        id: 'f180_480x330',
        label: 'F180 480 x 320',
        widthMm: 480,
        heightMm: 320
    }
};

const FALLBACK_DEFAULT_STOCK_ID = 'anh_kim_483x320';
const FALLBACK_STOCK_ORDER = Object.keys(FALLBACK_PAPER_STOCKS);

function normalizePath(value) {
    return String(value || '').replace(/\\/g, '/').replace(/\/+$/, '');
}

function joinPath(directory, filename) {
    const safeDirectory = normalizePath(directory);
    return safeDirectory ? `${safeDirectory}/${filename}` : filename;
}

function normalizePaperStockEntry(entry = null) {
    const id = String(entry && entry.id ? entry.id : '').trim();
    const label = String(entry && entry.label ? entry.label : id).trim();
    const widthMm = Number(entry && entry.widthMm);
    const heightMm = Number(entry && entry.heightMm);

    if (!id || !(widthMm > 0) || !(heightMm > 0)) {
        return null;
    }

    return {
        id,
        label: label || id,
        widthMm,
        heightMm
    };
}

function normalizeStockEntries(source) {
    if (Array.isArray(source)) {
        return source;
    }

    if (source && Array.isArray(source.stocks)) {
        return source.stocks;
    }

    if (source && source.stocksById && typeof source.stocksById === 'object') {
        return Object.keys(source.stocksById).map((id) => ({
            ...source.stocksById[id],
            id: source.stocksById[id].id || id
        }));
    }

    if (source && typeof source === 'object') {
        return Object.keys(source)
            .filter((key) => source[key] && typeof source[key] === 'object')
            .map((id) => ({
                ...source[id],
                id: source[id].id || id
            }));
    }

    return [];
}

export function normalizePaperStockCatalog(source = null) {
    const entries = normalizeStockEntries(source);
    const stocksById = {};
    const stockOrder = [];

    entries.forEach((entry) => {
        const normalized = normalizePaperStockEntry(entry);
        if (!normalized) {
            return;
        }

        if (!stocksById[normalized.id]) {
            stockOrder.push(normalized.id);
        }
        stocksById[normalized.id] = normalized;
    });

    if (!stockOrder.length) {
        return {
            defaultStockId: FALLBACK_DEFAULT_STOCK_ID,
            stocksById: { ...FALLBACK_PAPER_STOCKS },
            stockOrder: [...FALLBACK_STOCK_ORDER]
        };
    }

    const requestedDefault = String(source && source.defaultStockId ? source.defaultStockId : '').trim();
    const defaultStockId = stocksById[requestedDefault] ? requestedDefault : stockOrder[0];

    return {
        defaultStockId,
        stocksById,
        stockOrder
    };
}

function resolveCepFs(deps = {}) {
    if (deps.fs) {
        return deps.fs;
    }

    return typeof window !== 'undefined' && window.cep ? window.cep.fs : null;
}

function resolveExtensionRoot(deps = {}) {
    if (deps.extensionRoot) {
        return normalizePath(deps.extensionRoot);
    }

    if (typeof CSInterface === 'undefined') {
        return '';
    }

    try {
        const csFactory = deps.csFactory || (() => new CSInterface());
        const cs = csFactory();
        return cs && typeof cs.getSystemPath === 'function'
            ? normalizePath(cs.getSystemPath(CSInterface.EXTENSION))
            : '';
    } catch {
        return '';
    }
}

function readPaperStockConfigText(filePath, deps = {}) {
    const fsApi = resolveCepFs(deps);
    if (!fsApi || typeof fsApi.readFile !== 'function') {
        return '';
    }

    const result = fsApi.readFile(filePath);
    if (!result || result.err) {
        return '';
    }

    return String(result.data || '');
}

export function loadWeddingSuitePaperStockCatalog(deps = {}) {
    if (deps.paperStockCatalog) {
        return normalizePaperStockCatalog(deps.paperStockCatalog);
    }

    const extensionRoot = resolveExtensionRoot(deps);
    const configPath = extensionRoot ? joinPath(extensionRoot, PAPER_STOCK_CONFIG_RELATIVE_PATH) : '';
    const fallbackCatalog = normalizePaperStockCatalog();
    if (!configPath) {
        return fallbackCatalog;
    }

    try {
        const rawText = readPaperStockConfigText(configPath, deps);
        if (!rawText) {
            return fallbackCatalog;
        }

        return normalizePaperStockCatalog(JSON.parse(rawText));
    } catch (error) {
        console.warn('[WeddingSuiteStandard] Failed to load paper stock config:', error);
        return fallbackCatalog;
    }
}

export function resolvePaperStock(catalog, stockId) {
    const normalizedCatalog = normalizePaperStockCatalog(catalog);
    return normalizedCatalog.stocksById[stockId] ||
        normalizedCatalog.stocksById[normalizedCatalog.defaultStockId] ||
        normalizedCatalog.stocksById[normalizedCatalog.stockOrder[0]];
}
