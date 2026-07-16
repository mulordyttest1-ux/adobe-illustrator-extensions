import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from './dateGridTestUtils.js';
import {
    bindDateGridWidgetEvents,
    ensureWidgetController,
    resolveCheckboxBaseKey,
    scheduleDependentRowLocks
} from './dateGridWidgetSupport.js';

function createControllerRecorder() {
    return {
        blurCalls: [],
        inputCalls: [],
        checkboxCalls: [],
        handleBlur(ref) {
            this.blurCalls.push(ref);
        },
        handleInput(ref) {
            this.inputCalls.push(ref);
        },
        handleCheckboxChange(ref, baseKey) {
            this.checkboxCalls.push({ ref, baseKey });
        }
    };
}

describe('dateGridWidgetSupport', () => {
    it('creates a fallback controller and warns only when one is missing', () => {
        const warnings = [];
        const refs = {};
        class FakeController {
            constructor(receivedRefs, onChange) {
                this.refs = receivedRefs;
                this.onChange = onChange;
            }
        }

        const fallback = ensureWidgetController({
            controller: null,
            controllerClass: FakeController,
            refs,
            warn: (message) => warnings.push(message)
        });
        const existing = { id: 'existing' };

        assert.equal(fallback.refs, refs);
        assert.equal(fallback.onChange, null);
        assert.deepEqual(warnings, ['[DateGridWidget] Controller not initialized. Call setChangeHandler first.']);
        assert.equal(
            ensureWidgetController({
                controller: existing,
                controllerClass: FakeController,
                refs,
                warn: () => warnings.push('should not warn')
            }),
            existing
        );
    });

    it('binds widget events against the latest controller from the getter', () => {
        const refs = {
            'date.tiec.ngay': createInput({ type: 'number' }),
            'date.le_auto': createInput({ type: 'checkbox' })
        };
        const firstController = createControllerRecorder();
        const secondController = createControllerRecorder();
        let currentController = firstController;

        bindDateGridWidgetEvents({
            refs,
            getController: () => currentController
        });

        currentController = secondController;
        refs['date.tiec.ngay'].dispatchEvent({ type: 'blur' });
        refs['date.tiec.ngay'].dispatchEvent({ type: 'input' });
        refs['date.le_auto'].dispatchEvent({ type: 'change' });

        assert.deepEqual(firstController.blurCalls, []);
        assert.deepEqual(secondController.blurCalls, [refs['date.tiec.ngay']]);
        assert.deepEqual(secondController.inputCalls, [refs['date.tiec.ngay']]);
        assert.deepEqual(secondController.checkboxCalls, [{
            ref: refs['date.le_auto'],
            baseKey: 'date.le'
        }]);
    });

    it('resolves checkbox base keys and schedules only dependent row locks', () => {
        const refs = {
            'date.tiec_auto': createInput({ type: 'checkbox' }),
            'date.le_auto': createInput({ type: 'checkbox' }),
            'date.nhap_auto': createInput({ type: 'checkbox' })
        };
        const scheduled = [];
        const toggleCalls = [];

        assert.equal(resolveCheckboxBaseKey(refs, refs['date.le_auto']), 'date.le');
        assert.equal(resolveCheckboxBaseKey(refs, createInput({ type: 'checkbox' })), null);

        scheduleDependentRowLocks({
            dateConfigs: [{ key: 'date.tiec' }, { key: 'date.le' }, { key: 'date.nhap' }],
            refs,
            setTimeout(callback, delay) {
                scheduled.push({ callback, delay });
            },
            toggleRowState(receivedRefs, baseKey, isLocked) {
                toggleCalls.push({ receivedRefs, baseKey, isLocked });
            }
        });

        assert.equal(scheduled.length, 2);
        scheduled.forEach(({ callback }) => callback());
        assert.deepEqual(toggleCalls, [
            { receivedRefs: refs, baseKey: 'date.le', isLocked: true },
            { receivedRefs: refs, baseKey: 'date.nhap', isLocked: true }
        ]);
    });
});
