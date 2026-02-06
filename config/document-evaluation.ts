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
 * 2. **構造化出力**:
 *    評価結果は JSON 形式で返却され、アプリ側で評価レポート UI を描画する。
 *    スコア（1–5）×観点ごとの評価 → 総合スコア（0–100）→ グレード（S/A/B/C/D）。
 *
 * 3. **Opus 推奨**:
 *    深い文脈理解と多角的分析が必要なため、Premium ティア（Opus）を推奨。
 *    Standard ティア（Sonnet）でも実行可能だが、評価精度はティアに依存する。
 *
 * 4. **クレジット共有**:
 *    ai_assistant と同一のクレジットプールから消費する（1 評価 = 1 クレジット）。
 *
 * ## 使い方
 *
 * ```typescript
 * import {
 *   getDocumentEvaluationPrompt,
 *   getEvaluationDimensions,
 *   parseEvaluationResult,
 *   scoreToGrade,
 *   DOCUMENT_EVALUATION_CONFIG,
 * } from '@/insight-common/config/document-evaluation';
 *
 * // 1. 評価用プロンプトを取得
 * const prompt = getDocumentEvaluationPrompt('slide', 'ja');
 *
 * // 2. Claude API にファイル内容 + プロンプトを送信
 * const response = await callClaudeApi({
 *   model: getModelForTier(credits.effectiveModelTier),
 *   system: prompt,
 *   messages: [{ role: 'user', content: fileContent }],
 * });
 *
 * // 3. レスポンスを解析
 * const result = parseEvaluationResult(response.text, 'slide');
 * console.log(result.overallGrade); // 'A'
 * console.log(result.dimensions);   // [{ key: 'structure', score: 4, ... }, ...]
 * ```
 */

import type { ProductCode, PlanCode } from './products';
import type { AiModelTier } from './usage-based-licensing';

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

/** 評価リクエストのオプション */
export interface EvaluationRequestOptions {
  /** 評価の深さ: quick（概要のみ）/ standard（標準）/ thorough（詳細） */
  depth: 'quick' | 'standard' | 'thorough';
  /** 特定の観点に焦点を当てる場合に指定 */
  focusDimensions?: string[];
  /** 評価の目的（Claude に追加コンテキストとして提供） */
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
 * PowerPoint プレゼンテーションを 5 つの観点で評価する。
 */
const SLIDE_DIMENSIONS: EvaluationDimensionDefinition[] = [
  {
    key: 'structure',
    name: 'Structure & Storyline',
    nameJa: '構成・ストーリーライン',
    description: 'Logical flow of slides, clear storyline progression, appropriate slide count and ordering',
    descriptionJa: 'スライドの論理的な流れ、明確なストーリー展開、適切なスライド数と順序構成',
    weight: 0.25,
  },
  {
    key: 'text_quality',
    name: 'Text Quality',
    nameJa: 'テキスト品質',
    description: 'Grammar, spelling, clarity, conciseness, appropriate level of detail per slide',
    descriptionJa: '文法・誤字脱字、明瞭さ、簡潔さ、スライドあたりの適切な情報量',
    weight: 0.25,
  },
  {
    key: 'consistency',
    name: 'Consistency & Terminology',
    nameJa: '一貫性・用語統一',
    description: 'Consistent use of terminology, tone, writing style, and formatting throughout',
    descriptionJa: '用語の統一、トーンの一貫性、文体・フォーマットの統一',
    weight: 0.20,
  },
  {
    key: 'visual_design',
    name: 'Visual Design Readability',
    nameJa: 'ビジュアル・可読性',
    description: 'Text placement, font size appropriateness, information hierarchy, visual balance',
    descriptionJa: 'テキスト配置、フォントサイズの適切さ、情報の階層化、視覚的バランス',
    weight: 0.15,
  },
  {
    key: 'audience_appeal',
    name: 'Audience Appeal',
    nameJa: '聴衆への訴求力',
    description: 'Compelling opening, clear takeaways, appropriate complexity for target audience',
    descriptionJa: '導入の引き付け力、明確な結論・要点、対象聴衆に適した複雑度',
    weight: 0.15,
  },
];

/**
 * スプレッドシート（IOSH）の評価観点
 *
 * Excel ワークブックを 5 つの観点で評価する。
 */
const SPREADSHEET_DIMENSIONS: EvaluationDimensionDefinition[] = [
  {
    key: 'data_structure',
    name: 'Data Structure & Organization',
    nameJa: 'データ構造・整理',
    description: 'Sheet organization, header clarity, data normalization, naming conventions',
    descriptionJa: 'シート構成、ヘッダーの明確さ、データの正規化、命名規則',
    weight: 0.25,
  },
  {
    key: 'formula_accuracy',
    name: 'Formula & Calculation Accuracy',
    nameJa: '数式・計算の正確性',
    description: 'Correct formulas, proper cell references, error handling, calculation logic',
    descriptionJa: '数式の正しさ、セル参照の適切さ、エラーハンドリング、計算ロジックの妥当性',
    weight: 0.25,
  },
  {
    key: 'data_quality',
    name: 'Data Quality & Integrity',
    nameJa: 'データ品質・整合性',
    description: 'Data completeness, consistency, validation, absence of anomalies or duplicates',
    descriptionJa: 'データの完全性、一貫性、バリデーション、異常値・重複の有無',
    weight: 0.20,
  },
  {
    key: 'readability',
    name: 'Formatting & Readability',
    nameJa: '書式・可読性',
    description: 'Number formats, conditional formatting, column widths, visual grouping, print readiness',
    descriptionJa: '数値フォーマット、条件付き書式、列幅、視覚的グルーピング、印刷対応',
    weight: 0.15,
  },
  {
    key: 'analysis_completeness',
    name: 'Analysis Completeness',
    nameJa: '分析の完全性',
    description: 'Summary statistics, charts, pivot coverage, missing insights, actionable conclusions',
    descriptionJa: '集計・統計の有無、グラフの活用、ピボットのカバレッジ、見落とし、結論の明確さ',
    weight: 0.15,
  },
];

/**
 * ドキュメント（IOSD）の評価観点
 *
 * Word 文書を 5 つの観点で評価する。
 */
const DOCUMENT_DIMENSIONS: EvaluationDimensionDefinition[] = [
  {
    key: 'document_structure',
    name: 'Document Structure',
    nameJa: '文書構成',
    description: 'Heading hierarchy, section organization, table of contents, logical flow',
    descriptionJa: '見出し階層、セクション構成、目次の有無、論理的な流れ',
    weight: 0.20,
  },
  {
    key: 'writing_quality',
    name: 'Writing Quality',
    nameJa: '文章品質',
    description: 'Grammar, spelling, clarity, conciseness, professional tone',
    descriptionJa: '文法・誤字脱字、明瞭さ、簡潔さ、プロフェッショナルなトーン',
    weight: 0.25,
  },
  {
    key: 'logical_coherence',
    name: 'Logical Coherence',
    nameJa: '論理的整合性',
    description: 'Argument flow, evidence support, counterpoint handling, conclusion alignment',
    descriptionJa: '論旨の展開、根拠の提示、反論への対応、結論との整合性',
    weight: 0.25,
  },
  {
    key: 'formatting',
    name: 'Formatting & Presentation',
    nameJa: '書式・体裁',
    description: 'Style consistency, font usage, spacing, tables/figures formatting, references',
    descriptionJa: 'スタイルの統一、フォント使用、余白・行間、表・図の体裁、参考文献',
    weight: 0.15,
  },
  {
    key: 'purpose_fulfillment',
    name: 'Purpose Fulfillment',
    nameJa: '目的達成度',
    description: 'Whether the document achieves its stated or implied purpose effectively',
    descriptionJa: '文書が明示的・暗黙的な目的を効果的に達成しているか',
    weight: 0.15,
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

// =============================================================================
// スコア・グレード計算
// =============================================================================

/**
 * 観点別スコアから総合スコア（0–100）を算出
 *
 * 各観点のスコア（1–5）を重み付け平均し、100点満点に変換する。
 *
 * @example
 * ```typescript
 * const dimensions = [
 *   { key: 'structure', score: 4 },
 *   { key: 'text_quality', score: 3 },
 *   // ...
 * ];
 * const overall = calculateOverallScore(dimensions, 'slide');
 * // → 72 (重み付け平均)
 * ```
 */
export function calculateOverallScore(
  dimensionResults: Array<{ key: string; score: number }>,
  docType: EvaluationDocumentType,
): number {
  const definitions = EVALUATION_DIMENSIONS[docType];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of dimensionResults) {
    const def = definitions.find(d => d.key === result.key);
    if (!def) continue;

    const clampedScore = Math.max(1, Math.min(5, result.score));
    weightedSum += clampedScore * def.weight;
    totalWeight += def.weight;
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
): string {
  const dims = EVALUATION_DIMENSIONS[docType];

  return dims
    .map((d, i) => {
      const name = locale === 'ja' ? d.nameJa : d.name;
      const desc = locale === 'ja' ? d.descriptionJa : d.description;
      const weightPct = Math.round(d.weight * 100);
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
スライド番号と行番号を利用して、具体的な箇所を特定した評価を行ってください。
location フィールドには「スライド N」の形式で記載してください。`;
      case 'spreadsheet':
        return `【対象ドキュメント: Excel スプレッドシート】
入力データにはシート名、セル範囲、値、数式の情報が含まれます。
セルアドレス（例: A1:C10）やシート名を利用して、具体的な箇所を特定した評価を行ってください。
location フィールドにはセルアドレスまたはシート名を記載してください。`;
      case 'document':
        return `【対象ドキュメント: Word 文書】
入力データには段落テキスト、見出し構造、書式情報が含まれます。
段落番号やセクション名を利用して、具体的な箇所を特定した評価を行ってください。
location フィールドには「第N段落」や「セクション: xxx」の形式で記載してください。`;
    }
  }

  switch (docType) {
    case 'slide':
      return `DOCUMENT TYPE: PowerPoint Presentation
Input data rows have: row number, slideNumber, shapeId, text.
Reference specific slides in your evaluation. Use "Slide N" format for location fields.`;
    case 'spreadsheet':
      return `DOCUMENT TYPE: Excel Spreadsheet
Input data includes: sheet names, cell ranges, values, formulas.
Reference specific cells/sheets in your evaluation. Use cell addresses or sheet names for location fields.`;
    case 'document':
      return `DOCUMENT TYPE: Word Document
Input data includes: paragraph text, heading structure, formatting info.
Reference specific paragraphs/sections in your evaluation. Use "Paragraph N" or "Section: xxx" for location fields.`;
  }
}

/**
 * ドキュメント評価用のシステムプロンプトを生成
 *
 * このプロンプトは Claude API の system パラメータに設定する。
 * ユーザーメッセージとしてドキュメント内容を送信する。
 *
 * @example
 * ```typescript
 * const systemPrompt = getDocumentEvaluationPrompt('slide', { depth: 'standard', locale: 'ja' });
 * const response = await claude.messages.create({
 *   model: 'claude-opus-4-6-20260131',
 *   system: systemPrompt,
 *   messages: [{ role: 'user', content: slideTextContent }],
 * });
 * ```
 */
export function getDocumentEvaluationPrompt(
  docType: EvaluationDocumentType,
  options: Partial<EvaluationRequestOptions> = {},
): string {
  const opts = { ...DEFAULT_EVALUATION_OPTIONS, ...options };
  const { depth, focusDimensions, purpose, locale } = opts;

  const dimensionInstructions = buildDimensionInstructions(docType, locale);
  const depthInstruction = getDepthInstruction(depth, locale);
  const docContext = getDocumentTypeContext(docType, locale);

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
    return `あなたはドキュメント評価の専門家です。
提供されたドキュメントを以下の評価観点に基づいて多角的に分析し、構造化された評価結果を返してください。

${docContext}

${depthInstruction}
${focusInstruction}
${purposeInstruction}

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
    "良い点1",
    "良い点2"
  ],
  "improvements": [
    {
      "priority": "high" | "medium" | "low",
      "dimension": "対象の観点キー",
      "suggestion": "具体的な改善提案",
      "location": "対象箇所（任意）"
    }
  ],
  "summary": "総合的な評価コメント（2〜3文）"
}
\`\`\`

## スコア基準

| スコア | 意味 |
|-------|------|
| 5 | 優秀 — ほぼ改善の余地なし |
| 4 | 良好 — 細かい改善点はあるが質が高い |
| 3 | 普通 — 基本的な要件は満たしているが改善の余地がある |
| 2 | やや不十分 — 複数の問題があり改善が必要 |
| 1 | 不十分 — 根本的な見直しが必要 |

strengths は少なくとも1件、improvements は少なくとも1件含めてください。
各 improvement の priority は問題の重要度に応じて設定してください。`;
  }

  // English
  return `You are a document evaluation expert.
Analyze the provided document across the following evaluation dimensions and return structured results.

${docContext}

${depthInstruction}
${focusInstruction}
${purposeInstruction}

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
    "Strength 1",
    "Strength 2"
  ],
  "improvements": [
    {
      "priority": "high" | "medium" | "low",
      "dimension": "target dimension key",
      "suggestion": "Specific improvement suggestion",
      "location": "Target location (optional)"
    }
  ],
  "summary": "Overall evaluation comment (2-3 sentences)"
}
\`\`\`

## Score Criteria

| Score | Meaning |
|-------|---------|
| 5 | Excellent — Virtually no room for improvement |
| 4 | Good — Minor improvements possible but high quality |
| 3 | Average — Meets basic requirements but room for improvement |
| 2 | Below Average — Multiple issues requiring improvement |
| 1 | Poor — Fundamental revision needed |

Include at least 1 strength and 1 improvement.
Set each improvement's priority based on the severity of the issue.`;
}

// =============================================================================
// レスポンス解析
// =============================================================================

/**
 * Claude API のレスポンステキストから評価結果を解析
 *
 * Claude の応答テキストから JSON を抽出し、型安全な
 * DocumentEvaluationResult に変換する。
 *
 * @param responseText - Claude API からの応答テキスト
 * @param docType - ドキュメントタイプ
 * @returns 評価結果（解析失敗時は null）
 *
 * @example
 * ```typescript
 * const result = parseEvaluationResult(response.content[0].text, 'slide');
 * if (result) {
 *   console.log(`Grade: ${result.overallGrade} (${result.overallScore}/100)`);
 * }
 * ```
 */
export function parseEvaluationResult(
  responseText: string,
  docType: EvaluationDocumentType,
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

    const overallScore = calculateOverallScore(validDimensions, docType);

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
 *
 * @returns 推奨モデル ID とティア
 */
export function getRecommendedModelForEvaluation(): {
  modelId: string;
  tier: AiModelTier;
  reasonJa: string;
  reasonEn: string;
} {
  return {
    modelId: 'claude-opus-4-6-20260131',
    tier: 'premium',
    reasonJa: 'ドキュメント評価には Opus 4.6 の拡張コンテキストと深い分析力を推奨します',
    reasonEn: 'Opus 4.6 with extended context and deep analysis capabilities is recommended for document evaluation',
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
      menuDescription: 'AIがドキュメントを多角的に評価し、改善提案を提示します',
      buttonLabel: '評価を開始',
    };
  }
  return {
    menuLabel: 'Document Evaluation',
    menuDescription: 'AI evaluates your document from multiple perspectives and suggests improvements',
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
  DEFAULT_EVALUATION_OPTIONS,

  // 製品マッピング
  getEvaluationDocumentType,
  isEvaluationSupportedProduct,

  // 評価観点
  getEvaluationDimensions,
  getEvaluationDimensionsForProduct,

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
