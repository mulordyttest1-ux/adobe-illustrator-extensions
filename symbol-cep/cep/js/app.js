// App Entry Point (No Modules)
window.Imposition = window.Imposition || {};

const App = {
    init: function () {
        console.log("🚀 App Booting...");

        // Host Connection Check
        const csInterface = new CSInterface();

        // Status Update
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = 'Ready';
            statusEl.style.color = '#34C759';
        }

        // Init Features (Global Namespace)
        if (window.Imposition.actionTab) {
            window.Imposition.actionTab.init('action-container');
        }
        if (window.Imposition.configTab) {
            window.Imposition.configTab.init('config-container');
        }

        // Load Host Logic
        // Note: CSInterface evalScript uses strict paths usually, but evalFile is safer with absolute path
        const extensionRoot = csInterface.getSystemPath(CSInterface.EXTENSION) + "/jsx/";
        csInterface.evalScript('$.evalFile("' + extensionRoot + 'host.jsx")');

        console.log('✅ App Initialized');
    }
};

// Global Exposure
window.App = App;

// Auto-boot
document.addEventListener('DOMContentLoaded', App.init);
