import { SignalModel } from '../src/signals/SignalModel';
import { KPIDefinition } from '../src/types';

(async () => {
    const defs: KPIDefinition[] = [
        {
            kpiId: 'cpu',
            description: 'CPU usage',
            direction: 'lower',
            thresholds: { good: 50, warning: 75, bad: 90 },
            window: 5
        },
        {
            kpiId: 'nps',
            description: 'Net Promoter Score',
            direction: 'higher',
            thresholds: { good: 50, warning: 30, bad: 0 },
            window: 5
        }
    ];

    const model = new SignalModel(defs);

    // CPU rising to bad
    const cpuSeries = { kpiId: 'cpu', values: [30, 40, 60, 80, 95] };
    const cpuRes = model.evaluateKPI(cpuSeries);
    if (cpuRes.signal !== 'negative') {
        console.error('Expected CPU signal negative, got', cpuRes.signal);
        process.exit(2);
    }
    if (cpuRes.confidence <= 0) {
        console.error('Expected CPU confidence > 0, got', cpuRes.confidence);
        process.exit(3);
    }

    // NPS improving
    const npsSeries = { kpiId: 'nps', values: [10, 20, 30, 40, 55] };
    const npsRes = model.evaluateKPI(npsSeries);
    if (npsRes.signal !== 'positive') {
        console.error('Expected NPS positive, got', npsRes.signal);
        process.exit(4);
    }

    // Missing definition should be neutral with confidence 0
    const missing = { kpiId: 'unknown', values: [1,2,3] };
    const missRes = model.evaluateKPI(missing);
    if (missRes.signal !== 'neutral' || missRes.confidence !== 0) {
        console.error('Expected missing KPI neutral with 0 confidence, got', missRes);
        process.exit(5);
    }

    console.log('SignalModel tests passed');
    process.exit(0);
})();
