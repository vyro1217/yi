// Interpretation Layer: 解釋資料索引（純資料層）
import fs from 'fs';
import path from 'path';
import { Tracer } from '../tracing/Tracer';
import { TenWings, LineAnnotation } from '../types';

export interface HexagramData {
    number: number;
    name: string;
    judgment: string;      // 卦辭
    lineTexts: string[];   // 爻辭（6 條）
    tags: string[];        // 語義標籤
    semantics: HexagramSemantics;  // 語義資訊
    tenWings?: TenWings;           // 十翼
    lineAnnotations?: LineAnnotation[];  // 爻辭註釋
}

export interface HexagramSemantics {
    direction: 'advance' | 'retreat' | 'hold';      // 進/退/守
    risk: 'high' | 'medium' | 'low';                // 險/中/順
    action: 'attack' | 'defend' | 'wait' | 'adapt'; // 攻/守/待/應變
    harmony: 'conflict' | 'cooperate' | 'neutral';  // 爭/合/中
}

export class InterpretationLayer {
    private hexDB: Map<string, HexagramData>;
    private semanticsDB: Map<number, HexagramSemantics>;

    constructor(dataPath?: string) {
        const dir = dataPath || path.join(__dirname, '..', '..', 'data');
        
        // 載入 hexagrams.json
        const hexPathFull = path.join(dir, 'hexagrams.json');
        const hexPathSample = path.join(dir, 'hexagrams.sample.json');
        const hexPath = fs.existsSync(hexPathFull) ? hexPathFull : hexPathSample;
        const hexData = JSON.parse(fs.readFileSync(hexPath, 'utf-8'));
        this.hexDB = new Map(Object.entries(hexData));

        // 載入語義資料庫（先用預設值，可後續擴充為外部檔案）
        this.semanticsDB = this.loadDefaultSemantics();
    }

    getHexagram(key: string, tracer?: Tracer): HexagramData {
        const hex = this.hexDB.get(key);
        if (!hex) {
            console.warn(`Hexagram ${key} not found, using default.`);
            tracer?.add('Interpretation', { key, found: false }, 'Hexagram not found, using default');
            return {
                number: 0,
                name: '未知',
                judgment: '未知卦象',
                lineTexts: Array(6).fill('未知爻辭'),
                tags: [],
                semantics: this.getDefaultSemantics()
            };
        }
        const semantics = this.semanticsDB.get(hex.number) || this.getDefaultSemantics();
        
        tracer?.add('Interpretation', { 
            key, 
            number: hex.number, 
            name: hex.name,
            tags: hex.tags,
            hasTenWings: !!(hex as any).tenWings
        }, 'Hexagram data retrieved');
        
        return { 
            number: hex.number,
            name: hex.name,
            judgment: hex.judgment,
            lineTexts: hex.lineTexts,
            tags: hex.tags || [],
            semantics,
            tenWings: (hex as any).tenWings,
            lineAnnotations: (hex as any).lineAnnotations
        };
    }

    getSemantics(hexNum: number): HexagramSemantics {
        return this.semanticsDB.get(hexNum) || this.getDefaultSemantics();
    }

    // 預設語義資料庫（已補全 64 卦）
    private loadDefaultSemantics(): Map<number, HexagramSemantics> {
        const map = new Map<number, HexagramSemantics>();
        // 1-10
        map.set(1, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'neutral' });
        map.set(2, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'cooperate' });
        map.set(3, { direction: 'hold', risk: 'high', action: 'wait', harmony: 'conflict' });
        map.set(4, { direction: 'hold', risk: 'medium', action: 'wait', harmony: 'cooperate' });
        map.set(5, { direction: 'hold', risk: 'low', action: 'wait', harmony: 'neutral' });
        map.set(6, { direction: 'retreat', risk: 'high', action: 'defend', harmony: 'conflict' });
        map.set(7, { direction: 'advance', risk: 'medium', action: 'attack', harmony: 'cooperate' });
        map.set(8, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(9, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'neutral' });
        map.set(10, { direction: 'advance', risk: 'medium', action: 'adapt', harmony: 'neutral' });
        // 11-20
        map.set(11, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(12, { direction: 'retreat', risk: 'high', action: 'wait', harmony: 'conflict' });
        map.set(13, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(14, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(15, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'cooperate' });
        map.set(16, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(17, { direction: 'advance', risk: 'medium', action: 'adapt', harmony: 'cooperate' });
        map.set(18, { direction: 'hold', risk: 'medium', action: 'defend', harmony: 'conflict' });
        map.set(19, { direction: 'advance', risk: 'medium', action: 'wait', harmony: 'neutral' });
        map.set(20, { direction: 'hold', risk: 'low', action: 'wait', harmony: 'neutral' });
        // 21-30
        map.set(21, { direction: 'advance', risk: 'medium', action: 'attack', harmony: 'conflict' });
        map.set(22, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'neutral' });
        map.set(23, { direction: 'retreat', risk: 'high', action: 'defend', harmony: 'conflict' });
        map.set(24, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(25, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'neutral' });
        map.set(26, { direction: 'advance', risk: 'low', action: 'defend', harmony: 'neutral' });
        map.set(27, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'neutral' });
        map.set(28, { direction: 'advance', risk: 'high', action: 'attack', harmony: 'conflict' });
        map.set(29, { direction: 'hold', risk: 'high', action: 'defend', harmony: 'conflict' });
        map.set(30, { direction: 'advance', risk: 'medium', action: 'attack', harmony: 'neutral' });
        // 31-40
        map.set(31, { direction: 'advance', risk: 'medium', action: 'adapt', harmony: 'cooperate' });
        map.set(32, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'cooperate' });
        map.set(33, { direction: 'retreat', risk: 'medium', action: 'defend', harmony: 'neutral' });
        map.set(34, { direction: 'advance', risk: 'high', action: 'attack', harmony: 'conflict' });
        map.set(35, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(36, { direction: 'retreat', risk: 'high', action: 'defend', harmony: 'conflict' });
        map.set(37, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'cooperate' });
        map.set(38, { direction: 'hold', risk: 'medium', action: 'adapt', harmony: 'conflict' });
        map.set(39, { direction: 'retreat', risk: 'high', action: 'wait', harmony: 'conflict' });
        map.set(40, { direction: 'advance', risk: 'medium', action: 'attack', harmony: 'cooperate' });
        // 41-50
        map.set(41, { direction: 'retreat', risk: 'medium', action: 'defend', harmony: 'neutral' });
        map.set(42, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(43, { direction: 'advance', risk: 'high', action: 'attack', harmony: 'conflict' });
        map.set(44, { direction: 'advance', risk: 'medium', action: 'adapt', harmony: 'neutral' });
        map.set(45, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(46, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(47, { direction: 'retreat', risk: 'high', action: 'defend', harmony: 'conflict' });
        map.set(48, { direction: 'hold', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(49, { direction: 'advance', risk: 'high', action: 'attack', harmony: 'conflict' });
        map.set(50, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        // 51-60
        map.set(51, { direction: 'advance', risk: 'high', action: 'attack', harmony: 'conflict' });
        map.set(52, { direction: 'hold', risk: 'low', action: 'defend', harmony: 'neutral' });
        map.set(53, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(54, { direction: 'hold', risk: 'medium', action: 'adapt', harmony: 'neutral' });
        map.set(55, { direction: 'advance', risk: 'low', action: 'attack', harmony: 'cooperate' });
        map.set(56, { direction: 'hold', risk: 'medium', action: 'adapt', harmony: 'neutral' });
        map.set(57, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(58, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(59, { direction: 'advance', risk: 'medium', action: 'adapt', harmony: 'cooperate' });
        map.set(60, { direction: 'hold', risk: 'medium', action: 'defend', harmony: 'neutral' });
        // 61-64
        map.set(61, { direction: 'advance', risk: 'low', action: 'adapt', harmony: 'cooperate' });
        map.set(62, { direction: 'hold', risk: 'medium', action: 'defend', harmony: 'neutral' });
        map.set(63, { direction: 'hold', risk: 'medium', action: 'defend', harmony: 'cooperate' });
        map.set(64, { direction: 'advance', risk: 'high', action: 'adapt', harmony: 'neutral' });
        return map;
    }

    private getDefaultSemantics(): HexagramSemantics {
        return { direction: 'hold', risk: 'medium', action: 'wait', harmony: 'neutral' };
    }

    // 批次取得（主卦、變卦、互卦）
    getAll(primaryKey: string, relatingKey: string, mutualKey: string, tracer?: Tracer) {
        tracer?.add('Interpretation', { primaryKey, relatingKey, mutualKey }, 'Loading hexagram data for all keys');
        
        return {
            primary: this.getHexagram(primaryKey, tracer),
            relating: this.getHexagram(relatingKey, tracer),
            mutual: this.getHexagram(mutualKey, tracer)
        };
    }
}
