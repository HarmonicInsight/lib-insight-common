/**
 * 確信度シグナル抽出
 */

import type { CertaintySignal, CertaintyLevel, EndingPattern, TokenDetail } from '../types';
import endingsDict from '../dictionaries/endings.json';

interface EndingDef {
  pattern: string;
  impact: number;
  nuance?: string;
  emotionImpact?: { category: string; boost: number };
  urgencyImpact?: number;
}

interface PatternCategory {
  name: string;
  certaintyScore: number;
  endings?: EndingDef[];
  patterns?: EndingDef[];
}

const patterns = endingsDict.patterns as Record<string, PatternCategory>;

/**
 * テキストから確信度シグナルを抽出
 */
export function extractCertainty(text: string, tokens: TokenDetail[]): CertaintySignal {
  const endingPatterns: EndingPattern[] = [];
  let level: CertaintyLevel = 'definite';
  let score = 1.0;
  let foundPattern = false;

  // 確信度パターンをチェック（優先度: uncertain < possible < probable < definite）
  const levelPriority: CertaintyLevel[] = ['uncertain', 'possible', 'probable', 'definite'];

  for (const [levelKey, levelDef] of Object.entries(patterns)) {
    if (levelKey === 'nuance') continue; // ニュアンスは別処理

    const endingsList = levelDef.endings || [];

    for (const ending of endingsList) {
      if (text.endsWith(ending.pattern) || text.includes(ending.pattern)) {
        const currentLevel = levelKey as CertaintyLevel;
        const currentPriority = levelPriority.indexOf(currentLevel);
        const existingPriority = levelPriority.indexOf(level);

        // より低い確信度を優先
        if (!foundPattern || currentPriority < existingPriority) {
          level = currentLevel;
          score = levelDef.certaintyScore;
          foundPattern = true;
        }

        endingPatterns.push({
          pattern: ending.pattern,
          impact: ending.impact,
          nuance: ending.nuance as EndingPattern['nuance'],
        });
      }
    }
  }

  // ニュアンス付き語尾をチェック
  const nuancePatterns = patterns.nuance?.patterns || [];
  for (const patternDef of nuancePatterns) {
    if (text.includes(patternDef.pattern)) {
      endingPatterns.push({
        pattern: patternDef.pattern,
        impact: patternDef.emotionImpact?.boost || patternDef.urgencyImpact || 0,
        nuance: patternDef.nuance as EndingPattern['nuance'],
      });
    }
  }

  return {
    level,
    score,
    endingPatterns,
  };
}
