/*
    🛑 SYSTEM KERNEL - DO NOT EDIT
    ================================================================================
    📜 COMPLIANCE STANDARDS (Required Reading)
    1. Architecture:      [.agent/plans/modular_architecture_risk_and_roadmap.md]
    2. Domain Separation: [.agent/domain_separation_standard.md] (Firewall Enforced)
    
    PROTOCOL: KERNEL_ORCHESTRATOR
    - Splits Data into YieldCtx and SheetCtx.
    - Enforces Firewall between Modules.
    ================================================================================
*/

/*
    🎹 ORCHESTRATOR (Engine)
    Responsibility: Nhận lệnh -> Gọi Modules -> Trả kết quả.
    No Bootstrap Code here!
*/

(function () {
    // Ensure Namespace exists (Double check)
    if (typeof $._imposition === 'undefined') $._imposition = {};

    $._imposition.engine = {
        run: function (payloadStr) {
            var originalWriteln = $.writeln;
            var trace = [];
            $.writeln = function (m) { trace.push(m); };

            try {
                $.writeln(">>> ENGINE RUN <<<");

                // 1. CHECK CORE STATUS
                // Nếu Core chưa load (vì lý do nào đó), thử load lại thủ công
                if (!$._imposition.isLoaded) {
                    $.writeln("Core not loaded. Attempting hot-load...");
                    var thisFile = new File($.fileName);
                    $.evalFile(new File(thisFile.parent + "/core.jsx"));
                }

                var Mods = $._imposition.modules;
                if (!Mods) throw new Error("Modules not ready.");

                // 2. PREPARE DATA
                var payload = JSON.parse(payloadStr);
                var doc = app.activeDocument;
                var sel = app.selection;

                if (sel.length === 0) throw new Error("Chưa chọn đối tượng nào!");

                // AUTO-DETECT FINISH SIZE (Tech Debt Fix)
                if (Mods.preflight) {
                    var detected = Mods.preflight.getSelectionBounds(sel);
                    if (detected.w > 0 && detected.h > 0 && !detected.error) {
                        var detectedMM = {
                            w: detected.w / 2.834645,
                            h: detected.h / 2.834645
                        };
                        $.writeln("[Preflight] Detected: " + detectedMM.w.toFixed(2) + " x " + detectedMM.h.toFixed(2) + " mm");

                        // Auto-populate if not manually provided
                        if (!payload.rawValues.finish_w || !payload.rawValues.finish_h) {
                            payload.rawValues.finish_w = detectedMM.w;
                            payload.rawValues.finish_h = detectedMM.h;
                            $.writeln("[Preflight] Auto-set finish size from selection");
                        }
                    }
                }

                // 3. CALC FRAME (using preflight module)
                var detected = Mods.preflight ? Mods.preflight.getSelectionBounds(sel) : null;
                var contentBounds = {
                    left: detected ? detected.left : 0,
                    top: detected ? detected.top : 0,
                    width: detected ? detected.width : 0,
                    height: detected ? detected.height : 0
                };
                var frame = ImpositionDomain.calculateFrame(payload, contentBounds);

                // Setup Sheet
                // Setup Sheet (Corrected Logic)
                // Setup Sheet (Corrected Logic with Margins)
                var raw = payload.rawValues || {};
                var sheetInfo;

                // Parse Canonical Sheet Margins (UI: sheet_m_*)
                // Default to 0 if not set. Use 5mm (14.17pt) ONLY if absolutely nothing is provided? 
                // No, better to default to 0 and let user specify.
                var sm = {
                    top: (parseFloat(raw.sheet_m_top) || 0) * 2.834645,
                    bottom: (parseFloat(raw.sheet_m_bot) || 0) * 2.834645, // Note: ID might be sheet_m_bot or sheet_m_bottom
                    left: (parseFloat(raw.sheet_m_left) || 0) * 2.834645,
                    right: (parseFloat(raw.sheet_m_right) || 0) * 2.834645
                };

                // Sheet Size: Resize artboard if ab_w and ab_h are provided
                var hasSheetSize = (raw.ab_w && parseFloat(raw.ab_w) > 0) || (raw.ab_h && parseFloat(raw.ab_h) > 0);

                if (hasSheetSize) {
                    // Manual Sheet Size specified
                    var sW = (parseFloat(raw.ab_w) || 320) * 2.834645;
                    var sH = (parseFloat(raw.ab_h) || 480) * 2.834645;
                    $.writeln("[Engine] Resizing artboard to: " + (sW / 2.834645).toFixed(1) + " x " + (sH / 2.834645).toFixed(1) + " mm");
                    sheetInfo = Mods.layout.setupSheet(doc, sW, sH);
                } else {
                    // No sheet size: Use current artboard geometry
                    $.writeln("[Engine] No sheet size provided. Using current artboard.");
                    sheetInfo = Mods.layout.getSheetGeometry(doc);
                }

                // Inject Margins and RawValues into Sheet Info (Essential for Layout & Guides & Marks)
                sheetInfo.margin = sm;
                sheetInfo.rawValues = payload.rawValues; // Step 2267: Enable head-to-head & marks options

                // 4. PARSE FLAGS (Respect User Decisions)
                var raw = payload.rawValues || {};

                // Helper function to parse checkbox value (handles 'on', 'true', true, etc.)
                function isChecked(val) {
                    return val === true || val === 'true' || val === 'on' || val === 1 || val === '1';
                }

                var useSymbol = isChecked(raw.opt_symbol_mode); // Default: unchecked = false
                var useNUp = isChecked(raw.opt_n_up);           // Default: unchecked = false
                var useCleanup = isChecked(raw.opt_cleanup);
                var useK100 = isChecked(raw.opt_k100);

                $.writeln("[Engine] FLAGS: Symbol=" + useSymbol + ", N-Up=" + useNUp + ", Cleanup=" + useCleanup + ", K100=" + useK100);

                // 5. PROCESS PIPELINE
                var processedItems = [];

                for (var i = 0; i < sel.length; i++) {
                    var item = sel[i];
                    var tempGroup = doc.groupItems.add();
                    var clone = item.duplicate(tempGroup, ElementPlacement.PLACEATBEGINNING);

                    // Step 5a: Cleanup (Optional)
                    if (useCleanup && Mods.cleanup) {
                        Mods.cleanup.run(clone);
                        if (tempGroup.pageItems.length > 0) clone = tempGroup.pageItems[0];
                    }

                    // Step 5b: K100 (Optional)
                    if (useK100 && Mods.color) {
                        Mods.color.run(clone);
                    }

                    // Step 5c: Yield Builder (ALWAYS create container with guides)
                    // useSymbol only controls whether output is Symbol or Group
                    // Guides are ALWAYS drawn for print operators
                    var name = item.name || ("Var_" + (i + 1));
                    var resultItem = Mods.symbol.run(doc, clone, frame, name, useSymbol);
                    // asSymbol=true → Symbol definition
                    // asSymbol=false → Group container with guides

                    if (resultItem) {
                        processedItems.push(resultItem);
                    }

                    // Cleanup temp group if empty
                    if (tempGroup.pageItems.length === 0) {
                        tempGroup.remove();
                    }
                }

                // 6. LAYOUT (Optional - controlled by opt_n_up)
                var layoutResult = null;
                if (processedItems.length > 0) {
                    $.writeln("[Engine] Processed " + processedItems.length + " items.");

                    if (useNUp) {
                        $.writeln("[Engine] N-Up Layout ENABLED. Delegating to Layout Module...");
                        layoutResult = Mods.layout.process(doc, processedItems, frame, sheetInfo, useSymbol);

                        if (layoutResult && layoutResult.status === 'error') {
                            throw new Error("Layout Error: " + layoutResult.message);
                        }
                    } else {
                        // N-Up disabled: Use single placement with align_position
                        $.writeln("[Engine] N-Up Layout DISABLED. Using single placement mode...");
                        layoutResult = Mods.layout.placeSingle(doc, processedItems, frame, sheetInfo, useSymbol);

                        if (layoutResult && layoutResult.status === 'error') {
                            throw new Error("Placement Error: " + layoutResult.message);
                        }
                    }

                    // 7. DRAW REGISTRATION MARKS (Optional)
                    if (isChecked(raw.opt_draw_marks)) {
                        $.writeln("Calling Marks Module...");
                        var marksResult = Mods.marks.process(doc, processedItems, frame, sheetInfo);
                        if (marksResult && marksResult.status === 'error') {
                            throw new Error("Marks Error: " + marksResult.message);
                        }
                    }

                    // 8. POST-LAYOUT ROTATION (Only for N-Up mode, placeSingle handles rotation internally)
                    var alreadyRotated = (layoutResult && layoutResult.rotated);
                    var itemsToRotate = (layoutResult && layoutResult.placedItems) ? layoutResult.placedItems : processedItems;
                    $.writeln("[Engine] Step 8: Checking Rotate Module...");
                    $.writeln("[Engine] Already rotated by placeSingle: " + alreadyRotated);
                    $.writeln("[Engine] itemsToRotate count: " + itemsToRotate.length);

                    if (Mods.rotate && isChecked(raw.opt_custom_rotate) && itemsToRotate.length > 0 && !alreadyRotated) {
                        $.writeln("[Engine] Custom Rotate ENABLED. Angle=" + raw.custom_rotate_angle);
                        var rotateResult = Mods.rotate.run(doc, itemsToRotate, raw);
                        if (rotateResult && rotateResult.status === 'error') {
                            throw new Error("Rotate Error: " + rotateResult.message);
                        }
                    } else if (alreadyRotated) {
                        $.writeln("[Engine] Rotation already applied by placeSingle. Skipping.");
                    }
                } else {
                    throw new Error("Pipeline produced 0 items.");
                }

                $.writeln(">>> ENGINE FINISHED <<<");
                $.writeln = originalWriteln;
                // Trả về log nối chuỗi để JS hiển thị
                return "success\n--------------------\n" + trace.join("\n");


            } catch (e) {
                $.writeln("ENGINE ERROR: " + e.message);
                $.writeln = originalWriteln;
                return "error: " + e.message + "\nLog:\n" + trace.join("\n");
            }
        }
    };
})();