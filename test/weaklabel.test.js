const { WeakLabelBatcher } = require('../utils/WeakLabelBatcher');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'data', 'nlp', 'weak_labels');
const OUT_FILE = 'weak_labels_test_output.jsonl';

async function rmOut() {
    try { await fs.promises.unlink(path.join(OUT_DIR, OUT_FILE)); } catch(e) {}
}

async function readLines() {
    const p = path.join(OUT_DIR, OUT_FILE);
    const s = await fs.promises.readFile(p, 'utf8');
    return s.trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
}

(async () => {
    await rmOut();
    const batcher = new WeakLabelBatcher({ outDir: OUT_DIR, outFile: OUT_FILE, flushIntervalMs: 200, batchSize: 3 });

    const entries = [
        { timestamp: Date.now(), question: 'Q1', intentCandidates: [{ intent: 'decide', confidence: 0.5 }] },
        { timestamp: Date.now(), question: 'Q2', intentCandidates: [{ intent: 'timing', confidence: 0.6 }] },
        { timestamp: Date.now(), question: 'Q3', intentCandidates: [{ intent: 'risk', confidence: 0.4 }] }
    ];

    batcher.enqueue(entries[0]);
    await new Promise(r => setTimeout(r, 300));

    let lines = await readLines();
    if (lines.length !== 1) {
        console.error('Expected 1 line after timer flush, got', lines.length);
        process.exit(2);
    }

    batcher.enqueue(entries[1]);
    batcher.enqueue(entries[2]);
    await new Promise(r => setTimeout(r, 300));

    lines = await readLines();
    if (lines.length !== 3) {
        console.error('Expected 3 lines after batch flush, got', lines.length);
        process.exit(3);
    }

    await rmOut();
    batcher.enqueue(entries[0]);
    await batcher.shutdown();
    const exists = fs.existsSync(path.join(OUT_DIR, OUT_FILE));
    if (!exists) {
        console.error('Expected file after shutdown flush, file missing');
        process.exit(4);
    }

    const finalLines = await readLines();
    if (finalLines.length !== 1) {
        console.error('Expected 1 line in final file, got', finalLines.length);
        process.exit(5);
    }

    console.log('WeakLabelBatcher tests passed');
    process.exit(0);
})();
