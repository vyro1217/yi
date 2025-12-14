export function hashStringToNumber(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
}

export function createPRNG(seed?: number | string) {
    let s: number;
    if (seed === undefined) {
        s = Math.floor(Math.random() * 0xffffffff) >>> 0;
    } else if (typeof seed === 'number') {
        s = seed >>> 0;
    } else {
        s = hashStringToNumber(seed);
    }
    if (s === 0) s = 0xdeadbeef;

    let state = s >>> 0;

    function next(): number {
        let x = state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        state = x >>> 0;
        return state;
    }

    return {
        seed: s,
        nextInt: (max: number) => {
            const v = next();
            return v % Math.max(1, max);
        },
        nextFloat: () => {
            return next() / 0xFFFFFFFF;
        }
    };
}
