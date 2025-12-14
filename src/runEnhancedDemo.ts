// Demo: Showcasing new IChing Engine features
// 1. Tracing/explanation
// 2. NLP-enhanced question parsing
// 3. KPI signal evaluation

import { DecisionEngine } from './DecisionEngine';
import { QuestionLayer } from './layers/QuestionLayer';
import { SignalModel } from './signals/SignalModel';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== IChing Decision Engine - Enhanced Features Demo ===\n');

// ============================================================
// Demo 1: Basic usage with tracing enabled
// ============================================================
console.log('--- Demo 1: Tracing & Explanation ---');

const engine = new DecisionEngine({
    castingSeed: 12345,
    strategyProfile: 'engineering',
    trace: {
        enabled: true,
        verbosity: 'detailed'
    },
    nlp: {
        extractVerbs: true,
        extractEntities: true,
        computeRiskScore: true,
        detectTrend: true
    }
});

const question1 = 'Should I launch our new product feature next month, or wait for more user feedback?';
const result1 = engine.run(question1, {
    context: 'Product development decision for SaaS startup',
    riskPreference: 'balanced',
    timeframe: 'short'
});

console.log('\n📋 Question Analysis:');
console.log('  Raw:', result1.question.rawQuestion);
console.log('  Goal:', result1.question.goal);
console.log('  Timeframe:', result1.question.timeframe);
console.log('  Risk Score:', result1.question.riskScore?.toFixed(2));
console.log('  Verbs:', result1.question.verbs?.join(', '));
console.log('  Entities:', result1.question.entities?.join(', '));
console.log('  Trend Detected:', result1.question.isTrendDetected);
console.log('  Confidence:', result1.question.confidence?.toFixed(2));

console.log('\n🎲 Casting Result:');
console.log('  Primary Hexagram:', result1.hexStruct.primaryNumber, `(${result1.hexStruct.primaryKey})`);
console.log('  Relating Hexagram:', result1.hexStruct.relatingNumber, `(${result1.hexStruct.relatingKey})`);
console.log('  Mutual Hexagram:', result1.hexStruct.mutualNumber, `(${result1.hexStruct.mutualKey})`);
console.log('  Moving Lines:', result1.hexStruct.movingLines.join(', ') || 'none');

console.log('\n💡 Decision:');
console.log('  Action:', result1.decision.action);
console.log('  Timing:', result1.decision.timing);
console.log('  Confidence:', result1.decision.confidence.toFixed(2));
console.log('  Reasoning:', result1.decision.reasoning);

console.log('\n🔍 Action Items:');
result1.decision.actionList.forEach(item => {
    console.log(`  ${item.step}. [${item.priority}] ${item.description}`);
});

console.log('\n⚠️  Risks:');
result1.decision.risks.forEach(risk => {
    console.log(`  - [${risk.severity}] ${risk.description}`);
    console.log(`    Trigger: ${risk.trigger} (p=${risk.probability.toFixed(2)})`);
});

console.log('\n📊 Signals to Watch:');
result1.decision.signals.forEach(signal => {
    // signal may be structured { type, description, action } or a string
    if (!signal) return;
    if (typeof signal === 'string') {
        console.log(`  ○ ${signal}`);
        return;
    }
    const desc = (signal.description || '').toString().trim();
    const action = (signal.action || '').toString().trim();
    const symbol = signal.type === 'positive' ? '✓' : signal.type === 'negative' ? '✗' : '○';
    if (desc.length > 0) console.log(`  ${symbol} ${desc}`);
    if (action.length > 0) console.log(`    → ${action}`);
});

// Show trace if available
if (result1.trace) {
    console.log('\n🔬 Execution Trace:');
    result1.trace.forEach(event => {
        console.log(`  [${event.stage}] ${event.message || 'Step executed'}`);
    });
    
    // Save detailed trace to file
    fs.writeFileSync(
        path.join(__dirname, '..', 'trace-output.json'),
        JSON.stringify({ trace: result1.trace }, null, 2)
    );
    console.log('\n✅ Detailed trace saved to trace-output.json');
}

// ============================================================
// Demo 2: NLP-only (without full engine)
// ============================================================
console.log('\n\n--- Demo 2: NLP Question Analysis ---');

QuestionLayer.configureNLP({
    extractVerbs: true,
    extractEntities: true,
    computeRiskScore: true,
    detectTrend: true
});

const questions = [
    'Is the market trend favorable for expansion into Southeast Asia?',
    '我們應該立即投資新技術，還是等待市場成熟？',
    'Can we safely reduce our burn rate without affecting product quality?'
];

questions.forEach((q, i) => {
    console.log(`\nQuestion ${i + 1}: "${q}"`);
    const parsed = QuestionLayer.parse(q);
    console.log('  → Goal:', parsed.goal);
    console.log('  → Timeframe:', parsed.timeframe);
    console.log('  → Risk Score:', parsed.riskScore?.toFixed(2));
    console.log('  → Verbs:', parsed.verbs?.slice(0, 3).join(', '));
    console.log('  → Keywords:', parsed.keywords?.slice(0, 5).join(', '));
    console.log('  → Trend Detected:', parsed.isTrendDetected);
    console.log('  → Confidence:', parsed.confidence?.toFixed(2));
});

// ============================================================
// Demo 3: KPI Signal Analysis
// ============================================================
console.log('\n\n--- Demo 3: KPI Signal Analysis ---');

// Load KPI definitions
const kpiDefsPath = path.join(__dirname, '..', 'data', 'kpis.json');
const kpiDefs = JSON.parse(fs.readFileSync(kpiDefsPath, 'utf-8'));
const signalModel = new SignalModel(kpiDefs);

// Simulate time series data
const churnRateSeries = {
    kpiId: 'user_churn_rate',
    values: [0.08, 0.09, 0.11, 0.13, 0.15, 0.18], // increasing churn (bad)
    timestamps: [1, 2, 3, 4, 5, 6]
};

const npsSeries = {
    kpiId: 'net_promoter_score',
    values: [25, 28, 32, 35, 38, 42], // increasing NPS (good)
    timestamps: [1, 2, 3, 4, 5, 6]
};

const revenueSeries = {
    kpiId: 'monthly_revenue',
    values: [45000, 47000, 46000, 48000, 47500, 48500], // stable/slight growth
    timestamps: [1, 2, 3, 4, 5, 6]
};

console.log('\n📊 KPI Signal Evaluation:\n');

const kpiResults = signalModel.evaluateMultiple([churnRateSeries, npsSeries, revenueSeries]);

kpiResults.forEach(result => {
    const emoji = result.signal === 'positive' ? '🟢' : result.signal === 'negative' ? '🔴' : '🟡';
    console.log(`${emoji} ${result.kpiId.toUpperCase()}`);
    console.log(`   Signal: ${result.signal}`);
    console.log(`   Last Value: ${result.lastValue?.toFixed(2)}`);
    console.log(`   Trend (slope): ${result.slope?.toFixed(4)}`);
    console.log(`   Threshold: ${result.thresholdCrossed || 'none'}`);
    console.log(`   Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`   Trigger: ${result.trigger}`);
    console.log('');
});

// Check for threshold crossings
console.log('🚨 Threshold Crossings:\n');
[churnRateSeries, npsSeries, revenueSeries].forEach(series => {
    const crossing = signalModel.detectThresholdCross(series);
    if (crossing.crossed) {
        console.log(`  - ${series.kpiId}: ${crossing.from} → ${crossing.to}`);
    }
});

// Check for trend changes
console.log('\n📈 Trend Changes:\n');
[churnRateSeries, npsSeries, revenueSeries].forEach(series => {
    const change = signalModel.detectTrendChange(series, 3);
    if (change.changed) {
        console.log(`  - ${series.kpiId}: trend reversed to ${change.direction}`);
    }
});

// ============================================================
// Demo 4: Combined Decision with KPI Context
// ============================================================
console.log('\n\n--- Demo 4: Integrated Decision (Question + KPI Signals) ---');

const question2 = 'Should we invest heavily in customer retention or focus on acquisition?';
const result2 = engine.run(question2, {
    context: 'Strategic planning based on recent metrics',
    riskPreference: 'conservative',
    constraints: ['limited budget', 'Q4 target pressure']
});

console.log('\n📋 Decision Context:');
console.log('  Question:', question2);
console.log('  Constraints:', result2.question.constraints.join(', '));

console.log('\n📊 Relevant KPI Signals:');
// Show churn rate signal (high churn = focus on retention)
const churnSignal = kpiResults.find(r => r.kpiId === 'user_churn_rate');
if (churnSignal) {
    console.log(`  - Churn Rate: ${churnSignal.signal} (${churnSignal.lastValue?.toFixed(2)})`);
    console.log(`    → ${churnSignal.trigger}`);
    if (churnSignal.signal === 'negative') {
        console.log('    ⚠️  High churn suggests focusing on retention!');
    }
}

console.log('\n💡 IChing Guidance:');
console.log('  Action:', result2.decision.action);
console.log('  Timing:', result2.decision.timing);
console.log('  Reasoning:', result2.decision.reasoning);

console.log('\n🎯 Synthesis:');
console.log('  Combining IChing wisdom with quantitative signals...');
if (churnSignal?.signal === 'negative' && result2.decision.action === 'wait') {
    console.log('  → IChing suggests patience, but KPI signals urgent action needed.');
    console.log('  → Recommendation: Prioritize retention (data-driven) but phase approach (wisdom).');
} else {
    console.log('  → IChing and KPI signals are aligned.');
}

console.log('\n\n=== Demo Complete ===');
console.log('\n💡 Next Steps:');
console.log('  - Check trace-output.json for detailed execution trace');
console.log('  - Review data/kpis.json to add custom KPIs');
console.log('  - Review data/strategies.json to customize interpretation strategies');
console.log('  - Configure NLP with embeddings/LLM for deeper semantic analysis');
console.log('  - Implement StrategyTrainer for learning from historical decisions\n');
