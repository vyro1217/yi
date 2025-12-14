// Question Layer: 自然語言問題 → 結構化模型
export interface StructuredQuestion {
    rawQuestion: string;
    context: string;           // 情境描述
    goal: string;              // 目標（what to achieve）
    timeframe: 'immediate' | 'short' | 'mid' | 'long' | string; // 時間尺度（允許自由文本）
    constraints: string[];     // 限制條件
    options?: string[];        // 選項集合（若為選擇題）
    riskPreference: 'conservative' | 'balanced' | 'aggressive' | string; // 風險偏好（允許自由文本）
}

export class QuestionLayer {
    // 簡化版：直接傳入結構化問題
    static parse(rawQuestion: string, metadata?: Partial<StructuredQuestion>): StructuredQuestion {
        return {
            rawQuestion,
            context: metadata?.context || '',
            goal: metadata?.goal || '尋求指引',
            timeframe: metadata?.timeframe || 'mid',
            constraints: metadata?.constraints || [],
            options: metadata?.options,
            riskPreference: metadata?.riskPreference || 'balanced'
        };
    }
}
