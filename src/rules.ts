import { Hexagram } from './types';

type Lang = 'zh-TW' | 'en';

export function loadRuleDB() {
    return {
        byHexagram: (num: number, lang: Lang = 'zh-TW') => {
            const templates: any = {
                'zh-TW': `此時本卦為第 ${num} 卦，整體走向需以時勢為重。`,
                'en': `Current hexagram is ${num}. Interpret in context of timing and trends.`
            };
            return { judgmentTemplate: templates[lang] };
        },
        byLine: (hexNum: number, linePos: number, lang: Lang = 'zh-TW') => {
            const t: any = {
                'zh-TW': `第 ${hexNum} 卦之第 ${linePos} 爻有特殊啟示。`,
                'en': `Line ${linePos} of hexagram ${hexNum} indicates a focal point.`
            };
            return { template: t[lang] };
        },
        transition: (from: number, to: number, lang: Lang = 'zh-TW') => ({ template: lang === 'zh-TW' ? `由 ${from} 卦轉至 ${to} 卦，屬於漸進變化。` : `Transition from ${from} to ${to} implies progressive change.` }),

        // Additional rule helpers
        lineAdvicePriority: (hexNum: number, linePos: number) => {
            // refined heuristic: middle lines (2,5) are high; top/bottom moderate; others normal
            if (linePos === 2 || linePos === 5) return 'high';
            if (linePos === 1 || linePos === 6) return 'moderate';
            return 'normal';
        },

        // Templates sensitive to timeframe and constraints
        timeframeAdvice: (primary: Hexagram, timeframe: string, constraints: string[], lang: Lang = 'zh-TW') => {
            if (lang === 'en') {
                if (timeframe === 'short') return 'Short-term: act conservatively.';
                if (timeframe === 'mid') return 'Mid-term: balance risk and opportunity.';
                return 'Long-term: focus on sustainable strategy.';
            }
            // zh-TW
            if (timeframe === 'short') return '短期：以保守為主。';
            if (timeframe === 'mid') return '中期：權衡風險與機會。';
            return '長期：著重長期持續策略。';
        }
    };
}

export function renderSummary(primary: Hexagram, relating: Hexagram, phase: string, emphasis: string[], ctx: { question: string, timeframe: string }, lang: Lang = 'zh-TW') {
    if (lang === 'en') {
        return `Question: ${ctx.question} (timeframe: ${ctx.timeframe})\nPrimary: ${primary.number}. ${primary.name}\nRelating: ${relating.number}. ${relating.name}\nPhase: ${phase}\nEmphasis: ${emphasis.join(', ')}`;
    }
    return `針對您的問題：「${ctx.question}」（時間視角：${ctx.timeframe}），\n本次解讀：\n本卦（現況）：${primary.number}．${primary.name}\n之卦（趨勢）：${relating.number}．${relating.name}\n階段：${phase}\n重點：${emphasis.join('、')}\n整體建議請參考下方建議列表。`;
}
