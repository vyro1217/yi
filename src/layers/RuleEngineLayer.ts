// Rule Engine Layer: 推論/評分引擎
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
    private readonly strategies: Record<StrategyProfile, MovingLineStrategy>;

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

        // Apply feature fusion: adjust weights based on NLP features
        const adjustedWeights = this.featureFusion(strategy.weights, question);

        // 決定關鍵爻
        const keyLines = this.pickKeyLines(hexStruct.movingLines, movingCount);

        // 決定焦點卦象（使用調整後的權重）
        const focusHexagram = this.decideFocus(adjustedWeights);

        // 計算信心度（依動爻數與問題清晰度）
        const confidence = this.calculateConfidence(movingCount, question);

        const output = {
            strategy,
            weights: adjustedWeights,
            keyLines,
            focusHexagram,
            confidence
        };

        tracer?.add('Rule', {
            movingCount,
            strategy: strategy.focus,
            originalWeights: strategy.weights,
            adjustedWeights,
            keyLines,
            focusHexagram,
            confidence
        }, 'Rule engine analysis complete');

        return output;
    }

    /**
     * Feature Fusion: Adjust strategy weights based on NLP features
     * - intent=timing → increase mutual/relating weight (trend focus)
     * - riskTolerance low → increase primary weight (conservative)
     * - agency high → boost primary (user has control, focus on action)
     * - urgency high → boost relating (look at outcome)
     */
    private featureFusion(baseWeights: FusionWeights, question: StructuredQuestion): FusionWeights {
        const adjusted = { ...baseWeights };

        // Intent-based adjustment
        if (question.intent === 'timing' && question.isTrendDetected) {
            // Timing questions benefit from trend analysis (mutual/relating)
            adjusted.mutual *= 1.2;
            adjusted.relating *= 1.1;
            adjusted.primary *= 0.9;
        }

        if (question.intent === 'risk') {
            // Risk questions focus on primary (current state)
            adjusted.primary *= 1.15;
            adjusted.relating *= 0.95;
        }

        // Risk tolerance (from riskScore or riskPreference)
        const riskScore = question.riskScore || 0.5;
        if (riskScore < 0.3 || question.riskPreference === 'conservative') {
            // Conservative: focus on primary (守)
            adjusted.primary *= 1.1;
            adjusted.relating *= 0.9;
        } else if (riskScore > 0.7 || question.riskPreference === 'aggressive') {
            // Aggressive: focus on relating (change/outcome)
            adjusted.relating *= 1.15;
            adjusted.primary *= 0.95;
        }

        // Agency adjustment
        if (question.agency && question.agency > 0.7) {
            // High agency: user can act, focus on primary + relating
            adjusted.primary *= 1.05;
            adjusted.relating *= 1.05;
            adjusted.mutual *= 0.9;
        } else if (question.agency && question.agency < 0.3) {
            // Low agency: observe trends, increase mutual
            adjusted.mutual *= 1.15;
            adjusted.primary *= 0.95;
        }

        // Urgency adjustment
        if (question.urgency && question.urgency > 0.7) {
            // High urgency: focus on relating (outcome/result)
            adjusted.relating *= 1.1;
        }

        // Normalize weights to sum to 1.0
        const total = adjusted.primary + adjusted.relating + adjusted.mutual;
        adjusted.primary /= total;
        adjusted.relating /= total;
        adjusted.mutual /= total;

        return adjusted;
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
        const baseByCount: Record<number, number> = {
            0: 0.7,
            1: 0.9,
            2: 0.8,
            3: 0.6,
            4: 0.5,
            5: 0.55,
            6: 0.55
        };

        let base = baseByCount[count] ?? 0.7;

        // Aggregate adjustments in one pass to reduce branching complexity
        let adjustment = 0;
        if (question.goal && question.context) adjustment += 0.05;
        if (question.options && question.options.length > 0) adjustment += 0.05;
        if (question.intentConfidence && question.intentConfidence > 0.7) adjustment += 0.03;
        if (question.confidence && question.confidence > 0.7) adjustment += 0.02;
        if (question.urgency && question.urgency > 0.7) adjustment -= 0.02;
        if (question.agency && question.agency > 0.7) adjustment += 0.02;

        base += adjustment;

        return Math.min(base, 1);
    }

    // 載入策略檔案
    private loadStrategies(): Record<StrategyProfile, MovingLineStrategy> {
        return {
            // 朱熹派（傳統）
            zhuxi: {
                0: { focus: 'judgment', weights: { primary: 1, relating: 0, mutual: 0 } },
                1: { focus: 'line', weights: { primary: 0.7, relating: 0.2, mutual: 0.1 } },
                2: { focus: 'both-lines', weights: { primary: 0.6, relating: 0.3, mutual: 0.1 } },
                3: { focus: 'transition', weights: { primary: 0.4, relating: 0.4, mutual: 0.2 } },
                4: { focus: 'relating', weights: { primary: 0.3, relating: 0.5, mutual: 0.2 } },
                5: { focus: 'major-change', weights: { primary: 0.2, relating: 0.7, mutual: 0.1 } },
                6: { focus: 'complete-change', weights: { primary: 0.1, relating: 0.9, mutual: 0 } }
            },
            // 梅花派（互卦權重高）
            meihua: {
                0: { focus: 'judgment', weights: { primary: 0.8, relating: 0, mutual: 0.2 } },
                1: { focus: 'line', weights: { primary: 0.6, relating: 0.2, mutual: 0.2 } },
                2: { focus: 'both-lines', weights: { primary: 0.5, relating: 0.25, mutual: 0.25 } },
                3: { focus: 'transition', weights: { primary: 0.35, relating: 0.35, mutual: 0.3 } },
                4: { focus: 'relating', weights: { primary: 0.3, relating: 0.4, mutual: 0.3 } },
                5: { focus: 'major-change', weights: { primary: 0.2, relating: 0.5, mutual: 0.3 } },
                6: { focus: 'complete-change', weights: { primary: 0.1, relating: 0.7, mutual: 0.2 } }
            },
            // 工程派（動態平衡）
            engineering: {
                0: { focus: 'judgment', weights: { primary: 1, relating: 0, mutual: 0 } },
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
