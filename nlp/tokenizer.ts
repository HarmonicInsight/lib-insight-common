/**
 * Harmonic Insight NLP - 形態素解析ラッパー (kuromoji)
 */

import type { TokenDetail } from './types';

// kuromoji の型定義
interface KuromojiToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading: string;
  pronunciation: string;
}

interface KuromojiTokenizer {
  tokenize(text: string): KuromojiToken[];
}

interface KuromojiBuilder {
  build(callback: (err: Error | null, tokenizer: KuromojiTokenizer) => void): void;
}

// 状態動詞リスト（タスクにならない動詞）
const STATE_VERBS = [
  'ある', 'いる', 'おる',           // 存在
  'なる', 'できる',                  // 変化・可能
  '思う', '考える', '感じる',        // 思考・感情（内面）
  'わかる', '知る',                  // 認知
  '見える', '聞こえる',              // 知覚（自発）
  '要る', '必要',                    // 必要性
];

let tokenizer: KuromojiTokenizer | null = null;
let initPromise: Promise<void> | null = null;

/**
 * kuromoji トークナイザを初期化
 */
export async function initTokenizer(): Promise<void> {
  if (tokenizer) return;
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    try {
      // Dynamic import for kuromoji
      const kuromoji = require('kuromoji');
      const builder: KuromojiBuilder = kuromoji.builder({
        dicPath: 'node_modules/kuromoji/dict',
      });

      builder.build((err, t) => {
        if (err) {
          console.error('[JBCA] Tokenizer initialization failed:', err);
          reject(err);
          return;
        }
        tokenizer = t;
        console.log('[JBCA] Tokenizer initialized');
        resolve();
      });
    } catch (e) {
      console.warn('[JBCA] kuromoji not available:', e);
      reject(e);
    }
  });

  return initPromise;
}

/**
 * トークナイザが利用可能かチェック
 */
export function isTokenizerReady(): boolean {
  return tokenizer !== null;
}

/**
 * テキストを形態素解析
 */
export async function tokenize(text: string, analyzeVerbs: boolean = true): Promise<TokenDetail[]> {
  if (!tokenizer) {
    await initTokenizer();
  }

  if (!tokenizer) {
    // フォールバック: 簡易トークン化
    return fallbackTokenize(text);
  }

  const kuromojiTokens = tokenizer.tokenize(text);

  return kuromojiTokens.map((t): TokenDetail => {
    const detail: TokenDetail = {
      surface: t.surface_form,
      pos: t.pos,
      posDetail: t.pos_detail_1,
      baseForm: t.basic_form || t.surface_form,
    };

    // 動詞分類
    if (analyzeVerbs && t.pos === '動詞') {
      detail.verbType = isStateVerb(t.basic_form || t.surface_form) ? 'state' : 'action';
    }

    return detail;
  });
}

/**
 * 同期的にトークン化（初期化済みの場合のみ）
 */
export function tokenizeSync(text: string, analyzeVerbs: boolean = true): TokenDetail[] {
  if (!tokenizer) {
    return fallbackTokenize(text);
  }

  const kuromojiTokens = tokenizer.tokenize(text);

  return kuromojiTokens.map((t): TokenDetail => {
    const detail: TokenDetail = {
      surface: t.surface_form,
      pos: t.pos,
      posDetail: t.pos_detail_1,
      baseForm: t.basic_form || t.surface_form,
    };

    if (analyzeVerbs && t.pos === '動詞') {
      detail.verbType = isStateVerb(t.basic_form || t.surface_form) ? 'state' : 'action';
    }

    return detail;
  });
}

/**
 * 状態動詞かどうか判定
 */
function isStateVerb(baseForm: string): boolean {
  return STATE_VERBS.includes(baseForm);
}

/**
 * フォールバック: 簡易トークン化（kuromoji未使用時）
 */
function fallbackTokenize(text: string): TokenDetail[] {
  // 簡易的な分割のみ
  const tokens: TokenDetail[] = [];
  const segments = text.split(/([、。！？\s]+)/);

  for (const segment of segments) {
    if (segment.trim()) {
      tokens.push({
        surface: segment,
        pos: '不明',
        posDetail: '',
        baseForm: segment,
      });
    }
  }

  return tokens;
}

/**
 * テキストから動詞を抽出
 */
export function extractVerbs(tokens: TokenDetail[]): {
  actionVerbs: string[];
  stateVerbs: string[];
  hasActionVerb: boolean;
  hasStateVerb: boolean;
} {
  const actionVerbs: string[] = [];
  const stateVerbs: string[] = [];

  for (const token of tokens) {
    if (token.pos === '動詞') {
      if (token.verbType === 'state') {
        stateVerbs.push(token.baseForm);
      } else {
        actionVerbs.push(token.baseForm);
      }
    }
  }

  return {
    actionVerbs,
    stateVerbs,
    hasActionVerb: actionVerbs.length > 0,
    hasStateVerb: stateVerbs.length > 0,
  };
}
