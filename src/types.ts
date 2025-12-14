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
