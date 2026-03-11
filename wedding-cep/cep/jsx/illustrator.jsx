#target illustrator

// =========================================================
// 1. UTILS (BASE64 & JSON)
// =========================================================
#include "utils.jsx"

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


            var results = [];
            for (var i = 0; i < frames.length; i++) {
                var item = frames[i];
                try {
                    // [BUG #01 FIX] Generate stable UUID based on content length + coordinates
                    var contentHash = 0;
                    try { contentHash = (item.contents && item.contents.length) ? item.contents.length : 0; } catch (e) { }
                    var stableUuid = item.uuid || ("tf_" + Math.round(item.top || 0) + "_" + Math.round(item.left || 0) + "_" + contentHash + "_" + i);

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
            return sendResult({ success: true, data: results });
        } catch (e) {
            return sendResult({ success: false, error: e.message });
        }
    },

    selectFramesById: function (payloadJson) {
        try {
            var doc = app.activeDocument;
            var ids = eval('(' + payloadJson + ')');
            if (!ids || ids.length === 0) return sendResult({ success: true, selected: 0 });

            // Collect all textframes từ selection (lần scan gần nhất dùng index làm id)
            var sel = doc.selection;
            var _collectInSelection = function (items) {
                var collected = [];
                for (var k = 0; k < items.length; k++) {
                    var obj = items[k];
                    if (obj.typename === 'TextFrame') collected.push(obj);
                    else if (obj.typename === 'GroupItem') collected = collected.concat(_collectInSelection(obj.pageItems));
                }
                return collected;
            };
            var allFrames = _collectInSelection(sel);

            // Deselect all, rồi select chỉ các frame khớp id
            doc.selection = null;
            var toSelect = [];
            for (var i = 0; i < ids.length; i++) {
                if (allFrames[ids[i]]) toSelect.push(allFrames[ids[i]]);
            }
            if (toSelect.length > 0) doc.selection = toSelect;

            return sendResult({ success: true, selected: toSelect.length });
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
                var cHash = 0;
                try { cHash = (it.contents && it.contents.length) ? it.contents.length : 0; } catch (e) { }
                var suid = it.uuid || ("tf_" + Math.round(it.top || 0) + "_" + Math.round(it.left || 0) + "_" + cHash + "_" + f);
                frameMap[suid] = it;
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

                            if (r.end > r.start + 1) {
                                for (var d = r.end - 1; d > r.start; d--) {
                                    if (d < chars.length) chars[d].remove();
                                }
                            }

                            if (r.start < chars.length) {
                                if (val === "") chars[r.start].remove();
                                else chars[r.start].contents = val;
                            } else {
                                item.contents += val;
                            }
                        }
                        updated++;
                        affected.push({ id: p.id, text: item.contents });
                    }
                    // CASE 2: DIRECT (Ghi đè toàn bộ - Luôn bọc Marker)
                    else if (plan.mode === "DIRECT") {
                        // Ghi schema key trực tiếp vào content (không bọc U200B)
                        var cleanVal = String(plan.content).replace(/\u200B/g, "");
                        var val = cleanVal.replace(/\n/g, "\r");
                        item.contents = val;
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

    // --- LEGACY STUBS ---
    scanTextFrames: function (modeJson) { return this.scanWithMetadata(modeJson); },
    updateCard: function (d) { return sendResult({ success: true }); }
};