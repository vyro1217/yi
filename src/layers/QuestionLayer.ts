// Question Layer: 自然語言問題 → 結構化模型
import { QuestionNLP, NLPConfig } from '../nlp/QuestionNLP';
import { Tracer } from '../tracing/Tracer';

export interface StructuredQuestion {
    rawQuestion: string;
    context: string;           // 情境描述
    goal: string;              // 目標（what to achieve）
    timeframe: string;         // 時間尺度
    constraints: string[];     // 限制條件
    options?: string[];        // 選項集合（若為選擇題）
    riskPreference: string;    // 風險偏好
    
    // NLP enhancements (basic)
    verbs?: string[];
    entities?: string[];
    riskScore?: number;
    confidence?: number;
    isTrendDetected?: boolean;
    keywords?: string[];
    embedding?: number[];
    
    // Extended NLP features
    intent?: string;
    intentConfidence?: number;
    domain?: string;
    urgency?: number;
    agency?: number;
    emotionTone?: string;
    entitiesDetailed?: any[];  // DetailedEntity[]
    normalizedQuestion?: string;
    optionsNormalized?: string[];
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
    static async parse(
        rawQuestion: string, 
        metadata?: Partial<StructuredQuestion>,
        tracer?: Tracer
    ): Promise<StructuredQuestion> {
        tracer?.add('Question', { rawQuestion, metadata }, 'Parsing question');

        let result: StructuredQuestion;

        // Use NLP parsing if configured
        if (this.nlp) {
            const enhanced = this.nlp.parseText(rawQuestion, metadata);
            result = {
                rawQuestion: enhanced.rawQuestion,
                normalizedQuestion: enhanced.normalizedQuestion,
                context: enhanced.context,
                goal: enhanced.goal,
                timeframe: enhanced.timeframe,
                constraints: enhanced.constraints,
                riskPreference: enhanced.riskPreference,
                verbs: enhanced.verbs,
                entities: enhanced.entities,
                entitiesDetailed: enhanced.entitiesDetailed,
                intent: enhanced.intent,
                intentConfidence: enhanced.intentConfidence,
                // @ts-ignore: include optional intentCandidates produced by NLP
                intentCandidates: (enhanced as any).intentCandidates,
                domain: enhanced.domain,
                urgency: enhanced.urgency,
                agency: enhanced.agency,
                emotionTone: enhanced.emotionTone,
                riskScore: enhanced.riskScore,
                confidence: enhanced.confidence,
                isTrendDetected: enhanced.isTrendDetected,
                keywords: enhanced.keywords,
                embedding: enhanced.embedding,
                options: metadata?.options,
                optionsNormalized: enhanced.optionsNormalized
            };

            // Export weak-labels asynchronously if intentCandidates present and weakLabelExport enabled
            (async () => {
                try {
                    const ic = (enhanced as any).intentCandidates;
                    const config = (this.nlpConfig || {}) as any;
                    if (ic && Array.isArray(ic) && ic.length > 0 && config.weakLabelExport && config.weakLabelExport.enabled) {
                        const fs = require('fs').promises;
                        const path = require('path');
                        const outDir = path.join(__dirname, '..', 'data', 'nlp', 'weak_labels');
                        await fs.mkdir(outDir, { recursive: true });
                        const outPath = path.join(outDir, (config.weakLabelExport.path) ? config.weakLabelExport.path : 'weak_labels_output.jsonl');
                        const entry = { timestamp: Date.now(), question: rawQuestion, intentCandidates: ic };
                        await fs.appendFile(outPath, JSON.stringify(entry) + '\n');
                    }
                } catch (e) {
                    // ignore file write errors in async worker
                }
            })();
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
            confidence: result.confidence,
            // include intentCandidates in trace if available
            intentCandidates: (result as any).intentCandidates
        }, 'Question parsed successfully');

        return result;
    }
}

