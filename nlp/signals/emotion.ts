/**
 * 感情シグナル抽出
 */

import type { EmotionSignal, EmotionCategory, DetectedWord, TokenDetail } from '../types';
import emotionDict from '../dictionaries/emotion-words.json';

interface EmotionWord {
  word: string;
  weight: number;
  note?: string;
}

interface EmotionCategoryDef {
  name: string;
  valence: number;
  words: EmotionWord[];
}

const categories = emotionDict.categories as Record<string, EmotionCategoryDef>;

/**
 * テキストから感情シグナルを抽出
 */
export function extractEmotion(text: string, tokens: TokenDetail[]): EmotionSignal {
  const detectedWords: DetectedWord[] = [];
  let totalWeight = 0;
  let weightedValence = 0;

  const categoryScores: Record<EmotionCategory, number> = {
    neutral: 0,
    anxiety: 0,
    anger: 0,
    frustration: 0,
    request: 0,
    gratitude: 0,
    satisfaction: 0,
  };

  // 各カテゴリの辞書をチェック
  for (const [categoryKey, categoryDef] of Object.entries(categories)) {
    const category = categoryKey as EmotionCategory;

    for (const wordDef of categoryDef.words) {
      const position = text.indexOf(wordDef.word);
      if (position !== -1) {
        detectedWords.push({
          word: wordDef.word,
          position,
          category,
          weight: wordDef.weight,
        });

        categoryScores[category] += wordDef.weight;
        totalWeight += wordDef.weight;
        weightedValence += categoryDef.valence * wordDef.weight;
      }
    }
  }

  // 主要カテゴリを決定
  let primary: EmotionCategory = 'neutral';
  let maxScore = 0;

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      primary = category as EmotionCategory;
    }
  }

  // 感情強度（0-1に正規化）
  const intensity = Math.min(1, totalWeight / 3);

  // 感情極性（-1〜+1）
  const valence = totalWeight > 0 ? weightedValence / totalWeight : 0;

  return {
    primary,
    intensity,
    detectedWords,
    valence,
  };
}
