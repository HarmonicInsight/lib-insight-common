# AI Accounting Agent — 設計・運用ガイド

> **対象**: ライセンスサーバー開発者・経理担当者
> **関連ファイル**: `config/ai-accounting-agent.ts`, `config/freee-integration.ts`, `config/stripe-integration.ts`

---

## 1. 概要

AI Accounting Agent は、Claude API の Tool Use 機能を活用した自律型 AI 経理エージェントです。
Stripe 決済イベントと freee 会計 API を橋渡しし、以下の業務を自動化します。

| 業務 | 自動化内容 |
|------|-----------|
| **売上計上** | Stripe 決済完了 → freee 取引先登録・請求書発行・入金取引記録 |
| **入金消込** | Stripe サブスク更新 → freee 売掛金の消込 |
| **月次締め** | Stripe ↔ freee の突合、未同期補完、試算表検証 |
| **経費記帳** | freee 経費精算承認 → 支出取引の自動記帳 |

## 2. アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Accounting Agent                                            │
│                                                                 │
│  Trigger Layer         Workflow Engine        Tool Layer         │
│  ┌──────────┐         ┌──────────┐          ┌──────────┐       │
│  │ Stripe   │────────→│ ステップ │────────→│ freee    │       │
│  │ Webhook  │         │ 制御     │          │ API      │       │
│  │          │         │          │          │          │       │
│  │ freee    │────────→│ Claude   │────────→│ Stripe   │       │
│  │ Webhook  │         │ Tool Use │          │ API      │       │
│  │          │         │          │          │          │       │
│  │ Cron     │────────→│ 承認     │────────→│ Internal │       │
│  │          │         │ ゲート   │          │ Helper   │       │
│  │ 手動     │────────→│          │          │          │       │
│  └──────────┘         └──────────┘          └──────────┘       │
│                                                                 │
│  Safety Layer                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ dry-run / 金額閾値 / 冪等性 / 監査ログ / ロールバック     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 3. セットアップ

### 3.1 必須環境変数

```bash
# freee OAuth 2.0
FREEE_CLIENT_ID=your_client_id
FREEE_CLIENT_SECRET=your_client_secret
FREEE_REDIRECT_URI=https://your-domain.com/callback/freee
FREEE_COMPANY_ID=your_company_id

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# インボイス制度
INVOICE_REGISTRATION_NUMBER=T1234567890123
```

### 3.2 オプション環境変数

```bash
# 通知
ACCOUNTING_AGENT_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ACCOUNTING_AGENT_NOTIFICATION_EMAIL=keiri@harmonicinsight.com

# freee Webhook
FREEE_WEBHOOK_VERIFICATION_TOKEN=your_token
```

### 3.3 バリデーション

```typescript
import { validateAgentConfig } from '@/insight-common/config/ai-accounting-agent';

const result = validateAgentConfig();
if (!result.valid) {
  console.error('Missing env vars:', result.missingEnvVars);
}
result.warnings.forEach(w => console.warn(w));
```

## 4. ワークフロー

### 4.1 Stripe 決済 → freee 売上計上

**トリガー**: `checkout.session.completed` (Stripe Webhook)

```
Step 1: 二重登録チェック（check_sync_status）
Step 2: Stripe 決済情報取得（stripe_get_session + lookup_product_mapping）
Step 3: freee 取引先 検索/作成（freee_list_partners → freee_create_partner）
Step 4: freee 請求書発行（freee_create_invoice）
Step 5: freee 入金取引記録（freee_create_deal）
Step 6: 同期記録保存（save_sync_record）
```

**金額閾値**: 50万円以下は自動処理。50万円超は承認必須。

### 4.2 Stripe サブスク更新 → freee 入金消込

**トリガー**: `invoice.paid` (Stripe Webhook)

```
Step 1: 二重登録チェック
Step 2: 未消込売掛金の検索（ref_number で照合）
Step 3: 入金消込（payments 追加）
Step 4: 同期記録保存
```

### 4.3 月次締め

**トリガー**: 毎月3日 AM 9:00 JST (`0 0 3 * *`)

```
Step 1: 前月の Stripe 決済一覧を取得
Step 2: freee 取引との突合（未同期を検出）
Step 3: 未同期取引の補完（承認必須）
Step 4: Stripe 手数料の一括計上
Step 5: 試算表（BS/PL）による整合性チェック
```

### 4.4 経費精算承認 → freee 経費記帳

**トリガー**: `accounting:expense_application:updated` (freee Webhook)

```
Step 1: 承認状態の確認（approved のみ処理）
Step 2: 経費取引の記帳
```

## 5. 安全制御

### 5.1 実行モード

| モード | 説明 | 用途 |
|--------|------|------|
| `dry_run` | API 書き込みをシミュレート。読み取りのみ実行。 | 初回セットアップ、テスト |
| `sandbox` | freee 開発環境に接続 | 開発・検証 |
| `live` | 本番 freee API に接続 | 本番運用 |

### 5.2 金額閾値

| 閾値 | 金額 | アクション |
|------|------|-----------|
| 自動承認上限 | 50万円以下 | 自動処理 |
| 承認必須 | 100万円以上 | human-in-the-loop で待機 |
| 月次自動上限 | 1,000万円/月 | 超過時はエラー停止 |

### 5.3 冪等性

すべてのワークフロー実行に冪等性キーが付与されます。

```
キー形式: {workflow_id}:{trigger_type}:{trigger_identifier}
例: stripe_checkout_to_freee:stripe_webhook:evt_1234567890
```

同一キーの実行は自動的にスキップされ、二重登録を防止します。

### 5.4 ロールバック

Agent が作成した freee リソース（取引・取引先・請求書）は `createdResources` に記録されます。
エラー発生時に手動ロールバックが可能です。

## 6. Claude Tool Use

Agent は以下のツールを Claude API の Tool Use として使用します。

### freee 操作ツール

| ツール名 | 種別 | 説明 |
|---------|------|------|
| `freee_create_deal` | 書込 | 取引（収入/支出）作成 |
| `freee_list_deals` | 読取 | 取引一覧取得 |
| `freee_update_deal` | 書込 | 取引更新（入金消込） |
| `freee_list_partners` | 読取 | 取引先検索 |
| `freee_create_partner` | 書込 | 取引先作成 |
| `freee_create_invoice` | 書込 | 請求書発行 |
| `freee_list_invoices` | 読取 | 請求書一覧取得 |
| `freee_list_account_items` | 読取 | 勘定科目一覧 |
| `freee_list_items` | 読取 | 品目一覧 |
| `freee_create_item` | 書込 | 品目作成 |
| `freee_get_trial_balance` | 読取 | 試算表（BS/PL）取得 |
| `freee_list_walletables` | 読取 | 口座一覧 |

### Stripe 参照ツール（読取専用）

| ツール名 | 説明 |
|---------|------|
| `stripe_get_session` | Checkout Session 詳細取得 |
| `stripe_list_charges` | 決済一覧取得 |
| `stripe_get_balance_transactions` | 残高トランザクション取得 |

### 内部ヘルパー

| ツール名 | 説明 |
|---------|------|
| `lookup_product_mapping` | 製品コード → freee 品目マッピング |
| `calculate_tax` | 消費税計算 |
| `check_sync_status` | 同期状態チェック |
| `save_sync_record` | 同期記録保存 |

## 7. 使い方

### ワークフローの取得

```typescript
import {
  getWorkflow,
  getWorkflowForStripeEvent,
  getScheduledWorkflows,
  getToolsForMode,
  toClaudeToolDefinitions,
  AGENT_MODEL_CONFIG,
  AGENT_SYSTEM_PROMPT,
} from '@/insight-common/config/ai-accounting-agent';

// Stripe イベントに対応するワークフローを取得
const workflow = getWorkflowForStripeEvent('checkout.session.completed');

// スケジュール実行ワークフロー一覧
const scheduled = getScheduledWorkflows();

// dry_run モードで使用可能なツール
const tools = getToolsForMode('dry_run');

// Claude API に渡すツール定義
const claudeTools = toClaudeToolDefinitions(tools);
```

### 承認ポリシーの判定

```typescript
import { resolveApprovalPolicy } from '@/insight-common/config/ai-accounting-agent';

// 30万円の取引 → auto（自動処理）
resolveApprovalPolicy('auto', 300_000, 500_000);

// 80万円の取引（閾値50万円） → require_approval
resolveApprovalPolicy('auto', 800_000, 500_000);

// 150万円の取引 → require_approval（金額上限超過）
resolveApprovalPolicy('auto', 1_500_000);
```

## 8. DB テーブル

### agent_executions

Agent 実行の全履歴を保持。ワークフロー ID、実行モード、ステータス、
ステップ結果、作成リソースを JSON で記録。

### agent_approval_requests

承認待ちリクエストの管理。実行 ID・ステップ・金額を記録し、
承認者・承認日時をトラッキング。

### agent_notifications

通知送信ログ。Slack・メールへの通知履歴を記録。

### stripe_freee_sync（freee-integration.ts で定義）

Stripe イベント ↔ freee リソースの対応記録。冪等性チェックに使用。

## 9. 運用チェックリスト

### 初回セットアップ

- [ ] freee 開発者アプリを登録し、OAuth クレデンシャルを取得
- [ ] 環境変数を設定（§3.1 参照）
- [ ] `validateAgentConfig()` で設定を検証
- [ ] `dry_run` モードでテスト実行
- [ ] freee 上に品目が正しく作成されることを確認
- [ ] `sandbox` モードで freee 開発環境に接続しテスト
- [ ] 本番切り替え（`live` モード）

### 月次運用

- [ ] 月次締めレポートを確認（毎月3日に自動生成）
- [ ] 未同期取引がないか確認
- [ ] 試算表の整合性を確認
- [ ] 承認待ちリクエストがないか確認
