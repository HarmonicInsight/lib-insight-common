/**
 * AI アシスタント 共通設定
 *
 * InsightOffice 系アプリ（INSS/IOSH/IOSD/INPY/INBT）で共有する
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
export type AiContextType = 'slide' | 'spreadsheet' | 'document' | 'code';

/** 製品から AI コンテキストタイプを取得 */
export function getAiContextType(product: ProductCode): AiContextType | null {
  const contextMap: Partial<Record<ProductCode, AiContextType>> = {
    INSS: 'slide',
    IOSH: 'spreadsheet',
    IOSD: 'document',
    INPY: 'code',
    INBT: 'code',
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
      case 'code':
        return `あなたは${product === 'INPY' ? 'InsightPy' : 'InsightBot'}のAIコードエディターアシスタントです。
Pythonコードの作成・編集・デバッグを支援します。
ユーザーのメッセージと同じ言語で回答してください。

【Python 実行保証ルール — 厳守】
1. 生成・編集するコードは必ず Python 3.10+ で実行可能であること。
2. コード出力前に内部で以下を検証すること:
   - 構文エラー（SyntaxError）がないこと
   - インデントが一貫していること（スペース4つ）
   - 未定義変数・未インポートモジュールがないこと
   - 型ヒントを使用する場合は正しい構文であること
3. 外部ライブラリを使用する場合:
   - 必ず import 文を含めること
   - pip install が必要なパッケージは冒頭コメントで明記すること
   - 例: # requires: pip install pandas openpyxl
4. Windows 固有のパス区切り文字に注意:
   - os.path.join() または pathlib.Path を使用すること
   - バックスラッシュのハードコードは禁止（raw文字列リテラルも非推奨）
5. エンコーディング:
   - ファイル操作時は encoding='utf-8' を明示すること
6. コード提案時は必ず完全な実行可能コードを返すこと（断片禁止）。
7. エラーが発生しそうな箇所には適切な try-except を追加すること。

【validate_python_syntax ツールの活用】
コードを生成・修正したら、必ず validate_python_syntax ツールで構文検証してください。
検証が通らないコードをユーザーに提案してはいけません。

${product === 'INBT' ? `【InsightBot 固有】
- RPA ジョブとしてスケジュール実行されるコンテキストを考慮すること
- ログ出力（logging モジュール）を含めること
- 実行結果のステータスを返す構造にすること（exit code 0/1）
` : `【InsightPy 固有】
- インタラクティブ実行とスクリプト実行の両方を考慮すること
- Windows 自動化（pyautogui, pywinauto 等）のコードは安全なガードを含めること
`}
主な機能:
- Python コードの生成・補完
- 構文エラー・実行時エラーの診断と修正
- コードリファクタリング・最適化
- ライブラリの使い方の提案
- Windows 自動化スクリプトの作成支援`;

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
        return `You are an AI assistant for InsightOfficeSheet, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.`;

      case 'document':
        return `あなたはInsightOfficeDocのAIアシスタントです。Wordドキュメントの操作・自動化を支援します。
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
    case 'code':
      return `You are an AI code editor assistant for ${product === 'INPY' ? 'InsightPy' : 'InsightBot'}.
You help create, edit, and debug Python code.
Respond in the same language as the user's message.

PYTHON EXECUTION GUARANTEE RULES — STRICTLY ENFORCED:
1. All generated/edited code MUST be executable on Python 3.10+.
2. Before outputting code, internally verify:
   - No SyntaxError
   - Consistent indentation (4 spaces)
   - No undefined variables or unimported modules
   - Correct type hint syntax if used
3. When using external libraries:
   - Always include import statements
   - Specify required pip packages in a header comment
   - Example: # requires: pip install pandas openpyxl
4. Windows-specific path handling:
   - Use os.path.join() or pathlib.Path
   - Never hardcode backslashes (raw string literals also discouraged)
5. Encoding:
   - Always specify encoding='utf-8' for file operations
6. Always return complete, executable code (no fragments).
7. Add appropriate try-except blocks for error-prone sections.

USE THE validate_python_syntax TOOL:
After generating or modifying code, always validate with the validate_python_syntax tool.
Never propose code that fails validation.

${product === 'INBT' ? `InsightBot specifics:
- Consider RPA job scheduling context
- Include logging (logging module)
- Return execution status (exit code 0/1)
` : `InsightPy specifics:
- Consider both interactive and script execution
- Include safety guards for Windows automation (pyautogui, pywinauto, etc.)
`}
Key capabilities:
- Python code generation and completion
- Syntax and runtime error diagnosis and fixes
- Code refactoring and optimization
- Library usage suggestions
- Windows automation script assistance`;

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
      return `You are an AI assistant for InsightOfficeSheet, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.`;

    case 'document':
      return `You are an AI assistant for InsightOfficeDoc, a Word document operations and automation tool.
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
// スプレッドシート Tool Use 定義（IOSH 標準）
// =============================================================================

/**
 * InsightOfficeSheet 用のスプレッドシートツール定義
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

  // =========================================================================
  // 2ファイル比較ツール（file_compare 機能連動）
  // =========================================================================

  {
    name: 'get_compare_files',
    description:
      'Get information about the two files currently loaded in file compare mode. ' +
      'Returns file names, sheet lists, and used ranges for both File A (left) and File B (right). ' +
      'Call this first to understand the structure of both files before reading data.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_compare_cell_range',
    description:
      'Read cell values from either File A or File B in file compare mode. ' +
      'Use "A" for the left file and "B" for the right file. ' +
      'Works the same as get_cell_range but targets a specific file in the comparison.',
    input_schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          enum: ['A', 'B'],
          description: 'Which file to read: "A" (left/old) or "B" (right/new)',
        },
        range: {
          type: 'string',
          description: 'Cell range in A1 notation (e.g., "A1:F20")',
        },
        sheet_name: {
          type: 'string',
          description: 'Sheet name. Defaults to active sheet if omitted.',
        },
      },
      required: ['file', 'range'],
    },
  },
  {
    name: 'get_compare_diff',
    description:
      'Get cell-level differences between File A and File B for a given range. ' +
      'Returns an array of changed cells with: cell address, value in A, value in B, and change type ' +
      '(added, removed, modified, type_changed). ' +
      'If no range is specified, compares the entire used range of the active sheet.',
    input_schema: {
      type: 'object',
      properties: {
        range: {
          type: 'string',
          description: 'Cell range to compare (e.g., "A1:F20"). If omitted, compares entire used range.',
        },
        sheet_name: {
          type: 'string',
          description: 'Sheet name to compare. Defaults to active sheet.',
        },
        include_unchanged: {
          type: 'boolean',
          description: 'Include unchanged cells in the result. Defaults to false (only differences).',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_compare_summary',
    description:
      'Get a high-level summary of all differences between File A and File B. ' +
      'Returns: total cells compared, cells added, cells removed, cells modified, ' +
      'sheets only in A, sheets only in B, and per-sheet change counts. ' +
      'Use this for an overview before diving into specific ranges with get_compare_diff.',
    input_schema: {
      type: 'object',
      properties: {
        sheet_name: {
          type: 'string',
          description: 'Specific sheet to summarize. If omitted, summarizes all sheets.',
        },
      },
      required: [],
    },
  },
];

// =============================================================================
// コードエディター Tool Use 定義（INPY / INBT 共通）
// =============================================================================

/**
 * InsightPy / InsightBot 用のコードエディターツール定義
 *
 * 【設計方針】
 * - Python コードの構文検証を AI ループ内で実行し、壊れたコードをユーザーに返さない
 * - ホストアプリ（Python / C#）が実際のツール実行を担当
 * - このツール定義は Claude API の tools パラメータにそのまま渡せる形式
 *
 * 使い方:
 * ```typescript
 * import { CODE_EDITOR_TOOLS } from '@/insight-common/config/ai-assistant';
 * const tools = CODE_EDITOR_TOOLS.map(t => ({
 *   name: t.name,
 *   description: t.description,
 *   input_schema: t.input_schema,
 * }));
 * ```
 */
export const CODE_EDITOR_TOOLS: ToolDefinition[] = [
  {
    name: 'validate_python_syntax',
    description:
      'Validate Python code for syntax errors using ast.parse(). ' +
      'Returns { valid: true } or { valid: false, error, line, offset }. ' +
      'MUST be called before proposing any code to the user.',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Complete Python source code to validate',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'run_python_code',
    description:
      'Execute Python code in a sandboxed subprocess with a timeout. ' +
      'Returns stdout, stderr, and exit_code. ' +
      'Use this to test code before presenting results to the user.',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python source code to execute',
        },
        timeout_seconds: {
          type: 'number',
          description: 'Execution timeout in seconds (default: 30, max: 120)',
        },
        working_directory: {
          type: 'string',
          description: 'Working directory for execution. Defaults to the project directory.',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'lint_python_code',
    description:
      'Run linting checks (pyflakes-level) on Python code. ' +
      'Detects: unused imports, undefined names, redefined unused variables, missing imports. ' +
      'Returns an array of { line, column, message, severity } diagnostics.',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python source code to lint',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'get_script_content',
    description:
      'Read the content of the currently open script or a specified script file. ' +
      'Returns the full source code as a string.',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the script file. If omitted, reads the currently active editor content.',
        },
      },
      required: [],
    },
  },
  {
    name: 'replace_script_content',
    description:
      'Replace the full content of the currently open script. ' +
      'The code MUST have been validated with validate_python_syntax first. ' +
      'Returns { success: true } or { success: false, reason }.',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'New complete Python source code to set in the editor',
        },
        description: {
          type: 'string',
          description: 'Brief description of what was changed (shown in undo history)',
        },
      },
      required: ['code', 'description'],
    },
  },
  {
    name: 'insert_code_at_cursor',
    description:
      'Insert code at the current cursor position or at a specified line. ' +
      'The inserted code MUST have been validated in context with validate_python_syntax.',
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code to insert',
        },
        line: {
          type: 'number',
          description: 'Line number to insert at (1-based). If omitted, inserts at cursor position.',
        },
      },
      required: ['code'],
    },
  },
];

/**
 * Python 構文検証のホストアプリ側リファレンス実装
 *
 * ホストアプリ（Python 側）で validate_python_syntax ツールを処理する際の実装例。
 * この関数自体は TypeScript の型定義のみで、実際の実行は各アプリが行う。
 *
 * ```python
 * # Python 側の実装例（InsightPy / InsightBot 共通）
 * import ast
 * import json
 *
 * def validate_python_syntax(code: str) -> dict:
 *     """AI ツールコール validate_python_syntax のハンドラ"""
 *     try:
 *         ast.parse(code)
 *         return {"valid": True}
 *     except SyntaxError as e:
 *         return {
 *             "valid": False,
 *             "error": str(e.msg),
 *             "line": e.lineno,
 *             "offset": e.offset,
 *         }
 * ```
 *
 * ```csharp
 * // C# (InsightBot WPF) 側の実装例
 * // Python を子プロセスで呼び出して構文チェック
 * public static async Task<ValidationResult> ValidatePythonSyntax(string code)
 * {
 *     var script = $"import ast, json, sys; " +
 *         $"code = sys.stdin.read(); " +
 *         $"try:\n  ast.parse(code)\n  print(json.dumps({{'valid': True}}))" +
 *         $"\nexcept SyntaxError as e:\n  print(json.dumps({{'valid': False, 'error': e.msg, 'line': e.lineno, 'offset': e.offset}}))";
 *     // ProcessHelper.RunPython(script, stdin: code) ...
 * }
 * ```
 */
export type ValidatePythonSyntaxResult =
  | { valid: true }
  | { valid: false; error: string; line: number | null; offset: number | null };

/** lint_python_code の結果型 */
export interface PythonLintDiagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/** run_python_code の結果型 */
export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
}

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
export const AI_ALLOWED_PLANS: PlanCode[] = ['TRIAL', 'STD', 'PRO', 'ENT'];

/**
 * AI アシスタントが利用可能かチェック
 */
export function canUseAiAssistant(plan: PlanCode): boolean {
  return AI_ALLOWED_PLANS.includes(plan);
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

/** AI エディター機能のフィーチャーキー */
export const AI_EDITOR_FEATURE_KEY = 'ai_editor';

/** AI エディターが利用可能なプラン */
export const AI_EDITOR_ALLOWED_PLANS: PlanCode[] = ['TRIAL', 'STD', 'PRO', 'ENT'];

/** AI エディターが利用可能かチェック */
export function canUseAiEditor(plan: PlanCode): boolean {
  return AI_EDITOR_ALLOWED_PLANS.includes(plan);
}

/** コードエディター対応製品かチェック */
export function isCodeEditorProduct(product: ProductCode): boolean {
  return getAiContextType(product) === 'code';
}

/**
 * 製品に応じたツール定義を取得
 *
 * @example
 * ```typescript
 * const tools = getToolsForProduct('INPY');
 * // → CODE_EDITOR_TOOLS（Python コードエディター用）
 *
 * const tools = getToolsForProduct('IOSH');
 * // → SPREADSHEET_TOOLS（スプレッドシート用）
 * ```
 */
export function getToolsForProduct(product: ProductCode): ToolDefinition[] {
  const contextType = getAiContextType(product);
  switch (contextType) {
    case 'code':
      return CODE_EDITOR_TOOLS;
    case 'spreadsheet':
      return SPREADSHEET_TOOLS;
    default:
      return [];
  }
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
  CODE_EDITOR_TOOLS,
  getToolsForProduct,

  // ライセンス — AI アシスタント
  AI_FEATURE_KEY,
  AI_ALLOWED_PLANS,
  canUseAiAssistant,

  // ライセンス — AI エディター
  AI_EDITOR_FEATURE_KEY,
  AI_EDITOR_ALLOWED_PLANS,
  canUseAiEditor,
  isCodeEditorProduct,
};
