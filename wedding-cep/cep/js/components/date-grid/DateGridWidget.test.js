import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateGridWidget } from './DateGridWidget.js';
import { createInput } from './dateGridTestUtils.js';

function createRefs(baseKey = 'date') {
    const refs = {};
    refs[`${baseKey}.tiec.ngay`] = createInput({
        type: 'number',
        dataset: {
            key: `${baseKey}.tiec.ngay`,
            baseKey: `${baseKey}.tiec`,
            type: 'solar'
        }
    });
    refs[`${baseKey}.le_auto`] = createInput({ type: 'checkbox', checked: true });
    refs[`${baseKey}.nhap_auto`] = createInput({ type: 'checkbox', checked: true });
    return refs;
}

function createControllerClass(instances) {
    return class FakeController {
        constructor(refs, onChange) {
            this.refs = refs;
            this.onChange = onChange;
            this.blurCalls = [];
            this.inputCalls = [];
            this.checkboxCalls = [];
            this.triggerCount = 0;
            instances.push(this);
        }

        handleBlur(ref) {
            this.blurCalls.push(ref);
        }

        handleInput(ref) {
            this.inputCalls.push(ref);
        }

        handleCheckboxChange(ref, baseKey) {
            this.checkboxCalls.push({ ref, baseKey });
        }

        triggerCompute() {
            this.triggerCount += 1;
        }
    };
}

describe('DateGridWidget', () => {
    it('binds events through the current controller and locks dependent rows after create', () => {
        const controllerInstances = [];
        const toggleCalls = [];
        const scheduled = [];
        const warnings = [];
        const refs = createRefs();
        const ControllerClass = createControllerClass(controllerInstances);
        const widget = new DateGridWidget({
            renderer: {
                render() {
                    return { kind: 'grid' };
                }
            },
            controllerClass: ControllerClass,
            dateGridDom: {
                toggleRowState(receivedRefs, baseKey, isLocked) {
                    toggleCalls.push({ receivedRefs, baseKey, isLocked });
                }
            },
            setTimeout(callback, delay) {
                scheduled.push({ callback, delay });
                return scheduled.length;
            },
            warn(message) {
                warnings.push(message);
            }
        });

        widget.create({}, [{ key: 'date.tiec' }, { key: 'date.le' }, { key: 'date.nhap' }], refs);
        const onChange = () => {};
        widget.setChangeHandler(onChange);

        refs['date.tiec.ngay'].dispatchEvent({ type: 'blur' });
        refs['date.tiec.ngay'].dispatchEvent({ type: 'input' });
        refs['date.le_auto'].dispatchEvent({ type: 'change' });
        refs['date.nhap_auto'].dispatchEvent({ type: 'change' });
        widget.triggerCompute();

        assert.equal(warnings.length, 1);
        assert.equal(controllerInstances.length, 2);
        assert.equal(controllerInstances[1].onChange, onChange);
        assert.deepEqual(controllerInstances[1].blurCalls, [refs['date.tiec.ngay']]);
        assert.deepEqual(controllerInstances[1].inputCalls, [refs['date.tiec.ngay']]);
        assert.deepEqual(
            controllerInstances[1].checkboxCalls.map((entry) => entry.baseKey),
            ['date.le', 'date.nhap']
        );
        assert.equal(controllerInstances[1].triggerCount, 1);
        assert.equal(scheduled.length, 2);

        scheduled.forEach(({ callback }) => callback());
        assert.deepEqual(
            toggleCalls.map((entry) => ({ baseKey: entry.baseKey, isLocked: entry.isLocked })),
            [
                { baseKey: 'date.le', isLocked: true },
                { baseKey: 'date.nhap', isLocked: true }
            ]
        );
    });

    it('keeps refs and event handlers isolated per widget instance', () => {
        const controllerInstances = [];
        const ControllerClass = createControllerClass(controllerInstances);
        const widgetA = new DateGridWidget({
            renderer: { render() { return {}; } },
            controllerClass: ControllerClass,
            dateGridDom: { toggleRowState() {} },
            setTimeout() { return 1; },
            warn() {}
        });
        const widgetB = new DateGridWidget({
            renderer: { render() { return {}; } },
            controllerClass: ControllerClass,
            dateGridDom: { toggleRowState() {} },
            setTimeout() { return 1; },
            warn() {}
        });
        const refsA = createRefs('alpha');
        const refsB = createRefs('beta');

        widgetA.create({}, [{ key: 'alpha.tiec' }, { key: 'alpha.le' }], refsA);
        widgetA.setChangeHandler(() => {});
        widgetB.create({}, [{ key: 'beta.tiec' }, { key: 'beta.le' }], refsB);
        widgetB.setChangeHandler(() => {});

        refsA['alpha.tiec.ngay'].dispatchEvent({ type: 'blur' });
        refsB['beta.tiec.ngay'].dispatchEvent({ type: 'blur' });

        assert.deepEqual(controllerInstances[1].blurCalls, [refsA['alpha.tiec.ngay']]);
        assert.deepEqual(controllerInstances[3].blurCalls, [refsB['beta.tiec.ngay']]);
        assert.equal(controllerInstances[1].refs, refsA);
        assert.equal(controllerInstances[3].refs, refsB);
    });
});
