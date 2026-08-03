const smokeScenarioRegistry = [
    {
        id: 'startup_ready_path',
        moduleId: null,
        scope: 'shell',
        description: 'startup path inspects preloaded host runtime before ready'
    },
    {
        id: 'reload_button_ready',
        moduleId: null,
        scope: 'shell',
        description: 'panel reload button returns to ready without changing runtime semantics'
    },
    {
        id: 'break_text_into_lines_point_and_area',
        moduleId: 'break_text_into_lines',
        scope: 'module',
        description: 'text lines command preserves point-text line placement and still handles area text best-effort'
    },
    {
        id: 'break_text_into_lines_rotated_point_text',
        moduleId: 'break_text_into_lines',
        scope: 'module',
        description: 'text lines command keeps rotated multi-line point text clustered without drift',
        includeInFull: false
    },
    {
        id: 'break_text_into_lines_mixed_selection_skip',
        moduleId: 'break_text_into_lines',
        scope: 'module',
        description: 'text lines command skips non-text items in a mixed selection',
        includeInFull: false
    },
    {
        id: 'break_text_into_words_replace_original',
        moduleId: 'break_text_into_words',
        scope: 'module',
        description: 'text words command replaces the original frame with separate word items without drifting the cluster'
    },
    {
        id: 'break_text_into_glyphs_point_text',
        moduleId: 'break_text_into_glyphs',
        scope: 'module',
        description: 'text glyphs command splits point text into separate glyph items without drifting the cluster'
    },
    {
        id: 'break_text_into_glyphs_unsupported_only_fail',
        moduleId: 'break_text_into_glyphs',
        scope: 'module',
        description: 'text glyphs command fails cleanly when only unsupported path text is selected',
        includeInFull: false
    },
    {
        id: 'create_cut_lines_invalid_grid',
        moduleId: 'create_cut_lines',
        scope: 'module',
        description: 'cut lines invalid grid fails cleanly and draws nothing',
        enabled: false
    },
    {
        id: 'create_cut_lines_contour_append_only',
        moduleId: 'create_cut_lines',
        scope: 'module',
        description: 'cut lines contour appends owned groups and applies metadata on repeated runs',
        enabled: false
    },
    {
        id: 'create_cut_lines_sline_selection_bounds',
        moduleId: 'create_cut_lines',
        scope: 'module',
        description: 'cut lines s-line follows selection bounds instead of artboard center',
        includeInFull: false
    },
    {
        id: 'prepare_cut_package_normalizes',
        moduleId: 'prepare_cut_package',
        scope: 'module',
        description: 'prepare cut package normalizes CUT and camera layers without exporting',
        includeInFull: false
    },
    {
        id: 'save_cut_package_exports',
        moduleId: 'save_cut_package',
        scope: 'module',
        description: 'save cut package exports AI and PDF after review without re-normalizing layers',
        includeInFull: false
    },
    {
        id: 'swap_selection_position_only_basic',
        moduleId: 'swap_selection_position_only',
        scope: 'module',
        description: 'swap position only exchanges the geometric centers of exactly two selected items',
        includeInFull: false
    },
    {
        id: 'swap_selection_position_only_exact_two_precheck',
        moduleId: 'swap_selection_position_only',
        scope: 'module',
        description: 'swap position only fails cleanly unless exactly two items are selected',
        includeInFull: false
    },
    {
        id: 'swap_selection_size_and_position_basic',
        moduleId: 'swap_selection_size_and_position',
        scope: 'module',
        description: 'swap size and position exchanges centers and geometric sizes for two selected items',
        includeInFull: false
    },
    {
        id: 'swap_selection_size_and_position_rotated',
        moduleId: 'swap_selection_size_and_position',
        scope: 'module',
        description: 'swap size and position preserves each rotated item orientation while swapping centers',
        includeInFull: false
    },
    {
        id: 'swap_selection_size_and_position_zero_size_fail',
        moduleId: 'swap_selection_size_and_position',
        scope: 'module',
        description: 'swap size and position fails cleanly when a selected item has zero geometric size',
        includeInFull: false
    },
    {
        id: 'rasterize_bitmap_basic',
        moduleId: 'rasterize_bitmap_300_transparent',
        scope: 'module',
        description: 'rasterize bitmap replaces one selected item with one transparent 300 ppi bitmap raster item',
        includeInFull: false
    },
    {
        id: 'rasterize_bitmap_multi_selection_single_output',
        moduleId: 'rasterize_bitmap_300_transparent',
        scope: 'module',
        description: 'rasterize bitmap collapses a multi-selection into one raster item with matching visible bounds',
        includeInFull: false
    },
    {
        id: 'rasterize_bitmap_no_selection_precheck',
        moduleId: 'rasterize_bitmap_300_transparent',
        scope: 'module',
        description: 'rasterize bitmap fails cleanly when no selection is present',
        includeInFull: false
    },
    {
        id: 'recolor_selection_k100_basic_paths',
        moduleId: 'recolor_selection_k100',
        scope: 'module',
        description: 'recolor K100 replaces supported path fill and stroke colors, including existing black surfaces',
        includeInFull: false
    },
    {
        id: 'recolor_selection_k100_group_and_compound',
        moduleId: 'recolor_selection_k100',
        scope: 'module',
        description: 'recolor K100 recurses through groups and compound path children',
        includeInFull: false
    },
    {
        id: 'recolor_selection_k100_text_fill_and_stroke',
        moduleId: 'recolor_selection_k100',
        scope: 'module',
        description: 'recolor K100 updates text fill and stroke colors on the selected text frame',
        includeInFull: false
    },
    {
        id: 'recolor_selection_k100_mixed_skip',
        moduleId: 'recolor_selection_k100',
        scope: 'module',
        description: 'recolor K100 applies to supported art and records skipped unsupported gradient appearance',
        includeInFull: false
    },
    {
        id: 'recolor_selection_red_basic_paths',
        moduleId: 'recolor_selection_red_c0_m100_y100_k0',
        scope: 'module',
        description: 'recolor Red replaces supported path fill and stroke colors with process red',
        includeInFull: false
    },
    {
        id: 'recolor_selection_red_no_supported_items_fail',
        moduleId: 'recolor_selection_red_c0_m100_y100_k0',
        scope: 'module',
        description: 'recolor Red fails cleanly when the selection only contains unsupported appearance types',
        includeInFull: false
    },
    {
        id: 'recolor_selection_red_no_selection_precheck',
        moduleId: 'recolor_selection_red_c0_m100_y100_k0',
        scope: 'module',
        description: 'recolor Red fails cleanly when no selection is present',
        includeInFull: false
    },
    {
        id: 'place_all_pdf_pages_basic',
        moduleId: 'place_all_pdf_pages',
        scope: 'module',
        description: 'all PDF pages are placed as linked items with one exact-size artboard per page'
    },
    {
        id: 'place_all_ai_artboards_basic',
        moduleId: 'place_all_pdf_pages',
        scope: 'module',
        description: 'all AI artboards are placed as linked items with one exact-size artboard per source artboard'
    },
    {
        id: 'place_all_ai_pdf_compatibility_fail',
        moduleId: 'place_all_pdf_pages',
        scope: 'module',
        description: 'AI placement without a usable PDF-compatible representation rolls back cleanly',
        includeInFull: false
    },
    {
        id: 'place_all_pdf_pages_rollback',
        moduleId: 'place_all_pdf_pages',
        scope: 'module',
        description: 'partial multi-page placement rolls back all new items, artboards, and layers',
        includeInFull: false
    },
    {
        id: 'place_all_pdf_pages_artboard_limit',
        moduleId: 'place_all_pdf_pages',
        scope: 'module',
        description: 'multi-page placement blocks before mutation when Illustrator artboard capacity is exceeded',
        includeInFull: false
    },
    {
        id: 'step_repeat_basic_centered',
        moduleId: 'step_repeat',
        scope: 'module',
        description: 'step repeat replaces the source selection with a centered repeated grid on the active artboard',
        includeInFull: false
    },
    {
        id: 'step_repeat_auto_count',
        moduleId: 'step_repeat',
        scope: 'module',
        description: 'step repeat auto-calculates rows and columns from active artboard size and gap',
        includeInFull: false
    },
    {
        id: 'step_repeat_auto_rotate_better_fit',
        moduleId: 'step_repeat',
        scope: 'module',
        description: 'step repeat applies 90-degree auto-rotate when it yields more cells',
        includeInFull: false
    },
    {
        id: 'step_repeat_cell_too_large_fail',
        moduleId: 'step_repeat',
        scope: 'module',
        description: 'step repeat fails cleanly when the selection cell is larger than the active artboard',
        includeInFull: false
    },
    {
        id: 'step_repeat_gap_invalid_fail',
        moduleId: 'step_repeat',
        scope: 'module',
        description: 'step repeat rejects invalid negative gap input without mutating the source selection',
        includeInFull: false
    },
    {
        id: 'step_repeat_symbol_creates_instances',
        moduleId: 'step_repeat_symbol',
        scope: 'module',
        description: 'step repeat symbol creates a symbol definition and linked instances on the active artboard',
        includeInFull: false
    },
    {
        id: 'add_camera_marks_invalid_target',
        moduleId: 'add_camera_marks',
        scope: 'module',
        description: 'camera marks invalid target fails before drawing or creating a layer',
        includeInFull: false
    },
    {
        id: 'add_camera_marks_manual_multi_artboard',
        moduleId: 'add_camera_marks',
        scope: 'module',
        description: 'camera marks command supports manual multi-artboard line and round profiles together',
        enabled: false
    },
    {
        id: 'add_camera_marks_smart_all_artboards',
        moduleId: 'add_camera_marks',
        scope: 'module',
        description: 'smart line camera marks support all-artboard targeting from one selection size',
        includeInFull: false,
        includeInModule: false
    },
    {
        id: 'quarantine_module_visibility',
        moduleId: null,
        scope: 'shell',
        description: 'quarantined module stays visible, disabled, and blocked before host execution'
    }
];

function createSmokeScenarioLookup() {
    return smokeScenarioRegistry.reduce((lookup, scenario) => {
        lookup[scenario.id] = scenario;
        return lookup;
    }, {});
}

module.exports = {
    smokeScenarioRegistry,
    createSmokeScenarioLookup
};
