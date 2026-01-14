/**
 * 敬語・丁寧度シグナル抽出
 */

import type { PolitenessSignal, PolitenessLevel, TokenDetail } from '../types';
import politenessDict from '../dictionaries/politeness.json';

interface PatternDef {
  pattern: string;
  type: string;
  angerSignal?: boolean;
}

interface LevelDef {
  name: string;
  score: number;
  patterns: PatternDef[];
}

const levels = politenessDict.levels as Record<string, LevelDef>;

// 丁寧度の優先順位（高 → 低）
const LEVEL_PRIORITY: PolitenessLevel[] = ['honorific', 'polite', 'casual', 'rough'];

/**
 * テキストから敬語・丁寧度シグナルを抽出
 */
export function extractPoliteness(text: string, tokens: TokenDetail[]): PolitenessSignal {
  let detectedLevel: PolitenessLevel = 'casual';
  let detectedPriority = LEVEL_PRIORITY.indexOf('casual');
  let degradation = false;
  const degradationDetails: string[] = [];

  // 各レベルのパターンをチェック
  for (const [levelKey, levelDef] of Object.entries(levels)) {
    const level = levelKey as PolitenessLevel;

    for (const patternDef of levelDef.patterns) {
      if (text.includes(patternDef.pattern)) {
        const currentPriority = LEVEL_PRIORITY.indexOf(level);

        // より低い丁寧度（高いインデックス）を検出
        if (currentPriority > detectedPriority) {
          detectedLevel = level;
          detectedPriority = currentPriority;
        }

        // 怒りシグナル検出
        if (patternDef.angerSignal) {
          degradation = true;
          degradationDetails.push(`${patternDef.pattern} (${patternDef.type})`);
        }
      }
    }
  }

  // 敬語崩れの検出（丁寧語の中に荒い表現が混在）
  const hasPolite = text.match(/です|ます|ください/);
  const hasRough = LEVEL_PRIORITY.indexOf(detectedLevel) >= LEVEL_PRIORITY.indexOf('rough');

  if (hasPolite && hasRough) {
    degradation = true;
    degradationDetails.push('敬語と荒い表現の混在');
  }

  return {
    level: detectedLevel,
    degradation,
    degradationDetails: degradationDetails.length > 0 ? degradationDetails : undefined,
  };
}
