/*
    🌟 CORE BOOTSTRAPPER
    ================================================================================
    📜 MODULAR ARCHITECTURE ROADMAP & SOP
    Reference: [.agent/plans/modular_architecture_risk_and_roadmap.md]
    Protocol: CORE_LOADER
    ================================================================================
    Responsibility: 
    1. Initialize Namespace ($._imposition).
    2. Load Domain Logic (Math).
    3. Load Satellite Modules.
*/

(function () {
    // 1. NAMESPACE
    if (typeof $._imposition === 'undefined') {
        $._imposition = {};
    }

    // Flag để tránh load lại nhiều lần không cần thiết
    //if ($._imposition.isLoaded) return;

    $.writeln(">>> CORE BOOTSTRAP INITIATED <<<");

    try {
        var thisFile = new File($.fileName);
        // Path logic: features/ -> jsx/ -> cep/
        var cepRoot = thisFile.parent.parent.parent;
        var modPath = thisFile.parent + "/imposition_modules/";

        // 2. LOAD DOMAIN MATH (Critical)
        var domainFile = new File(cepRoot + "/js/domain/domain_core.js");
        if (domainFile.exists) {
            $.evalFile(domainFile);
        } else {
            throw new Error("Core Error: Missing domain_core.js");
        }

        // 3. LOAD MODULES
        var load = function (f) {
            var file = new File(modPath + f);
            if (file.exists) {
                $.evalFile(file);
            } else {
                throw new Error("Core Error: Missing module " + f);
            }
        };

        load("core_loader.jsx");
        load("mod_preflight.jsx");     // SRP: Selection bounds detection
        load("mod_cleanup.jsx");
        load("mod_color.jsx");
        load("mod_resize.jsx");        // SRP: Resize logic
        load("mod_yield_guides.jsx");  // SRP: Yield guide drawing
        load("mod_sheet_guides.jsx");  // SRP: Sheet guide drawing
        load("mod_symbol.jsx");
        load("mod_marks.jsx");
        load("mod_layout.jsx");
        load("mod_rotate.jsx");        // Post-layout (Tech Debt)

        // Mark as loaded
        $._imposition.isLoaded = true;
        $.writeln(">>> CORE LOADED SUCCESSFULLY <<<");

    } catch (e) {
        alert("CORE BOOTSTRAP FAILED: " + e.message);
    }
})();