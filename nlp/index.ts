/**
 * HARMONIC insight NLP - 日本語ビジネス文脈分析
 *
 * @example
 * ```typescript
 * import { analyzeContext, initAnalyzer } from '@/insight-common/nlp';
 *
 * // 初期化（アプリ起動時に1回）
 * await initAnalyzer();
 *
 * // 分析実行
 * const result = await analyzeContext({
 *   id: "msg-001",
 *   text: "システムが止まってしまいました"
 * });
 * ```
 */

export * from './types';
export { analyzeContext, analyzeContextBatch, initAnalyzer, isAnalyzerReady } from './analyzer';

// 辞書へのアクセス（カスタマイズ用）
export { loadDictionary, getDictionaryVersion } from './dictionaries/loader';
