import { createDefaultCardSheetRecipe } from './planner.js';

const STORE_VERSION = 1;
const FALLBACK_STORAGE_KEY = 'wedding_suite_standard_recipe_store_v1';

function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function normalizeBindings(bindings = {}) {
    return {
        envelope: typeof bindings.envelope === 'string' ? bindings.envelope : '',
        invite_1: typeof bindings.invite_1 === 'string' ? bindings.invite_1 : '',
        invite_2: typeof bindings.invite_2 === 'string' ? bindings.invite_2 : '',
        info: typeof bindings.info === 'string' ? bindings.info : ''
    };
}

function normalizeSheetRecipe(recipe, index) {
    const fallback = createDefaultCardSheetRecipe(`sheet_recipe_${index + 1}`);
    const safeRecipe = recipe || {};

    return {
        id: safeRecipe.id || fallback.id,
        label: safeRecipe.label || fallback.label,
        type: 'two_row_card_sheet',
        topRole: safeRecipe.topRole || fallback.topRole,
        topSlots: Math.max(1, parseInt(safeRecipe.topSlots, 10) || fallback.topSlots),
        bottomRole: safeRecipe.bottomRole || fallback.bottomRole,
        bottomSlots: Math.max(1, parseInt(safeRecipe.bottomSlots, 10) || fallback.bottomSlots),
        manualRunCount: safeRecipe.manualRunCount === '' ? '' : Math.max(0, parseInt(safeRecipe.manualRunCount, 10) || 0)
    };
}

export function normalizeRecipe(recipe = {}) {
    return {
        id: typeof recipe.id === 'string' ? recipe.id : '',
        label: typeof recipe.label === 'string' ? recipe.label : '',
        sourceModeDefault: recipe.sourceModeDefault === 'external' ? 'external' : 'active',
        sourcePath: typeof recipe.sourcePath === 'string' ? recipe.sourcePath : '',
        sourceBindings: normalizeBindings(recipe.sourceBindings),
        paperDefaults: {
            stock: typeof recipe.paperDefaults?.stock === 'string' ? recipe.paperDefaults.stock : 'anh_kim_483x320'
        },
        qaOptions: {
            filenameStem: typeof recipe.qaOptions?.filenameStem === 'string' ? recipe.qaOptions.filenameStem : 'info'
        },
        sheetRecipes: Array.isArray(recipe.sheetRecipes) && recipe.sheetRecipes.length
            ? recipe.sheetRecipes.map((entry, index) => normalizeSheetRecipe(entry, index))
            : [createDefaultCardSheetRecipe()]
    };
}

export function normalizeRecipePayload(payload = null) {
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const recipes = Array.isArray(safePayload.recipes) ? safePayload.recipes : [];

    return {
        version: safePayload.version || STORE_VERSION,
        recipes: recipes.map((recipe) => normalizeRecipe(recipe))
    };
}

export function upsertRecipeInPayload(payload, recipe) {
    const normalizedPayload = normalizeRecipePayload(payload);
    const normalizedRecipe = normalizeRecipe(recipe);
    const nextRecipes = normalizedPayload.recipes.filter((entry) => entry.id !== normalizedRecipe.id);

    nextRecipes.push(normalizedRecipe);
    nextRecipes.sort((left, right) => left.label.localeCompare(right.label, 'vi'));

    return {
        version: STORE_VERSION,
        recipes: nextRecipes
    };
}

export class WeddingSuiteRecipeStore {
    constructor(deps = {}) {
        this.fs = deps.fs || (typeof window !== 'undefined' && window.cep ? window.cep.fs : null);
        this.storage = deps.storage || (typeof window !== 'undefined' ? window.localStorage : null);
        this.csFactory = deps.csFactory || (() => new CSInterface());
        this._filePath = null;
        this._dirPath = null;
    }

    _getFilePath() {
        if (this._filePath) {
            return this._filePath;
        }

        if (this.fs && this.csFactory) {
            try {
                const cs = this.csFactory();
                let extensionRoot = cs.getSystemPath(CSInterface.EXTENSION);
                if (extensionRoot.indexOf('file:///') === 0) {
                    extensionRoot = extensionRoot.slice('file:///'.length);
                } else if (extensionRoot.indexOf('file://') === 0) {
                    extensionRoot = extensionRoot.slice('file://'.length);
                }
                this._dirPath = extensionRoot + '/data';
                this._filePath = this._dirPath + '/wedding_suite.recipes.json';
            } catch (error) {
                console.warn('[WeddingSuiteStandard] Falling back to localStorage recipe store:', error);
            }
        }

        return this._filePath;
    }

    _ensureDir() {
        if (!this.fs) {
            return;
        }

        if (!this._dirPath) {
            this._getFilePath();
        }

        if (!this._dirPath) {
            return;
        }

        const stat = this.fs.stat(this._dirPath);
        if (stat.err !== 0) {
            this.fs.makedir(this._dirPath);
        }
    }

    _readPayload() {
        const filePath = this._getFilePath();
        if (this.fs && filePath) {
            const result = this.fs.readFile(filePath);
            if (result && result.err === 0 && result.data) {
                try {
                    return normalizeRecipePayload(JSON.parse(result.data));
                } catch (error) {
                    console.warn('[WeddingSuiteStandard] Failed to parse recipe store, using defaults:', error);
                }
            }
        }

        if (this.storage && typeof this.storage.getItem === 'function') {
            try {
                const raw = this.storage.getItem(FALLBACK_STORAGE_KEY);
                return normalizeRecipePayload(raw ? JSON.parse(raw) : null);
            } catch (error) {
                console.warn('[WeddingSuiteStandard] Failed to parse fallback recipe store:', error);
            }
        }

        return normalizeRecipePayload();
    }

    _writePayload(payload) {
        const normalizedPayload = normalizeRecipePayload(payload);
        if (this.fs && this._getFilePath()) {
            this._ensureDir();
            this.fs.writeFile(this._getFilePath(), JSON.stringify(normalizedPayload, null, 2));
            return normalizedPayload;
        }

        if (this.storage && typeof this.storage.setItem === 'function') {
            this.storage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(normalizedPayload));
        }

        return normalizedPayload;
    }

    getRecipes() {
        return clone(this._readPayload().recipes) || [];
    }

    saveRecipe(recipe) {
        const normalizedRecipe = normalizeRecipe(recipe);
        if (!normalizedRecipe.id) {
            normalizedRecipe.id = this.createRecipeId();
        }

        const nextPayload = upsertRecipeInPayload(this._readPayload(), normalizedRecipe);
        this._writePayload(nextPayload);
        return normalizedRecipe;
    }

    deleteRecipe(id) {
        if (!id) {
            return false;
        }

        const payload = this._readPayload();
        const nextRecipes = payload.recipes.filter((recipe) => recipe.id !== id);
        this._writePayload({
            version: STORE_VERSION,
            recipes: nextRecipes
        });
        return true;
    }

    createRecipeId() {
        return 'ws_recipe_' + Date.now();
    }
}
