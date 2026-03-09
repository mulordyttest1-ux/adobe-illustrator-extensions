/**
 * MODULE: GarbageRule
 * LAYER: Application / Plugins (L3)
 * PURPOSE: Check for unselected page items and prompt for cleanup.
 * DEPENDENCIES: Bridge
 * SIDE EFFECTS: DOM (confirm dialog), Bridge calls to JSX
 * EXPORTS: GarbageRule instance
 */

export const GarbageRule = {
    async run({ bridge }) {
        try {
            // 1. Check for garbage
            const resRaw = await bridge.eval('$.global.Bridge.checkArtboardGarbage()');
            console.log(">>> resRaw dump:", resRaw);

            if (typeof resRaw === 'string' && resRaw.toLowerCase().startsWith("evalscript")) {
                console.error("[Preflight] checkArtboardGarbage threw an EvalScript error. Ensure `checkArtboardGarbage` exists in bridge.jsx");
                return false;
            }

            let res;
            try {
                res = JSON.parse(window.atob(resRaw));
            } catch (e) {
                console.error("[Preflight] Failed to parse checkArtboardGarbage payload:", e, resRaw);
                return false;
            }

            if (!res.success) {
                console.error("[Preflight] checkArtboardGarbage failed:", res.error);
                return false; // Safely halt if error
            }

            // 2. No garbage found -> Safe to proceed
            if (!res.hasGarbage) {
                return true;
            }

            // 3. Garbage found -> Prompt user
            console.log("-> Garbage found. Showing confirm dialog natively...");
            const msg = `Cảnh báo: Phát hiện ${res.count} cụm vật thể (rác) đang không được chọn trên Artboard.\\n\\nNếu tiếp tục, file ghép sẽ đè lên đống rác này gây hỏng bản in.\\n\\nBạn có muốn tự động XÓA RÁC để tiếp tục không?`;

            const confirmRaw = await bridge.eval(`confirm("${msg}", false, "Preflight Checker")`);
            const confirmed = confirmRaw === 'true'; // eval script returns 'true' or 'false' string

            if (!confirmed) {
                return false; // Halt execution, let user sort it out
            }

            // 4. User agreed -> Clear garbage
            const clearResRaw = await bridge.eval('$.global.Bridge.clearArtboardGarbage()');
            if (typeof clearResRaw === 'string' && clearResRaw.toLowerCase().startsWith("evalscript")) {
                console.error("[Preflight] clearArtboardGarbage threw an EvalScript error.");
                return false;
            }

            let clearRes;
            try {
                clearRes = JSON.parse(window.atob(clearResRaw));
            } catch (e) {
                console.error("[Preflight] Failed to parse clearArtboardGarbage payload:", e, clearResRaw);
                return false;
            }

            if (!clearRes.success) {
                console.error("[Preflight] clearArtboardGarbage failed:", clearRes.error);
                window.alert("Lỗi khi xóa rác: " + clearRes.error);
                return false;
            }

            console.log(`[Preflight] Cleared ${clearRes.deleted} garbage items.`);
            return true; // Safe to proceed now that garbage is removed

        } catch (error) {
            console.error("[Preflight] GarbageRule Exception:", error);
            return false;
        }
    }
};
