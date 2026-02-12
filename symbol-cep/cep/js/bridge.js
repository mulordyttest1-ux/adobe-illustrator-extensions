window.Bridge = class Bridge {
    constructor() {
        this.cs = new CSInterface();
        this.hostRoot = this.cs.getSystemPath(CSInterface.EXTENSION) + "/jsx/";
    }

    /**
     * Test connection to Host Script
     */
    async testConnection() {
        return new Promise((resolve) => {
            try {
                // Ensure host script is loaded
                this.cs.evalScript(`$.evalFile("${this.hostRoot}host.jsx")`);

                // Ping
                this.cs.evalScript("$._host.ping()", (res) => {
                    resolve(res === "pong");
                });
            } catch (e) {
                console.error("Bridge Connection Failed:", e);
                resolve(false);
            }
        });
    }

    /**
     * Generic Eval Helper
     */
    eval(script) {
        return new Promise((resolve, reject) => {
            this.cs.evalScript(script, (res) => {
                if (res && res.startsWith("ReferenceError")) {
                    reject(res);
                } else {
                    resolve(res);
                }
            });
        });
    }
};
