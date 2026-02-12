/**
 * Wedding Scripter — Type Definitions (Agent Governance Layer)
 * 
 * PURPOSE: Single Source of Truth for all public APIs.
 * Agent MUST consult this file before calling any function.
 * DO NOT add types here without corresponding implementation.
 * 
 * Last Updated: 2026-02-11
 */

// ============================================================
// COMMON TYPES
// ============================================================

/** Standard action result returned by Bridge calls */
interface ActionResult {
    success: boolean;
    error?: string;
    data?: any;
    updated?: number;
    message?: string;
}

/** Context object passed to all Action.execute() methods */
interface ActionContext {
    bridge: Bridge;
    builder: CompactFormBuilder;
    showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
    button: HTMLButtonElement;
}

/** Raw scan item from JSX */
interface RawScanItem {
    id: string;
    raw_content: string;
    meta_keys: string[];
}

/** DataValidator analysis result */
interface AnalysisResult {
    healthyMap: Record<string, string>;
    brokenList: BrokenItem[];
}

interface BrokenItem {
    id: string;
    content: string;
    expectedKeys: string[];
    foundValues: string[];
    error: string;
}

/** Strategy plan returned by StrategyOrchestrator */
interface StrategyPlan {
    mode: 'REPLACE' | 'SKIP' | 'FRESH';
    strategy?: 'SmartComplex' | 'Fresh';
    reason?: string;
    replacements?: Array<{ key: string; oldVal: string; newVal: string }>;
    content?: string;
    meta?: object;
}

/** Name split result */
interface NameParts {
    ten: string;
    lot: string;
    ho_dau: string;
    dau: string;
    full: string;
}

/** Calendar expanded date */
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

/** InputEngine process result */
interface InputProcessResult {
    value: string;
    original: string;
    fieldType: string;
    applied: string[];
    warnings: Array<{ message: string; severity: 'error' | 'warning' }>;
    valid: boolean;
}

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

    /** Scan document for text frames with metadata */
    scanDocument(mode?: 'auto' | 'manual'): Promise<ActionResult>;

    /** Update card with raw data (legacy) */
    updateCard(data: object): Promise<ActionResult>;

    /** Collect all text frames with their content and metadata */
    collectFrames(): Promise<ActionResult>;

    /** Apply pre-computed update plans to Illustrator */
    applyPlan(plans: Array<{ id: string; plan: StrategyPlan }>): Promise<ActionResult>;

    /** Smart update: collect → strategize → apply */
    updateWithStrategy(packet: object): Promise<ActionResult>;
}

// ============================================================
// L1: DOMAIN — Pure Logic (No Side Effects)
// ============================================================

declare const WeddingRules: {
    SIDE_BRIDE: 'Nhà Gái';
    SIDE_GROOM: 'Nhà Trai';

    /** Generate Ông/Bà prefix based on presence */
    generateParentPrefix(hasOng: boolean, hasBa: boolean): string;

    /** Enrich packet with Ông/Bà for pos1 and pos2 */
    enrichParentPrefixes(packet: object): object;

    /** Check if ceremony name indicates bride side */
    isBrideSide(leName: string, triggerConfig?: Record<string, number>): boolean;

    /** Get side state: 0 = Trai, 1 = Gái */
    getSideState(leName: string, triggerConfig?: Record<string, number>): number;

    /** Map ui.vithu_nam/nu to pos1/pos2.vithu based on side */
    enrichMappingStrategy(packet: object, triggerConfig?: Record<string, number>): object;
};

declare const NameAnalysis: {
    /** Split full Vietnamese name into parts */
    splitFullName(fullName: string, index?: number): NameParts;

    /** Enrich packet with derived name fields (ten, lot, ho_dau, dau) */
    enrichSplitNames(packet: object): object;
};

declare const CalendarEngine: {
    _cache: any[] | null;
    _isLoaded: boolean;

    /** Load CSV lunar calendar database */
    loadDatabase(): boolean;

    /** Get lunar date from solar day/month/year */
    getLunarDate(day: number, month: number, year: number): object | null;

    /** Get solar date from lunar day/month/year text */
    getSolarDate(lunarDay: number, lunarMonth: number, lunarYearTxt: string): object | null;

    /** Expand Date object to full solar + lunar info */
    expandDate(date: Date): ExpandedDate;
};

// ============================================================
// L2: CORE UTILITIES
// ============================================================

declare const StringUtils: {
    /** Clean whitespace and trim */
    clean(str: string): string;

    /** Proper Case (capitalize each word) */
    toProperCase(str: string): string;

    /** Remove Vietnamese diacritics */
    removeAccents(str: string): string;

    /** Check if string is empty after trim */
    isEmpty(str: string): boolean;
};

declare const DateUtils: {
    /** Parse "YYYY-MM-DD" to Date object */
    parseDate(str: string): Date | null;

    /** Format Date to pattern (DD/MM/YYYY) */
    formatDate(date: Date, pattern?: string): string;

    /** Get Vietnamese day name */
    getDayOfWeek(date: Date): string;

    /** Calculate difference in days between two dates */
    getDiffDays(d1: Date, d2: Date): number;

    /** Add/subtract days from a date */
    addDays(date: Date, days: number): Date | null;
};

declare const SchemaUtils: {
    /** Flatten schema to Map */
    flatten(schema: object): Map<string, string>;

    /** Get Semantic Type from key */
    getType(key: string, schema?: object): string | null;
};

// ============================================================
// L3: UX
// ============================================================

declare const InputEngine: {
    /** Process input value: normalize → validate → return result */
    process(value: string, fieldKey: string, options?: object): InputProcessResult;

    /** Validate date logic cross-field */
    validateDateLogic(data: object): { valid: boolean; warnings: any[] };
};

// ============================================================
// L4: PIPELINE
// ============================================================

declare class DataValidator {
    markerRegex: RegExp;

    /** Analyze raw scan items → { healthyMap, brokenList } */
    analyze(rawItems: RawScanItem[]): AnalysisResult;

    /** Heal broken items using consensus from healthy map */
    heal(brokenList: BrokenItem[], healthyMap: Record<string, string>): any[];
}

declare const KeyNormalizer: {
    /** Normalize keys (strip {}) and enrich with calendar data */
    normalize(data: object): object;
};

// ============================================================
// L5: STRATEGIES
// ============================================================

declare class SmartComplexStrategy {
    /** Analyze text frame with metadata (precision replacement) */
    static analyze(content: string, packet: object, meta: object, constants?: object): StrategyPlan | null;
}

declare class FreshStrategy {
    /** Analyze fresh text frame (placeholder detection) */
    static analyze(content: string, packet: object, meta: object | null, constants?: object): StrategyPlan | null;
}

declare class StrategyOrchestrator {
    constants: object;

    constructor(constants?: object);

    /** Analyze single frame → execution plan */
    analyze(content: string, metadata: object | null, packet: object): StrategyPlan;

    /** Batch analyze multiple frames */
    analyzeBatch(frames: Array<{ id: string; content: string; metadata: object }>, packet: object): Array<{ id: string; plan: StrategyPlan }>;

    /** Encode metadata for storage */
    encodeMetadata(meta: object): string;

    /** Decode metadata from string */
    decodeMetadata(noteStr: string): object | null;
}

// ============================================================
// L6: COMPONENTS & CONTROLLERS
// ============================================================

declare class CompactFormBuilder {
    container: HTMLElement;
    schema: object;
    data: Record<string, any>;
    refs: Record<string, any>;
    onChange: ((key: string, value: any, data: object) => void) | null;

    constructor(options?: {
        container?: HTMLElement;
        schema?: object;
        data?: object;
        onChange?: (key: string, value: any, data: object) => void;
    });

    /** Build the entire form UI */
    build(): CompactFormBuilder;

    /** Get all current form values as key-value object */
    getData(): Record<string, any>;

    /** Set form values from key-value object */
    setData(data: Record<string, any>): void;
}

// ============================================================
// L7: ACTIONS
// ============================================================

declare const ScanAction: {
    /** Execute scan: Bridge → DataValidator → KeyNormalizer → UI */
    execute(ctx: ActionContext): Promise<ActionResult>;
};

declare const UpdateAction: {
    /** Execute update: Form → Assembler → Bridge → Illustrator */
    execute(ctx: ActionContext): Promise<ActionResult>;
};

declare const SwapAction: {
    /** Execute swap: POS1 ↔ POS2 (keep vithu) */
    execute(ctx: ActionContext): { success: boolean };
};
