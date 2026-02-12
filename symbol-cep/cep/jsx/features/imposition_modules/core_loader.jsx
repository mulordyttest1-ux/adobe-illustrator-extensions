/* 
    🧩 CORE LOADER - IMPOSITION MODULES
    Responsibility: Define Namespace and Helper Utilities.
    Risk: Global Scope Pollution.
    Mitigation: IIFE + Strict Namespace.
*/

(function () {
    // 1. Ensure Namespace Exists
    if (typeof $._imposition === 'undefined') {
        $._imposition = {};
    }

    // 2. Define Module Registry
    if (typeof $._imposition.modules === 'undefined') {
        $._imposition.modules = {};
    }

    // 3. Helper: Safe Module Registration
    // This allows modules to register themselves: 
    // $._imposition.registerModule("cleanup", { run: function()... });
    $._imposition.registerModule = function (name, moduleObj) {
        if ($._imposition.modules[name]) {
            // Warn but allow overwrite (Hot-Swap)
            // $.writeln("⚠️ Overwriting Module: " + name);
        }
        $._imposition.modules[name] = moduleObj;
    };

    // 4. Helper: Dependency Checker (Future Proofing for v2)
    $._imposition.checkDependency = function (name) {
        if (!$._imposition.modules[name]) {
            throw new Error("Missing Dependency: Module [" + name + "] is not loaded.");
        }
    };

})();
