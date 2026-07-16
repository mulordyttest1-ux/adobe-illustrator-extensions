/**
 * MODULE: GroupCheckRule
 * LAYER: Application / Plugins (L3)
 * PURPOSE: Preflight check to verify selection before running imposition.
 *
 * Dialog text is Base64-encoded in JS and decoded in JSX so it survives
 * the CEP evalScript pipeline without Unicode corruption.
 */

import { UIFeedback } from '@shared/cep-ui';
import { parseBase64JsonUtf8 } from '../../bridge_codec.js';
import { impositionCopy } from '../../imposition_copy.js';

function _b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function showFailureToast(message) {
  UIFeedback.showToast(message, 'error');
}

function buildDialogPayload() {
  const groupCopy = impositionCopy.preflight.groupCheck;
  return {
    title: _b64(groupCopy.title),
    message: _b64(groupCopy.message),
    primary: _b64(groupCopy.primary),
    secondary: _b64(groupCopy.secondary),
    cancel: _b64(groupCopy.cancel),
  };
}

function isEvalScriptError(resRaw) {
  return (
    typeof resRaw === 'string' && resRaw.toLowerCase().startsWith('evalscript')
  );
}

function parseResult(resRaw) {
  try {
    return parseBase64JsonUtf8(resRaw);
  } catch (error) {
    console.error('[GroupCheck] Failed to parse payload:', error, resRaw);
    return null;
  }
}

function markAutoGrouped(context, result) {
  if (!context) {
    return;
  }

  context.autoGrouped = true;
  context.autoGroupName = result.autoGroupName || null;
}

function handleResult(result, context) {
  switch (result.result) {
    case 'single_group':
      console.log('[GroupCheck] Single group - OK.');
      return true;

    case 'auto_grouped':
      console.log('[GroupCheck] Auto-grouped - will ungroup after run.');
      markAutoGrouped(context, result);
      return true;

    case 'proceed_multi':
      console.log('[GroupCheck] Multi-object (intentional).');
      return true;

    case 'cancel':
      console.log('[GroupCheck] Cancelled.');
      return false;

    case 'empty':
      UIFeedback.showToast(
        impositionCopy.preflight.groupCheck.emptySelection,
        'warning',
      );
      return false;

    default:
      console.warn('[GroupCheck] Unknown result:', result.result);
      return false;
  }
}

export const GroupCheckRule = {
  async run({ bridge, hostGateway }, context) {
    try {
      const dialog = buildDialogPayload();
      const resRaw =
        hostGateway && typeof hostGateway.showGroupCheckDialog === 'function'
          ? await hostGateway.showGroupCheckDialog(dialog)
          : await bridge.eval(
              `$.global.Bridge.showGroupCheckDialog("${dialog.title}","${dialog.message}","${dialog.primary}","${dialog.secondary}","${dialog.cancel}")`,
            );

      if (isEvalScriptError(resRaw)) {
        console.error(
          '[GroupCheck] showGroupCheckDialog EvalScript error - panel reload required?',
        );
        showFailureToast(impositionCopy.preflight.groupCheck.checkUnavailable);
        return false;
      }

      const result = parseResult(resRaw);
      if (!result) {
        showFailureToast(impositionCopy.preflight.groupCheck.checkUnavailable);
        return false;
      }

      if (!result.success) {
        UIFeedback.showToast(
          `${impositionCopy.preflight.groupCheck.selectionError}: ${result.error}`,
          'error',
        );
        return false;
      }

      return handleResult(result, context);
    } catch (error) {
      console.error('[GroupCheck] Exception:', error);
      showFailureToast(impositionCopy.preflight.groupCheck.checkUnavailable);
      return false;
    }
  },
};
