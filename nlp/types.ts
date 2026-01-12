/**
 * Harmonic Insight NLP - 日本語ビジネス文脈分析
 * 型定義
 */

// ========================================
// 入力型
// ========================================

/**
 * 分析対象の入力メッセージ
 */
export interface AnalysisInput {
  /** 一意識別子 */
  id: string;
  /** 分析対象テキスト */
  text: string;
  /** タイムスタンプ (ISO 8601) */
  timestamp?: string;
  /** 発言者ID (オプション) */
  speakerId?: string;
  /** 追加メタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * バッチ分析用の入力
 */
export interface BatchAnalysisInput {
  /** メッセージ配列 */
  messages: AnalysisInput[];
  /** 分析オプション */
  options?: AnalysisOptions;
}

/**
 * 分析オプション
 */
export interface AnalysisOptions {
  /** 感情分析を有効化 (default: true) */
  emotion?: boolean;
  /** 緊急度分析を有効化 (default: true) */
  urgency?: boolean;
  /** 確信度分析を有効化 (default: true) */
  certainty?: boolean;
  /** 敬語分析を有効化 (default: false) */
  politeness?: boolean;
  /** 動詞分類を有効化 (default: true) */
  verbAnalysis?: boolean;
  /** カスタム辞書パス */
  customDictionaries?: {
    emotion?: string;
    urgency?: string;
  };
}

// ========================================
// 出力型
// ========================================

/**
 * 分析結果の出力
 */
export interface AnalysisOutput {
  /** 入力ID（トレーサビリティ用） */
  id: string;
  /** 元テキスト */
  text: string;
  /** シグナル情報 */
  signals: SignalSet;
  /** 検出されたトークン詳細 */
  tokens: TokenDetail[];
  /** 総合スコア */
  score: OverallScore;
  /** 推奨アクション */
  recommendation: Recommendation;
  /** 分析メタデータ */
  meta: AnalysisMeta;
}

/**
 * シグナルセット
 */
export interface SignalSet {
  /** 感情シグナル */
  emotion: EmotionSignal;
  /** 緊急度シグナル */
  urgency: UrgencySignal;
  /** 確信度シグナル */
  certainty: CertaintySignal;
  /** 敬語・丁寧度シグナル (オプション) */
  politeness?: PolitenessSignal;
}

// ----------------------------------------
// 感情シグナル
// ----------------------------------------

export interface EmotionSignal {
  /** 主要な感情カテゴリ */
  primary: EmotionCategory;
  /** 感情強度 (0.0 - 1.0) */
  intensity: number;
  /** 検出された感情ワード */
  detectedWords: DetectedWord[];
  /** ポジティブ/ネガティブ傾向 (-1.0 〜 +1.0) */
  valence: number;
}

export type EmotionCategory =
  | "neutral"    // 中立
  | "anxiety"    // 不安系: 心配、困る、わからない
  | "anger"      // 怒り系: ひどい、最悪、使えない
  | "frustration"// 困惑系: 困った、大変、きつい
  | "request"    // 要望系: ほしい、あれば、できたら
  | "gratitude"  // 感謝系: ありがとう、助かる
  | "satisfaction" // 満足系: 良い、素晴らしい、完璧
  ;

// ----------------------------------------
// 緊急度シグナル
// ----------------------------------------

export interface UrgencySignal {
  /** 緊急度レベル */
  level: UrgencyLevel;
  /** 緊急度スコア (0.0 - 1.0) */
  score: number;
  /** 検出されたトリガー */
  triggers: DetectedWord[];
}

export type UrgencyLevel =
  | "critical"   // 即時対応: 止まった、動かない、業務停止
  | "high"       // 高: 至急、今日中、急ぎ
  | "medium"     // 中: なるべく早く、今週中
  | "low"        // 低: できれば、余裕があれば
  | "none"       // なし
  ;

// ----------------------------------------
// 確信度シグナル
// ----------------------------------------

export interface CertaintySignal {
  /** 確信度レベル */
  level: CertaintyLevel;
  /** 確信度スコア (0.0 - 1.0) */
  score: number;
  /** 検出された語尾パターン */
  endingPatterns: EndingPattern[];
}

export type CertaintyLevel =
  | "definite"   // 確定: です、ます、だ
  | "probable"   // 高確率: だろう、でしょう、はず
  | "possible"   // 可能性: かもしれない、かも
  | "uncertain"  // 不確実: わからない、不明
  ;

export interface EndingPattern {
  /** パターン文字列 */
  pattern: string;
  /** 確信度への影響 (-1.0 〜 +1.0) */
  impact: number;
  /** 追加ニュアンス */
  nuance?: "regret" | "hope" | "doubt" | "assertion";
}

// ----------------------------------------
// 敬語・丁寧度シグナル
// ----------------------------------------

export interface PolitenessSignal {
  /** 丁寧度レベル */
  level: PolitenessLevel;
  /** 敬語崩れ検出 */
  degradation: boolean;
  /** 崩れの詳細 */
  degradationDetails?: string[];
}

export type PolitenessLevel =
  | "honorific"  // 尊敬語・謙譲語あり
  | "polite"     // 丁寧語（です・ます）
  | "casual"     // カジュアル
  | "rough"      // 荒い（怒りの兆候）
  ;

// ----------------------------------------
// 共通型
// ----------------------------------------

export interface DetectedWord {
  /** 検出されたワード */
  word: string;
  /** 元テキスト内の位置 */
  position: number;
  /** カテゴリ */
  category: string;
  /** 重み (0.0 - 1.0) */
  weight: number;
}

export interface TokenDetail {
  /** 表層形 */
  surface: string;
  /** 品詞 */
  pos: string;
  /** 品詞細分類 */
  posDetail: string;
  /** 基本形 */
  baseForm: string;
  /** 動詞分類（動詞の場合） */
  verbType?: "action" | "state";
}

// ----------------------------------------
// 総合スコア
// ----------------------------------------

export interface OverallScore {
  /** 優先度スコア (0 - 100) */
  priority: number;
  /** ネガティブ度 (0.0 - 1.0) */
  negativity: number;
  /** アクション必要度 (0.0 - 1.0) */
  actionRequired: number;
}

// ----------------------------------------
// 推奨アクション
// ----------------------------------------

export interface Recommendation {
  /** 推奨アクションタイプ */
  action: RecommendedAction;
  /** 推奨理由 */
  reason: string;
  /** タグ候補 */
  suggestedTags: string[];
}

export type RecommendedAction =
  | "immediate_response"  // 即時対応
  | "escalate"            // エスカレーション
  | "schedule"            // スケジュール対応
  | "monitor"             // 監視・様子見
  | "acknowledge"         // 確認・返答のみ
  | "none"                // 特になし
  ;

// ----------------------------------------
// メタデータ
// ----------------------------------------

export interface AnalysisMeta {
  /** 分析エンジンバージョン */
  version: string;
  /** 処理時間 (ms) */
  processingTimeMs: number;
  /** 使用した辞書バージョン */
  dictionaryVersion: string;
  /** 分析日時 */
  analyzedAt: string;
}

// ========================================
// バッチ出力
// ========================================

export interface BatchAnalysisOutput {
  /** 個別分析結果 */
  results: AnalysisOutput[];
  /** 集計サマリー */
  summary: BatchSummary;
}

export interface BatchSummary {
  /** 総メッセージ数 */
  totalMessages: number;
  /** 感情分布 */
  emotionDistribution: Record<EmotionCategory, number>;
  /** 緊急度分布 */
  urgencyDistribution: Record<UrgencyLevel, number>;
  /** 平均ネガティブ度 */
  averageNegativity: number;
  /** 要対応件数 */
  actionRequiredCount: number;
}
