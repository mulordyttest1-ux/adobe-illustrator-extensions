/**
 * Symbol Scripter — Type Definitions (Agent Governance Layer)
 * 
 * PURPOSE: Single Source of Truth for all public APIs.
 * Agent MUST consult this file before calling any function.
 * 
 * Last Updated: 2026-02-12
 */

// ============================================================
// L0: INFRASTRUCTURE — Bridge
// ============================================================

declare class CSInterface {
    getSystemPath(path: any): string;
    evalScript(script: string, callback?: (result: any) => void): void;
    static EXTENSION: string;
}

declare class Bridge {
    cs: CSInterface;
    isConnected: boolean;

    /** Low-level call to JSX. Returns decoded JSON. */
    call(fnName: string, data?: object): Promise<ActionResult>;

    /** Test CEP↔JSX connection */
    testConnection(): Promise<boolean>;
}

interface ActionResult {
    success: boolean;
    error?: string;
    data?: any;
    updated?: number;
    message?: string;
}

// ============================================================
// L1: DOMAIN — Imposition Logic
// ============================================================

declare const ImpositionDomain: {
    PaperSizes: Record<string, { w: number; h: number }>;

    /** Calculates the new Sheet Geometry based on Config */
    calculateSheetGeometry(currentRect: number[], payload: object): {
        rect: number[];
        widthPt: number;
        heightPt: number;
        widthMm: number;
        heightMm: number;
    };

    /** Calculates the Imposition Internal Frame (Finish, Print) */
    calculateFrame(payload: object, contentBounds: { width: number; height: number }): object;

    /** Convert payload to Margin Rules */
    createRulesFromPayload(payload: object): any[];

    /** Calculate final margins from Rules */
    calculateMargins(ruleList: any[]): { top: number; bottom: number; left: number; right: number };

    /** N-Up Grid Layout Calculation */
    calculateNUpLayout(
        artboardRect: number[],
        yieldDim: { w: number; h: number },
        variantCount: number,
        spacing: { x: number; y: number },
        sheetGripper: any,
        headToHead: boolean
    ): Array<{ x: number; y: number; variantIndex: number; row: number; col: number; rotation: number }>;
};

// ============================================================
// GLOBALS
// ============================================================

declare const bridge: Bridge;
declare const showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
