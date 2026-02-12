/**
 * 🔑 CANONICAL FIELD IDS - Single Source of Truth
 * ================================================================================
 * 📜 COMPLIANCE STANDARDS
 * 1. All files referencing form fields MUST use these constants.
 * 2. NO aliases, fallbacks, or magic strings allowed elsewhere.
 * 3. If you need a new field: ADD IT HERE FIRST.
 * ================================================================================
 */

window.FIELD_IDS = {
    // Safe Zone (Yield Internal Margins) - mm
    SAFE_TOP: 'safe_top',
    SAFE_BOTTOM: 'safe_bottom',
    SAFE_LEFT: 'safe_left',
    SAFE_RIGHT: 'safe_right',

    // Sheet Margins (Gripper/Paper Edge) - mm
    SHEET_M_TOP: 'sheet_m_top',
    SHEET_M_BOT: 'sheet_m_bot',
    SHEET_M_LEFT: 'sheet_m_left',
    SHEET_M_RIGHT: 'sheet_m_right',

    // Finish Size (Final Product Dimensions) - mm
    FINISH_W: 'finish_w',
    FINISH_H: 'finish_h',

    // Artboard/Sheet Size - mm
    AB_W: 'ab_w',
    AB_H: 'ab_h',

    // --- SYSTEM CONSTANTS (DRY) ---

    // Naming Prefixes
    PREFIX_CONTAINER: 'Container_',
    PREFIX_CONTENT: 'Content_',
    PREFIX_GUIDE: 'Guide_', // Used for dynamic rules: Guide_safe_top, Guide_binding_left

    // Static Guide Names
    GUIDE_FINISH: 'Guide_Finish',
    GUIDE_SAFE_ZONE: 'Guide_Safe_Zone',

    // Layer Names
    LAYER_GUIDES_PAPER: 'Guides_Paper (Artboard)'
};

// Freeze to prevent accidental modification
if (Object.freeze) {
    Object.freeze(window.FIELD_IDS);
}
