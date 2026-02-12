/**
 * Bridge.js - Communication Layer (Base64 & TextDecoder)
 * Fixes: Invalid JSON, URI Malformed, UTF-8 issues
 */
export class Bridge {
    constructor() {
        this.cs = new CSInterface();
        this.isConnected = typeof window.__adobe_cep__ !== 'undefined';

    }

    // --- GIẢI MÃ AN TOÀN (Dùng TextDecoder chuẩn của Chromium) ---
    _decodeResult(base64Str) {
        if (!base64Str) return null;
        try {
            console.log('[Bridge] Decoding Base64 (len):', base64Str.length);
            // 1. Base64 -> Binary String
            const binaryString = window.atob(base64Str);
            // 2. Binary String -> Uint8Array
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // 3. Uint8Array -> UTF-8 String
            const decoder = new TextDecoder('utf-8');
            let jsonStr = decoder.decode(bytes);

            // SANITIZE: Remove DOM (FEFF) and trim whitespace
            jsonStr = jsonStr.replace(/^\uFEFF/, '').trim();

            const parsed = JSON.parse(jsonStr);
            console.log('[Bridge] Decoded JSON:', parsed);
            return parsed;
        } catch (e) {
            console.error('[Bridge] Decode failed:', e.message);
            return { success: false, error: "Decode failed: " + e.message };
        }
    }

    _escape(str) {
        if (typeof str !== 'string') str = JSON.stringify(str);
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    async call(fnName, data = {}) {
        if (!this.isConnected) return { success: false, error: 'CEP not connected' };

        return new Promise((resolve) => {
            let script;
            if (Object.keys(data).length > 0) {
                const jsonArg = this._escape(JSON.stringify(data));
                script = `IllustratorBridge.${fnName}('${jsonArg}')`;
            } else {
                script = `IllustratorBridge.${fnName}()`;
            }

            console.log('[Bridge] Calling JSX:', script);
            this.cs.evalScript(script, (result) => {
                console.log('[Bridge] JSX Result received (len):', result ? result.length : 0);
                // Nếu lỗi từ Adobe hoặc trả về rỗng
                if (!result || result === 'EvalScript error.' || result === 'undefined') {
                    console.error('[Bridge] EvalScript Error:', result);
                    resolve({ success: false, error: "ExtendScript Error" });
                    return;
                }

                // Giải mã Base64
                const decoded = this._decodeResult(result);
                resolve(decoded || { success: false, error: "Empty response" });
            });
        });
    }

    // --- API Methods ---
    async testConnection() { return this.call('ping').then(r => r && r.success); }
    // [STATELESS] Use new metadata-aware scanner
    async scanDocument(mode = "auto") { return this.call('scanWithMetadata', { mode }); }
    async updateCard(data) { return this.call('updateCard', data); }
    async collectFrames() { return this.call('collectFrames'); }
    async applyPlan(plans) { return this.call('applyPlan', plans); }

    // Logic Update thông minh
    async updateWithStrategy(packet) {
        try {
            // 1. SCAN: Lấy dữ liệu hiện trường từ AI
            const collectResult = await this.collectFrames(); // Gọi scanWithMetadata
            if (!collectResult || !collectResult.success) {
                return { success: false, error: collectResult ? collectResult.error : "Collect failed" };
            }

            const frames = collectResult.data || [];
            if (frames.length === 0) return { success: true, updated: 0, message: 'No frames found' };

            // 2. COMPUTE: Tính toán Strategy (JS Logic)
            if (typeof StrategyOrchestrator === 'undefined') {
                return { success: false, error: 'StrategyOrchestrator missing' };
            }
            const orchestrator = new StrategyOrchestrator();
            const plans = [];

            for (const frame of frames) {
                // [SYNC FIX 1] Map đúng key từ Scanner
                const content = frame.raw_content || frame.content || '';

                // [SYNC FIX 2] Tái tạo Metadata Object cho Logic
                let metadata = null;

                // Logic: Nếu frame có meta_keys, đó là 'managed' (stateful)
                // Nếu không, đó là 'fresh' (null metadata)
                if (frame.meta_keys && frame.meta_keys.length > 0) {
                    metadata = {
                        type: 'stateful',
                        keys: frame.meta_keys,
                        mappings: [] // [FIX] Luôn cung cấp mảng rỗng để tránh lỗi "cannot read property of undefined"
                    };
                } else {
                    metadata = null;
                }

                // Chạy phân tích
                const plan = orchestrator.analyze(content, metadata, packet);
                if (plan && plan.mode !== 'SKIP') {
                    plans.push({ id: frame.id, plan: plan });
                }
            }

            // 3. APPLY: Gửi lệnh cập nhật xuống AI
            if (plans.length > 0) {
                return await this.applyPlan(plans);
            } else {
                return { success: true, updated: 0, message: 'No changes needed' };
            }
        } catch (error) {

            return { success: false, error: error.message };
        }
    }

}

window.bridge = new Bridge();