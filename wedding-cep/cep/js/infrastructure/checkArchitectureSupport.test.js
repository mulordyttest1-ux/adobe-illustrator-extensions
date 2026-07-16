import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { collectImportViolations } = require('../../scripts/check_architecture_support.cjs');

describe('check_architecture_support', () => {
    it('fails when an external caller imports an internal template-authoring service', () => {
        const violations = collectImportViolations(
            'js/actions/InjectSchemaAction.js',
            'js/logic/use-cases/template-authoring/injectSchemaService.js'
        );

        assert.deepEqual(violations, [
            'template-authoring-public-entry-only: js/actions/InjectSchemaAction.js -> js/logic/use-cases/template-authoring/injectSchemaService.js (Template Authoring internals are context-private. Import templateAuthoringService.js or the compatibility entries instead.)'
        ]);
    });

    it('passes when an external caller imports templateAuthoringService.js', () => {
        const violations = collectImportViolations(
            'js/actions/InjectSchemaAction.js',
            'js/logic/use-cases/template-authoring/templateAuthoringService.js'
        );

        assert.deepEqual(violations, []);
    });

    it('passes for same-context compact-form internal imports', () => {
        const violations = collectImportViolations(
            'js/components/compact-form/CompactFormBuilder.js',
            'js/components/compact-form/FormLogic.js'
        );

        assert.deepEqual(violations, []);
    });

    it('fails when code imports the retired selectionPlanIO helper path', () => {
        const violations = collectImportViolations(
            'js/actions/InjectSchemaAction.js',
            'js/actions/support/selectionPlanIO.js'
        );

        assert.deepEqual(violations, [
            'selection-plan-io-public-entry-only: js/actions/InjectSchemaAction.js -> js/actions/support/selectionPlanIO.js (selectionPlanIO moved under Template Authoring internals. Route through templateAuthoringService.js instead.)'
        ]);
    });

    it('fails when an external caller imports bridge.js directly', () => {
        const violations = collectImportViolations(
            'js/actions/ScanAction.js',
            'js/infrastructure/bridge.js'
        );

        assert.deepEqual(violations, [
            'host-raw-adapters-public-entry-only: js/actions/ScanAction.js -> js/infrastructure/bridge.js (Raw CEP adapters are internal-only. Import hostFacade.js instead.)'
        ]);
    });

    it('fails when an external caller imports cepHost.js directly', () => {
        const violations = collectImportViolations(
            'js/bootstrap/startup.js',
            'js/infrastructure/cepHost.js'
        );

        assert.deepEqual(violations, [
            'host-raw-adapters-public-entry-only: js/bootstrap/startup.js -> js/infrastructure/cepHost.js (Raw CEP adapters are internal-only. Import hostFacade.js instead.)'
        ]);
    });

    it('passes when hostFacade.js imports the raw host adapters', () => {
        const bridgeViolations = collectImportViolations(
            'js/infrastructure/hostFacade.js',
            'js/infrastructure/bridge.js'
        );
        const cepHostViolations = collectImportViolations(
            'js/infrastructure/hostFacade.js',
            'js/infrastructure/cepHost.js'
        );

        assert.deepEqual(bridgeViolations, []);
        assert.deepEqual(cepHostViolations, []);
    });

    it('passes when an external caller imports hostFacade.js', () => {
        const violations = collectImportViolations(
            'js/bootstrap/startup.js',
            'js/infrastructure/hostFacade.js'
        );

        assert.deepEqual(violations, []);
    });
});
