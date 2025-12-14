// Decision Engine Pipeline (6-layer architecture)
import { QuestionLayer, StructuredQuestion } from './layers/QuestionLayer';
import { CastingLayer, Line, CastingMethod } from './layers/CastingLayer';
import { HexagramLayer, HexagramStructure } from './layers/HexagramLayer';
import { InterpretationLayer } from './layers/InterpretationLayer';
import { RuleEngineLayer, StrategyProfile } from './layers/RuleEngineLayer';
import { OutputLayer, DecisionOutput } from './layers/OutputLayer';

export interface DecisionEngineOptions {
    castingMethod?: 'three-coins' | 'yarrow-stalk' | 'timestamp' | CastingMethod;
    castingSeed?: number;
    strategyProfile?: StrategyProfile;
    language?: 'zh-TW' | 'en';
    dataPath?: string;
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
}

export class DecisionEngine {
    private interpretation: InterpretationLayer;
    private ruleEngine: RuleEngineLayer;

    constructor(options?: DecisionEngineOptions) {
        this.interpretation = new InterpretationLayer(options?.dataPath);
        this.ruleEngine = new RuleEngineLayer();
    }

    // 核心方法：執行完整決策管線
    run(
        rawQuestion: string,
        questionMetadata?: Partial<StructuredQuestion>,
        options?: DecisionEngineOptions
    ): DecisionEngineResult {
        const lang = options?.language || 'zh-TW';
        const profile = options?.strategyProfile || 'engineering';

        // Layer 1: Question
        const question = QuestionLayer.parse(rawQuestion, questionMetadata);

        // Layer 2: Casting
        const casting = this.getCastingMethod(options);
        const lines = CastingLayer.cast(casting);

        // Layer 3: Hexagram
        const hexStruct = HexagramLayer.compute(lines);

        // Layer 4: Interpretation
        const hexData = this.interpretation.getAll(
            hexStruct.primaryKey,
            hexStruct.relatingKey,
            hexStruct.mutualKey
        );

        // Layer 5: Rule Engine
        const ruleOutput = this.ruleEngine.analyze(hexStruct, question, profile);

        // Layer 6: Output
        const decision = OutputLayer.generate(question, hexData, ruleOutput, lang);

        return {
            question,
            lines,
            hexStruct,
            decision,
            timestamp: Date.now(),
            seed: (casting as any).seed
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
    OutputLayer
};

export type {
    StructuredQuestion,
    Line,
    HexagramStructure,
    DecisionOutput,
    StrategyProfile
};
