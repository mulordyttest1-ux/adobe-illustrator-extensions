const { runTextSmokeSuite } = require('./text_smoke_suite.cjs');
const { runCutWorkflowSmokeSuite } = require('./cut_workflow_smoke_suite.cjs');
const { runSwapSmokeSuite } = require('./swap_smoke_suite.cjs');
const { runRecolorSmokeSuite } = require('./recolor_smoke_suite.cjs');
const { runRasterizeSmokeSuite } = require('./rasterize_smoke_suite.cjs');
const { runStepRepeatSmokeSuite } = require('./step_repeat_smoke_suite.cjs');
const { runCameraMarksSmokeSuite } = require('./camera_marks_smoke_suite.cjs');

const toolkitModuleSmokeSuites = [
    { id: 'text', run: runTextSmokeSuite },
    { id: 'cut_workflow', run: runCutWorkflowSmokeSuite },
    { id: 'swap', run: runSwapSmokeSuite },
    { id: 'recolor', run: runRecolorSmokeSuite },
    { id: 'rasterize', run: runRasterizeSmokeSuite },
    { id: 'step_repeat', run: runStepRepeatSmokeSuite },
    { id: 'camera_marks', run: runCameraMarksSmokeSuite }
];

async function runToolkitModuleSmokeSuites(context) {
    if (!context || typeof context.closeSmokeFixtureDocuments !== 'function') {
        throw new Error('Toolkit smoke suite context requires closeSmokeFixtureDocuments.');
    }
    for (const suite of toolkitModuleSmokeSuites) {
        await suite.run(context);
    }
}

module.exports = { runToolkitModuleSmokeSuites, toolkitModuleSmokeSuites };
