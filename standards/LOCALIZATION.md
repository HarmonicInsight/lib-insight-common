# ローカライゼーション標準

> **すべての HARMONIC insight 製品は、このドキュメントのローカライゼーション要件に準拠すること。**
> 新規作成・修正時・ストアリリース前に必ず確認。

---

## 1. 基本方針

| 項目 | 標準値 |
|------|--------|
| **デフォルト言語** | 日本語 (`ja`) |
| **必須対応言語** | 日本語 (`ja`) + 英語 (`en`) |
| **将来対応予定** | 韓国語 (`ko`)、中国語 (`zh`)、タイ語 (`th`)、ベトナム語 (`vi`) |
| **翻訳リソース管理** | insight-common `i18n/` ディレクトリで共通管理 |
| **ハードコード禁止** | UI テキストの直接埋め込みは全プラットフォームで禁止 |

### 市場展開との連携

```
Phase 1（日本市場）: ja + en（必須）
Phase 2（東南アジア）: + th, vi（推奨）
Phase 3（韓国・その他）: + ko, zh（推奨）
```

> 販売戦略（`config/sales-strategy.ts`）の Phase と連動。新市場進出時にロケールを追加。

---

## 2. 共通翻訳リソース（`i18n/`）

insight-common の `i18n/` ディレクトリに全製品共通の翻訳キーが管理されています。
アプリ固有のキーはアプリ側で拡張し、共通キーは insight-common から参照してください。

### キー構造

```
common.*        # 共通 UI 要素（保存、キャンセル、削除 等）
license.*       # ライセンス関連（アクティベート、プラン名 等）
feature.*       # 機能制限関連（ロック、アップグレード 等）
auth.*          # 認証関連（ログイン、パスワード 等）
settings.*      # 設定画面（言語、テーマ 等）
file.*          # ファイル操作（開く、保存、エクスポート 等）
date.*          # 日付・時刻（フォーマット定義含む）
validation.*    # バリデーション（必須、文字数制限 等）
errors.*        # エラーメッセージ（ネットワーク、タイムアウト 等）
products.*      # 製品名（INSS, IOSH 等）
company.*       # 会社情報（著作権、利用規約 等）
```

### パラメータ置換

翻訳テキスト内のパラメータは `{paramName}` 形式で定義:

```
"trialDaysLeft": "トライアル残り{days}日"
"maxFiles": "ファイル数が上限（{max}件）に達しています"
"copyright": "© {year} HARMONIC insight. All rights reserved."
```

---

## 3. プラットフォーム別実装

### 3.1 Android (Kotlin / Jetpack Compose)

#### ディレクトリ構成

```
app/src/main/res/
├── values/
│   └── strings.xml          # 日本語（デフォルト）
├── values-en/
│   └── strings.xml          # 英語
├── values-ko/               # Phase 3
│   └── strings.xml          # 韓国語
└── values-th/               # Phase 2
    └── strings.xml          # タイ語
```

#### ルール

| ルール | 説明 |
|--------|------|
| **ハードコード禁止** | Compose 内の文字列リテラル禁止。`stringResource(R.string.xxx)` を使用 |
| **デフォルト = 日本語** | `values/strings.xml` は日本語 |
| **英語必須** | `values-en/strings.xml` は必ず作成 |
| **プレースホルダー** | `%1$s`（文字列）、`%1$d`（整数）を使用 |
| **複数形** | `<plurals>` リソースを使用 |

#### 実装例

```xml
<!-- values/strings.xml (日本語) -->
<resources>
    <string name="app_name">Insight Camera</string>
    <string name="capture_button">撮影</string>
    <string name="flash_auto">自動</string>
    <string name="flash_on">オン</string>
    <string name="flash_off">オフ</string>
    <string name="photos_count">%1$d 枚の写真</string>
    <string name="error_camera_permission">カメラの使用を許可してください</string>
</resources>
```

```xml
<!-- values-en/strings.xml (英語) -->
<resources>
    <string name="app_name">Insight Camera</string>
    <string name="capture_button">Capture</string>
    <string name="flash_auto">Auto</string>
    <string name="flash_on">On</string>
    <string name="flash_off">Off</string>
    <string name="photos_count">%1$d photos</string>
    <string name="error_camera_permission">Please allow camera access</string>
</resources>
```

```kotlin
// Compose での使用
@Composable
fun CaptureButton() {
    Button(onClick = { /* ... */ }) {
        Text(stringResource(R.string.capture_button))  // ✅ 正しい
        // Text("撮影")  // ❌ ハードコード禁止
    }
}

// パラメータ付き
Text(stringResource(R.string.photos_count, photoCount))
```

#### Play ストア向けローカライゼーション

Play ストアリリース時は、ストアのメタデータも多言語化する:

```
fastlane/metadata/android/
├── ja-JP/                      # 日本語（デフォルト）
│   ├── title.txt               # アプリ名（30文字以内）
│   ├── short_description.txt   # 短い説明（80文字以内）
│   ├── full_description.txt    # 完全な説明（4000文字以内）
│   └── changelogs/
│       └── default.txt         # リリースノート（500文字以内）
└── en-US/                      # 英語
    ├── title.txt
    ├── short_description.txt
    ├── full_description.txt
    └── changelogs/
        └── default.txt
```

> Fastlane を使用しない場合でも、上記構造でメタデータを管理し、Play Console に手動入力する。

---

### 3.2 iOS (Swift / SwiftUI)

#### ディレクトリ構成

```
YourApp/
├── Localizable.xcstrings       # Xcode 15+ String Catalog（推奨）
│   または
├── Resources/
│   ├── ja.lproj/
│   │   └── Localizable.strings # 日本語
│   └── en.lproj/
│       └── Localizable.strings # 英語
└── InfoPlist.xcstrings          # Info.plist のローカライゼーション
```

#### ルール

| ルール | 説明 |
|--------|------|
| **String Catalog 推奨** | Xcode 15+ では `.xcstrings` 形式を使用 |
| **デフォルト = 日本語** | Development Language を `ja` に設定 |
| **英語必須** | 英語のローカライゼーションは必ず追加 |
| **NSLocalizedString** | SwiftUI では `LocalizedStringKey` が自動適用 |

#### 実装例

```swift
// SwiftUI では文字列リテラルが自動的に LocalizedStringKey として扱われる
Text("撮影")  // ✅ Localizable.xcstrings から自動解決

// パラメータ付き
Text("残り\(days)日")

// 明示的に NSLocalizedString を使う場合
let message = NSLocalizedString("camera_permission_required", comment: "カメラ権限要求")
```

#### App Store 向けローカライゼーション

```
fastlane/metadata/
├── ja/
│   ├── name.txt                # アプリ名（30文字以内）
│   ├── subtitle.txt            # サブタイトル（30文字以内）
│   ├── description.txt         # 説明
│   ├── keywords.txt            # キーワード（100文字以内）
│   ├── release_notes.txt       # リリースノート
│   └── promotional_text.txt    # プロモーションテキスト
└── en-US/
    ├── name.txt
    ├── subtitle.txt
    ├── description.txt
    ├── keywords.txt
    ├── release_notes.txt
    └── promotional_text.txt
```

---

### 3.3 React / Next.js

#### ディレクトリ構成

```
src/lib/i18n/
├── translations.ts       # 翻訳定義（型安全）
├── context.tsx           # I18nProvider + useI18n フック
└── index.ts              # エクスポート
```

> insight-common の `i18n/react-template/` をコピーして使用。

#### ルール

| ルール | 説明 |
|--------|------|
| **型安全** | `TranslationKeys` 型でコンパイル時チェック |
| **Context API** | `I18nProvider` + `useI18n()` フックで言語切替 |
| **ブラウザ検出** | 初回アクセス時に `navigator.language` で自動検出 |
| **永続化** | 言語設定は `localStorage` に保存 |

#### 実装例

```typescript
// translations.ts
export const translations = {
  ja: {
    common: { save: '保存', cancel: 'キャンセル' },
    // ...
  },
  en: {
    common: { save: 'Save', cancel: 'Cancel' },
    // ...
  },
} as const;
```

```tsx
// コンポーネントでの使用
function MyComponent() {
  const { t } = useI18n();
  return <button>{t.common.save}</button>;  // ✅ 型安全
}
```

---

### 3.4 C# (WPF)

#### ディレクトリ構成

```
YourApp/
├── Resources/
│   ├── Strings.ja.resx          # 日本語（デフォルト）
│   ├── Strings.en.resx          # 英語
│   └── Strings.resx             # フォールバック（= 日本語）
└── Helpers/
    └── LocalizationHelper.cs    # ロケール切替ヘルパー
```

#### ルール

| ルール | 説明 |
|--------|------|
| **resx ファイル** | `Properties/Resources.resx` または独自の resx ファイルで管理 |
| **デフォルト = 日本語** | `Strings.resx` (フォールバック) は日本語 |
| **英語必須** | `Strings.en.resx` は必ず作成 |
| **バインディング** | XAML では `{x:Static}` または `DynamicResource` 経由でアクセス |
| **設定保存** | 言語設定は `settings.json` に保存 |

#### 実装例

```csharp
// リソースからの取得
string label = Properties.Resources.SaveButton; // "保存" or "Save"

// 実行時の言語切替
Thread.CurrentThread.CurrentUICulture = new CultureInfo("en");
```

```xml
<!-- XAML でのバインディング -->
<Button Content="{x:Static props:Resources.SaveButton}" />
```

---

### 3.5 Python

#### ディレクトリ構成

```
your_app/
├── i18n/
│   ├── __init__.py              # i18n ヘルパー（insight-common から流用）
│   ├── ja.json                  # 日本語
│   └── en.json                  # 英語
```

> insight-common の `i18n/__init__.py` + `ja.json` / `en.json` をコピーして使用。

#### 実装例

```python
from your_app.i18n import t, set_locale, detect_locale

# 自動検出
set_locale(detect_locale())

# 使用
print(t('common.save'))  # "保存" or "Save"
print(t('license.trialDaysLeft', {'days': 14}))
```

---

## 4. 命名規則

### 翻訳キーの命名

| プラットフォーム | 命名規則 | 例 |
|----------------|---------|-----|
| **Android** | `snake_case` | `camera_permission_required` |
| **iOS** | `snake_case` または自然文 | `camera_permission_required` |
| **React/TS** | `camelCase` (ネスト) | `camera.permissionRequired` |
| **C# (WPF)** | `PascalCase` | `CameraPermissionRequired` |
| **Python** | `dot.separated` | `camera.permission_required` |

### 共通キーの対応表

insight-common の共通キーとプラットフォーム固有キーの対応:

| insight-common (`i18n/ja.json`) | Android (`strings.xml`) | iOS | React |
|------|---------|-----|-------|
| `common.save` | `save` | `"保存"` | `t.common.save` |
| `common.cancel` | `cancel` | `"キャンセル"` | `t.common.cancel` |
| `license.activate` | `license_activate` | `"アクティベート"` | `t.license.activate` |
| `errors.network` | `error_network` | `"ネットワークエラー"` | `t.errors.network` |

---

## 5. 日付・数値のフォーマット

### 日付フォーマット

| ロケール | 短い形式 | 長い形式 | 日時 |
|---------|---------|---------|------|
| `ja` | `YYYY/MM/DD` | `YYYY年MM月DD日` | `YYYY/MM/DD HH:mm` |
| `en` | `MM/DD/YYYY` | `MMMM D, YYYY` | `MM/DD/YYYY h:mm A` |

### 数値フォーマット

| ロケール | 通貨 | 千区切り | 小数点 |
|---------|------|---------|--------|
| `ja` | `¥1,000` | `,` | `.` |
| `en` | `$1,000.00` | `,` | `.` |

### 実装

```typescript
// insight-common の日付フォーマット定義を使用
import { t } from '@insight/i18n';

const format = t('date.formats.long');  // "YYYY年MM月DD日" or "MMMM D, YYYY"
```

---

## 6. ストアリリース向けチェックリスト

### Android（Play ストア）

- [ ] `values/strings.xml` に全 UI テキストが抽出されている（ハードコードなし）
- [ ] `values-en/strings.xml` が存在し、全キーが翻訳されている
- [ ] Compose 内で `stringResource()` を使用している
- [ ] Play ストアのメタデータ（タイトル・説明・リリースノート）が日英で用意されている
- [ ] スクリーンショットが日英で用意されている

### iOS（App Store）

- [ ] `Localizable.xcstrings` または `.lproj` で全テキストが管理されている
- [ ] 英語ローカライゼーションが追加されている
- [ ] App Store メタデータ（名前・説明・キーワード）が日英で用意されている
- [ ] スクリーンショットが日英で用意されている

### Web アプリ

- [ ] `translations.ts` に全テキストが定義されている
- [ ] `I18nProvider` がアプリルートでラップされている
- [ ] 言語切替 UI が設定画面に存在する
- [ ] `<html lang="ja">` が動的に更新される

### C# (WPF)

- [ ] `.resx` ファイルで全テキストが管理されている
- [ ] 英語リソースファイルが存在する
- [ ] 言語切替が設定画面から可能
- [ ] 言語設定が `settings.json` に保存される

### 全プラットフォーム共通

- [ ] 日本語がデフォルト言語として設定されている
- [ ] 英語翻訳が完全に用意されている
- [ ] パラメータ付き文字列が正しく動作する
- [ ] 日付・数値のフォーマットがロケールに応じて変わる
- [ ] RTL（右から左）レイアウトは現時点では不要（対応言語に含まれない）

---

## 7. 翻訳ワークフロー

### 新しいテキストの追加手順

```
1. デフォルト言語（日本語）でテキストを追加
2. 英語翻訳を追加
3. insight-common の共通キーに該当する場合は、共通リソースのキー名に合わせる
4. プラットフォーム固有のテキストはアプリ内で管理
5. validate-standards.sh で未翻訳キーがないか確認
```

### 新しい言語の追加手順

```
1. insight-common の i18n/ に {locale}.json を追加（ja.json をコピーして翻訳）
2. TypeScript: i18n/index.ts の Locale 型と LOCALES に追加
3. Python: i18n/__init__.py の LOCALES に追加
4. Android: values-{locale}/ ディレクトリを作成し strings.xml を追加
5. iOS: Localizable.xcstrings に言語を追加
6. React: translations.ts に言語を追加
7. C#: Strings.{locale}.resx を追加
8. config/localization.ts の SUPPORTED_LOCALES に追加
```

---

## 8. 禁止事項

| ❌ やってはいけない | ✅ 正しいやり方 |
|-------------------|----------------|
| UI テキストのハードコード | リソースファイル / 翻訳定義から参照 |
| 日付フォーマットのハードコード | ロケール対応のフォーマッター使用 |
| 翻訳キーの重複定義 | insight-common の共通キーを参照 |
| 英語翻訳の省略 | 全キーの英語翻訳を必ず追加 |
| 文字列の連結で文章を構成 | パラメータ置換 (`{param}` / `%1$s`) を使用 |
| 言語固有のレイアウト前提 | テキスト長の変動を考慮した柔軟なレイアウト |

---

## 9. 検証

```bash
# 全プラットフォーム共通の標準検証（i18n チェック含む）
./insight-common/scripts/validate-standards.sh <project-directory>
```

**検証内容:**
- Android: `values/strings.xml` と `values-en/strings.xml` の存在・キー一致
- Compose/Kotlin ファイルにハードコード文字列がないか
- 翻訳キーの不一致チェック
