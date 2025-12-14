PR: Add regex-first NLP features + optional nodejieba Chinese tokenization

Summary

- Adds an extensible, regex-first NLP pipeline to parse user questions into structured NLP features that feed the I Ching decision engine.
- Introduces `NLPFeatures` types and extends `StructuredQuestion` with intent/domain/urgency/agency/entitiesNormalized/normalizedQuestion etc.
- Enhances `QuestionNLP` with deterministic normalization, regex-based intent/domain classification, entity extraction, urgency/agency heuristics, and an optional `useChineseTokenizer` hook that will use `nodejieba` at runtime if available.
- Adds feature fusion in `RuleEngineLayer` so NLP features affect strategy weights and confidence.
- Adds a `data/nlp/` directory with sample `.jsonl` training data and a `runNLPDemo.ts` demo script.
- Adds `nodejieba` as an optional dependency and a script `generate-weak-labels` placeholder.

Why

This PR implements the MVP Phase 1 described in the design doc: shared encoder can come later, but we need a deterministic, rule-first NLP to provide the engine with actionable structured features now.

Files changed (high level)

- src/types.ts — new `NLP` types
- src/nlp/QuestionNLP.ts — core parsing logic and tokenization hook
- src/layers/QuestionLayer.ts — map NLP output into pipeline structured question
- src/layers/RuleEngineLayer.ts — feature fusion to adjust weights
- src/runNLPDemo.ts — independent NLP demo tool
- data/nlp/* — sample training / weak label files
- package.json — add nodejieba and scripts

Notes and testing

1. Build

```bash
npm install
npm run build
```

2. Run the NLP demo

```bash
node dist/runNLPDemo.js
```

3. Run the full demo

```bash
node dist/runNewDemo.js
```

tsconfig upgraded

This branch upgrades `tsconfig.json` to `ES2021` (lib: ["ES2021"]) so modern string APIs—such as `replaceAll`—are available. The codebase was adjusted to take advantage of this when safe. Ensure your Node runtime is v16+.

Compatibility & graceful degradation

- If `nodejieba` is not installed but `useChineseTokenizer` is enabled, the code gracefully falls back to a naive CJK spacing strategy so runtime fails are avoided.
- All new behavior is backward compatible: if `nlp` option is not provided to `DecisionEngine`, previous behavior remains.

Next steps

- (Optional) Integrate a lightweight transformer-based encoder for improved intent/NER.
- (Optional) Implement weak-label generation script that persists `runNLPDemo` results to `data/nlp/weak_labels/`.
- (Optional) Upgrade to ES2021 and adopt `replaceAll`/modern APIs across the codebase.

If you want, I can open a PR branch and push these changes; confirm and I will produce the PR branch & description.