// Quick validation script to test all enhanced features
import { DecisionEngine } from './DecisionEngine';
import { QuestionLayer } from './layers/QuestionLayer';
import { SignalModel } from './signals/SignalModel';

console.log('🧪 IChing Engine - Feature Validation\n');

let passed = 0;
let failed = 0;

// Test 1: Tracing
try {
    const engine = new DecisionEngine();
    const result = engine.run('Test question', {}, { trace: true });
    if (result.trace && result.trace.length > 0) {
        console.log('✅ Tracing: Works');
        passed++;
    } else {
        throw new Error('No trace events');
    }
} catch (e) {
    console.log('❌ Tracing: Failed -', (e as Error).message);
    failed++;
}

// Test 2: NLP
try {
    QuestionLayer.configureNLP({ extractVerbs: true, extractEntities: true });
    const parsed = QuestionLayer.parse('Should I launch the product now or wait?');
    if (parsed.verbs && parsed.verbs.length > 0 && parsed.confidence) {
        console.log('✅ NLP: Works');
        console.log('   Extracted:', parsed.verbs.slice(0, 3).join(', '));
        passed++;
    } else {
        throw new Error('NLP extraction failed');
    }
} catch (e) {
    console.log('❌ NLP: Failed -', (e as Error).message);
    failed++;
}

// Test 3: Signal Model
try {
    const model = new SignalModel([{
        kpiId: 'test_kpi',
        description: 'Test KPI',
        direction: 'higher',
        thresholds: { good: 10, warning: 5, bad: 0 }
    }]);
    const result = model.evaluateKPI({
        kpiId: 'test_kpi',
        values: [1, 2, 3, 5, 8, 12]
    });
    if (result.signal && result.slope !== undefined) {
        console.log('✅ Signal Model: Works');
        console.log('   Signal:', result.signal, '| Slope:', result.slope.toFixed(2));
        passed++;
    } else {
        throw new Error('Signal evaluation failed');
    }
} catch (e) {
    console.log('❌ Signal Model: Failed -', (e as Error).message);
    failed++;
}

// Test 4: Integration
try {
    const engine = new DecisionEngine({ nlp: { extractVerbs: true } });
    const result = engine.run('Integration test question', {
        riskPreference: 'balanced'
    }, {
        trace: { enabled: true, verbosity: 'minimal' },
        strategyProfile: 'engineering'
    });
    if (result.question.verbs && result.trace && result.decision.action) {
        console.log('✅ Full Integration: Works');
        console.log('   Decision:', result.decision.action, '| Confidence:', result.decision.confidence.toFixed(2));
        passed++;
    } else {
        throw new Error('Integration missing features');
    }
} catch (e) {
    console.log('❌ Full Integration: Failed -', (e as Error).message);
    failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests Passed: ${passed}/4`);
console.log(`Tests Failed: ${failed}/4`);

if (failed === 0) {
    console.log('\n🎉 All features validated successfully!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some features need attention');
    process.exit(1);
}
