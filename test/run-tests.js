const { spawnSync } = require('child_process');
const path = require('path');
const tests = ['weaklabel.test.js', 'signalmodel.test.js'];
let failed = false;

for (const t of tests) {
    console.log('Running', t);
    const res = spawnSync('node', [path.join(__dirname, t)], { cwd: process.cwd(), stdio: 'inherit' });
    if (res.status !== 0) {
        console.error('Test failed:', t);
        failed = true;
        break;
    }
}
process.exit(failed ? 2 : 0);
