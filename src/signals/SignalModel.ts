// Signal Model: Time-series KPI analysis and quantitative signal detection
import { KPIDefinition, SignalResult } from '../types';

export interface KPITimeSeries {
    kpiId: string;
    values: number[];
    timestamps?: number[];
}

export class SignalModel {
    private kpiDefinitions: Map<string, KPIDefinition>;

    constructor(kpiDefs?: KPIDefinition[]) {
        this.kpiDefinitions = new Map();
        if (kpiDefs) {
            kpiDefs.forEach(def => this.kpiDefinitions.set(def.kpiId, def));
        }
    }

    /**
     * Load KPI definitions from a config
     */
    loadKPIs(kpiDefs: KPIDefinition[]): void {
        kpiDefs.forEach(def => this.kpiDefinitions.set(def.kpiId, def));
    }

    /**
     * Evaluate a KPI time series and produce a signal result
     */
    evaluateKPI(series: KPITimeSeries): SignalResult {
        const definition = this.kpiDefinitions.get(series.kpiId);
        
        if (!definition) {
            return {
                kpiId: series.kpiId,
                signal: 'neutral',
                confidence: 0,
                trigger: 'KPI definition not found'
            };
        }

        // Compute statistics
        const lastValue = series.values[series.values.length - 1];
        const slope = this.computeSlope(series.values, definition.window);
        const thresholdCrossed = this.checkThreshold(lastValue, definition);
        
        // Determine signal type
        const signal = this.determineSignal(lastValue, slope, definition);
        
        // Compute confidence based on data quality
        const confidence = this.computeConfidence(series.values, definition);

        // Generate trigger description
        const trigger = this.generateTrigger(signal, thresholdCrossed, lastValue, slope, definition);

        return {
            kpiId: series.kpiId,
            signal,
            slope,
            lastValue,
            thresholdCrossed,
            trigger,
            confidence
        };
    }

    /**
     * Evaluate multiple KPIs
     */
    evaluateMultiple(seriesList: KPITimeSeries[]): SignalResult[] {
        return seriesList.map(series => this.evaluateKPI(series));
    }

    /**
     * Compute slope (trend) using linear regression
     */
    private computeSlope(values: number[], window?: number): number {
        const data = window ? values.slice(-window) : values;
        
        if (data.length < 2) return 0;

        const n = data.length;
        const xMean = (n - 1) / 2;
        const yMean = data.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            const xDiff = i - xMean;
            const yDiff = data[i] - yMean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        }

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Check which threshold is crossed
     */
    private checkThreshold(value: number, definition: KPIDefinition): 'good' | 'warning' | 'bad' | undefined {
        const { thresholds, direction } = definition;

        if (direction === 'higher') {
            if (value >= thresholds.good) return 'good';
            if (value >= thresholds.warning) return 'warning';
            if (value < thresholds.bad) return 'bad';
        } else {
            // direction === 'lower'
            if (value <= thresholds.good) return 'good';
            if (value <= thresholds.warning) return 'warning';
            if (value > thresholds.bad) return 'bad';
        }

        return undefined;
    }

    /**
     * Determine signal type based on value, slope, and definition
     */
    private determineSignal(
        value: number,
        slope: number,
        definition: KPIDefinition
    ): 'positive' | 'negative' | 'neutral' {
        const threshold = this.checkThreshold(value, definition);
        
        // Strong signals based on threshold
        if (threshold === 'good') {
            return slope >= 0 ? 'positive' : 'neutral';
        }
        if (threshold === 'bad') {
            return slope <= 0 ? 'negative' : 'neutral';
        }

        // Trend-based signals
        const slopeThreshold = Math.abs(value) * 0.05; // 5% change rate
        
        if (definition.direction === 'higher') {
            if (slope > slopeThreshold) return 'positive';
            if (slope < -slopeThreshold) return 'negative';
        } else {
            if (slope < -slopeThreshold) return 'positive';
            if (slope > slopeThreshold) return 'negative';
        }

        return 'neutral';
    }

    /**
     * Compute confidence score based on data quality
     */
    private computeConfidence(values: number[], definition: KPIDefinition): number {
        if (values.length === 0) return 0;
        
        let confidence = 0.5;

        // More data = higher confidence
        if (values.length >= 10) confidence += 0.2;
        if (values.length >= 30) confidence += 0.1;

        // Check for data stability (low volatility = higher confidence)
        const volatility = this.computeVolatility(values);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const cv = mean !== 0 ? volatility / Math.abs(mean) : 1; // coefficient of variation

        if (cv < 0.1) confidence += 0.1; // stable
        if (cv > 0.5) confidence -= 0.2; // very volatile

        return Math.max(0.1, Math.min(1, confidence));
    }

    /**
     * Compute volatility (standard deviation)
     */
    private computeVolatility(values: number[]): number {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance);
    }

    /**
     * Generate human-readable trigger description
     */
    private generateTrigger(
        signal: 'positive' | 'negative' | 'neutral',
        threshold: 'good' | 'warning' | 'bad' | undefined,
        value: number,
        slope: number,
        definition: KPIDefinition
    ): string {
        const { description, direction } = definition;

        if (threshold === 'good') {
            return `${description} is at a good level (${value.toFixed(2)})`;
        }
        if (threshold === 'bad') {
            return `${description} crossed bad threshold (${value.toFixed(2)})`;
        }
        if (threshold === 'warning') {
            return `${description} at warning level (${value.toFixed(2)})`;
        }

        // Trend-based triggers
        const trendDirection = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
        const isGoodTrend = (direction === 'higher' && slope > 0) || (direction === 'lower' && slope < 0);

        if (Math.abs(slope) > 0.01) {
            return `${description} is ${trendDirection} (current: ${value.toFixed(2)}, trend: ${isGoodTrend ? 'positive' : 'negative'})`;
        }

        return `${description} is stable at ${value.toFixed(2)}`;
    }

    /**
     * Detect threshold crossings (useful for alerts)
     */
    detectThresholdCross(series: KPITimeSeries): { crossed: boolean; from?: string; to?: string } {
        const definition = this.kpiDefinitions.get(series.kpiId);
        if (!definition || series.values.length < 2) {
            return { crossed: false };
        }

        const prevValue = series.values[series.values.length - 2];
        const currValue = series.values[series.values.length - 1];

        const prevThreshold = this.checkThreshold(prevValue, definition);
        const currThreshold = this.checkThreshold(currValue, definition);

        if (prevThreshold !== currThreshold) {
            return {
                crossed: true,
                from: prevThreshold,
                to: currThreshold
            };
        }

        return { crossed: false };
    }

    /**
     * Detect trend changes (reversals)
     */
    detectTrendChange(series: KPITimeSeries, window: number = 3): { changed: boolean; direction?: string } {
        if (series.values.length < window * 2) {
            return { changed: false };
        }

        const recentSlope = this.computeSlope(series.values.slice(-window));
        const previousSlope = this.computeSlope(series.values.slice(-window * 2, -window));

        // Detect sign change
        if ((recentSlope > 0 && previousSlope < 0) || (recentSlope < 0 && previousSlope > 0)) {
            return {
                changed: true,
                direction: recentSlope > 0 ? 'upward' : 'downward'
            };
        }

        return { changed: false };
    }
}
