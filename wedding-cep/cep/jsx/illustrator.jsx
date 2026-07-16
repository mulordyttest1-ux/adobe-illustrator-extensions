#target illustrator

// =========================================================
// 1. UTILS (BASE64 & JSON)
// =========================================================
#include "utils.jsx"
#include "textFrameIds.jsx"
#include "hostValidation.jsx"

// Helper gửi kết quả
function sendResult(data) {
    return Base64.encode(JSON.stringify(data));
}

// =========================================================
// 3. ADAPTERS (INLINED FOR ROBUSTNESS)
// =========================================================

// --- MetadataAdapter.jsx ---
(function () {
    var Meta = {};
    function getTokens(configTokens) {
        if (configTokens) return configTokens;
        return { NEWLINE: "###META_NEWLINE###", GHOST: "###META_GHOST###" };
    }
    Meta.getState = function (item, configTokens, ghostChar) {
        if (!item || !item.note) return null;
        var TOKENS = getTokens(configTokens);
        var C_GST = ghostChar || "\u200B";
        try {
            var safeNote = item.note.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
            var data = eval('(' + safeNote + ')');
            if (data && data.type === "stateful") {
                if (data.keys) {
                    if (data.mappings) {
                        for (var i = 0; i < data.mappings.length; i++) {
                            var m = data.mappings[i];
                            if (m.val && typeof m.val === "string") {
                                var s = m.val.replace(new RegExp(TOKENS.NEWLINE, 'g'), String.fromCharCode(13));
                                s = s.replace(new RegExp(TOKENS.GHOST, 'g'), C_GST);
                                m.val = s;
                            } else if (m.val === "") { m.val = ""; }
                        }
                    }
                    return data;
                }
                if (data.mappings) {
                    var extractedKeys = [];
                    for (var i = 0; i < data.mappings.length; i++) {
                        extractedKeys.push(data.mappings[i].key);
                        var m = data.mappings[i];
                        if (m.val && typeof m.val === "string") {
                            var s = m.val.replace(new RegExp(TOKENS.NEWLINE, 'g'), String.fromCharCode(13));
                            s = s.replace(new RegExp(TOKENS.GHOST, 'g'), C_GST);
                            m.val = s;
                        } else if (m.val === "") { m.val = ""; }
                    }
                    data.keys = extractedKeys;
                    return data;
                }
            }
        } catch (e) { return null; }
        return null;
    };
    Meta.saveKeys = function (item, keys) {
        if (!item || !keys) return false;
        try {
            var data = {
                type: "stateful",
                keys: keys,
                mappings: []
            };
            item.note = JSON.stringify(data);
            return true;
        } catch (e) { return false; }
    };
    if (typeof $.global !== 'undefined') { $.global.MetadataAdapter = Meta; }
})();

// --- DOMHelper.jsx ---
(function () {
    var DOMHelper = {};
    DOMHelper.collectTextFrames = function (items) {
        var results = [];
        if (!items) return results;
        var list = (items.length !== undefined) ? items : [items];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            try {
                if (item.typename === "TextFrame") {
                    results.push(item);
                } else if (item.typename === "GroupItem") {
                    results = results.concat(DOMHelper.collectTextFrames(item.pageItems));
                }
            } catch (e) { continue; }
        }
        return results;
    };
    if (typeof $.global !== 'undefined') { $.global.DOMHelper = DOMHelper; }
})();

// --- TextFrameManipulator.jsx ---
(function () {
    var Manipulator = {};
    Manipulator.replaceWithMarkers = function (item, text) {
        try {
            if (!item) return false;
            item.contents = "\u200B" + String(text) + "\u200B";
            return true;
        } catch (e) { return false; }
    };
    if (typeof $.global !== 'undefined') { $.global.TextFrameManipulator = Manipulator; }
})();

// =========================================================
// 4. ILLUSTRATOR BRIDGE
// =========================================================

function collectTextFramesInItems(items) {
    var collected = [];
    if (!items) return collected;

    for (var i = 0; i < items.length; i++) {
        var obj = items[i];
        if (obj.typename === "TextFrame") {
            collected.push(obj);
        } else if (obj.typename === "GroupItem") {
            collected = collected.concat(collectTextFramesInItems(obj.pageItems));
        }
    }

    return collected;
}

function buildStableFrameMap(frames) {
    var map = {};
    var ids = [];

    for (var i = 0; i < frames.length; i++) {
        var frameId = getStableTextFrameId(frames[i], i);
        map[frameId] = frames[i];
        ids.push(frameId);
    }

    return {
        map: map,
        ids: ids
    };
}

function resolveSelectFramesPayload(payloadJson) {
    var payload = eval('(' + payloadJson + ')');

    if (payload && payload.length !== undefined && typeof payload !== "string") {
        return {
            ids: payload,
            source: "live-selection",
            sessionId: null
        };
    }

    payload = payload || {};
    return {
        ids: payload.ids || [],
        source: payload.source || "live-selection",
        sessionId: payload.sessionId || null
    };
}

function selectOnlyItems(doc, items) {
    var validItems = [];
    doc.selection = null;

    for (var i = 0; i < items.length; i++) {
        try {
            items[i].selected = true;
            validItems.push(items[i]);
        } catch (e) { }
    }

    if (validItems.length > 0) {
        doc.selection = validItems;
    }

    try { app.redraw(); } catch (e) { }
    return validItems.length;
}

function resolveBaselineOption(name) {
    try {
        if (typeof FontBaselineOption === "undefined") return null;
        if (name === "superscript") return FontBaselineOption.SUPERSCRIPT;
        return FontBaselineOption.NORMALBASELINE;
    } catch (e) {
        return null;
    }
}

function applyBaselineRanges(item, ranges) {
    if (!item || !ranges || ranges.length === 0) return;

    var chars = item.characters;
    for (var i = 0; i < ranges.length; i++) {
        var r = ranges[i];
        var start = parseInt(r.start, 10);
        var end = parseInt(r.end, 10);
        if (isNaN(start) || isNaN(end) || end <= start) continue;

        var baselineName = r.baseline || r.baselinePosition || "normal";
        var baselineOption = resolveBaselineOption(baselineName);
        if (!baselineOption) continue;

        for (var c = start; c < end && c < chars.length; c++) {
            if (c >= 0) {
                try { chars[c].characterAttributes.baselinePosition = baselineOption; } catch (e) { }
            }
        }
    }
}

function offsetStyleRanges(ranges, offset) {
    var result = [];
    if (!ranges) return result;

    for (var i = 0; i < ranges.length; i++) {
        var r = ranges[i];
        result.push({
            start: offset + parseInt(r.start, 10),
            end: offset + parseInt(r.end, 10),
            baseline: r.baseline || r.baselinePosition || "normal"
        });
    }

    return result;
}

$.global.IllustratorBridge = {
    ping: function () {
        return sendResult({ success: true, message: "Pong" });
    },

    // --- SCHEMA INJECTION (PHASE 1) ---
    readSelectionObjects: function () {
        try {
            if (app.documents.length === 0) return sendResult({ success: false, error: "No document open" });
            var doc = app.activeDocument;

            if (!doc.selection || doc.selection.length === 0) {
                return sendResult({ success: true, data: [] });
            }
            var frames = collectTextFramesInItems(doc.selection);
            if (frames.length === 0) {
                return sendResult({ success: true, data: [] });
            }

            var results = [];
            for (var i = 0; i < frames.length; i++) {
                var item = frames[i];
                try {
                    var stableUuid = getStableTextFrameId(item, i);

                    results.push({
                        id: stableUuid, // Use UUID instead of index
                        text: item.contents,
                        note: item.note || '',
                        uuid: stableUuid,
                        top: item.top,
                        left: item.left
                    });
                } catch (e) { }
            }
            return sendResult({
                success: true,
                data: results
            });
        } catch (e) {
            return sendResult({ success: false, error: e.message });
        }
    },

    selectFramesById: function (payloadJson) {
        try {
            if (app.documents.length === 0) {
                return sendResult({ success: false, error: "No document open", errorCode: "sessionExpired" });
            }
            var doc = app.activeDocument;
            var payload = resolveSelectFramesPayload(payloadJson);
            var ids = payload.ids;
            if (!ids || ids.length === 0) return sendResult({ success: true, selected: 0 });

            var frameMap = buildStableFrameMap(collectTextFramesInItems(doc.selection || [])).map;
            var toSelect = [];
            for (var i = 0; i < ids.length; i++) {
                var match = frameMap[ids[i]];
                if (match) toSelect.push(match);
            }

            return sendResult({
                success: true,
                selected: selectOnlyItems(doc, toSelect),
                source: "live-selection"
            });
        } catch (e) {
            return sendResult({ success: false, error: e.message });
        }
    },

    applyTextChanges: function (payloadJson) {
        try {
            var payload = eval('(' + payloadJson + ')');
            if (!payload || payload.length === 0) return sendResult({ success: true, updated: 0 });

            var doc = app.activeDocument;
            if (!doc.selection || doc.selection.length === 0) {
                return sendResult({ success: false, error: "Mất vùng chọn" });
            }

            var _collectInSelection = function (items) {
                var collected = [];
                for (var k = 0; k < items.length; k++) {
                    var obj = items[k];
                    if (obj.typename === "TextFrame") {
                        collected.push(obj);
                    } else if (obj.typename === "GroupItem") {
                        collected = collected.concat(_collectInSelection(obj.pageItems));
                    }
                }
                return collected;
            };

            var frames = _collectInSelection(doc.selection);
            var updated = 0;

            // [BUG #01 FIX] Create a map for fast frame lookup via our stable UUID
            var frameMap = {};
            for (var f = 0; f < frames.length; f++) {
                var it = frames[f];
                var cHash = 0;
                try { cHash = (it.contents && it.contents.length) ? it.contents.length : 0; } catch (e) { }
                var suid = it.uuid || ("tf_" + Math.round(it.top || 0) + "_" + Math.round(it.left || 0) + "_" + cHash + "_" + f);
                frameMap[suid] = it;
            }

            var affected = [];
            for (var i = 0; i < payload.length; i++) {
                var change = payload[i];
                var item = frameMap[change.id]; // Look up by UUID, not index

                if (item) {
                    try {
                        item.contents = change.newText;
                        affected.push({ id: change.id, text: change.newText });
                        updated++;
                    } catch (e) { }
                }
            }
            app.redraw();
            return sendResult({ success: true, updated: updated, affected: affected });
        } catch (e) {
            return sendResult({ success: false, error: e.message });
        }
    },

    // --- COLLECT (Internal Helper) ---
    collectFrames: function () {
        return this.scanWithMetadata();
    },

    // --- SCAN WITH METADATA (Optimized for Markers) ---
    scanWithMetadata: function (modeJson) {
        try {
            if (app.documents.length === 0) return sendResult({ success: false, error: "No document open" });

            var doc = app.activeDocument;
            var frames = [];
            var isSelectionMode = false;

            // 1. Xử lý vùng chọn (Hỗ trợ Group/Clipping Mask)
            if (doc.selection && doc.selection.length > 0) {
                // Hàm đệ quy nội bộ để lấy TextFrame từ Group
                var _collectInSelection = function (items) {
                    var collected = [];
                    for (var k = 0; k < items.length; k++) {
                        var obj = items[k];
                        if (obj.typename === "TextFrame") {
                            collected.push(obj);
                        } else if (obj.typename === "GroupItem") {
                            // Đệ quy vào trong Group
                            collected = collected.concat(_collectInSelection(obj.pageItems));
                        }
                    }
                    return collected;
                };

                frames = _collectInSelection(doc.selection);

                // Nếu tìm thấy ít nhất 1 TextFrame trong vùng chọn -> Kích hoạt Selection Mode
                if (frames.length > 0) {
                    isSelectionMode = true;
                }
            }

            // 2. Nếu không chọn gì (hoặc chọn toàn hình ảnh), quét toàn bộ Document
            if (!isSelectionMode) {
                frames = doc.textFrames;
            }

            var results = [];
            var GHOST = "\u200B";

            for (var i = 0; i < frames.length; i++) {
                var item = frames[i];
                var rawContent = "";
                try { rawContent = item.contents; } catch (e) { continue; }

                var info = null;

                // [CRITICAL FIX] Logic nhận diện (Giữ nguyên từ bước fix trước)
                var metaKeys = [];
                if (typeof MetadataAdapter !== 'undefined') {
                    var metaState = MetadataAdapter.getState(item);
                    if (metaState) {
                        if (metaState.keys) metaKeys = metaState.keys;
                        else if (metaState.mappings) {
                            for (var k = 0; k < metaState.mappings.length; k++) metaKeys.push(metaState.mappings[k].key);
                        }
                    }
                }

                // [BUG #01 FIX] Generate stable UUID based on content length + coordinates
                var cHash = (rawContent && rawContent.length) ? rawContent.length : 0;
                var suid = item.uuid || ("tf_" + Math.round(item.top || 0) + "_" + Math.round(item.left || 0) + "_" + cHash + "_" + i);

                if (metaKeys.length > 0) {
                    info = { id: suid, type: 'managed', raw_content: rawContent, meta_keys: metaKeys, top: item.top, left: item.left };
                }
                else if (/\{[\w\.]+\}/.test(rawContent)) {
                    info = { id: suid, type: 'fresh', raw_content: rawContent, meta_keys: [], top: item.top, left: item.left };
                }
                else if (rawContent.indexOf(GHOST) !== -1) {
                    info = { id: suid, type: 'marker_only', raw_content: rawContent, meta_keys: [], top: item.top, left: item.left };
                }

                // Nếu đang ở chế độ Selection, ta chấp nhận cả những item chưa có gì
                // Để JS có thể xử lý gán mới
                if (!info && isSelectionMode) {
                    info = { id: suid, type: 'fresh_selection', raw_content: rawContent, meta_keys: [], top: item.top, left: item.left };
                }

                if (info) results.push(info);
            }

            return sendResult({
                success: true,
                data: results,
                count: results.length,
                mode: isSelectionMode ? "selection" : "document" // Trả về mode chính xác
            });

        } catch (e) {
            return sendResult({ success: false, error: "Scan Error: " + e.message });
        }
    },


    // --- APPLY PLAN (Updated for Rich Text Preservation) ---
    applyPlan: function (plansJson) {
        try {
            var plans = eval('(' + plansJson + ')');
            if (!plans || !plans.length) return sendResult({ success: true, updated: 0 });

            var updated = 0;
            var doc = app.activeDocument;
            var allItems = [];

            // [CRITICAL FIX] Logic Mapping ID: Phải khớp hoàn toàn với hàm scanWithMetadata
            // 1. Nếu đang có Selection -> Lấy danh sách item từ Selection (Đệ quy Group)
            if (doc.selection && doc.selection.length > 0) {
                var _collectInSelection = function (items) {
                    var collected = [];
                    for (var k = 0; k < items.length; k++) {
                        var obj = items[k];
                        if (obj.typename === "TextFrame") {
                            collected.push(obj);
                        } else if (obj.typename === "GroupItem") {
                            collected = collected.concat(_collectInSelection(obj.pageItems));
                        }
                    }
                    return collected;
                };
                allItems = _collectInSelection(doc.selection);
            }
            // 2. Nếu không chọn gì -> Lấy từ toàn bộ Document
            else {
                allItems = doc.textFrames;
            }

            // [BUG #01 FIX] Build frame map for UUID lookup
            var frameMap = {};
            for (var f = 0; f < allItems.length; f++) {
                var it = allItems[f];
                frameMap[getStableTextFrameId(it, f)] = it;
            }

            // Bắt đầu thực thi Plan
            var affected = [];
            for (var i = 0; i < plans.length; i++) {
                var p = plans[i];

                var item = frameMap[p.id]; // Look up by UUID, not index
                if (!item) continue;

                var plan = p.plan;

                if (!plan || plan.mode === "SKIP") continue;

                try {
                    // CASE 1: ATOMIC (Thay thế từng phần - Giữ định dạng Rich Text)
                    if (plan.mode === "ATOMIC" && plan.replacements && plan.replacements.length > 0) {
                        plan.replacements.sort(function (a, b) { return b.start - a.start; });
                        var chars = item.characters;

                        for (var k = 0; k < plan.replacements.length; k++) {
                            var r = plan.replacements[k];
                            var val = String(r.val).replace(/\n/g, "\r");
                            var insertStart = r.start;

                            if (r.end > r.start + 1) {
                                for (var d = r.end - 1; d > r.start; d--) {
                                    if (d < chars.length) chars[d].remove();
                                }
                            }

                            if (r.start < chars.length) {
                                if (val === "") chars[r.start].remove();
                                else chars[r.start].contents = val;
                            } else {
                                insertStart = item.characters.length;
                                item.contents += val;
                            }

                            if (val !== "") {
                                applyBaselineRanges(item, [{
                                    start: insertStart,
                                    end: insertStart + val.length,
                                    baseline: "normal"
                                }]);
                                applyBaselineRanges(item, offsetStyleRanges(r.styles, insertStart));
                            }
                        }
                        applyBaselineRanges(item, plan.resetRanges);
                        applyBaselineRanges(item, plan.styleRanges);
                        updated++;
                        affected.push({ id: p.id, text: item.contents });
                    }
                    // CASE 1B: STYLE (rich text only, no content change)
                    else if (plan.mode === "STYLE") {
                        applyBaselineRanges(item, plan.resetRanges);
                        applyBaselineRanges(item, plan.styleRanges);
                        updated++;
                        affected.push({ id: p.id, text: item.contents });
                    }
                    else if (plan.mode === "DIRECT") {
                        // CASE 2: DIRECT (replace full text without U200B markers)
                        var cleanVal = String(plan.content).replace(/\u200B/g, "");
                        var val = cleanVal.replace(/\n/g, "\r");
                        item.contents = val;
                        applyBaselineRanges(item, plan.resetRanges);
                        applyBaselineRanges(item, plan.styleRanges);
                        updated++;
                        affected.push({ id: p.id, text: item.contents });
                    }

                    // Update Metadata hoac Xoa Metadata (Kiem tra nguyen tac Xoa tu Tab 2)
                    if (plan.meta) {
                        if (plan.meta.action === "clear") {
                            item.note = ""; // Xoa sach metadata
                        } else {
                            item.note = JSON.stringify(plan.meta); // Cap nhat metadata tu Tab 1
                        }
                    }

                } catch (err) {
                    // Bỏ qua lỗi lẻ tẻ để chạy tiếp các item khác
                }
            }

            // Redraw 1 lần cuối cùng
            app.redraw();
            return sendResult({ success: true, updated: updated, affected: affected });

        } catch (e) {
            return sendResult({ success: false, error: e.message });
        }
    },

    hostSelectionValidation: function (payloadJson) {
        try {
            var payload = payloadJson ? eval('(' + payloadJson + ')') : {};
            if (typeof $.global.WeddingHostValidation === "undefined") {
                return sendResult({ success: false, error: "WeddingHostValidation unavailable" });
            }

            return sendResult($.global.WeddingHostValidation.handle(payload));
        } catch (e) {
            return sendResult({ success: false, error: e.message });
        }
    },

    // --- LEGACY STUBS ---
    scanTextFrames: function (modeJson) { return this.scanWithMetadata(modeJson); },
    updateCard: function (d) { return sendResult({ success: true }); }
};
