import { Line, LineType } from './types';
import { hashStringToNumber, createPRNG } from './utils/prng';

// castingMethod: { roll(pos) => 6|7|8|9 }
export function makeSeededCastingMethod(seed?: number | string) {
    const prng = createPRNG(seed);

    function roll(_: number): 6 | 7 | 8 | 9 {
        const r = prng.nextFloat();
        if (r < 0.25) return 6;
        if (r < 0.5) return 7;
        if (r < 0.75) return 8;
        return 9;
    }

    return { roll, seed: (prng as any).seed };
}

export function parseCastingValue(value: 6 | 7 | 8 | 9, position: number): Line {
    switch (value) {
        case 6: return { type: LineType.YIN, isChanging: true, position };
        case 7: return { type: LineType.YANG, isChanging: false, position };
        case 8: return { type: LineType.YIN, isChanging: false, position };
        case 9: return { type: LineType.YANG, isChanging: true, position };
        default: throw new Error('invalid');
    }
}

export function castHexagram(castingMethod: { roll: (pos: number) => 6 | 7 | 8 | 9 }) {
    const lines: Line[] = [];
    for (let pos = 1; pos <= 6; pos++) {
        const v = castingMethod.roll(pos);
        lines.push(parseCastingValue(v, pos));
    }
    return lines;
}
