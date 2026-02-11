/**
 * Example: Illustrator TextFrame Scanner
 * 
 * PURPOSE:
 * Scan tất cả TextFrames từ Illustrator document và return RAW data
 * ĐÂY LÀ ADAPTER - chỉ interact với Illustrator API, NO business logic
 * 
 * WHEN TO USE:
 * - Khi cần đọc data từ file AI
 * - Khi cần harvest TextFrame names + contents
 * - CEP panel scan button
 * 
 * HEXAGONAL LAYER: Infrastructure/Adapter
 * DEPENDENCIES: Illustrator app object
 * 
 * @example
 * var scanner = IllustratorScanner();
 * var result = scanner.scanTextFrames();
 * if (result.success) {
 *     $.writeln("Found " + result.data.frames.length + " frames");
 * }
 */

function IllustratorScanner() {

    /**
     * Scan all TextFrames in active document
     * 
     * @returns {object} {success, data: {frames, count, docName}, error}
     * 
     * RETURNS RAW DATA ONLY - caller does business logic
     */
    function scanTextFrames() {
        try {
            // Guard: Check document exists
            if (app.documents.length === 0) {
                return {
                    success: false,
                    error: "No document open"
                };
            }

            var doc = app.activeDocument;
            var frames = [];

            // Iterate all textFrames (flat iteration - simple)
            for (var i = 0; i < doc.textFrames.length; i++) {
                var tf = doc.textFrames[i];

                try {
                    // Extract minimal data
                    frames.push({
                        name: tf.name || "",
                        contents: tf.contents || "",
                        // Position for debugging (optional)
                        x: tf.position[0],
                        y: tf.position[1]
                    });
                } catch (e) {
                    // Skip broken/locked frames
                    continue;
                }
            }

            // Return success result
            return {
                success: true,
                data: {
                    frames: frames,
                    count: frames.length,
                    docName: doc.name
                }
            };

        } catch (e) {
            // Return error result
            return {
                success: false,
                error: e.message,
                line: e.line
            };
        }
    }

    /**
     * Update TextFrames in active document
     * 
     * @param {object} data - Key-value pairs {frameName: newContent}
     * @returns {object} {success, data: {updated, errors}}
     * 
     * MATCHING LOGIC:
     * - Match by exact name OR name with braces: "key" matches "key" and "{key}"
     */
    function updateTextFrames(data) {
        try {
            if (app.documents.length === 0) {
                return {
                    success: false,
                    error: "No document open"
                };
            }

            var doc = app.activeDocument;
            var updated = 0;
            var errors = [];

            // Update each key-value pair
            for (var key in data) {
                if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

                // Skip metadata keys (start with underscore)
                if (key.indexOf("_") === 0) continue;

                var value = data[key];
                var found = false;

                // Find matching TextFrame
                for (var i = 0; i < doc.textFrames.length; i++) {
                    var tf = doc.textFrames[i];

                    // Match by name (with or without braces)
                    if (tf.name === key || tf.name === "{" + key + "}") {
                        try {
                            tf.contents = String(value);
                            updated++;
                            found = true;
                            break; // Stop after first match
                        } catch (e) {
                            errors.push({
                                key: key,
                                error: e.message
                            });
                        }
                    }
                }
            }

            // Redraw to show changes
            app.redraw();

            return {
                success: true,
                data: {
                    updated: updated,
                    errors: errors
                }
            };

        } catch (e) {
            return {
                success: false,
                error: e.message,
                line: e.line
            };
        }
    }

    /**
     * Get document info (metadata)
     * 
     * @returns {object} {success, data: {name, path, textFrames, ...}}
     */
    function getDocumentInfo() {
        try {
            if (app.documents.length === 0) {
                return {
                    success: false,
                    error: "No document open"
                };
            }

            var doc = app.activeDocument;

            return {
                success: true,
                data: {
                    name: doc.name,
                    path: doc.path ? doc.path.fsName : null,
                    textFrames: doc.textFrames.length,
                    selection: doc.selection ? doc.selection.length : 0,
                    width: doc.width,
                    height: doc.height
                }
            };

        } catch (e) {
            return {
                success: false,
                error: e.message
            };
        }
    }

    // Public API
    return {
        scanTextFrames: scanTextFrames,
        updateTextFrames: updateTextFrames,
        getDocumentInfo: getDocumentInfo
    };
}

// === USAGE EXAMPLES (Remove khi copy vào production) === //
/*
// Example 1: Scan document
var scanner = IllustratorScanner();
var result = scanner.scanTextFrames();
if (result.success) {
    $.writeln("Found " + result.data.count + " TextFrames");
    for (var i = 0; i < result.data.frames.length; i++) {
        var frame = result.data.frames[i];
        $.writeln("  " + frame.name + " = " + frame.contents);
    }
} else {
    $.writeln("Error: " + result.error);
}

// Example 2: Update frames
var updateData = {
    "pos1.ten": "John",
    "pos2.ten": "Mary",
    "date": "2024-01-19"
};
var updateResult = scanner.updateTextFrames(updateData);
if (updateResult.success) {
    $.writeln("Updated " + updateResult.data.updated + " frames");
} else {
    $.writeln("Error: " + updateResult.error);
}

// Example 3: Get doc info
var info = scanner.getDocumentInfo();
if (info.success) {
    $.writeln("Document: " + info.data.name);
    $.writeln("TextFrames: " + info.data.textFrames);
}
*/
