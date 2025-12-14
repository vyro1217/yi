import fs from 'fs';
import path from 'path';
import { LineType, Line, Hexagram, QueryContext, Advice, Reading } from './types';
import { makeSeededCastingMethod, castHexagram, parseCastingValue } from './cast';
import { loadRuleDB, renderSummary } from './rules';

const dataDir = path.join(__dirname, '..', 'data');

function loadJSON<T>(p: string): T {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as T;
}

export class IChingEngine {
    private HexagramDB: Map<string, any>;
    private TrigramDB: Map<string, any>;
    private RuleDB: any;

    constructor() {
        // Prefer full hexagrams.json if present, else fall back to sample
        const hexPathFull = path.join(dataDir, 'hexagrams.json');
        const hexPathSample = path.join(dataDir, 'hexagrams.sample.json');
        const hex = fs.existsSync(hexPathFull) ? loadJSON<any>(hexPathFull) : loadJSON<any>(hexPathSample);
        const tri = loadJSON<any>(path.join(dataDir, 'trigrams.json'));
        this.HexagramDB = new Map(Object.entries(hex));
        this.TrigramDB = new Map(Object.entries(tri));
        this.RuleDB = loadRuleDB();
    }

    private static lineTypesFromLines(lines: Line[] | LineType[]): LineType[] {
        if ((lines as Line[])[0] && (lines as Line[])[0].hasOwnProperty('type')) {
            return (lines as Line[]).map(l => l.type);
        }
        return lines as LineType[];
    }

    private toKey(lineTypes: LineType[]) {
        return lineTypes.map(l => l === LineType.YANG ? '1' : '0').join('');
    }

    private buildHexagram(lines: Line[] | LineType[]): Hexagram {
        const types = IChingEngine.lineTypesFromLines(lines);
        const key = this.toKey(types);
        const meta = this.HexagramDB.get(key);
        if (!meta) throw new Error(`Hexagram not found for key ${key}`);

        const innerKey = types.slice(0, 3).map(l => l === LineType.YANG ? '1' : '0').join('');
        const outerKey = types.slice(3, 6).map(l => l === LineType.YANG ? '1' : '0').join('');

        const inner = this.TrigramDB.get(innerKey);
        const outer = this.TrigramDB.get(outerKey);
        if (!inner || !outer) throw new Error('Trigram missing');

        return {
            ...meta,
            lines: types,
            inner,
            outer
        } as Hexagram;
    }

    private applyChanges(lines: Line[]): LineType[] {
        return lines.map(l => l.isChanging ? (l.type === LineType.YANG ? LineType.YIN : LineType.YANG) : l.type);
    }

    private inferPhase(changingPositions: number[]): string {
        if (changingPositions.length === 0) return 'STABLE_MODE';
        const p = Math.max(...changingPositions);
        switch (p) {
            case 1: return 'INIT';
            case 2:
            case 3: return 'BUILD';
            case 4: return 'CONFLICT';
            case 5: return 'CONTROL';
            case 6: return 'OVERFLOW';
            default: return 'UNKNOWN';
        }
    }

    private pickKeyLines(changingPositions: number[]): number[] {
        const n = changingPositions.length;
        if (n === 0) return [];
        if (n === 1) return [changingPositions[0]];
        let result: number[] = [];
        if (n <= 3) {
            if (changingPositions.includes(5)) result.push(5);
            result.push(Math.max(...changingPositions));
        } else {
            if (changingPositions.includes(2)) result.push(2);
            if (changingPositions.includes(5)) result.push(5);
            if (result.length === 0) result.push(Math.max(...changingPositions));
        }
        return Array.from(new Set(result)).sort((a,b)=>a-b);
    }

    private inferEmphasis(primary: Hexagram, relating: Hexagram, changingPositions: number[]): string[] {
        const tags: string[] = [];
        if (changingPositions.length >= 3) tags.push('HIGH_VOLATILITY');
        if (primary.outer.name !== relating.outer.name) tags.push('ENV_SHIFT');
        if (primary.inner.name !== relating.inner.name) tags.push('SELF_SHIFT');
        if (primary.tags) tags.push(...primary.tags);
        return Array.from(new Set(tags));
    }

    private synthesizeAdvice(ctx: QueryContext, primary: Hexagram, relating: Hexagram, changingPositions: number[], phase: string, emphasis: string[], lang: 'zh-TW' | 'en' = 'zh-TW'): Advice {
        const baseTemplate = this.RuleDB.byHexagram(primary.number, lang).judgmentTemplate;
        const keyLines = this.pickKeyLines(changingPositions);
        const lineNotes = keyLines.length > 0 ? keyLines.map(p => this.RuleDB.byLine(primary.number, p, lang).template) : (lang === 'zh-TW' ? ['無變爻，宜守成不動。'] : ['No changing lines; favor maintaining the current course.']);
        const transitionTemplate = this.RuleDB.transition(primary.number, relating.number, lang).template;
        const summary = renderSummary(primary, relating, phase, emphasis, ctx as any, lang);

        const doList = [
            lang === 'zh-TW' ? `依據${primary.name}：${baseTemplate}` : `Based on ${primary.name}: ${baseTemplate}`,
            lang === 'zh-TW' ? `重點變爻：${lineNotes.join('；')}` : `Key changing lines: ${lineNotes.join('; ')}`
        ];
        const dontList = [lang === 'zh-TW' ? `避免強行改變當下穩定局面。` : `Avoid forcing change on the current stable situation.`];
        const risks = [lang === 'zh-TW' ? `主要風險來自本卦的限制：${primary.judgment}` : `Primary risk: ${primary.judgment}`, lang === 'zh-TW' ? `轉換到${relating.name}可能的挑戰：${transitionTemplate}` : `Transition challenges: ${transitionTemplate}`];
        const signals = [lang === 'zh-TW' ? `觀察是否出現與之卦${relating.name}相符的外在變化。` : `Observe whether external conditions align with ${relating.name}.`, lang === 'zh-TW' ? `關注變爻（${keyLines.join(',') || '無'}）的發展。` : `Monitor outcomes at key lines (${keyLines.join(',') || 'none'}).`];

        return { summary, doList, dontList, risks, signalsToWatch: signals } as Advice;
    }

    public ichingDecisionEngine(ctx: QueryContext, castingMethod: { roll: (pos: number) => 6 | 7 | 8 | 9 }, options?: { lang?: 'zh-TW' | 'en' }) : Reading {
        const lines = castHexagram(castingMethod);
        const changingPositions = lines.filter(l => l.isChanging).map(l => l.position);

        const primary = this.buildHexagram(lines);
        const relatingTypes = this.applyChanges(lines);
        const relating = this.buildHexagram(relatingTypes);

        const phase = this.inferPhase(changingPositions);
        const emphasis = this.inferEmphasis(primary, relating, changingPositions);

        const lang = options?.lang ?? 'zh-TW';
        const advice = this.synthesizeAdvice(ctx, primary, relating, changingPositions, phase, emphasis, lang);

        return { primary, relating, changingPositions, phase, emphasis, advice } as Reading;
    }
}

export function makeDefaultCasting(seed?: number | string) {
    return makeSeededCastingMethod(seed) as any;
}
