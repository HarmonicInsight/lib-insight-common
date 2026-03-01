# AI アシスタント 標準仕様

> Insight Business Suite 系アプリ（INSS/IOSH/IOSD/INMV）共通の AI アシスタント実装ガイド

---

## 1. 概要

Insight Business Suite 系アプリには、Claude API を利用した AI アシスタント機能を搭載する。
本ドキュメントは、UI デザイン・API 連携・ペルソナ・ライセンス制御・データモデルの全仕様を標準化する。

### 対象製品

| コード | 製品名 | AI の役割 |
|--------|--------|-----------|
| INSS | Insight Deck Quality Gate | スライドテキストの校正・改善提案 |
| IOSH | Insight Performance Management | Excel データの操作・分析・書式設定（Tool Use） |
| IOSD | Insight AI Doc Factory | Word ドキュメントの校正・要約・構成提案 |
| INMV | Insight Training Studio | 動画構成提案・ナレーション作成・字幕最適化（Tool Use） |

### 設計原則

1. **BYOK（Bring Your Own Key）モデル** — ユーザーが自身の Claude API キーを入力
2. **モデルレジストリ + ユーザー選択** — MODEL_REGISTRY で一元管理、ユーザーがティア内でモデルを選択可能
3. **プロダクトコンテキスト** — 開いているファイルの内容を AI に自動提供
4. **ライセンス制御** — 全プラン BYOK（クレジット制限なし）
5. **Tool Use 対応** — スプレッドシート等で AI がデータを直接操作可能
6. **プロンプト選択型 UI** — 多くの人に AI を活用させるには、自由入力のチャット形式では難しい。目的に応じたプロンプトを事前に用意し、ユーザーがそれを選択する形式にすべき。想定運用: 8割のユーザーはプリセットのAIプロンプトを選択して実行、2割の上級ユーザーがプロンプトエディタで新しいプロンプトを試行→有効なものを社内に展開・共有する流れとする

---

## 2. モデル選択システム

### 2.1 モデルレジストリ

全利用可能モデルは `config/ai-assistant.ts` の `MODEL_REGISTRY` で一元管理する。
新モデルのリリース時はレジストリに1エントリ追加するだけで全製品に反映される。

```typescript
// 新モデル追加の例（Sonnet 4.6 追加時）
{
  id: 'claude-sonnet-4-6-20260210',
  family: 'sonnet',
  displayName: 'Sonnet 4.6',
  version: '4.6',
  releaseDate: '2026-02-10',
  minimumTier: 'standard',
  inputPer1M: 3,
  outputPer1M: 15,
  maxContextTokens: 200_000,
  icon: '⭐',
  status: 'active',
  isDefaultForTier: 'standard',  // ← これでデフォルトに設定
  descriptionJa: '最新の万能型。...',
  descriptionEn: 'Latest balanced model. ...',
}
```

### 2.2 モデル選択（BYOK — クライアント選択）

モデルティア制限は廃止。BYOK のため、ユーザーは自身の API キーで全モデルを自由に選択可能。

| 設定 | 内容 |
|------|------|
| デフォルトモデル | 最新 Sonnet（`isDefaultForTier: 'standard'`） |
| 利用可能モデル | 全モデル（Haiku + Sonnet + Opus）— ティア制限なし |

### 2.3 ユーザーモデル選択

ユーザーは設定画面から、自分のティア内で利用可能なモデルを選択できる。

```typescript
// TypeScript
import { resolveModel, getAvailableModelsForTier } from '@/insight-common/config/ai-assistant';

// 設定画面: 利用可能モデル一覧を取得
const models = getAvailableModelsForTier('standard');
// → [Haiku 4.5, Sonnet 4, Sonnet 4.6]

// API コール時: ユーザー選択を考慮してモデルを解決
const modelId = resolveModel(balance.effectiveModelTier, userPreference);
```

```csharp
// C# (WPF)
// 設定画面: 利用可能モデル一覧を取得
var models = ClaudeModels.GetAvailableModelsForTier("standard");

// API コール時: ユーザー選択を考慮してモデルを解決
var modelId = ClaudeModels.ResolveModel(tier, userPreferredModelId);
```

**設定の永続化:**

```json
// settings.json
{
  "claudeApiKey": "sk-ant-...",
  "language": "ja",
  "chatPanelWidth": 400,
  "userModelPreference": {
    "standardTierModel": "claude-sonnet-4-6-20260210",
    "premiumTierModel": null
  }
}
```

### 2.4 ペルソナシステム（内部用）

ペルソナはタスクコンテキスト推奨エンジンの内部実装として存続する（UIには非公開）。
各ペルソナのモデルはレジストリのデフォルトから自動解決される。

| ID | 日本語名 | 英語名 | モデルファミリー | テーマカラー | 性格・用途 |
|-----|----------|--------|----------------|-------------|-----------|
| `shunsuke` | Claude 俊 | Claude Shun | Haiku（最新） | `#4696DC` | 素早く簡潔。軽い確認・ちょっとした修正に最適 |
| `megumi` | Claude 恵 | Claude Megumi | Sonnet（Standard デフォルト） | `#B8942F` (Gold) | 万能で丁寧。編集・要約・翻訳のバランス型 |
| `manabu` | Claude 学 | Claude Manabu | Opus（Premium デフォルト） | `#8C64C8` | 深い思考力。レポート・精密な文書に最適 |

### 2.5 ペルソナアイコン

- 各ペルソナに **32px** および **48px** のピクセルアートアイコンを用意
- 格納場所: `Assets/Personas/{id}_32.png`, `Assets/Personas/{id}_48.png`
- WPF の場合は `NearestNeighbor` スケーリングでピクセルアートの鮮明さを維持

```xml
<!-- WPF ピクセルアートアイコンのレンダリング -->
<Image Source="{Binding PersonaIcon}"
       RenderOptions.BitmapScalingMode="NearestNeighbor"
       Width="32" Height="32" />
```

---

## 3. UI デザイン標準

### 3.1 パネルレイアウト

AI アシスタントはメインウィンドウの **右サイドパネル** として配置する。

```
┌─────────────────────────────────────────────────────────────────┐
│  [ツールバー]                                    [AI] [設定]    │
├───────────────────────────────────────┬─────────────────────────┤
│                                       │ AIアシスタント     [≡]  │
│                                       │ [ペルソナ ▼] [⚙] [🗑] │
│                                       ├─────────────────────────┤
│           メインコンテンツ              │                         │
│        （スプレッドシート/              │    チャット履歴          │
│         スライド/ドキュメント）         │                         │
│                                       │  ┌─────────────────┐    │
│                                       │  │ ユーザーメッセージ│    │
│                                       │  └─────────────────┘    │
│                                       │  ┌─────────────────┐    │
│                                       │  │ AI応答           │    │
│                                       │  └─────────────────┘    │
│                                       ├─────────────────────────┤
│                                       │ [メッセージ入力     ]   │
│                                       │ [アドバイス] [チェック]  │
└───────────────────────────────────────┴─────────────────────────┘
```

### 3.2 パネル仕様

| 項目 | 仕様 |
|------|------|
| **配置** | Grid.Column の最終列、DockPanel.Right |
| **初期状態** | 非表示（Width=0） |
| **デフォルト幅** | 300px |
| **最小幅** | 200px |
| **リサイズ** | 左端に `Thumb`（`Cursor="SizeWE"`）でドラッグリサイズ |
| **トグル** | ツールバーのロボットアイコンボタンで開閉 |

### 3.3 ヘッダー

```
┌─────────────────────────────────────┐
│ [ペルソナ32px] AIアシスタント  [⚙][🗑]│
│ [ペルソナ ▼ ComboBox]               │
└─────────────────────────────────────┘
```

- タイトル「AIアシスタント」は **Gold (#B8942F)** で表示
- ペルソナアイコン（32px ピクセルアート）を左に配置
- ペルソナ選択は `ComboBox`（各ペルソナの名前 + 説明を表示）
- ⚙ ボタン: API キー設定パネルのトグル
- 🗑 ボタン: チャット履歴クリア

### 3.4 API キー設定（折りたたみ可能）

```
┌─────────────────────────────────────┐
│ Claude API Key:                      │
│ [PasswordBox                    ]   │
│ [設定]                              │
│                                      │
│ ⚠ APIキーが設定されていません         │
└─────────────────────────────────────┘
```

- API キー未設定時は警告バナーを表示（オレンジ背景）
- `PasswordBox` を使用（平文表示しない）
- 設定ボタンクリックで保存 → 折りたたみパネルを閉じる

### 3.5 チャットメッセージ

| 要素 | ユーザー | アシスタント | システム |
|------|---------|------------|---------|
| **配置** | 右寄せ | 左寄せ | 中央 |
| **背景色** | `#F5F0E8`（ウォーム） | `#FFFFFF`（白） | 透明 |
| **角丸** | 8,8,0,8 | 8,8,8,0 | 4 |
| **タイムスタンプ** | `HH:mm` 右下 | `HH:mm` 左下 | なし |
| **最大幅** | パネル幅の 85% | パネル幅の 85% | 100% |

### 3.6 入力エリア

```
┌─────────────────────────────────────┐
│ [TextBox (3行〜8行の可変高さ)     ] │
│ [アドバイス]        [内容チェック]   │
└─────────────────────────────────────┘
```

- テキスト入力: `TextBox`、`AcceptsReturn=True`、最小 3 行・最大 8 行
- **アドバイスボタン**: 自由質問を Claude に送信（全製品共通）
- **内容チェックボタン**: ファイルの内容を AI に分析依頼（製品固有の構造化出力）
- 処理中は「[ペルソナアイコン] が考え中...」と表示し、キャンセルボタンを表示

### 3.7 使用量表示（オプション）

```
┌─────────────────────────────────────┐
│ 📊 3 calls | ↑1.2K ↓3.4K | ~$0.02  │
└─────────────────────────────────────┘
```

- API コール数、入力/出力トークン数、推定コストを表示
- 0 コールの場合は非表示
- コスト計算はモデル別:
  - Haiku: $1 / $5 per 1M tokens (input/output)
  - Sonnet: $3 / $15 per 1M tokens
  - Opus: $15 / $75 per 1M tokens

---

## 4. Claude API 連携標準

### 4.1 API 設定

| 項目 | 値 |
|------|-----|
| **エンドポイント** | `https://api.anthropic.com/v1/messages` |
| **API バージョン** | `2023-06-01` |
| **デフォルトモデル** | `claude-sonnet-4-20250514` |
| **Max Tokens** | 4096 |
| **HTTP タイムアウト** | 90 秒（HttpClient）、120 秒（CancellationToken） |
| **認証** | `x-api-key` ヘッダー |

### 4.2 メッセージ送信（チャット）

```
POST https://api.anthropic.com/v1/messages
Content-Type: application/json
x-api-key: {user_api_key}
anthropic-version: 2023-06-01

{
  "model": "{selected_model}",
  "max_tokens": 4096,
  "system": "{system_prompt}",
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." },
    ...
  ]
}
```

### 4.3 Tool Use 対応（IOSH など）

スプレッドシートやドキュメント操作が必要な製品では Tool Use を使用する。

```json
{
  "model": "{selected_model}",
  "max_tokens": 4096,
  "system": "{system_prompt}",
  "messages": [...],
  "tools": [
    {
      "name": "get_cell_range",
      "description": "...",
      "input_schema": { ... }
    }
  ]
}
```

**Tool Use ループ仕様:**
- `stop_reason == "tool_use"` の場合、ツールを実行し結果を `tool_result` ブロックとして送信
- 最大 **10 イテレーション** でループを打ち切り
- ツール実行中はステータスメッセージを表示（例: 「set_cell_values を実行中...」）

### 4.4 会話履歴管理

- `_conversationHistory` リストで最大 **30 メッセージ** を保持
- 古いメッセージは先頭から削除（system プロンプトは毎回再構築）
- チャット履歴はローカルファイルに JSON 形式で永続化

### 4.5 共通モジュール: AgenticSessionManager

Tool Use ループ（§4.3）と会話履歴管理（§4.4）は `InsightCommon.AI.AgenticSessionManager` で統合実装されている。
各アプリは製品固有のツール実行のみを `IToolExecutor` で実装すればよい。

**構成ファイル:**

| ファイル | 役割 |
|---------|------|
| `csharp/InsightCommon/AI/AgenticSessionManager.cs` | セッション管理本体（ループ・履歴・使用量） |
| `csharp/InsightCommon/AI/IToolExecutor.cs` | ツール実行インターフェース + 実行結果モデル |
| `csharp/InsightCommon/AI/ISessionCallback.cs` | UI 通知コールバック（任意実装） |

**基本的な使い方:**

```csharp
using InsightCommon.AI;

// 1. セッション構築
var session = new AgenticSessionManager(claudeApiClient, new SessionOptions
{
    SystemPrompt = "あなたは...",
    Tools = myToolDefinitions,              // Tool Use 対応製品のみ
    ToolExecutor = new MyToolExecutor(),     // IToolExecutor 実装
    Callback = new MyChatPanelCallback(),    // ISessionCallback 実装（任意）
    MaxIterations = 10,                     // Tool Use ループ上限
    MaxHistoryMessages = 30,                // API 送信用履歴上限
    MaxStorageMessages = 100,               // ローカル保存用履歴上限
});

// 2. メッセージ送信（Tool Use ループは内部で自動処理）
var response = await session.SendAsync("A1:C10を合計して", cancellationToken);
// response.Text       → AI の最終テキスト応答
// response.Iterations → API コール回数（ループ含む）
// response.WasTruncated → MaxIterations 到達で打ち切られた場合 true

// 3. 使用量確認
var usage = session.Usage;
// usage.TotalCalls, usage.TotalInputTokens, usage.TotalOutputTokens, usage.EstimatedCostUsd

// 4. セッション永続化（プロジェクトファイル保存時）
ChatSession exported = session.ExportSession();

// 5. セッション復元（プロジェクトファイル読込時）
session.ImportSession(existingChatSession);
```

**IToolExecutor の実装例（IOSH）:**

```csharp
public class SpreadsheetToolExecutor : IToolExecutor
{
    private readonly SpreadsheetControl _control;

    public SpreadsheetToolExecutor(SpreadsheetControl control)
    {
        _control = control;
    }

    public async Task<ToolExecutionResult> ExecuteAsync(
        string toolName, JsonElement input, CancellationToken ct)
    {
        return toolName switch
        {
            "get_cell_range" => await GetCellRange(input),
            "set_cell_values" => await SetCellValues(input),
            _ => new ToolExecutionResult
            {
                Content = $"Unknown tool: {toolName}",
                IsError = true,
            },
        };
    }
}
```

**定数の根拠:**

| 定数 | 値 | 根拠 |
|------|-----|------|
| `MaxIterations` | 10 | §4.3 Tool Use ループ最大イテレーション |
| `MaxHistoryMessages` | 30 | §4.4 API 送信用最大メッセージ数 |
| `MaxStorageMessages` | 100 | §10.4 ローカル保存最大メッセージ数 |

### 4.6 AI メモリシステム

AgenticSessionManager は AI メモリシステムを統合しており、会話から用語・人物・プロジェクト・ユーザー設定を自動抽出し、次回以降の system prompt に注入する。

**設計方針: インライン抽出（追加 API コスト ゼロ）**

通常の応答の中で `<ai_memory>` タグとしてメモリ抽出を行うため、追加の API 呼び出しは発生しない。system prompt に ~200 トークンの抽出指示が加わるのみ。

**構成ファイル:**

| ファイル | 役割 |
|---------|------|
| `csharp/InsightCommon/AI/AiMemoryModels.cs` | メモリエントリ型・ホットキャッシュ・プラン別制限 |
| `csharp/InsightCommon/AI/AiMemoryService.cs` | メモリ CRUD・マージ・重複排除・プラン制限適用 |
| `csharp/InsightCommon/AI/MemoryExtractor.cs` | インライン抽出・プロンプト整形・抽出指示生成 |
| `config/ai-memory.ts` | TypeScript 型定義（C# モデルの根拠） |

**使い方:**

```csharp
using InsightCommon.AI;

// 1. プロジェクトファイルからホットキャッシュを読み込み
var hotCache = projectFile.LoadAiMemory(); // ZIP 内 ai_memory.json

// 2. SessionOptions にホットキャッシュを渡す
var session = new AgenticSessionManager(client, new SessionOptions
{
    SystemPrompt = basePrompt,
    MemoryHotCache = hotCache,   // ← メモリ注入
    Locale = "ja",               // ← 抽出指示・整形の言語
    Callback = new MyChatPanelCallback(),
});

// 3. 応答からメモリが自動抽出される
var response = await session.SendAsync("田中部長のKPI報告書を修正して", ct);
// response.Text             → クリーンテキスト（<ai_memory> タグ除去済み）
// response.ExtractedMemories → [PersonEntry("田中", 部長), GlossaryEntry("KPI", ...)]

// 4. ISessionCallback.OnMemoryExtracted() でメモリパネル UI を更新
//    ユーザー確認後、ホットキャッシュに保存 → 次回 system prompt に自動注入
```

**プラン別制限（`AiMemoryLimitsRegistry`）:**

| プラン | ホットキャッシュ上限 | ディープストレージ上限 |
|--------|:------------------:|:--------------------:|
| FREE | 20 | 無効 |
| TRIAL | 50 | 200 |
| BIZ | 100 | 500 |
| ENT | 無制限 | 無制限 |

**メモリ抽出フロー:**

```
Claude 応答 → MemoryExtractor.Extract()
  ├─ CleanText    → AgenticResponse.Text（表示用）
  ├─ Entries      → AgenticResponse.ExtractedMemories
  └─ Callback     → ISessionCallback.OnMemoryExtracted()
                     → アプリ側で UI 表示・確認・保存
```

---

## 5. システムプロンプト標準

### 5.1 プロンプト構成

システムプロンプトは以下の構成で組み立てる:

```
[1. ロール定義]
[2. 応答ルール]
[3. 製品固有の機能説明]
[4. 開いているファイルのコンテキスト（動的）]
[5. メモリ抽出指示（§4.6 — 自動追加）]
[6. 蓄積メモリ（§4.6 — ホットキャッシュから自動注入）]
```

### 5.2 共通ベースプロンプト

```
あなたは{製品名}のAIアシスタントです。
ユーザーの質問や要望に丁寧に回答してください。
ユーザーのメッセージと同じ言語で回答してください。
```

### 5.3 製品別プロンプト

#### Insight Deck Quality Gate (INSS)

```
あなたはPowerPointプレゼンテーションの内容を分析・修正するAIアシスタントです。
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

ユーザーの質問や要望に丁寧に回答してください。
```

#### Insight Performance Management (IOSH)

```
You are an AI assistant for Insight Performance Management, an Excel version control application.
You have tools to read and write the currently open spreadsheet.
Use tools to fulfill user requests about modifying, analyzing, or formatting data.
Always explain what you are doing before and after using tools.
Respond in the same language as the user's message.
```

#### Insight AI Doc Factory (IOSD)

```
あなたはInsight AI Doc FactoryのAIアシスタントです。Wordドキュメントの操作・自動化を支援します。
ユーザーのメッセージと同じ言語で回答してください。

主な機能：
- 文章の校正・誤字脱字の修正
- 文書の要約・構成提案
- フォーマット変換のアドバイス
- テンプレート活用の提案

ユーザーの質問や要望に丁寧に回答してください。
```

#### Insight Training Studio (INMV)

```
あなたはInsight Training StudioのAIアシスタントです。研修動画・デモ動画の構成提案・ナレーション作成・字幕最適化を支援します。
ユーザーのメッセージと同じ言語で回答してください。
ツールを使って現在開いている動画プロジェクトのタイムライン・シーン・ナレーションを読み書きできます。
ツールを使用する前後に、何をしているかを説明してください。

専門知識：
- 動画構成提案（認知負荷理論に基づくチャンキング、シーン分割戦略）
- ナレーションスクリプト作成（日本語: 250-300文字/分、同期ポイント記法 [SYNC: 説明]）
- 字幕最適化（1行20文字以内、表示時間1.5-7秒）
- ストーリーボード設計（導入→本編→まとめ、モダリティ原則）

ユーザーの質問や要望に丁寧に回答してください。
```

### 5.4 ファイルコンテキストの注入

システムプロンプトの末尾に、開いているファイルの内容を動的に追加する。

**スライド系（INSS）:**
```
現在開いているPowerPointの内容：
=== スライド 1 ===
row=1, slideNumber=1, shapeId="Title1", text="プレゼンタイトル"
row=2, slideNumber=1, shapeId="Body1", text="本文テキスト"
```

**シート系（IOSH）:**
```
現在のワークブック情報:
- ファイル名: example.xlsx
- シート数: 3

Sheet1 (100行 x 20列):
A	B	C	...
売上	1000	...
```

- スライド系: 全スライドの全テキストを `row=N` 形式で付与
- シート系: 各シートの先頭 50 行 x 20 列をタブ区切りで付与（超過時は切り詰め通知）

---

## 6. 構造化出力（内容チェック機能）

### 6.1 テキスト修正提案（スライド系）

「内容チェック」ボタン押下時に使用する専用プロンプト:

```
あなたはPowerPointプレゼンテーションのテキスト修正アシスタントです。

【重要なルール】
- 入力データの各行は row（行番号）, slideNumber, shapeId, text の構造を持ちます。
- 修正提案では row（行番号）を必ず返してください。これが最も重要な識別子です。
- originalText には、入力データの text フィールドの内容を「完全一致」でコピーしてください。
- suggestedText には、修正後のテキスト全文を書いてください（変更箇所だけでなく全文）。

修正提案は必ず以下のJSON配列形式で返してください：
[{"row": 1, "originalText": "...", "suggestedText": "...", "reason": "..."}]
```

### 6.2 提案の適用フロー

1. ユーザーが「内容チェック」をクリック
2. ファイル内容を Claude に送信（構造化出力プロンプト）
3. Claude が JSON 配列の修正提案を返却
4. `row` 番号で対象アイテムをマッチング（フォールバック: `originalText` 完全一致）
5. マッチしたアイテムに `AiSuggestedText` を設定、ステータスを `AiSuggested` に変更
6. ユーザーが提案を選択し「反映」ボタンで適用
7. Undo スタックに記録（`UndoType.AiApply`）

---

## 7. Tool Use 定義（IOSH 標準）

Insight Performance Management で利用する 6 つの標準ツール:

### 7.1 ツール一覧

| ツール名 | 説明 | パラメータ |
|---------|------|-----------|
| `get_cell_range` | セル範囲の値・数式・スタイルを読み取り | `range` (A1形式), `sheet_name?` |
| `set_cell_values` | セルにテキスト/数値を設定 | `updates[]` (cell, value), `sheet_name?` |
| `set_cell_formulas` | セルに数式を設定 | `updates[]` (cell, formula), `sheet_name?` |
| `set_cell_styles` | セルの書式を設定 | `updates[]` (range, style), `sheet_name?` |
| `analyze_data` | 数値データの統計サマリー | `range`, `sheet_name?` |
| `find_cells` | テキスト/数式パターンで検索 | `search_text`, `search_in?`, `sheet_name?` |

### 7.2 安全制限

| 項目 | 制限値 |
|------|--------|
| `get_cell_range` 最大読み取り | 200 行 x 50 列 |
| `find_cells` 最大結果数 | 50 件 |
| Tool Use ループ最大 | 10 イテレーション |
| 全ツールの `sheet_name` | 省略時はアクティブシート |

### 7.3 他製品への Tool Use 拡張

IOSD（Word 操作）向けに、以下のツールを将来追加予定:

| ツール名 | 説明 |
|---------|------|
| `get_paragraphs` | 段落テキストの読み取り |
| `set_paragraph_text` | 段落テキストの書き換え |
| `get_document_structure` | 見出し構造の取得 |
| `find_text` | テキスト検索 |

### 7.4 Tool Use 定義（INMV — 動画操作）

Insight Training Studio で利用する 5 つの標準ツール:

| ツール名 | 説明 | パラメータ |
|---------|------|-----------|
| `get_timeline` | タイムライン全体の構造（シーン一覧・順序・尺）を取得 | なし |
| `get_scene` | 特定シーンの詳細（ナレーション・字幕・画像・設定）を取得 | `scene_id` |
| `update_scene_narration` | シーンのナレーションテキストを更新 | `scene_id`, `narration_text`, `language?` |
| `update_subtitles` | シーンの字幕エントリを更新 | `scene_id`, `subtitles[]` (text, start_time, end_time) |
| `get_narration_scripts` | 全シーンのナレーション一覧を取得 | `include_empty?` |

**ナレーション品質基準（ツール内蔵）:**
- 日本語: 250-300 文字/分（TTS 読み上げ速度の目安）
- 同期ポイント記法: `[SYNC: 画面切り替え]` で視覚要素との同期を指示
- 1シーンのナレーションは 2 分以内を推奨

**字幕制約（ツール内蔵）:**
- 日本語: 1 行 20 文字以内
- 表示時間: 1.5〜7 秒
- 1 字幕エントリに最大 2 行

---

## 8. ライセンス制御

### 8.1 機能キー

全製品共通で `ai_assistant` キーを使用する。

```typescript
// config/products.ts
{
  key: 'ai_assistant',
  name: 'AI Assistant',
  nameJa: 'AIアシスタント',
  type: 'boolean',
  allowedPlans: ['FREE', 'TRIAL', 'BIZ', 'ENT'],
  descriptionJa: 'AIチャットによるファイル操作支援',
}
```

### 8.2 プラン別アクセス

| プラン | AI アシスタント | 理由 |
|--------|:----------:|------|
| FREE | ✅（無制限・BYOK） | BYOK — ユーザー自身の API キーで利用 |
| TRIAL | ✅（無制限・BYOK） | 全機能評価のため |
| BIZ | ✅（無制限・BYOK） | BYOK — ユーザー自身の API キーで利用 |
| ENT | ✅（無制限・BYOK） | BYOK — ユーザー自身の API キーで利用 |

### 8.3 ゲート実装

**C# (WPF):**

```csharp
// ツールバーの AI トグルボタンクリック時
private void AiToggle_Click(object sender, RoutedEventArgs e)
{
    if (!_licenseManager.CurrentLicense.Plan.HasAiFeature())
    {
        ShowUpgradePrompt("AI_ProRequired");
        return;
    }
    viewModel.ChatVM.ToggleChatCommand.Execute(null);
}

// PlanCode 拡張メソッド
public static bool HasAiFeature(this PlanCode plan) =>
    plan is PlanCode.Free or PlanCode.Trial or PlanCode.Biz or PlanCode.Ent;
```

**TypeScript:**

```typescript
import { checkFeature } from '@/insight-common/config/products';

if (!checkFeature(productCode, 'ai_assistant', userPlan)) {
  showUpgradeDialog('AI_ProRequired');
  return;
}
```

### 8.4 アップグレードダイアログ

AI ボタン押下時に FREE ユーザーに表示するダイアログ:

```
┌────────────────────────────────────────┐
│  AIアシスタントはBIZプランの機能です      │
│                                        │
│  AIアシスタントを利用するには、           │
│  BIZプラン以上へのアップグレードが        │
│  必要です。                             │
│                                        │
│  [アップグレード]         [閉じる]       │
└────────────────────────────────────────┘
```

---

## 9. データモデル

### 9.1 チャットメッセージ

**C#:**

```csharp
public class AiMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string Content { get; set; } = string.Empty;
    public AiMessageRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public bool IsStreaming { get; set; }
    public bool IsToolStatus { get; set; }
    public string DisplayTime => CreatedAt.ToString("HH:mm");
}

public enum AiMessageRole
{
    User,
    Assistant,
    System
}
```

**TypeScript:**

```typescript
interface AiMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  isStreaming?: boolean;
  isToolStatus?: boolean;
}
```

### 9.2 ペルソナ

```csharp
public class AiPersona
{
    public string Id { get; set; }          // "shunsuke" | "megumi" | "manabu"
    public string NameJa { get; set; }      // "Claude俊"
    public string NameEn { get; set; }      // "Claude Shun"
    public string Model { get; set; }       // "claude-haiku-4-5-20251001"
    public string ThemeColor { get; set; }  // "#4696DC"
    public string DescriptionJa { get; set; }
    public string DescriptionEn { get; set; }
    public string Icon32Path { get; set; }
    public string Icon48Path { get; set; }
}
```

### 9.3 テキスト修正提案

```csharp
public class TextSuggestion
{
    public int Row { get; set; }
    public int SlideNumber { get; set; }
    public string ShapeId { get; set; }
    public string OriginalText { get; set; }
    public string SuggestedText { get; set; }
    public string Reason { get; set; }
}
```

### 9.4 Tool Use 関連

```csharp
public class ToolDefinition
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public JsonObject InputSchema { get; set; } = new();
}

public class ContentBlock
{
    public string Type { get; set; } = "";      // "text" | "tool_use"
    public string? Text { get; set; }
    public string? Id { get; set; }             // tool_use ID
    public string? Name { get; set; }           // tool name
    public JsonElement? Input { get; set; }
}

public class ClaudeResponse
{
    public List<ContentBlock> Content { get; set; } = new();
    public string StopReason { get; set; } = "";
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
}

public class ToolResultBlock
{
    public string ToolUseId { get; set; } = "";
    public string Content { get; set; } = "";
    public bool? IsError { get; set; }
}
```

---

## 10. 永続化

### 10.1 保存先

- **Windows (WPF):** `%LOCALAPPDATA%\HarmonicInsight\{ProductName}\`
- **Web (React):** `localStorage` / `AsyncStorage` (React Native)

### 10.2 ファイル構成

| ファイル | 内容 |
|---------|------|
| `settings.json` | API キー、選択モデル、ペルソナ、言語設定 |
| `chat_history.json` | チャットメッセージ一覧 |

### 10.3 設定スキーマ

```json
{
  "claudeApiKey": "sk-ant-...",
  "selectedPersonaId": "megumi",
  "selectedModel": "claude-sonnet-4-6-20260210",
  "language": "ja",
  "chatPanelWidth": 400,
  "userModelPreference": {
    "standardTierModel": "claude-sonnet-4-6-20260210",
    "premiumTierModel": null
  }
}
```

### 10.4 チャット履歴管理

- 起動時に `chat_history.json` を読み込み
- AI 応答のたびに保存
- チャットクリアで空配列に上書き
- 最大 100 メッセージを保持（超過分は古い順に削除）

---

## 11. エラーハンドリング

### 11.1 API エラー

| HTTP ステータス | 表示メッセージ | 対応 |
|:---:|---------|------|
| 401 | API キーが無効です。設定を確認してください。 | API キー設定パネルを開く |
| 429 | リクエスト上限に達しました。しばらくお待ちください。 | `Retry-After` ヘッダーに従う |
| 500+ | サーバーエラーが発生しました。再度お試しください。 | リトライボタンを表示 |
| タイムアウト | 応答がタイムアウトしました。再度お試しください。 | キャンセル処理済みメッセージ |

### 11.2 システムメッセージ

エラーメッセージは `AiMessageRole.System` としてチャット内に表示する。背景色は透明、テキストは `TextSecondaryColor (#57534E)`。

---

## 12. 実装チェックリスト

### 必須（全製品）

- [ ] ペルソナシステム（3 ペルソナ: shunsuke / megumi / manabu）
- [ ] チャットパネル UI（右サイドパネル、リサイズ可能）
- [ ] ヘッダー（Gold タイトル、ペルソナ選択、設定、クリアボタン）
- [ ] API キー設定パネル（PasswordBox、未設定警告）
- [ ] チャットメッセージ表示（ユーザー右寄せ、AI 左寄せ、タイムスタンプ）
- [ ] 入力エリア（可変高さ TextBox、アドバイス/チェックボタン）
- [ ] 処理中インジケーター（ペルソナアイコン + 「が考え中...」）
- [ ] キャンセル機能（CancellationToken）
- [ ] ライセンスゲート（全プラン BYOK・クレジット制限なし）
- [ ] チャット履歴永続化（JSON ファイル）
- [ ] 設定永続化（API キー、ペルソナ、モデル）
- [ ] エラーハンドリング（401 / 429 / 500 / タイムアウト）
- [ ] ファイルコンテキスト注入（開いているファイルの内容を system プロンプトに含める）

### 製品固有

**スライド系（INSS）:**
- [ ] 構造化出力（内容チェック → JSON 修正提案）
- [ ] 提案の `row` ベースマッチング
- [ ] 提案の選択・一括反映・Undo

**シート系（IOSH）:**
- [ ] Tool Use 対応（6 ツール定義）
- [ ] Tool Use ループ（最大 10 イテレーション）
- [ ] ツール実行ステータス表示
- [ ] 使用量トラッキング（コール数、トークン数、推定コスト）
- [ ] Syncfusion SfSpreadsheet との連携（Dispatcher 経由）

**ドキュメント系（IOSD）:**
- [ ] 将来の Tool Use 対応準備（get_paragraphs 等）

**動画系（INMV）:**
- [ ] Tool Use 対応（5 ツール定義: get_timeline, get_scene, update_scene_narration, update_subtitles, get_narration_scripts）
- [ ] Tool Use ループ（最大 10 イテレーション）
- [ ] ツール実行ステータス表示
- [ ] ナレーション品質チェック（250-300 文字/分、同期ポイント記法）
- [ ] 字幕制約バリデーション（1 行 20 文字以内、表示 1.5-7 秒）
- [ ] ドキュメント評価対応（動画プリセット 4 種: 研修/デモ/マーケティング/オンボーディング）

---

## 13. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|---------------|
| OpenAI / Azure API を使用 | **Claude (Anthropic) API** を使用 |
| API キーをハードコード | ユーザー入力 + ローカル暗号化保存 |
| API キーをサーバーに送信 | クライアントから直接 Anthropic API へ |
| 独自のペルソナ定義 | 標準 3 ペルソナ（shunsuke / megumi / manabu）を使用 |
| ライセンスチェックを省略 | `checkFeature(product, 'ai_assistant', plan)` を必ず実行 |
| 青色でチャットバブルを表示 | **ウォーム系の色** を使用（`#F5F0E8` 等） |
| 無制限の会話履歴 | **30 メッセージ** で API 送信履歴を制限 |
