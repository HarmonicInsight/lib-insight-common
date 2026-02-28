/**
 * AI アシスタント 共通設定
 *
 * Insight Business Suite 系アプリ（INSS/IOSH/IOSD/INPY/INBT）で共有する
 * AI アシスタントのプロンプト・ツール定義・モデル選択・型定義
 *
 * 【設計方針】
 * - ペルソナ（3キャラクター）は内部用。UIには公開しない。
 * - モデル選択は MODEL_REGISTRY で一元管理。
 *   - ティア（Standard/Premium）でデフォルトモデルが決まる。
 *   - ユーザーはティア内で利用可能なモデルを選択できる。
 *   - 新モデル追加時はレジストリに1エントリ追加するだけ。
 * - Standard ティア: Sonnet 系（デフォルト: 最新 Sonnet）
 * - Premium ティア: Opus 系（デフォルト: 最新 Opus）
 * - 設定画面でモデル選択 UI を表示し、ユーザーが変更可能。
 *
 * 詳細仕様: standards/AI_ASSISTANT.md
 */

import type { ProductCode, PlanCode } from './products';
import {
  AI_QUOTA_BY_PLAN,
  type AiModelTier,
  type CreditBalance,
  getAllowedModels,
  isModelAllowedForTier,
} from './usage-based-licensing';
import {
  type SkillDefinition,
  detectActiveSkills,
  buildSkillPromptExtension,
  getAvailableSkills,
  getAvailableCommands,
  getCommandsForProduct,
} from './ai-assistant-skills';
import {
  type HotCache,
  formatMemoryForPrompt,
  isMemoryEnabled,
  isDeepStorageEnabled,
  MEMORY_LIMITS_BY_PLAN,
} from './ai-memory';
import {
  type ResolvedDocumentCache,
  createEmptyResolvedCache,
} from './document-cache';

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
  language: 'ja' | 'en';
  chatPanelWidth: number;
  /** ユーザーが選択したモデル（ティアごと） */
  userModelPreference?: UserModelPreference;
}

/** デフォルト設定値 */
export const DEFAULT_AI_SETTINGS: AiAssistantSettings = {
  claudeApiKey: '',
  language: 'ja',
  chatPanelWidth: 400,
};

// =============================================================================
// モデルレジストリ（全利用可能モデルの単一ソース）
// =============================================================================

/**
 * モデルのステータス
 *
 * - active: 現在利用可能（UI に表示）
 * - deprecated: 非推奨（既存ユーザーは引き続き利用可能、新規選択不可）
 * - preview: プレビュー（ENT のみ利用可能）
 */
export type ModelStatus = 'active' | 'deprecated' | 'preview';

/**
 * モデルファミリー
 *
 * Anthropic のモデルラインナップに対応。
 * 新しいファミリーが追加された場合はここに追記。
 */
export type ModelFamily = 'haiku' | 'sonnet' | 'opus';

/**
 * モデルレジストリエントリ
 *
 * 新モデルのリリース時にこのレジストリに1エントリ追加するだけで
 * 全製品のモデル選択UIに反映される。
 */
export interface ModelDefinition {
  /** モデル ID（API に渡す値） */
  id: string;
  /** モデルファミリー */
  family: ModelFamily;
  /** 表示名（例: "Sonnet 4"） */
  displayName: string;
  /** バージョン表示名（例: "4", "4.5", "4.6"） */
  version: string;
  /** リリース日（ISO 8601） */
  releaseDate: string;
  /** 利用に必要な最低ティア */
  minimumTier: AiModelTier;
  /** 入力コスト（USD / 1M tokens） */
  inputPer1M: number;
  /** 出力コスト（USD / 1M tokens） */
  outputPer1M: number;
  /** 最大コンテキストトークン数 */
  maxContextTokens: number;
  /** 表示アイコン */
  icon: string;
  /** モデルの状態 */
  status: ModelStatus;
  /** このモデルが属するティアのデフォルトか */
  isDefaultForTier?: AiModelTier;
  /** 説明（日本語） */
  descriptionJa: string;
  /** 説明（英語） */
  descriptionEn: string;
}

/**
 * モデルレジストリ
 *
 * 【新モデル追加手順】
 * 1. このレジストリに新エントリを追加
 * 2. isDefaultForTier を設定して旧デフォルトの isDefaultForTier を削除
 * 3. MODEL_PRICING は自動的にこのレジストリから生成される
 * 4. 各製品アプリの再ビルドで反映（コード変更不要）
 *
 * 【モデル非推奨化手順】
 * 1. status を 'deprecated' に変更
 * 2. isDefaultForTier を削除
 * 3. 新しいデフォルトモデルに isDefaultForTier を設定
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // --- Haiku ---
  {
    id: 'claude-3-5-haiku-20241022',
    family: 'haiku',
    displayName: 'Haiku 3.5',
    version: '3.5',
    releaseDate: '2024-10-22',
    minimumTier: 'standard',
    inputPer1M: 0.25,
    outputPer1M: 1.25,
    maxContextTokens: 200_000,
    icon: '⚡',
    status: 'active',
    descriptionJa: '高速・低コスト。軽い確認やちょっとした修正に最適',
    descriptionEn: 'Fast and affordable. Best for quick checks and light edits.',
  },
  // --- Sonnet ---
  {
    id: 'claude-sonnet-4-20250514',
    family: 'sonnet',
    displayName: 'Sonnet 4',
    version: '4',
    releaseDate: '2025-05-14',
    minimumTier: 'standard',
    inputPer1M: 3,
    outputPer1M: 15,
    maxContextTokens: 200_000,
    icon: '⭐',
    status: 'active',
    isDefaultForTier: 'standard',
    descriptionJa: '万能バランス型。編集・要約・翻訳に最適',
    descriptionEn: 'Versatile and balanced. Great for editing, summaries, and translations.',
  },
  // --- Opus ---
  {
    id: 'claude-opus-4-20250514',
    family: 'opus',
    displayName: 'Opus 4',
    version: '4',
    releaseDate: '2025-05-14',
    minimumTier: 'premium',
    inputPer1M: 15,
    outputPer1M: 75,
    maxContextTokens: 200_000,
    icon: '💎',
    status: 'active',
    isDefaultForTier: 'premium',
    descriptionJa: '最高性能。レポート・精密文書・深い分析に最適',
    descriptionEn: 'Most capable. Best for reports, precision documents, and deep analysis.',
  },
];

/**
 * ユーザーのモデル選択設定
 *
 * ユーザーが自分のティア内で利用可能なモデルを選択できる。
 * 未設定の場合はティアのデフォルトモデルが使用される。
 */
export interface UserModelPreference {
  /** Standard ティアで使用するモデル ID */
  standardTierModel?: string;
  /** Premium ティアで使用するモデル ID */
  premiumTierModel?: string;
}

// --- レジストリアクセス関数 ---

/** レジストリからモデルを ID で取得 */
export function getModelFromRegistry(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find(m => m.id === modelId);
}

/**
 * ティアで利用可能なモデル一覧を取得
 *
 * ユーザーのモデル選択 UI で表示するリスト。
 * active なモデルのみ返す（deprecated / preview は含まない）。
 * preview は includePreview: true で含められる（ENT 向け）。
 */
export function getAvailableModelsForTier(
  tier: AiModelTier,
  options?: { includePreview?: boolean; includeDeprecated?: boolean },
): ModelDefinition[] {
  return MODEL_REGISTRY.filter(m => {
    // ティアチェック
    if (tier === 'standard' && m.minimumTier === 'premium') return false;

    // ステータスチェック
    if (m.status === 'deprecated' && !options?.includeDeprecated) return false;
    if (m.status === 'preview' && !options?.includePreview) return false;

    return true;
  });
}

/**
 * ティアのデフォルトモデル ID を取得
 *
 * レジストリの isDefaultForTier から自動解決。
 * デフォルトが見つからない場合はファミリー内の最新 active モデルにフォールバック。
 */
export function getDefaultModelForTier(tier: AiModelTier): string {
  // 1. 明示的にデフォルト指定されたモデルを探す
  const explicit = MODEL_REGISTRY.find(
    m => m.isDefaultForTier === tier && m.status === 'active',
  );
  if (explicit) return explicit.id;

  // 2. フォールバック: ティアで利用可能な最新の active モデル
  const available = getAvailableModelsForTier(tier);
  if (available.length === 0) {
    // 最終フォールバック
    return tier === 'premium' ? 'claude-opus-4-20250514' : 'claude-sonnet-4-20250514';
  }

  // リリース日が最新のものを返す
  return available.sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  )[0].id;
}

/**
 * ユーザー選択を考慮してモデルを解決
 *
 * 1. ユーザーが明示的に選択 → そのモデル（ティアチェック済みなら採用）
 * 2. 未選択 / 選択モデルが無効 → ティアのデフォルト
 *
 * @param tier - 有効なモデルティア（calculateCreditBalance で算出）
 * @param userPreference - ユーザーの設定（ローカルストレージから取得）
 * @returns 使用するモデル ID
 */
export function resolveModel(
  tier: AiModelTier,
  userPreference?: UserModelPreference,
): string {
  if (userPreference) {
    const preferredId = tier === 'premium'
      ? userPreference.premiumTierModel
      : userPreference.standardTierModel;

    if (preferredId) {
      const model = getModelFromRegistry(preferredId);
      // モデルが存在し、ティアで利用可能で、deprecated でないこと
      if (model && model.status !== 'deprecated') {
        if (tier === 'premium' || model.minimumTier === 'standard') {
          return model.id;
        }
      }
    }
  }

  return getDefaultModelForTier(tier);
}

/**
 * モデル選択 UI 用のラベルを生成
 *
 * @example
 * ```typescript
 * getModelSelectionLabel('claude-sonnet-4-20250514', 'ja');
 * // → "⭐ Sonnet 4（デフォルト）"
 *
 * getModelSelectionLabel('claude-3-5-haiku-20241022', 'ja');
 * // → "⚡ Haiku 3.5"
 * ```
 */
export function getModelSelectionLabel(
  modelId: string,
  locale: 'ja' | 'en' = 'ja',
  isDefault: boolean = false,
): string {
  const model = getModelFromRegistry(modelId);
  if (!model) return modelId;

  const defaultSuffix = isDefault
    ? (locale === 'ja' ? '（デフォルト）' : ' (Default)')
    : '';
  return `${model.icon} ${model.displayName}${defaultSuffix}`;
}

/**
 * ユーザーのモデル選択が有効かバリデーション
 *
 * 設定画面でユーザーがモデルを選択した際に呼び出す。
 * ティアに対して選択可能なモデルかチェックする。
 */
export function validateModelSelection(
  modelId: string,
  tier: AiModelTier,
): { valid: boolean; reason?: string; reasonJa?: string } {
  const model = getModelFromRegistry(modelId);
  if (!model) {
    return {
      valid: false,
      reason: `Model "${modelId}" not found in registry`,
      reasonJa: `モデル "${modelId}" はレジストリに存在しません`,
    };
  }

  if (model.status === 'deprecated') {
    return {
      valid: false,
      reason: `Model "${model.displayName}" is deprecated`,
      reasonJa: `モデル "${model.displayName}" は非推奨です`,
    };
  }

  if (model.status === 'preview' && tier !== 'premium') {
    return {
      valid: false,
      reason: `Preview model "${model.displayName}" requires Premium tier`,
      reasonJa: `プレビューモデル "${model.displayName}" は Premium ティアが必要です`,
    };
  }

  if (tier === 'standard' && model.minimumTier === 'premium') {
    return {
      valid: false,
      reason: `Model "${model.displayName}" requires Premium tier`,
      reasonJa: `モデル "${model.displayName}" は Premium ティアが必要です`,
    };
  }

  return { valid: true };
}

// =============================================================================
// 内部ペルソナ定義（タスクコンテキスト推奨の内部実装用）
// =============================================================================

/** AI ペルソナ定義（内部用 — UIには公開しない） */
export interface AiPersona {
  id: string;
  nameJa: string;
  nameEn: string;
  model: string;
  themeColor: string;
  descriptionJa: string;
  descriptionEn: string;
  icon32: string;
  icon48: string;
}

/**
 * 内部ペルソナマッピング
 *
 * タスクコンテキスト推奨エンジンが最適モデルを決定する際に使用。
 * ユーザーにはペルソナ名・モデル名は表示しない。
 * モデル ID はレジストリのデフォルトから自動解決。
 */
const AI_PERSONAS: AiPersona[] = [
  {
    id: 'shunsuke',
    nameJa: 'Claude 俊',
    nameEn: 'Claude Shun',
    model: MODEL_REGISTRY.find(m => m.family === 'haiku' && m.status === 'active')?.id ?? 'claude-3-5-haiku-20241022',
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
    model: getDefaultModelForTier('standard'),
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
    model: getDefaultModelForTier('premium'),
    themeColor: '#8C64C8',
    descriptionJa: '深い思考力。レポート・ドキュメント評価・精密な文書に最適',
    descriptionEn: 'Deep thinker. Best for reports, document evaluation, and documents requiring precision.',
    icon32: 'Assets/Personas/manabu_32.png',
    icon48: 'Assets/Personas/manabu_48.png',
  },
];

/** ペルソナを ID で取得（内部用） */
function getPersona(id: string): AiPersona | undefined {
  return AI_PERSONAS.find(p => p.id === id);
}

// =============================================================================
// モデル選択（ティアベース + ユーザー選択 — 公開API）
// =============================================================================

/**
 * ティアに応じた使用モデルを決定
 *
 * ユーザーが明示的にモデルを選択していない場合は、ティアのデフォルトを返す。
 * ユーザーが選択している場合は resolveModel() を使用すること。
 *
 * @deprecated resolveModel() を使用してください（ユーザー選択対応版）
 */
export function getModelForTier(tier: AiModelTier): string {
  return getDefaultModelForTier(tier);
}

/**
 * ティアの表示名を取得
 *
 * ユーザーが明示的にモデルを選択している場合は、そのモデル名を含む。
 */
export function getModelTierLabel(
  tier: AiModelTier,
  locale: 'ja' | 'en' = 'ja',
  userPreference?: UserModelPreference,
): string {
  const resolvedModelId = resolveModel(tier, userPreference);
  const model = getModelFromRegistry(resolvedModelId);
  const defaultId = getDefaultModelForTier(tier);
  const isCustom = resolvedModelId !== defaultId;

  if (tier === 'premium') {
    const base = locale === 'ja' ? 'プレミアム' : 'Premium';
    const modelName = model?.displayName ?? 'Opus';
    return isCustom
      ? `${base}（${modelName}）`
      : (locale === 'ja' ? `プレミアム（${modelName}）` : `Premium (${modelName})`);
  }

  const base = locale === 'ja' ? 'スタンダード' : 'Standard';
  const modelName = model?.displayName ?? 'Sonnet';
  return isCustom
    ? `${base}（${modelName}）`
    : (locale === 'ja' ? `スタンダード（${modelName}）` : `Standard (${modelName})`);
}

// =============================================================================
// API 設定
// =============================================================================

/** Claude API 設定 */
export const CLAUDE_API_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  version: '2023-06-01',
  defaultModel: getDefaultModelForTier('standard'),
  maxTokens: 4096,
  httpTimeoutMs: 90_000,
  cancellationTimeoutMs: 120_000,
} as const;

/**
 * モデル別コスト（USD per 1M tokens）
 *
 * MODEL_REGISTRY から自動生成。レジストリにモデルを追加すれば自動反映。
 */
export const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> =
  Object.fromEntries(
    MODEL_REGISTRY.map(m => [m.id, { inputPer1M: m.inputPer1M, outputPer1M: m.outputPer1M }]),
  );

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
    ISOF: 'spreadsheet',
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
        return `You are an AI assistant for Insight Performance Management, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.

【経理・財務スキル（Finance）】
経理・財務関連の質問を受けた場合、以下の専門知識で対応:

1. 仕訳準備 — AP 未払計上、固定資産減価償却、前払費用償却、給与計上、収益認識（ASC 606）
   - 承認マトリクス: 定常仕訳=経理MGR / 25万超=経理部長 / 100万超=CFO
   - 各仕訳に必要: 説明、計算根拠、証憑、対象期間、承認証跡、逆仕訳要否

2. 差異分析 — 予実比較、前年比較、前月比較
   - Price/Volume 分解: Volume Effect = (実績数量-予算数量)×予算単価 / Price Effect = (実績単価-予算単価)×実績数量
   - マテリアリティ閾値: 予実5-10% / YoY 10-15% / MoM 15-20%
   - ナラティブ: ドライバー名、金額、因果関係、継続見込み、推奨アクション

3. 勘定照合 — GL-補助元帳照合、銀行照合、会社間照合
4. 月次クローズ管理 — Day 1-10 の標準チェックリスト

【データ分析スキル（Data）】
- 自然言語 → Excel 数式 / SQL クエリ変換
- 統計分析、集計、データプロファイリング`;

      case 'document':
        return `あなたはInsight AI BriefcaseのAIアシスタントです。Wordドキュメントの操作・自動化を支援します。
ユーザーのメッセージと同じ言語で回答してください。

主な機能：
- 文章の校正・誤字脱字の修正
- 文書の要約・構成提案
- フォーマット変換のアドバイス
- テンプレート活用の提案
- 契約書レビュー・NDA 審査（Legal スキル）
- ビジネスコンテンツ作成（Marketing スキル）

【契約書レビュー】
契約書関連の質問を受けた場合、以下のプロセスで対応:
1. 契約タイプの特定（SaaS / 業務委託 / ライセンス / NDA 等）
2. 当事者の立場確認（ベンダー / 顧客）
3. 6 大条項の分析: 責任制限 / 補償 / IP / データ保護 / 解約 / 準拠法
4. 重大度分類: GREEN（許容）/ YELLOW（交渉要）/ RED（エスカレーション）
5. レッドライン生成（代替文言 + 根拠 + 優先度 + フォールバック案）

※ 法的助言ではなくワークフロー支援です。最終判断は法務専門家が行います。

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
      return `You are an AI assistant for Insight Performance Management, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.

[Finance Skills]
For accounting and finance queries:

1. Journal Entry Prep — AP accruals, depreciation, prepaid amortization, payroll, revenue recognition (ASC 606)
   - Approval matrix: routine=Accounting MGR / >¥250K=Accounting Director / >¥1M=CFO
   - Each entry requires: description, calculation basis, supporting docs, period, approval trail, reversal flag

2. Variance Analysis — budget vs actual, YoY, MoM
   - Price/Volume decomposition: Volume Effect = (Actual Qty - Budget Qty) × Budget Price / Price Effect = (Actual Price - Budget Price) × Actual Qty
   - Materiality thresholds: BvA 5-10% / YoY 10-15% / MoM 15-20%
   - Narrative: driver name, amounts, causality, continuation outlook, recommended actions

3. Reconciliation — GL-to-subledger, bank, intercompany
4. Month-End Close Management — Day 1-10 standard checklist

[Data Analysis Skills]
- Natural language → Excel formula / SQL query generation
- Statistical analysis, aggregation, data profiling`;

    case 'document':
      return `You are an AI assistant for Insight AI Briefcase, a Word document operations and automation tool.
Respond in the same language as the user's message.

Key capabilities:
- Proofreading and error correction
- Document summarization and structure suggestions
- Format conversion advice
- Template usage recommendations
- Contract review and NDA triage (Legal skill)
- Business content creation (Marketing skill)

[Contract Review]
When handling contract-related queries, follow this process:
1. Identify contract type (SaaS / services / license / NDA, etc.)
2. Determine party's position (vendor / customer)
3. Analyze 6 key clauses: Limitation of Liability / Indemnification / IP / Data Protection / Termination / Governing Law
4. Classify severity: GREEN (acceptable) / YELLOW (negotiate) / RED (escalate)
5. Generate redlines (alternative language + rationale + priority + fallback)

Note: This is workflow assistance, not legal advice. All analysis should be reviewed by qualified legal professionals.

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
 * Insight Performance Management 用のスプレッドシートツール定義
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
// タスクコンテキスト別モデル推奨
// =============================================================================

/**
 * AI タスクのコンテキスト分類
 *
 * ユーザーのリクエスト内容に応じて、最適なペルソナ（モデル）を推奨する。
 * アプリは自動選択 or ユーザーへの推奨表示に利用可能。
 */
export type TaskContext =
  | 'simple_chat'         // 軽い質問・コマンド確認・ヘルプ
  | 'cell_edit'           // セルの編集・数式入力・書式設定
  | 'data_analysis'       // 統計・集計・データ分析
  | 'sheet_compare'       // シート単位の比較（file_compare）
  | 'full_document_compare' // 全シート横断の比較分析
  | 'code_generation'     // Pythonコード生成・修正（INPY/INBT）
  | 'document_review'     // 文書校正・レビュー（INSS/IOSD）
  | 'report_generation'   // レポート・精密文書の生成
  | 'document_evaluation' // ドキュメント多角的評価（INSS/IOSH/IOSD — Opus 推奨）
  // --- Anthropic Plugins 統合タスクコンテキスト ---
  | 'contract_review'     // 契約書レビュー・NDA 審査（Legal プラグイン参考 — IOSD）
  | 'finance_analysis'    // 仕訳準備・差異分析・勘定照合（Finance プラグイン参考 — IOSH）
  | 'content_creation';   // コンテンツ作成（Marketing プラグイン参考 — IOSD/INSS）

/** タスクコンテキスト → 推奨ペルソナのマッピング */
const TASK_PERSONA_MAP: Record<TaskContext, {
  recommended: string;
  minimum: string;
  reasonJa: string;
  reasonEn: string;
}> = {
  simple_chat: {
    recommended: 'shunsuke',
    minimum: 'shunsuke',
    reasonJa: '軽い質問やコマンド確認には俊（Haiku）で十分です',
    reasonEn: 'Shun (Haiku) is sufficient for quick questions and command lookups',
  },
  cell_edit: {
    recommended: 'shunsuke',
    minimum: 'shunsuke',
    reasonJa: 'セルの編集・数式入力には俊（Haiku）で対応できます',
    reasonEn: 'Shun (Haiku) can handle cell editing and formula input',
  },
  data_analysis: {
    recommended: 'megumi',
    minimum: 'shunsuke',
    reasonJa: 'データ分析には恵（Sonnet）がおすすめです',
    reasonEn: 'Megumi (Sonnet) is recommended for data analysis',
  },
  sheet_compare: {
    recommended: 'megumi',
    minimum: 'megumi',
    reasonJa: 'シート比較には恵（Sonnet）以上が必要です。多数のセル差分を正確に処理します',
    reasonEn: 'Sheet comparison requires Megumi (Sonnet) or above for accurate cell diff processing',
  },
  full_document_compare: {
    recommended: 'manabu',
    minimum: 'megumi',
    reasonJa: '全シート横断の比較分析には学（Opus）がおすすめです。大量データの俯瞰的分析が得意です',
    reasonEn: 'Manabu (Opus) is recommended for full document comparison with cross-sheet analysis',
  },
  code_generation: {
    recommended: 'megumi',
    minimum: 'shunsuke',
    reasonJa: 'コード生成には恵（Sonnet）がおすすめです',
    reasonEn: 'Megumi (Sonnet) is recommended for code generation',
  },
  document_review: {
    recommended: 'megumi',
    minimum: 'shunsuke',
    reasonJa: '文書校正には恵（Sonnet）がおすすめです',
    reasonEn: 'Megumi (Sonnet) is recommended for document review',
  },
  report_generation: {
    recommended: 'manabu',
    minimum: 'megumi',
    reasonJa: 'レポート・精密文書には学（Opus）がおすすめです。深い分析と正確な文章生成が得意です',
    reasonEn: 'Manabu (Opus) is recommended for reports requiring deep analysis and precise writing',
  },
  document_evaluation: {
    recommended: 'manabu',
    minimum: 'megumi',
    reasonJa: 'ドキュメント評価には学（Opus 4.6）がおすすめです。拡張コンテキストで文書全体を俯瞰的に分析します',
    reasonEn: 'Manabu (Opus 4.6) is recommended for document evaluation — extended context enables holistic document analysis',
  },
  // --- Anthropic Plugins 統合タスクコンテキスト ---
  contract_review: {
    recommended: 'manabu',
    minimum: 'megumi',
    reasonJa: '契約書レビューには学（Opus）がおすすめです。条項の相互作用を精密に分析し、リスクを見逃しません',
    reasonEn: 'Manabu (Opus) is recommended for contract review — precisely analyzes clause interactions and avoids missing risks',
  },
  finance_analysis: {
    recommended: 'megumi',
    minimum: 'megumi',
    reasonJa: '経理・財務分析には恵（Sonnet）以上が必要です。正確な計算と構造化された分析を提供します',
    reasonEn: 'Megumi (Sonnet) or above is required for finance analysis — provides accurate calculations and structured analysis',
  },
  content_creation: {
    recommended: 'megumi',
    minimum: 'shunsuke',
    reasonJa: 'コンテンツ作成には恵（Sonnet）がおすすめです',
    reasonEn: 'Megumi (Sonnet) is recommended for content creation',
  },
};

/** モデルの性能ランク（推奨チェック用） */
const MODEL_RANK: Record<string, number> = {
  shunsuke: 1,  // Haiku
  megumi: 2,    // Sonnet
  manabu: 3,    // Opus
};

/**
 * タスクコンテキストに応じた推奨ペルソナを取得
 *
 * @example
 * ```typescript
 * const rec = getRecommendedPersona('sheet_compare');
 * // { persona: AiPersona, reason: '...' }
 * ```
 */
export function getRecommendedPersona(
  context: TaskContext,
  locale: 'ja' | 'en' = 'ja'
): { persona: AiPersona; reason: string } {
  const mapping = TASK_PERSONA_MAP[context];
  const persona = getPersona(mapping.recommended)!;
  return {
    persona,
    reason: locale === 'ja' ? mapping.reasonJa : mapping.reasonEn,
  };
}

/**
 * 現在選択中のペルソナがタスクに十分かチェック
 *
 * 不十分な場合、推奨ペルソナとメッセージを返す。
 * アプリ側で「この分析にはClaude恵（Sonnet）以上をお勧めします」のような
 * ガイダンスを表示するために使用。
 *
 * @example
 * ```typescript
 * const check = checkPersonaForTask('shunsuke', 'full_document_compare', 'ja');
 * if (!check.sufficient) {
 *   showGuidance(check.message); // 「全シート横断の比較分析には学（Opus）がおすすめです」
 * }
 * ```
 */
export function checkPersonaForTask(
  currentPersonaId: string,
  context: TaskContext,
  locale: 'ja' | 'en' = 'ja'
): {
  sufficient: boolean;
  message?: string;
  recommendedPersona?: AiPersona;
} {
  const mapping = TASK_PERSONA_MAP[context];
  const currentRank = MODEL_RANK[currentPersonaId] ?? 0;
  const minimumRank = MODEL_RANK[mapping.minimum] ?? 0;

  if (currentRank >= minimumRank) {
    return { sufficient: true };
  }

  const recommended = getPersona(mapping.recommended)!;
  const minimum = getPersona(mapping.minimum)!;

  const message = locale === 'ja'
    ? `このタスクには${minimum.nameJa}（${minimum.model.includes('haiku') ? 'Haiku' : minimum.model.includes('sonnet') ? 'Sonnet' : 'Opus'}）以上をお勧めします`
    : `We recommend ${minimum.nameEn} or above for this task`;

  return {
    sufficient: false,
    message,
    recommendedPersona: recommended,
  };
}

/**
 * タスクコンテキストを自動判定するヒント
 *
 * アプリが UI 操作やユーザーメッセージからコンテキストを推定するための
 * キーワードマッピング。完全な判定はアプリ側で行う。
 */
export const TASK_CONTEXT_HINTS: Record<TaskContext, {
  keywordsJa: string[];
  keywordsEn: string[];
  toolNames: string[];
}> = {
  simple_chat: {
    keywordsJa: ['教えて', 'とは', 'ヘルプ', '使い方', 'どうやって'],
    keywordsEn: ['help', 'how to', 'what is', 'explain'],
    toolNames: [],
  },
  cell_edit: {
    keywordsJa: ['入力', 'セル', '書式', 'フォント', '色'],
    keywordsEn: ['cell', 'format', 'font', 'color', 'enter'],
    toolNames: ['set_cell_values', 'set_cell_formulas', 'set_cell_styles'],
  },
  data_analysis: {
    keywordsJa: ['分析', '集計', '統計', '合計', '平均', 'グラフ'],
    keywordsEn: ['analyze', 'statistics', 'sum', 'average', 'chart', 'aggregate'],
    toolNames: ['analyze_data', 'get_cell_range'],
  },
  sheet_compare: {
    keywordsJa: ['比較', '差分', '違い', '変更点'],
    keywordsEn: ['compare', 'diff', 'difference', 'changes'],
    toolNames: ['get_compare_diff', 'get_compare_cell_range'],
  },
  full_document_compare: {
    keywordsJa: ['全体比較', '全シート', 'サマリー', '概要', '全体的'],
    keywordsEn: ['full compare', 'all sheets', 'summary', 'overview', 'overall'],
    toolNames: ['get_compare_summary', 'get_compare_files'],
  },
  code_generation: {
    keywordsJa: ['コード', 'スクリプト', 'プログラム', '実装', '関数'],
    keywordsEn: ['code', 'script', 'program', 'implement', 'function'],
    toolNames: ['validate_python_syntax', 'run_python_code', 'replace_script_content'],
  },
  document_review: {
    keywordsJa: ['校正', 'チェック', 'レビュー', '修正', '誤字'],
    keywordsEn: ['proofread', 'check', 'review', 'correct', 'typo'],
    toolNames: [],
  },
  report_generation: {
    keywordsJa: ['レポート', '報告書', '資料作成', 'まとめ', '文書作成'],
    keywordsEn: ['report', 'document', 'create', 'generate', 'write up'],
    toolNames: [],
  },
  document_evaluation: {
    keywordsJa: ['評価', '採点', 'スコア', 'グレード', '品質チェック', 'ドキュメント評価', '文書評価'],
    keywordsEn: ['evaluate', 'evaluation', 'score', 'grade', 'quality check', 'assess', 'assessment'],
    toolNames: [],
  },
  // --- Anthropic Plugins 統合タスクコンテキスト ---
  contract_review: {
    keywordsJa: ['契約', '契約書', 'NDA', '秘密保持', '責任制限', '補償', 'レッドライン', '条項', '準拠法', 'リーガル'],
    keywordsEn: ['contract', 'NDA', 'non-disclosure', 'liability', 'indemnif', 'redline', 'clause', 'governing law', 'legal review'],
    toolNames: [],
  },
  finance_analysis: {
    keywordsJa: ['仕訳', '計上', '減価償却', '予実', '差異分析', '照合', '月次クローズ', '決算', '勘定', '試算表', '貸借', '損益'],
    keywordsEn: ['journal entry', 'accrual', 'depreciation', 'variance', 'reconcil', 'close', 'ledger', 'trial balance', 'P&L', 'balance sheet'],
    toolNames: ['get_cell_range', 'set_cell_values', 'set_cell_formulas', 'analyze_data'],
  },
  content_creation: {
    keywordsJa: ['ブログ', 'プレスリリース', 'ケーススタディ', 'ランディングページ', 'メルマガ', 'SEO', '記事作成', 'コンテンツ'],
    keywordsEn: ['blog', 'press release', 'case study', 'landing page', 'newsletter', 'SEO', 'content', 'article'],
    toolNames: [],
  },
};

// =============================================================================
// 製品別タスクコンテキスト対応表
// =============================================================================

/**
 * 製品ごとに利用可能なタスクコンテキストの一覧
 *
 * アプリは起動時にこのマッピングを取得し、ユーザーのメッセージを
 * TASK_CONTEXT_HINTS と照合してコンテキストを推定する。
 */
const PRODUCT_TASK_CONTEXTS: Partial<Record<ProductCode, TaskContext[]>> = {
  // Insight Performance Management: スプレッドシート系 + 比較 + レポート + ドキュメント評価 + Finance
  IOSH: [
    'simple_chat',
    'cell_edit',
    'data_analysis',
    'sheet_compare',
    'full_document_compare',
    'document_evaluation',
    'report_generation',
    'finance_analysis',      // Finance プラグイン統合
  ],
  // InsightSeniorOffice: シニア向け（簡易チャット + セル編集のみ、複雑な機能は不要）
  ISOF: [
    'simple_chat',
    'cell_edit',
    'document_review',
  ],
  // Insight Deck Quality Gate: 文書校正 + ドキュメント評価 + レポート + コンテンツ作成
  INSS: [
    'simple_chat',
    'document_review',
    'document_evaluation',
    'report_generation',
    'content_creation',      // Marketing プラグイン統合
  ],
  // Insight AI Briefcase: 文書校正 + ドキュメント評価 + レポート + 契約書レビュー + コンテンツ作成
  IOSD: [
    'simple_chat',
    'document_review',
    'document_evaluation',
    'report_generation',
    'contract_review',       // Legal プラグイン統合
    'content_creation',      // Marketing プラグイン統合
  ],
  // InsightPy: コード生成 + データ分析
  INPY: [
    'simple_chat',
    'code_generation',
    'data_analysis',
    'report_generation',
  ],
  // InsightBot: コード生成
  INBT: [
    'simple_chat',
    'code_generation',
    'report_generation',
  ],
};

/**
 * 製品で利用可能なタスクコンテキスト一覧を取得
 *
 * @example
 * ```typescript
 * getTaskContextsForProduct('IOSH');
 * // ['simple_chat', 'cell_edit', 'data_analysis', 'sheet_compare', 'full_document_compare', 'report_generation']
 * ```
 */
export function getTaskContextsForProduct(product: ProductCode): TaskContext[] {
  return PRODUCT_TASK_CONTEXTS[product] ?? ['simple_chat'];
}

/**
 * ユーザーメッセージからタスクコンテキストを推定
 *
 * 製品で利用可能なコンテキストに絞り、キーワードマッチで判定する。
 * マッチしない場合は 'simple_chat' を返す。
 *
 * @example
 * ```typescript
 * // Insight Performance Management で「2つのファイルの違いを全体的にまとめて」
 * inferTaskContext('IOSH', '2つのファイルの違いを全体的にまとめて', 'ja');
 * // 'full_document_compare'
 *
 * // Insight Deck Quality Gate で「誤字をチェックして」
 * inferTaskContext('INSS', '誤字をチェックして', 'ja');
 * // 'document_review'
 * ```
 */
export function inferTaskContext(
  product: ProductCode,
  userMessage: string,
  locale: 'ja' | 'en' = 'ja',
): TaskContext {
  const availableContexts = getTaskContextsForProduct(product);
  const messageLower = userMessage.toLowerCase();

  // 優先度: 特殊コンテキスト → 汎用コンテキスト（simple_chat は最後）
  // full_document_compare を sheet_compare より先に判定（キーワードが包含関係にある）
  // document_evaluation を document_review より先に判定（「評価」は「レビュー」より特殊）
  const priorityOrder: TaskContext[] = [
    'full_document_compare',
    'sheet_compare',
    'contract_review',       // Legal: 契約書キーワードを最優先判定
    'finance_analysis',      // Finance: 経理キーワードを優先判定
    'document_evaluation',
    'report_generation',
    'content_creation',      // Marketing: コンテンツ作成
    'code_generation',
    'document_review',
    'data_analysis',
    'cell_edit',
    'simple_chat',
  ];

  for (const context of priorityOrder) {
    if (!availableContexts.includes(context)) continue;
    if (context === 'simple_chat') continue; // フォールバック用

    const hints = TASK_CONTEXT_HINTS[context];
    const keywords = locale === 'ja' ? hints.keywordsJa : hints.keywordsEn;

    for (const keyword of keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        return context;
      }
    }
  }

  return 'simple_chat';
}

/**
 * メッセージ送信前にペルソナ推奨チェックを実行し、
 * ガイダンスメッセージを返す統合ヘルパー
 *
 * アプリはこの関数を AI チャット送信前に呼び出し、
 * result.guidance がある場合にトースト or バナーで表示する。
 *
 * @example
 * ```typescript
 * // IOSH アプリでの使用例（C# から呼び出す想定の TypeScript 定義）
 * const result = getPersonaGuidance('IOSH', 'shunsuke', '2ファイルの全体的な違いをまとめて', 'ja');
 * // {
 * //   detectedContext: 'full_document_compare',
 * //   currentSufficient: false,
 * //   guidance: 'このタスクにはClaude 恵（Sonnet）以上をお勧めします',
 * //   recommendedPersona: { id: 'manabu', nameJa: 'Claude 学', ... },
 * // }
 *
 * if (result.guidance) {
 *   showToast(result.guidance);  // ユーザーにガイダンス表示
 * }
 * ```
 */
export function getPersonaGuidance(
  product: ProductCode,
  currentPersonaId: string,
  userMessage: string,
  locale: 'ja' | 'en' = 'ja',
): {
  detectedContext: TaskContext;
  currentSufficient: boolean;
  guidance?: string;
  recommendedPersona?: AiPersona;
} {
  const detectedContext = inferTaskContext(product, userMessage, locale);
  const check = checkPersonaForTask(currentPersonaId, detectedContext, locale);

  return {
    detectedContext,
    currentSufficient: check.sufficient,
    guidance: check.message,
    recommendedPersona: check.recommendedPersona,
  };
}

// =============================================================================
// メッセージ送信時のモデル自動解決
// =============================================================================

/**
 * メッセージ送信時に使用するペルソナ（モデル）を自動決定
 *
 * ユーザーのメッセージ内容からタスクコンテキストを推定し、
 * 最適なモデルを自動選択する。ユーザーにはモデル名を見せない。
 *
 * アプリはこの関数を Claude API 呼び出し前に必ず実行する。
 *
 * @example
 * ```typescript
 * const result = resolvePersonaForMessage({
 *   product: 'IOSH',
 *   userMessage: '2ファイルの全体的な違いをまとめて',
 *   locale: 'ja',
 * });
 * // {
 * //   persona: { id: 'manabu', model: 'claude-opus-4-20250514', ... },
 * //   detectedContext: 'full_document_compare',
 * // }
 *
 * // 軽い質問 → Haiku が自動選択される
 * const result2 = resolvePersonaForMessage({
 *   product: 'IOSH',
 *   userMessage: 'SUM関数の使い方は？',
 * });
 * // {
 * //   persona: { id: 'shunsuke', model: 'claude-3-5-haiku-20241022', ... },
 * //   detectedContext: 'simple_chat',
 * // }
 * ```
 */
export function resolvePersonaForMessage(params: {
  product: ProductCode;
  userMessage: string;
  locale?: 'ja' | 'en';
}): {
  persona: AiPersona;
  detectedContext: TaskContext;
} {
  const { product, userMessage, locale = 'ja' } = params;
  const detectedContext = inferTaskContext(product, userMessage, locale);
  const rec = getRecommendedPersona(detectedContext, locale);

  return {
    persona: rec.persona,
    detectedContext,
  };
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
 * AI アシスタントが利用可能かチェック（プランのみ）
 *
 * 注意: これはプランレベルのチェックのみ。
 * クレジット残量を含めた完全なチェックは usage-based-licensing.ts の
 * checkAiUsage() または ServerAiUsageManager.checkUsage() を使用。
 */
export function canUseAiAssistant(plan: PlanCode): boolean {
  return AI_ALLOWED_PLANS.includes(plan);
}

/**
 * AI アシスタントのクレジット上限を取得
 * @returns クレジット数（-1 = 無制限、0 = 利用不可）
 */
export function getAiAssistantCredits(plan: PlanCode): number {
  return AI_QUOTA_BY_PLAN[plan].baseCredits;
}

// =============================================================================
// AI エディター
// =============================================================================

/** AI エディター機能のフィーチャーキー */
export const AI_EDITOR_FEATURE_KEY = 'ai_editor';

/** AI エディターが利用可能なプラン */
export const AI_EDITOR_ALLOWED_PLANS: PlanCode[] = ['TRIAL', 'STD', 'PRO', 'ENT'];

/**
 * AI エディターが利用可能かチェック（プランのみ）
 *
 * 注意: ai_assistant と ai_editor は共通クレジットプールを共有。
 * クレジット残量チェックは checkAiUsage() を使用。
 */
export function canUseAiEditor(plan: PlanCode): boolean {
  return AI_EDITOR_ALLOWED_PLANS.includes(plan);
}

// =============================================================================
// クレジット表示ヘルパー
// =============================================================================

/**
 * AI アシスタントのクレジット状態メッセージを取得
 *
 * チャットUIの残量表示に使用するヘルパー。
 *
 * @example
 * ```typescript
 * const msg = getAiCreditLabel(credits, 'ja');
 * // → "AIアシスタント（Sonnet）— 残り 85回"
 * // → "AIアシスタント（Opus）— 残り 150回"
 * ```
 */
export function getAiCreditLabel(
  credits: CreditBalance | null,
  locale: 'ja' | 'en' = 'ja',
  userPreference?: UserModelPreference,
): string {
  const name = locale === 'ja' ? 'AIアシスタント' : 'AI Assistant';

  if (!credits || credits.totalRemaining === -1) {
    return locale === 'ja'
      ? `${name}（無制限）`
      : `${name} (Unlimited)`;
  }

  if (credits.totalRemaining <= 0) {
    return locale === 'ja'
      ? `${name}（クレジット不足）`
      : `${name} (No credits)`;
  }

  const tierLabel = getModelTierLabel(credits.effectiveModelTier, locale, userPreference);
  return locale === 'ja'
    ? `${name}（${tierLabel}）— 残り ${credits.totalRemaining}回`
    : `${name} (${tierLabel}) — ${credits.totalRemaining} credits left`;
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

// =============================================================================
// スキル + メモリ統合システムプロンプトビルダー
// =============================================================================

/**
 * スキルとメモリを統合した拡張システムプロンプトを構築
 *
 * Anthropic Knowledge Work Plugins のアーキテクチャを参考に、
 * ユーザーのメッセージ内容に応じてドメインスキルを自動有効化し、
 * メモリコンテキストを注入する。
 *
 * 各アプリは Claude API 呼び出し前にこの関数でシステムプロンプトを生成する。
 *
 * @example
 * ```typescript
 * // 基本的な使い方（メモリのみ）
 * const result = buildEnhancedSystemPrompt({
 *   product: 'IOSH',
 *   plan: 'PRO',
 *   userMessage: '今月の仕訳を準備してください',
 *   hotCache: loadedHotCache,
 *   locale: 'ja',
 * });
 * // → ベースプロンプト + Finance: journal-entry-prep スキル + メモリコンテキスト
 *
 * // ドキュメントキャッシュ付き（before_ai_chat で解決済み）
 * const result = buildEnhancedSystemPrompt({
 *   product: 'IOSH',
 *   plan: 'PRO',
 *   userMessage: 'A列の売上データを分析して',
 *   hotCache: loadedHotCache,
 *   documentCache: resolvedCache,  // ← document-cache.ts の ResolvedDocumentCache
 *   locale: 'ja',
 * });
 * // → ベースプロンプト + スキル + メモリ + ドキュメント内容 + コマンド一覧
 * ```
 */
export function buildEnhancedSystemPrompt(params: {
  product: ProductCode;
  plan: PlanCode;
  userMessage: string;
  hotCache?: HotCache | null;
  documentCache?: ResolvedDocumentCache | null;
  locale?: 'ja' | 'en';
}): {
  systemPrompt: string;
  activeSkills: SkillDefinition[];
  detectedContext: TaskContext;
  memoryEnabled: boolean;
  documentCacheUsed: boolean;
} {
  const { product, plan, userMessage, hotCache, documentCache, locale = 'ja' } = params;

  // 1. ベースシステムプロンプト
  const basePrompt = getBaseSystemPrompt(product, locale);

  // 2. タスクコンテキスト推定
  const detectedContext = inferTaskContext(product, userMessage, locale);

  // 3. アクティブスキル検出（トリガーパターンマッチ）
  const activeSkills = detectActiveSkills(product, plan, userMessage);

  // 4. スキル拡張プロンプト
  const skillExtension = buildSkillPromptExtension(activeSkills);

  // 5. メモリコンテキスト
  const memoryEnabled = isMemoryEnabled(plan);
  let memoryContext = '';
  if (memoryEnabled && hotCache && hotCache.entries.length > 0) {
    memoryContext = formatMemoryForPrompt(hotCache, locale);
  }

  // 5.5. ドキュメントキャッシュ（document-cache.ts で事前解決済み）
  const resolvedCache = documentCache ?? createEmptyResolvedCache();
  const documentCacheUsed = resolvedCache.available && resolvedCache.promptText.length > 0;

  // 6. 利用可能コマンド一覧（PRO+ のみ表示）
  const availableCommands = getAvailableCommands(product, plan);
  let commandsInfo = '';
  if (availableCommands.length > 0) {
    const commandList = availableCommands
      .map(cmd => `- /${cmd.name}: ${locale === 'ja' ? cmd.descriptionJa : cmd.descriptionEn}`)
      .join('\n');
    commandsInfo = locale === 'ja'
      ? `\n\n【利用可能なコマンド】\nユーザーが以下のコマンドを使用できます:\n${commandList}`
      : `\n\n[Available Commands]\nThe user can use the following commands:\n${commandList}`;
  }

  // 7. 結合
  const parts = [basePrompt];
  if (skillExtension) parts.push(skillExtension);
  if (memoryContext) {
    const memoryHeader = locale === 'ja'
      ? '\n\n【ユーザーコンテキスト（メモリ）】\n以下はこのユーザーの組織コンテキストです。回答時に参考にしてください:'
      : '\n\n[User Context (Memory)]\nThe following is organizational context for this user. Reference it when responding:';
    parts.push(memoryHeader + '\n' + memoryContext);
  }
  if (documentCacheUsed) parts.push(resolvedCache.promptText);
  if (commandsInfo) parts.push(commandsInfo);

  return {
    systemPrompt: parts.join('\n\n'),
    activeSkills,
    detectedContext,
    memoryEnabled,
    documentCacheUsed,
  };
}

/**
 * メモリ機能の有効状態を取得
 *
 * UI でメモリ機能の表示/非表示を制御するためのヘルパー。
 */
export function getMemoryStatus(plan: PlanCode): {
  enabled: boolean;
  deepStorageEnabled: boolean;
  hotCacheLimit: number;
  deepStorageLimit: number;
} {
  const limits = MEMORY_LIMITS_BY_PLAN[plan];
  return {
    enabled: limits?.enabled ?? false,
    deepStorageEnabled: isDeepStorageEnabled(plan),
    hotCacheLimit: limits?.hotCacheMaxEntries ?? 0,
    deepStorageLimit: limits?.deepStorageMaxEntries ?? 0,
  };
}

// =============================================================================
// デフォルトエクスポート
// =============================================================================

export default {
  // モデルレジストリ
  MODEL_REGISTRY,
  getModelFromRegistry,
  getAvailableModelsForTier,
  getDefaultModelForTier,
  resolveModel,
  getModelSelectionLabel,
  validateModelSelection,

  // モデル選択（レガシー互換 + 新API）
  getModelForTier,
  getModelTierLabel,
  DEFAULT_AI_SETTINGS,

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
  getAiAssistantCredits,

  // ライセンス — AI エディター
  AI_EDITOR_FEATURE_KEY,
  AI_EDITOR_ALLOWED_PLANS,
  canUseAiEditor,
  isCodeEditorProduct,

  // タスクコンテキスト別モデル推奨
  TASK_CONTEXT_HINTS,
  getRecommendedPersona,
  checkPersonaForTask,

  // 製品別タスクコンテキスト統合（document_evaluation 含む）
  getTaskContextsForProduct,
  inferTaskContext,
  getPersonaGuidance,

  // メッセージ送信時のペルソナ解決
  resolvePersonaForMessage,

  // クレジット表示
  getAiCreditLabel,

  // スキル + メモリ + ドキュメントキャッシュ統合（Anthropic Plugins アーキテクチャ）
  buildEnhancedSystemPrompt,
  getMemoryStatus,
};
