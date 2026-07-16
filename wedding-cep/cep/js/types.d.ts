/**
 * Wedding Scripter - Runtime contract notes.
 *
 * This file documents the stable ambient browser contract that still exists
 * after the import-based runtime cleanup. App modules are no longer expected
 * to be consumed as bare globals from window.
 *
 * Last Updated: 2026-03-23
 */

type ToastType = "success" | "error" | "warning" | "info";

interface ActionResult {
    success: boolean;
    error?: string;
    errorCode?: string;
    data?: any;
    updated?: number;
    selected?: number;
    restored?: boolean;
    cleared?: boolean;
    count?: number;
    message?: string;
    source?: string;
    sessionId?: string | null;
}

interface StrategyPlan {
    mode: "REPLACE" | "SKIP" | "FRESH" | "ATOMIC";
    strategy?: "SmartComplex" | "Fresh";
    reason?: string;
    replacements?: Array<{ key?: string; oldVal?: string; newVal?: string; val?: string }>;
    content?: string;
    meta?: object;
}

interface RawScanItem {
    id: string;
    raw_content: string;
    meta_keys: string[];
}

interface BrokenItem {
    id: string;
    content: string;
    expectedKeys: string[];
    foundValues: string[];
    error: string;
}

interface AnalysisResult {
    healthyMap: Record<string, string>;
    brokenList: BrokenItem[];
}

interface NameParts {
    ten: string;
    lot: string;
    ho_dau: string;
    dau: string;
    full: string;
}

interface ExpandedDate {
    ngay: string;
    thang: string;
    nam: string;
    namyy: string;
    ngay_al: string;
    thang_al: string;
    nam_al: string;
    thu: string;
}

interface InputProcessResult {
    value: string;
    original: string;
    fieldType: string;
    applied: string[];
    warnings: Array<{ message: string; severity: "error" | "warning" }>;
    valid: boolean;
}

type CepReadStrategy = "node-fs" | "cep-fs" | "extendscript";

interface CepHostLike {
    isConnected(): boolean;
    getExtensionRootPath(): string;
    evalScript(script: string): Promise<string>;
    readExtensionText(
        relativePath: string,
        options?: { strategy?: CepReadStrategy }
    ): Promise<{ absolutePath: string; content: string | null }>;
}

interface HostFacadeLike {
    isConnected: boolean;
    testConnection(): Promise<boolean>;
    readExtensionText(
        relativePath: string,
        options?: { strategy?: CepReadStrategy }
    ): Promise<{ absolutePath: string; content: string | null }>;
    scanDocument(mode?: "auto" | "manual"): Promise<ActionResult>;
    collectFrames(): Promise<ActionResult>;
    applyPlan(plans: Array<{ id: string; plan: StrategyPlan }>): Promise<ActionResult>;
    readSelectionObjects(options?: object): Promise<ActionResult>;
    selectFramesById(request: string[] | { ids?: string[]; source?: string; sessionId?: string | null }): Promise<ActionResult>;
    applyTextChanges(changes: object[]): Promise<ActionResult>;
}

interface BridgeLike {
    isConnected: boolean;
    call(fnName: string, data?: object): Promise<ActionResult>;
    testConnection(): Promise<boolean>;
    scanDocument(mode?: "auto" | "manual"): Promise<ActionResult>;
    updateCard(data: object): Promise<ActionResult>;
    collectFrames(): Promise<ActionResult>;
    applyPlan(plans: Array<{ id: string; plan: StrategyPlan }>): Promise<ActionResult>;
    readSelectionObjects(options?: object): Promise<ActionResult>;
    selectFramesById(request: string[] | { ids?: string[]; source?: string; sessionId?: string | null }): Promise<ActionResult>;
    applyTextChanges(changes: object[]): Promise<ActionResult>;
}

interface HostDebugLike {
    evalScript(script: string): Promise<string>;
    getExtensionRootPath(): string;
}

interface CompactFormBuilderLike {
    refs: Record<string, any>;
    build(): CompactFormBuilderLike;
    getData(): Record<string, any>;
    setData(data: Record<string, any>): void;
    triggerDateGridCompute(): void;
}

interface UIFeedbackLike {
    showToast(message: string, type?: ToastType): void;
    showLoading(container: HTMLElement, message: string): void;
    hideLoading(): void;
    showError(container: HTMLElement, message: string): void;
}

interface NameValidatorLike {
    validate(
        name: string,
        type?: string,
        options?: { fieldKey?: string; formData?: Record<string, unknown> }
    ): { valid: boolean; warnings: Array<{ type: string; message?: string }> };
    isEthnicName(name: string): boolean;
}

interface InputEngineLike {
    process(value: string, fieldKey: string, options?: object): InputProcessResult;
    validateDateLogic(data: object): { valid: boolean; warnings: any[] };
}

interface SchemaInjectorLike {
    computeChanges(frames: Array<{ id: string; text: string; uuid?: string }>, targetType?: string): {
        changes: Array<{ id: string; plan: StrategyPlan }>;
        orphans: Array<{ id: string; text?: string }>;
        missedRequired: string[];
    };
}

interface ManualInjectActionLike {
    injectSingle(args: object): Promise<ActionResult> | ActionResult;
    injectCompound(args: object): Promise<ActionResult> | ActionResult;
    injectBulk(args: object): Promise<ActionResult> | ActionResult;
    injectDateClone(args: object): Promise<ActionResult> | ActionResult;
}

interface WeddingReadyState {
    status: "booting" | "ready" | "error";
    phase: string;
    compactReady: boolean;
    schemaReady: boolean;
    error: string | null;
    updatedAt: number;
}

interface WeddingTestApiModules {
    inputEngine: InputEngineLike;
    nameValidator: NameValidatorLike;
    schemaInjector: SchemaInjectorLike;
    manualInjectAction: ManualInjectActionLike;
}

interface WeddingTestApi {
    getBridge(): HostFacadeLike | null;
    getHostFacade(): HostFacadeLike | null;
    getHostDebug(): HostDebugLike | null;
    getCompactBuilder(): CompactFormBuilderLike | null;
    modules: WeddingTestApiModules;
}

declare class CSInterface {
    getSystemPath(path: any): string;
    evalScript(script: string, callback?: (result: any) => void): void;
    static EXTENSION: string;
}

declare global {
    interface Window {
        __WEDDING_APP_READY__?: WeddingReadyState;
        __WEDDING_TEST_API__?: WeddingTestApi;
        // Vendor globals still exist in CEP, but app runtime code should only
        // access them through the dedicated CEP host adapter boundary.
        __adobe_cep__?: unknown;
        cep?: unknown;
        require?: (id: string) => any;
    }
}

export {};
