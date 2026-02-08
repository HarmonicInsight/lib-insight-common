# Anthropic Plugins 統合 — 各リポジトリ向け実行プロンプト

> insight-common の `claude/integrate-anthropic-plugins-duM5V` ブランチ（またはマージ後 main）に
> Anthropic Knowledge Work Plugins の統合が完了しました。
> 各アプリリポジトリで以下のプロンプトを AI アシスタント（Claude Code）に渡して、
> アプリ側の統合作業を実行してください。

---

## IOSD（InsightOfficeDoc）— 契約書レビュースキル統合

```
insight-common サブモジュールを最新に更新してください。

以下の統合作業を実施してください:

1. AI アシスタントのシステムプロンプト構築を `buildEnhancedSystemPrompt()` に切り替え
   - 現在 `getBaseSystemPrompt('IOSD', locale)` を直接呼んでいる箇所を検索
   - `buildEnhancedSystemPrompt({ product: 'IOSD', plan, userMessage, hotCache, locale })` に置き換え
   - 返り値の `systemPrompt` を Claude API の system パラメータに渡す

2. 契約書レビューコマンド UI の追加
   - AI チャットパネルに `/review-contract` コマンドボタンを追加
   - パラメータ入力: 当事者の立場（vendor/customer/partner）、契約タイプ（saas/services/license/nda）
   - `getCommandsForProduct('IOSD')` で利用可能コマンド一覧を取得
   - PRO プラン以上でのみ表示（STD ではグレーアウト + アップグレード誘導）

3. メモリシステムの組み込み
   - .iosd プロジェクトファイル（ZIP）内に ai_memory.json を追加
   - ファイルオープン時に ai_memory.json を読み込み、HotCache オブジェクトとして保持
   - ファイル保存時に ai_memory.json を書き戻し
   - PRO+ の場合は ai_memory_deep/ ディレクトリも管理

参照ファイル:
- insight-common/config/ai-assistant.ts — buildEnhancedSystemPrompt()
- insight-common/config/ai-assistant-skills.ts — IOSD 向けスキル定義
- insight-common/config/ai-memory.ts — メモリシステム型定義

デザインガイドライン:
- Gold (#B8942F) をプライマリに使用
- コマンドボタンは Gold アクセント
- GREEN/YELLOW/RED の重大度表示にはそれぞれ Success/Warning/Error カラーを使用
```

---

## IOSH（InsightOfficeSheet）— Finance スキル統合

```
insight-common サブモジュールを最新に更新してください。

以下の統合作業を実施してください:

1. AI アシスタントのシステムプロンプト構築を `buildEnhancedSystemPrompt()` に切り替え
   - 現在 `getBaseSystemPrompt('IOSH', locale)` を直接呼んでいる箇所を検索
   - `buildEnhancedSystemPrompt({ product: 'IOSH', plan, userMessage, hotCache, locale })` に置き換え
   - 返り値の `activeSkills` をログに記録（どのスキルが有効化されたか追跡）

2. Finance コマンド UI の追加
   - AI チャットパネルのコマンドメニューに以下を追加:
     - `/journal-entry` — 仕訳タイプ選択（accrual/depreciation/prepaid/payroll/revenue）+ 対象期間
     - `/variance-analysis` — 比較タイプ選択（budget-vs-actual/yoy/mom/qoq）
     - `/reconciliation` — 2つのデータ範囲を指定
   - `getCommandsForProduct('IOSH')` で利用可能コマンド一覧を取得
   - PRO プラン以上でのみ表示

3. メモリシステムの組み込み
   - .iosh プロジェクトファイル（ZIP）内に ai_memory.json を追加
   - ファイルオープン時に読み込み、ファイル保存時に書き戻し
   - 経理用語辞書（勘定科目名等）を自動学習してホットキャッシュに蓄積

4. finance_analysis タスクコンテキストの活用
   - 「仕訳」「差異分析」「照合」等のキーワードで finance_analysis コンテキストが検出される
   - このとき Sonnet 以上のモデルが推奨される旨のガイダンスを表示
   - resolvePersonaForMessage() を使ってモデル自動選択に反映

参照ファイル:
- insight-common/config/ai-assistant.ts — buildEnhancedSystemPrompt()
- insight-common/config/ai-assistant-skills.ts — IOSH 向けスキル定義
- insight-common/config/ai-memory.ts — メモリシステム

デザインガイドライン:
- Gold (#B8942F) をプライマリに使用
- コマンドメニューはドロップダウン形式
```

---

## INSS（InsightOfficeSlide）— コンテンツ作成 + メモリ

```
insight-common サブモジュールを最新に更新してください。

以下の統合作業を実施してください:

1. AI アシスタントのシステムプロンプト構築を `buildEnhancedSystemPrompt()` に切り替え
   - `buildEnhancedSystemPrompt({ product: 'INSS', plan, userMessage, hotCache, locale })` を使用

2. コンテンツ作成スキルの活用
   - 「ブログ」「プレスリリース」「ケーススタディ」等のキーワードで content_creation スキルが自動有効化
   - ステークホルダー報告スキル（/stakeholder-update）のコマンドボタンを追加
   - 対象者選択: executive/team/client/board

3. メモリシステムの組み込み
   - .inss プロジェクトファイル内に ai_memory.json を管理

参照ファイル:
- insight-common/config/ai-assistant.ts — buildEnhancedSystemPrompt()
- insight-common/config/ai-assistant-skills.ts — INSS 向けスキル定義
- insight-common/config/ai-memory.ts — メモリシステム
```

---

## ライセンスサーバー（Railway + Hono）— サポートトリアージ

> **注意**: エンドポイント定義・DB スキーマ・トリアージロジックは全て insight-common 内に
> 既に含まれています（今回のコミットで追加済み）。
> 以下はライセンスサーバーアプリ（Hono）側でルートを実装するためのプロンプトです。

```
以下の統合作業を実施してください:

1. DB マイグレーション
   - config/support-triage.ts と infrastructure/db/schema.sql は insight-common に定義済み
   - schema.sql の support_tickets / support_ticket_comments テーブルを Supabase に適用
   - インデックスも合わせて作成

2. サポート API ルートの実装（Hono）
   - config/license-server.ts の LICENSE_SERVER_ENDPOINTS に定義された 6 エンドポイントを実装:
     - POST /api/v1/support/tickets — チケット作成
     - GET /api/v1/support/tickets — チケット一覧
     - GET /api/v1/support/tickets/:ticketId — チケット詳細
     - POST /api/v1/support/classify — AI 自動分類
     - GET /api/v1/support/partner-guidelines — パートナーガイドライン
     - GET /api/v1/admin/support/stats — 管理画面統計

3. AI 自動分類の実装
   - /api/v1/support/classify エンドポイントで:
     - config/support-triage.ts の detectCategory() でカテゴリ推定
     - estimatePriority() で優先度推定
     - getRouting() でルーティング先取得
     - getAutoResponseTemplate() で初回応答テンプレート取得
   - SLA 期限は PRIORITY_DEFINITIONS の slaResponseTimeHours から計算

4. パートナーガイドラインの提供
   - /api/v1/support/partner-guidelines エンドポイントで:
     - TICKET_CATEGORIES 一覧
     - PRIORITY_DEFINITIONS（SLA 情報付き）
     - ROUTING_RULES
     - AUTO_RESPONSE_TEMPLATES_JA を返却

参照ファイル（全て insight-common 内）:
- config/support-triage.ts — 全分類ロジック・型定義
- config/license-server.ts — エンドポイント定義
- infrastructure/db/schema.sql — テーブル定義
```

---

## INPY（InsightPy）— データ分析スキル

```
insight-common サブモジュールを最新に更新してください。

以下の統合作業を実施してください:

1. AI コードエディターのシステムプロンプトを `buildEnhancedSystemPrompt()` に切り替え
   - `buildEnhancedSystemPrompt({ product: 'INPY', plan, userMessage, hotCache, locale })` を使用
   - 「データ分析」「pandas」「SQL」等のキーワードでスキルが自動有効化

2. データ分析コマンドの追加
   - /analyze-data — 分析目的を入力してスクリプト生成
   - /write-query — 自然言語からSQLクエリ生成（方言選択: postgresql/mysql/sqlite/snowflake/bigquery）
   - `getCommandsForProduct('INPY')` で一覧取得

参照ファイル:
- insight-common/config/ai-assistant.ts — buildEnhancedSystemPrompt()
- insight-common/config/ai-assistant-skills.ts — INPY 向けスキル定義
```
