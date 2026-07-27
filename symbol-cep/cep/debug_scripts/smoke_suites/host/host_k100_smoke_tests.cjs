function registerHostK100SmokeTests(context) {
    const {
        runner,
        cleanupSmokeArtifact,
        cleanupSmokeOutput,
        decodeBase64Json,
        makeHostScenarioExpression,
        makePresetRoundtripExpression
    } = context;

    runner.addTest(
        'Host converts dark compound artwork to K100 while preserving light compound artwork',
        makeHostScenarioExpression('k100_compound'),
        async (payload) => {
            const result = decodeBase64Json(payload);
    
            const isK100Color = (color) => (
                !!color &&
                color.typename === 'CMYKColor' &&
                color.cyan === 0 &&
                color.magenta === 0 &&
                color.yellow === 0 &&
                color.black === 100
            );
    
            const assertPathSetExists = (paths, label) => {
                if (!Array.isArray(paths) || !paths.length) {
                    throw new Error(`Expected path snapshots for ${label}: ${JSON.stringify(result)}`);
                }
            };
    
            const assertAllK100 = (paths, label) => {
                let sawConvertedSurface = false;
                assertPathSetExists(paths, label);
    
                paths.forEach((path) => {
                    if (path.filled) {
                        sawConvertedSurface = true;
                        if (!isK100Color(path.fillColor)) {
                            throw new Error(`Expected K100 fill for ${label}: ${JSON.stringify(path)}`);
                        }
                    }
                    if (path.stroked) {
                        sawConvertedSurface = true;
                        if (!isK100Color(path.strokeColor)) {
                            throw new Error(`Expected K100 stroke for ${label}: ${JSON.stringify(path)}`);
                        }
                    }
                });
    
                if (!sawConvertedSurface) {
                    throw new Error(`Expected at least one filled or stroked surface for ${label}: ${JSON.stringify(paths)}`);
                }
            };
    
            const pathSetChanged = (beforePaths, afterPaths) => JSON.stringify(beforePaths) !== JSON.stringify(afterPaths);
    
            if (!result.success) {
                throw new Error(`K100 compound scenario failed: ${JSON.stringify(result)}`);
            }
    
            assertPathSetExists(result.before.darkCompound, 'darkCompound before');
            assertPathSetExists(result.before.lightCompound, 'lightCompound before');
            assertPathSetExists(result.before.groupedCompound, 'groupedCompound before');
            assertPathSetExists(result.before.regularPath, 'regularPath before');
    
            if (!pathSetChanged(result.before.darkCompound, result.after.darkCompound)) {
                throw new Error(`Dark compound did not change: ${JSON.stringify(result)}`);
            }
            if (!pathSetChanged(result.before.groupedCompound, result.after.groupedCompound)) {
                throw new Error(`Grouped compound did not change: ${JSON.stringify(result)}`);
            }
            if (!pathSetChanged(result.before.regularPath, result.after.regularPath)) {
                throw new Error(`Regular path did not change: ${JSON.stringify(result)}`);
            }
    
            assertAllK100(result.after.darkCompound, 'darkCompound');
            assertAllK100(result.after.groupedCompound, 'groupedCompound');
            assertAllK100(result.after.regularPath, 'regularPath');
    
            if (pathSetChanged(result.before.lightCompound, result.after.lightCompound)) {
                throw new Error(`Light compound should remain unchanged: ${JSON.stringify(result)}`);
            }
    
            if (!result.metrics) {
                throw new Error(`Missing K100 metrics: ${JSON.stringify(result)}`);
            }
            if (typeof result.metrics.scopeScanCount !== 'number' || result.metrics.scopeScanCount < 0 || result.metrics.scopeScanCount > 1) {
                throw new Error(`Expected at most one scope scan for K100 scenario: ${JSON.stringify(result)}`);
            }
            if (typeof result.metrics.scannedPathCount !== 'number' || result.metrics.scannedPathCount < 0) {
                throw new Error(`Expected scannedPathCount >= 0: ${JSON.stringify(result)}`);
            }
            if (typeof result.metrics.retainedPathCount !== 'number' || result.metrics.retainedPathCount < 0) {
                throw new Error(`Expected retainedPathCount >= 0: ${JSON.stringify(result)}`);
            }
            if (typeof result.metrics.emptyCompoundResolveCount !== 'number' || result.metrics.emptyCompoundResolveCount < 0) {
                throw new Error(`Expected emptyCompoundResolveCount >= 0: ${JSON.stringify(result)}`);
            }
            if (result.metrics.emptyCompoundResolveCount > 0 && result.metrics.scopeScanCount !== 1) {
                throw new Error(`Expected exactly one scope scan when empty compounds are resolved from the index: ${JSON.stringify(result)}`);
            }
        }
    );

    runner.addTest(
        'Host outlines text before K100 so text appearance survives the fast branch',
        makeHostScenarioExpression('k100_pipeline_order'),
        async (payload) => {
            const result = decodeBase64Json(payload);
    
            const isK100Color = (color) => (
                !!color &&
                color.typename === 'CMYKColor' &&
                Math.abs(Number(color.cyan || 0)) < 0.01 &&
                Math.abs(Number(color.magenta || 0)) < 0.01 &&
                Math.abs(Number(color.yellow || 0)) < 0.01 &&
                Math.abs(Number(color.black || 0) - 100) < 0.01
            );
    
            const assertPathSetExists = (paths, label) => {
                if (!Array.isArray(paths) || !paths.length) {
                    throw new Error(`Expected path snapshots for ${label}: ${JSON.stringify(result)}`);
                }
            };
    
            const assertAllK100 = (paths, label) => {
                let sawConvertedSurface = false;
                assertPathSetExists(paths, label);
    
                paths.forEach((path) => {
                    if (path.filled) {
                        sawConvertedSurface = true;
                        if (!isK100Color(path.fillColor)) {
                            throw new Error(`Expected K100 fill for ${label}: ${JSON.stringify(path)}`);
                        }
                    }
                    if (path.stroked) {
                        sawConvertedSurface = true;
                        if (!isK100Color(path.strokeColor)) {
                            throw new Error(`Expected K100 stroke for ${label}: ${JSON.stringify(path)}`);
                        }
                    }
                });
    
                if (!sawConvertedSurface) {
                    throw new Error(`Expected at least one filled or stroked surface for ${label}: ${JSON.stringify(paths)}`);
                }
            };
    
            const assertNoneK100 = (paths, label) => {
                assertPathSetExists(paths, label);
    
                paths.forEach((path) => {
                    if (path.filled && isK100Color(path.fillColor)) {
                        throw new Error(`Expected non-K100 fill for ${label}: ${JSON.stringify(path)}`);
                    }
                    if (path.stroked && isK100Color(path.strokeColor)) {
                        throw new Error(`Expected non-K100 stroke for ${label}: ${JSON.stringify(path)}`);
                    }
                });
            };
    
            const pathSetChanged = (beforePaths, afterPaths) => JSON.stringify(beforePaths) !== JSON.stringify(afterPaths);
    
            if (!result.success) {
                throw new Error(`K100 pipeline-order scenario failed: ${JSON.stringify(result)}`);
            }
            if (JSON.stringify(result.stageOrder) !== JSON.stringify(['outlineTextOnly', 'k100', 'cleanup'])) {
                throw new Error(`Unexpected stage order for K100 pipeline scenario: ${JSON.stringify(result)}`);
            }
            if (typeof result.beforeOutlinePathCount !== 'number' || result.beforeOutlinePathCount < 0) {
                throw new Error(`Expected beforeOutlinePathCount >= 0: ${JSON.stringify(result)}`);
            }
            if (typeof result.k100InputPathCount !== 'number' || result.k100InputPathCount <= result.beforeOutlinePathCount) {
                throw new Error(`Expected outlineTextOnly to increase K100 input complexity: ${JSON.stringify(result)}`);
            }
            if (typeof result.postCleanupPathCount !== 'number' || result.postCleanupPathCount < result.k100InputPathCount) {
                throw new Error(`Expected full cleanup to preserve or expand geometry after K100 input: ${JSON.stringify(result)}`);
            }
            if (result.postCleanupPathCount <= result.beforeOutlinePathCount) {
                throw new Error(`Expected text-only pre-cleanup to keep K100 input smaller than final cleanup geometry: ${JSON.stringify(result)}`);
            }
    
            assertPathSetExists(result.afterOutlineTextPaths, 'outlined text before K100');
            assertAllK100(result.afterK100.darkCompound, 'pipeline darkCompound');
            assertAllK100(result.afterK100.groupedCompound, 'pipeline groupedCompound');
            assertAllK100(result.afterK100.regularPath, 'pipeline regularPath');
            assertAllK100(result.afterK100.outlinedTextPaths, 'outlined text after K100');
            assertNoneK100(result.afterK100.lightCompound, 'pipeline lightCompound');
    
            if (pathSetChanged(result.before.lightCompound, result.afterK100.lightCompound)) {
                throw new Error(`Light compound should remain unchanged in fast K100 branch: ${JSON.stringify(result)}`);
            }
    
            if (Array.isArray(result.afterCleanupTextPaths) && result.afterCleanupTextPaths.length) {
                assertAllK100(result.afterCleanupTextPaths, 'outlined text after cleanup');
            }
    
            if (!Array.isArray(result.afterCleanupIssues)) {
                throw new Error(`Missing final post-cleanup issue summary: ${JSON.stringify(result)}`);
            }
            if (result.afterCleanupIssues.length > 0) {
                throw new Error(`Found non-light post-cleanup surfaces that are not K100: ${JSON.stringify(result)}`);
            }
    
            if (!result.metrics) {
                throw new Error(`Missing K100 metrics for pipeline-order scenario: ${JSON.stringify(result)}`);
            }
            if (typeof result.metrics.scopeScanCount !== 'number' || result.metrics.scopeScanCount < 0 || result.metrics.scopeScanCount > 1) {
                throw new Error(`Expected at most one scope scan for pipeline-order scenario: ${JSON.stringify(result)}`);
            }
        }
    );
}

module.exports = { registerHostK100SmokeTests };
