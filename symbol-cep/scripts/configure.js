/**
 * CONFIGURATOR (Script cấu hình tự động)
 * Chạy bằng Node.js: node scripts/configure.js [env]
 */

const fs = require('fs');
const path = require('path');

// 1. Đọc Arguments
const env = process.argv[2] || 'development';
console.log(`🛠️  Đang cấu hình cho môi trường: ${env.toUpperCase()}`);

// 2. Đọc Config 
const configPath = path.join(__dirname, '../cep.config.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ Không tìm thấy cep.config.json!');
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 3. Generate Manifest.xml
const manifestTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="7.0" ExtensionBundleId="${config.project.id}" ExtensionBundleVersion="${config.project.version}" ExtensionBundleName="${config.project.name}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <ExtensionList>
        <Extension Id="${config.project.id}.panel" Version="${config.project.version}"/>
    </ExtensionList>
    <ExecutionEnvironment>
        <HostList>
            ${config.build.hosts.map(h => `<Host Name="${h.name}" Version="${h.version}"/>`).join('\n            ')}
        </HostList>
        <LocaleList>
            <Locale Code="All"/>
        </LocaleList>
        <RequiredRuntimeList>
            <RequiredRuntime Name="CSXS" Version="${config.build.cepVersion}"/>
        </RequiredRuntimeList>
    </ExecutionEnvironment>
    <DispatchInfoList>
        <Extension Id="${config.project.id}.panel">
            <DispatchInfo>
                <Resources>
                    <MainPath>./index.html</MainPath>
                    <ScriptPath>./jsx/host.jsx</ScriptPath>
                    <CEFCommandLine>
                        <Parameter>--enable-nodejs</Parameter>
                        <Parameter>--enable-media-stream</Parameter>
                    </CEFCommandLine>
                </Resources>
                <Lifecycle>
                    <AutoVisible>true</AutoVisible>
                </Lifecycle>
                <UI>
                    <Type>Panel</Type>
                    <Menu>${config.project.name}</Menu>
                    <Geometry>
                        <Size><Height>${config.extension.height}</Height><Width>${config.extension.width}</Width></Size>
                        <MinSize><Height>${config.extension.minHeight}</Height><Width>${config.extension.minWidth}</Width></MinSize>
                        <MaxSize><Height>${config.extension.maxHeight}</Height><Width>${config.extension.maxWidth}</Width></MaxSize>
                    </Geometry>
                </UI>
            </DispatchInfo>
        </Extension>
    </DispatchInfoList>
</ExtensionManifest>`;

const manifestPath = path.join(__dirname, '../cep/CSXS/manifest.xml');
// Đảm bảo thư mục tồn tại
const csxsDir = path.dirname(manifestPath);
if (!fs.existsSync(csxsDir)) fs.mkdirSync(csxsDir, { recursive: true });

fs.writeFileSync(manifestPath, manifestTemplate);
console.log('✅ Đã tạo manifest.xml');

// 4. Generate .debug file
const debugConfig = config.env[env] || config.env['development'];
const debugPort = debugConfig.debugPort || 8088;
const debugContent = `<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="${config.project.id}.panel">
        <HostList>
            ${config.build.hosts.map(h => `<Host Name="${h.name}" Port="${debugPort}"/>`).join('\n            ')}
        </HostList>
    </Extension>
</ExtensionList>`;

fs.writeFileSync(path.join(__dirname, '../cep/.debug'), debugContent);
console.log(`✅ Đã tạo .debug (Port: ${debugPort})`);

// 5. Generate Runtime Config (js/config.js)
const runtimeConfig = {
    env: env,
    ...debugConfig
};

const jsConfigContent = `/**
 * Config được sinh tự động bởi scripts/configure.js
 * ĐỪNG SỬA FILE NÀY TRỰC TIẾP
 */
export default ${JSON.stringify(runtimeConfig, null, 4)};`;

fs.writeFileSync(path.join(__dirname, '../cep/js/config.js'), jsConfigContent);
console.log('✅ Đã tạo js/config.js');

console.log('🎉 Cấu hình hoàn tất!');
