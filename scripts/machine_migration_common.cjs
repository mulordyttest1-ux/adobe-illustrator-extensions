const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CONTRACT_VERSION = 1;

function parseCliArgs(argv, definition) {
    const booleanFlags = new Set(definition.boolean || []);
    const valueFlags = new Set(definition.value || []);
    const result = {};

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (!token.startsWith('--')) {
            throw new Error(`Unexpected positional argument: ${token}`);
        }

        const equalsIndex = token.indexOf('=');
        const key = equalsIndex === -1 ? token.slice(2) : token.slice(2, equalsIndex);
        const inlineValue = equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1);

        if (booleanFlags.has(key)) {
            if (inlineValue !== undefined) {
                throw new Error(`Boolean flag --${key} does not accept a value.`);
            }
            result[key] = true;
            continue;
        }

        if (!valueFlags.has(key)) {
            throw new Error(`Unknown flag: --${key}`);
        }

        const value = inlineValue === undefined ? argv[index + 1] : inlineValue;
        if (value === undefined || value.startsWith('--')) {
            throw new Error(`Flag --${key} requires a value.`);
        }
        result[key] = value;
        if (inlineValue === undefined) {
            index += 1;
        }
    }

    return result;
}

function run(command, args, options = {}) {
    const encoding = Object.prototype.hasOwnProperty.call(options, 'encoding') ? options.encoding : 'utf8';
    let executable = command;
    let resolvedArgs = args || [];
    if (process.platform === 'win32' && ['npm', 'npx'].includes(command)) {
        const bundledScript = command === 'npm' ? 'npm-cli.js' : 'npx-cli.js';
        const envScript = command === 'npm' ? process.env.npm_execpath : null;
        const cliScript = envScript && fs.existsSync(envScript)
            ? envScript
            : path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', bundledScript);
        if (fs.existsSync(cliScript)) {
            executable = process.execPath;
            resolvedArgs = [cliScript, ...resolvedArgs];
        }
    }
    const result = childProcess.spawnSync(executable, resolvedArgs, {
        cwd: options.cwd || REPO_ROOT,
        encoding,
        env: options.env || process.env,
        input: options.input,
        stdio: options.stdio || (encoding === null ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe']),
        windowsHide: true
    });

    if (result.error && !options.allowFailure) {
        throw result.error;
    }
    if (typeof result.status === 'number' && result.status !== 0 && !options.allowFailure) {
        const stderr = encoding === null
            ? Buffer.from(result.stderr || Buffer.alloc(0)).toString('utf8').trim()
            : String(result.stderr || '').trim();
        throw new Error(`${command} ${(args || []).join(' ')} failed (${result.status})${stderr ? `: ${stderr}` : ''}`);
    }

    return result;
}

function commandAvailable(command, deps = {}) {
    const runFn = deps.run || run;
    const probe = process.platform === 'win32' ? ['where.exe', [command]] : ['sh', ['-lc', `command -v ${command}`]];
    const result = runFn(probe[0], probe[1], { allowFailure: true });
    return !result.error && result.status === 0;
}

function makeCheck(id, status, message, remediation = '', severity = 'required') {
    return {
        id,
        status,
        severity,
        message,
        remediation
    };
}

function summarizeChecks(checks) {
    if (checks.some((check) => check.status === 'FAIL')) {
        return 'fail';
    }
    if (checks.some((check) => check.status === 'WARN')) {
        return 'warn';
    }
    return 'pass';
}

function ensureDir(targetPath) {
    fs.mkdirSync(targetPath, { recursive: true });
}

function writeJson(targetPath, value) {
    ensureDir(path.dirname(targetPath));
    fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function copyPath(sourcePath, targetPath) {
    const stat = fs.lstatSync(sourcePath);
    if (stat.isDirectory()) {
        ensureDir(targetPath);
        fs.readdirSync(sourcePath).forEach((entry) => {
            copyPath(path.join(sourcePath, entry), path.join(targetPath, entry));
        });
        return;
    }

    ensureDir(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
}

function listFilesRecursive(rootPath) {
    if (!fs.existsSync(rootPath)) {
        return [];
    }

    const results = [];
    const visit = (currentPath) => {
        const stat = fs.lstatSync(currentPath);
        if (stat.isDirectory()) {
            fs.readdirSync(currentPath).forEach((entry) => visit(path.join(currentPath, entry)));
            return;
        }
        results.push(currentPath);
    };
    visit(rootPath);
    return results;
}

function isSensitivePath(relativePath) {
    const normalized = String(relativePath || '').replace(/\\/g, '/').toLowerCase();
    const baseName = path.posix.basename(normalized);
    if (baseName === '.env' || baseName.startsWith('.env.')) {
        return true;
    }
    if (['auth.json', 'credentials.json', 'id_rsa', 'id_ed25519'].includes(baseName)) {
        return true;
    }
    if (/\.(pem|pfx|p12|key|keystore)$/.test(baseName)) {
        return true;
    }
    return /(^|[._-])(password|passwd|secret|token|credential)([._-]|$)/.test(baseName);
}

function isExcludedMachineDataPath(relativePath) {
    const normalized = String(relativePath || '').replace(/\\/g, '/').toLowerCase();
    const parts = normalized.split('/');
    if (parts.includes('.nx')) {
        return true;
    }
    if (parts.some((part) => ['cache', 'caches', '.cache', 'logs', 'sessions', 'plugin-cache', 'marketplace-cache'].includes(part))) {
        return true;
    }
    return /\.(?:log|sqlite|sqlite3|db)(?:-(?:shm|wal))?$/.test(normalized);
}

const SECRET_PATTERNS = [
    { name: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { name: 'openai-key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { name: 'github-token', pattern: /\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/ },
    { name: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
    { name: 'secret-assignment', pattern: /(?:password|passwd|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\r\n]{12,}["']/i }
];

function scanTextForSecrets(text) {
    const value = String(text || '');
    return SECRET_PATTERNS.filter((entry) => entry.pattern.test(value)).map((entry) => entry.name);
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex').toUpperCase();
}

function timestamp(date = new Date()) {
    const pad = (value) => String(value).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        '-',
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
    ].join('');
}

function find7Zip(options = {}) {
    const candidates = [
        options.explicitPath,
        process.env.SEVEN_ZIP,
        path.join(process.env.ProgramFiles || '', '7-Zip', '7z.exe'),
        path.join(process.env.TEMP || os.tmpdir(), 'codex-machine-migration-tools', '7zr.exe'),
        '7z',
        '7zz'
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
            return candidate;
        }
        if (!path.isAbsolute(candidate) && commandAvailable(candidate)) {
            return candidate;
        }
    }
    throw new Error('7-Zip was not found. Install 7-Zip or set SEVEN_ZIP to 7z.exe/7zz.');
}

function assertEmptyTarget(targetPath) {
    if (!fs.existsSync(targetPath)) {
        return;
    }
    if (!fs.statSync(targetPath).isDirectory()) {
        throw new Error(`Restore target exists and is not a directory: ${targetPath}`);
    }
    if (fs.readdirSync(targetPath).length > 0) {
        throw new Error(`Restore target must be empty: ${targetPath}`);
    }
}

module.exports = {
    CONTRACT_VERSION,
    REPO_ROOT,
    assertEmptyTarget,
    commandAvailable,
    copyPath,
    ensureDir,
    find7Zip,
    isExcludedMachineDataPath,
    isSensitivePath,
    listFilesRecursive,
    makeCheck,
    parseCliArgs,
    run,
    scanTextForSecrets,
    sha256File,
    summarizeChecks,
    timestamp,
    writeJson
};
