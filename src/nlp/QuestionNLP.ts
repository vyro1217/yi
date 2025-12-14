// QuestionNLP: Heuristic-based NLP parsing for question enhancement
// Future: can be extended with embeddings/LLM

export interface NLPConfig {
    extractVerbs?: boolean;
    extractEntities?: boolean;
    computeRiskScore?: boolean;
    detectTrend?: boolean;
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

    // NLP enhancements
    verbs?: string[];
    entities?: string[];
    riskScore?: number; // 0-1, higher = more risky
    confidence?: number; // 0-1, parsing confidence
    isTrendDetected?: boolean;
    keywords?: string[];
    embedding?: number[]; // Future: vector representation
}

export class QuestionNLP {
    private config: NLPConfig;

    constructor(config: NLPConfig = {}) {
        this.config = {
            extractVerbs: config.extractVerbs !== false,
            extractEntities: config.extractEntities !== false,
            computeRiskScore: config.computeRiskScore !== false,
            detectTrend: config.detectTrend !== false,
            ...config
        };
    }

    /**
     * Parse question text and extract semantic features (heuristic-based)
     */
    parseText(rawQuestion: string, baseMetadata?: Partial<EnhancedQuestionMetadata>): EnhancedQuestionMetadata {
        const lowerQuestion = rawQuestion.toLowerCase();

        // Extract verbs (simple heuristic)
        const verbs = this.config.extractVerbs 
            ? this.extractVerbs(lowerQuestion)
            : undefined;

        // Extract entities (basic keyword extraction)
        const entities = this.config.extractEntities
            ? this.extractEntities(lowerQuestion)
            : undefined;

        // Compute risk score
        const riskScore = this.config.computeRiskScore
            ? this.computeRiskScore(lowerQuestion, baseMetadata?.riskPreference)
            : undefined;

        // Detect if question is about trends vs static state
        const isTrendDetected = this.config.detectTrend
            ? this.detectTrend(lowerQuestion)
            : undefined;

        // Extract keywords
        const keywords = this.extractKeywords(lowerQuestion);

        // Compute confidence (simple heuristic based on question clarity)
        const confidence = this.computeConfidence(lowerQuestion, keywords);

        return {
            rawQuestion,
            context: baseMetadata?.context || '',
            goal: baseMetadata?.goal || this.extractGoal(lowerQuestion),
            timeframe: baseMetadata?.timeframe || this.extractTimeframe(lowerQuestion),
            constraints: baseMetadata?.constraints || [],
            riskPreference: baseMetadata?.riskPreference || 'balanced',
            verbs,
            entities,
            riskScore,
            confidence,
            isTrendDetected,
            keywords
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
            /(?:should i|can i|如何|是否) (.+?)[\?？。]/i,
            /(?:want to|need to|希望|需要) (.+?)[\?？。]/i
        ];

        for (const pattern of goalPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
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
            .split(/[\s\W]+/)
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
}
