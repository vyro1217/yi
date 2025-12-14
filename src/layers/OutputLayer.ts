// Output Layer: 決策輸出層（工程化輸出）
import { HexagramData, HexagramSemantics } from './InterpretationLayer';
import { RuleEngineOutput } from './RuleEngineLayer';
import { StructuredQuestion } from './QuestionLayer';

export interface DecisionOutput {
    // 核心決策
    action: 'do' | 'dont' | 'wait' | 'phased' | 'adapt';  // 做/不做/等待/分段做/應變
    timing: 'immediate' | 'conditional' | 'window' | 'delayed'; // 立即/待條件/時間窗口/延後
    
    // 執行計畫
    actionList: ActionItem[];
    
    // 風險管理
    risks: Risk[];
    mitigation: string[];  // 對沖/備案
    
    // 追蹤指標
    signals: Signal[];
    
    // 元資訊
    confidence: number;
    reasoning: string;     // 推論摘要
}

export interface ActionItem {
    step: number;
    description: string;
    priority: 'high' | 'medium' | 'low';
    timing?: string;
}

export interface Risk {
    description: string;
    severity: 'high' | 'medium' | 'low';
    trigger: string;       // 觸發條件
    probability: number;   // 0~1
}

export interface Signal {
    type: 'positive' | 'negative' | 'neutral';
    description: string;
    action: string;        // 出現此信號該做什麼
}

export class OutputLayer {
    // 生成決策輸出
    static generate(
        question: StructuredQuestion,
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        lang: 'zh-TW' | 'en' = 'zh-TW'
    ): DecisionOutput {
        // 決定行動建議
        const action = this.decideAction(hexData, ruleOutput, question);
        
        // 決定時機
        const timing = this.decideTiming(hexData, ruleOutput, question);
        
        // 生成行動清單
        const actionList = this.generateActionList(hexData, ruleOutput, question, lang);
        
        // 生成風險列表
        const risks = this.generateRisks(hexData, ruleOutput, question, lang);
        
        // 生成對沖方案
        const mitigation = this.generateMitigation(hexData, ruleOutput, question, lang);
        
        // 生成追蹤信號
        const signals = this.generateSignals(hexData, ruleOutput, question, lang);
        
        // 推論摘要
        const reasoning = this.generateReasoning(hexData, ruleOutput, question, lang);

        return {
            action,
            timing,
            actionList,
            risks,
            mitigation,
            signals,
            confidence: ruleOutput.confidence,
            reasoning
        };
    }

    private static decideAction(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion
    ): DecisionOutput['action'] {
        // 根據焦點卦象、動爻數與風險偏好決定
        const movingCount = ruleOutput.keyLines.length;
        
        if (movingCount === 0) {
            // 無動爻：看主卦卦辭判斷
            return question.riskPreference === 'conservative' ? 'wait' : 'do';
        }
        
        if (movingCount === 1) {
            // 1 動：最清晰，直接執行
            return 'do';
        }
        
        if (movingCount >= 3) {
            // 3+ 動：局勢不穩，分段執行或等待
            return question.riskPreference === 'aggressive' ? 'phased' : 'wait';
        }
        
        // 2 動：平衡模式
        return question.riskPreference === 'conservative' ? 'phased' : 'do';
    }

    private static decideTiming(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion
    ): DecisionOutput['timing'] {
        if (question.timeframe === 'immediate') return 'immediate';
        if (question.timeframe === 'long') return 'delayed';
        
        const movingCount = ruleOutput.keyLines.length;
        if (movingCount === 1 && ruleOutput.confidence > 0.8) return 'immediate';
        if (movingCount >= 4) return 'conditional';
        
        return 'window';
    }

    private static generateActionList(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion,
        lang: 'zh-TW' | 'en'
    ): ActionItem[] {
        const actions: ActionItem[] = [];
        
        if (lang === 'zh-TW') {
            actions.push({
                step: 1,
                description: `依據本卦${hexData.primary?.name || ''}：${hexData.primary?.judgment || '審視現況'}`,
                priority: 'high'
            });
            
            if (ruleOutput.keyLines.length > 0) {
                actions.push({
                    step: 2,
                    description: `關注第 ${ruleOutput.keyLines.join('、')} 爻的啟示`,
                    priority: 'high'
                });
            }
            
            if (ruleOutput.weights.relating > 0.3 && hexData.relating) {
                actions.push({
                    step: 3,
                    description: `準備轉向${hexData.relating.name}的趨勢`,
                    priority: 'medium'
                });
            }
        } else {
            actions.push({
                step: 1,
                description: `Based on primary hexagram ${hexData.primary?.name}: ${hexData.primary?.judgment || 'assess current state'}`,
                priority: 'high'
            });
            
            if (ruleOutput.keyLines.length > 0) {
                actions.push({
                    step: 2,
                    description: `Focus on lines ${ruleOutput.keyLines.join(', ')}`,
                    priority: 'high'
                });
            }
        }
        
        return actions;
    }

    private static generateRisks(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion,
        lang: 'zh-TW' | 'en'
    ): Risk[] {
        const risks: Risk[] = [];
        
        const movingCount = ruleOutput.keyLines.length;
        
        if (lang === 'zh-TW') {
            if (movingCount >= 3) {
                risks.push({
                    description: '局勢變動過快，計畫可能跟不上變化',
                    severity: 'high',
                    trigger: '多個動爻同時作用',
                    probability: 0.6
                });
            }
            
            if (ruleOutput.confidence < 0.6) {
                risks.push({
                    description: '卦象不明確，建議再次占卜確認',
                    severity: 'medium',
                    trigger: '信心度低於 60%',
                    probability: 0.5
                });
            }
            
            if (question.constraints.length > 0) {
                risks.push({
                    description: `現有限制（${question.constraints.join('、')}）可能影響執行`,
                    severity: 'medium',
                    trigger: '資源不足或條件不備',
                    probability: 0.4
                });
            }
        } else {
            if (movingCount >= 3) {
                risks.push({
                    description: 'Situation changing too rapidly',
                    severity: 'high',
                    trigger: 'Multiple moving lines active',
                    probability: 0.6
                });
            }
        }
        
        return risks;
    }

    private static generateMitigation(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion,
        lang: 'zh-TW' | 'en'
    ): string[] {
        const mitigation: string[] = [];
        
        if (lang === 'zh-TW') {
            if (ruleOutput.confidence < 0.7) {
                mitigation.push('分階段執行，每階段後重新評估');
            }
            
            if (question.riskPreference === 'conservative') {
                mitigation.push('設定停損點與退出機制');
            }
            
            mitigation.push('密切觀察外部環境變化');
        } else {
            if (ruleOutput.confidence < 0.7) {
                mitigation.push('Execute in phases, re-evaluate after each');
            }
            mitigation.push('Monitor external changes closely');
        }
        
        return mitigation;
    }

    private static generateSignals(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion,
        lang: 'zh-TW' | 'en'
    ): Signal[] {
        const signals: Signal[] = [];
        
        if (lang === 'zh-TW') {
            if (hexData.relating) {
                signals.push({
                    type: 'positive',
                    description: `環境出現與${hexData.relating.name}相符的跡象`,
                    action: '加速執行計畫'
                });
            }
            
            signals.push({
                type: 'negative',
                description: '原有動爻指示的條件發生反轉',
                action: '暫停並重新占卜'
            });
            
            signals.push({
                type: 'neutral',
                description: '時間窗口即將結束',
                action: '做最後決策或延期'
            });
        } else {
            signals.push({
                type: 'positive',
                description: 'Conditions align with relating hexagram',
                action: 'Accelerate plan execution'
            });
            
            signals.push({
                type: 'negative',
                description: 'Moving line conditions reverse',
                action: 'Pause and re-evaluate'
            });
        }
        
        return signals;
    }

    private static generateReasoning(
        hexData: { primary?: HexagramData; relating?: HexagramData; mutual?: HexagramData },
        ruleOutput: RuleEngineOutput,
        question: StructuredQuestion,
        lang: 'zh-TW' | 'en'
    ): string {
        if (lang === 'zh-TW') {
            const parts: string[] = [];
            parts.push(`針對「${question.rawQuestion}」的決策分析：`);
            parts.push(`本卦為${hexData.primary?.name || '未知'}，${hexData.primary?.judgment || ''}`);
            
            if (ruleOutput.keyLines.length > 0) {
                parts.push(`共有 ${ruleOutput.keyLines.length} 個動爻（位於第 ${ruleOutput.keyLines.join('、')} 爻）`);
            } else {
                parts.push(`無動爻，以卦辭為主要判斷依據`);
            }
            
            if (hexData.relating && ruleOutput.weights.relating > 0.3) {
                parts.push(`將轉向${hexData.relating.name}，顯示趨勢為：${hexData.relating.judgment || '待觀察'}`);
            }
            
            parts.push(`信心度：${(ruleOutput.confidence * 100).toFixed(0)}%`);
            
            return parts.join('\n');
        } else {
            return `Decision analysis for "${question.rawQuestion}": Primary hexagram is ${hexData.primary?.name || 'unknown'}, ${ruleOutput.keyLines.length} moving lines, confidence ${(ruleOutput.confidence * 100).toFixed(0)}%.`;
        }
    }
}
