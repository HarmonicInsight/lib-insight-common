/**
 * AI アシスタント 共通設定
 *
 * InsightOffice 系アプリ（INSS/INSP/HMSH/HMDC/HMSL）で共有する
 * AI アシスタントのペルソナ・プロンプト・ツール定義・型定義
 *
 * 詳細仕様: standards/AI_ASSISTANT.md
 */

import type { ProductCode, PlanCode } from './products';

// =============================================================================
// 型定義
// =============================================================================

/** AI メッセージのロール */
export type AiMessageRole = 'user' | 'assistant' | 'system';

/** AI チャットメッセージ */
export interface AiMessage {
  id: string;
  content: string;
  role: AiMessageRole;
  createdAt: string; // ISO 8601
  isStreaming?: boolean;
  isToolStatus?: boolean;
}

/** AI ペルソナ定義 */
export interface AiPersona {
  id: string;
  nameJa: string;
  nameEn: string;
  model: string;
  themeColor: string;
  descriptionJa: string;
  descriptionEn: string;
  icon32: string; // 相対パス: Assets/Personas/{id}_32.png
  icon48: string; // 相対パス: Assets/Personas/{id}_48.png
}

/** テキスト修正提案（スライド系） */
export interface TextSuggestion {
  row: number;
  slideNumber?: number;
  shapeId?: string;
  originalText: string;
  suggestedText: string;
  reason: string;
}

/** ツール定義 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** Claude API レスポンスのコンテンツブロック */
export interface ContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/** Claude API レスポンス */
export interface ClaudeResponse {
  content: ContentBlock[];
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** ツール実行結果 */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/** AI 使用量トラッキング */
export interface AiUsageStats {
  totalCalls: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

/** AI アシスタント設定 */
export interface AiAssistantSettings {
  claudeApiKey: string;
  selectedPersonaId: string;
  selectedModel: string;
  language: 'ja' | 'en';
  chatPanelWidth: number;
}

// =============================================================================
// ペルソナ定義
// =============================================================================

/**
 * 標準 AI ペルソナ（全製品共通）
 *
 * 3 キャラクターで Claude モデルを使い分ける:
 * - shunsuke (俊): Haiku — 素早く簡潔
 * - megumi   (恵): Sonnet — 万能で丁寧（デフォルト）
 * - manabu   (学): Opus — 深い思考力
 */
export const AI_PERSONAS: AiPersona[] = [
  {
    id: 'shunsuke',
    nameJa: 'Claude 俊',
    nameEn: 'Claude Shun',
    model: 'claude-haiku-4-5-20251001',
    themeColor: '#4696DC',
    descriptionJa: '素早く簡潔。軽い確認・ちょっとした修正に最適',
    descriptionEn: 'Quick and concise. Best for quick checks and light edits.',
    icon32: 'Assets/Personas/shunsuke_32.png',
    icon48: 'Assets/Personas/shunsuke_48.png',
  },
  {
    id: 'megumi',
    nameJa: 'Claude 恵',
    nameEn: 'Claude Megumi',
    model: 'claude-sonnet-4-20250514',
    themeColor: '#B8942F',
    descriptionJa: '万能で丁寧。編集・要約・翻訳のバランス型',
    descriptionEn: 'Versatile and thorough. Great for editing, summaries, translations.',
    icon32: 'Assets/Personas/megumi_32.png',
    icon48: 'Assets/Personas/megumi_48.png',
  },
  {
    id: 'manabu',
    nameJa: 'Claude 学',
    nameEn: 'Claude Manabu',
    model: 'claude-opus-4-20250514',
    themeColor: '#8C64C8',
    descriptionJa: '深い思考力。レポート・精密な文書に最適',
    descriptionEn: 'Deep thinker. Best for reports and documents requiring precision.',
    icon32: 'Assets/Personas/manabu_32.png',
    icon48: 'Assets/Personas/manabu_48.png',
  },
];

/** デフォルトペルソナ ID */
export const DEFAULT_PERSONA_ID = 'megumi';

/** ペルソナを ID で取得 */
export function getPersona(id: string): AiPersona | undefined {
  return AI_PERSONAS.find(p => p.id === id);
}

/** デフォルトペルソナを取得 */
export function getDefaultPersona(): AiPersona {
  return AI_PERSONAS.find(p => p.id === DEFAULT_PERSONA_ID)!;
}

// =============================================================================
// API 設定
// =============================================================================

/** Claude API 設定 */
export const CLAUDE_API_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  defaultModel: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  httpTimeoutMs: 90_000,
  cancellationTimeoutMs: 120_000,
} as const;

/** モデル別コスト（USD per 1M tokens） */
export const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  'claude-haiku-4-5-20251001': { inputPer1M: 1, outputPer1M: 5 },
  'claude-sonnet-4-20250514': { inputPer1M: 3, outputPer1M: 15 },
  'claude-opus-4-20250514': { inputPer1M: 15, outputPer1M: 75 },
};

/** 推定コストを計算 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (inputTokens * pricing.inputPer1M + outputTokens * pricing.outputPer1M) / 1_000_000;
}

// =============================================================================
// 会話管理
// =============================================================================

/** 会話履歴の最大メッセージ数（API 送信用） */
export const MAX_CONVERSATION_HISTORY = 30;

/** チャット履歴の最大保存数（ローカル永続化用） */
export const MAX_CHAT_HISTORY_STORAGE = 100;

/** Tool Use ループの最大イテレーション数 */
export const MAX_TOOL_USE_ITERATIONS = 10;

// =============================================================================
// システムプロンプト
// =============================================================================

/** 製品別 AI コンテキストタイプ */
export type AiContextType = 'slide' | 'spreadsheet' | 'document';

/** 製品から AI コンテキストタイプを取得 */
export function getAiContextType(product: ProductCode): AiContextType | null {
  const contextMap: Partial<Record<ProductCode, AiContextType>> = {
    INSS: 'slide',
    INSP: 'slide',
    HMSL: 'slide',
    HMSH: 'spreadsheet',
    HMDC: 'document',
  };
  return contextMap[product] ?? null;
}

/** AI 対応製品かチェック */
export function isAiSupportedProduct(product: ProductCode): boolean {
  return getAiContextType(product) !== null;
}

/**
 * 製品別のベースシステムプロンプトを取得
 */
export function getBaseSystemPrompt(product: ProductCode, locale: 'ja' | 'en' = 'ja'): string {
  const contextType = getAiContextType(product);

  if (locale === 'ja') {
    switch (contextType) {
      case 'slide':
        return `あなたはPowerPointプレゼンテーションの内容を分析・修正するAIアシスタントです。
日本語で回答してください。

スライドデータの各行には行番号（row=N）が付いています。
特定の行について言及するときは「#N」の形式で行番号を使ってください。
ユーザーが「#5を修正して」のように行番号で指定することがあります。

主な機能：
- テキストの誤字脱字の指摘と修正
- 文章の改善提案
- 表現の統一
- 内容の要約
- スライド構成のアドバイス

ユーザーの質問や要望に丁寧に回答してください。`;

      case 'spreadsheet':
        return `You are an AI assistant for HarmonicSheet, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.`;

      case 'document':
        return `あなたはHarmonicDocのAIアシスタントです。Wordドキュメントの操作・自動化を支援します。
ユーザーのメッセージと同じ言語で回答してください。

主な機能：
- 文章の校正・誤字脱字の修正
- 文書の要約・構成提案
- フォーマット変換のアドバイス
- テンプレート活用の提案

ユーザーの質問や要望に丁寧に回答してください。`;

      default:
        return 'あなたはAIアシスタントです。ユーザーの質問や要望に丁寧に回答してください。';
    }
  }

  // English
  switch (contextType) {
    case 'slide':
      return `You are an AI assistant for analyzing and improving PowerPoint presentations.

Each row of slide data has a row number (row=N).
When referring to a specific row, use the "#N" format.
Users may specify rows like "#5 fix this".

Key capabilities:
- Identify and fix typos and errors
- Suggest text improvements
- Unify expressions and terminology
- Summarize content
- Provide slide structure advice

Please respond helpfully to user questions and requests.`;

    case 'spreadsheet':
      return `You are an AI assistant for HarmonicSheet, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.`;

    case 'document':
      return `You are an AI assistant for HarmonicDoc, a Word document operations and automation tool.
Respond in the same language as the user's message.

Key capabilities:
- Proofreading and error correction
- Document summarization and structure suggestions
- Format conversion advice
- Template usage recommendations

Please respond helpfully to user questions and requests.`;

    default:
      return 'You are an AI assistant. Please respond helpfully to user questions and requests.';
  }
}

/**
 * 構造化出力用のシステムプロンプト（内容チェック機能）
 */
export function getStructuredOutputPrompt(locale: 'ja' | 'en' = 'ja'): string {
  if (locale === 'ja') {
    return `あなたはPowerPointプレゼンテーションのテキスト修正アシスタントです。

以下のスライドテキストデータを分析し、修正が必要な箇所を特定してください。

修正対象：
- 誤字脱字
- 文法の誤り
- 表現の改善（より分かりやすく、プロフェッショナルに）
- 表記の統一（漢字/ひらがな、用語の統一）
- 冗長な表現の簡潔化

【重要なルール】
- 入力データの各行は row（行番号）, slideNumber, shapeId, text の構造を持ちます。
- 修正提案では row（行番号）を必ず返してください。これが最も重要な識別子です。
- originalText には、入力データの text フィールドの内容を「完全一致」でコピーしてください。
- suggestedText には、修正後のテキスト全文を書いてください（変更箇所だけでなく全文）。
- 修正不要な行は含めないでください。
- reason には修正理由を簡潔に記載してください。

修正提案は必ず以下のJSON配列形式で返してください：
[{"row": 1, "originalText": "元のテキスト", "suggestedText": "修正後のテキスト", "reason": "修正理由"}]

修正箇所がない場合は空配列 [] を返してください。`;
  }

  return `You are a PowerPoint presentation text correction assistant.

Analyze the following slide text data and identify areas that need correction.

Correction targets:
- Typos and spelling errors
- Grammar mistakes
- Expression improvements (clearer, more professional)
- Terminology consistency
- Simplification of redundant expressions

IMPORTANT RULES:
- Each row of input data has row (row number), slideNumber, shapeId, text fields.
- Always include the row number in your suggestions. This is the most important identifier.
- For originalText, copy the exact text from the input data's text field.
- For suggestedText, write the full corrected text (not just the changed part).
- Do not include rows that need no correction.
- Write a brief reason for each correction.

Return suggestions as a JSON array:
[{"row": 1, "originalText": "original text", "suggestedText": "corrected text", "reason": "reason for correction"}]

Return an empty array [] if no corrections are needed.`;
}

// =============================================================================
// スプレッドシート Tool Use 定義（HMSH 標準）
// =============================================================================

/**
 * HarmonicSheet 用のスプレッドシートツール定義
 *
 * 使い方:
 * ```typescript
 * import { SPREADSHEET_TOOLS } from '@/insight-common/config/ai-assistant';
 * const tools = SPREADSHEET_TOOLS.map(t => ({
 *   name: t.name,
 *   description: t.description,
 *   input_schema: t.input_schema,
 * }));
 * ```
 */
export const SPREADSHEET_TOOLS: ToolDefinition[] = [
  {
    name: 'get_cell_range',
    description: 'Read values, formulas, and styles from a cell range. Returns cell data in the specified range. Use A1 notation (e.g., "A1:C10").',
    input_schema: {
      type: 'object',
      properties: {
        range: {
          type: 'string',
          description: 'Cell range in A1 notation (e.g., "A1:C10", "Sheet1!A1:B5")',
        },
        sheet_name: {
          type: 'string',
          description: 'Sheet name. Defaults to active sheet if omitted.',
        },
      },
      required: ['range'],
    },
  },
  {
    name: 'set_cell_values',
    description: 'Set plain text or numeric values in one or more cells.',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cell: { type: 'string', description: 'Cell address (e.g., "A1")' },
              value: { type: ['string', 'number'], description: 'Value to set' },
            },
            required: ['cell', 'value'],
          },
          description: 'List of cell-value pairs to update',
        },
        sheet_name: {
          type: 'string',
          description: 'Sheet name. Defaults to active sheet if omitted.',
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'set_cell_formulas',
    description: 'Insert Excel formulas (starting with "=") into cells.',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cell: { type: 'string', description: 'Cell address (e.g., "B2")' },
              formula: { type: 'string', description: 'Excel formula (e.g., "=SUM(A1:A10)")' },
            },
            required: ['cell', 'formula'],
          },
          description: 'List of cell-formula pairs to set',
        },
        sheet_name: {
          type: 'string',
          description: 'Sheet name. Defaults to active sheet if omitted.',
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'set_cell_styles',
    description: 'Apply formatting: font, colors, borders, alignment, number format, wrap text.',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              range: { type: 'string', description: 'Cell range (e.g., "A1:C3")' },
              style: {
                type: 'object',
                properties: {
                  bold: { type: 'boolean' },
                  italic: { type: 'boolean' },
                  underline: { type: 'boolean' },
                  fontSize: { type: 'number' },
                  fontName: { type: 'string' },
                  fontColor: { type: 'string', description: 'Hex color (e.g., "#FF0000")' },
                  backgroundColor: { type: 'string', description: 'Hex color' },
                  horizontalAlignment: { type: 'string', enum: ['left', 'center', 'right'] },
                  verticalAlignment: { type: 'string', enum: ['top', 'middle', 'bottom'] },
                  numberFormat: { type: 'string', description: 'Excel number format (e.g., "#,##0", "0.00%")' },
                  wrapText: { type: 'boolean' },
                  borders: { type: 'string', description: 'Border spec (e.g., "all:Thin:#000000")' },
                },
              },
            },
            required: ['range', 'style'],
          },
        },
        sheet_name: { type: 'string' },
      },
      required: ['updates'],
    },
  },
  {
    name: 'analyze_data',
    description: 'Get statistical summary (count, sum, average, min, max, median) for a numeric range.',
    input_schema: {
      type: 'object',
      properties: {
        range: {
          type: 'string',
          description: 'Cell range containing numeric data (e.g., "B2:B100")',
        },
        sheet_name: { type: 'string' },
      },
      required: ['range'],
    },
  },
  {
    name: 'find_cells',
    description: 'Search cells by text value or formula pattern (case-insensitive substring match). Returns up to 50 matching cells.',
    input_schema: {
      type: 'object',
      properties: {
        search_text: {
          type: 'string',
          description: 'Text to search for (case-insensitive substring match)',
        },
        search_in: {
          type: 'string',
          enum: ['values', 'formulas', 'both'],
          description: 'Where to search. Defaults to "values".',
        },
        sheet_name: { type: 'string' },
      },
      required: ['search_text'],
    },
  },
];

// =============================================================================
// AI 対応製品の機能キー
// =============================================================================

/**
 * AI アシスタント機能のフィーチャーキー
 * products.ts での機能定義で使用する統一キー
 */
export const AI_FEATURE_KEY = 'ai_assistant';

/**
 * AI アシスタントが利用可能なプラン
 */
export const AI_ALLOWED_PLANS: PlanCode[] = ['TRIAL', 'PRO', 'ENT'];

/**
 * AI アシスタントが利用可能かチェック
 */
export function canUseAiAssistant(plan: PlanCode): boolean {
  return AI_ALLOWED_PLANS.includes(plan);
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // ペルソナ
  AI_PERSONAS,
  DEFAULT_PERSONA_ID,
  getPersona,
  getDefaultPersona,

  // API 設定
  CLAUDE_API_CONFIG,
  MODEL_PRICING,
  estimateCost,

  // 会話管理
  MAX_CONVERSATION_HISTORY,
  MAX_CHAT_HISTORY_STORAGE,
  MAX_TOOL_USE_ITERATIONS,

  // プロンプト
  getAiContextType,
  isAiSupportedProduct,
  getBaseSystemPrompt,
  getStructuredOutputPrompt,

  // ツール定義
  SPREADSHEET_TOOLS,

  // ライセンス
  AI_FEATURE_KEY,
  AI_ALLOWED_PLANS,
  canUseAiAssistant,
};
