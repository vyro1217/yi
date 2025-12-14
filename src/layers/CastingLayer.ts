// Casting Layer: 起卦/抽樣層（支援多種方式）
import { createPRNG } from '../utils/prng';
export type LineValue = 6 | 7 | 8 | 9;

export interface Line {
    value: LineValue;          // 6/7/8/9
    polarity: 'yin' | 'yang';  // yin: 6,8; yang: 7,9
    isMoving: boolean;         // 動爻：6,9
    position: number;          // 1..6
}

export interface CastingMethod {
    name: string;
    seed?: number;
    roll: (position: number) => LineValue;
}

export class CastingLayer {
    // 三枚銅錢法（機率固定）
    static threeCoins(seed?: number): CastingMethod {
        const prng = createPRNG(seed);
        return {
            name: 'three-coins',
            seed: (prng as any).seed,
            roll: (_pos) => {
                // 三枚硬幣：3正=9(老陽), 3反=6(老陰), 2正1反=7(少陽), 2反1正=8(少陰)
                const coins = [prng.nextInt(2), prng.nextInt(2), prng.nextInt(2)];
                const heads = coins.filter(c => c === 1).length;
                if (heads === 3) return 9;
                if (heads === 2) return 7;
                if (heads === 1) return 8;
                return 6;
            }
        };
    }

    // 蓍草法（機率不同）
    static yarrowStalk(seed?: number): CastingMethod {
        const prng = createPRNG(seed);
        return {
            name: 'yarrow-stalk',
            seed: (prng as any).seed,
            roll: (_pos) => {
                // 簡化蓍草：老陽1/16、老陰3/16、少陽5/16、少陰7/16
                const r = prng.nextInt(16);
                if (r < 1) return 9;   // 1/16
                if (r < 4) return 6;   // 3/16
                if (r < 9) return 7;   // 5/16
                return 8;              // 7/16
            }
        };
    }

    // 時間戳記法
    static timestamp(): CastingMethod {
        const ts = Date.now();
        const prng = createPRNG(ts);
        return {
            name: 'timestamp',
            seed: (prng as any).seed,
            roll: (pos) => {
                const values: LineValue[] = [6, 7, 8, 9];
                return values[prng.nextInt(4)];
            }
        };
    }

    // 解析 LineValue 為 Line
    static parseLine(value: LineValue, position: number): Line {
        const polarity = (value === 6 || value === 8) ? 'yin' : 'yang';
        const isMoving = (value === 6 || value === 9);
        return { value, polarity, isMoving, position };
    }

    // 執行起卦
    static cast(method: CastingMethod): Line[] {
        const lines: Line[] = [];
        for (let pos = 1; pos <= 6; pos++) {
            const value = method.roll(pos);
            lines.push(this.parseLine(value, pos));
        }
        return lines;
    }

    // makePRNG removed — use shared createPRNG util
}
