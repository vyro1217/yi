// Tracing infrastructure for explanation traceability
export type TraceStage = 
    | 'Question' 
    | 'Casting' 
    | 'Hexagram' 
    | 'Interpretation' 
    | 'Rule' 
    | 'Output';

export type TraceVerbosity = 'minimal' | 'detailed' | 'full';

export interface TraceEvent {
    stage: TraceStage;
    timestamp: number;
    detail: any;
    message?: string;
}

export interface TraceOptions {
    verbosity?: TraceVerbosity;
    enabled?: boolean;
}

export class Tracer {
    private events: TraceEvent[] = [];
    private options: TraceOptions;

    constructor(options: TraceOptions = {}) {
        this.options = {
            verbosity: options.verbosity || 'detailed',
            enabled: options.enabled !== false
        };
    }

    /**
     * Add a trace event
     */
    add(stage: TraceStage, detail: any, message?: string): void {
        if (!this.options.enabled) return;

        // Filter detail based on verbosity
        let filteredDetail = detail;
        if (this.options.verbosity === 'minimal') {
            filteredDetail = this.extractMinimalDetail(detail);
        }

        this.events.push({
            stage,
            timestamp: Date.now(),
            detail: filteredDetail,
            message
        });
    }

    /**
     * Get all trace events
     */
    getTrace(): TraceEvent[] {
        return [...this.events];
    }

    /**
     * Get trace as JSON-serializable object
     */
    toJSON(): { trace: TraceEvent[] } {
        return { trace: this.events };
    }

    /**
     * Clear all trace events
     */
    clear(): void {
        this.events = [];
    }

    /**
     * Get events for a specific stage
     */
    getStageEvents(stage: TraceStage): TraceEvent[] {
        return this.events.filter(e => e.stage === stage);
    }

    /**
     * Format trace as human-readable string
     */
    toString(): string {
        return this.events
            .map(e => `[${e.stage}] ${e.message || ''}\n${JSON.stringify(e.detail, null, 2)}`)
            .join('\n---\n');
    }

    private extractMinimalDetail(detail: any): any {
        if (!detail || typeof detail !== 'object') return detail;
        
        // For minimal verbosity, keep only key fields
        if (Array.isArray(detail)) {
            return detail.length > 5 
                ? `[${detail.length} items]` 
                : detail;
        }

        const minimal: any = {};
        const keyFields = ['goal', 'confidence', 'strategy', 'action', 'weights', 'keyLines', 'primaryKey'];
        
        for (const key of keyFields) {
            if (key in detail) {
                minimal[key] = detail[key];
            }
        }

        return Object.keys(minimal).length > 0 ? minimal : detail;
    }
}
