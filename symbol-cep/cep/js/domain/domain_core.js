/*
    🛑 CORE DOMAIN LOGIC
    ================================================================================
    📜 COMPLIANCE STANDARDS (Required Reading)
    1. Domain Separation: [.agent/domain_separation_standard.md]
    2. Naming Governance: [.agent/naming_governance.md]
    3. Core Mindset:      [.agent/rules/CORE_MINDSET.md]
    
    CRITICAL RULE:
    - Pure Logic Only. NO DOM ACCESS.
    - YieldPadding (Tem) vs SheetGripper (Giấy).
    ================================================================================
*/
// Compatible with: ES3 (ExtendScript) & V8 (CEP/Node)
// Dependency: None (No DOM access allowed)

if (typeof ImpositionDomain === 'undefined') {
    ImpositionDomain = {};
}

(function (exports) {

    // --- CONSTANTS ---
    const MM_TO_PT = 2.834645;

    // --- ENTITIES ---

    exports.PaperSizes = {
        'a4': { w: 210, h: 297 },
        'a3': { w: 420, h: 297 },
        'sra3': { w: 450, h: 320 }
    };

    // --- DOMAIN SERVICES ---

    /**
     * Calculates the new Sheet Geometry based on Config
     * Pure Math: Input Rect -> Output Rect
     * Canonical: "Sheet" (Physical Paper) instead of "Artboard" (AI UI)
     */
    exports.calculateSheetGeometry = function (currentRect, payload) {
        const params = payload.rawValues || {};
        // Canonical Mapping: UI (ab_w) -> Domain (sheetW)
        const sheetW_mm = parseFloat(params.ab_w) || 320;
        const sheetH_mm = parseFloat(params.ab_h) || 480;

        const sheetW_pt = sheetW_mm * MM_TO_PT;
        const sheetH_pt = sheetH_mm * MM_TO_PT;

        // Geometry: Keep Top-Left (Rect[0], Rect[1]), Expand to Right-Bottom
        // AI Rect: [Left, Top, Right, Bottom]
        const newR = currentRect[0] + sheetW_pt;
        const newB = currentRect[1] - sheetH_pt;

        return {
            rect: [currentRect[0], currentRect[1], newR, newB], // "Sheet Rect"
            widthPt: sheetW_pt,
            heightPt: sheetH_pt,
            widthMm: sheetW_mm,
            heightMm: sheetH_mm
        };
    };

    /**
     * Calculates the Imposition Internal Frame (Finish, Print)
     * SIMPLIFIED: Bleed removed.
     */
    exports.calculateFrame = function (payload, contentBounds) {
        const geo = payload.geometry;

        // Auto-Detect Size logic
        let isAutoSize = false;
        let finishW_pt, finishH_pt;

        if (geo.finish && geo.finish.w > 0 && geo.finish.h > 0) {
            finishW_pt = geo.finish.w * MM_TO_PT;
            finishH_pt = geo.finish.h * MM_TO_PT;
        } else {
            isAutoSize = true;
            finishW_pt = contentBounds.width;
            finishH_pt = contentBounds.height;
        }

        // 1. Margin Engine Integration
        const rules = (payload.rules && payload.rules.length > 0)
            ? payload.rules
            : exports.createRulesFromPayload(payload);

        const margins = exports.calculateMargins(rules);

        const mTop = margins.top;
        const mBot = margins.bottom;
        const mLeft = margins.left;
        const mRight = margins.right;

        // "Printable" area INSIDE the Finish Size (Internal Margins)
        const printW_pt = finishW_pt - ((mLeft + mRight) * MM_TO_PT);
        const printH_pt = finishH_pt - ((mTop + mBot) * MM_TO_PT);

        return {
            finish: { w: finishW_pt, h: finishH_pt },
            print: { w: printW_pt, h: printH_pt },
            
            margins: { top: mTop, bot: mBot, left: mLeft, right: mRight },

            yieldPadding: margins, 

            rules: rules,
            isAutoSize: isAutoSize,
            
            // Helper to calculate final absolute coordinates given a Center Point
            getAbsoluteBounds: function (centerX, centerY) {
                const targetLeft = centerX - (finishW_pt / 2);
                const targetTop = centerY + (finishH_pt / 2);

                const fLeft = targetLeft + (mLeft * MM_TO_PT);
                const fTop = targetTop - (mTop * MM_TO_PT);

                return {
                    finish: { w: finishW_pt, h: finishH_pt, left: targetLeft, top: targetTop },
                    print: { w: printW_pt, h: printH_pt, left: fLeft, top: fTop }
                };
            },
            // Phase 2: Workflow Enhancements
            resizeMode: (payload.rawValues && payload.rawValues.resize_mode) || 'preserve'
        };
    };

    /**
     * Adapter: Convert legacy payload to Margin Rules
     * SIMPLIFIED: Only Safe Zone (Baseline) rules.
     */
    /**
     * Adapter: Convert legacy payload to Margin Rules
     * UPDATED: Supports Dynamic Schema (User-Added Fields) via payload.schema
     */
    exports.createRulesFromPayload = function (payload) {
        const rules = [];
        const raw = payload.rawValues || {};

        // A. Dynamic Schema Parsing (Priority)
        if (payload.schema && payload.schema.sections) {
            const sections = payload.schema.sections;
            for (let s = 0; s < sections.length; s++) {
                const sec = sections[s];

                // Helper to process a field definition
                const processField = function (f, rowId) {
                    if (f.binding) {
                        const val = parseFloat(raw[f.id]) || 0;
                        if (val > 0) {
                            // Check if this row has border drawing enabled
                            const borderKey = rowId + '_draw_border';
                            const drawBorder = (raw[borderKey] === 'on' || raw[borderKey] === true);
                            const borderStyle = raw[rowId + '_border_style'] || 'dashed';

                            rules.push({
                                edge: f.binding.edge,
                                val: val,
                                type: f.binding.classification,
                                id: f.id, // e.g. "safe_top", "test_margin_left"
                                drawBorder: drawBorder,
                                borderStyle: borderStyle
                            });
                        }
                    }
                };

                // 1. Stack/Grid Fields
                if (sec.fields) {
                    for (let i = 0; i < sec.fields.length; i++) {
                        processField(sec.fields[i], sec.id);
                    }
                }

                // 2. Matrix Rows
                if (sec.rows) {
                    for (let r = 0; r < sec.rows.length; r++) {
                        const row = sec.rows[r];
                        if (row.fields) {
                            for (const key in row.fields) {
                                if (row.fields.hasOwnProperty(key)) {
                                    const f = row.fields[key];
                                    // Polyfill Binding if UNDEFINED (ConfigEngine logic)
                                    // CRITICAL: Do NOT override explicit `binding: false`
                                    if (f.binding === undefined) {
                                        f.binding = {
                                            classification: row.classification,
                                            edge: key // 'left', 'top', etc.
                                        };
                                    }
                                    processField(f, row.id);
                                }
                            }
                        }
                    }
                }
            }
        }

        // LEGACY SUPPORT REMOVED (Step 2163 - Option C Cleanup)
        // Old presets using `payload.geometry.safe = [T,B,L,R]` format are no longer supported.
        // All presets must use schema-based configuration (payload.schema.sections).

        return rules;
    };

    /**
     * The Engine: Calculate final margins from Rules
     */
    exports.calculateMargins = function (ruleList) {
        const margins = { top: 0, bottom: 0, left: 0, right: 0 };
        const edges = ['top', 'bottom', 'left', 'right'];

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];

            // Filter rules for this edge
            const edgeRules = [];
            for (let k = 0; k < ruleList.length; k++) {
                if (ruleList[k].edge === edge) edgeRules.push(ruleList[k]);
            }

            // A. Base Calculation (Max of Baseline & Structural)
            let maxBase = 0;
            for (let j = 0; j < edgeRules.length; j++) {
                const r = edgeRules[j];
                if ((r.type === 'BASELINE' || r.type === 'STRUCTURAL') && r.val > maxBase) {
                    maxBase = r.val;
                }
            }

            // B. Additive Calculation
            let totalAdd = 0;
            for (let m = 0; m < edgeRules.length; m++) {
                if (edgeRules[m].type === 'ADDITIVE') {
                    totalAdd += edgeRules[m].val;
                }
            }

            // C. Absolute Override (Winner takes all)
            let absVal = -1;
            for (let n = 0; n < edgeRules.length; n++) {
                if (edgeRules[n].type === 'ABSOLUTE') {
                    absVal = edgeRules[n].val;
                    break;
                }
            }

            if (absVal >= 0) {
                margins[edge] = absVal;
            } else {
                margins[edge] = maxBase + totalAdd;
            }
        }

        return margins;
    };

    /**
     * N-Up Grid Layout Calculation (Phase 1)
     * Strategy: Balanced Stack with Mixed Footer
     */
    exports.calculateNUpLayout = function (artboardRect, yieldDim, variantCount, spacing, sheetGripper, headToHead) {
        // 1. Dimensions
        const abL = artboardRect[0];
        const abT = artboardRect[1];
        const abW = artboardRect[2] - artboardRect[0];
        const abH = artboardRect[1] - artboardRect[3]; // AI coordinates: Top > Bottom

        if (!spacing) spacing = { x: 0, y: 0 };

        // Normalize Sheet Gripper (SDSS)
        const m = { top: 0, bottom: 0, left: 0, right: 0 };
        if (typeof sheetGripper === 'object') {
            m.top = sheetGripper.top || 0;
            m.bottom = sheetGripper.bottom || 0;
            m.left = sheetGripper.left || 0;
            m.right = sheetGripper.right || 0;
        } else {
            const val = parseFloat(sheetGripper) || 0;
            m.top = val; m.bottom = val; m.left = val; m.right = val;
        }

        // Usable Area
        const useW = abW - (m.left + m.right);
        const useH = abH - (m.top + m.bottom);

        // 2. Capacity
        // Formula: Count * Size + (Count - 1) * Spacing <= Usable
        // C * S + C*G - G <= U
        // C(S+G) <= U + G
        // C <= (U + G) / (S + G)
        const cols = Math.floor((useW + spacing.x) / (yieldDim.w + spacing.x));
        const rows = Math.floor((useH + spacing.y) / (yieldDim.h + spacing.y));

        if (cols <= 0 || rows <= 0) return [];

        // 3. Centering Logic (within Usable Area)
        const gridW = cols * yieldDim.w + (cols - 1) * spacing.x;
        const gridH = rows * yieldDim.h + (rows - 1) * spacing.y;

        // Center Point of Usable Area
        // Usable Left = abL + m.left
        // Usable Top = abT - m.top
        const usableL = abL + m.left;
        const usableT = abT - m.top;

        const usableCX = usableL + (useW / 2);
        const usableCY = usableT - (useH / 2);

        // Grid Top-Left
        const gridL = usableCX - (gridW / 2);
        const gridT = usableCY + (gridH / 2);

        // 4. Distribution Logic (Balanced Stack)
        const rowsPerVariant = Math.floor(rows / variantCount); // Main chunks
        // If variantCount > rows, rowsPerVariant is 0. Then everything is remainder.


        const placements = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            let variantIndex = 0;

            if (rowsPerVariant > 0 && r < (rowsPerVariant * variantCount)) {
                // MAIN BODY
                variantIndex = Math.floor(r / rowsPerVariant);
                if (variantIndex >= variantCount) variantIndex = variantCount - 1;
            } else {
                // FOOTER
                variantIndex = c % variantCount;
            }

            // --- LOGIC MỚI: TÍNH GÓC XOAY (HEAD-TO-HEAD) ---
            let rotation = 0;
            if (headToHead) { 
                if (r % 2 !== 0) { // Nếu là hàng lẻ (0, [1], 2, [3]...)
                    rotation = 180;
                }
            }
            

            // Coordinates (Center of Yield)
            const x = gridL + (c * (yieldDim.w + spacing.x)) + (yieldDim.w / 2);
            const y = gridT - (r * (yieldDim.h + spacing.y)) - (yieldDim.h / 2);

            placements.push({
                x: x,
                y: y,
                variantIndex: variantIndex,
                row: r,
                col: c,
                rotation: rotation // <--- Trả về góc xoay
            });
        }
    }

    return placements;
};

})(ImpositionDomain);
