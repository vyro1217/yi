import { promises as fsp } from 'fs';
import path from 'path';

export interface WeakLabelEntry {
    timestamp: number;
    question: string;
    intentCandidates: Array<{ intent: string; confidence: number }>; 
}

export interface WeakLabelBatcherOptions {
    outDir?: string; // relative to project src
    outFile?: string; // file name
    flushIntervalMs?: number; // periodic flush
    batchSize?: number; // flush when reach
}

export class WeakLabelBatcher {
    private queue: WeakLabelEntry[] = [];
    private opts: WeakLabelBatcherOptions;
    private timer: NodeJS.Timeout | null = null;
    private flushing = false;

    constructor(opts: WeakLabelBatcherOptions = {}) {
        this.opts = {
            outDir: path.join(__dirname, '..', 'data', 'nlp', 'weak_labels'),
            outFile: 'weak_labels_output.jsonl',
            flushIntervalMs: 5000,
            batchSize: 50,
            ...opts
        };
        this.startTimer();
    }

    enqueue(entry: WeakLabelEntry) {
        this.queue.push(entry);
        if (this.queue.length >= (this.opts.batchSize || 50)) {
            this.flush().catch(() => {});
        }
    }

    private startTimer() {
        if (this.timer) return;
        this.timer = setInterval(() => {
            this.flush().catch(() => {});
        }, this.opts.flushIntervalMs);
    }

    async flush() {
        if (this.flushing) return;
        if (this.queue.length === 0) return;
        this.flushing = true;
        try {
            const outPath = path.join(this.opts.outDir!, this.opts.outFile!);
            await fsp.mkdir(this.opts.outDir!, { recursive: true });
            const toWrite = this.queue.map(e => JSON.stringify(e)).join('\n') + '\n';
            await fsp.appendFile(outPath, toWrite, 'utf8');
            this.queue = [];
        } finally {
            this.flushing = false;
        }
    }

    async shutdown() {
        if (this.timer) clearInterval(this.timer);
        await this.flush();
    }
}
