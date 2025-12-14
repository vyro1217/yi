import { Line, LineType } from './types';

// Simple xorshift32 PRNG for deterministic results from a seed
class XorShift32 {
    private state: number;
    constructor(seed: number) {
        this.state = seed >>> 0;
        if (this.state === 0) this.state = 0xdeadbeef;
    }
    next(): number {
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        return this.state;
    }
    // return 0..1
    nextFloat(): number {
        return this.next() / 0xFFFFFFFF;
    }
}

// castingMethod: { roll(pos) => 6|7|8|9 }
export function makeSeededCastingMethod(seed?: number | string) {
    let s = 0;
    if (seed === undefined) {
        s = Math.floor(Math.random() * 0xffffffff);
    } else if (typeof seed === 'number') s = seed;
    else s = hashStringToNumber(seed);

    const prng = new XorShift32(s);

    function roll(_: number): 6 | 7 | 8 | 9 {
        // map random float to 4 outcomes (6,7,8,9)
        const r = prng.nextFloat();
        if (r < 0.25) return 6;
        if (r < 0.5) return 7;
        if (r < 0.75) return 8;
        return 9;
    }

    return { roll, seed: s };
}

function hashStringToNumber(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
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
