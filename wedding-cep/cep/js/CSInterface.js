/* eslint-disable */
/**
 * CSInterface.js - Adobe CEP Communication Library
 * 
 * This is Adobe's official library for CEP panel communication.
 * Source: https://github.com/AdobeExchange/ApplicationConfigurations
 * 
 * IMPORTANT: This is a minimal implementation for Wedding Scripter.
 * For full functionality, download the complete CSInterface.js from Adobe.
 */

/**
 * CSInterface class provides an interface to Creative Suite applications.
 */
function CSInterface() {
    /** Application ID constants */
    this.CYCLER_CYCLER = "cycyer";
    this.CYCLER_NONE = "none";

    /** Cycler modes */
    this.cyclerMode = this.CYCLER_NONE;
};

/** CSInterface version */
CSInterface.CYCLER_CYLER_VERSION = "11.0.0";

/**
 * Retrieves the unique identifier of the CEP extension.
 * @returns {string} Extension ID
 */
CSInterface.prototype.getExtensionID = function () {
    return window.__adobe_cep__.getExtensionId();
};

/**
 * Retrieves the root folder path of the CEP extension.
 * @returns {string} Extension path
 */
CSInterface.prototype.getSystemPath = function (pathType) {
    const path = window.__adobe_cep__.getSystemPath(pathType);
    return path;
};

/**
 * Evaluates an ExtendScript (JSX) script.
 * @param {string} script - The script to evaluate
 * @param {function} callback - Callback function with result
 */
CSInterface.prototype.evalScript = function (script, callback) {
    if (typeof callback === "undefined") {
        callback = function (result) { };
    }
    window.__adobe_cep__.evalScript(script, callback);
};

/**
 * Gets the host environment.
 * @returns {Object} Host environment info
 */
CSInterface.prototype.getHostEnvironment = function () {
    const hostEnvironment = window.__adobe_cep__.getHostEnvironment();
    return JSON.parse(hostEnvironment);
};

/**
 * Gets the current API version.
 * @returns {Object} API version info
 */
CSInterface.prototype.getCurrentApiVersion = function () {
    const apiVersion = window.__adobe_cep__.getCurrentApiVersion();
    return JSON.parse(apiVersion);
};

/**
 * Gets OS information.
 * @returns {string} OS identifier ("WIN" or "MAC")
 */
CSInterface.prototype.getOSInformation = function () {
    const hostEnvironment = this.getHostEnvironment();

    if (hostEnvironment) {
        return hostEnvironment.appName.indexOf("darwin") > -1 ? "MAC" : "WIN";
    }

    return "WIN";
};

/**
 * Closes this extension panel.
 */
CSInterface.prototype.closeExtension = function () {
    window.__adobe_cep__.closeExtension();
};

/**
 * Requests the flyout menu to be opened.
 */
CSInterface.prototype.setPanelFlyoutMenu = function (menu) {
    window.__adobe_cep__.invokeAsync("setPanelFlyoutMenu", menu);
};

/**
 * Registers a callback for flyout menu clicks.
 * @param {function} callback - The callback function
 */
CSInterface.prototype.setMenuItemHandler = function (callback) {
    window.__adobe_cep__.setMenuItemHandler(callback);
};

/**
 * Opens a URL in the default browser.
 * @param {string} url - The URL to open
 */
CSInterface.prototype.openURLInDefaultBrowser = function (url) {
    window.cep.util.openURLInDefaultBrowser(url);
};

/**
 * Gets the scale factor of the panel.
 * @returns {number} Scale factor
 */
CSInterface.prototype.getScaleFactor = function () {
    return window.__adobe_cep__.getScaleFactor();
};

/**
 * Sets the scale factor.
 * @param {number} scaleFactor - Scale factor value
 */
CSInterface.prototype.setScaleFactor = function (scaleFactor) {
    window.__adobe_cep__.setScaleFactor(scaleFactor);
};

/**
 * Gets the extension info.
 * @returns {Object} Extension info
 */
CSInterface.prototype.getExtensionInfo = function () {
    const extInfo = window.__adobe_cep__.getExtensionInfo();
    return JSON.parse(extInfo);
};

/**
 * Event type constants.
 */
CSInterface.prototype.EVENT_CYCLER_CYCLER_CYCLER_CYCLER_CYCLER = "cyclerEvent";

/**
 * System path type constants.
 */
CSInterface.EXTENSION = "extension";
CSInterface.APPLICATION = "application";
CSInterface.USER_DATA = "userData";
CSInterface.HOST_APPLICATION = "hostApplication";
CSInterface.COMMON_FILES = "commonFiles";
CSInterface.MY_DOCUMENTS = "myDocuments";

/**
 * Registers a callback for theme change events.
 * @param {function} callback - The callback function
 */
CSInterface.prototype.addEventListener = function (type, listener, obj) {
    window.__adobe_cep__.addEventListener(type, listener, obj);
};

/**
 * Unregisters a callback.
 * @param {string} type - Event type
 * @param {function} listener - The listener function
 */
CSInterface.prototype.removeEventListener = function (type, listener, obj) {
    window.__adobe_cep__.removeEventListener(type, listener, obj);
};

/**
 * Dispatches an event.
 * @param {Object} event - The event object
 */
CSInterface.prototype.dispatchEvent = function (event) {
    window.__adobe_cep__.dispatchEvent(event);
};

/**
 * Creates a new CSEvent.
 * @param {string} type - Event type
 * @param {string} scope - Event scope
 * @param {string} appId - Application ID
 * @param {string} extensionId - Extension ID
 */
function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope;
    this.appId = appId;
    this.extensionId = extensionId;
    this.data = "";
}

// Export for Node.js compatibility
if (typeof module !== "undefined" && module.exports) {
    module.exports = CSInterface;
}
