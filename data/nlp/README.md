# NLP Training Data & Weak Labels

本目錄用於存放 NLP 模型訓練資料與弱標註（weak labels）資源。

## 目錄結構

```
data/nlp/
├── README.md                  # 本檔案
├── intents.jsonl              # Intent 分類標註範例
├── ner.jsonl                  # NER（實體抽取）標註範例
├── training_samples.jsonl    # 完整訓練樣本（含所有 NLP features）
└── weak_labels/               # 弱標註資料（由規則/啟發式方法生成）
```

## 資料格式說明

### intents.jsonl
每行一個 JSON 物件，包含：
- `text`: 原始問題文字
- `intent`: 意圖標籤（decide/timing/risk/strategy/diagnose/relationship/choose_one/other）
- `confidence`: 標註信心度（0-1）
- `domain`: 領域（career/love/money/health/project/business/other）
- `urgency`: 緊急度（0-1）
- `agency`: 主動權/控制度（0-1）
- `riskScore`: 風險分數（0-1）

### ner.jsonl
每行一個 JSON 物件，包含：
- `text`: 原始文字
- `entities`: 實體陣列，每個實體包含：
  - `type`: 實體類型（person/org/money/date/place/product/topic/temporal/numeric/option）
  - `text`: 實體文字
  - `value`: 正規化數值（若為 numeric/money）
  - `span`: 字元位置 [start, end]

### training_samples.jsonl
完整訓練樣本，每行包含：
- `text`: 原始問題
- `metadata`: 輸入元資料（context, options, riskPreference 等）
- `labels`: 完整的 NLP features 標註
  - `domain`, `intent`, `timeHorizon`, `urgency`, `riskTolerance`, `agency`
  - `emotionTone`, `entities`, `constraints`, `options`
  - `successMetrics`, `goal`

## 使用方式

### 1. 標註新資料
可手動編輯 `.jsonl` 檔案新增標註，或使用標註工具產生。

### 2. 弱標註生成
使用 `scripts/generate_weak_labels.ts` 從現有啟發式規則生成弱標註：
```bash
npm run generate-weak-labels
```

### 3. 訓練模型（Phase 2）
當累積足夠資料後，可使用這些標註來 fine-tune Transformer encoder：
```bash
# 未來實作
npm run train-nlp-model
```

## 資料品質指引

### 高品質標註準則
1. **一致性**：相似問題應有相同的 intent/domain 標籤
2. **覆蓋度**：確保涵蓋各種 domain × intent 組合
3. **邊界情況**：標註模糊案例（多意圖、跨領域）
4. **實體準確性**：確保 span 位置精確，value 正規化正確

### 建議標註流程
1. 使用現有 QuestionNLP heuristics 生成初始弱標註
2. 人工審核並修正（active learning）
3. 收集模型錯誤案例並補充標註
4. 定期更新與迭代

## 弱標註策略

### 規則生成（Rule-based）
- Intent: 根據關鍵詞模式匹配
- Domain: 根據領域關鍵詞匹配
- NER: 正則表達式抽取（時間/數字/金額）

### LLM 輔助標註（可選）
- 使用 GPT-4/Claude 生成初始標註
- 人工校正後作為訓練資料

### 主動學習（Active Learning）
- 模型對低信心樣本進行標註請求
- 優先標註模型不確定的案例

## 版本紀錄
- v0.1 (2025-12-14): 初始版本，含 8 筆 intent 範例、4 筆 NER 範例、2 筆完整訓練樣本
