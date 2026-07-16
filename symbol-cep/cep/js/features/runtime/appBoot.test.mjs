import test from 'node:test';
import assert from 'node:assert/strict';

import {
    bootTabs,
    instantiateRules
} from './appBoot.js';

test('instantiateRules registers every descriptor-produced rule into the orchestrator', () => {
    const registered = [];
    const orchestrator = {
        registerRule(rule) {
            registered.push(rule);
        }
    };

    instantiateRules(orchestrator, [
        { run() { return true; } },
        () => ({ run() { return true; } })
    ]);

    assert.equal(registered.length, 2);
    assert.equal(typeof registered[0].run, 'function');
    assert.equal(typeof registered[1].run, 'function');
});

test('bootTabs mounts tab descriptors without hardcoded knowledge of specific tabs', () => {
    const initCalls = [];
    const tabs = bootTabs([
        {
            key: 'alpha',
            containerId: 'alpha-container',
            create() {
                return {
                    init(containerId) {
                        initCalls.push(['alpha', containerId]);
                    }
                };
            }
        },
        {
            key: 'beta',
            containerId: 'beta-container',
            create() {
                return {
                    init(containerId) {
                        initCalls.push(['beta', containerId]);
                    }
                };
            }
        }
    ], {});

    assert.deepEqual(Object.keys(tabs), ['alpha', 'beta']);
    assert.deepEqual(initCalls, [
        ['alpha', 'alpha-container'],
        ['beta', 'beta-container']
    ]);
});
