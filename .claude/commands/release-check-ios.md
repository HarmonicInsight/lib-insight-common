# iOS リリースチェック（Swift / SwiftUI）

iOS (Swift + SwiftUI + XcodeGen) アプリ専用のリリース前チェックを**対話的チェックリスト形式**で実行します。

> SPM ベースの Swift Package ライブラリの場合は `/release-check` を使用してください。

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
   chmod +x ./insight-common/scripts/ios-manage.sh 2>/dev/null || true
   chmod +x ./insight-common/scripts/create-release.sh 2>/dev/null || true
   chmod +x ./scripts/release-check.sh 2>/dev/null || true
   chmod +x ./scripts/validate-standards.sh 2>/dev/null || true
   chmod +x ./scripts/ios-manage.sh 2>/dev/null || true
   ```

4. `project.yml` または `Package.swift` の存在を確認し、iOS プロジェクトであることを検証する。

5. TODO リストに以下のフェーズを登録する:
   - Phase 1: ビルド設定チェック (I1-I8)
   - Phase 2: 署名・セキュリティ (IS1-IS6, S1-S4)
   - Phase 3: デザイン標準 (D1-D7)
   - Phase 4: ローカライゼーション (L1-L5)
   - Phase 5: App Store メタデータ (IA1-IA6)
   - Phase 6: コード品質 (Q1-Q5)
   - Phase 7: CI/CD (IC1-IC3)
   - Phase 8: 最終確認・サマリー

6. ユーザーに以下を報告してから Phase 1 を開始する:

```
========================================
 iOS リリースチェック開始
========================================
対象: [プロジェクトパス]
検出: iOS (Swift / SwiftUI + XcodeGen)
チェック項目: 全 8 フェーズ
========================================
```

---

## Phase 1: ビルド設定チェック

`project.yml` と `Configuration/*.xcconfig` を読み込み、以下を確認する。

| # | チェック項目 | 確認内容 | 期待値 |
|---|------------|---------|--------|
| I1 | project.yml 存在 | `project.yml` が存在する | ファイルが存在 |
| I2 | deploymentTarget | `project.yml` 内の iOS deployment target | `16.0` 以上 |
| I3 | xcodeVersion | `project.yml` 内の Xcode バージョン | 設定されている |
| I4 | Base.xcconfig | `Configuration/Base.xcconfig` 存在 + MARKETING_VERSION | バージョン番号が設定 |
| I5 | CURRENT_PROJECT_VERSION | `Base.xcconfig` 内のビルド番号 | 前回からインクリメント |
| I6 | Debug.xcconfig | `Configuration/Debug.xcconfig` 存在 | ファイルが存在 |
| I7 | Release.xcconfig | `Configuration/Release.xcconfig` 存在 + 最適化設定 | `-O` or `-Owholemodule` |
| I8 | .xcode-version | `.xcode-version` ファイルの存在 | ファイルが存在 |

**報告フォーマット:**

```
## Phase 1: ビルド設定 結果

| # | チェック項目 | 結果 | 現在の値 |
|---|------------|:----:|---------|
| I1 | project.yml | ✅ | 存在 |
| I2 | deploymentTarget | ✅ | iOS 16.0 |
| I3 | xcodeVersion | ✅ | 16.2 |
| I4 | MARKETING_VERSION | ✅ | 1.2.0 |
| I5 | CURRENT_PROJECT_VERSION | ✅ | 12 |
| I6 | Debug.xcconfig | ✅ | 存在 |
| I7 | Release.xcconfig | ✅ | -O 最適化有効 |
| I8 | .xcode-version | ✅ | 16.2 |
```

❌ がある場合:
- 具体的な修正コードを提示する
- ユーザーの承認後に修正する
- 修正後に該当項目を再チェックする

---

## Phase 2: 署名・セキュリティ

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| IS1 | Release の CODE_SIGN_STYLE | `Release.xcconfig` で `Manual` が設定されているか |
| IS2 | CODE_SIGN_IDENTITY | `Release.xcconfig` で Apple Distribution 等が設定されているか |
| IS3 | PROVISIONING_PROFILE_SPECIFIER | Release 用プロファイルが設定されているか（手動確認可） |
| IS4 | Debug の CODE_SIGN_STYLE | `Debug.xcconfig` で `Automatic` が設定されているか |
| IS5 | .gitignore で秘密鍵除外 | `*.p12`, `*.mobileprovision`, `*.cer` が除外されているか |
| IS6 | .xcodeproj が .gitignore | XcodeGen 使用時は `*.xcodeproj/` が除外されていること |
| S1 | .env が .gitignore に含まれる | `.gitignore` を確認 |
| S2 | API キーがソースコードに埋め込まれていない | `grep -rn "sk-\|AIza\|AKIA\|api_key.*=.*\"" --include="*.swift"` |
| S3 | GoogleService-Info.plist がリポジトリに含まれていない | `.gitignore` と `git ls-files` で確認 |
| S4 | Keychain アクセス | Keychain 関連コードがある場合、適切なアクセスグループが設定されているか |

**報告フォーマット:**

```
## Phase 2: 署名・セキュリティ 結果

| # | チェック項目 | 結果 | 詳細 |
|---|------------|:----:|------|
| IS1 | Release CODE_SIGN_STYLE | ✅ | Manual |
| IS2 | CODE_SIGN_IDENTITY | ⚠️ | 未設定（CI では secrets 経由で設定） |
| IS3 | Provisioning Profile | ⚠️ | ローカル確認が必要 |
| IS4 | Debug CODE_SIGN_STYLE | ✅ | Automatic |
| IS5 | 秘密鍵除外 | ✅ | .p12, .mobileprovision 除外済み |
| IS6 | .xcodeproj 除外 | ✅ | .gitignore に含まれる |
| S1 | .env 除外 | ✅ | .gitignore に含まれる |
| S2 | API キー埋め込みなし | ✅ | ハードコード検出なし |
| S3 | GoogleService-Info.plist | ✅ | .gitignore に含まれる |
| S4 | Keychain アクセス | ✅ | 適切に設定 |
```

---

## Phase 3: デザイン標準 (Ivory & Gold)

以下のファイルを確認する:
- `**/InsightColors.swift`
- `**/InsightTheme.swift`
- `**/InsightTypography.swift`
- `**/Assets.xcassets/Colors/InsightPrimary.colorset/Contents.json`

| # | チェック項目 | 確認内容 |
|---|------------|---------|
| D1 | Gold (#B8942F) がプライマリカラー | `InsightColors.swift` で Gold が `primary` として定義 |
| D2 | Ivory (#FAF8F5) が背景色 | `InsightColors.swift` で Ivory が `bgPrimary` として定義 |
| D3 | Blue (#2563EB) がプライマリ未使用 | `#2563EB` がプライマリとして使われていないこと |
| D4 | Asset Catalog カラー整合性 | `InsightPrimary.colorset` の値が Gold と一致 |
| D5 | ハードコードされた色値なし | SwiftUI コードで直接 `Color(red:...` を使っていないこと（InsightColors 経由であること） |
| D6 | InsightTheme 定義 | `InsightTheme.swift` で Light/Dark テーマが定義されている |
| D7 | InsightTypography 定義 | `InsightTypography.swift` で標準タイポグラフィスケールが定義されている |

**報告フォーマット:** Phase 1 と同様のテーブル形式。

---

## Phase 4: ローカライゼーション

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| L1 | `ja.lproj/Localizable.strings` 存在（日本語） | ファイル存在確認 |
| L2 | `en.lproj/Localizable.strings` 存在（英語） | ファイル存在確認 |
| L3 | 日英のキーが完全一致 | 両ファイルの `"key"` を比較 |
| L4 | SwiftUI で文字列ハードコードなし | `*.swift` ファイルで `Text("日本語")` のようなハードコードを検索 |
| L5 | 日付・数値フォーマットがロケール対応 | 手動確認推奨 |

**L3 の確認方法:**

```
日本語のみに存在するキー: [一覧]
英語のみに存在するキー: [一覧]
→ 両方に存在しないキーがあれば ❌
```

---

## Phase 5: App Store メタデータ

`fastlane/metadata/` ディレクトリの構成を確認する。

| # | チェック項目 | ファイル | 文字数制限 |
|---|------------|---------|:--------:|
| IA1 | 日本語アプリ名 | `ja/name.txt` | 30 |
| IA2 | 英語アプリ名 | `en-US/name.txt` | 30 |
| IA3 | 日本語サブタイトル | `ja/subtitle.txt` | 30 |
| IA3 | 英語サブタイトル | `en-US/subtitle.txt` | 30 |
| IA4 | 日本語説明 | `ja/description.txt` | 4000 |
| IA4 | 英語説明 | `en-US/description.txt` | 4000 |
| IA5 | 日本語リリースノート | `ja/release_notes.txt` | 4000 |
| IA5 | 英語リリースノート | `en-US/release_notes.txt` | 4000 |
| IA6 | スクリーンショット（日英） | `ja/screenshots/` / `en-US/screenshots/` | — |

**ファイルが存在しない場合:**

ディレクトリ構造とテンプレートを提示し、作成を提案する:

```
fastlane/metadata/
├── ja/
│   ├── name.txt              # アプリ名（30文字以内）
│   ├── subtitle.txt          # サブタイトル（30文字以内）
│   ├── description.txt       # 説明（4000文字以内）
│   ├── keywords.txt          # キーワード（100文字以内）
│   ├── release_notes.txt     # リリースノート（4000文字以内）
│   ├── promotional_text.txt  # プロモーションテキスト（170文字以内）
│   └── screenshots/          # スクリーンショット
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
| Q1 | TODO/FIXME/HACK コメント | `*.swift` ファイルで `TODO\|FIXME\|HACK` を検索 |
| Q2 | デバッグ出力 (`print` / `NSLog`) | `*.swift` ファイルで `print(\|NSLog(\|debugPrint(` を検索（ただし `#if DEBUG` 内は OK） |
| Q3 | ハードコードされた API キー | `*.swift` ファイルで秘密鍵パターンを検索 |
| Q4 | Force unwrap (`!`) の確認 | `*.swift` で不適切な force unwrap がないか（パターン検索 + 手動確認） |
| Q5 | SwiftLint 準拠 | `.swiftlint.yml` の存在確認（推奨） |

**Q1 の結果報告:**

```
TODO/FIXME/HACK 検出結果:
- Sources/MyApp/MyScreen.swift:42 — TODO: エラーハンドリング追加
- Sources/MyApp/Repository.swift:15 — FIXME: キャッシュ実装

→ 2件検出。リリース前に解決するか、意図的に残す場合はその理由を確認してください。
```

---

## Phase 7: CI/CD

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| IC1 | `.github/workflows/build.yml` 存在 | ファイル存在確認 |
| IC2 | ワークフローの内容が標準準拠 | macOS runner + XcodeGen install + xcodebuild |
| IC3 | Archive ジョブの存在 | タグトリガーで Archive + コード署名があるか |

**標準 CI ワークフローとの差分がある場合:**

`standards/IOS.md` の CI/CD 標準を参照し、差分を報告する。
`templates/ios/.github/workflows/build.yml` をリファレンスとして比較する。

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

Phase 1: ビルド設定          ✅ 完了 (8/8 OK)
Phase 2: 署名・セキュリティ   ✅ 完了 (10/10 OK)
Phase 3: デザイン標準         ✅ 完了 (7/7 OK)
Phase 4: ローカライゼーション  ✅ 完了 (5/5 OK)
Phase 5: App Store メタデータ ✅ 完了 (6/6 OK)
Phase 6: コード品質           ⚠️ 警告あり (4/5 OK, 警告 1)
Phase 7: CI/CD               ✅ 完了 (3/3 OK)

合計: ✅ OK 43件 / ❌ エラー 0件 / ⚠️ 警告 1件

⚠️ 警告項目:
1. Q1: TODO コメントが 2件残存（意図的であれば OK）

手動確認が必要な項目:
1. [ ] Archive ビルドの成功確認（Xcode → Product → Archive）
2. [ ] スクリーンショットの準備（日英、全デバイスサイズ）
3. [ ] リリースノートの内容承認
4. [ ] Provisioning Profile の有効期限確認
5. [ ] App Store Connect でのアプリ情報確認

→ 全エラーが解消されていればリリース可能です。

次のステップ（GitHub Release 作成）:
  ./insight-common/scripts/create-release.sh .
  # 初回 v1.0.0 の上書き: --version 1.0.0 --overwrite
============================================================
```

---

## 参照ドキュメント

- `standards/IOS.md` — iOS 開発標準
- `standards/RELEASE_CHECKLIST.md` — 全プラットフォーム共通リリースチェックリスト（§3 iOS 固有）
- `standards/LOCALIZATION.md` — ストアメタデータのローカライゼーション（§6）
- `scripts/ios-manage.sh` — iOS プロジェクト管理 CLI（validate / sync-colors）
- `scripts/create-release.sh` — リリース作成ヘルパースクリプト（タグ作成・プッシュ・上書き対応）
- `templates/ios/` — iOS テンプレート（リファレンス実装）
- `CLAUDE.md` §12 — 開発完了チェックリスト
- `CLAUDE.md` §13 — リリースチェック概要
