# Harmonic Insight — Claude Code Plugin

Harmonic Insight の開発標準をすべて Claude Code プラグインとしてパッケージ化。
Ivory & Gold デザインシステム、プラットフォーム別標準、製品設定、デプロイパターンをコマンド一つで適用可能。

## インストール

### 開発時（ローカルテスト）

```bash
claude --plugin-dir ./insight-common/plugins/harmonic-insight
```

### プロジェクトに設定

`.claude/settings.json`:
```json
{
  "plugins": ["./insight-common/plugins/harmonic-insight"]
}
```

## コマンド一覧（ユーザー起動）

| コマンド | 説明 | 例 |
|---------|------|-----|
| `/harmonic-insight:new-app` | 新規アプリ作成ウィザード | `/harmonic-insight:new-app my-app` |
| `/harmonic-insight:setup` | 既存プロジェクトに統合 | `/harmonic-insight:setup IOSH` |
| `/harmonic-insight:validate` | 開発標準検証 | `/harmonic-insight:validate .` |
| `/harmonic-insight:build-fix` | ビルドエラー自動修正 | `/harmonic-insight:build-fix vercel` |
| `/harmonic-insight:pricing` | 価格・販売戦略参照 | `/harmonic-insight:pricing INSS STD` |
| `/harmonic-insight:deploy-railway` | Railway デプロイ | `/harmonic-insight:deploy-railway` |
| `/harmonic-insight:deploy-cloudflare` | Cloudflare デプロイ | `/harmonic-insight:deploy-cloudflare` |
| `/harmonic-insight:deploy-vercel` | Vercel デプロイ | `/harmonic-insight:deploy-vercel` |

## スキル一覧（自動適用）

Claude が作業コンテキストに応じて自動的に適用するドメイン知識:

### デザインシステム

| スキル | 発動条件 |
|--------|---------|
| `design-system` | UI 実装、カラー指定、スタイル変更 |

### プラットフォーム別

| スキル | 発動条件 |
|--------|---------|
| `wpf` | .cs / .xaml / .csproj ファイル作業 |
| `react` | .tsx / .jsx / Next.js 設定作業 |
| `python-app` | .py / requirements.txt 作業 |
| `android` | Kotlin / Android XML 作業 |
| `ios` | Swift / SwiftUI 作業 |

### ドメイン別

| スキル | 発動条件 |
|--------|---------|
| `ai-assistant` | AI 機能実装、Claude API 統合 |
| `licensing` | ライセンス機能実装 |
| `product-config` | 製品設定、価格変更 |

### デプロイ

| スキル | 発動条件 |
|--------|---------|
| `deploy-railway` | Railway デプロイ作業 |
| `deploy-cloudflare` | Cloudflare デプロイ作業 |
| `deploy-vercel` | Vercel デプロイ作業 |

## エージェント

| エージェント | 役割 |
|-------------|------|
| `standards-reviewer` | コード変更後に開発標準への準拠を自動レビュー |

## Hooks

| イベント | 動作 |
|---------|------|
| `PostToolUse` (Write/Edit) | カラー違反、禁止パターンの自動検出 |

## プラグイン構造

```
plugins/harmonic-insight/
├── .claude-plugin/
│   └── plugin.json              # マニフェスト
├── skills/                      # 自動適用スキル（12個）
│   ├── design-system/SKILL.md   # Ivory & Gold デザインシステム
│   ├── wpf/SKILL.md             # C# WPF 標準
│   ├── react/SKILL.md           # React/Next.js 標準
│   ├── python-app/SKILL.md      # Python 標準
│   ├── android/SKILL.md         # Android 標準
│   ├── ios/SKILL.md             # iOS 標準
│   ├── ai-assistant/SKILL.md    # AI アシスタント標準
│   ├── licensing/SKILL.md       # ライセンス標準
│   ├── product-config/SKILL.md  # 製品設定
│   ├── deploy-railway/SKILL.md  # Railway パターン
│   ├── deploy-cloudflare/SKILL.md # Cloudflare パターン
│   └── deploy-vercel/SKILL.md   # Vercel パターン
├── commands/                    # ユーザー起動コマンド（5個）
│   ├── new-app.md               # 新規アプリ作成
│   ├── setup.md                 # 既存プロジェクト統合
│   ├── validate.md              # 標準検証
│   ├── build-fix.md             # ビルドエラー修正
│   └── pricing.md               # 価格参照
├── agents/                      # エージェント（1個）
│   └── standards-reviewer.md    # 標準準拠レビュアー
├── hooks/                       # フック
│   └── hooks.json               # PostToolUse 自動チェック
└── README.md
```

## 設計思想

このプラグインは insight-common に既に定義されている以下の資産をプラグイン形式にマッピング:

| 既存資産 | プラグインでの形式 | 適用方式 |
|---------|------------------|---------|
| `standards/CSHARP_WPF.md` | `skills/wpf/SKILL.md` | 自動（.cs/.xaml 作業時） |
| `standards/REACT.md` | `skills/react/SKILL.md` | 自動（.tsx 作業時） |
| `standards/PYTHON.md` | `skills/python-app/SKILL.md` | 自動（.py 作業時） |
| `standards/ANDROID.md` | `skills/android/SKILL.md` | 自動 |
| `standards/IOS.md` | `skills/ios/SKILL.md` | 自動 |
| `standards/AI_ASSISTANT.md` | `skills/ai-assistant/SKILL.md` | 自動（AI 機能作業時） |
| `brand/colors.json` | `skills/design-system/SKILL.md` | 自動（UI 作業時） |
| `config/products.ts` | `skills/product-config/SKILL.md` | 自動 |
| `prompts/new-app.md` | `commands/new-app.md` | `/harmonic-insight:new-app` |
| `skills/build-auto-fix/` | `commands/build-fix.md` | `/harmonic-insight:build-fix` |
| `scripts/validate-standards.sh` | `commands/validate.md` | `/harmonic-insight:validate` |

## ライセンス

UNLICENSED — Harmonic Insight 内部使用
