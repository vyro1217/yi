// NLP Demo: 測試 QuestionNLP 模組的功能
import { QuestionNLP } from './nlp/QuestionNLP';

console.log('易經 NLP 解析器測試\n');
console.log('='.repeat(80));

// 初始化 NLP 解析器
const nlp = new QuestionNLP({
    extractVerbs: true,
    extractEntities: true,
    computeRiskScore: true,
    detectTrend: true,
    deterministicNormalization: true
});

// 測試案例
const testCases = [
    {
        name: '專案時機決策（中文）',
        question: '我們應該立刻啟動新專案，還是等到 Q2？',
        metadata: {
            context: '團隊有 3 個人，預算 50 萬，現有專案還有 2 個月交付',
            options: ['立即啟動', '等到 Q2', '分階段啟動']
        }
    },
    {
        name: '投資選擇（英文）',
        question: 'Should we invest heavily in customer retention or focus on acquisition?',
        metadata: {
            context: 'Strategic planning based on recent metrics',
            riskPreference: 'conservative'
        }
    },
    {
        name: '危機處理（中文）',
        question: '生產環境 CPU 飆到 95%，該立即 rollback 還是先加機器？',
        metadata: {
            context: '線上 10 萬用戶受影響，上次部署在 2 小時前',
            options: ['立即 rollback', '橫向擴展', '重啟服務', '繼續調查'],
            riskPreference: 'aggressive'
        }
    },
    {
        name: '技術選型（英文）',
        question: 'How can I improve my team\'s productivity?',
        metadata: {
            context: 'Team of 10, current sprint velocity is low',
            timeframe: 'mid'
        }
    },
    {
        name: '診斷問題（中文）',
        question: '為什麼我的產品銷量一直下滑？',
        metadata: {
            context: '過去 3 個月從 5000 件降到 3000 件',
            riskPreference: 'balanced'
        }
    }
];

// 執行測試
testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('-'.repeat(80));
    
    const result = nlp.parseText(testCase.question, testCase.metadata);
    
    console.log(`原始問題: ${result.rawQuestion}`);
    console.log(`正規化:   ${result.normalizedQuestion || 'N/A'}`);
    console.log();
    
    // Core classification
    console.log('【分類結果】');
    console.log(`  Intent:        ${result.intent || 'N/A'} (信心: ${(result.intentConfidence || 0).toFixed(2)})`);
    console.log(`  Domain:        ${result.domain || 'N/A'}`);
    console.log(`  Goal:          ${result.goal}`);
    console.log(`  Timeframe:     ${result.timeframe}`);
    
    // Regression scores
    console.log();
    console.log('【數值特徵】');
    console.log(`  Urgency:       ${(result.urgency || 0).toFixed(2)}`);
    console.log(`  Agency:        ${(result.agency || 0).toFixed(2)}`);
    console.log(`  Risk Score:    ${(result.riskScore || 0).toFixed(2)}`);
    console.log(`  Confidence:    ${(result.confidence || 0).toFixed(2)}`);
    console.log(`  Emotion:       ${result.emotionTone || 'N/A'}`);
    console.log(`  Trend?         ${result.isTrendDetected ? 'Yes' : 'No'}`);
    
    // Extracted features
    if (result.keywords && result.keywords.length > 0) {
        console.log();
        console.log(`【關鍵詞】 ${result.keywords.slice(0, 8).join(', ')}`);
    }
    
    if (result.verbs && result.verbs.length > 0) {
        console.log(`【動詞】   ${result.verbs.join(', ')}`);
    }
    
    if (result.entities && result.entities.length > 0) {
        console.log(`【實體】   ${result.entities.join(', ')}`);
    }
    
    if (result.entitiesDetailed && result.entitiesDetailed.length > 0) {
        console.log();
        console.log('【詳細實體】');
        result.entitiesDetailed.forEach((entity: any) => {
            const spanInfo = entity.span ? ` [${entity.span[0]}:${entity.span[1]}]` : '';
            const valueInfo = entity.value !== undefined ? ` = ${entity.value}` : '';
            console.log(`  - ${entity.text} (${entity.type})${valueInfo}${spanInfo}`);
        });
    }
    
    if (result.optionsNormalized && result.optionsNormalized.length > 0) {
        console.log();
        console.log(`【正規化選項】 ${result.optionsNormalized.join(' | ')}`);
    }
    
    console.log();
});

console.log('='.repeat(80));
console.log('\n✨ NLP 測試完成！');
console.log('\n提示：這些輸出可匯出為 data/nlp/weak_labels/ 下的訓練資料。');
