const { SignalModel } = require('../signals/SignalModel');

(async () => {
    const defs = [
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

    const cpuSeries = { kpiId: 'cpu', values: [30, 40, 60, 80, 95] };
    const cpuRes = model.evaluateKPI(cpuSeries);
    // CPU crossed bad threshold; signal may be 'negative' or 'neutral' depending on slope logic
    if (cpuRes.thresholdCrossed !== 'bad') {
        console.error('Expected CPU thresholdCrossed bad, got', cpuRes.thresholdCrossed);
        process.exit(2);
    }
    if (cpuRes.confidence <= 0) {
        console.error('Expected CPU confidence > 0, got', cpuRes.confidence);
        process.exit(3);
    }
    if (!['negative', 'neutral'].includes(cpuRes.signal)) {
        console.error('Expected CPU signal negative|neutral, got', cpuRes.signal);
        process.exit(4);
    }

    const npsSeries = { kpiId: 'nps', values: [10, 20, 30, 40, 55] };
    const npsRes = model.evaluateKPI(npsSeries);
    if (npsRes.signal !== 'positive') {
        console.error('Expected NPS positive, got', npsRes.signal);
        process.exit(4);
    }

    const missing = { kpiId: 'unknown', values: [1,2,3] };
    const missRes = model.evaluateKPI(missing);
    if (missRes.signal !== 'neutral' || missRes.confidence !== 0) {
        console.error('Expected missing KPI neutral with 0 confidence, got', missRes);
        process.exit(5);
    }

    console.log('SignalModel tests passed');
    process.exit(0);
})();
