/**
 * HARMONIC insight NLP - メイン分析エンジン
 */

import type {
  AnalysisInput,
  AnalysisOutput,
  AnalysisOptions,
  BatchAnalysisInput,
  BatchAnalysisOutput,
  SignalSet,
  EmotionSignal,
  UrgencySignal,
  CertaintySignal,
  PolitenessSignal,
  TokenDetail,
  OverallScore,
  Recommendation,
  RecommendedAction,
  EmotionCategory,
  UrgencyLevel,
  CertaintyLevel,
  DetectedWord,
  EndingPattern,
  BatchSummary,
} from './types';

import { extractEmotion } from './signals/emotion';
import { extractUrgency } from './signals/urgency';
import { extractCertainty } from './signals/certainty';
import { extractPoliteness } from './signals/politeness';
import { tokenize, initTokenizer, isTokenizerReady } from './tokenizer';

const VERSION = '1.0.0';

// ========================================
// 初期化
// ========================================

let initialized = false;

/**
 * 分析エンジンを初期化
 * kuromoji辞書の読み込みに数秒かかるため、アプリ起動時に呼び出し推奨
 */
export async function initAnalyzer(): Promise<void> {
  if (initialized) return;

  await initTokenizer();
  initialized = true;
  console.log('[JBCA] Analyzer initialized');
}

/**
 * 分析エンジンが利用可能かチェック
 */
export function isAnalyzerReady(): boolean {
  return initialized && isTokenizerReady();
}

// ========================================
// 分析実行
// ========================================

/**
 * 単一メッセージを分析
 */
export async function analyzeContext(
  input: AnalysisInput,
  options: AnalysisOptions = {}
): Promise<AnalysisOutput> {
  const startTime = Date.now();

  // デフォルトオプション
  const opts: Required<Omit<AnalysisOptions, 'customDictionaries'>> = {
    emotion: options.emotion ?? true,
    urgency: options.urgency ?? true,
    certainty: options.certainty ?? true,
    politeness: options.politeness ?? false,
    verbAnalysis: options.verbAnalysis ?? true,
  };

  // 初期化チェック
  if (!initialized) {
    await initAnalyzer();
  }

  // 形態素解析
  const tokens = await tokenize(input.text, opts.verbAnalysis);

  // シグナル抽出
  const signals: SignalSet = {
    emotion: opts.emotion
      ? extractEmotion(input.text, tokens)
      : createNeutralEmotion(),
    urgency: opts.urgency
      ? extractUrgency(input.text, tokens)
      : createNoUrgency(),
    certainty: opts.certainty
      ? extractCertainty(input.text, tokens)
      : createDefaultCertainty(),
  };

  if (opts.politeness) {
    signals.politeness = extractPoliteness(input.text, tokens);
  }

  // スコア計算
  const score = calculateScore(signals);

  // 推奨アクション判定
  const recommendation = determineRecommendation(signals, score);

  const processingTimeMs = Date.now() - startTime;

  return {
    id: input.id,
    text: input.text,
    signals,
    tokens,
    score,
    recommendation,
    meta: {
      version: VERSION,
      processingTimeMs,
      dictionaryVersion: VERSION,
      analyzedAt: new Date().toISOString(),
    },
  };
}

/**
 * バッチ分析
 */
export async function analyzeContextBatch(
  input: BatchAnalysisInput
): Promise<BatchAnalysisOutput> {
  const results: AnalysisOutput[] = [];

  for (const message of input.messages) {
    const result = await analyzeContext(message, input.options);
    results.push(result);
  }

  const summary = calculateBatchSummary(results);

  return { results, summary };
}

// ========================================
// スコア計算
// ========================================

function calculateScore(signals: SignalSet): OverallScore {
  // ネガティブ度（valenceを反転、-1〜+1を0〜1に変換）
  const negativity = Math.max(0, (signals.emotion.valence * -1 + 1) / 2);

  // 優先度スコア (0-100)
  const priority = Math.round(
    signals.urgency.score * 50 +
    negativity * 30 +
    signals.certainty.score * 20
  );

  // アクション必要度
  const actionRequired = Math.max(signals.urgency.score, negativity * 0.8);

  return {
    priority: Math.min(100, Math.max(0, priority)),
    negativity: Math.min(1, Math.max(0, negativity)),
    actionRequired: Math.min(1, Math.max(0, actionRequired)),
  };
}

// ========================================
// 推奨アクション判定
// ========================================

function determineRecommendation(
  signals: SignalSet,
  score: OverallScore
): Recommendation {
  let action: RecommendedAction;
  let reason: string;
  const suggestedTags: string[] = [];

  // 緊急度ベースの判定
  if (signals.urgency.level === 'critical') {
    action = 'immediate_response';
    reason = '緊急度: critical（業務影響あり）';
    suggestedTags.push('緊急', '要即対応');
  } else if (signals.urgency.level === 'high') {
    if (signals.emotion.primary === 'anger' || signals.emotion.primary === 'frustration') {
      action = 'escalate';
      reason = `緊急度: high + 感情: ${signals.emotion.primary}`;
      suggestedTags.push('要エスカ', '顧客対応');
    } else {
      action = 'schedule';
      reason = '緊急度: high';
      suggestedTags.push('優先対応');
    }
  } else if (signals.emotion.primary === 'request') {
    action = 'schedule';
    reason = '要望検出';
    suggestedTags.push('要望', '検討');
  } else if (signals.emotion.primary === 'gratitude' || signals.emotion.primary === 'satisfaction') {
    action = 'acknowledge';
    reason = 'ポジティブフィードバック';
    suggestedTags.push('感謝', 'ポジティブ');
  } else if (score.negativity > 0.5) {
    action = 'monitor';
    reason = 'ネガティブ傾向あり';
    suggestedTags.push('要注視');
  } else {
    action = 'none';
    reason = '特記事項なし';
  }

  // 感情タグ追加
  if (signals.emotion.primary !== 'neutral') {
    const emotionTagMap: Record<EmotionCategory, string> = {
      neutral: '',
      anxiety: '不安',
      anger: '怒り',
      frustration: '困惑',
      request: '要望',
      gratitude: '感謝',
      satisfaction: '満足',
    };
    const tag = emotionTagMap[signals.emotion.primary];
    if (tag && !suggestedTags.includes(tag)) {
      suggestedTags.push(tag);
    }
  }

  return { action, reason, suggestedTags };
}

// ========================================
// バッチサマリー計算
// ========================================

function calculateBatchSummary(results: AnalysisOutput[]): BatchSummary {
  const emotionDistribution: Record<EmotionCategory, number> = {
    neutral: 0,
    anxiety: 0,
    anger: 0,
    frustration: 0,
    request: 0,
    gratitude: 0,
    satisfaction: 0,
  };

  const urgencyDistribution: Record<UrgencyLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };

  let totalNegativity = 0;
  let actionRequiredCount = 0;

  for (const result of results) {
    emotionDistribution[result.signals.emotion.primary]++;
    urgencyDistribution[result.signals.urgency.level]++;
    totalNegativity += result.score.negativity;

    if (result.score.actionRequired > 0.5) {
      actionRequiredCount++;
    }
  }

  return {
    totalMessages: results.length,
    emotionDistribution,
    urgencyDistribution,
    averageNegativity: results.length > 0 ? totalNegativity / results.length : 0,
    actionRequiredCount,
  };
}

// ========================================
// デフォルト値生成
// ========================================

function createNeutralEmotion(): EmotionSignal {
  return {
    primary: 'neutral',
    intensity: 0,
    detectedWords: [],
    valence: 0,
  };
}

function createNoUrgency(): UrgencySignal {
  return {
    level: 'none',
    score: 0,
    triggers: [],
  };
}

function createDefaultCertainty(): CertaintySignal {
  return {
    level: 'definite',
    score: 1.0,
    endingPatterns: [],
  };
}
