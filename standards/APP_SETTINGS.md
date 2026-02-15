# アプリ設定画面 標準ガイド

> **対象**: Play Store 公開する全 Android アプリ（Insight ユーティリティアプリ群）
>
> **目的**: 設定画面の構成・法的情報・会社情報を全アプリで統一する

---

## 1. 対象アプリ

| アプリ | パッケージ名 | リポジトリ |
|-------|------------|-----------|
| Voice Task Calendar | `com.harmonicinsight.voicetask` | `android-app-voice-tesk-calendar` |
| Voice Clock | `com.insightvoiceclock` | `android-app-insight-voice-clock` |
| スッキリカメラ | `com.harmonic.insight.camera` | `android-app-insight-camera` |
| Insight QR | `com.harmonicinsight.insightqr` | `android-app-insight-qr` |

---

## 2. 設定画面の標準構成

全アプリの設定画面は以下の順序でセクションを配置する。

```
┌────────────────────────────────────────┐
│  設定                                  │  ← TopAppBar
├────────────────────────────────────────┤
│                                        │
│  ┌── アプリ固有の設定 ──────────────┐  │  ← アプリごとに異なる
│  │  例: URLを自動で開く  [toggle]   │  │
│  │  例: 触覚フィードバック [toggle]  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌── 外観 ──────────────────────────┐  │  ← 全アプリ共通
│  │  ダークモード         [toggle]   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌── {アプリ名}について ────────────┐  │  ← 全アプリ共通
│  │  バージョン            1.0.0     │  │
│  │  開発元         HARMONIC insight │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌── 法的情報 ──────────────────────┐  │  ← 全アプリ共通
│  │  プライバシーポリシー        →   │  │  → ブラウザで開く
│  │  利用規約                    →   │  │  → ブラウザで開く
│  │  オープンソースライセンス    →   │  │  → アプリ内画面
│  └──────────────────────────────────┘  │
│                                        │
│  © 2026 HARMONIC insight.              │
│  All rights reserved.                  │
│                                        │
└────────────────────────────────────────┘
```

### 2.1 アプリ固有の設定（各アプリで定義）

アプリの主要機能に関連する設定項目。セクションヘッダーは「一般」。

| アプリ | 固有設定の例 |
|-------|------------|
| Voice Task Calendar | テーマ（ライト/ダーク/システム）、リマインダー通知 |
| Voice Clock | （なし — 外観セクションのみ） |
| スッキリカメラ | （なし — 外観セクションのみ） |
| Insight QR | URLを自動で開く、触覚フィードバック、履歴保存、URL安全性チェック |

### 2.2 外観セクション（共通）

| 項目 | 種別 | 説明 |
|------|------|------|
| ダークモード | Toggle | ダークテーマの ON/OFF |

> テーマ選択（ライト/ダーク/システム）を提供するアプリは、このセクションの代わりに
> アプリ固有の設定内で 3 択のラジオボタンを使用してもよい。

### 2.3 このアプリについてセクション（共通）

| 項目 | 種別 | 値 |
|------|------|-----|
| バージョン | 表示のみ | `BuildConfig.VERSION_NAME` から取得 |
| 開発元 | 表示のみ | `HARMONIC insight`（固定） |

### 2.4 法的情報セクション（共通 - 必須）

| 項目 | 種別 | 遷移先 |
|------|------|--------|
| プライバシーポリシー | 外部リンク | `https://www.insight-office.com/ja/privacy` |
| 利用規約 | 外部リンク | `https://www.insight-office.com/ja/terms` |
| オープンソースライセンス | アプリ内遷移 | OssLicensesMenuActivity または独自画面 |

---

## 3. 法的情報 URL（全アプリ共通）

```
プライバシーポリシー: https://www.insight-office.com/ja/privacy
利用規約:             https://www.insight-office.com/ja/terms
```

> **重要**: これらの URL は Play Store Console の「データ セーフティ」セクションにも
> 登録する URL と同一にすること。

---

## 4. 実装ガイド

### 4.1 文字列リソースの追加

`android/settings/` に標準の strings XML テンプレートが用意されている。

```bash
# 日本語（values/strings.xml にマージ）
cat insight-common/android/settings/strings_settings.xml

# 英語（values-en/strings.xml にマージ）
cat insight-common/android/settings/strings_settings_en.xml
```

各アプリの `strings.xml` に、テンプレートの文字列定義をコピーする。

### 4.2 URL を開く共通処理（Kotlin）

```kotlin
/**
 * URL を安全にブラウザで開く
 */
fun Context.safeOpenUrl(url: String) {
    try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    } catch (e: ActivityNotFoundException) {
        Toast.makeText(
            this,
            getString(R.string.settings_url_open_error),
            Toast.LENGTH_SHORT
        ).show()
    }
}
```

### 4.3 設定画面の Composable 実装例

```kotlin
@Composable
fun StandardSettingsFooter(
    appName: String,
    context: Context = LocalContext.current,
) {
    val versionName = remember {
        context.packageManager
            .getPackageInfo(context.packageName, 0)
            .versionName ?: "unknown"
    }

    // ── このアプリについて ──
    SettingsSectionHeader(
        title = stringResource(R.string.settings_about, appName)
    )
    InsightCard {
        SettingInfoRow(
            title = stringResource(R.string.settings_version),
            value = versionName,
        )
        HorizontalDivider()
        SettingInfoRow(
            title = stringResource(R.string.settings_developer),
            value = stringResource(R.string.settings_developer_name),
        )
    }

    Spacer(modifier = Modifier.height(16.dp))

    // ── 法的情報 ──
    SettingsSectionHeader(
        title = stringResource(R.string.settings_legal)
    )
    InsightCard {
        SettingLinkRow(
            title = stringResource(R.string.settings_privacy_policy),
            onClick = { context.safeOpenUrl(context.getString(R.string.url_privacy_policy)) },
        )
        HorizontalDivider()
        SettingLinkRow(
            title = stringResource(R.string.settings_terms_of_service),
            onClick = { context.safeOpenUrl(context.getString(R.string.url_terms_of_service)) },
        )
        HorizontalDivider()
        SettingLinkRow(
            title = stringResource(R.string.settings_oss_licenses),
            onClick = { /* OssLicensesMenuActivity or custom screen */ },
        )
    }

    Spacer(modifier = Modifier.height(24.dp))

    // ── コピーライト ──
    Text(
        text = stringResource(
            R.string.settings_copyright,
            java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
        ),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth(),
    )
}
```

### 4.4 Ivory & Gold テーマでの設定画面スタイル

設定画面も Ivory & Gold テーマに従う。

| 要素 | カラー | 補足 |
|------|--------|------|
| 背景 | `#FAF8F5` (Ivory) | `MaterialTheme.colorScheme.background` |
| カード | `#FFFFFF` | `MaterialTheme.colorScheme.surface` |
| セクションヘッダー | `#B8942F` (Gold) | `MaterialTheme.colorScheme.primary` |
| テキスト | `#1C1917` | `MaterialTheme.colorScheme.onBackground` |
| サブテキスト | `#57534E` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| ボーダー | `#E7E2DA` | `MaterialTheme.colorScheme.outline` |
| トグル ON | `#B8942F` (Gold) | `Switch.colors(checkedThumbColor = primary)` |
| リンク矢印 | `#57534E` | `Icons.AutoMirrored.Filled.KeyboardArrowRight` |

---

## 5. Play Store Data Safety セクション

### 各アプリのデータ収集状況

| アプリ | データ収集 | Firebase | 補足 |
|-------|:--------:|:--------:|------|
| Voice Task Calendar | なし | なし | 全データローカル保存 |
| Voice Clock | あり | Crashlytics + Analytics | クラッシュログ・使用統計 |
| スッキリカメラ | なし | なし | 写真・動画はデバイスに保存 |
| Insight QR | なし | なし | スキャン履歴はローカル暗号化保存 |

### Data Safety 回答テンプレート（データ収集なしのアプリ）

> **Does your app collect or share any of the required user data types?**
> No, this app does not collect or share user data.
>
> **Is all of the user data collected by your app encrypted in transit?**
> Yes (該当する場合)
>
> **Do you provide a way for users to request that their data is deleted?**
> Not applicable (データ収集なし)

### Data Safety 回答テンプレート（Firebase 使用のアプリ）

> **Does your app collect or share any of the required user data types?**
> Yes
>
> **Data collected:**
> - Crash logs (App performance → Crash logs) — Collected, not shared
> - App interactions (App activity → App interactions) — Collected, not shared
>
> **Is all of the user data collected by your app encrypted in transit?**
> Yes
>
> **Do you provide a way for users to request that their data is deleted?**
> Yes

---

## 6. チェックリスト

各アプリのリリース前に確認:

- [ ] 設定画面に「外観」セクションがある
- [ ] 設定画面に「{アプリ名}について」セクションがある
- [ ] バージョン番号が `BuildConfig.VERSION_NAME` から動的取得されている
- [ ] 開発元が「HARMONIC insight」と表示されている
- [ ] 設定画面に「法的情報」セクションがある
- [ ] プライバシーポリシーのリンクが `https://www.insight-office.com/ja/privacy` を開く
- [ ] 利用規約のリンクが `https://www.insight-office.com/ja/terms` を開く
- [ ] オープンソースライセンス画面がある
- [ ] コピーライト表記が画面下部にある
- [ ] 日本語・英語の両方の文字列リソースが存在する
- [ ] URL を開けない場合のエラーハンドリングがある
- [ ] Play Store の Data Safety セクションのプライバシーポリシー URL が `https://www.insight-office.com/ja/privacy` になっている

---

## 7. 関連ファイル

| ファイル | 説明 |
|---------|------|
| `config/app-settings.ts` | 標準設定の TypeScript 定義（URL・会社情報・セクション構成） |
| `android/settings/strings_settings.xml` | Android 標準文字列リソース（日本語） |
| `android/settings/strings_settings_en.xml` | Android 標準文字列リソース（英語） |
| `i18n/ja.json` | 共通翻訳（`settings` セクション） |
| `i18n/en.json` | 共通翻訳（`settings` セクション） |
| `legal/privacy-policy.md` | プライバシーポリシー本文 |
| `legal/terms-of-service.md` | 利用規約本文 |
| `company/contact.json` | 会社連絡先情報 |
| `brand/colors.json` | Ivory & Gold カラー定義 |
