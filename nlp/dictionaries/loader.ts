/**
 * 辞書ローダー
 */

import emotionWords from './emotion-words.json';
import urgencyWords from './urgency-words.json';
import endings from './endings.json';
import politeness from './politeness.json';

export type DictionaryType = 'emotion' | 'urgency' | 'endings' | 'politeness';

const dictionaries: Record<DictionaryType, unknown> = {
  emotion: emotionWords,
  urgency: urgencyWords,
  endings: endings,
  politeness: politeness,
};

/**
 * 辞書を取得
 */
export function loadDictionary<T = unknown>(type: DictionaryType): T {
  return dictionaries[type] as T;
}

/**
 * 辞書バージョンを取得
 */
export function getDictionaryVersion(type: DictionaryType): string {
  const dict = dictionaries[type] as { version?: string };
  return dict?.version || 'unknown';
}

/**
 * 全辞書のバージョン情報を取得
 */
export function getAllDictionaryVersions(): Record<DictionaryType, string> {
  return {
    emotion: getDictionaryVersion('emotion'),
    urgency: getDictionaryVersion('urgency'),
    endings: getDictionaryVersion('endings'),
    politeness: getDictionaryVersion('politeness'),
  };
}
