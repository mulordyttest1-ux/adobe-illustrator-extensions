const path = require("path");
const { spawnSync } = require("child_process");

const workspaceRoot = path.resolve(__dirname, "..");
const env = {
    ...process.env,
    NX_DAEMON: "false",
    NX_ISOLATE_PLUGINS: "false"
};
const result = process.platform === "win32"
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx.cmd nx show projects --verbose"], {
        cwd: workspaceRoot,
        env,
        stdio: "ignore"
    })
    : spawnSync("npx", ["nx", "show", "projects", "--verbose"], {
        cwd: workspaceRoot,
        env,
        stdio: "ignore"
    });

if (result.status !== 0) {
    if (result.error) {
        console.error("[lint] Failed to warm the Nx ProjectGraph:", result.error.message);
    } else {
        console.error("[lint] Failed to warm the Nx ProjectGraph.");
    }

    process.exit(result.status || 1);
}
