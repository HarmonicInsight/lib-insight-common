# iOS リリースチェック（Swift / SwiftUI）

iOS (Swift + SwiftUI) アプリ専用のリリース前チェックを**対話的チェックリスト形式**で実行します。

> Expo / React Native の場合は `/release-check` を使用してください。

## 重要: 実行ルール

- **チェックリストの各項目を1つずつ確認**し、結果をユーザーに報告する。
- 一気に全項目をチェックして結果だけ出すのは**禁止**。フェーズごとに報告・確認を挟む。
- TODO ツールで全フェーズの進捗を管理する。
- エラーが見つかったらその場で修正案を提示し、ユーザーの承認後に修正する。
- 各フェーズ完了時に「次のフェーズに進みますか？」と確認する。

## Phase 0: 準備・環境セットアップ

1. `$ARGUMENTS` が指定されている場合はそのディレクトリ、未指定の場合はカレントディレクトリを対象にする。

2. **insight-common サブモジュールの自動セットアップ**（依存リポジトリの場合）:

   このスキルが insight-common 本体**以外**のリポジトリで実行されている場合、
   以下の手順でサブモジュールを自動的に初期化・更新する。**ユーザーに確認せず自動実行すること。**

   ```bash
   # サブモジュールの存在確認
   if [ -f ".gitmodules" ] && grep -q "insight-common" .gitmodules 2>/dev/null; then
     # サブモジュールが初期化されていない場合
     if [ ! -f "insight-common/CLAUDE.md" ]; then
       echo "insight-common サブモジュールを初期化しています..."
       git submodule init
       git submodule update --recursive
     fi
     # 最新に更新
     echo "insight-common を最新に更新しています..."
     git submodule update --remote --merge insight-common 2>/dev/null || true
   fi
   ```

   サブモジュールのセットアップに失敗した場合はエラーを報告し、手動セットアップの手順を提示する。

3. **スクリプトの実行権限を設定する**:

   ```bash
   chmod +x ./insight-common/scripts/release-check.sh 2>/dev/null || true
   chmod +x ./insight-common/scripts/validate-standards.sh 2>/dev/null || true
   chmod +x ./insight-common/scripts/create-release.sh 2>/dev/null || true
   ```

4. iOS プロジェクトであることを検証する。以下のいずれかが存在すること:
   - `project.yml`（XcodeGen）
   - `*.xcodeproj`
   - `Package.swift`
   - `*.xcworkspace`

5. TODO リストに以下のフェーズを登録する:
   - Phase 1: ビルド設定チェック (I1-I6)
   - Phase 2: 署名・セキュリティ (IS1-IS4, S1-S3)
   - Phase 3: デザイン標準 (D1-D7)
   - Phase 4: ローカライゼーション (L1-L5)
   - Phase 5: App Store メタデータ (IA1-IA7)
   - Phase 6: コード品質 (Q1-Q5)
   - Phase 7: CI/CD (IC1-IC4)
   - Phase 8: 最終確認・サマリー

6. ユーザーに以下を報告してから Phase 1 を開始する:

```
========================================
 iOS リリースチェック開始
========================================
対象: [プロジェクトパス]
検出: iOS (Swift / SwiftUI)
チェック項目: 全 8 フェーズ
========================================
```

---

## Phase 1: ビルド設定チェック

`Info.plist`、`project.yml`（XcodeGen）、または `*.pbxproj` を読み込み、以下を確認する。

**検出優先順位:**
1. `project.yml` → XcodeGen 形式でバージョン等を確認
2. `Info.plist` → `CFBundleVersion`、`CFBundleShortVersionString` を確認
3. `*.pbxproj` → ビルド設定を直接確認

| # | チェック項目 | 確認内容 | 期待値 |
|---|------------|---------|--------|
| I1 | CFBundleVersion | ビルド番号（整数文字列） | 前回リリースからインクリメント |
| I2 | CFBundleShortVersionString | バージョン文字列 | セマンティックバージョニング (X.Y.Z) |
| I3 | Deployment Target | iOS 最低バージョン | `16.0` 以上 |
| I4 | Bundle Identifier | バンドル ID | `com.harmonicinsight.*` 形式 |
| I5 | Product Name | 製品名 | 正しい製品名が設定されている |
| I6 | Swift Language Version | Swift バージョン | `5.9` 以上 |

**報告フォーマット:**

```
## Phase 1: ビルド設定 結果

| # | チェック項目 | 結果 | 現在の値 |
|---|------------|:----:|---------|
| I1 | CFBundleVersion | ✅ | 2 |
| I2 | CFBundleShortVersionString | ✅ | 1.1.0 |
| I3 | Deployment Target | ✅ | 16.0 |
| I4 | Bundle Identifier | ✅ | com.harmonicinsight.insightqr |
| I5 | Product Name | ✅ | InsightQR |
| I6 | Swift Language Version | ✅ | 5.9 |
```

❌ がある場合:
- 具体的な修正コードを提示する
- ユーザーの承認後に修正する
- 修正後に該当項目を再チェックする

---

## Phase 2: 署名・セキュリティ

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| IS1 | Development Team が設定されている | `project.yml` / `*.pbxproj` で `DEVELOPMENT_TEAM` を確認 |
| IS2 | CODE_SIGN_STYLE が設定されている | `Automatic` または `Manual` が設定されているか |
| IS3 | Provisioning Profile の確認 | ⚠️ 手動確認推奨（ローカル / Apple Developer Portal） |
| IS4 | ITSAppUsesNonExemptEncryption が設定されている | `Info.plist` で暗号化使用宣言が `false`（標準暗号のみ）または `true`（独自暗号あり） |
| S1 | .env / credentials が .gitignore に含まれる | `.gitignore` を確認 |
| S2 | API キーがソースコードに埋め込まれていない | `*.swift` ファイルで `sk-\|AIza\|AKIA\|api_key.*=.*"` を検索 |
| S3 | GoogleService-Info.plist がリポジトリに含まれていない | `.gitignore` と `git ls-files` で確認（Firebase 使用時のみ） |

**報告フォーマット:**

```
## Phase 2: 署名・セキュリティ 結果

| # | チェック項目 | 結果 | 詳細 |
|---|------------|:----:|------|
| IS1 | Development Team | ⚠️ | [手動確認] ローカル環境で確認が必要 |
| IS2 | CODE_SIGN_STYLE | ✅ | Automatic |
| IS3 | Provisioning Profile | ⚠️ | [手動確認] Apple Developer Portal で確認 |
| IS4 | ITSAppUsesNonExemptEncryption | ✅ | false（標準暗号のみ） |
| S1 | .env 除外 | ✅ | .gitignore に含まれる |
| S2 | API キー埋め込みなし | ✅ | ハードコード検出なし |
| S3 | GoogleService-Info.plist | ✅ | .gitignore に含まれる |
```

---

## Phase 3: デザイン標準 (Ivory & Gold)

以下のファイルを確認する:
- `**/InsightColors.swift`（または同等のカラー定義ファイル）
- `*.xcassets/` 内の `AccentColor.colorset/Contents.json`
- SwiftUI ビューファイル (`*.swift`)

| # | チェック項目 | 確認内容 |
|---|------------|---------|
| D1 | Gold (#B8942F) がプライマリカラー | `InsightColors.swift` / `AccentColor.colorset` で Gold が Primary として定義 |
| D2 | Ivory (#FAF8F5) が背景色 | `InsightColors.swift` で Ivory が Background として定義 |
| D3 | Blue (#2563EB) がプライマリ未使用 | `#2563EB` / `2563EB` がプライマリとして使われていないこと |
| D4 | ハードコードされた色値なし | SwiftUI コードで直接 `Color(red:green:blue:)` や `Color(hex: "...")` を使っていないこと（InsightColors 経由であること） |
| D5 | カードのスタイルが標準準拠 | 白背景 + `cornerRadius: 12` |
| D6 | テキストカラーが Stone 系暖色 | `InsightColors.textPrimary` (#1C1917) / `InsightColors.textSecondary` (#57534E) を使用 |
| D7 | AccentColor がアセットカタログに設定 | `AccentColor.colorset/Contents.json` が Gold カラーに設定されている |

**報告フォーマット:** Phase 1 と同様のテーブル形式。

**D4 の確認方法:**

SwiftUI ファイル（`Views/` 配下）で以下のパターンを検索:
```
Color(red:       → InsightColors 経由でない直接指定
Color(hex: "     → InsightColors で定義済みなら OK、未定義なら ❌
Color(.sRGB      → InsightColors 経由でない直接指定
UIColor(red:     → InsightColors 経由でない直接指定
```

> **注意**: `InsightColors.swift` 内や `Color(hex:)` extension 内での使用は OK。Views 層での直接使用が禁止。

---

## Phase 4: ローカライゼーション

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| L1 | 日本語リソースが存在 | `Localizable.xcstrings` または `ja.lproj/Localizable.strings` の存在確認 |
| L2 | 英語リソースが存在 | `Localizable.xcstrings` 内に英語 or `en.lproj/Localizable.strings` の存在確認 |
| L3 | 日英のキーが完全一致 | 両リソースの翻訳キーを比較 |
| L4 | SwiftUI でテキストハードコードなし | `*.swift` (Views 配下) で日本語・英語文字列リテラルの直接使用を検索 |
| L5 | 日付・数値フォーマットがロケール対応 | 手動確認推奨 |

**L3 の確認方法（.lproj 形式の場合）:**

```
日本語のみに存在するキー: [一覧]
英語のみに存在するキー: [一覧]
→ 両方に存在しないキーがあれば ❌
```

**L3 の確認方法（.xcstrings 形式の場合）:**

JSON ファイルを読み込み、`strings` 内の各キーに `ja` と `en` の `localizations` が存在するか確認。

**L4 の確認方法:**

SwiftUI ファイルで以下のパターンを検索（ただし `L10n.` / `NSLocalizedString` / `LocalizedStringKey` 経由は OK）:
```
Text("日本語文字列")     → ❌（Localizable.strings にない場合）
Button("日本語") { }    → ❌
Label("日本語", ...)     → ❌
```

> **注意**: SwiftUI の `Text("key")` は `LocalizedStringKey` として自動解決されるため、
> `Localizable.strings` にキーが定義されていれば OK。定義がない場合は ❌。

---

## Phase 5: App Store メタデータ

`fastlane/metadata/` ディレクトリの構成を確認する。

| # | チェック項目 | ファイル | 文字数制限 |
|---|------------|---------|:--------:|
| IA1 | 日本語アプリ名 | `ja/name.txt` | 30 |
| IA1 | 英語アプリ名 | `en-US/name.txt` | 30 |
| IA2 | 日本語サブタイトル | `ja/subtitle.txt` | 30 |
| IA2 | 英語サブタイトル | `en-US/subtitle.txt` | 30 |
| IA3 | 日本語説明 | `ja/description.txt` | — |
| IA3 | 英語説明 | `en-US/description.txt` | — |
| IA4 | 日本語キーワード | `ja/keywords.txt` | 100 |
| IA4 | 英語キーワード | `en-US/keywords.txt` | 100 |
| IA5 | 日本語リリースノート | `ja/release_notes.txt` | — |
| IA5 | 英語リリースノート | `en-US/release_notes.txt` | — |
| IA6 | 日本語プロモーションテキスト | `ja/promotional_text.txt` | 170 |
| IA6 | 英語プロモーションテキスト | `en-US/promotional_text.txt` | 170 |
| IA7 | スクリーンショット（日英） | `ja/screenshots/` / `en-US/screenshots/` | — |

**ファイルが存在しない場合:**

ディレクトリ構造とテンプレートを提示し、作成を提案する:

```
fastlane/metadata/
├── ja/
│   ├── name.txt                # アプリ名（30文字以内）
│   ├── subtitle.txt            # サブタイトル（30文字以内）
│   ├── description.txt         # 説明
│   ├── keywords.txt            # キーワード（100文字以内、カンマ区切り）
│   ├── release_notes.txt       # リリースノート
│   ├── promotional_text.txt    # プロモーションテキスト（170文字以内）
│   └── screenshots/            # スクリーンショット
├── en-US/
│   ├── name.txt
│   ├── subtitle.txt
│   ├── description.txt
│   ├── keywords.txt
│   ├── release_notes.txt
│   ├── promotional_text.txt
│   └── screenshots/
```

文字数が超過している場合は、**現在の文字数と上限**を表示し、短縮案を提示する。

---

## Phase 6: コード品質

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| Q1 | TODO/FIXME/HACK コメント | `*.swift` / `*.yml` / `project.yml` ファイルで `TODO\|FIXME\|HACK` を検索 |
| Q2 | デバッグ出力 (`print` / `NSLog` / `debugPrint`) | `*.swift` ファイルで `\bprint(\|NSLog(\|debugPrint(` を検索（ただし `os.Logger` / カスタムロガー経由は OK） |
| Q3 | ハードコードされた API キー | `*.swift` / `*.plist` ファイルで秘密鍵パターンを検索 |
| Q4 | 未使用 import | IDE 警告レベル — 手動確認推奨 |
| Q5 | SwiftLint エラー | `.swiftlint.yml` が存在すれば `swiftlint lint` の実行推奨（手動確認） |

**Q1 の結果報告:**

```
TODO/FIXME/HACK 検出結果:
- InsightQR/Views/ScannerView.swift:42 — TODO: エラーハンドリング追加
- InsightQR/Data/HistoryRepository.swift:15 — FIXME: Keychain 移行

→ 2件検出。リリース前に解決するか、意図的に残す場合はその理由を確認してください。
```

**Q2 の検索パターン:**

```bash
# デバッグ出力の検索（以下は除外対象）
# - テストファイル (*Tests.swift)
# - デバッグ用ビルドフラグ内 (#if DEBUG)
```

> `#if DEBUG` ブロック内の `print()` は許容する。ブロック外の `print()` は ❌。

---

## Phase 7: CI/CD

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| IC1 | `.github/workflows/build-ios.yml` 存在 | ファイル存在確認（`build.yml` / `build-ios.yml` / `ci.yml` のいずれか） |
| IC2 | ワークフローの内容が標準準拠 | macOS ランナー (`macos-14` 以上) 使用 |
| IC3 | XcodeGen の生成ステップ | `project.yml` 使用時: `brew install xcodegen` + `xcodegen generate` のステップが存在 |
| IC4 | ビルドコマンドが正しい | `xcodebuild build` が `CODE_SIGNING_ALLOWED=NO`（CI 用）で実行されている |

**標準 CI ワークフロー構成:**

```yaml
name: Build iOS
on:
  push:
    branches: [ main, 'claude/**' ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: macos-14
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true          # insight-common 使用時
      - name: Install XcodeGen
        run: brew install xcodegen  # project.yml 使用時
      - name: Generate Xcode project
        run: xcodegen generate      # project.yml 使用時
      - name: Build for simulator
        run: |
          xcodebuild build \
            -project YourApp.xcodeproj \
            -scheme YourApp \
            -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \
            -configuration Debug \
            CODE_SIGNING_ALLOWED=NO \
            | xcpretty
```

**差分がある場合:**

`standards/IOS.md` の標準を参照し、差分を報告する。

**v* タグでの自動リリースが未設定の場合:**

以下のステップ追加を提案する:

```yaml
  release:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

---

## Phase 8: 最終確認・サマリー

全フェーズの結果を統合して最終サマリーを表示する。

```
============================================================
 iOS リリースチェック 最終サマリー
============================================================

対象: [プロジェクトパス]
プラットフォーム: iOS (Swift / SwiftUI)
実行日時: [日時]

Phase 1: ビルド設定          ✅ 完了 (6/6 OK)
Phase 2: 署名・セキュリティ   ✅ 完了 (5/7 OK, 手動確認 2)
Phase 3: デザイン標準         ✅ 完了 (7/7 OK)
Phase 4: ローカライゼーション  ✅ 完了 (5/5 OK)
Phase 5: App Store メタデータ ⚠️ 警告あり (10/12 OK, 未作成 2)
Phase 6: コード品質           ✅ 完了 (5/5 OK)
Phase 7: CI/CD               ✅ 完了 (4/4 OK)

合計: ✅ OK 42件 / ❌ エラー 0件 / ⚠️ 警告 2件

⚠️ 警告項目:
1. IA6: promotional_text.txt が未作成（任意項目）
2. IA7: スクリーンショットが未確認

手動確認が必要な項目:
1. [ ] Archive ビルドの成功確認（Xcode → Product → Archive）
2. [ ] App Store Connect へのアップロード確認
3. [ ] Provisioning Profile の有効期限確認
4. [ ] スクリーンショットの準備（日英）
5. [ ] リリースノートの内容承認
6. [ ] 実機での動作確認

→ 全エラーが解消されていればリリース可能です。

次のステップ（GitHub Release 作成）:
  ./insight-common/scripts/create-release.sh .
  # 初回 v1.0.0 の上書き: --version 1.0.0 --overwrite
  # 詳細: standards/IOS.md
============================================================
```

---

## 参照ドキュメント

- `standards/IOS.md` — iOS 開発標準（InsightColors、LicenseManager、プロジェクト構成）
- `standards/RELEASE_CHECKLIST.md` — 全プラットフォーム共通リリースチェックリスト（§4 iOS 固有）
- `standards/LOCALIZATION.md` — ストアメタデータのローカライゼーション（§3.2 iOS、§6 チェックリスト）
- `scripts/create-release.sh` — リリース作成ヘルパースクリプト（タグ作成・プッシュ・上書き対応）
- `CLAUDE.md` §12 — 開発完了チェックリスト
