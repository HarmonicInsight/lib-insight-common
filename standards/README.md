# Insight Series 開発標準

> 新規アプリ開発時に必ず確認するドキュメント

## 概要

このディレクトリには、Insight Seriesの各プラットフォーム向け開発標準が含まれています。
新規アプリ開発時は、該当するプラットフォームのチェックリストを**必ず**確認してください。

## プラットフォーム別ガイド

| プラットフォーム | ファイル | 主な用途 |
|----------------|---------|---------|
| C# (WPF) | [CSHARP_WPF.md](./CSHARP_WPF.md) | Windows デスクトップアプリ |
| Python | [PYTHON.md](./PYTHON.md) | CLI ツール、バックエンド |
| React/Next.js | [REACT.md](./REACT.md) | Web アプリケーション |
| Android | [ANDROID.md](./ANDROID.md) | Android アプリ |
| iOS | [IOS.md](./IOS.md) | iOS アプリ |

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
- ❌ Blue (#2563EB) をプライマリカラーとして使用
- ❌ 独自の色定義（必ず `brand/colors.json` を参照）
- ❌ ハードコードされた色値（StaticResource/変数を使用）

### 2. ライセンスシステム

全製品で標準ライセンスシステムを使用:

```
キー形式: {製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
例: INCA-STD-2601-XXXX-XXXX-XXXX
```

**プラン体系:**
| プラン | 説明 |
|-------|------|
| FREE | 基本機能のみ（機能制限あり） |
| TRIAL | 全機能利用可能（評価用、1ヶ月） |
| STD | 標準機能（12ヶ月） |
| PRO | 全機能（12ヶ月） |
| ENT | カスタマイズ（要相談） |

### 3. 製品コード

新規製品を追加する場合は `config/products.ts` に登録:

| コード | 製品名 |
|-------|-------|
| INSS | InsightSlide |
| INSP | InsightSlide Pro |
| INPY | InsightPy |
| FGIN | ForguncyInsight |
| INMV | InsightMovie |
| INBT | InsightBot |
| INCA | InsightNoCodeAnalyzer |

### 4. UI パターン

**必須コンポーネント:**
- ライセンス管理画面（Insight Slides形式に準拠）
- 製品タイトル（Gold色、中央配置）
- カードスタイル（白背景、border-radius: 12px）

## 自動チェック（CI/CD）

### 新規リポジトリへの導入

**必須:** 以下のワークフローファイルを追加してください：

```bash
# 1. .github/workflows ディレクトリ作成
mkdir -p .github/workflows

# 2. ワークフローファイルをコピー
cp lib-insight-common/templates/github-workflow-validate.yml .github/workflows/validate-standards.yml

# 3. コミット
git add .github/workflows/validate-standards.yml
git commit -m "ci: add design standards validation"
```

これにより、**PRを出すたびに自動でチェック**されます。
チェックに失敗したPRはマージできません。

### 手動チェック

ローカルで事前確認：

```bash
# 検証スクリプト実行
./lib-insight-common/scripts/validate-standards.sh .
```

## チェック内容

| チェック項目 | 説明 |
|-------------|------|
| 🔵 Blue Primary | #2563EB がプライマリとして使われていない |
| 🟡 Gold Primary | #B8942F が定義されている |
| 📄 Background | #FAF8F5 が背景色として定義されている |
| 🔑 LicenseManager | ライセンス管理クラスが実装されている |
| 📝 Key Format | ライセンスキー形式パターンが存在する |

## 違反時の対応

標準に従っていないコードは**PRがブロック**されます。
不明点がある場合は、このドキュメントまたは既存製品の実装を参照してください。

### 参考実装

| プラットフォーム | リポジトリ |
|----------------|-----------|
| C# (WPF) | app-nocode-analyzer-C |
| React | app-insight-slide-web |
| iOS | app-insight-mobile-ios |
