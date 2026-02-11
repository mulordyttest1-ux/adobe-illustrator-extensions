const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 1. Read Config
const configPath = path.join(__dirname, '../cep.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const BUNDLE_ID = config.project.id;

// 2. Define Paths
const SOURCE_PATH = path.join(__dirname, '../cep');
const HOME_DIR = os.homedir();

let targetDir = '';
if (process.platform === 'win32') {
    targetDir = path.join(HOME_DIR, 'AppData/Roaming/Adobe/CEP/extensions');
} else {
    targetDir = path.join(HOME_DIR, 'Library/Application Support/Adobe/CEP/extensions');
}

const DEST_PATH = path.join(targetDir, BUNDLE_ID);

// 3. Execution
console.log(`🚀 Installing Symlink for ${BUNDLE_ID}...`);
console.log(`   Source: ${SOURCE_PATH}`);
console.log(`   Target: ${DEST_PATH}`);

// Create CEP folder if missing
if (!fs.existsSync(targetDir)) {
    console.log('   Creating CEP extensions directory...');
    fs.mkdirSync(targetDir, { recursive: true });
}

// Remove old link/folder if exists
if (fs.existsSync(DEST_PATH)) {
    console.log('   Removing existing link...');
    try {
        // Windows Junction removal might need rmdir
        if (fs.lstatSync(DEST_PATH).isSymbolicLink() || (fs.statSync(DEST_PATH).isDirectory())) {
            fs.rmSync(DEST_PATH, { recursive: true, force: true });
        }
    } catch (e) {
        console.error('   Warning: Could not remove old link. Try running as Admin.', e.message);
    }
}

// Create Symlink (Junction on Windows is safer for non-admin)
try {
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(SOURCE_PATH, DEST_PATH, type);
    console.log('✅ Success! Extension installed in Developer Mode.');
} catch (e) {
    console.error('❌ Error creating symlink:', e.message);
    console.log('💡 Try running this script as Administrator.');
    process.exit(1);
}
