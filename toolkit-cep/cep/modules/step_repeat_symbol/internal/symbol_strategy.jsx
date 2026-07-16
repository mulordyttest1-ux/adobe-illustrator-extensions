if (!$.global.__TOOLKIT_STEP_REPEAT_SYMBOL__) {
    throw new Error("Step Repeat Symbol namespace was not initialized.");
}

var StepRepeat = $.global.__TOOLKIT_STEP_REPEAT_SYMBOL__;

StepRepeat.createSymbolItemName = function (index) {
    return StepRepeat.symbolItemPrefix + String(index + 1);
};

StepRepeat.createSymbolName = function (doc) {
    return "STEP_REPEAT_SYMBOL_DEF_" + String(doc.symbols.length + 1);
};

StepRepeat.executeStrategy = function (doc, sourceItems, request) {
    var outputContainer = StepRepeat.resolveOutputContainer(doc, sourceItems);
    var stage = null;
    var outputGroup = null;
    var plan;
    var sourceBounds;
    var rowIndex;
    var colIndex;
    var symbolItemIndex = 0;
    var finalBounds;
    var symbolDefinition;
    var symbolItem;

    try {
        sourceBounds = StepRepeat.getCombinedGeometricBounds(sourceItems);
        plan = StepRepeat.buildGridPlan(doc, sourceBounds, request);
        stage = StepRepeat.createTemplateStage(doc, sourceItems);
        StepRepeat.applyOrientationToTemplate(stage.templateGroup, plan);

        try {
            symbolDefinition = doc.symbols.add(stage.templateGroup);
            symbolDefinition.name = StepRepeat.createSymbolName(doc);
        } catch (error) {
            throw StepRepeat.createModuleError(
                "STEP_REPEAT_FAILED",
                "The selection could not be converted into a symbol for Step Repeat."
            );
        }

        outputGroup = outputContainer.groupItems.add();
        outputGroup.name = StepRepeat.outputGroupName;

        for (rowIndex = 0; rowIndex < plan.rows; rowIndex += 1) {
            for (colIndex = 0; colIndex < plan.cols; colIndex += 1) {
                symbolItem = doc.symbolItems.add(symbolDefinition);
                symbolItem.move(outputGroup, ElementPlacement.PLACEATEND);
                symbolItem.name = StepRepeat.createSymbolItemName(symbolItemIndex);
                StepRepeat.translateItemToCenter(symbolItem, StepRepeat.getTargetCenter(plan, rowIndex, colIndex));
                symbolItemIndex += 1;
            }
        }

        StepRepeat.removeSourceItems(sourceItems);
        StepRepeat.cleanupStage(stage);
        stage = null;

        finalBounds = StepRepeat.getItemGeometricBounds(outputGroup);
        StepRepeat.selectOutputGroup(doc, outputGroup);

        return {
            mode: "symbol",
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
