// Question Layer: 自然語言問題 → 結構化模型
import { QuestionNLP, EnhancedQuestionMetadata, NLPConfig } from '../nlp/QuestionNLP';
import { Tracer } from '../tracing/Tracer';

export interface StructuredQuestion {
    rawQuestion: string;
    context: string;           // 情境描述
    goal: string;              // 目標（what to achieve）
    timeframe: 'immediate' | 'short' | 'mid' | 'long' | string; // 時間尺度（允許自由文本）
    constraints: string[];     // 限制條件
    options?: string[];        // 選項集合（若為選擇題）
    riskPreference: 'conservative' | 'balanced' | 'aggressive' | string; // 風險偏好（允許自由文本）
    
    // NLP enhancements (optional)
    verbs?: string[];
    entities?: string[];
    riskScore?: number;
    confidence?: number;
    isTrendDetected?: boolean;
    keywords?: string[];
    embedding?: number[];
}

export class QuestionLayer {
    private static nlp: QuestionNLP | null = null;
    private static nlpConfig: NLPConfig = {};

    /**
     * Configure NLP features
     */
    static configureNLP(config: NLPConfig): void {
        this.nlpConfig = config;
        this.nlp = new QuestionNLP(config);
    }

    /**
     * Parse question with optional NLP enhancement
     */
    static parse(
        rawQuestion: string, 
        metadata?: Partial<StructuredQuestion>,
        tracer?: Tracer
    ): StructuredQuestion {
        tracer?.add('Question', { rawQuestion, metadata }, 'Parsing question');

        let result: StructuredQuestion;

        // Use NLP parsing if configured
        if (this.nlp) {
            const enhanced = this.nlp.parseText(rawQuestion, metadata);
            result = {
                rawQuestion: enhanced.rawQuestion,
                context: enhanced.context,
                goal: enhanced.goal,
                timeframe: enhanced.timeframe,
                constraints: enhanced.constraints,
                riskPreference: enhanced.riskPreference,
                verbs: enhanced.verbs,
                entities: enhanced.entities,
                riskScore: enhanced.riskScore,
                confidence: enhanced.confidence,
                isTrendDetected: enhanced.isTrendDetected,
                keywords: enhanced.keywords,
                embedding: enhanced.embedding,
                options: metadata?.options
            };
        } else {
            // Fallback to simple parsing
            result = {
                rawQuestion,
                context: metadata?.context || '',
                goal: metadata?.goal || '尋求指引',
                timeframe: metadata?.timeframe || 'mid',
                constraints: metadata?.constraints || [],
                options: metadata?.options,
                riskPreference: metadata?.riskPreference || 'balanced'
            };
        }

        tracer?.add('Question', { 
            parsed: result, 
            nlpEnabled: !!this.nlp,
            confidence: result.confidence 
        }, 'Question parsed successfully');

        return result;
    }
}

