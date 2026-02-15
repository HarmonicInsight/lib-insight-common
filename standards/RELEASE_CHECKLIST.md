# リリースチェックリスト標準

> **すべての HARMONIC insight 製品は、リリース前にこのチェックリストを完了すること。**
> `/release-check` スキルで自動検証可能。手動チェック項目は目視で確認すること。

---

## 概要

```
リリースチェック = 標準検証 + リリース固有チェック

┌─────────────────────────────────────────────────────────┐
│  Phase 1: 標準検証（自動）                                │
│  → validate-standards.sh を内部で実行                     │
│  → デザイン・ライセンス・製品コード・プラットフォーム固有    │
├─────────────────────────────────────────────────────────┤
│  Phase 2: リリース固有チェック（自動 + 手動）              │
│  → バージョン・署名・メタデータ・セキュリティ・ビルド       │
├─────────────────────────────────────────────────────────┤
│  Phase 3: 最終確認（手動）                                │
│  → 動作確認・スクリーンショット・リリースノート承認         │
└─────────────────────────────────────────────────────────┘
```

---

## 1. 全プラットフォーム共通チェック

### 1.1 バージョン管理

| # | チェック項目 | 自動 | 対象ファイル |
|---|------------|:----:|------------|
| V1 | バージョン番号が前回リリースから更新されている | ✅ | build.gradle.kts / package.json / .csproj / pyproject.toml |
| V2 | セマンティックバージョニング（MAJOR.MINOR.PATCH）に準拠 | ✅ | 同上 |
| V3 | CHANGELOG / リリースノートが更新されている | ⚠️ | CHANGELOG.md / changelogs/ |

### 1.2 コード品質

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| Q1 | TODO / FIXME / HACK コメントが残っていない | ✅ | リリースブロッカーとなるもの |
| Q2 | デバッグ用コード（console.log / print / Log.d）が残っていない | ✅ | テスト用の出力 |
| Q3 | ハードコードされた API キー・シークレットがない | ✅ | .env / secrets 以外に書かれていないか |
| Q4 | テストが全て通る | ⚠️ | CI で確認 |
| Q5 | Lint エラーがない | ⚠️ | プラットフォーム固有 linter |

### 1.3 デザイン標準（validate-standards.sh で検証）

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| D1 | Gold (#B8942F) がプライマリカラー | ✅ | |
| D2 | Ivory (#FAF8F5) が背景色 | ✅ | |
| D3 | Blue (#2563EB) がプライマリとして未使用 | ✅ | |
| D4 | ハードコードされた色値がない | ✅ | StaticResource / 変数を使用 |

### 1.4 ローカライゼーション

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| L1 | 日本語リソースファイルが存在 | ✅ | デフォルト言語 |
| L2 | 英語リソースファイルが存在 | ✅ | 必須対応言語 |
| L3 | 日本語と英語のキーが完全一致 | ✅ | 未翻訳キーなし |
| L4 | UI テキストがハードコードされていない | ✅ | リソースファイル経由 |
| L5 | 日付・数値フォーマットがロケール対応 | ⚠️ | 手動確認推奨 |

### 1.5 ライセンス

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| LI1 | InsightLicenseManager が実装されている | ✅ | InsightOffice 製品のみ |
| LI2 | ライセンスキー形式が正しい | ✅ | `{CODE}-{PLAN}-{YYMM}-XXXX-XXXX-XXXX` |
| LI3 | ライセンス画面が Insight Slides 形式 | ⚠️ | UI レビュー |
| LI4 | Syncfusion キーが `third-party-licenses.json` 経由 | ✅ | 直書き禁止 |

### 1.6 セキュリティ

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| S1 | .env / credentials ファイルが .gitignore に含まれている | ✅ | |
| S2 | API キーがソースコードに埋め込まれていない | ✅ | |
| S3 | google-services.json がリポジトリに含まれていない | ✅ | Android のみ |
| S4 | keystore ファイルがリポジトリに含まれていない | ✅ | Android のみ |

### 1.7 Git 状態

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| G1 | 未コミットの変更がない | ✅ | clean working tree |
| G2 | リモートと同期済み | ✅ | push 済み |
| G3 | main ブランチから分岐していない（or マージ済み） | ⚠️ | |

---

## 2. Android 固有チェック（Native Kotlin）

### 2.1 ビルド設定

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| A1 | `versionCode` がインクリメントされている | ✅ | Play Store は同一 versionCode を拒否 |
| A2 | `versionName` が更新されている | ✅ | ユーザー表示用 |
| A3 | compileSdk = 35 | ✅ | |
| A4 | targetSdk = 35 | ✅ | |
| A5 | minSdk = 26 | ✅ | |
| A6 | `isMinifyEnabled = true`（release） | ✅ | R8 有効 |
| A7 | `isShrinkResources = true`（release） | ✅ | リソース縮小 |
| A8 | ProGuard ルールが存在 | ✅ | |

### 2.2 署名

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| AS1 | release の signingConfig が設定されている | ✅ | `signingConfigs.release` |
| AS2 | keystore ファイルが存在する（ローカル） | ⚠️ | CI では secrets 経由 |
| AS3 | release keystore がリポジトリに含まれていない | ✅ | .gitignore 確認 |
| AS4 | `keystore.properties` / 環境変数で参照 | ✅ | ハードコード禁止 |
| AS5 | `app/dev.keystore` がリポジトリに含まれている | ✅ | 上書きインストール対策 |
| AS6 | debug の signingConfig が `dev.keystore` を参照 | ✅ | チーム共有の署名キー |

### 2.3 Play Store メタデータ

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| AP1 | `fastlane/metadata/android/ja-JP/title.txt` が存在 | ✅ | 30文字以内 |
| AP2 | `fastlane/metadata/android/en-US/title.txt` が存在 | ✅ | 30文字以内 |
| AP3 | `short_description.txt` が日英で存在 | ✅ | 80文字以内 |
| AP4 | `full_description.txt` が日英で存在 | ✅ | 4000文字以内 |
| AP5 | `changelogs/default.txt` が日英で存在 | ✅ | 500文字以内 |
| AP6 | 文字数制限を超えていない | ✅ | 自動カウント |
| AP7 | スクリーンショットが用意されている | ⚠️ | 手動確認 |

### 2.4 ビルド成果物

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| AB1 | Release APK がビルドできる | ⚠️ | `./gradlew assembleRelease` |
| AB2 | Release AAB がビルドできる（Play Store 用） | ⚠️ | `./gradlew bundleRelease` |
| AB3 | APK サイズが妥当（100MB 以内推奨） | ⚠️ | |

### 2.5 CI/CD

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| AC1 | `.github/workflows/build.yml` が存在 | ✅ | |
| AC2 | CI でリリースビルドが成功している（APK + AAB） | ⚠️ | GitHub Actions 確認 |
| AC3 | CI で AAB **と** APK の両方がビルドされている | ✅ | `bundleRelease` + `assembleRelease` |
| AC4 | `bundle {}` ブロックで language/density/abi split が有効 | ✅ | AAB 最適化 |
| AC5 | 署名設定が secrets 経由 | ✅ | `KEYSTORE_BASE64` 等 |
| AC6_2 | `submodules: true` が設定されている | ✅ | insight-common 使用時 |
| AC7 | `v*` タグで GitHub Release が自動作成される | ✅ | `softprops/action-gh-release` |
| AC6 | google-services.json の CI プレースホルダーが設定済み | ✅ | Firebase 使用時 |

---

## 3. Android 固有チェック（Expo / React Native）

### 3.1 ビルド設定

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| E1 | `app.json` の `version` が更新されている | ✅ | |
| E2 | `app.json` の `android.versionCode` がインクリメント | ✅ | |
| E3 | `eas.json` に `production` プロファイルが存在 | ✅ | |
| E4 | `eas.json` の production が `app-bundle` ビルド | ✅ | |
| E5 | パッケージ名が `com.harmonicinsight.*` | ✅ | |

### 3.2 EAS Build

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| EB1 | `eas build --platform android --profile production` が成功 | ⚠️ | |
| EB2 | EAS Submit の設定が完了している | ⚠️ | Play Store 連携 |

---

## 4. iOS 固有チェック

### 4.1 ビルド設定

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| I1 | Bundle Version（CFBundleVersion）がインクリメント | ✅ | |
| I2 | Bundle Short Version（CFBundleShortVersionString）が更新 | ✅ | |
| I3 | Development Team が設定されている | ✅ | |
| I4 | Provisioning Profile が有効 | ⚠️ | 期限確認 |

### 4.2 App Store メタデータ

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| IA1 | `name.txt` が日英で存在 | ✅ | 30文字以内 |
| IA2 | `subtitle.txt` が日英で存在 | ✅ | 30文字以内 |
| IA3 | `description.txt` が日英で存在 | ✅ | |
| IA4 | `keywords.txt` が日英で存在 | ✅ | 100文字以内 |
| IA5 | `release_notes.txt` が日英で存在 | ✅ | |
| IA6 | スクリーンショットが用意されている | ⚠️ | 手動確認 |

### 4.3 ビルド成果物

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| IB1 | Archive ビルドが成功する | ⚠️ | Xcode / CLI |
| IB2 | App Store Connect へアップロード可能 | ⚠️ | |

---

## 5. C# (WPF) 固有チェック

### 5.1 バージョン

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| W1 | AssemblyVersion が更新されている | ✅ | .csproj |
| W2 | FileVersion が更新されている | ✅ | .csproj |
| W3 | インストーラーバージョンが更新 | ⚠️ | ClickOnce / WiX |

### 5.2 署名・配布

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| WS1 | コード署名証明書が有効 | ⚠️ | 期限確認 |
| WS2 | ClickOnce 発行元情報が正しい | ⚠️ | |
| WS3 | インストーラーが正常に動作する | ⚠️ | 手動テスト |

### 5.3 ファイル関連付け

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| WF1 | 独自拡張子（.inss/.iosh/.iosd）が登録される | ⚠️ | インストーラー確認 |
| WF2 | コンテキストメニュー（右クリック）が機能する | ⚠️ | 手動テスト |
| WF3 | ダブルクリックでアプリが起動する | ⚠️ | 手動テスト |

---

## 6. React / Next.js 固有チェック

### 6.1 ビルド

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| R1 | `next build` が成功する | ⚠️ | |
| R2 | TypeScript エラーがない | ✅ | `tsc --noEmit` |
| R3 | ESLint エラーがない | ✅ | |
| R4 | 本番環境変数が設定されている | ⚠️ | Vercel / Railway |

### 6.2 パフォーマンス

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| RP1 | Lighthouse スコア 90+ | ⚠️ | 手動測定 |
| RP2 | バンドルサイズが妥当 | ⚠️ | |

---

## 7. Python 固有チェック

### 7.1 バージョン

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| P1 | pyproject.toml / setup.py のバージョンが更新 | ✅ | |
| P2 | 全依存パッケージがピン留めされている | ✅ | |
| P3 | テストが通る | ⚠️ | `pytest` |

---

## 8. AI アシスタント固有チェック（InsightOffice 系）

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| AI1 | Claude (Anthropic) API のみ使用 | ✅ | OpenAI/Azure 禁止 |
| AI2 | モデルティア（Standard/Premium）制御が実装 | ✅ | |
| AI3 | ライセンスゲートが実装 | ✅ | STD:50回 / PRO:200回 |
| AI4 | AI 関連 UI テキストがローカライズ済み | ✅ | |
| AI5 | API キーがクライアントに露出していない | ✅ | |

---

## 9. リリース管理（GitHub Release）

### 9.1 リリースフロー

```
バージョン更新 → リリースチェック → コミット → タグ → プッシュ → 自動ビルド → GitHub Release
```

| # | チェック項目 | 自動 | 説明 |
|---|------------|:----:|------|
| RM1 | versionName / version がセマンティックバージョニングに準拠 | ✅ | MAJOR.MINOR.PATCH |
| RM2 | versionCode がインクリメントされている（Android） | ✅ | Play Store は同一値を拒否 |
| RM3 | Git タグが `v` + バージョン名の形式 | ✅ | 例: `v1.0.0` |
| RM4 | build.yml が `v*` タグで GitHub Release を作成する | ✅ | `softprops/action-gh-release` |
| RM5 | リリースノートが用意されている | ⚠️ | 自動生成 + 手動編集 |

### 9.2 ヘルパースクリプト

```bash
# 通常のリリース
./insight-common/scripts/create-release.sh <project-directory>

# バージョン指定
./insight-common/scripts/create-release.sh <project-directory> --version 1.1.0

# 既存リリースの上書き（初期開発時のみ推奨）
./insight-common/scripts/create-release.sh <project-directory> --version 1.0.0 --overwrite

# プレリリース
./insight-common/scripts/create-release.sh <project-directory> --prerelease rc.1

# 確認のみ（実行しない）
./insight-common/scripts/create-release.sh <project-directory> --dry-run
```

### 9.3 初回リリース（v1.0.0）の上書き

初期開発時は同じバージョンを修正して再リリースしたい場合がある。

```bash
# 方法1: ヘルパースクリプト
./insight-common/scripts/create-release.sh . --version 1.0.0 --overwrite

# 方法2: 手動
gh release delete v1.0.0 --yes          # GitHub Release 削除
git push origin --delete v1.0.0         # リモートタグ削除
git tag -d v1.0.0                       # ローカルタグ削除
git tag v1.0.0 && git push origin v1.0.0  # タグ再作成・プッシュ
```

> **注意**: 安定版以降（v1.1.0+）は上書きではなく新バージョンで対応すること。

---

## 自動検証の実行方法

### スクリプト

```bash
# 全チェック実行（標準検証 + リリースチェック）
./insight-common/scripts/release-check.sh <project-directory>

# プラットフォーム指定（自動検出も可能）
./insight-common/scripts/release-check.sh <project-directory> --platform android
./insight-common/scripts/release-check.sh <project-directory> --platform ios
./insight-common/scripts/release-check.sh <project-directory> --platform csharp
./insight-common/scripts/release-check.sh <project-directory> --platform react
./insight-common/scripts/release-check.sh <project-directory> --platform python
./insight-common/scripts/release-check.sh <project-directory> --platform expo

# リリース作成（チェック + タグ + プッシュ）
./insight-common/scripts/create-release.sh <project-directory>
```

### Claude Code スキル

```
/release-check <project-directory>
```

スキルを実行すると:
1. `release-check.sh` を実行（自動検証）
2. 手動チェック項目の一覧を表示
3. 未完了項目のサマリーと対応案を提示

---

## チェック結果のフォーマット

```
========================================
 HARMONIC insight リリースチェック
========================================

対象: /path/to/project
プラットフォーム: android
実行日時: 2026-02-14 10:00:00

--- Phase 1: 標準検証 ---
  ✓ Gold (#B8942F) がプライマリ
  ✓ Ivory (#FAF8F5) が背景
  ✓ Blue 未使用
  ✓ LicenseManager 存在
  ...

--- Phase 2: リリース固有チェック ---
  ✓ versionCode インクリメント済み
  ✓ versionName 更新済み
  ✗ signingConfig が未設定
  ✓ ProGuard 有効
  ✗ Play Store メタデータ（ja-JP/title.txt）が未作成
  ...

--- Phase 3: 手動確認項目 ---
  ⚠ スクリーンショットが用意されているか確認してください
  ⚠ Release APK のインストール・動作確認を行ってください
  ⚠ リリースノートの内容を承認してください

========================================
 結果: エラー 2件 / 警告 3件
========================================
```

---

## 参照

- **標準検証**: `scripts/validate-standards.sh`
- **リリース検証**: `scripts/release-check.sh`
- **リリース作成**: `scripts/create-release.sh`
- **デザイン標準**: `brand/colors.json`
- **ローカライゼーション**: `standards/LOCALIZATION.md`
- **AI アシスタント**: `standards/AI_ASSISTANT.md`
- **プラットフォーム別**: `standards/ANDROID.md` / `standards/IOS.md` / `standards/CSHARP_WPF.md` / `standards/REACT.md` / `standards/PYTHON.md`
