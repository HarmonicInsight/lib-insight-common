/**
 * 緊急度シグナル抽出
 */

import type { UrgencySignal, UrgencyLevel, DetectedWord, TokenDetail } from '../types';
import urgencyDict from '../dictionaries/urgency-words.json';

interface UrgencyWord {
  word: string;
  weight: number;
  note?: string;
}

interface UrgencyLevelDef {
  name: string;
  score: number;
  words: UrgencyWord[];
}

const levels = urgencyDict.levels as Record<string, UrgencyLevelDef>;

// 緊急度の優先順位
const LEVEL_PRIORITY: UrgencyLevel[] = ['critical', 'high', 'medium', 'low', 'none'];

/**
 * テキストから緊急度シグナルを抽出
 */
export function extractUrgency(text: string, tokens: TokenDetail[]): UrgencySignal {
  const triggers: DetectedWord[] = [];
  let maxLevel: UrgencyLevel = 'none';
  let maxScore = 0;

  // 各レベルの辞書をチェック
  for (const [levelKey, levelDef] of Object.entries(levels)) {
    const level = levelKey as UrgencyLevel;

    for (const wordDef of levelDef.words) {
      const position = text.indexOf(wordDef.word);
      if (position !== -1) {
        triggers.push({
          word: wordDef.word,
          position,
          category: level,
          weight: wordDef.weight,
        });

        // より高い緊急度を優先
        const currentPriority = LEVEL_PRIORITY.indexOf(level);
        const maxPriority = LEVEL_PRIORITY.indexOf(maxLevel);

        if (currentPriority < maxPriority) {
          maxLevel = level;
          maxScore = levelDef.score * wordDef.weight;
        } else if (level === maxLevel) {
          // 同じレベルならスコアを加算（最大1.0）
          maxScore = Math.min(1.0, maxScore + levelDef.score * wordDef.weight * 0.2);
        }
      }
    }
  }

  return {
    level: maxLevel,
    score: maxScore,
    triggers,
  };
}
