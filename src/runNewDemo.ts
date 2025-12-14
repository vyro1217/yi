import { DecisionEngine } from './DecisionEngine';
import { QuestionLayer } from './layers/QuestionLayer';

// 測試場景 1：專案決策
async function demo1() {
    console.log('\n=== 場景 1：專案啟動決策（工程策略 + NLP） ===\n');

    const engine = new DecisionEngine({
        nlp: {
            extractVerbs: true,
            extractEntities: true,
            computeRiskScore: true,
            detectTrend: true,
            deterministicNormalization: true
        }
    });
    
    const result = await engine.run(
        '應該立刻啟動新專案，還是等到 Q2？',
        {
            context: '團隊有 3 個人，預算 50 萬，現有專案還有 2 個月交付',
            goal: '最大化資源利用率，降低風險',
            timeframe: '3 個月內',
            constraints: ['人力有限', '預算固定', '同時運行多專案'],
            options: ['立即啟動', '等到 Q2', '分階段啟動'],
            riskPreference: 'medium'
        },
        {
            castingMethod: 'three-coins',
            castingSeed: 202501,
            strategyProfile: 'engineering',
            language: 'zh-TW'
        }
    );

    printResult(result);
}

// 測試場景 2：技術選型
async function demo2() {
    console.log('\n=== 場景 2：技術選型決策（朱熹策略） ===\n');

    const engine = new DecisionEngine();
    const result = await engine.run(
        '我們該用 Microservices 還是 Monolith？',
        {
            context: '團隊 5 人，產品處於 MVP 階段，預計 1 年內規模擴大 3 倍',
            goal: '平衡開發速度與未來擴展性',
            timeframe: '需要在 2 週內決定',
            constraints: ['團隊經驗有限', '時間緊迫', '未來不確定性高'],
            options: ['Microservices', 'Modular Monolith', 'Pure Monolith'],
            riskPreference: 'low'
        },
        {
            castingMethod: 'yarrow-stalk',
            castingSeed: 202502,
            strategyProfile: 'zhuxi',
            language: 'zh-TW'
        }
    );

    printResult(result);
}

// 測試場景 3：危機應對
async function demo3() {
    console.log('\n=== 場景 3：生產環境危機（梅花策略） ===\n');

    const engine = new DecisionEngine();
    const result = await engine.run(
        '生產環境 CPU 飆到 95%，該立即 rollback 還是先加機器？',
        {
            context: '線上 10 萬用戶受影響，團隊正在調查根因，上次部署在 2 小時前',
            goal: '最快恢復服務，同時找到根本原因',
            timeframe: '30 分鐘內',
            constraints: ['用戶體驗受損', 'SLA 時鐘在跑', '根因未明'],
            options: ['立即 rollback', '橫向擴展', '重啟服務', '繼續調查'],
            riskPreference: 'high' // 高風險情境需要謹慎
        },
        {
            castingMethod: 'timestamp',
            strategyProfile: 'meihua',
            language: 'zh-TW'
        }
    );

    printResult(result);
}

// 格式化輸出
function printResult(result: any) {
    const { question, lines, hexStruct, decision } = result;

    // 1. 問題
    console.log('【問題】');
    console.log(`  原始問題: ${question.rawQuestion}`);
    if (question.normalizedQuestion) {
        console.log(`  正規化: ${question.normalizedQuestion}`);
    }
    console.log(`  目標: ${question.goal}`);
    console.log(`  時間框架: ${question.timeframe}`);
    console.log(`  風險偏好: ${question.riskPreference}`);

    // 1b. NLP Features (if available)
    if (question.intent || question.domain) {
        console.log('\n【NLP 分析】');
        if (question.intent) {
            console.log(`  意圖: ${question.intent} (信心度: ${(question.intentConfidence || 0).toFixed(2)})`);
            // Print intent candidates if available
            if ((question as any).intentCandidates && Array.isArray((question as any).intentCandidates)) {
                const cands = (question as any).intentCandidates as Array<{intent:string,confidence:number}>;
                console.log(`    候選意圖: ${cands.map(c => `${c.intent}(${c.confidence.toFixed(2)})`).join(', ')}`);
            }
        }
        if (question.domain) {
            console.log(`  領域: ${question.domain}`);
        }
        if (question.urgency !== undefined) {
            console.log(`  緊急度: ${question.urgency.toFixed(2)}`);
        }
        if (question.agency !== undefined) {
            console.log(`  主動權: ${question.agency.toFixed(2)}`);
        }
        if (question.emotionTone) {
            console.log(`  情緒: ${question.emotionTone}`);
        }
        if (question.riskScore !== undefined) {
            console.log(`  風險分數: ${question.riskScore.toFixed(2)}`);
        }
        if (question.confidence !== undefined) {
            console.log(`  解析信心: ${question.confidence.toFixed(2)}`);
        }
        if (question.keywords && question.keywords.length > 0) {
            console.log(`  關鍵詞: ${question.keywords.slice(0, 5).join(', ')}`);
        }
        if (question.entitiesDetailed && question.entitiesDetailed.length > 0) {
            console.log(`  實體: ${question.entitiesDetailed.map((e: any) => `${e.text}(${e.type})`).join(', ')}`);
        }
    }

    // 2. 卦象
    console.log('\n【卦象】');
    console.log(`  本卦: ${hexStruct.primaryKey} (${hexStruct.primaryNumber})`);
    console.log(`  之卦: ${hexStruct.relatingKey} (${hexStruct.relatingNumber})`);
    console.log(`  互卦: ${hexStruct.mutualKey} (${hexStruct.mutualNumber})`);
    const movingLines = lines.filter((l: any) => l.isMoving).map((l: any) => lines.indexOf(l) + 1);
    console.log(`  動爻: ${movingLines.join(', ') || '無'}`);

    // 3. 決策
    console.log('\n【決策】');
    console.log(`  行動: ${decision.action}`);
    console.log(`  時機: ${decision.timing}`);

    // 4. 行動清單
    if (decision.actionList && decision.actionList.length > 0) {
        console.log('\n【行動清單】');
        decision.actionList.forEach((item: any, i: number) => {
            console.log(`  ${i + 1}. [${item.priority}] ${item.description}`);
            if (item.rationale) console.log(`     理由: ${item.rationale}`);
        });
    }

    // 5. 風險
    if (decision.risks && decision.risks.length > 0) {
        console.log('\n【風險】');
        decision.risks.forEach((risk: any, i: number) => {
            console.log(`  ${i + 1}. [${risk.severity}] ${risk.description}`);
            console.log(`     觸發條件: ${risk.trigger}`);
            console.log(`     機率: ${risk.probability}`);
        });
    }

    // 6. 對沖/備案
    if (decision.mitigation && decision.mitigation.length > 0) {
        console.log('\n【對沖/備案】');
        decision.mitigation.forEach((m: string, i: number) => {
            console.log(`  ${i + 1}. ${m}`);
        });
    }

    // 7. 追蹤信號
        if (decision.signals && decision.signals.length > 0) {
        console.log('\n【追蹤信號】');
        const positive = decision.signals.filter((s: any) => s.type === 'positive');
        const negative = decision.signals.filter((s: any) => s.type === 'negative');
        const neutral = decision.signals.filter((s: any) => s.type === 'neutral');

        if (positive.length > 0) {
            console.log('  ✅ 正面信號:');
            positive.forEach((s: any) => console.log(`     - ${s.description}${s.action ? ` → ${s.action}` : ''}`));
        }
        if (negative.length > 0) {
            console.log('  ⚠️  負面信號:');
            negative.forEach((s: any) => console.log(`     - ${s.description}${s.action ? ` → ${s.action}` : ''}`));
        }
        if (neutral.length > 0) {
            console.log('  📊 中性指標:');
            neutral.forEach((s: any) => console.log(`     - ${s.description}${s.action ? ` → ${s.action}` : ''}`));
        }
    }

    console.log('\n' + '='.repeat(60));

}

// 執行所有測試
async function main() {
    console.log('易經決策引擎 - 6 層管線測試');
    console.log('Engine: DecisionEngine (Question → Casting → Hexagram → Interpretation → RuleEngine → Output)');

    await demo1();
    await demo2();
    await demo3();

    console.log('\n\n✨ 完成！所有場景已執行。');
}

main().catch(err => { console.error(err); process.exit(1); });
// Ensure batcher flush on exit
process.on('exit', () => {
    (async () => { try { await (QuestionLayer as any).shutdown(); } catch {} })();
});
