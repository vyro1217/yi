import { IChingEngine, makeDefaultCasting } from './IChingEngine';
import { QueryContext } from './types';

function prettyPrint(reading: any) {
    console.log('=== 易經決策引擎 範例輸出 ===');
    console.log('本卦：', reading.primary.number, reading.primary.name);
    console.log('之卦：', reading.relating.number, reading.relating.name);
    console.log('變爻位置：', reading.changingPositions.join(','));
    console.log('階段：', reading.phase);
    console.log('重點：', reading.emphasis.join('、'));
    console.log('建議摘要：', reading.advice.summary);
    console.log('應做：');
    reading.advice.doList.forEach((d: string) => console.log('- ', d));
}

async function main() {
    const engine = new IChingEngine();
    const casting = makeDefaultCasting('demo-seed-123');
    const ctx: QueryContext = { question: '我應該投資新項目嗎？', timeframe: 'mid', constraints: ['資金有限'] };
    const reading = engine.ichingDecisionEngine(ctx, casting);
    prettyPrint(reading);
}

main();
