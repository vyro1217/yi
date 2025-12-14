// Rule Engine Layer: 推論/評分引擎
import { HexagramData, HexagramSemantics } from './InterpretationLayer';
import { HexagramStructure } from './HexagramLayer';
import { StructuredQuestion } from './QuestionLayer';
import { Tracer } from '../tracing/Tracer';

export type StrategyProfile = 'zhuxi' | 'meihua' | 'engineering';

export interface MovingLineStrategy {
    // 動爻數 → 如何處理
    0: { focus: 'judgment', weights: { primary: number; relating: number; mutual: number } };
    1: { focus: 'line', weights: { primary: number; relating: number; mutual: number } };
    2: { focus: 'both-lines', weights: { primary: number; relating: number; mutual: number } };
    3: { focus: 'transition', weights: { primary: number; relating: number; mutual: number } };
    4: { focus: 'relating', weights: { primary: number; relating: number; mutual: number } };
    5: { focus: 'major-change', weights: { primary: number; relating: number; mutual: number } };
    6: { focus: 'complete-change', weights: { primary: number; relating: number; mutual: number } };
}

export interface FusionWeights {
    primary: number;
    relating: number;
    mutual: number;
}

export interface RuleEngineOutput {
    strategy: MovingLineStrategy[keyof MovingLineStrategy];
    weights: FusionWeights;
    keyLines: number[];           // 關鍵爻位置
    focusHexagram: 'primary' | 'relating' | 'mutual' | 'balanced';
    confidence: number;           // 0~1
}

export class RuleEngineLayer {
    private strategies: Record<StrategyProfile, MovingLineStrategy>;

    constructor() {
        this.strategies = this.loadStrategies();
    }

    // 核心推論：依動爻數與策略檔案決定處理方式
    analyze(
        hexStruct: HexagramStructure,
        question: StructuredQuestion,
        profile: StrategyProfile = 'engineering',
        tracer?: Tracer
    ): RuleEngineOutput {
        tracer?.add('Rule', { profile, movingLines: hexStruct.movingLines }, 'Starting rule engine analysis');
        
        const movingCount = hexStruct.movingLines.length as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const strategy = this.strategies[profile][movingCount];

        // 決定關鍵爻
        const keyLines = this.pickKeyLines(hexStruct.movingLines, movingCount);

        // 決定焦點卦象
        const focusHexagram = this.decideFocus(strategy.weights);

        // 計算信心度（依動爻數與問題清晰度）
        const confidence = this.calculateConfidence(movingCount, question);

        const output = {
            strategy,
            weights: strategy.weights,
            keyLines,
            focusHexagram,
            confidence
        };

        tracer?.add('Rule', {
            movingCount,
            strategy: strategy.focus,
            weights: strategy.weights,
            keyLines,
            focusHexagram,
            confidence
        }, 'Rule engine analysis complete');

        return output;
    }

    // 選關鍵爻（朱熹派/工程派策略）
    private pickKeyLines(movingLines: number[], count: number): number[] {
        if (count === 0) return [];
        if (count === 1) return movingLines;
        if (count === 2) return movingLines; // 兩爻都看，上爻略重
        if (count === 3) {
            // 3 動：取 2 和 5（若有），否則取最高
            const result: number[] = [];
            if (movingLines.includes(2)) result.push(2);
            if (movingLines.includes(5)) result.push(5);
            if (result.length === 0) result.push(Math.max(...movingLines));
            return result;
        }
        // 4~6 動：取 2 和 5（若有）
        const result: number[] = [];
        if (movingLines.includes(2)) result.push(2);
        if (movingLines.includes(5)) result.push(5);
        if (result.length === 0) result.push(Math.max(...movingLines));
        return result;
    }

    private decideFocus(weights: FusionWeights): 'primary' | 'relating' | 'mutual' | 'balanced' {
        const max = Math.max(weights.primary, weights.relating, weights.mutual);
        if (weights.primary === max && weights.primary > 0.5) return 'primary';
        if (weights.relating === max && weights.relating > 0.5) return 'relating';
        if (weights.mutual === max && weights.mutual > 0.4) return 'mutual';
        return 'balanced';
    }

    private calculateConfidence(count: number, question: StructuredQuestion): number {
        // 1 動最清晰（0.9），3~4 動不穩定（0.5~0.6），0 動看卦辭（0.7）
        let base = 0.7;
        if (count === 1) base = 0.9;
        else if (count === 2) base = 0.8;
        else if (count === 3) base = 0.6;
        else if (count === 4) base = 0.5;
        else if (count === 5 || count === 6) base = 0.55;

        // 問題清晰度加成
        if (question.goal && question.context) base += 0.05;
        if (question.options && question.options.length > 0) base += 0.05;

        return Math.min(base, 1.0);
    }

    // 載入策略檔案
    private loadStrategies(): Record<StrategyProfile, MovingLineStrategy> {
        return {
            // 朱熹派（傳統）
            zhuxi: {
                0: { focus: 'judgment', weights: { primary: 1.0, relating: 0.0, mutual: 0.0 } },
                1: { focus: 'line', weights: { primary: 0.7, relating: 0.2, mutual: 0.1 } },
                2: { focus: 'both-lines', weights: { primary: 0.6, relating: 0.3, mutual: 0.1 } },
                3: { focus: 'transition', weights: { primary: 0.4, relating: 0.4, mutual: 0.2 } },
                4: { focus: 'relating', weights: { primary: 0.3, relating: 0.5, mutual: 0.2 } },
                5: { focus: 'major-change', weights: { primary: 0.2, relating: 0.7, mutual: 0.1 } },
                6: { focus: 'complete-change', weights: { primary: 0.1, relating: 0.9, mutual: 0.0 } }
            },
            // 梅花派（互卦權重高）
            meihua: {
                0: { focus: 'judgment', weights: { primary: 0.8, relating: 0.0, mutual: 0.2 } },
                1: { focus: 'line', weights: { primary: 0.6, relating: 0.2, mutual: 0.2 } },
                2: { focus: 'both-lines', weights: { primary: 0.5, relating: 0.25, mutual: 0.25 } },
                3: { focus: 'transition', weights: { primary: 0.35, relating: 0.35, mutual: 0.3 } },
                4: { focus: 'relating', weights: { primary: 0.3, relating: 0.4, mutual: 0.3 } },
                5: { focus: 'major-change', weights: { primary: 0.2, relating: 0.5, mutual: 0.3 } },
                6: { focus: 'complete-change', weights: { primary: 0.1, relating: 0.7, mutual: 0.2 } }
            },
            // 工程派（動態平衡）
            engineering: {
                0: { focus: 'judgment', weights: { primary: 1.0, relating: 0.0, mutual: 0.0 } },
                1: { focus: 'line', weights: { primary: 0.6, relating: 0.3, mutual: 0.1 } },
                2: { focus: 'both-lines', weights: { primary: 0.5, relating: 0.35, mutual: 0.15 } },
                3: { focus: 'transition', weights: { primary: 0.35, relating: 0.35, mutual: 0.3 } },
                4: { focus: 'relating', weights: { primary: 0.25, relating: 0.5, mutual: 0.25 } },
                5: { focus: 'major-change', weights: { primary: 0.15, relating: 0.65, mutual: 0.2 } },
                6: { focus: 'complete-change', weights: { primary: 0.1, relating: 0.8, mutual: 0.1 } }
            }
        };
    }
}
