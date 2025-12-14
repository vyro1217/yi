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
    // signalsToWatch may be simple strings or structured signal objects
    signalsToWatch: Array<string | { description: string; action?: string; type?: 'positive' | 'negative' | 'neutral' }>;
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

export interface Signal {
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    action?: string;
}

// NLP Feature Types for Question Analysis
export interface DetailedEntity {
    type: 'person' | 'org' | 'money' | 'date' | 'place' | 'product' | 'topic' | 'temporal' | 'numeric' | 'option';
    text: string;
    value?: number | string;  // normalized value for numeric/temporal entities
    span?: [number, number];  // character position in original text
}

export interface IntentClassification {
    intent: 'decide' | 'timing' | 'risk' | 'relationship' | 'strategy' | 'diagnose' | 'choose_one' | 'other';
    confidence: number;       // 0-1
    alternatives?: Array<{ intent: string; confidence: number }>;  // top-K alternatives
}

export interface NLPFeatures {
    domain?: 'career' | 'love' | 'money' | 'health' | 'project' | 'business' | 'other';
    intentClassification?: IntentClassification;
    timeHorizon?: 'hours' | 'days' | 'weeks' | 'months' | 'year+';
    urgency?: number;         // 0-1, how urgent is the question
    riskTolerance?: number;   // 0-1, inferred risk tolerance
    agency?: number;          // 0-1, how much control/agency user has
    emotionTone?: 'calm' | 'anxious' | 'angry' | 'excited' | 'mixed';
    entitiesDetailed?: DetailedEntity[];
    optionsNormalized?: string[];  // normalized/deduplicated options
    constraintsExtracted?: string[];  // extracted constraints from text
    successMetrics?: string[];  // observable/measurable success indicators
    normalizedQuestion?: string;  // deterministically normalized text
}
