# 易經決策引擎 (I Ching Decision Engine)

**6 層管線架構 + 工程化決策輸出**

## 特色

- **6 層可抽換管線**：Question → Casting → Hexagram → Interpretation → RuleEngine → Output
- **三種策略檔案**：朱熹（傳統）、梅花（互卦）、Engineering（平衡）
- **動爻智能處理**：0-6 動爻自動權重融合（主卦/變卦/互卦）
- **工程化輸出**：Action（做/不做/等待/分段/應變）、Timing（立即/條件/窗口/延後）、Risk、Mitigation、Signal
- **可種子化起卦**：三枚銅錢法、蓍草法、時間戳，支援確定性隨機
- **繁體中文 + 英文**：完整 64 卦 + 爻辭、多語言模板

## 快速開始

```bash
npm install
npm run build
node dist/runNewDemo.js
```

## 架構

### 6 層管線

```
QuestionLayer    自然語言 → 結構化問題（goal/timeframe/constraints/risk）
    ↓
CastingLayer     起卦方法（三枚銅錢/蓍草/時間戳）→ 6 爻陣列
    ↓
HexagramLayer    6 爻 → 本卦/之卦/互卦（bits 計算）
    ↓
InterpretationLayer  卦象編號 → 卦辭、爻辭、語義標籤
    ↓
RuleEngineLayer  動爻策略 + 權重融合 → 關鍵爻、置信度
    ↓
OutputLayer      決策合成 → Action/Timing/Risk/Mitigation/Signal
```

### 策略檔案

- **Zhuxi（朱熹）**: 傳統解讀，單動爻重本卦，多動爻看卦辭
- **Meihua（梅花）**: 強調互卦與變卦的相互關係
- **Engineering**: 平衡三卦權重，分階段決策

### 動爻處理

| 動爻數 | 策略 | 權重範例（Engineering） |
|-------|------|------------------------|
| 0 | 卦辭為主 | 主卦 1.0 |
| 1 | 該爻爻辭 | 主 0.6 / 變 0.3 / 互 0.1 |
| 2 | 兩爻加權，上爻較重 | 主 0.5 / 變 0.35 / 互 0.15 |
| 3 | 主變各半 | 主 0.35 / 變 0.35 / 互 0.3 |
| 4-5 | 偏向變卦 | 主 0.3 / 變 0.5 / 互 0.2 |
| 6 | 全變，以變卦為主 | 變 1.0 |

## 數據

- `data/hexagrams.json`: 完整 64 卦（卦辭、6 爻辭、語義標籤）
- `data/trigrams.json`: 8 個三爻卦
- 內建 64 卦語義資料庫（direction/risk/action/harmony）

## API

```typescript
import { DecisionEngine } from './DecisionEngine';

const engine = new DecisionEngine();
const result = engine.run(
    '應該立刻啟動新專案，還是等到 Q2？',
    {
        context: '團隊有 3 個人，預算 50 萬',
        goal: '最大化資源利用率',
        timeframe: '3 個月內',
        constraints: ['人力有限', '預算固定'],
        riskPreference: 'medium'
    },
    {
        castingMethod: 'three-coins',
        castingSeed: 202501,
        strategyProfile: 'engineering',
        language: 'zh-TW'
    }
);

console.log(result.decision.action);     // 'do' | 'dont' | 'wait' | 'phased' | 'adapt'
console.log(result.decision.timing);     // 'immediate' | 'conditional' | 'window' | 'delayed'
console.log(result.decision.risks);      // [{ severity, description, trigger, probability }]
console.log(result.decision.mitigation); // string[]
console.log(result.decision.signals);    // [{ type, description, metric }]
```

## 測試場景

`src/runNewDemo.ts` 包含三個工程化場景：
1. 專案啟動決策（工程策略）
2. 技術選型決策（朱熹策略）
3. 生產環境危機（梅花策略）

## 文件結構

```
src/
  ├── layers/
  │   ├── QuestionLayer.ts      問題建模
  │   ├── CastingLayer.ts       起卦方法
  │   ├── HexagramLayer.ts      卦象運算
  │   ├── InterpretationLayer.ts 資料索引
  │   ├── RuleEngineLayer.ts    推理引擎
  │   └── OutputLayer.ts        決策輸出
  ├── DecisionEngine.ts         主引擎
  ├── runNewDemo.ts             示範場景
  └── (legacy)
      ├── types.ts              舊版類型
      ├── cast.ts               舊版起卦
      ├── rules.ts              舊版規則
      └── IChingEngine.ts       舊版引擎

data/
  ├── hexagrams.json            64 卦資料
  └── trigrams.json             8 卦資料

dist/
  └── (編譯後的 JS 檔案)
```

## 授權

MIT

---

**設計原則**: 把「玄」變成「可計算的管線」，把「吉凶」變成「工程語言」。
