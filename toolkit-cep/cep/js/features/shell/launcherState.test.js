import test from 'node:test';
import assert from 'node:assert/strict';
import {
    clearLauncherSearch,
    createLauncherState,
    moveSelection,
    setLauncherQuery
} from './launcherState.js';

const RESULTS = [
    { id: 'first' },
    { id: 'second' },
    { id: 'third' }
];

test('setLauncherQuery resets selection to the first result', () => {
    const state = setLauncherQuery(createLauncherState(), 'ping', RESULTS);
    assert.equal(state.selectedIndex, 0);
});

test('moveSelection wraps through results', () => {
    const withQuery = setLauncherQuery(createLauncherState(), 'ping', RESULTS);
    const moved = moveSelection(withQuery, -1);
    assert.equal(moved.selectedIndex, 2);
});

test('clearLauncherSearch resets query and selected index', () => {
    const cleared = clearLauncherSearch(setLauncherQuery(createLauncherState(), 'ping', RESULTS));
    assert.equal(cleared.query, '');
    assert.equal(cleared.selectedIndex, -1);
    assert.deepEqual(cleared.results, []);
});
