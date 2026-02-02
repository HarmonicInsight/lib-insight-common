# insight-common 統合プロンプト

各アプリリポジトリで insight-common を統合するためのプロンプト集です。

---

## クイックスタート

### TypeScript 製品 (SalesInsight, InterviewInsight)

```bash
# 1. 対象リポジトリに移動
cd ~/projects/SalesInsight

# 2. Claude Code を起動
claude

# 3. 以下をコピー＆ペースト
```

👉 [TYPESCRIPT_INTEGRATION.md](./TYPESCRIPT_INTEGRATION.md) の内容をコピー

### Python 製品 (InsightSlide, InsightPy)

```bash
# 1. 対象リポジトリに移動
cd ~/projects/InsightSlide

# 2. Claude Code を起動
claude

# 3. 以下をコピー＆ペースト
```

👉 [PYTHON_INTEGRATION.md](./PYTHON_INTEGRATION.md) の内容をコピー

---

## 統合プロンプト一覧

### 技術スタック別（汎用）

| 技術スタック | プロンプト | 対象製品 |
|-------------|-----------|---------|
| TypeScript (Tauri/React) | [TYPESCRIPT_INTEGRATION.md](./TYPESCRIPT_INTEGRATION.md) | SalesInsight, InterviewInsight |
| Python | [PYTHON_INTEGRATION.md](./PYTHON_INTEGRATION.md) | InsightSlide, InsightPy |

### 製品別（詳細）

| 製品 | プロンプト | 製品コード | 技術スタック |
|------|-----------|-----------|-------------|
| SalesInsight | [SALESINSIGHT_SETUP.md](./SALESINSIGHT_SETUP.md) | `SALES` | Tauri + React + TypeScript |
| InsightSlide | [INSIGHTSLIDE_SETUP.md](./INSIGHTSLIDE_SETUP.md) | `SLIDE` | Python + Tkinter |
| InsightPy | [INSIGHTPY_SETUP.md](./INSIGHTPY_SETUP.md) | `PY` | Python |
| InterviewInsight | [INTERVIEWINSIGHT_SETUP.md](./INTERVIEWINSIGHT_SETUP.md) | `IVIN` | Tauri + React + TypeScript |

### 環境構築

| 環境 | プロンプト | 説明 |
|------|-----------|------|
| GitHub Codespaces | [CODESPACES_SETUP.md](./CODESPACES_SETUP.md) | Codespaces 自動ビルド環境（CLI 自動インストール） |

### モバイルモジュール追加

insight-common 自体に Android/iOS モジュールを追加するプロンプト:

| プラットフォーム | プロンプト | 言語 |
|----------------|-----------|------|
| Android | [MOBILE_ANDROID_SETUP.md](./MOBILE_ANDROID_SETUP.md) | Kotlin |
| iOS | [MOBILE_IOS_SETUP.md](./MOBILE_IOS_SETUP.md) | Swift |

---

## 統合後のディレクトリ構成

### TypeScript 製品

```
{Repository}/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── components/
│       │   │   └── FeatureGate.tsx      ← 新規
│       │   ├── lib/
│       │   │   └── license-manager.ts   ← 新規
│       │   ├── providers/
│       │   │   └── I18nProvider.tsx     ← 新規
│       │   └── App.tsx                  ← 修正
│       ├── vite.config.ts               ← 修正
│       └── tsconfig.json                ← 修正
├── insight-common/                      ← submodule
└── tsconfig.base.json
```

### Python 製品

```
{Repository}/
├── src/
│   ├── __init__.py              ← 修正
│   ├── license_manager.py       ← 新規
│   ├── i18n_helper.py           ← 新規
│   ├── decorators.py            ← 新規
│   └── main.py
├── insight-common/              ← submodule
└── requirements.txt
```

---

## 統合で使用可能になるモジュール

| エイリアス | 内容 |
|-----------|------|
| `@insight/license` | ライセンス検証・機能制限 |
| `@insight/i18n` | 多言語対応 (ja/en) |
| `@insight/utils` | ユーティリティ関数 |
| `@insight/errors` | 共通エラー定義 |
| `@insight/brand/*` | カラー・デザインシステム |
| `@insight/ui/*` | メニュー構造・UI仕様 |
| `@insight/config/*` | 製品設定 |

詳細: [MODULES.md](../MODULES.md)

---

## 実行コマンドまとめ

### Submodule 追加

```bash
git submodule add https://github.com/HarmonicInsight/insight-common.git
git submodule update --init --recursive
```

### Submodule 更新

```bash
git submodule update --remote
git add insight-common
git commit -m "Update insight-common"
```

### トラブルシューティング

```bash
# Submodule が空の場合
git submodule update --init --recursive

# 強制的に最新に更新
git submodule foreach git pull origin main
```

---

## 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [MODULES.md](../MODULES.md) | モジュール一覧・API リファレンス |
| [SETUP_GUIDE.md](../SETUP_GUIDE.md) | 詳細な組み込み手順 |
| [QUICKSTART.md](../QUICKSTART.md) | 5分で始める |
| [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) | 統合ガイド（旧版） |
