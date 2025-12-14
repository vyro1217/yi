// Decision Engine Pipeline (6-layer architecture)
import { QuestionLayer, StructuredQuestion } from './layers/QuestionLayer';
import { CastingLayer, Line, CastingMethod } from './layers/CastingLayer';
import { HexagramLayer, HexagramStructure } from './layers/HexagramLayer';
import { InterpretationLayer } from './layers/InterpretationLayer';
import { RuleEngineLayer, StrategyProfile } from './layers/RuleEngineLayer';
import { OutputLayer, DecisionOutput } from './layers/OutputLayer';
import { Tracer, TraceOptions, TraceEvent } from './tracing/Tracer';
import { NLPConfig } from './nlp/QuestionNLP';
import { SignalModel } from './signals/SignalModel';
import { Signal } from './types';

export interface DecisionEngineOptions {
    castingMethod?: 'three-coins' | 'yarrow-stalk' | 'timestamp' | CastingMethod;
    castingSeed?: number;
    strategyProfile?: StrategyProfile;
    language?: 'zh-TW' | 'en';
    dataPath?: string;
    
    // New options
    trace?: boolean | TraceOptions;  // Enable tracing
    nlp?: NLPConfig;                 // NLP configuration
    kpiDefs?: any[]; // optional KPI definitions to evaluate
    kpiSeries?: any[]; // optional KPI time series to evaluate
}

export interface DecisionEngineResult {
    // 輸入
    question: StructuredQuestion;
    
    // 中間層資料
    lines: Line[];
    hexStruct: HexagramStructure;
    
    // 輸出
    decision: DecisionOutput;
    
    // 元資訊
    timestamp: number;
    seed?: number;
    
    // New fields
    trace?: TraceEvent[];  // Trace log if enabled
}

export class DecisionEngine {
    private interpretation: InterpretationLayer;
    private ruleEngine: RuleEngineLayer;

    constructor(options?: DecisionEngineOptions) {
        this.interpretation = new InterpretationLayer(options?.dataPath);
        this.ruleEngine = new RuleEngineLayer();
        
        // Configure NLP if provided
        if (options?.nlp) {
            QuestionLayer.configureNLP(options.nlp);
        }
    }

    // 核心方法：執行完整決策管線
    async run(
        rawQuestion: string,
        questionMetadata?: Partial<StructuredQuestion>,
        options?: DecisionEngineOptions
    ): Promise<DecisionEngineResult> {
        const lang = options?.language || 'zh-TW';
        const profile = options?.strategyProfile || 'engineering';

        // Initialize tracer if enabled
        let tracer: Tracer | undefined;
        if (options?.trace) {
            const traceOpts = typeof options.trace === 'boolean' 
                ? { enabled: true } 
                : options.trace;
            tracer = new Tracer(traceOpts);
        }

        // Layer 1: Question
        const question = await QuestionLayer.parse(rawQuestion, questionMetadata, tracer) as any;

        // Layer 2: Casting
        const casting = this.getCastingMethod(options);
        const lines = CastingLayer.cast(casting, tracer);

        // Layer 3: Hexagram
        const hexStruct = HexagramLayer.compute(lines, tracer);

        // Layer 4: Interpretation
        const hexData = this.interpretation.getAll(
            hexStruct.primaryKey,
            hexStruct.relatingKey,
            hexStruct.mutualKey,
            tracer
        );

        // Layer 5: Rule Engine
        const ruleOutput = this.ruleEngine.analyze(hexStruct, question, profile, tracer);

        // Layer 6: Output
        let decision = OutputLayer.generate(question, hexData, ruleOutput, lang, tracer);

        // If KPI defs/series provided, evaluate and merge KPI signals
        if (options?.kpiDefs && options?.kpiSeries) {
            const signalModel = new SignalModel(options.kpiDefs as any);
            const kpiSignals: Signal[] = [];
            for (const series of options.kpiSeries as any[]) {
                try {
                    const s = signalModel.evaluateKPIAsSignal(series);
                    kpiSignals.push(s);
                } catch (e) {
                    // ignore single KPI failures
                }
            }

            // Merge KPI signals into decision.signals (avoid duplicates)
            const existing = decision.signals || [];
            const merged = [...existing];
            for (const ks of kpiSignals) {
                // simple dedupe by description
                if (!merged.some((m: any) => m.description === ks.description)) merged.push(ks as any);
            }
            decision = { ...decision, signals: merged };
        }

        return {
            question,
            lines,
            hexStruct,
            decision,
            timestamp: Date.now(),
            seed: (casting as any).seed,
            trace: tracer?.getTrace()
        };
    }

    // 取得起卦方法
    private getCastingMethod(options?: DecisionEngineOptions): CastingMethod {
        if (!options?.castingMethod) {
            return CastingLayer.threeCoins(options?.castingSeed);
        }

        if (typeof options.castingMethod === 'object') {
            return options.castingMethod;
        }

        switch (options.castingMethod) {
            case 'three-coins':
                return CastingLayer.threeCoins(options.castingSeed);
            case 'yarrow-stalk':
                return CastingLayer.yarrowStalk(options.castingSeed);
            case 'timestamp':
                return CastingLayer.timestamp();
            default:
                return CastingLayer.threeCoins(options.castingSeed);
        }
    }
}

// 導出所有層級與類型
export {
    QuestionLayer,
    CastingLayer,
    HexagramLayer,
    InterpretationLayer,
    RuleEngineLayer,
    OutputLayer,
    Tracer
};

export type {
    StructuredQuestion,
    Line,
    HexagramStructure,
    DecisionOutput,
    StrategyProfile,
    TraceEvent,
    TraceOptions
};
