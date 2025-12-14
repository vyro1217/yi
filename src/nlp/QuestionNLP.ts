// QuestionNLP: Heuristic-based NLP parsing for question enhancement
// Future: can be extended with embeddings/LLM

export interface NLPConfig {
    extractVerbs?: boolean;
    extractEntities?: boolean;
    computeRiskScore?: boolean;
    detectTrend?: boolean;
    useChineseTokenizer?: boolean;  // Enable Chinese word segmentation (requires nodejieba)
    deterministicNormalization?: boolean;  // Ensure reproducible normalization
    weakLabelExport?: {
        enabled?: boolean;
        path?: string; // relative path to output jsonl
    };
    embeddings?: {
        provider?: 'openai' | 'local';
        apiKey?: string;
        model?: string;
    };
}

export interface EnhancedQuestionMetadata {
    // Original fields
    rawQuestion: string;
    context: string;
    goal: string;
    timeframe: string;
    constraints: string[];
    riskPreference: string;
    options?: string[];  // Add this field

    // NLP enhancements
    verbs?: string[];
    entities?: string[];
    riskScore?: number; // 0-1, higher = more risky
    confidence?: number; // 0-1, parsing confidence
    isTrendDetected?: boolean;
    keywords?: string[];
    embedding?: number[]; // Future: vector representation
    
    // Extended NLP features
    intent?: string;
    intentConfidence?: number;
    domain?: string;
    urgency?: number;
    agency?: number;
    emotionTone?: string;
    entitiesDetailed?: any[];  // DetailedEntity[] from types.ts
    normalizedQuestion?: string;
    optionsNormalized?: string[];
}

export class QuestionNLP {
    private readonly config: NLPConfig;

    constructor(config: NLPConfig = {}) {
        this.config = {
            extractVerbs: config.extractVerbs !== false,
            extractEntities: config.extractEntities !== false,
            computeRiskScore: config.computeRiskScore !== false,
            detectTrend: config.detectTrend !== false,
            useChineseTokenizer: config.useChineseTokenizer || false,
            deterministicNormalization: config.deterministicNormalization !== false,
            ...config
        };
    }

    /**
     * Parse question text and extract semantic features (heuristic-based)
     */
    parseText(rawQuestion: string, baseMetadata?: Partial<EnhancedQuestionMetadata>): EnhancedQuestionMetadata {
        // Step 1: Normalize text
        const normalizedQuestion = this.normalizeText(rawQuestion);
        const lowerQuestion = normalizedQuestion.toLowerCase();

        // Step 2: Extract verbs (simple heuristic)
        const verbs = this.config.extractVerbs 
            ? this.extractVerbs(lowerQuestion)
            : undefined;

        // Step 3: Extract entities (basic keyword extraction)
        const entities = this.config.extractEntities
            ? this.extractEntities(lowerQuestion)
            : undefined;

        // Step 4: Extract detailed entities with spans
        const entitiesDetailed = this.config.extractEntities
            ? this.extractEntitiesDetailed(rawQuestion, normalizedQuestion)
            : undefined;

        // Step 5: Classify intent (top-K candidates)
        const intentResult = this.classifyIntent(lowerQuestion);

        // Step 6: Classify domain
        const domain = this.classifyDomain(lowerQuestion);

        // Step 7: Compute risk score
        const riskScore = this.config.computeRiskScore
            ? this.computeRiskScore(lowerQuestion, baseMetadata?.riskPreference)
            : undefined;

        // Step 8: Compute urgency
        const urgency = this.computeUrgency(lowerQuestion);

        // Step 9: Compute agency (user's control level)
        const agency = this.computeAgency(lowerQuestion);

        // Step 10: Detect emotion tone
        const emotionTone = this.detectEmotionTone(lowerQuestion);

        // Step 11: Detect if question is about trends vs static state
        const isTrendDetected = this.config.detectTrend
            ? this.detectTrend(lowerQuestion)
            : undefined;

        // Step 12: Extract keywords
        const keywords = this.extractKeywords(lowerQuestion);

        // Step 13: Normalize options if provided
        const optionsNormalized = baseMetadata?.options
            ? this.normalizeOptions(baseMetadata.options)
            : undefined;

        // Step 14: Compute confidence (simple heuristic based on question clarity)
        const confidence = this.computeConfidence(lowerQuestion, keywords);

        return {
            rawQuestion,
            normalizedQuestion,
            context: baseMetadata?.context || '',
            goal: baseMetadata?.goal || this.extractGoal(lowerQuestion),
            timeframe: baseMetadata?.timeframe || this.extractTimeframe(lowerQuestion),
            constraints: baseMetadata?.constraints || [],
            riskPreference: baseMetadata?.riskPreference || 'balanced',
            verbs,
            entities,
            entitiesDetailed,
                intent: intentResult.intent,
                intentConfidence: intentResult.intentConfidence,
                // expose candidates for downstream validation/inspection
                // @ts-ignore runtime field
                intentCandidates: intentResult.intentCandidates,
            domain,
            urgency,
            agency,
            emotionTone,
            riskScore,
            confidence,
            isTrendDetected,
            keywords,
            optionsNormalized
        };
    }

    /**
     * Extract action verbs from question
     */
    private extractVerbs(text: string): string[] {
        const commonVerbs = [
            'start', 'begin', 'launch', 'initiate', 'create', 'build',
            'invest', 'buy', 'sell', 'trade', 'negotiate',
            'move', 'change', 'shift', 'transition',
            'wait', 'pause', 'delay', 'postpone',
            'expand', 'grow', 'scale', 'develop',
            'reduce', 'cut', 'minimize', 'optimize',
            'hire', 'fire', 'recruit', 'onboard',
            'partner', 'collaborate', 'merge', 'acquire'
        ];

        // Chinese verbs
        const chineseVerbs = [
            '開始', '啟動', '創建', '建立',
            '投資', '購買', '出售', '交易',
            '移動', '改變', '轉換',
            '等待', '暫停', '延遲',
            '擴展', '成長', '發展',
            '減少', '優化',
            '僱用', '招募', '合作'
        ];

        const allVerbs = [...commonVerbs, ...chineseVerbs];
        const found: string[] = [];

        for (const verb of allVerbs) {
            if (text.includes(verb)) {
                found.push(verb);
            }
        }

        return found.length > 0 ? found : ['尋求', 'seek']; // default
    }

    /**
     * Extract named entities (simplified - keywords for now)
     */
    private extractEntities(text: string): string[] {
        const domainKeywords = [
            'startup', 'company', 'business', 'project',
            'investment', 'funding', 'seed', 'series',
            'product', 'feature', 'service',
            'team', 'hire', 'employee', 'partner',
            'market', 'customer', 'user', 'client',
            '公司', '創業', '項目', '投資', '產品', '團隊', '市場'
        ];

        return domainKeywords.filter(kw => text.includes(kw));
    }

    /**
     * Compute risk score based on question content
     */
    private computeRiskScore(text: string, riskPreference?: string): number {
        let score = 0.5; // neutral

        // Adjust based on explicit preference
        if (riskPreference === 'aggressive') score += 0.2;
        if (riskPreference === 'conservative') score -= 0.2;

        // High-risk indicators
        const highRiskTerms = ['urgent', 'crisis', 'emergency', 'critical', 'immediately', '緊急', '危機', '立即'];
        const lowRiskTerms = ['stable', 'safe', 'secure', 'gradual', 'careful', '穩定', '安全', '謹慎'];

        highRiskTerms.forEach(term => {
            if (text.includes(term)) score += 0.1;
        });

        lowRiskTerms.forEach(term => {
            if (text.includes(term)) score -= 0.1;
        });

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Detect if question is about trends/changes vs static state
     */
    private detectTrend(text: string): boolean {
        const trendIndicators = [
            'trend', 'direction', 'momentum', 'growth', 'decline',
            'increasing', 'decreasing', 'rising', 'falling',
            'trajectory', 'forecast', 'future',
            '趨勢', '方向', '成長', '下降', '增加', '減少', '未來'
        ];

        return trendIndicators.some(term => text.includes(term));
    }

    /**
     * Extract goal from question text (heuristic)
     */
    private extractGoal(text: string): string {
        // Look for goal patterns
        const goalPatterns = [
            /(?:should i|can i|如何|是否) (.+?)[?？。]/i,
            /(?:want to|need to|希望|需要) (.+?)[?？。]/i
        ];

        for (const pattern of goalPatterns) {
            const match = pattern.exec(text);
            if (match?.[1]) {
                return match[1].trim();
            }
        }

        return '尋求指引';
    }

    /**
     * Extract timeframe from question text
     */
    private extractTimeframe(text: string): string {
        if (/(now|today|immediate|立即|現在|今天)/.test(text)) return 'immediate';
        if (/(week|month|短期|近期)/.test(text)) return 'short';
        if (/(quarter|半年|中期)/.test(text)) return 'mid';
        if (/(year|years|長期|未來)/.test(text)) return 'long';
        
        return 'mid'; // default
    }

    /**
     * Extract keywords (simplified tokenization)
     */
    private extractKeywords(text: string): string[] {
        // Remove common stop words and extract meaningful terms
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'should', 'can', 'will',
            '的', '了', '是', '在', '有', '我', '你', '他', '她', '這', '那', '嗎'
        ]);

        // Simple word extraction (split by non-word characters)
        const words = text
            .toLowerCase()
            .split(/[^\p{L}\p{N}]+/u)
            .filter(w => w.length > 2 && !stopWords.has(w));

        // Return unique keywords
        return [...new Set(words)].slice(0, 10);
    }

    /**
     * Compute parsing confidence score
     */
    private computeConfidence(text: string, keywords: string[]): number {
        let confidence = 0.5;

        // More keywords = clearer question
        if (keywords.length > 5) confidence += 0.2;
        if (keywords.length > 10) confidence += 0.1;

        // Question marks indicate clarity
        if (/[?？]/.test(text)) confidence += 0.1;

        // Very short questions are less clear
        if (text.length < 20) confidence -= 0.2;

        return Math.max(0.1, Math.min(1, confidence));
    }

    /**
     * Normalize text for deterministic processing
     * - Convert full-width to half-width
     * - Normalize whitespace
     * - Optional: Chinese tokenization
     */
    private normalizeText(text: string): string {
        let normalized = text;

        // Convert full-width characters to half-width
            normalized = normalized.replace(/[\uff01-\uff5e]/g, (ch) =>
                String.fromCodePoint(ch.codePointAt(0)! - 0xfee0)
            );

        // Normalize whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();

        // Chinese tokenization (if enabled and available)
        if (this.config.useChineseTokenizer) {
            // Try to load nodejieba if installed (optional runtime dependency)
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const nodejieba = require('nodejieba');
                const words: string[] = nodejieba.cut(normalized);
                normalized = words.join(' ').replace(/\s+/g, ' ').trim();
            } catch (err) {
                // Fallback: naive CJK spacing tokenization
                normalized = normalized.replace(/([\u4e00-\u9fff])/g, ' $1 ');
                normalized = normalized.replace(/\s+/g, ' ').trim();
            }
        }

        return normalized;
    }

    /**
     * Classify intent using keyword-based rules
     */
    private classifyIntent(text: string): { intent: string; intentConfidence: number; intentCandidates: Array<{ intent: string; confidence: number }> } {
        const intentPatterns = [
            { intent: 'decide', keywords: ['should', 'whether', 'or', 'choose', 'decide', '是否', '該不該', '還是', '選擇'], weight: 1 },
            { intent: 'timing', keywords: ['when', 'timing', 'time', 'now', 'later', '何時', '時機', '現在', '以後'], weight: 0.9 },
            { intent: 'risk', keywords: ['risk', 'danger', 'safe', 'threat', '風險', '危險', '安全'], weight: 0.85 },
            { intent: 'strategy', keywords: ['how', 'approach', 'method', 'strategy', 'plan', '如何', '方法', '策略', '計畫'], weight: 0.8 },
            { intent: 'diagnose', keywords: ['why', 'reason', 'cause', 'problem', 'issue', '為什麼', '原因', '問題'], weight: 0.8 },
            { intent: 'relationship', keywords: ['partner', 'team', 'relationship', 'collaborate', '合作', '關係', '團隊'], weight: 0.75 },
            { intent: 'choose_one', keywords: ['which', 'between', 'versus', 'vs', 'option', '哪個', '之間'], weight: 0.85 }
        ];

        const scores: Array<{ intent: string; confidence: number }> = [];

        for (const pattern of intentPatterns) {
            let matchCount = 0;
            for (const keyword of pattern.keywords) {
                if (text.includes(keyword)) {
                    matchCount++;
                }
            }
            if (matchCount > 0) {
                // Score adjusted to favor multiple matches and pattern weight
                const base = (matchCount / pattern.keywords.length);
                const confidence = Math.min(1, base * pattern.weight + 0.25 + Math.min(0.2, base));
                scores.push({ intent: pattern.intent, confidence });
            }
        }

        // Sort by confidence
        scores.sort((a, b) => b.confidence - a.confidence);

        // If nothing matched, return 'other' with default low confidence
        if (scores.length === 0) {
            return { intent: 'other', intentConfidence: 0.45, intentCandidates: [{ intent: 'other', confidence: 0.45 }] };
        }

        // Keep top-K candidates (K=3)
        const K = 3;
        const topK = scores.slice(0, K);

        // Validation logic: if top candidate is not sufficiently better than second, mark as low-confidence
        let primary = topK[0];
        if (topK.length > 1) {
            const delta = topK[0].confidence - topK[1].confidence;
            if (delta < 0.12) {
                // Ambiguous — lower reported confidence
                primary = { intent: primary.intent, confidence: Math.max(0.3, primary.confidence - 0.15) };
            }
        }

        return { intent: primary.intent, intentConfidence: primary.confidence, intentCandidates: topK };
    }

    /**
     * Classify domain using keyword-based rules
     */
    private classifyDomain(text: string): string {
        const domainPatterns = [
            { domain: 'career', keywords: ['job', 'career', 'work', 'hire', 'promotion', '工作', '職業', '升遷', '僱用'] },
            { domain: 'money', keywords: ['money', 'invest', 'finance', 'fund', 'salary', '錢', '投資', '財務', '薪資'] },
            { domain: 'business', keywords: ['business', 'company', 'startup', 'market', 'customer', '生意', '公司', '創業', '市場'] },
            { domain: 'project', keywords: ['project', 'feature', 'product', 'launch', 'develop', '專案', '產品', '開發', '啟動'] },
            { domain: 'health', keywords: ['health', 'medical', 'wellness', 'stress', '健康', '醫療', '壓力'] },
            { domain: 'love', keywords: ['love', 'relationship', 'marriage', 'date', '愛情', '感情', '婚姻', '約會'] }
        ];

        let maxScore = 0;
        let bestDomain = 'other';

        for (const pattern of domainPatterns) {
            let score = 0;
            for (const keyword of pattern.keywords) {
                if (text.includes(keyword)) {
                    score++;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                bestDomain = pattern.domain;
            }
        }

        return bestDomain;
    }

    /**
     * Extract detailed entities with type and span information
     */
    private extractEntitiesDetailed(originalText: string, normalizedText: string): any[] {
        const entities: any[] = [];

        // Temporal entities
        const temporalPatterns = [
            { pattern: /Q[1-4]/gi, type: 'temporal' },
            { pattern: /\d+\s*(年|month|months|week|weeks|day|days|hour|hours)/gi, type: 'temporal' },
            { pattern: /(今天|明天|下週|下月|next week|next month|tomorrow|today)/gi, type: 'temporal' }
        ];

        for (const { pattern, type } of temporalPatterns) {
            let match;
            while ((match = pattern.exec(originalText)) !== null) {
                entities.push({
                    type,
                    text: match[0],
                    span: [match.index, match.index + match[0].length]
                });
            }
        }

        // Numeric entities (money, percentages, quantities)
        const numericPatterns = [
            { pattern: /\d+\s*(萬|千|百|k|K|million|thousand)/gi, type: 'money' },
            { pattern: /\d+(\.\d+)?%/g, type: 'numeric' },
            { pattern: /\d+(?:\.\d+)?\s*(?:人|個|項)/g, type: 'numeric' }
        ];

        for (const { pattern, type } of numericPatterns) {
            let match;
            while ((match = pattern.exec(originalText)) !== null) {
                entities.push({
                    type,
                    text: match[0],
                    span: [match.index, match.index + match[0].length]
                });
            }
        }

        return entities;
    }

    /**
     * Compute urgency score (0-1)
     */
    private computeUrgency(text: string): number {
        let score = 0.3; // default low urgency

        const urgentTerms = ['urgent', 'immediately', 'asap', 'critical', 'emergency', 'now', '緊急', '立即', '馬上', '現在'];
        const nonUrgentTerms = ['later', 'eventually', 'someday', 'future', '以後', '未來', '遲些'];

        for (const term of urgentTerms) {
            if (text.includes(term)) score += 0.2;
        }

        for (const term of nonUrgentTerms) {
            if (text.includes(term)) score -= 0.15;
        }

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Compute agency (user's control/influence level, 0-1)
     */
    private computeAgency(text: string): number {
        let score = 0.5; // default medium agency

        const highAgencyTerms = ['i will', 'i can', 'my choice', 'decide', 'control', '我會', '我能', '我決定', '控制'];
        const lowAgencyTerms = ['forced', 'must', 'no choice', 'depend', 'wait for', '被迫', '必須', '沒選擇', '依賴', '等待'];

        for (const term of highAgencyTerms) {
            if (text.includes(term)) score += 0.15;
        }

        for (const term of lowAgencyTerms) {
            if (text.includes(term)) score -= 0.15;
        }

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Detect emotion tone from text
     */
    private detectEmotionTone(text: string): string {
        const tonePatterns = [
            { tone: 'anxious', keywords: ['worry', 'anxious', 'nervous', 'concern', 'afraid', '擔心', '焦慮', '緊張', '害怕'] },
            { tone: 'angry', keywords: ['angry', 'frustrated', 'upset', 'annoyed', '生氣', '憤怒', '不爽'] },
            { tone: 'excited', keywords: ['excited', 'eager', 'enthusiastic', 'looking forward', '興奮', '期待', '熱情'] },
            { tone: 'calm', keywords: ['calm', 'peaceful', 'stable', 'steady', '冷靜', '平靜', '穩定'] }
        ];

        const scores: { [key: string]: number } = {};

        for (const { tone, keywords } of tonePatterns) {
            let count = 0;
            for (const keyword of keywords) {
                if (text.includes(keyword)) count++;
            }
            if (count > 0) {
                scores[tone] = count;
            }
        }

        const tones = Object.keys(scores);
        if (tones.length === 0) return 'calm';
        if (tones.length > 1) return 'mixed';

        return tones[0];
    }

    /**
     * Normalize options (deduplicate, lowercase, trim)
     */
    private normalizeOptions(options: string[]): string[] {
        // Trim, collapse whitespace, normalize punctuation and case
        const normalized = options.map(opt => {
            let s = opt.trim();
            // Replace common Chinese punctuation with ASCII equivalents
            s = s.replace(/[，、；：？！（）【】「」『』]/g, m => ' ');
            s = s.replace(/[。]/g, '.');
            // Collapse whitespace
            s = s.replace(/\s+/g, ' ').trim();
            // Lowercase for Latin scripts but keep CJK as-is where appropriate
            if (/\p{Script=Latin}/u.test(s)) s = s.toLowerCase();
            return s;
        });

        // Heuristic canonicalizations: map synonyms
        const canonicalMap: { [k: string]: string } = {
            'wait': 'wait',
            'wait for more feedback': 'wait',
            'wait for feedback': 'wait',
            'launch': 'launch',
            'release': 'launch',
            'invest': 'invest',
            'focus on retention': 'retention',
            'focus on acquisition': 'acquisition'
        };

        const canonical = normalized.map(s => canonicalMap[s] || s);

        // Deduplicate while preserving order
        const seen = new Set<string>();
        const dedup: string[] = [];
        for (const v of canonical) {
            if (!seen.has(v)) {
                seen.add(v);
                dedup.push(v);
            }
        }

        return dedup;
    }
}
