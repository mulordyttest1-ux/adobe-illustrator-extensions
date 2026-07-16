if (!$.global.__TOOLKIT_STEP_REPEAT__) {
    throw new Error("Step Repeat namespace was not initialized.");
}

var StepRepeat = $.global.__TOOLKIT_STEP_REPEAT__;

StepRepeat.createCellGroupName = function (index) {
    return StepRepeat.cellGroupPrefix + String(index + 1);
};

StepRepeat.executeStrategy = function (doc, sourceItems, request) {
    var outputContainer = StepRepeat.resolveOutputContainer(doc, sourceItems);
    var stage = null;
    var outputGroup = null;
    var plan;
    var sourceBounds;
    var rowIndex;
    var colIndex;
    var cellIndex = 0;
    var cellGroup;
    var finalBounds;

    try {
        sourceBounds = StepRepeat.getCombinedGeometricBounds(sourceItems);
        plan = StepRepeat.buildGridPlan(doc, sourceBounds, request);
        stage = StepRepeat.createTemplateStage(doc, sourceItems);
        StepRepeat.applyOrientationToTemplate(stage.templateGroup, plan);

        outputGroup = outputContainer.groupItems.add();
        outputGroup.name = StepRepeat.outputGroupName;

        for (rowIndex = 0; rowIndex < plan.rows; rowIndex += 1) {
            for (colIndex = 0; colIndex < plan.cols; colIndex += 1) {
                cellGroup = stage.templateGroup.duplicate(outputGroup, ElementPlacement.PLACEATEND);
                cellGroup.name = StepRepeat.createCellGroupName(cellIndex);
                StepRepeat.translateItemToCenter(cellGroup, StepRepeat.getTargetCenter(plan, rowIndex, colIndex));
                cellIndex += 1;
            }
        }

        StepRepeat.removeSourceItems(sourceItems);
        StepRepeat.cleanupStage(stage);
        stage = null;

        finalBounds = StepRepeat.getItemGeometricBounds(outputGroup);
        StepRepeat.selectOutputGroup(doc, outputGroup);

        return {
            mode: "plain",
            gapMm: request.gapMm,
            marginMm: request.marginMm,
            autoRotate90: request.autoRotate90,
            rotationApplied: plan.rotationApplied,
            rows: plan.rows,
            cols: plan.cols,
            count: plan.count,
            activeArtboardIndex: plan.activeArtboardIndex,
            cellBoundsBefore: StepRepeat.cloneBounds(plan.cellBoundsBefore),
            gridBoundsAfter: finalBounds
        };
    } catch (error) {
        StepRepeat.cleanupOutputGroup(outputGroup);
        StepRepeat.cleanupStage(stage);
        throw error;
    }
};
