# Insight Series 開発標溁E

> 新規アプリ開発時に忁E��確認するドキュメンチE

## 概要E

こ�EチE��レクトリには、Insight Seriesの吁E�EラチE��フォーム向け開発標準が含まれてぁE��す、E
新規アプリ開発時�E、該当する�EラチE��フォームのチェチE��リストを**忁E��**確認してください、E

## プラチE��フォーム別ガイチE

| プラチE��フォーム | ファイル | 主な用送E|
|----------------|---------|---------|
| **公開WebサイチE* | [WEBSITE.md](./WEBSITE.md) | **製品HP・会社HP・LP�E�色・チE��イン統一�E�E* |
| **アプリアイコン** | [APP_ICONS.md](./APP_ICONS.md) | **全製品�E通アイコン仕槁E* |
| **寒色系カラー標溁E* | [COOL_COLOR.md](./COOL_COLOR.md) | **業務系アプリ向け Cool Blue & Slate チE�EチE* |
| **ローカライゼーション** | [LOCALIZATION.md](./LOCALIZATION.md) | **多言語対応標準（�EプラチE��フォーム共通！E* |
| C# (WPF) | [CSHARP_WPF.md](./CSHARP_WPF.md) | Windows チE��クトップアプリ |
| Python | [PYTHON.md](./PYTHON.md) | CLI チE�Eル、バチE��エンチE|
| React/Next.js | [REACT.md](./REACT.md) | Web アプリケーション�E�アプリUI�E�E|
| Android | [ANDROID.md](./ANDROID.md) | Android アプリ |
| iOS | [IOS.md](./IOS.md) | iOS アプリ |
| **Build Doctor** | [BUILD_DOCTOR.md](./BUILD_DOCTOR.md) | **ビルドエラー自律解消エージェント（全プラットフォーム）** |

## 共通ルール�E��EプラチE��フォーム忁E��！E

### 1. チE��インシスチE���E�Evory & Gold Theme�E�E

```
Brand Primary:    #B8942F (Gold)
Background:       #FAF8F5 (Ivory)
Text Primary:     #1C1917 (Stone 900)
Text Secondary:   #57534E (Stone 600)
Border:           #E7E2DA (Warm Gray)
```

**絶対禁止:**
- ❁EBlue (#2563EB) を�Eライマリカラーとして使用
- ❁E独自の色定義�E�忁E�� `brand/colors.json` を参照�E�E
- ❁Eハ�Eドコードされた色値�E�EtaticResource/変数を使用�E�E

### 2. ライセンスシスチE��

全製品で標準ライセンスシスチE��を使用:

```
キー形弁E {製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
侁E INCA-STD-2601-XXXX-XXXX-XXXX
```

**プラン体系:**
| プラン | 説昁E| 対象 |
|-------|------|------|
| FREE | 基本機�Eのみ�E�※IOSHでは廁E��、デフォルチETRIAL�E�E|  E|
| TRIAL | 全機�E利用可能�E�評価用、E4日間！E| 評価ユーザー |
| STD | 標準機�E�E�コラボレーション機�Eを除く、E65日�E�E| 個人利用 |
| PRO | 全機�E�E�コラボレーション含む、E65日�E�E| 法人・チ�Eム |
| ENT | カスタマイズ�E�要相諁E��E| 企業 |

### 3. 製品コーチE

新規製品を追加する場合�E `config/products.ts` に登録:

| コーチE| 製品名 | 備老E|
|-------|-------|------|
| INSS | InsightOfficeSlide | |
| IOSH | InsightOfficeSheet | STD: 個人, PRO: 法人 |
| IOSD | InsightOfficeDoc | |
| INPY | InsightPy | |
| INMV | InsightCast | |
| INIG | InsightImageGen | |
| INBT | InsightBot | |
| INCA | InsightNoCodeAnalyzer | |
| IVIN | InterviewInsight | |

### 4. UI パターン

**忁E��コンポ�EネンチE**
- ライセンス管琁E��面�E�Ensight Slides形式に準拠�E�E
- 製品タイトル�E�Eold色、中央配置�E�E
- カードスタイル�E�白背景、border-radius: 12px�E�E

## 自動チェチE���E�EI/CD�E�E

### 新規リポジトリへの導�E

**忁E��E** 以下�Eワークフローファイルを追加してください�E�E

```bash
# 1. .github/workflows チE��レクトリ作�E
mkdir -p .github/workflows

# 2. ワークフローファイルをコピ�E
cp insight-common/templates/github-workflow-validate.yml .github/workflows/validate-standards.yml

# 3. コミッチE
git add .github/workflows/validate-standards.yml
git commit -m "ci: add design standards validation"
```

これにより、E*PRを�Eすたびに自動でチェチE��**されます、E
チェチE��に失敗したPRはマ�Eジできません、E

### 手動チェチE��

ローカルで事前確認！E

```bash
# 検証スクリプト実衁E
./insight-common/scripts/validate-standards.sh .
```

## チェチE��冁E��

| チェチE��頁E�� | 説昁E|
|-------------|------|
| 🔵 Blue Primary | #2563EB が�Eライマリとして使われてぁE��ぁE|
| 🟡 Gold Primary | #B8942F が定義されてぁE�� |
| 📄 Background | #FAF8F5 が背景色として定義されてぁE�� |
| 🔑 LicenseManager | ライセンス管琁E��ラスが実裁E��れてぁE�� |
| 📝 Key Format | ライセンスキー形式パターンが存在する |

## 違反時�E対忁E

標準に従ってぁE��ぁE��ード�E**PRがブロチE��**されます、E
不�E点がある場合�E、このドキュメントまた�E既存製品�E実裁E��参�Eしてください、E

### 参老E��裁E

| プラチE��フォーム | リポジトリ |
|----------------|-----------|
| C# (WPF) | win-app-nocode-analyzer |
| React | web-app-insight-process |
| iOS | ios-app-insight-cast |
