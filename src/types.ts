export enum LineType {
    YIN = 'YIN',
    YANG = 'YANG'
}

export interface Line {
    type: LineType;
    isChanging: boolean;
    position: number; // 1..6
}

export interface Trigram {
    lines: [LineType, LineType, LineType]; // bottom->middle->top
    name: string;
    symbol: string;
    keywords: string[];
}

export interface Hexagram {
    lines: LineType[]; // 6 lines, index 0=初爻
    inner: Trigram;
    outer: Trigram;
    number: number;
    name: string;
    judgment: string;
    lineTexts: string[];
    tags: string[];
}

export interface QueryContext {
    question: string;
    timeframe: 'short' | 'mid' | 'long';
    constraints: string[];
}

export interface Advice {
    summary: string;
    doList: string[];
    dontList: string[];
    risks: string[];
    signalsToWatch: string[];
}

export interface Reading {
    primary: Hexagram;
    relating: Hexagram;
    changingPositions: number[];
    phase: string;
    emphasis: string[];
    advice: Advice;
}

// Enhanced types for new features

// Ten Wings structured data
export interface TenWings {
    tuan?: string;       // 彖傳
    xiang?: string;      // 象傳
    wenYan?: string;     // 文言
    shuoGua?: string;    // 說卦
    xuGua?: string;      // 序卦
    zaGua?: string;      // 雜卦
}

export interface LineAnnotation {
    position: number;    // 1-6
    tuan?: string;       // 彖傳爻辭解釋
    xiang?: string;      // 象傳爻辭解釋
    tags: string[];      // 語義標籤
}

// Extended Hexagram with Ten Wings
export interface EnhancedHexagram extends Hexagram {
    tenWings?: TenWings;
    lineAnnotations?: LineAnnotation[];
}

// KPI Signal types
export interface KPIDefinition {
    kpiId: string;
    description: string;
    direction: 'higher' | 'lower'; // higher-is-better or lower-is-better
    thresholds: {
        good: number;
        warning: number;
        bad: number;
    };
    window?: number; // moving average window
}

export interface SignalResult {
    kpiId: string;
    signal: 'positive' | 'negative' | 'neutral';
    slope?: number;
    lastValue?: number;
    thresholdCrossed?: 'good' | 'warning' | 'bad';
    trigger?: string;
    confidence: number;
}
