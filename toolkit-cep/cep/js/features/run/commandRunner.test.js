import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandRunner } from './commandRunner.js';

function createFeedbackStub() {
    return {
        messages: [],
        showToast(message, type) {
            this.messages.push({ message, type });
        }
    };
}

test('createCommandRunner blocks disabled quarantined modules before any host call', async () => {
    let inspectedContext = false;
    let didRunHost = false;
    const feedback = createFeedbackStub();
    const runtimeState = {};
    const runner = createCommandRunner({
        hostFacade: {
            async getExecutionContext() {
                inspectedContext = true;
                return { hasActiveDocument: true, selectionCount: 1 };
            },
            async runCommand() {
                didRunHost = true;
                return { success: true, message: 'should not run' };
            }
        },
        UIFeedback: feedback,
        runtimeState
    });

    const result = await runner.runManifest({
        id: 'broken_module',
        title: 'Broken Module',
        enabled: false,
        status: 'quarantined',
        disabledReason: 'Syntax error in module.'
    });

    assert.equal(result.blocked, true);
    assert.equal(result.errorCode, 'QUARANTINED_TOOLKIT_COMMAND');
    assert.equal(inspectedContext, false);
    assert.equal(didRunHost, false);
    assert.equal(runtimeState.lastResult, result);
    assert.equal(feedback.messages[0].type, 'warning');
});

test('createCommandRunner blocks before host execution when preflight fails', async () => {
    let didRunHost = false;
    const feedback = createFeedbackStub();
    const runtimeState = {};
    const runner = createCommandRunner({
        hostFacade: {
            async getExecutionContext() {
                return { hasActiveDocument: false, selectionCount: 0 };
            },
            async runCommand() {
                didRunHost = true;
                return { success: true, message: 'should not run' };
            }
        },
        UIFeedback: feedback,
        runtimeState
    });

    const result = await runner.runManifest({
        id: 'alpha_command',
        title: 'Alpha Command',
        enabled: true,
        status: 'ready',
        requiresDocument: true,
        requiresSelection: false,
        successMessage: ''
    });

    assert.equal(result.blocked, true);
    assert.equal(didRunHost, false);
    assert.equal(runtimeState.lastResult, result);
    assert.equal(feedback.messages[0].type, 'warning');
});

test('createCommandRunner runs healthy host commands directly', async () => {
    let receivedRequest = null;
    const feedback = createFeedbackStub();
    const runtimeState = {};
    const runner = createCommandRunner({
        hostFacade: {
            async getExecutionContext() {
                return { hasActiveDocument: true, selectionCount: 1 };
            },
            async runCommand(request) {
                receivedRequest = request;
                return { success: true, message: 'ran host command' };
            }
        },
        UIFeedback: feedback,
        runtimeState
    });

    const result = await runner.runManifest({
        id: 'alpha_command',
        title: 'Alpha Command',
        enabled: true,
        status: 'ready',
        requiresDocument: true,
        requiresSelection: true,
        successMessage: ''
    });

    assert.equal(result.success, true);
    assert.deepEqual(receivedRequest, {
        id: 'alpha_command',
        payload: {}
    });
    assert.equal(runtimeState.lastResult, result);
    assert.equal(feedback.messages[0].type, 'success');
});

test('createCommandRunner shows a warning toast when the host command is cancelled', async () => {
    const feedback = createFeedbackStub();
    const runtimeState = {};
    const runner = createCommandRunner({
        hostFacade: {
            async getExecutionContext() {
                return { hasActiveDocument: true, selectionCount: 0 };
            },
            async runCommand() {
                return {
                    success: false,
                    message: 'Camera Marks cancelled.',
                    errorCode: 'CAMERA_MARKS_CANCELLED'
                };
            }
        },
        UIFeedback: feedback,
        runtimeState
    });

    const result = await runner.runManifest({
        id: 'add_camera_marks',
        title: 'Add Camera Marks',
        enabled: true,
        status: 'ready',
        requiresDocument: true,
        requiresSelection: false,
        successMessage: ''
    });

    assert.equal(result.success, false);
    assert.equal(result.errorCode, 'CAMERA_MARKS_CANCELLED');
    assert.equal(feedback.messages[0].type, 'warning');
});

test('createCommandRunner reloads and retries once when host runtime is stale for a new command', async () => {
    const feedback = createFeedbackStub();
    let reloadCount = 0;
    const runtimeState = {
        services: {
            async reloadAndSyncHostRuntime() {
                reloadCount += 1;
            }
        }
    };
    const requests = [];
    let runCount = 0;
    const runner = createCommandRunner({
        hostFacade: {
            async getExecutionContext() {
                return { hasActiveDocument: true, selectionCount: 1 };
            },
            async runCommand(request) {
                requests.push(request);
                runCount += 1;

                if (runCount === 1) {
                    return {
                        success: false,
                        message: 'Unknown toolkit command: rasterize_bitmap_300_transparent',
                        errorCode: 'UNKNOWN_TOOLKIT_COMMAND',
                        data: null
                    };
                }

                return {
                    success: true,
                    message: 'ran host command after sync',
                    errorCode: null,
                    data: {
                        recovered: true
                    }
                };
            }
        },
        UIFeedback: feedback,
        runtimeState
    });

    const result = await runner.runManifest({
        id: 'rasterize_bitmap_300_transparent',
        title: 'Rasterize Bitmap',
        enabled: true,
        status: 'ready',
        requiresDocument: true,
        requiresSelection: true,
        successMessage: ''
    });

    assert.equal(reloadCount, 1);
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[0], {
        id: 'rasterize_bitmap_300_transparent',
        payload: {}
    });
    assert.deepEqual(requests[1], {
        id: 'rasterize_bitmap_300_transparent',
        payload: {}
    });
    assert.equal(result.success, true);
    assert.deepEqual(result.data, { recovered: true });
    assert.equal(runtimeState.lastResult, result);
    assert.equal(feedback.messages[0].type, 'success');
});

test('createCommandRunner surfaces a sync failure instead of leaving the stale unknown-command result', async () => {
    const feedback = createFeedbackStub();
    const runtimeState = {
        services: {
            async reloadAndSyncHostRuntime() {
                throw new Error('Toolkit host runtime reload failed');
            }
        }
    };
    let runCount = 0;
    const runner = createCommandRunner({
        hostFacade: {
            async getExecutionContext() {
                return { hasActiveDocument: true, selectionCount: 1 };
            },
            async runCommand() {
                runCount += 1;
                return {
                    success: false,
                    message: 'Unknown toolkit command: rasterize_bitmap_300_transparent',
                    errorCode: 'UNKNOWN_TOOLKIT_COMMAND',
                    data: null
                };
            }
        },
        UIFeedback: feedback,
        runtimeState
    });

    const result = await runner.runManifest({
        id: 'rasterize_bitmap_300_transparent',
        title: 'Rasterize Bitmap',
        enabled: true,
        status: 'ready',
        requiresDocument: true,
        requiresSelection: true,
        successMessage: ''
    });

    assert.equal(runCount, 1);
    assert.equal(result.success, false);
    assert.equal(result.errorCode, 'TOOLKIT_HOST_RUNTIME_SYNC_FAILED');
    assert.equal(result.message, 'Toolkit host runtime reload failed');
    assert.equal(runtimeState.lastResult, result);
    assert.equal(feedback.messages[0].type, 'error');
});
