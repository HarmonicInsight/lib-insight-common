# 統合プロンプト一覧

各アプリリポジトリで insight-common を統合するためのプロンプト集です。

---

## デスクトップアプリ統合プロンプト

既存のデスクトップアプリに insight-common を統合するためのプロンプトです。

| アプリ | プロンプト | 製品コード | 技術スタック |
|--------|-----------|-----------|-------------|
| SalesInsight | [SALESINSIGHT_SETUP.md](./SALESINSIGHT_SETUP.md) | `SALES` | Tauri + React + TypeScript |
| InsightSlide | [INSIGHTSLIDE_SETUP.md](./INSIGHTSLIDE_SETUP.md) | `SLIDE` | Python + Tkinter |
| InsightPy | [INSIGHTPY_SETUP.md](./INSIGHTPY_SETUP.md) | `PY` | Python |
| InterviewInsight | [INTERVIEWINSIGHT_SETUP.md](./INTERVIEWINSIGHT_SETUP.md) | `INTV` | TBD |

### 使い方（デスクトップアプリ）

#### Step 1: 対象アプリのリポジトリを開く

```bash
# 例: SalesInsight の場合
cd ~/projects/SalesInsight
claude  # Claude Code を起動
```

#### Step 2: プロンプトを実行

プロンプトファイルの内容をコピーして Claude Code に貼り付けます。

```
# Claude Code で以下を入力:
このアプリに insight-common を統合してください。

[SALESINSIGHT_SETUP.md の内容をここに貼り付け]
```

#### Step 3: 自動実行される処理

Claude Code が以下を自動で実行します：

1. `git submodule add` で insight-common を追加
2. ライセンスマネージャーの作成（TypeScript/Python）
3. 機能制限ゲートの実装
4. ブランドカラーの適用
5. コミット & プッシュ

---

## モバイルモジュール追加プロンプト

**insight-common リポジトリ自体に** Android/iOS 用のコードを追加するためのプロンプトです。

| プラットフォーム | プロンプト | 言語 | 追加モジュール |
|----------------|-----------|------|---------------|
| Android | [MOBILE_ANDROID_SETUP.md](./MOBILE_ANDROID_SETUP.md) | Kotlin | license, utils, errors, i18n |
| iOS | [MOBILE_IOS_SETUP.md](./MOBILE_IOS_SETUP.md) | Swift | license, utils, errors, i18n |

### 使い方（モバイルモジュール追加）

#### Step 1: insight-common リポジトリを開く

```bash
cd ~/projects/insight-common
claude  # Claude Code を起動
```

#### Step 2: プロンプトを実行

```
# Android モジュールを追加する場合:
以下の手順で Android 用モジュールを追加してください。

[MOBILE_ANDROID_SETUP.md の内容をここに貼り付け]
```

#### Step 3: 生成されるファイル

**Android (Kotlin):**
```
insight-common/
├── license/kotlin/InsightLicense.kt      # ライセンス検証
├── utils/kotlin/InsightUtils.kt          # ユーティリティ
├── errors/kotlin/InsightErrors.kt        # エラー定義
└── i18n/kotlin/InsightI18n.kt            # 多言語対応
```

**iOS (Swift):**
```
insight-common/
├── license/swift/InsightLicense.swift    # ライセンス検証
├── utils/swift/InsightUtils.swift        # ユーティリティ
├── errors/swift/InsightErrors.swift      # エラー定義
└── i18n/swift/InsightI18n.swift          # 多言語対応
```

#### Step 4: モバイルアプリでの利用

生成後、各モバイルアプリから利用します。

**Android アプリの場合:**

```bash
# モバイルアプリのリポジトリで
cd ~/projects/SalesInsightMobile-Android

# サブモジュールとして追加
git submodule add https://github.com/HarmonicInsight/insight-common.git

# settings.gradle.kts に追加
include(":insight-common")
```

```kotlin
// build.gradle.kts
dependencies {
    implementation(project(":insight-common"))
}

// Activity で使用
import com.harmonicinsight.common.license.LicenseValidator
import com.harmonicinsight.common.i18n.InsightI18n

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // i18n 初期化
        InsightI18n.init(this)

        // ライセンス検証
        val validator = LicenseValidator()
        val result = validator.validate("INS-SALES-PRO-2601-1534-A7")

        if (result.isValid) {
            val text = InsightI18n.t("common.save")  // "保存"
        }
    }
}
```

**iOS アプリの場合:**

```bash
# モバイルアプリのリポジトリで
cd ~/projects/SalesInsightMobile-iOS

# サブモジュールとして追加
git submodule add https://github.com/HarmonicInsight/insight-common.git
```

```swift
// Package.swift または Xcode プロジェクトに追加

import InsightCommon

struct ContentView: View {
    var body: some View {
        VStack {
            // i18n
            Text(t("common.save"))  // "保存"

            // ライセンス検証
            let validator = LicenseValidator()
            let result = validator.validate("INS-SALES-PRO-2601-1534-A7")
        }
    }
}
```

---

## 共通手順まとめ

### デスクトップアプリへの統合

```
┌─────────────────────┐      ┌─────────────────────┐
│   SalesInsight      │      │   insight-common    │
│   (アプリリポジトリ)  │ ──── │   (サブモジュール)    │
└─────────────────────┘      └─────────────────────┘
        ↓
   プロンプト実行で
   自動統合される
```

### モバイルモジュールの追加

```
┌─────────────────────┐
│   insight-common    │
│                     │
│ ├── license/        │
│ │   ├── typescript/ │  既存
│ │   ├── python/     │  既存
│ │   ├── kotlin/     │  ← 追加
│ │   └── swift/      │  ← 追加
│ └── ...             │
└─────────────────────┘
        ↓
   プロンプト実行で
   モバイル用コード生成
```

---

## 注意事項

### InsightSlide の場合
既存のライセンス形式（`PRO-`/`STD-`/`TRIAL-`）との互換性を維持する必要があります。
プロンプトにレガシーサポートの実装が含まれています。

### InterviewInsight の場合
旧名 `AutoInterview` からの改名が含まれています。

### モバイルアプリの場合
- **Android**: `app/src/main/assets/i18n/` に `ja.json`, `en.json` をコピー
- **iOS**: Bundle に `i18n/ja.json`, `i18n/en.json` を追加

---

## トラブルシューティング

### サブモジュールが更新されない

```bash
git submodule update --init --recursive
git submodule update --remote
```

### ライセンスキーが認証されない

1. キー形式を確認: `INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]`
2. 製品コードが一致しているか確認
3. 有効期限が切れていないか確認

### i18n が反映されない

1. JSON ファイルが正しい場所にあるか確認
2. `init()` / `configure()` が呼ばれているか確認
3. ロケールが正しく設定されているか確認
