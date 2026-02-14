# リリースチェックコマンド

対象プロジェクトに対して HARMONIC insight のリリース前チェックを**フェーズ別に対話的**に実行します。

## 重要: 実行ルール

- 各フェーズを**順番に**実行すること。一気に全部やらない。
- 各フェーズ完了後、結果をユーザーに**チェックリスト形式**で提示し、次のフェーズに進むか確認する。
- エラーが見つかった場合、**その場で修正案を提示**し、ユーザーの確認後に修正を実行する。
- TODO ツールを使って全フェーズの進捗を管理する。

## 実行手順

### Phase 0: 準備

1. `$ARGUMENTS` が指定されている場合はそのディレクトリ、未指定の場合はカレントディレクトリを対象にする。
2. プラットフォームを自動検出する:
   - `build.gradle.kts` → Android (Native Kotlin)
   - `app.json` + `expo` → Expo (React Native)
   - `package.json` → React / Next.js
   - `*.csproj` → C# (WPF)
   - `pyproject.toml` / `requirements.txt` → Python
   - `Package.swift` → iOS
3. 検出したプラットフォームをユーザーに通知する。
4. TODO リストに以下のフェーズを登録する:
   - Phase 1: 標準検証（自動スクリプト）
   - Phase 2: コード品質・セキュリティ確認
   - Phase 3: プラットフォーム固有チェック
   - Phase 4: ストアメタデータ確認（モバイルアプリの場合）
   - Phase 5: 最終確認・サマリー

### Phase 1: 標準検証（自動スクリプト）

自動検証スクリプトを実行する。スクリプトのパスは以下の優先順で探す:
- `./scripts/release-check.sh`（insight-common 本体の場合）
- `./insight-common/scripts/release-check.sh`（サブモジュール経由）

```bash
# insight-common 本体
bash ./scripts/release-check.sh ${ARGUMENTS:-.}
# または サブモジュール経由
bash ./insight-common/scripts/release-check.sh ${ARGUMENTS:-.}
```

スクリプトの実行結果を以下のフォーマットでまとめて報告する:

```
## Phase 1: 標準検証 結果

| # | チェック項目 | 結果 | 詳細 |
|---|------------|:----:|------|
| D1 | Gold がプライマリカラー | ✅ / ❌ | ... |
| D2 | Ivory が背景色 | ✅ / ❌ | ... |
| D3 | Blue 未使用 | ✅ / ❌ | ... |
| ... | ... | ... | ... |
```

❌ がある場合はこのフェーズで修正案を提示し、ユーザーの確認を取る。

### Phase 2: コード品質・セキュリティ確認

以下を手動で確認する（Grep ツール等で検索）:

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| Q1 | TODO/FIXME/HACK の残存 | `grep -rn "TODO\|FIXME\|HACK"` |
| Q2 | デバッグ出力の残存 | プラットフォームに応じた検索 |
| Q3 | ハードコードされた API キー | `grep -rn "sk-\|AIza\|AKIA"` |
| S1 | .env が .gitignore に含まれる | `.gitignore` を確認 |
| S2 | credentials ファイルが除外されている | `.gitignore` を確認 |
| G1 | 未コミットの変更がない | `git status` |
| G2 | リモートと同期済み | `git status -sb` |

結果をチェックリスト形式で報告し、問題があればその場で対応する。

### Phase 3: プラットフォーム固有チェック

検出されたプラットフォームに応じて、以下の標準ドキュメントを**読み込んで**チェックリストを実行する:

| プラットフォーム | 参照ドキュメント | チェックリストセクション |
|----------------|----------------|----------------------|
| Android (Native) | `standards/ANDROID.md` | §15 チェックリスト |
| Android (Expo) | `standards/ANDROID.md` | §13.7 チェックリスト |
| iOS | `standards/IOS.md` | リリースチェックリスト |
| C# (WPF) | `standards/CSHARP_WPF.md` | リリースチェックリスト |
| React | `standards/REACT.md` | リリースチェックリスト |
| Python | `standards/PYTHON.md` | リリースチェックリスト |

**Android の場合の主要チェック項目:**

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| A1 | versionCode インクリメント | `build.gradle.kts` 確認 |
| A2 | versionName 更新 | `build.gradle.kts` 確認 |
| A3-A5 | SDK バージョン (compile=35, target=35, min=26) | `build.gradle.kts` 確認 |
| A6-A7 | R8 有効 (minify + shrink) | `build.gradle.kts` release ブロック確認 |
| A8 | ProGuard ルール存在 | ファイル存在確認 |
| AS1 | release signingConfig 設定 | `build.gradle.kts` 確認 |
| AS3 | keystore が .gitignore に含まれる | `.gitignore` 確認 |

各項目を**1つずつ**確認し、結果をチェックリスト形式で報告する。

### Phase 4: ストアメタデータ確認

モバイルアプリ（Android / iOS / Expo）の場合のみ実行。

**Android (Play Store):**

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| AP1 | `fastlane/metadata/android/ja-JP/title.txt` 存在 (30文字以内) | ファイル確認 + 文字数カウント |
| AP2 | `fastlane/metadata/android/en-US/title.txt` 存在 (30文字以内) | ファイル確認 + 文字数カウント |
| AP3 | `short_description.txt` 日英存在 (80文字以内) | ファイル確認 + 文字数カウント |
| AP4 | `full_description.txt` 日英存在 (4000文字以内) | ファイル確認 + 文字数カウント |
| AP5 | `changelogs/default.txt` 日英存在 (500文字以内) | ファイル確認 + 文字数カウント |
| AP7 | スクリーンショット準備 | ユーザーに確認 |

ファイルが存在しない場合は、テンプレートを提示して作成を提案する。
`standards/LOCALIZATION.md` §6 を参照。

**iOS (App Store):**

| # | チェック項目 | 確認方法 |
|---|------------|---------|
| IA1 | `name.txt` 日英存在 (30文字以内) | ファイル確認 |
| IA2 | `subtitle.txt` 日英存在 (30文字以内) | ファイル確認 |
| IA3 | `description.txt` 日英存在 | ファイル確認 |
| IA5 | `release_notes.txt` 日英存在 | ファイル確認 |
| IA6 | スクリーンショット準備 | ユーザーに確認 |

### Phase 5: 最終確認・サマリー

全フェーズの結果を統合し、最終サマリーを表示する:

```
========================================
 リリースチェック 最終サマリー
========================================

対象: [プロジェクトパス]
プラットフォーム: [検出されたプラットフォーム]
実行日時: [日時]

Phase 1: 標準検証         ✅ 完了 (エラー: 0)
Phase 2: コード品質       ✅ 完了 (エラー: 0, 警告: 1)
Phase 3: プラットフォーム  ✅ 完了 (エラー: 0)
Phase 4: ストアメタデータ  ✅ 完了

合計: エラー 0件 / 警告 1件 / 手動確認 3件

手動確認が必要な項目:
1. [ ] スクリーンショットの準備
2. [ ] Release APK/AAB のインストール・動作確認
3. [ ] リリースノートの内容承認

→ 全エラーが解消されていればリリース可能です。
========================================
```

## プラットフォーム別の専用スキル

より詳細なプラットフォーム固有チェックが必要な場合は、専用スキルを使用してください:

- `/release-check-android` — Android (Native Kotlin) 専用の詳細チェック

## 参照ドキュメント

- `standards/RELEASE_CHECKLIST.md` — 全チェック項目の詳細定義（チェック ID 付き）
- `standards/LOCALIZATION.md` — ストアメタデータのローカライゼーション
- `CLAUDE.md` §12 — 開発完了チェックリスト
- `CLAUDE.md` §13 — リリースチェック概要
