# Enhanced IChing Decision Engine - New Features Guide

## 🎯 Overview

The IChing Decision Engine has been significantly enhanced with five major feature categories:

1. **Explanation Traceability** - Step-by-step reasoning logs
2. **NLP-Enhanced Question Parsing** - Semantic understanding of questions
3. **Ten Wings Support** - Structured traditional commentary
4. **Quantitative Signal Model** - KPI-based decision support
5. **Parametrizable Strategies** - Configurable interpretation strategies

---

## 🔍 Feature 1: Explanation Traceability

### What It Does
Provides detailed, auditable logs of every decision step, from question parsing through final output.

### Usage

```typescript
import { DecisionEngine } from './DecisionEngine';

const engine = new DecisionEngine({
    trace: {
        enabled: true,
        verbosity: 'detailed' // 'minimal' | 'detailed' | 'full'
    }
});

const result = engine.run('Should I launch this feature?');

// Access trace
console.log(result.trace);

// Trace events include:
// - Question parsing (confidence, extracted features)
// - Casting (seed, rolls, moving lines)
// - Hexagram computation (keys, numbers)
// - Interpretation (loaded data, tags)
// - Rule engine (strategy, weights, confidence)
// - Output generation (action, timing, signals)
```

### Trace Format

```json
{
  "trace": [
    {
      "stage": "Question",
      "timestamp": 1702584000000,
      "detail": { "goal": "尋求指引", "confidence": 0.65 },
      "message": "Question parsed successfully"
    },
    {
      "stage": "Casting",
      "timestamp": 1702584000100,
      "detail": { "rolls": [7,8,9,7,6,7], "movingLines": [3,5] },
      "message": "Casting completed"
    }
    // ... more events
  ]
}
```

### Benefits
- **Debugging**: Understand why a specific decision was made
- **Auditability**: Track decision logic for compliance
- **Learning**: Study how different inputs affect outputs
- **Trust**: Users can see the reasoning, not just the conclusion

---

## 🧠 Feature 2: NLP-Enhanced Question Parsing

### What It Does
Extracts semantic features from natural language questions using heuristics (expandable to LLM/embeddings).

### Extracted Features
- **Verbs**: Action words (launch, invest, wait, etc.)
- **Entities**: Domain keywords (startup, product, market, etc.)
- **Goal**: Inferred objective
- **Timeframe**: Extracted time horizon
- **Risk Score**: Computed risk level (0-1)
- **Trend Detection**: Is this about trends vs. static state?
- **Keywords**: Key terms for context
- **Confidence**: Parsing confidence score

### Usage

```typescript
import { QuestionLayer } from './layers/QuestionLayer';

// Configure NLP
QuestionLayer.configureNLP({
    extractVerbs: true,
    extractEntities: true,
    computeRiskScore: true,
    detectTrend: true
});

// Parse question
const question = QuestionLayer.parse(
    'Should I invest in AI technology now or wait for market maturity?'
);

console.log(question.verbs);        // ['invest', 'wait']
console.log(question.entities);     // ['AI', 'technology', 'market']
console.log(question.riskScore);    // 0.55
console.log(question.isTrendDetected); // true
console.log(question.confidence);   // 0.72
```

### Supported Languages
- English
- Chinese (Traditional & Simplified)

### Future Enhancements
Configure with LLM/embeddings:

```typescript
QuestionLayer.configureNLP({
    extractVerbs: true,
    embeddings: {
        provider: 'openai',
        apiKey: 'sk-...',
        model: 'text-embedding-3-small'
    }
});
```

---

## 📚 Feature 3: Ten Wings Support

### What It Does
Extends hexagram data to include structured traditional commentaries (彖傳, 象傳, 文言, etc.).

### Data Schema

```json
{
  "number": 1,
  "name": "乾",
  "judgment": "元亨利貞",
  "lineTexts": ["潛龍勿用", "見龍在田...", "..."],
  "tags": ["strength", "creativity", "heaven"],
  "tenWings": {
    "tuan": "大哉乾元...",
    "xiang": "天行健...",
    "wenYan": "元者善之長也...",
    "shuoGua": "乾為天...",
    "xuGua": "有天地，然後萬物生焉...",
    "zaGua": "乾剛坤柔..."
  },
  "lineAnnotations": [
    {
      "position": 1,
      "tuan": "潛龍勿用，陽在下也",
      "xiang": "潛龍勿用，陽氣潛藏",
      "tags": ["beginning", "patience", "潛藏"]
    }
    // ... more lines
  ]
}
```

### Usage

The system automatically loads Ten Wings data if present in `data/hexagrams.json`. To add Ten Wings content:

1. Edit `data/hexagrams.json`
2. Add `tenWings` and `lineAnnotations` fields to hexagram entries
3. The engine will include them in interpretations

### Benefits
- Deeper semantic understanding
- Multiple interpretation traditions
- Line-level commentary
- Cultural context preservation

---

## 📊 Feature 4: Quantitative Signal Model

### What It Does
Evaluates time-series KPI data and produces quantitative decision signals that can be combined with IChing guidance.

### Supported Analyses
- **Trend Detection**: Slope computation via linear regression
- **Threshold Crossing**: Good/warning/bad level detection
- **Signal Generation**: Positive/negative/neutral signals
- **Confidence Scoring**: Data quality assessment
- **Volatility Analysis**: Stability measurement

### Usage

```typescript
import { SignalModel } from './signals/SignalModel';
import kpiDefs from '../data/kpis.json';

const model = new SignalModel(kpiDefs);

// Evaluate a KPI time series
const result = model.evaluateKPI({
    kpiId: 'user_churn_rate',
    values: [0.08, 0.09, 0.11, 0.13, 0.15, 0.18]
});

console.log(result);
// {
//   kpiId: 'user_churn_rate',
//   signal: 'negative',
//   slope: 0.02,
//   lastValue: 0.18,
//   thresholdCrossed: 'bad',
//   trigger: 'Monthly user churn rate crossed bad threshold (0.18)',
//   confidence: 0.75
// }
```

### KPI Definition Format

Edit `data/kpis.json`:

```json
{
  "kpiId": "net_promoter_score",
  "description": "Net Promoter Score (NPS)",
  "direction": "higher",
  "thresholds": {
    "good": 30,
    "warning": 0,
    "bad": -30
  },
  "window": 3
}
```

### Combining with IChing

```typescript
// Get IChing decision
const decision = engine.run('Should we focus on retention or acquisition?');

// Get KPI signals
const signals = model.evaluateMultiple([churnSeries, revenueSeries]);

// Synthesize
if (signals[0].signal === 'negative' && decision.decision.action === 'wait') {
    console.log('Data suggests urgency, but IChing advises patience.');
    console.log('Recommendation: Phased approach.');
}
```

### Benefits
- **Data-Driven**: Complements intuition with metrics
- **Quantifiable**: Measurable decision thresholds
- **Trend-Aware**: Detects momentum and reversals
- **Integrated**: Works seamlessly with IChing guidance

---

## ⚙️ Feature 5: Parametrizable Strategies

### What It Does
Moves interpretation strategies from hard-coded logic to configurable JSON, enabling customization and learning.

### Strategy Configuration

Edit `data/strategies.json`:

```json
{
  "engineering": {
    "0": { "focus": "judgment", "weights": { "primary": 1.0, "relating": 0.0, "mutual": 0.0 } },
    "1": { "focus": "line", "weights": { "primary": 0.6, "relating": 0.3, "mutual": 0.1 } },
    "2": { "focus": "both-lines", "weights": { "primary": 0.5, "relating": 0.35, "mutual": 0.15 } }
    // ... strategies for 0-6 moving lines
  },
  "zhuxi": { /* traditional Zhu Xi strategy */ },
  "meihua": { /* Plum Blossom strategy */ }
}
```

### Custom Strategies

Add your own strategy profile:

```json
{
  "my_custom_strategy": {
    "0": { "focus": "judgment", "weights": { "primary": 0.9, "relating": 0.0, "mutual": 0.1 } }
    // ... define all 0-6
  }
}
```

### Usage

```typescript
const engine = new DecisionEngine({
    strategyProfile: 'my_custom_strategy'
});
```

### Future: Learning Pipeline

*Coming soon: StrategyTrainer for learning optimal weights from historical decisions*

```typescript
// Planned API
import { StrategyTrainer } from './strategy/StrategyTrainer';

const trainer = new StrategyTrainer();
trainer.loadDataset('data/training_dataset.jsonl');
const learnedStrategy = trainer.train({ epochs: 100 });
trainer.saveStrategy('data/strategies.json', 'learned_v1');
```

---

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run Enhanced Demo

```bash
npm run build
node dist/runEnhancedDemo.js
```

### Basic Usage with All Features

```typescript
import { DecisionEngine } from './src/DecisionEngine';
import { SignalModel } from './src/signals/SignalModel';

// Initialize with all features
const engine = new DecisionEngine({
    trace: { enabled: true, verbosity: 'detailed' },
    nlp: { 
        extractVerbs: true, 
        extractEntities: true,
        computeRiskScore: true,
        detectTrend: true
    },
    strategyProfile: 'engineering'
});

// Run decision
const result = engine.run(
    'Should I pivot our product strategy given declining engagement?',
    {
        context: 'SaaS product facing user churn',
        riskPreference: 'balanced',
        constraints: ['limited runway', 'competitive pressure']
    }
);

// Output
console.log('Decision:', result.decision.action);
console.log('Confidence:', result.decision.confidence);
console.log('Reasoning:', result.decision.reasoning);

// Review trace
if (result.trace) {
    result.trace.forEach(event => {
        console.log(`[${event.stage}] ${event.message}`);
    });
}
```

---

## 📁 File Structure

```
src/
  ├── tracing/
  │   └── Tracer.ts              # Explanation traceability
  ├── nlp/
  │   └── QuestionNLP.ts         # NLP question parsing
  ├── signals/
  │   └── SignalModel.ts         # KPI signal analysis
  ├── strategy/
  │   └── StrategyTrainer.ts     # (Future) Learning pipeline
  ├── layers/
  │   ├── QuestionLayer.ts       # Enhanced with NLP
  │   ├── CastingLayer.ts        # Enhanced with tracing
  │   ├── HexagramLayer.ts       # Enhanced with tracing
  │   ├── InterpretationLayer.ts # Ten Wings support + tracing
  │   ├── RuleEngineLayer.ts     # Strategy config + tracing
  │   └── OutputLayer.ts         # Enhanced with tracing
  ├── DecisionEngine.ts          # Main orchestrator
  ├── types.ts                   # Extended types
  └── runEnhancedDemo.ts         # Comprehensive demo

data/
  ├── hexagrams.json             # Can include tenWings, lineAnnotations
  ├── kpis.json                  # KPI definitions
  ├── strategies.json            # Strategy configurations
  └── training_dataset.jsonl    # (Future) Training data
```

---

## 🔧 Configuration Options

### DecisionEngineOptions

```typescript
interface DecisionEngineOptions {
    castingMethod?: 'three-coins' | 'yarrow-stalk' | 'timestamp';
    castingSeed?: number;
    strategyProfile?: 'zhuxi' | 'meihua' | 'engineering' | string;
    language?: 'zh-TW' | 'en';
    dataPath?: string;
    
    // New options
    trace?: boolean | {
        enabled?: boolean;
        verbosity?: 'minimal' | 'detailed' | 'full';
    };
    nlp?: {
        extractVerbs?: boolean;
        extractEntities?: boolean;
        computeRiskScore?: boolean;
        detectTrend?: boolean;
        embeddings?: {
            provider?: 'openai' | 'local';
            apiKey?: string;
            model?: string;
        };
    };
}
```

---

## 📈 Performance Notes

- **NLP**: Heuristic-based parsing adds ~5-10ms latency (negligible)
- **Tracing**: Adds ~2-5ms per layer (6 layers = ~30ms max)
- **Signal Model**: O(n) where n = time series length (typically <100 points = <1ms)
- **Overall**: Enhanced features add <50ms to typical execution

For production with LLM/embeddings, expect 200-500ms additional latency per API call.

---

## 🎯 Use Cases

### 1. Product Decisions
- Combine user metrics (churn, NPS) with IChing guidance
- Trace reasoning for team alignment
- Extract strategic keywords from stakeholder questions

### 2. Investment Analysis
- Evaluate market KPIs alongside traditional wisdom
- Detect trend reversals and threshold crossings
- Document decision rationale with trace logs

### 3. Team Planning
- Parse sprint retrospective questions with NLP
- Track velocity and satisfaction KPIs
- Apply configurable interpretation strategies per team

### 4. Personal Development
- Understand decision patterns via trace analysis
- Combine quantitative goals (fitness, finances) with guidance
- Learn from historical decisions with strategy training (coming soon)

---

## 🛠️ Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Add Custom KPIs

Edit `data/kpis.json` and add your definitions.

### Customize Strategies

Edit `data/strategies.json` to adjust interpretation weights.

### Extend NLP

Modify `src/nlp/QuestionNLP.ts` to add language support or integrate external APIs.

---

## 📚 Further Reading

- Original README: [README.md](../README.md)
- Trace Examples: [trace-output.json](../trace-output.json) (generated by demo)
- API Documentation: (Coming soon)

---

## 🤝 Contributing

Contributions welcome! Priority areas:
1. LLM/embedding integration for NLP
2. Strategy training pipeline implementation
3. Ten Wings content curation
4. Multi-language NLP support
5. Additional KPI analysis methods

---

## 📄 License

(Same as main project)

---

**Built with wisdom and data 🎋📊**
