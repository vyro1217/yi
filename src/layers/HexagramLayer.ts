// Hexagram Layer: 卦象運算層
import { Line } from './CastingLayer';
import { Tracer } from '../tracing/Tracer';

export interface HexagramBits {
    primary: number;    // 本卦（6 bits: 0~63）
    relating: number;   // 之卦/變卦
    mutual: number;     // 互卦（由 2~5 爻組成）
}

export interface HexagramStructure {
    bits: HexagramBits;
    movingLines: number[];  // 動爻位置 [1..6]
    primaryKey: string;     // binary key (e.g., "111111")
    relatingKey: string;
    mutualKey: string;
    primaryNumber: number;  // 1-64
    relatingNumber: number;
    mutualNumber: number;
}

export class HexagramLayer {
    // 從 6 爻計算卦象
    static compute(lines: Line[], tracer?: Tracer): HexagramStructure {
        tracer?.add('Hexagram', { linesCount: lines.length }, 'Computing hexagram structure');
        
        // 1. 本卦（primary）
        const primaryBits = this.linesToBits(lines.map(l => l.polarity));
        const primaryKey = this.bitsToKey(primaryBits);

        // 2. 找動爻
        const movingLines = lines.filter(l => l.isMoving).map(l => l.position);

        // 3. 變卦（relating）- 動爻翻轉
        const relatingPolarities = lines.map(l => 
            l.isMoving ? (l.polarity === 'yang' ? 'yin' : 'yang') : l.polarity
        );
        const relatingBits = this.linesToBits(relatingPolarities);
        const relatingKey = this.bitsToKey(relatingBits);

        // 4. 互卦（mutual）- 取 2~5 爻（下互卦取 2~4，上互卦取 3~5）
        // 互卦定義：下卦為 2~4 爻，上卦為 3~5 爻
        const mutualPolarities: ('yin' | 'yang')[] = [
            lines[1].polarity, // 初爻（互卦下卦初）
            lines[2].polarity, // 二爻（互卦下卦中）
            lines[3].polarity, // 三爻（互卦下卦上 & 互卦上卦初）
            lines[2].polarity, // 四爻（互卦上卦中）= 原 3 爻
            lines[3].polarity, // 五爻（互卦上卦上）= 原 4 爻
            lines[4].polarity  // 上爻 = 原 5 爻
        ];
        const mutualBits = this.linesToBits(mutualPolarities);
        const mutualKey = this.bitsToKey(mutualBits);

        const result = {
            bits: { primary: primaryBits, relating: relatingBits, mutual: mutualBits },
            movingLines,
            primaryKey,
            relatingKey,
            mutualKey,
            primaryNumber: primaryBits + 1,
            relatingNumber: relatingBits + 1,
            mutualNumber: mutualBits + 1
        };

        tracer?.add('Hexagram', {
            primaryKey,
            relatingKey,
            mutualKey,
            movingLines,
            primaryNumber: result.primaryNumber,
            relatingNumber: result.relatingNumber,
            mutualNumber: result.mutualNumber
        }, 'Hexagram structure computed');

        return result;
    }

    // 爻陣列 → bits（初爻為 bit0）
    private static linesToBits(polarities: ('yin' | 'yang')[]): number {
        let bits = 0;
        for (let i = 0; i < 6; i++) {
            if (polarities[i] === 'yang') bits |= (1 << i);
        }
        return bits;
    }

    // bits → binary string key（"000000"~"111111"）
    private static bitsToKey(bits: number): string {
        let key = '';
        for (let i = 0; i < 6; i++) {
            key += (bits & (1 << i)) ? '1' : '0';
        }
        return key;
    }

    // key → bits（反向）
    static keyToBits(key: string): number {
        let bits = 0;
        for (let i = 0; i < 6; i++) {
            if (key[i] === '1') bits |= (1 << i);
        }
        return bits;
    }
}
