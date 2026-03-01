# Insight Series 開発標準

> 新規アプリ開発時に必ず確認するドキュメント

## 概要

このディレクトリには、Insight Seriesの全プラットフォーム向け開発標準が含まれています。
新規アプリ開発時は、該当するプラットフォームのチェックリストを**必ず**確認してください。

## プラットフォーム別ガイド

| プラットフォーム | ファイル | 主な用途 |
|----------------|---------|---------|
| **公開Webサイト** | [WEBSITE.md](./WEBSITE.md) | **製品HP・会社HP・LPの色・デザイン統一** |
| **アプリアイコン** | [APP_ICONS.md](./APP_ICONS.md) | **全製品共通アイコン仕様** |
| **寒色系カラー標準** | [COOL_COLOR.md](./COOL_COLOR.md) | **業務系アプリ向け Cool Blue & Slate テーマ** |
| **ローカライゼーション** | [LOCALIZATION.md](./LOCALIZATION.md) | **多言語対応標準（全プラットフォーム共通）** |
| C# (WPF) | [CSHARP_WPF.md](./CSHARP_WPF.md) | Windows デスクトップアプリ |
| Python | [PYTHON.md](./PYTHON.md) | CLI ツール、バックエンド |
| React/Next.js | [REACT.md](./REACT.md) | Web アプリケーション（アプリUI） |
| Android | [ANDROID.md](./ANDROID.md) | Android アプリ |
| iOS | [IOS.md](./IOS.md) | iOS アプリ |
| **Build Doctor** | [BUILD_DOCTOR.md](./BUILD_DOCTOR.md) | **ビルドエラー自律解消エージェント（全プラットフォーム）** |

## 共通ルール（全プラットフォーム必須）

### 1. デザインシステム（Ivory & Gold Theme）

```
Brand Primary:    #B8942F (Gold)
Background:       #FAF8F5 (Ivory)
Text Primary:     #1C1917 (Stone 900)
Text Secondary:   #57534E (Stone 600)
Border:           #E7E2DA (Warm Gray)
```

**絶対禁止:**
- Blue (#2563EB) をプライマリカラーとして使用
- 独自の色定義（必ず `brand/colors.json` を参照）
- ハードコードされた色値（StaticResource/変数を使用）

### 2. ライセンスシステム

全製品で標準ライセンスシステムを使用:

```
キー形式: {製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
例: INCA-STD-2601-XXXX-XXXX-XXXX
```

**プラン体系:**
| プラン | 説明 | 対象 |
|-------|------|------|
| TRIAL | 全機能利用可能（評価用、30日間）| 評価ユーザー |
| STD | 標準機能（コラボレーション機能を除く、365日） | 個人利用 |
| PRO | 全機能（コラボレーション含む、365日） | 法人・チーム |
| ENT | カスタマイズ（要相談） | 企業 |

### 3. 製品コード

新規製品を追加する場合は `config/products.ts` に登録:

| コード | 製品名 | 備考 |
|-------|-------|------|
| INSS | Insight Deck Quality Gate | |
| IOSH | Insight Performance Management | STD: 個人, PRO: 法人 |
| IOSD | Insight AI Doc Factory | |
| INPY | InsightPy | |
| INMV | Insight Training Studio | |
| INIG | InsightImageGen | |
| INBT | InsightBot | |
| INCA | InsightNoCodeAnalyzer | |
| IVIN | InterviewInsight | |

### 4. UI パターン

**必須コンポーネント:**
- ライセンス管理画面（Insight Slides形式に準拠）
- 製品タイトル（Gold色、中央配置）
- カードスタイル（白背景、border-radius: 12px）

## 自動チェック（CI/CD）

### 新規リポジトリへの導入

**必須:** 以下のワークフローファイルを追加してください。

```bash
# 1. .github/workflows ディレクトリ作成
mkdir -p .github/workflows

# 2. ワークフローファイルをコピー
cp insight-common/templates/github-workflow-validate.yml .github/workflows/validate-standards.yml

# 3. コミット
git add .github/workflows/validate-standards.yml
git commit -m "ci: add design standards validation"
```

これにより、**PRを出すたびに自動でチェック**されます。
チェックに失敗したPRはマージできません。

### 手動チェック

ローカルで事前確認:

```bash
# 検証スクリプト実行
./insight-common/scripts/validate-standards.sh .
```

## チェック内容

| チェック項目 | 説明 |
|-------------|------|
| Blue Primary | #2563EB がプライマリとして使われていない |
| Gold Primary | #B8942F が定義されている |
| Background | #FAF8F5 が背景色として定義されている |
| LicenseManager | ライセンス管理クラスが実装されている |
| Key Format | ライセンスキー形式パターンが存在する |

## 違反時の対応

標準に従っていないコードは**PRがブロック**されます。
不明点がある場合は、このドキュメントまたは既存製品の実装を参照してください。

### 参考実装

| プラットフォーム | リポジトリ |
|----------------|-----------|
| C# (WPF) | win-app-nocode-analyzer |
| React | web-app-insight-process |
| iOS | ios-app-insight-cast |
