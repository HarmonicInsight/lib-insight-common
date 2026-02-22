/**
 * ドキュメント評価 共通モジュール
 *
 * ============================================================================
 * InsightOffice 系アプリ（INSS/IOSH/IOSD）共通のドキュメント評価機能。
 * ============================================================================
 *
 * ## 概要
 *
 * Opus 4.6 の拡張コンテキストウィンドウと強化されたドキュメント理解力を活用し、
 * 開いているドキュメントを多角的に評価してフィードバックを提供する。
 *
 * ## 設計方針
 *
 * 1. **製品横断の共通フレームワーク**:
 *    スライド（INSS）、スプレッドシート（IOSH）、ドキュメント（IOSD）で
 *    共通の評価インターフェースを持ちつつ、製品固有の評価観点を定義する。
 *
 * 2. **プリセット型評価**:
 *    「経営報告」「営業提案」「予実管理」など文書の目的に応じた
 *    プリセットを選択するだけで、最適な評価基準が自動適用される。
 *    ユーザーは「何のための文書か」を選ぶだけで的確なフィードバックを得られる。
 *
 * 3. **構造化出力**:
 *    評価結果は JSON 形式で返却され、アプリ側で評価レポート UI を描画する。
 *    スコア（1–5）×観点ごとの評価 → 総合スコア（0–100）→ グレード（S/A/B/C/D）。
 *
 * 4. **Opus 4.6 推奨**:
 *    拡張コンテキストにより文書全体を俯瞰的に把握し、
 *    スライド間・セクション間の一貫性やストーリーの整合性まで評価できる。
 *    Standard ティア（Sonnet）でも実行可能だが、評価の深さはティアに依存する。
 *
 * 5. **クレジット共有**:
 *    ai_assistant と同一のクレジットプールから消費する（1 評価 = 1 クレジット）。
 *
 * ## 使い方
 *
 * ```typescript
 * import {
 *   getDocumentEvaluationPrompt,
 *   getEvaluationPresets,
 *   parseEvaluationResult,
 *   DOCUMENT_EVALUATION_CONFIG,
 * } from '@/insight-common/config/document-evaluation';
 *
 * // 1. プリセット一覧を取得（UI のドロップダウン用）
 * const presets = getEvaluationPresets('slide', 'ja');
 * // → [{ id: 'board_report', label: '経営報告', ... }, ...]
 *
 * // 2. プリセット付きで評価プロンプトを取得
 * const prompt = getDocumentEvaluationPrompt('slide', {
 *   preset: 'board_report',
 *   locale: 'ja',
 * });
 *
 * // 3. Claude API にファイル内容 + プロンプトを送信
 * const response = await callClaudeApi({
 *   model: getModelForTier(credits.effectiveModelTier),
 *   system: prompt,
 *   messages: [{ role: 'user', content: fileContent }],
 * });
 *
 * // 4. レスポンスを解析
 * const result = parseEvaluationResult(response.text, 'slide');
 * console.log(result.overallGrade); // 'A'
 * ```
 */

import type { ProductCode, PlanCode } from './products';
import type { AiModelTier } from './usage-based-licensing';
import { getDefaultModelForTier } from './ai-assistant';

// =============================================================================
// 型定義
// =============================================================================

/** ドキュメントタイプ（AI コンテキストタイプに対応） */
export type EvaluationDocumentType = 'slide' | 'spreadsheet' | 'document';

/** 総合グレード */
export type EvaluationGrade = 'S' | 'A' | 'B' | 'C' | 'D';

/** 改善提案の優先度 */
export type ImprovementPriority = 'high' | 'medium' | 'low';

/** 評価観点の定義 */
export interface EvaluationDimensionDefinition {
  /** 観点キー（製品内で一意） */
  key: string;
  /** 観点名（英語） */
  name: string;
  /** 観点名（日本語） */
  nameJa: string;
  /** 説明（英語） */
  description: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 総合スコア算出時の重み（0.0–1.0、合計 1.0） */
  weight: number;
}

/** 評価観点の結果 */
export interface EvaluationDimensionResult {
  /** 観点キー */
  key: string;
  /** スコア（1–5） */
  score: number;
  /** 最大スコア */
  maxScore: 5;
  /** フィードバックコメント */
  feedback: string;
}

/** 改善提案 */
export interface ImprovementSuggestion {
  /** 優先度 */
  priority: ImprovementPriority;
  /** 対象の評価観点キー */
  dimension: string;
  /** 改善提案の内容 */
  suggestion: string;
  /** 対象箇所（例: "スライド 3", "セル B5:D10", "第2段落"） */
  location?: string;
}

/** ドキュメント評価結果 */
export interface DocumentEvaluationResult {
  /** 総合スコア（0–100） */
  overallScore: number;
  /** 総合グレード */
  overallGrade: EvaluationGrade;
  /** 総合コメント */
  summary: string;
  /** 評価観点ごとの結果 */
  dimensions: EvaluationDimensionResult[];
  /** 強み（良い点） */
  strengths: string[];
  /** 改善提案 */
  improvements: ImprovementSuggestion[];
  /** 評価日時（ISO 8601） */
  evaluatedAt: string;
  /** 評価対象のドキュメントタイプ */
  documentType: EvaluationDocumentType;
}

/** 評価プリセットの定義 */
export interface EvaluationPreset {
  /** プリセット ID */
  id: string;
  /** ドキュメントタイプ */
  docType: EvaluationDocumentType;
  /** 表示名（日本語） */
  labelJa: string;
  /** 表示名（英語） */
  labelEn: string;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
  /** アイコン（Lucide アイコン名） */
  icon: string;
  /** 観点の重み上書き（指定しないキーは基本重みのまま） */
  weightOverrides?: Partial<Record<string, number>>;
  /** このプリセット固有のプロンプト追加指示（日本語） */
  additionalGuidanceJa: string;
  /** このプリセット固有のプロンプト追加指示（英語） */
  additionalGuidanceEn: string;
}

/** 評価リクエストのオプション */
export interface EvaluationRequestOptions {
  /** 評価の深さ: quick（概要のみ）/ standard（標準）/ thorough（詳細） */
  depth: 'quick' | 'standard' | 'thorough';
  /** 評価プリセット ID（ドキュメントの目的に応じた評価基準を適用） */
  preset?: string;
  /** 特定の観点に焦点を当てる場合に指定 */
  focusDimensions?: string[];
  /** 評価の目的（プリセットの代わりにフリーテキストで指定） */
  purpose?: string;
  /** ロケール */
  locale: 'ja' | 'en';
}

/** デフォルトの評価オプション */
export const DEFAULT_EVALUATION_OPTIONS: EvaluationRequestOptions = {
  depth: 'standard',
  locale: 'ja',
};

// =============================================================================
// 設定定数
// =============================================================================

/** ドキュメント評価機能の設定 */
export const DOCUMENT_EVALUATION_CONFIG = {
  /** 機能キー（products.ts の featureKey と対応） */
  featureKey: 'document_evaluation',
  /** 推奨モデルティア */
  recommendedTier: 'premium' as AiModelTier,
  /** 最低モデルティア */
  minimumTier: 'standard' as AiModelTier,
  /** 評価に必要なクレジット */
  creditsPerEvaluation: 1,
  /** 最大出力トークン（評価用に拡張） */
  maxOutputTokens: 8192,
  /** グレード閾値 */
  gradeThresholds: {
    S: 90,
    A: 75,
    B: 60,
    C: 40,
    D: 0,
  } as Record<EvaluationGrade, number>,
} as const;

// =============================================================================
// 評価観点の定義
// =============================================================================

/**
 * スライド（INSS）の評価観点
 *
 * プレゼンの本質は「伝えること」。
 * テキスト品質だけでなく、ストーリー設計・メッセージの伝達力・
 * 数値根拠の説得力まで踏み込んで評価する。
 */
const SLIDE_DIMENSIONS: EvaluationDimensionDefinition[] = [
  {
    key: 'story_design',
    name: 'Story Design & Flow',
    nameJa: 'ストーリー設計',
    description: 'Overall narrative arc (situation → complication → resolution), MECE structuring of key points, logical slide ordering, appropriate number of slides for the content',
    descriptionJa: 'プレゼン全体の物語構成（状況→課題→解決策）、キーポイントのMECE構成、スライドの論理的順序、内容に対する適切なスライド枚数',
    weight: 0.25,
  },
  {
    key: 'message_clarity',
    name: 'Message Clarity',
    nameJa: 'メッセージの明確さ',
    description: 'One key message per slide principle, clarity of slide titles as standalone summaries, clear takeaways, executive summary quality',
    descriptionJa: '1スライド1メッセージの原則、スライドタイトルだけで要旨が伝わるか、明確なテイクアウェイ、エグゼクティブサマリーの質',
    weight: 0.25,
  },
  {
    key: 'text_density',
    name: 'Text Quality & Information Density',
    nameJa: 'テキスト品質・情報密度',
    description: 'Grammar/spelling accuracy, conciseness (recommended: max 6 lines per slide), jargon-free or properly explained terminology, consistent tone',
    descriptionJa: '文法・誤字脱字、簡潔さ（推奨: 1スライド6行以内）、専門用語の適切な扱い、トーンの一貫性',
    weight: 0.20,
  },
  {
    key: 'evidence_persuasion',
    name: 'Evidence & Persuasion',
    nameJa: '数値・根拠の説得力',
    description: 'Data-backed claims, effective use of charts/tables, source attribution, logical reasoning without unsupported assertions',
    descriptionJa: 'データに基づく主張、図表の効果的活用、出典の明示、根拠のない断言がないか',
    weight: 0.15,
  },
  {
    key: 'audience_fit',
    name: 'Audience Fit',
    nameJa: '対象聴衆への適合性',
    description: 'Complexity level appropriate for the target audience, assumptions made explicit, action items clear, compelling opening and closing',
    descriptionJa: 'ターゲット聴衆に合った複雑度、前提の明示、アクションアイテムの明確さ、導入と締めの引き付け力',
    weight: 0.15,
  },
];

/**
 * スプレッドシート（IOSH）の評価観点
 *
 * IOSH は「スプレッドシート作成・編集」ツール（MS Office 不要）。
 * 単なるデータ品質チェックではなく、数値が経営判断に資するかまで評価する。
 */
const SPREADSHEET_DIMENSIONS: EvaluationDimensionDefinition[] = [
  {
    key: 'data_architecture',
    name: 'Data Architecture',
    nameJa: 'データ設計・構造',
    description: 'Sheet decomposition strategy, header clarity, data normalization, naming conventions, separation of input/calculation/output areas',
    descriptionJa: 'シート分割の戦略、ヘッダーの明確さ、データの正規化、命名規則、入力エリア・計算エリア・出力エリアの分離',
    weight: 0.20,
  },
  {
    key: 'calculation_integrity',
    name: 'Calculation Integrity',
    nameJa: '計算ロジックの正確性',
    description: 'Formula correctness, proper absolute/relative references, error handling (#N/A, #REF!, circular), consistent calculation patterns',
    descriptionJa: '数式の正しさ、絶対/相対参照の適切な使い分け、エラー処理（#N/A, #REF!, 循環参照）、計算パターンの一貫性',
    weight: 0.20,
  },
  {
    key: 'business_insight',
    name: 'Business Insight Depth',
    nameJa: 'ビジネスインサイトの深さ',
    description: 'Whether numbers tell a meaningful story, variance analysis depth, anomaly detection, trend identification, root cause indicators',
    descriptionJa: '数値が意味のあるストーリーを語っているか、差異分析の深さ、異常値の検出、トレンドの把握、原因指標の有無',
    weight: 0.25,
  },
  {
    key: 'decision_support',
    name: 'Decision Support Value',
    nameJa: '意思決定への有用性',
    description: 'Clear conclusions/recommendations, KPI design appropriateness, actionable takeaways, comparison baselines (vs budget, vs prior period, vs benchmark)',
    descriptionJa: '結論・推奨の明確さ、KPI設計の適切さ、アクションにつながるテイクアウェイ、比較基準の設定（予算比・前期比・ベンチマーク比）',
    weight: 0.20,
  },
  {
    key: 'operability',
    name: 'Operability & Maintainability',
    nameJa: '運用性・引き継ぎやすさ',
    description: 'Can another person understand and maintain this? Clear formatting, protected input areas, documentation/comments, version-safe structure',
    descriptionJa: '他の人が理解・保守できるか。書式の明快さ、入力エリアの保護、注釈・ドキュメント、バージョン管理に耐える構造',
    weight: 0.15,
  },
];

/**
 * ドキュメント（IOSD）の評価観点
 *
 * 文書は種類によって求められるものが大きく異なる。
 * 共通の評価軸として「読者を動かせるか」に焦点を当てる。
 */
const DOCUMENT_DIMENSIONS: EvaluationDimensionDefinition[] = [
  {
    key: 'structure_flow',
    name: 'Structure & Logical Flow',
    nameJa: '構成・論理フロー',
    description: 'Heading hierarchy clarity, section decomposition, reading guide (intro → body → conclusion), smooth transitions between sections',
    descriptionJa: '見出し階層の明快さ、セクション分割、読みの導線（導入→本論→結論）、セクション間のスムーズな接続',
    weight: 0.20,
  },
  {
    key: 'writing_precision',
    name: 'Writing Precision',
    nameJa: '文章の精度',
    description: 'Grammar/spelling accuracy, honorifics consistency (Japanese), ambiguity-free expressions, appropriate sentence length',
    descriptionJa: '文法・誤字脱字、敬語の統一（日本語）、曖昧さのない表現、適切な一文の長さ',
    weight: 0.20,
  },
  {
    key: 'argumentation',
    name: 'Argumentation & Evidence',
    nameJa: '論証・根拠の質',
    description: 'Claim-evidence alignment, preemptive counterargument handling, source quality, logical fallacy absence',
    descriptionJa: '主張と根拠の対応関係、想定される反論への先回り、出典の質、論理的誤謬がないか',
    weight: 0.25,
  },
  {
    key: 'reader_fit',
    name: 'Reader Appropriateness',
    nameJa: '読者への適合性',
    description: 'Detail level appropriate for the target reader, technical terms properly explained or omitted, assumptions stated',
    descriptionJa: 'ターゲット読者に合った詳細度、専門用語の適切な説明または省略、前提条件の明示',
    weight: 0.15,
  },
  {
    key: 'actionability',
    name: 'Actionability',
    nameJa: 'アクショナビリティ',
    description: 'Clear next steps after reading, specific recommendations, decision points identified, deadlines/owners where applicable',
    descriptionJa: '読後に何をすべきかが明確か、具体的な推奨事項、意思決定ポイントの特定、担当者・期限の明示（該当する場合）',
    weight: 0.20,
  },
];

/**
 * ドキュメントタイプ別の評価観点マッピング
 */
export const EVALUATION_DIMENSIONS: Record<
  EvaluationDocumentType,
  EvaluationDimensionDefinition[]
> = {
  slide: SLIDE_DIMENSIONS,
  spreadsheet: SPREADSHEET_DIMENSIONS,
  document: DOCUMENT_DIMENSIONS,
};

// =============================================================================
// 評価プリセット
// =============================================================================

/**
 * スライド（INSS）の評価プリセット
 *
 * プレゼンの目的に応じて評価の重点と追加チェック項目が変わる。
 */
const SLIDE_PRESETS: EvaluationPreset[] = [
  {
    id: 'board_report',
    docType: 'slide',
    labelJa: '経営報告',
    labelEn: 'Board Report',
    descriptionJa: '経営会議・取締役会向けの報告資料',
    descriptionEn: 'Presentation for board meetings and executive reports',
    icon: 'Building2',
    weightOverrides: { evidence_persuasion: 0.25, message_clarity: 0.25, story_design: 0.20, audience_fit: 0.15, text_density: 0.15 },
    additionalGuidanceJa: `経営報告の追加チェックポイント:
- エグゼクティブサマリー（1枚目）だけで報告の要旨が伝わるか
- 数値にはすべて前期比・予算比の比較があるか
- ネガティブ情報（課題・リスク）が隠されず正直に提示されているか
- 意思決定を求める場合、選択肢と推奨案が明示されているか
- 所要時間に対してスライド枚数が適切か（目安: 1枚/2分）`,
    additionalGuidanceEn: `Additional checks for board reports:
- Does the executive summary (slide 1) convey the full story alone?
- Are all numbers compared to prior period/budget?
- Are negative items (risks, issues) presented honestly?
- If requesting a decision, are options and recommendations clear?
- Is slide count appropriate for the time allocated (~1 slide/2 min)?`,
  },
  {
    id: 'sales_proposal',
    docType: 'slide',
    labelJa: '営業提案',
    labelEn: 'Sales Proposal',
    descriptionJa: '顧客向けの営業・導入提案資料',
    descriptionEn: 'Sales and implementation proposal for clients',
    icon: 'Handshake',
    weightOverrides: { audience_fit: 0.25, evidence_persuasion: 0.25, story_design: 0.20, message_clarity: 0.20, text_density: 0.10 },
    additionalGuidanceJa: `営業提案の追加チェックポイント:
- 顧客の課題（Pain）が冒頭で明確に定義されているか
- 「なぜ今」「なぜ我々」の根拠が示されているか
- ROI・費用対効果が具体的な数値で示されているか
- 導入ステップ・スケジュールが現実的に提示されているか
- 事例・実績が信頼性を担保しているか
- CTA（Call To Action）が最終スライドに明確にあるか`,
    additionalGuidanceEn: `Additional checks for sales proposals:
- Is the customer's pain point clearly defined upfront?
- Are "why now" and "why us" rationales provided?
- Is ROI presented with specific numbers?
- Are implementation steps/timeline realistic?
- Do case studies/references build credibility?
- Is there a clear CTA on the final slide?`,
  },
  {
    id: 'training_material',
    docType: 'slide',
    labelJa: '研修・教育資料',
    labelEn: 'Training Material',
    descriptionJa: '社内研修・勉強会・ワークショップ向け',
    descriptionEn: 'Internal training, study sessions, and workshops',
    icon: 'GraduationCap',
    weightOverrides: { message_clarity: 0.30, story_design: 0.20, text_density: 0.20, audience_fit: 0.20, evidence_persuasion: 0.10 },
    additionalGuidanceJa: `研修資料の追加チェックポイント:
- 学習目標（ゴール）が冒頭で明示されているか
- 段階的に難易度が上がる構成になっているか
- 専門用語には必ず定義や解説が添えられているか
- 理解を確認するための問いかけ・演習が含まれているか
- 1スライドの情報量が学習者にとって消化可能か（詰め込みすぎないか）
- まとめスライドで学習内容が振り返れるか`,
    additionalGuidanceEn: `Additional checks for training materials:
- Are learning objectives stated upfront?
- Does difficulty progress gradually?
- Are technical terms defined/explained?
- Are there comprehension checks or exercises?
- Is information per slide digestible (not overloaded)?
- Does a summary slide enable review?`,
  },
  {
    id: 'external_presentation',
    docType: 'slide',
    labelJa: '社外プレゼンテーション',
    labelEn: 'External Presentation',
    descriptionJa: 'カンファレンス・セミナー・顧客向け講演',
    descriptionEn: 'Conferences, seminars, and client-facing talks',
    icon: 'Mic',
    weightOverrides: { audience_fit: 0.25, story_design: 0.25, message_clarity: 0.20, evidence_persuasion: 0.15, text_density: 0.15 },
    additionalGuidanceJa: `社外プレゼンの追加チェックポイント:
- 最初の3枚で聴衆の関心を掴めるか（フック）
- 自社の宣伝色が強すぎないか（価値提供 > 宣伝）
- 聴衆が持ち帰れるインサイトが明確にあるか
- 社外秘情報・内部用語が混入していないか
- クロージングに聴衆へのアクション誘導があるか`,
    additionalGuidanceEn: `Additional checks for external presentations:
- Do the first 3 slides hook the audience?
- Is the tone value-driven rather than overly promotional?
- Are there clear takeaway insights for attendees?
- No confidential info or internal jargon leaked?
- Does the closing guide the audience to action?`,
  },
];

/**
 * スプレッドシート（IOSH）の評価プリセット
 *
 * 「スプレッドシート作成・編集」ツールとしての IOSHの特性を反映。
 */
const SPREADSHEET_PRESETS: EvaluationPreset[] = [
  {
    id: 'budget_actual',
    docType: 'spreadsheet',
    labelJa: '予実管理',
    labelEn: 'Budget vs Actual',
    descriptionJa: '予算と実績の比較・差異分析',
    descriptionEn: 'Budget versus actual comparison and variance analysis',
    icon: 'TrendingUp',
    weightOverrides: { business_insight: 0.30, decision_support: 0.25, calculation_integrity: 0.20, data_architecture: 0.15, operability: 0.10 },
    additionalGuidanceJa: `予実管理の追加チェックポイント:
- 予算・実績・差異・達成率の4列が揃っているか
- 差異の原因分析（なぜズレたか）が記載or示唆されているか
- 月次推移が見えるか（単月だけでなく累積・トレンド）
- 大きな差異（±10%以上など）にハイライトやコメントがあるか
- 着地見込み（フォーキャスト）が含まれているか
- 前年同期比も参照可能か`,
    additionalGuidanceEn: `Additional checks for budget vs actual:
- Are Budget/Actual/Variance/Achievement Rate columns present?
- Is variance root cause analysis included or indicated?
- Are monthly trends visible (not just single month)?
- Are significant variances (±10%+) highlighted?
- Is a forecast/landing estimate included?
- Is prior year comparison available?`,
  },
  {
    id: 'management_dashboard',
    docType: 'spreadsheet',
    labelJa: '経営ダッシュボード',
    labelEn: 'Management Dashboard',
    descriptionJa: 'KPI管理・経営指標の可視化',
    descriptionEn: 'KPI tracking and executive metrics visualization',
    icon: 'LayoutDashboard',
    weightOverrides: { decision_support: 0.30, business_insight: 0.25, data_architecture: 0.20, operability: 0.15, calculation_integrity: 0.10 },
    additionalGuidanceJa: `経営ダッシュボードの追加チェックポイント:
- KPIの選定は経営目標と整合しているか（売上/利益/顧客数など）
- 各KPIに目標値（ターゲット）と閾値（アラート基準）が設定されているか
- 信号機表示（赤黄緑）やスパークラインで一目で状況が分かるか
- 1画面で全体像が把握できるか（スクロール不要が理想）
- データの更新頻度と鮮度が明示されているか
- ドリルダウン（詳細シートへの導線）が用意されているか`,
    additionalGuidanceEn: `Additional checks for management dashboards:
- Are KPIs aligned with business objectives?
- Does each KPI have targets and alert thresholds?
- Are traffic lights/sparklines used for at-a-glance status?
- Can the full picture be seen on one screen?
- Is data freshness/update frequency indicated?
- Are drill-down paths to detail sheets available?`,
  },
  {
    id: 'data_analysis',
    docType: 'spreadsheet',
    labelJa: 'データ分析',
    labelEn: 'Data Analysis',
    descriptionJa: '調査・集計・分析レポート',
    descriptionEn: 'Research, aggregation, and analysis reports',
    icon: 'BarChart3',
    weightOverrides: { business_insight: 0.30, calculation_integrity: 0.25, data_architecture: 0.20, decision_support: 0.15, operability: 0.10 },
    additionalGuidanceJa: `データ分析の追加チェックポイント:
- 分析の目的・仮説が明記されているか
- 元データ（raw）と加工データが分離されているか
- 集計の粒度（日次/週次/月次）は目的に適切か
- 外れ値・欠損値の処理方針が明確か
- 分析結果から導かれる結論・示唆が記載されているか
- 再現性があるか（他者が同じ結果を得られるか）`,
    additionalGuidanceEn: `Additional checks for data analysis:
- Is the analysis objective/hypothesis stated?
- Are raw data and processed data separated?
- Is the aggregation granularity appropriate?
- Is the outlier/missing value handling clear?
- Are conclusions/implications derived from results?
- Is the analysis reproducible?`,
  },
  {
    id: 'quotation_invoice',
    docType: 'spreadsheet',
    labelJa: '見積・請求書',
    labelEn: 'Quotation / Invoice',
    descriptionJa: '見積書・請求書・発注書',
    descriptionEn: 'Quotations, invoices, and purchase orders',
    icon: 'Receipt',
    weightOverrides: { calculation_integrity: 0.30, operability: 0.25, data_architecture: 0.20, decision_support: 0.15, business_insight: 0.10 },
    additionalGuidanceJa: `見積・請求書の追加チェックポイント:
- 単価×数量＝小計、小計合計＝合計、税計算が正確か
- 宛先・発行日・有効期限・支払条件が明記されているか
- 品目の説明が第三者にも理解できる粒度か
- 印刷レイアウトが崩れないか（A4 1枚に収まるか）
- 通貨単位・税率が明示されているか
- 連番管理（見積番号・請求番号）があるか`,
    additionalGuidanceEn: `Additional checks for quotations/invoices:
- Are unit × qty = subtotal, totals, and tax correct?
- Are recipient, date, validity, payment terms present?
- Are item descriptions clear to third parties?
- Does print layout fit A4 without breaking?
- Are currency and tax rates explicit?
- Is sequential numbering in place?`,
  },
];

/**
 * ドキュメント（IOSD）の評価プリセット
 *
 * 文書種類によって評価の重点がまったく異なることを反映。
 */
const DOCUMENT_PRESETS: EvaluationPreset[] = [
  {
    id: 'proposal',
    docType: 'document',
    labelJa: '提案書・企画書',
    labelEn: 'Proposal',
    descriptionJa: '社内稟議・顧客提案・企画書',
    descriptionEn: 'Internal proposals, client proposals, and planning documents',
    icon: 'Lightbulb',
    weightOverrides: { argumentation: 0.30, actionability: 0.25, structure_flow: 0.20, reader_fit: 0.15, writing_precision: 0.10 },
    additionalGuidanceJa: `提案書の追加チェックポイント:
- 現状の課題（As-Is）と理想の状態（To-Be）が対比されているか
- 提案内容の実現可能性（技術・コスト・スケジュール）が示されているか
- 投資対効果（ROI）が定量的に示されているか
- リスクと対策が正直に記載されているか
- 承認者が「YES/NO」を判断できるだけの情報が揃っているか
- 次のステップ（承認後のアクションプラン）が明確か`,
    additionalGuidanceEn: `Additional checks for proposals:
- Are current state (As-Is) and target state (To-Be) contrasted?
- Is feasibility (technical, cost, schedule) demonstrated?
- Is ROI quantitatively presented?
- Are risks and mitigations honestly stated?
- Is there enough information for the approver to decide?
- Are next steps (post-approval action plan) clear?`,
  },
  {
    id: 'meeting_minutes',
    docType: 'document',
    labelJa: '議事録',
    labelEn: 'Meeting Minutes',
    descriptionJa: '会議記録・打ち合わせメモ',
    descriptionEn: 'Meeting records and notes',
    icon: 'ClipboardList',
    weightOverrides: { actionability: 0.35, writing_precision: 0.25, structure_flow: 0.20, reader_fit: 0.10, argumentation: 0.10 },
    additionalGuidanceJa: `議事録の追加チェックポイント:
- 決定事項が「確認事項」「議論事項」と明確に区別されているか
- 各TODOに担当者と期限が割り当てられているか
- 欠席者が読んでも議論の経緯を追えるか
- 発言者と発言内容の対応が明確か
- 次回会議の日時・アジェンダが記載されているか
- 配布範囲が適切に設定されているか`,
    additionalGuidanceEn: `Additional checks for meeting minutes:
- Are decisions clearly separated from discussion items?
- Does each TODO have an owner and deadline?
- Can an absent person follow the discussion flow?
- Are speakers and their statements clearly attributed?
- Are next meeting date/agenda included?
- Is the distribution scope appropriate?`,
  },
  {
    id: 'report',
    docType: 'document',
    labelJa: '報告書',
    labelEn: 'Report',
    descriptionJa: '業務報告・調査報告・プロジェクト報告',
    descriptionEn: 'Business reports, research reports, project reports',
    icon: 'FileText',
    weightOverrides: { argumentation: 0.25, structure_flow: 0.25, writing_precision: 0.20, actionability: 0.20, reader_fit: 0.10 },
    additionalGuidanceJa: `報告書の追加チェックポイント:
- 要旨（サマリー）が冒頭にあり、忙しい読者にも結論が伝わるか
- 事実と意見・解釈が明確に区別されているか
- データ・数値に出典が明記されているか
- 時系列の整理（いつ何が起きたか）が正確か
- 結論と推奨事項が報告内容から自然に導かれているか
- 添付資料・参考文献が適切に整理されているか`,
    additionalGuidanceEn: `Additional checks for reports:
- Is there an executive summary at the top?
- Are facts vs. opinions/interpretations clearly distinguished?
- Are data sources cited?
- Is the chronological order accurate?
- Do conclusions flow naturally from the content?
- Are appendices/references properly organized?`,
  },
  {
    id: 'policy_contract',
    docType: 'document',
    labelJa: '規程・契約関連',
    labelEn: 'Policy / Contract',
    descriptionJa: '社内規程・ガイドライン・契約書のドラフト',
    descriptionEn: 'Internal policies, guidelines, and contract drafts',
    icon: 'Scale',
    weightOverrides: { writing_precision: 0.30, structure_flow: 0.25, argumentation: 0.20, reader_fit: 0.15, actionability: 0.10 },
    additionalGuidanceJa: `規程・契約の追加チェックポイント:
- 定義セクションで重要用語が明確に定義されているか
- 曖昧な表現（「適切に」「速やかに」等）が最小限に抑えられているか
- 例外規定・免責事項が漏れなく記載されているか
- 改定履歴（バージョン管理）が付されているか
- 施行日・適用範囲が明示されているか
- 矛盾する条項がないか（特に既存規程との整合性）`,
    additionalGuidanceEn: `Additional checks for policies/contracts:
- Are key terms clearly defined in a definitions section?
- Are vague expressions ("appropriately", "promptly") minimized?
- Are exceptions and disclaimers comprehensively covered?
- Is revision history (version control) maintained?
- Are effective date and scope specified?
- Are there contradicting clauses (esp. with existing policies)?`,
  },
];

/**
 * 全プリセットの統合マッピング
 */
export const EVALUATION_PRESETS: Record<EvaluationDocumentType, EvaluationPreset[]> = {
  slide: SLIDE_PRESETS,
  spreadsheet: SPREADSHEET_PRESETS,
  document: DOCUMENT_PRESETS,
};

// =============================================================================
// 製品マッピング
// =============================================================================

/** 製品コードからドキュメント評価タイプへのマッピング */
const PRODUCT_EVALUATION_TYPE: Partial<Record<ProductCode, EvaluationDocumentType>> = {
  INSS: 'slide',
  IOSH: 'spreadsheet',
  IOSD: 'document',
};

/**
 * 製品コードから評価対象ドキュメントタイプを取得
 *
 * @returns ドキュメントタイプ、対応しない製品は null
 */
export function getEvaluationDocumentType(
  product: ProductCode,
): EvaluationDocumentType | null {
  return PRODUCT_EVALUATION_TYPE[product] ?? null;
}

/**
 * ドキュメント評価に対応した製品かチェック
 */
export function isEvaluationSupportedProduct(product: ProductCode): boolean {
  return getEvaluationDocumentType(product) !== null;
}

// =============================================================================
// プリセット取得
// =============================================================================

/**
 * ドキュメントタイプに応じた評価プリセット一覧を取得（UI 用）
 *
 * @example
 * ```typescript
 * const presets = getEvaluationPresets('slide', 'ja');
 * // → [
 * //   { id: 'board_report', label: '経営報告', description: '経営会議・取締役会向けの報告資料', icon: 'Building2' },
 * //   { id: 'sales_proposal', label: '営業提案', ... },
 * //   ...
 * // ]
 * ```
 */
export function getEvaluationPresets(
  docType: EvaluationDocumentType,
  locale: 'ja' | 'en' = 'ja',
): Array<{ id: string; label: string; description: string; icon: string }> {
  return EVALUATION_PRESETS[docType].map(p => ({
    id: p.id,
    label: locale === 'ja' ? p.labelJa : p.labelEn,
    description: locale === 'ja' ? p.descriptionJa : p.descriptionEn,
    icon: p.icon,
  }));
}

/**
 * 製品コードから評価プリセット一覧を取得
 */
export function getEvaluationPresetsForProduct(
  product: ProductCode,
  locale: 'ja' | 'en' = 'ja',
): Array<{ id: string; label: string; description: string; icon: string }> | null {
  const docType = getEvaluationDocumentType(product);
  if (!docType) return null;
  return getEvaluationPresets(docType, locale);
}

/**
 * プリセット ID からプリセット定義を取得
 */
export function getPresetById(
  docType: EvaluationDocumentType,
  presetId: string,
): EvaluationPreset | null {
  return EVALUATION_PRESETS[docType].find(p => p.id === presetId) ?? null;
}

// =============================================================================
// 評価観点ヘルパー
// =============================================================================

/**
 * ドキュメントタイプに応じた評価観点を取得
 */
export function getEvaluationDimensions(
  docType: EvaluationDocumentType,
): EvaluationDimensionDefinition[] {
  return EVALUATION_DIMENSIONS[docType];
}

/**
 * 製品コードから評価観点を取得
 */
export function getEvaluationDimensionsForProduct(
  product: ProductCode,
): EvaluationDimensionDefinition[] | null {
  const docType = getEvaluationDocumentType(product);
  if (!docType) return null;
  return getEvaluationDimensions(docType);
}

/**
 * プリセット適用済みの重みを取得
 *
 * プリセットが指定されていれば重みを上書きし、
 * 指定されていなければデフォルトの重みを返す。
 */
export function getEffectiveWeights(
  docType: EvaluationDocumentType,
  presetId?: string,
): Record<string, number> {
  const dims = EVALUATION_DIMENSIONS[docType];
  const baseWeights: Record<string, number> = {};
  for (const d of dims) {
    baseWeights[d.key] = d.weight;
  }

  if (!presetId) return baseWeights;

  const preset = getPresetById(docType, presetId);
  if (!preset?.weightOverrides) return baseWeights;

  // Apply weight overrides, filtering out any undefined values
  const result = { ...baseWeights };
  for (const [key, value] of Object.entries(preset.weightOverrides)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// =============================================================================
// スコア・グレード計算
// =============================================================================

/**
 * 観点別スコアから総合スコア（0–100）を算出
 *
 * 各観点のスコア（1–5）を重み付け平均し、100点満点に変換する。
 * プリセットが指定されている場合はプリセットの重みが適用される。
 *
 * @example
 * ```typescript
 * const dimensions = [
 *   { key: 'story_design', score: 4 },
 *   { key: 'message_clarity', score: 3 },
 *   // ...
 * ];
 * const overall = calculateOverallScore(dimensions, 'slide', 'board_report');
 * // → 72 (プリセットの重み付け平均)
 * ```
 */
export function calculateOverallScore(
  dimensionResults: Array<{ key: string; score: number }>,
  docType: EvaluationDocumentType,
  presetId?: string,
): number {
  const weights = getEffectiveWeights(docType, presetId);

  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of dimensionResults) {
    const w = weights[result.key];
    if (w === undefined) continue;

    const clampedScore = Math.max(1, Math.min(5, result.score));
    weightedSum += clampedScore * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;

  // 1–5 スコアを 0–100 に変換: (weightedAvg - 1) / 4 * 100
  const weightedAvg = weightedSum / totalWeight;
  return Math.round(((weightedAvg - 1) / 4) * 100);
}

/**
 * 総合スコアからグレードを決定
 *
 * | グレード | スコア範囲 |
 * |---------|----------|
 * | S       | 90–100   |
 * | A       | 75–89    |
 * | B       | 60–74    |
 * | C       | 40–59    |
 * | D       | 0–39     |
 */
export function scoreToGrade(score: number): EvaluationGrade {
  const thresholds = DOCUMENT_EVALUATION_CONFIG.gradeThresholds;
  if (score >= thresholds.S) return 'S';
  if (score >= thresholds.A) return 'A';
  if (score >= thresholds.B) return 'B';
  if (score >= thresholds.C) return 'C';
  return 'D';
}

/**
 * グレードの表示ラベルを取得
 */
export function getGradeLabel(
  grade: EvaluationGrade,
  locale: 'ja' | 'en' = 'ja',
): string {
  const labels: Record<EvaluationGrade, { ja: string; en: string }> = {
    S: { ja: '最優秀', en: 'Excellent' },
    A: { ja: '優秀', en: 'Very Good' },
    B: { ja: '良好', en: 'Good' },
    C: { ja: '改善の余地あり', en: 'Needs Improvement' },
    D: { ja: '要改善', en: 'Significant Improvement Needed' },
  };
  return labels[grade][locale];
}

/**
 * グレードに対応するテーマカラーを取得
 */
export function getGradeColor(grade: EvaluationGrade): string {
  const colors: Record<EvaluationGrade, string> = {
    S: '#B8942F',  // Gold（プライマリ）
    A: '#16A34A',  // Success green
    B: '#2563EB',  // Blue
    C: '#CA8A04',  // Warning
    D: '#DC2626',  // Error
  };
  return colors[grade];
}

// =============================================================================
// システムプロンプト
// =============================================================================

/**
 * 評価観点テキストの生成（プロンプト内に埋め込み用）
 */
function buildDimensionInstructions(
  docType: EvaluationDocumentType,
  locale: 'ja' | 'en',
  presetId?: string,
): string {
  const dims = EVALUATION_DIMENSIONS[docType];
  const weights = getEffectiveWeights(docType, presetId);

  return dims
    .map((d, i) => {
      const name = locale === 'ja' ? d.nameJa : d.name;
      const desc = locale === 'ja' ? d.descriptionJa : d.description;
      const weightPct = Math.round((weights[d.key] ?? d.weight) * 100);
      return `${i + 1}. **${name}** (key: "${d.key}", weight: ${weightPct}%)\n   ${desc}`;
    })
    .join('\n');
}

/**
 * 深さ別の追加指示テキスト
 */
function getDepthInstruction(depth: 'quick' | 'standard' | 'thorough', locale: 'ja' | 'en'): string {
  if (locale === 'ja') {
    switch (depth) {
      case 'quick':
        return '【評価の深さ: クイック】各観点のスコアと1–2文のフィードバックのみ。改善提案は最大3件まで。';
      case 'thorough':
        return '【評価の深さ: 詳細】各観点について詳細なフィードバック（3–5文）を提供し、具体的な箇所を参照して改善提案を行ってください。改善提案は可能な限り多く提示してください。';
      default:
        return '【評価の深さ: 標準】各観点について2–3文のフィードバックと、主要な改善提案を5件程度提示してください。';
    }
  }
  switch (depth) {
    case 'quick':
      return 'DEPTH: Quick — Provide scores and 1–2 sentence feedback per dimension. Max 3 improvement suggestions.';
    case 'thorough':
      return 'DEPTH: Thorough — Provide detailed feedback (3–5 sentences per dimension) with specific location references. Provide as many improvement suggestions as applicable.';
    default:
      return 'DEPTH: Standard — Provide 2–3 sentence feedback per dimension and approximately 5 key improvement suggestions.';
  }
}

/**
 * ドキュメントタイプ別の追加コンテキスト
 */
function getDocumentTypeContext(docType: EvaluationDocumentType, locale: 'ja' | 'en'): string {
  if (locale === 'ja') {
    switch (docType) {
      case 'slide':
        return `【対象ドキュメント: PowerPoint プレゼンテーション】
入力データの各行は row（行番号）、slideNumber、shapeId、text の構造を持ちます。
Opus 4.6 の拡張コンテキストを活かして、全スライドを俯瞰的に把握した上で評価してください。
スライド間の論理的つながり、全体のストーリーアーク、メッセージの一貫性を重視してください。
location フィールドには「スライド N」の形式で記載してください。`;
      case 'spreadsheet':
        return `【対象ドキュメント: Excel スプレッドシート（スプレッドシート作成・編集ツール）】
入力データにはシート名、セル範囲、値、数式の情報が含まれます。
単なるデータ品質のチェックではなく、この数値が経営判断に資するかという視点で評価してください。
数字の裏にある意味やストーリーを読み取り、見落とされている示唆を指摘してください。
location フィールドにはセルアドレスまたはシート名を記載してください。`;
      case 'document':
        return `【対象ドキュメント: Word 文書（ドキュメント作成・編集ツール）】
入力データには段落テキスト、見出し構造、書式情報が含まれます。
文書全体を通して「この文書は読者を動かせるか」という視点で評価してください。
読者が読後に取るべきアクションが明確になっているかを特に重視してください。
location フィールドには「第N段落」や「セクション: xxx」の形式で記載してください。`;
    }
  }

  switch (docType) {
    case 'slide':
      return `DOCUMENT TYPE: PowerPoint Presentation
Input data rows have: row number, slideNumber, shapeId, text.
Leverage the extended context to evaluate the ENTIRE presentation holistically.
Focus on inter-slide logical connections, overall story arc, and message consistency.
Use "Slide N" format for location fields.`;
    case 'spreadsheet':
      return `DOCUMENT TYPE: Excel Spreadsheet (Business Management & Budget Tracking Tool)
Input data includes: sheet names, cell ranges, values, formulas.
Go beyond basic data quality — evaluate whether these numbers serve decision-making.
Read the story behind the numbers and identify overlooked insights.
Use cell addresses or sheet names for location fields.`;
    case 'document':
      return `DOCUMENT TYPE: Word Document (Reference-Enabled Document Management Tool)
Input data includes: paragraph text, heading structure, formatting info.
Evaluate with the lens of "does this document move the reader to action?"
Pay special attention to whether post-reading action items are clear.
Use "Paragraph N" or "Section: xxx" for location fields.`;
  }
}

/**
 * プリセットのプロンプト追加指示を取得
 */
function getPresetGuidance(
  docType: EvaluationDocumentType,
  presetId: string | undefined,
  locale: 'ja' | 'en',
): string {
  if (!presetId) return '';

  const preset = getPresetById(docType, presetId);
  if (!preset) return '';

  const label = locale === 'ja' ? preset.labelJa : preset.labelEn;
  const guidance = locale === 'ja' ? preset.additionalGuidanceJa : preset.additionalGuidanceEn;
  const header = locale === 'ja'
    ? `\n## 文書目的: ${label}\n\n以下のチェックポイントも評価に含めてください。improvements には以下の観点からの改善提案も含めてください。\n\n${guidance}`
    : `\n## Document Purpose: ${label}\n\nInclude the following checkpoints in your evaluation. Add improvement suggestions from these perspectives as well.\n\n${guidance}`;

  return header;
}

/**
 * ドキュメント評価用のシステムプロンプトを生成
 *
 * @example
 * ```typescript
 * // プリセット付き（推奨）
 * const prompt = getDocumentEvaluationPrompt('slide', {
 *   preset: 'board_report',
 *   depth: 'standard',
 *   locale: 'ja',
 * });
 *
 * // プリセットなし（汎用評価）
 * const prompt = getDocumentEvaluationPrompt('spreadsheet', { locale: 'ja' });
 * ```
 */
export function getDocumentEvaluationPrompt(
  docType: EvaluationDocumentType,
  options: Partial<EvaluationRequestOptions> = {},
): string {
  const opts = { ...DEFAULT_EVALUATION_OPTIONS, ...options };
  const { depth, preset, focusDimensions, purpose, locale } = opts;

  const dimensionInstructions = buildDimensionInstructions(docType, locale, preset);
  const depthInstruction = getDepthInstruction(depth, locale);
  const docContext = getDocumentTypeContext(docType, locale);
  const presetGuidance = getPresetGuidance(docType, preset, locale);

  const focusInstruction = focusDimensions?.length
    ? locale === 'ja'
      ? `\n【フォーカス】以下の観点を特に重点的に評価してください: ${focusDimensions.join(', ')}`
      : `\nFOCUS: Pay special attention to these dimensions: ${focusDimensions.join(', ')}`
    : '';

  const purposeInstruction = purpose
    ? locale === 'ja'
      ? `\n【評価の目的】${purpose}`
      : `\nPURPOSE: ${purpose}`
    : '';

  if (locale === 'ja') {
    return `あなたはビジネスドキュメント評価の専門家です。
日本のビジネスシーンにおけるドキュメント品質を熟知しており、
コンサルタントの視点で実践的かつ具体的なフィードバックを提供します。

提供されたドキュメントを以下の評価観点に基づいて多角的に分析し、構造化された評価結果を返してください。

${docContext}

${depthInstruction}
${focusInstruction}
${purposeInstruction}
${presetGuidance}

## 評価観点

${dimensionInstructions}

## 出力ルール

以下の JSON 形式で評価結果を返してください。JSON 以外のテキストは含めないでください。

\`\`\`json
{
  "dimensions": [
    {
      "key": "観点キー",
      "score": 1〜5の整数,
      "feedback": "この観点に関する評価コメント"
    }
  ],
  "strengths": [
    "良い点1（具体的な箇所を参照）",
    "良い点2"
  ],
  "improvements": [
    {
      "priority": "high" | "medium" | "low",
      "dimension": "対象の観点キー",
      "suggestion": "具体的な改善提案（何をどう変えるか）",
      "location": "対象箇所"
    }
  ],
  "summary": "総合的な評価コメント（2〜3文。まず結論、次にその理由）"
}
\`\`\`

## スコア基準

| スコア | 意味 |
|-------|------|
| 5 | 優秀 — そのまま提出・共有できるレベル |
| 4 | 良好 — 細かい改善で完成度が上がる |
| 3 | 普通 — 基本は押さえているが差別化要素が弱い |
| 2 | やや不十分 — 目的を達成するには手直しが必要 |
| 1 | 不十分 — 構成から見直しが必要 |

## 重要な指示

- strengths には**具体的に良い箇所**を引用してください（「スライド3の〜」「A列の〜」等）
- improvements の suggestion は**「何を」「どう」変えるか**を具体的に書いてください（曖昧な「改善してください」は不可）
- location は**可能な限り**具体的に指定してください
- 忖度せず、改善すべき点は率直に指摘してください。ただし建設的なトーンで`;
  }

  // English
  return `You are a business document evaluation expert.
You have deep knowledge of document quality in professional settings and provide
practical, specific feedback from a consultant's perspective.

Analyze the provided document across the following evaluation dimensions and return structured results.

${docContext}

${depthInstruction}
${focusInstruction}
${purposeInstruction}
${presetGuidance}

## Evaluation Dimensions

${dimensionInstructions}

## Output Rules

Return the evaluation result in the following JSON format. Do not include any text outside the JSON.

\`\`\`json
{
  "dimensions": [
    {
      "key": "dimension_key",
      "score": 1-5 integer,
      "feedback": "Evaluation comment for this dimension"
    }
  ],
  "strengths": [
    "Strength 1 (reference specific location)",
    "Strength 2"
  ],
  "improvements": [
    {
      "priority": "high" | "medium" | "low",
      "dimension": "target dimension key",
      "suggestion": "Specific improvement (what to change and how)",
      "location": "Target location"
    }
  ],
  "summary": "Overall evaluation (2-3 sentences. Conclusion first, then reasoning.)"
}
\`\`\`

## Score Criteria

| Score | Meaning |
|-------|---------|
| 5 | Excellent — Ready to submit/share as-is |
| 4 | Good — Minor refinements would elevate quality |
| 3 | Average — Fundamentals covered but lacks differentiation |
| 2 | Below Average — Needs rework to achieve its purpose |
| 1 | Poor — Requires structural revision |

## Important Instructions

- In strengths, **quote specific good parts** ("Slide 3's...", "Column A's..." etc.)
- In improvements, suggestion must specify **what to change and how** (no vague "please improve")
- Provide **specific locations** whenever possible
- Be candid about areas needing improvement — but maintain a constructive tone`;
}

// =============================================================================
// レスポンス解析
// =============================================================================

/**
 * Claude API のレスポンステキストから評価結果を解析
 *
 * @param responseText - Claude API からの応答テキスト
 * @param docType - ドキュメントタイプ
 * @param presetId - 適用されたプリセット ID（スコア計算に重みを反映）
 * @returns 評価結果（解析失敗時は null）
 */
export function parseEvaluationResult(
  responseText: string,
  docType: EvaluationDocumentType,
  presetId?: string,
): DocumentEvaluationResult | null {
  try {
    // JSON ブロックを抽出（```json ... ``` または直接 JSON）
    let jsonStr = responseText;
    const jsonBlockMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1];
    } else {
      // 直接 JSON の場合は先頭の { から末尾の } まで
      const directJsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (directJsonMatch) {
        jsonStr = directJsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonStr.trim()) as {
      dimensions?: Array<{ key: string; score: number; feedback: string }>;
      strengths?: string[];
      improvements?: Array<{
        priority: string;
        dimension: string;
        suggestion: string;
        location?: string;
      }>;
      summary?: string;
    };

    // dimensions のバリデーション
    if (!parsed.dimensions || !Array.isArray(parsed.dimensions)) {
      return null;
    }

    const validDimensions: EvaluationDimensionResult[] = parsed.dimensions
      .filter(d => d.key && typeof d.score === 'number' && d.feedback)
      .map(d => ({
        key: d.key,
        score: Math.max(1, Math.min(5, Math.round(d.score))),
        maxScore: 5 as const,
        feedback: d.feedback,
      }));

    if (validDimensions.length === 0) return null;

    const overallScore = calculateOverallScore(validDimensions, docType, presetId);

    const validImprovements: ImprovementSuggestion[] = (parsed.improvements ?? [])
      .filter(i => i.suggestion && i.dimension)
      .map(i => ({
        priority: (['high', 'medium', 'low'].includes(i.priority)
          ? i.priority
          : 'medium') as ImprovementPriority,
        dimension: i.dimension,
        suggestion: i.suggestion,
        location: i.location,
      }));

    return {
      overallScore,
      overallGrade: scoreToGrade(overallScore),
      summary: parsed.summary ?? '',
      dimensions: validDimensions,
      strengths: parsed.strengths ?? [],
      improvements: validImprovements,
      evaluatedAt: new Date().toISOString(),
      documentType: docType,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// ライセンス・利用可否チェック
// =============================================================================

/**
 * ドキュメント評価が利用可能なプランかチェック
 *
 * ai_assistant と同じプラン制限に準拠する。
 */
export function canUseDocumentEvaluation(plan: PlanCode): boolean {
  const allowedPlans: PlanCode[] = ['TRIAL', 'STD', 'PRO', 'ENT'];
  return allowedPlans.includes(plan);
}

/**
 * ドキュメント評価に推奨されるモデル情報を取得
 */
export function getRecommendedModelForEvaluation(): {
  modelId: string;
  tier: AiModelTier;
  reasonJa: string;
  reasonEn: string;
} {
  return {
    modelId: getDefaultModelForTier('premium'),
    tier: 'premium',
    reasonJa: 'ドキュメント評価には Opus 4.6 の拡張コンテキストと深い分析力を推奨します。文書全体を俯瞰的に把握し、構造的な問題まで検出します',
    reasonEn: 'Opus 4.6 with extended context is recommended for document evaluation. It can holistically analyze the entire document and detect structural issues',
  };
}

/**
 * ドキュメント評価の UI ラベルを取得
 */
export function getEvaluationMenuLabel(locale: 'ja' | 'en' = 'ja'): {
  menuLabel: string;
  menuDescription: string;
  buttonLabel: string;
} {
  if (locale === 'ja') {
    return {
      menuLabel: 'ドキュメント評価',
      menuDescription: 'AIがドキュメントの目的に応じた多角的評価を行い、具体的な改善提案を提示します',
      buttonLabel: '評価を開始',
    };
  }
  return {
    menuLabel: 'Document Evaluation',
    menuDescription: 'AI evaluates your document based on its purpose and provides specific improvement suggestions',
    buttonLabel: 'Start Evaluation',
  };
}

/**
 * 評価深さの選択肢を取得（UI 用）
 */
export function getDepthOptions(locale: 'ja' | 'en' = 'ja'): Array<{
  value: EvaluationRequestOptions['depth'];
  label: string;
  description: string;
}> {
  if (locale === 'ja') {
    return [
      {
        value: 'quick',
        label: 'クイック',
        description: '概要のみ。スコアと簡潔なフィードバック',
      },
      {
        value: 'standard',
        label: '標準',
        description: '観点ごとのフィードバックと主要な改善提案',
      },
      {
        value: 'thorough',
        label: '詳細',
        description: '包括的な分析。具体的な箇所を参照した詳細なフィードバック',
      },
    ];
  }

  return [
    {
      value: 'quick',
      label: 'Quick',
      description: 'Overview only. Scores and brief feedback',
    },
    {
      value: 'standard',
      label: 'Standard',
      description: 'Per-dimension feedback and key improvement suggestions',
    },
    {
      value: 'thorough',
      label: 'Thorough',
      description: 'Comprehensive analysis with specific location references',
    },
  ];
}

// =============================================================================
// エクスポート
// =============================================================================

export default {
  // 設定
  DOCUMENT_EVALUATION_CONFIG,
  EVALUATION_DIMENSIONS,
  EVALUATION_PRESETS,
  DEFAULT_EVALUATION_OPTIONS,

  // 製品マッピング
  getEvaluationDocumentType,
  isEvaluationSupportedProduct,

  // プリセット
  getEvaluationPresets,
  getEvaluationPresetsForProduct,
  getPresetById,

  // 評価観点
  getEvaluationDimensions,
  getEvaluationDimensionsForProduct,
  getEffectiveWeights,

  // スコア・グレード
  calculateOverallScore,
  scoreToGrade,
  getGradeLabel,
  getGradeColor,

  // プロンプト
  getDocumentEvaluationPrompt,

  // レスポンス解析
  parseEvaluationResult,

  // ライセンス
  canUseDocumentEvaluation,

  // モデル推奨
  getRecommendedModelForEvaluation,

  // UI ヘルパー
  getEvaluationMenuLabel,
  getDepthOptions,
};
