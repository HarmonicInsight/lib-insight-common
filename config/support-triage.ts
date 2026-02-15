/**
 * サポートトリアージシステム定義
 *
 * Anthropic Customer Support Plugin の ticket-triage スキルを参考に、
 * HARMONIC insight 製品のサポート体制に適用。
 *
 * 参照: https://github.com/anthropics/knowledge-work-plugins
 *       → customer-support/skills/ticket-triage/SKILL.md
 *
 * 【用途】
 * - HARMONIC insight 自社サポート体制の標準化
 * - パートナー向け 1 次サポートガイドラインの提供
 * - AI アシスタント組み込みの自動分類ルール
 */

import type { ProductCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** チケットカテゴリ */
export type TicketCategory =
  | 'bug'               // 製品バグ
  | 'how-to'            // 操作方法
  | 'license'           // ライセンス関連
  | 'ai-assistant'      // AI 機能関連
  | 'integration'       // 連携・API
  | 'feature-request'   // 機能要望
  | 'performance'       // パフォーマンス
  | 'data'              // データ品質・移行
  | 'security'          // セキュリティ
  | 'partner';          // パートナー向け

/** 優先度 */
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

/** ルーティング先 */
export type RoutingTarget =
  | 'tier1'          // フロントラインサポート
  | 'tier2'          // シニアサポート
  | 'engineering'    // エンジニアリング
  | 'product'        // プロダクト
  | 'security'       // セキュリティ
  | 'billing'        // 請求・ライセンス
  | 'partner-team';  // パートナーチーム

/** カテゴリ定義 */
export interface CategoryDefinition {
  id: TicketCategory;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  signalWords: string[];
}

/** 優先度定義 */
export interface PriorityDefinition {
  id: Priority;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  slaResponseTimeHours: number;
  slaUpdateIntervalHours: number;
}

/** ルーティングルール */
export interface RoutingRule {
  category: TicketCategory;
  defaultRoute: RoutingTarget;
  escalationRoute?: RoutingTarget;
  conditions?: string;
}

/** 自動応答テンプレート */
export interface AutoResponseTemplate {
  category: TicketCategory;
  locale: 'ja' | 'en';
  template: string;
}

// =============================================================================
// カテゴリ定義
// =============================================================================

export const TICKET_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'bug',
    nameJa: 'バグ',
    nameEn: 'Bug',
    descriptionJa: '製品が正しく動作しない、予期しない挙動',
    signalWords: ['エラー', 'バグ', '動かない', 'クラッシュ', '落ちる', '不具合', 'error', 'bug', 'crash', 'broken', 'not working'],
  },
  {
    id: 'how-to',
    nameJa: '操作方法',
    nameEn: 'How-to',
    descriptionJa: '使い方・設定方法に関する質問',
    signalWords: ['使い方', 'やり方', '方法', '設定', 'できますか', 'how to', 'how do I', 'where is', 'configure'],
  },
  {
    id: 'license',
    nameJa: 'ライセンス',
    nameEn: 'License',
    descriptionJa: 'ライセンスの認証・更新・プラン変更',
    signalWords: ['ライセンス', 'アクティベート', '認証', '期限', 'プラン', '更新', 'license', 'activate', 'subscription', 'upgrade', 'downgrade'],
  },
  {
    id: 'ai-assistant',
    nameJa: 'AIアシスタント',
    nameEn: 'AI Assistant',
    descriptionJa: 'AI機能・APIキー・クレジット・回答品質に関する問題',
    signalWords: ['AI', 'アシスタント', 'Claude', 'APIキー', 'クレジット', '回数', 'assistant', 'API key', 'credits'],
  },
  {
    id: 'integration',
    nameJa: '連携・API',
    nameEn: 'Integration',
    descriptionJa: 'サードパーティツールとの連携・API利用',
    signalWords: ['連携', 'API', 'Webhook', '同期', 'sync', 'integration', 'connect', 'OAuth'],
  },
  {
    id: 'feature-request',
    nameJa: '機能要望',
    nameEn: 'Feature Request',
    descriptionJa: '新機能のリクエスト・改善提案',
    signalWords: ['要望', 'ほしい', '追加', '改善', 'あれば', 'wish', 'would be great', 'feature request', 'please add'],
  },
  {
    id: 'performance',
    nameJa: 'パフォーマンス',
    nameEn: 'Performance',
    descriptionJa: '動作速度・レスポンス・安定性の問題',
    signalWords: ['遅い', '重い', 'タイムアウト', 'フリーズ', '応答', 'slow', 'timeout', 'latency', 'hang', 'freeze'],
  },
  {
    id: 'data',
    nameJa: 'データ',
    nameEn: 'Data',
    descriptionJa: 'データの品質・インポート・エクスポート・移行',
    signalWords: ['データ', 'インポート', 'エクスポート', '移行', '消えた', 'data', 'import', 'export', 'migration', 'missing'],
  },
  {
    id: 'security',
    nameJa: 'セキュリティ',
    nameEn: 'Security',
    descriptionJa: 'セキュリティ・データ保護・コンプライアンス',
    signalWords: ['セキュリティ', '不正アクセス', '脆弱性', 'GDPR', 'security', 'vulnerability', 'unauthorized', 'compliance'],
  },
  {
    id: 'partner',
    nameJa: 'パートナー',
    nameEn: 'Partner',
    descriptionJa: 'パートナー契約・コミッション・NFRキー・デモキー',
    signalWords: ['パートナー', 'リセラー', 'コミッション', 'NFR', 'デモ', 'partner', 'reseller', 'commission', 'demo key'],
  },
];

// =============================================================================
// 優先度定義
// =============================================================================

export const PRIORITY_DEFINITIONS: PriorityDefinition[] = [
  {
    id: 'P1',
    nameJa: 'P1 — 緊急',
    nameEn: 'P1 — Critical',
    descriptionJa: '製品が全く使えない / データ損失・破損 / セキュリティインシデント',
    slaResponseTimeHours: 1,
    slaUpdateIntervalHours: 2,
  },
  {
    id: 'P2',
    nameJa: 'P2 — 高',
    nameEn: 'P2 — High',
    descriptionJa: '主要機能が動作しない / 回避策なし / 複数ユーザー影響',
    slaResponseTimeHours: 4,
    slaUpdateIntervalHours: 4,
  },
  {
    id: 'P3',
    nameJa: 'P3 — 中',
    nameEn: 'P3 — Medium',
    descriptionJa: '一部機能の問題 / 回避策あり / 単一ユーザー影響',
    slaResponseTimeHours: 8,
    slaUpdateIntervalHours: 24,
  },
  {
    id: 'P4',
    nameJa: 'P4 — 低',
    nameEn: 'P4 — Low',
    descriptionJa: '軽微な問題 / 機能要望 / 操作質問',
    slaResponseTimeHours: 16,
    slaUpdateIntervalHours: 48,
  },
];

// =============================================================================
// ルーティングルール
// =============================================================================

export const ROUTING_RULES: RoutingRule[] = [
  { category: 'bug', defaultRoute: 'tier2', escalationRoute: 'engineering', conditions: '再現手順が明確な場合は直接 engineering へ' },
  { category: 'how-to', defaultRoute: 'tier1' },
  { category: 'license', defaultRoute: 'billing' },
  { category: 'ai-assistant', defaultRoute: 'tier2', escalationRoute: 'engineering', conditions: 'APIキー設定の問題は tier1、回答品質は tier2' },
  { category: 'integration', defaultRoute: 'tier2', escalationRoute: 'engineering' },
  { category: 'feature-request', defaultRoute: 'product' },
  { category: 'performance', defaultRoute: 'tier2', escalationRoute: 'engineering' },
  { category: 'data', defaultRoute: 'tier2', escalationRoute: 'engineering' },
  { category: 'security', defaultRoute: 'security' },
  { category: 'partner', defaultRoute: 'partner-team' },
];

// =============================================================================
// 自動応答テンプレート（日本語）
// =============================================================================

export const AUTO_RESPONSE_TEMPLATES_JA: AutoResponseTemplate[] = [
  {
    category: 'bug',
    locale: 'ja',
    template: `お問い合わせありがとうございます。{specific_impact}によりご不便をおかけしております。

{priority}として対応を開始いたしました。{workaround_if_any}

{sla_timeframe}以内に調査結果をご報告いたします。`,
  },
  {
    category: 'how-to',
    locale: 'ja',
    template: `お問い合わせありがとうございます。

{direct_answer_or_steps}

ご不明な点がございましたら、お気軽にお問い合わせください。`,
  },
  {
    category: 'license',
    locale: 'ja',
    template: `ライセンスに関するお問い合わせありがとうございます。

{license_status_or_action}

追加のご質問がございましたら、お知らせください。`,
  },
  {
    category: 'ai-assistant',
    locale: 'ja',
    template: `AIアシスタント機能に関するお問い合わせありがとうございます。

{ai_specific_response}

{remaining_credits_info}`,
  },
  {
    category: 'feature-request',
    locale: 'ja',
    template: `貴重なご提案をいただきありがとうございます。{capability}の追加がお客様のワークフローに有効であると理解いたしました。

プロダクトチームに共有いたしました。具体的なタイムラインをお約束することは難しいですが、お客様のフィードバックはロードマップの優先度に直接反映されます。

{alternative_if_exists}`,
  },
  {
    category: 'security',
    locale: 'ja',
    template: `セキュリティに関するご報告をいただきありがとうございます。セキュリティ上の問題は最優先で対応いたします。

セキュリティチームに即座にエスカレーションいたしました。{sla_timeframe}以内に調査結果をご報告いたします。

{protective_action_if_needed}`,
  },
  {
    category: 'partner',
    locale: 'ja',
    template: `パートナー様、お問い合わせありがとうございます。

{partner_specific_response}

パートナー担当チームより{sla_timeframe}以内にご連絡いたします。`,
  },
];

// =============================================================================
// 自動応答テンプレート（英語）
// =============================================================================

export const AUTO_RESPONSE_TEMPLATES_EN: AutoResponseTemplate[] = [
  {
    category: 'bug',
    locale: 'en',
    template: `Thank you for contacting us. We apologize for the inconvenience caused by {specific_impact}.

We have started investigating this as {priority}. {workaround_if_any}

We will report our findings within {sla_timeframe}.`,
  },
  {
    category: 'how-to',
    locale: 'en',
    template: `Thank you for your inquiry.

{direct_answer_or_steps}

Please don't hesitate to contact us if you have any further questions.`,
  },
  {
    category: 'license',
    locale: 'en',
    template: `Thank you for your license-related inquiry.

{license_status_or_action}

Please let us know if you have any additional questions.`,
  },
  {
    category: 'ai-assistant',
    locale: 'en',
    template: `Thank you for your inquiry about the AI assistant feature.

{ai_specific_response}

{remaining_credits_info}`,
  },
  {
    category: 'feature-request',
    locale: 'en',
    template: `Thank you for your valuable suggestion. We understand that adding {capability} would benefit your workflow.

We have shared this with our product team. While we cannot commit to a specific timeline, your feedback directly influences our roadmap priorities.

{alternative_if_exists}`,
  },
  {
    category: 'security',
    locale: 'en',
    template: `Thank you for reporting this security concern. Security issues are handled with the highest priority.

This has been immediately escalated to our security team. We will report our findings within {sla_timeframe}.

{protective_action_if_needed}`,
  },
  {
    category: 'partner',
    locale: 'en',
    template: `Thank you for your inquiry, partner.

{partner_specific_response}

Our partner support team will contact you within {sla_timeframe}.`,
  },
];

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * メッセージからカテゴリを推定
 */
export function detectCategory(message: string): TicketCategory {
  const messageLower = message.toLowerCase();

  // スコアリング: 各カテゴリのシグナルワードのマッチ数で判定
  let bestCategory: TicketCategory = 'how-to';
  let bestScore = 0;

  for (const cat of TICKET_CATEGORIES) {
    const score = cat.signalWords.filter(word =>
      messageLower.includes(word.toLowerCase())
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat.id;
    }
  }

  return bestCategory;
}

/**
 * カテゴリとコンテキストから優先度を推定
 */
export function estimatePriority(
  category: TicketCategory,
  context: {
    affectedUsers?: number;
    hasWorkaround?: boolean;
    isDataLoss?: boolean;
    isSecurityIncident?: boolean;
    productionDown?: boolean;
  },
): Priority {
  // P1 条件
  if (context.isSecurityIncident || context.isDataLoss || context.productionDown) {
    return 'P1';
  }

  // P2 条件
  if (
    category === 'bug' && !context.hasWorkaround ||
    (context.affectedUsers && context.affectedUsers > 5)
  ) {
    return 'P2';
  }

  // P4 条件
  if (category === 'feature-request' || category === 'how-to') {
    return 'P4';
  }

  // P3 デフォルト
  return 'P3';
}

/**
 * カテゴリからルーティング先を取得
 */
export function getRouting(category: TicketCategory): RoutingRule | undefined {
  return ROUTING_RULES.find(rule => rule.category === category);
}

/**
 * 優先度の SLA 情報を取得
 */
export function getSLA(priority: Priority): PriorityDefinition | undefined {
  return PRIORITY_DEFINITIONS.find(p => p.id === priority);
}

/**
 * 自動応答テンプレートを取得
 */
export function getAutoResponseTemplate(
  category: TicketCategory,
  locale: 'ja' | 'en' = 'ja',
): string | undefined {
  const templates = locale === 'ja' ? AUTO_RESPONSE_TEMPLATES_JA : AUTO_RESPONSE_TEMPLATES_EN;
  return templates.find(t => t.category === category)?.template;
}

/**
 * エスカレーション判定
 *
 * 以下の条件でエスカレーションを推奨:
 * - SLA 超過
 * - 同一問題の複数報告（パターン検出）
 * - 顧客が明示的にエスカレーション要求
 * - 回避策が機能しなくなった
 * - 影響範囲の拡大
 */
export function shouldEscalate(context: {
  slaExceeded: boolean;
  duplicateReports: number;
  customerEscalated: boolean;
  workaroundFailed: boolean;
  scopeExpanded: boolean;
}): boolean {
  return (
    context.slaExceeded ||
    context.duplicateReports >= 3 ||
    context.customerEscalated ||
    context.workaroundFailed ||
    context.scopeExpanded
  );
}
