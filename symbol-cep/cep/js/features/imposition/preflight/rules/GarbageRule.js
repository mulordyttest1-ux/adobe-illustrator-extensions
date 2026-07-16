/**
 * MODULE: GarbageRule
 * LAYER: Application / Plugins (L3)
 * PURPOSE: Check for unselected page items and prompt for cleanup.
 * DEPENDENCIES: Bridge
 * SIDE EFFECTS: DOM (confirm dialog), Bridge calls to JSX
 * EXPORTS: GarbageRule instance
 */

import { UIFeedback } from '@shared/cep-ui';
import { parseBase64JsonUtf8 } from '../../bridge_codec.js';
import { impositionCopy } from '../../imposition_copy.js';

function showFailureToast(message) {
    UIFeedback.showToast(message, 'error');
}

export const GarbageRule = {
    // eslint-disable-next-line complexity
    async run({ bridge, hostGateway, notifier }, _context) {
        try {
            // 1. Check for garbage
            const resRaw = hostGateway && typeof hostGateway.checkArtboardGarbage === 'function'
                ? await hostGateway.checkArtboardGarbage()
                : await bridge.eval('$.global.Bridge.checkArtboardGarbage()');
            console.log(">>> resRaw dump:", resRaw);

            if (typeof resRaw === 'string' && resRaw.toLowerCase().startsWith("evalscript")) {
                console.error("[Preflight] checkArtboardGarbage threw an EvalScript error. Ensure `checkArtboardGarbage` exists in bridge.jsx");
                showFailureToast(impositionCopy.preflight.garbage.checkUnavailable);
                return false;
            }

            let res;
            try {
                res = parseBase64JsonUtf8(resRaw);
            } catch (e) {
                console.error("[Preflight] Failed to parse checkArtboardGarbage payload:", e, resRaw);
                showFailureToast(impositionCopy.preflight.garbage.checkUnavailable);
                return false;
            }

            if (!res.success) {
                console.error("[Preflight] checkArtboardGarbage failed:", res.error);
                showFailureToast(impositionCopy.preflight.garbage.checkUnavailable);
                return false; // Safely halt if error
            }

            // 2. No garbage found -> Safe to proceed
            if (!res.hasGarbage) {
                return true;
            }

            // 3. Garbage found -> Prompt user
            console.log("-> Garbage found. Showing confirm dialog natively...");
            const msg = impositionCopy.preflight.garbage.confirmMessage(res.count);

            const confirmRaw = await bridge.eval(`confirm("${msg}", false, "${impositionCopy.preflight.garbage.title}")`);
            const confirmed = confirmRaw === 'true'; // eval script returns 'true' or 'false' string

            if (!confirmed) {
                return false; // Halt execution, let user sort it out
            }

            // 4. User agreed -> Clear garbage
            const clearResRaw = hostGateway && typeof hostGateway.clearArtboardGarbage === 'function'
                ? await hostGateway.clearArtboardGarbage()
                : await bridge.eval('$.global.Bridge.clearArtboardGarbage()');
            if (typeof clearResRaw === 'string' && clearResRaw.toLowerCase().startsWith("evalscript")) {
                console.error("[Preflight] clearArtboardGarbage threw an EvalScript error.");
                showFailureToast(impositionCopy.preflight.garbage.clearUnavailable);
                return false;
            }

            let clearRes;
            try {
                clearRes = parseBase64JsonUtf8(clearResRaw);
            } catch (e) {
                console.error("[Preflight] Failed to parse clearArtboardGarbage payload:", e, clearResRaw);
                showFailureToast(impositionCopy.preflight.garbage.clearUnavailable);
                return false;
            }

            if (!clearRes.success) {
                console.error("[Preflight] clearArtboardGarbage failed:", clearRes.error);
                (notifier || UIFeedback).showToast(`${impositionCopy.preflight.garbage.clearError}: ${clearRes.error}`, 'error');
                return false;
            }

            console.log(`[Preflight] Cleared ${clearRes.deleted} garbage items.`);
            return true; // Safe to proceed now that garbage is removed

        } catch (error) {
            console.error("[Preflight] GarbageRule Exception:", error);
            showFailureToast(impositionCopy.preflight.garbage.unavailable);
            return false;
        }
    }
};
