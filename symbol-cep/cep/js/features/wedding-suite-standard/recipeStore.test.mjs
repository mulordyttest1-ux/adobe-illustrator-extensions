import test from 'node:test';
import assert from 'node:assert/strict';

import { WeddingSuiteRecipeStore } from './recipeStore.js';

function createStorage() {
    const store = new Map();
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        }
    };
}

test('WeddingSuiteRecipeStore saves, reloads, and deletes recipes through fallback storage', () => {
    const storage = createStorage();
    const recipeStore = new WeddingSuiteRecipeStore({
        fs: null,
        storage,
        csFactory: null
    });

    const saved = recipeStore.saveRecipe({
        id: 'recipe_alpha',
        label: 'Alpha',
        sourceBindings: {
            envelope: 'artboard_0',
            invite_1: 'artboard_1',
            invite_2: '',
            info: 'artboard_3'
        },
        sheetRecipes: []
    });

    assert.equal(saved.id, 'recipe_alpha');
    assert.equal(recipeStore.getRecipes().length, 1);
    assert.equal(recipeStore.getRecipes()[0].label, 'Alpha');

    recipeStore.deleteRecipe('recipe_alpha');
    assert.equal(recipeStore.getRecipes().length, 0);
});
