/*
    MODULE: COLOR
    Responsibility: Convert non-light artwork to K100.
    Interface: run(item: PageItem | Array<PageItem>)
*/

(function () {
    var Module = {
        id: "color",
        version: "1.3.0",

        run: function (item) {
            $.writeln("  [COLOR] Started K100 conversion...");
            this.convertToK100(item);
            $.writeln("  [COLOR] Finished.");
        },

        convertToK100: function (item) {
            var roots = this._normalizeRoots(item);
            var state = {
                targets: [],
                scopeIndexes: [],
                metrics: this._createMetrics()
            };
            var i;
            var scopeRoot;

            for (i = 0; i < roots.length; i++) {
                scopeRoot = this._resolveScopeRoot(roots[i]);
                this._collectTargets(roots[i], scopeRoot, state);
            }

            this._applyTargets(state.targets, this._createBlack());
            this._lastMetrics = state.metrics;
        },

        _createMetrics: function () {
            return {
                scopeScanCount: 0,
                scannedPathCount: 0,
                retainedPathCount: 0,
                emptyCompoundResolveCount: 0
            };
        },

        _createBlack: function () {
            var black = new CMYKColor();
            black.cyan = 0;
            black.magenta = 0;
            black.yellow = 0;
            black.black = 100;
            return black;
        },

        _normalizeRoots: function (item) {
            if (!item) {
                return [];
            }

            if (item instanceof Array) {
                return item;
            }

            return [item];
        },

        _resolveScopeRoot: function (item) {
            return item;
        },

        _collectTargets: function (obj, scopeRoot, state) {
            var pageItems;
            var i;

            if (!this._isProcessableObject(obj)) {
                return;
            }

            if (obj.typename === "GroupItem") {
                pageItems = obj.pageItems;
                for (i = 0; i < pageItems.length; i++) {
                    this._collectTargets(pageItems[i], scopeRoot, state);
                }
                return;
            }

            if (obj.typename === "CompoundPathItem") {
                this._collectCompoundTargets(obj, scopeRoot, state);
                return;
            }

            if (this._isTextFrame(obj)) {
                this._pushTextFrame(obj, state);
                return;
            }

            if (this._isPathItem(obj)) {
                this._pushPath(obj, state);
            }
        },

        _collectCompoundTargets: function (compound, scopeRoot, state) {
            var pathItems = null;
            var paths;
            var i;

            try {
                pathItems = compound.pathItems;
            } catch (pathItemsError) {}

            if (pathItems && pathItems.length) {
                for (i = 0; i < pathItems.length; i++) {
                    this._pushPath(pathItems[i], state);
                }
                return;
            }

            paths = this._findIndexedCompoundPaths(
                this._getScopeIndex(scopeRoot, state),
                compound
            );

            if (paths.length) {
                state.metrics.emptyCompoundResolveCount += 1;
            }

            for (i = 0; i < paths.length; i++) {
                this._pushPath(paths[i], state);
            }
        },

        _getScopeIndex: function (scopeRoot, state) {
            var scopeIndexes = state.scopeIndexes;
            var i;
            var entry;

            for (i = 0; i < scopeIndexes.length; i++) {
                if (scopeIndexes[i].scopeRoot === scopeRoot) {
                    return scopeIndexes[i].index;
                }
            }

            entry = {
                scopeRoot: scopeRoot,
                index: this._buildScopeIndex(scopeRoot, state.metrics)
            };
            scopeIndexes.push(entry);
            return entry.index;
        },

        _buildScopeIndex: function (scopeRoot, metrics) {
            var doc = null;
            var pathItems;
            var index = { compounds: [], loosePaths: [] };
            var pathItem;
            var scopeInfo;
            var i;

            try {
                doc = app.activeDocument;
            } catch (docError) {
                doc = null;
            }

            if (!doc || !doc.pathItems) {
                return index;
            }

            metrics.scopeScanCount += 1;
            pathItems = doc.pathItems;

            for (i = 0; i < pathItems.length; i++) {
                pathItem = pathItems[i];
                metrics.scannedPathCount += 1;

                if (!this._isProcessableObject(pathItem)) {
                    continue;
                }

                if (!this._pathHasDrawableSurface(pathItem)) {
                    continue;
                }

                scopeInfo = this._resolveScopedPath(pathItem, scopeRoot);
                if (!scopeInfo.inScope) {
                    continue;
                }

                if (!this._pathShouldConvert(pathItem)) {
                    continue;
                }

                metrics.retainedPathCount += 1;

                if (scopeInfo.compound) {
                    this._indexCompoundPath(index, scopeInfo.compound, pathItem);
                } else {
                    index.loosePaths.push(pathItem);
                }
            }

            return index;
        },

        _indexCompoundPath: function (index, compound, pathItem) {
            var entries = index.compounds;
            var i;

            for (i = 0; i < entries.length; i++) {
                if (entries[i].compound === compound) {
                    entries[i].paths.push(pathItem);
                    return;
                }
            }

            entries.push({
                compound: compound,
                paths: [pathItem]
            });
        },

        _findIndexedCompoundPaths: function (index, compound) {
            var entries = index.compounds;
            var i;

            for (i = 0; i < entries.length; i++) {
                if (entries[i].compound === compound) {
                    return entries[i].paths;
                }
            }

            return [];
        },

        _resolveScopedPath: function (pathItem, scopeRoot) {
            var current = null;
            var compound = null;

            try {
                current = pathItem.parent;
            } catch (parentError) {
                current = null;
            }

            while (current) {
                if (!compound && current.typename === "CompoundPathItem") {
                    compound = current;
                }

                if (current === scopeRoot) {
                    return {
                        inScope: true,
                        compound: compound
                    };
                }

                try {
                    current = current.parent;
                } catch (nextParentError) {
                    current = null;
                }
            }

            return {
                inScope: false,
                compound: null
            };
        },

        _pushPath: function (pathItem, state) {
            if (!this._isPathItem(pathItem)) {
                return;
            }

            if (!this._pathShouldConvert(pathItem)) {
                return;
            }
            state.targets.push({
                type: "path",
                item: pathItem
            });
        },

        _pushTextFrame: function (textFrame, state) {
            if (!this._isTextFrame(textFrame)) {
                return;
            }

            if (!this._textShouldConvert(textFrame)) {
                return;
            }

            state.targets.push({
                type: "text",
                item: textFrame
            });
        },

        _applyTargets: function (targets, black) {
            var target;
            var i;

            for (i = 0; i < targets.length; i++) {
                target = targets[i];

                if (!target || !target.item) {
                    continue;
                }

                if (target.type === "text") {
                    this._applyTextTarget(target.item, black);
                    continue;
                }

                this._applyPathTarget(target.item, black);
            }
        },

        _applyPathTarget: function (pathItem, black) {
            try {
                if (pathItem.filled && !this.isLightColor(pathItem.fillColor)) {
                    pathItem.fillColor = black;
                }

                if (pathItem.stroked && !this.isLightColor(pathItem.strokeColor)) {
                    pathItem.strokeColor = black;
                }
            } catch (applyError) {}
        },

        _applyTextTarget: function (textFrame, black) {
            var attributes = this._getTextAttributes(textFrame);

            if (!attributes) {
                return;
            }

            try {
                if (!this.isLightColor(attributes.fillColor)) {
                    attributes.fillColor = black;
                }
            } catch (fillError) {}

            try {
                if (!this.isLightColor(attributes.strokeColor)) {
                    attributes.strokeColor = black;
                }
            } catch (strokeError) {}
        },

        _isProcessableObject: function (obj) {
            try {
                if (!obj) {
                    return false;
                }

                if (obj.locked || obj.hidden) {
                    return false;
                }
            } catch (stateError) {
                return false;
            }

            return true;
        },

        _isPathItem: function (obj) {
            return !!(obj && obj.typename === "PathItem");
        },

        _isTextFrame: function (obj) {
            return !!(obj && obj.typename === "TextFrame");
        },

        _pathHasDrawableSurface: function (pathItem) {
            try {
                return !!(pathItem && (pathItem.filled || pathItem.stroked));
            } catch (surfaceError) {
                return false;
            }
        },

        _pathShouldConvert: function (pathItem) {
            var canConvertFill = false;
            var canConvertStroke = false;

            try {
                canConvertFill = !!(pathItem.filled && !this.isLightColor(pathItem.fillColor));
            } catch (fillError) {
                canConvertFill = false;
            }

            try {
                canConvertStroke = !!(pathItem.stroked && !this.isLightColor(pathItem.strokeColor));
            } catch (strokeError) {
                canConvertStroke = false;
            }

            return canConvertFill || canConvertStroke;
        },

        _textShouldConvert: function (textFrame) {
            var attributes = this._getTextAttributes(textFrame);
            var canConvertFill = false;
            var canConvertStroke = false;

            if (!attributes) {
                return false;
            }

            try {
                canConvertFill = !this.isLightColor(attributes.fillColor);
            } catch (fillError) {
                canConvertFill = false;
            }

            try {
                canConvertStroke = !this.isLightColor(attributes.strokeColor);
            } catch (strokeError) {
                canConvertStroke = false;
            }

            return canConvertFill || canConvertStroke;
        },

        _getTextAttributes: function (textFrame) {
            var textRange = null;

            try {
                textRange = textFrame.textRange;
            } catch (textRangeError) {
                textRange = null;
            }

            if (!textRange) {
                return null;
            }

            try {
                return textRange.characterAttributes;
            } catch (attributesError) {
                return null;
            }
        },

        isLightColor: function (color) {
            if (!color) {
                return true;
            }

            if (color.typename === "CMYKColor") {
                return (color.cyan + color.magenta + color.yellow + color.black) < 10;
            }

            if (color.typename === "GrayColor") {
                return color.gray < 10;
            }

            if (color.typename === "RGBColor") {
                return (color.red + color.green + color.blue) > 735;
            }

            if (color.typename === "SpotColor") {
                return color.tint < 10;
            }

            return true;
        }
    };

    if (typeof $._imposition !== "undefined" && $._imposition.registerModule) {
        $._imposition.registerModule("color", Module);
    }
})();
