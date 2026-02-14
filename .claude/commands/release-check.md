# リリースチェックコマンド

対象プロジェクトに対して HARMONIC insight のリリース前チェックを包括的に実行します。

## 概要

このコマンドは、`validate-standards.sh`（標準検証）を内部で呼び出した上で、リリース固有のチェック（バージョン、署名、メタデータ、セキュリティ、コード品質）を追加実行します。

## 実行手順

### Step 1: 自動検証の実行

`$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする。

```bash
bash ./scripts/release-check.sh ${ARGUMENTS:-.}
```

### Step 2: 結果の分析

自動検証の結果を分析し、以下を報告:

1. **エラー（✗）**: 必ず修正が必要な項目。修正案を具体的に提示する。
2. **警告（!）**: 確認が推奨される項目。リスクを説明する。
3. **手動確認（⚠）**: 自動検証できない項目。確認方法を案内する。

### Step 3: 未完了項目への対応提案

エラーや警告がある場合、以下のフォーマットで対応案を提示:

```
## リリースチェック結果

### ❌ 要修正（エラー）
1. [項目名]: [問題の説明]
   → 修正方法: [具体的な手順]

### ⚠️ 要確認（警告）
1. [項目名]: [確認すべき内容]

### 📋 手動確認項目
1. [項目名]: [確認手順]
```

### Step 4: プラットフォーム固有の補足

検出されたプラットフォームに応じて、以下の標準ドキュメントを参照して補足情報を提供:

| プラットフォーム | 参照 |
|----------------|------|
| Android | `standards/ANDROID.md` §15 チェックリスト |
| iOS | `standards/IOS.md` |
| C# (WPF) | `standards/CSHARP_WPF.md` |
| React | `standards/REACT.md` |
| Python | `standards/PYTHON.md` |
| Expo | `standards/ANDROID.md` §13.7 チェックリスト |

### Step 5: Play Store / App Store メタデータ

ストアリリースの場合は追加で確認:

**Android（Play Store）**:
- `fastlane/metadata/android/ja-JP/` と `en-US/` の全ファイル
- 文字数制限: title(30), short_description(80), full_description(4000), changelog(500)
- `standards/LOCALIZATION.md` §6 のチェックリストを参照

**iOS（App Store）**:
- `fastlane/metadata/ja/` と `en-US/` の全ファイル
- `standards/LOCALIZATION.md` §6 のチェックリストを参照

## 検証項目サマリー

### 全プラットフォーム共通
- バージョン番号の更新確認
- TODO/FIXME/HACK の残存チェック
- デバッグ出力の残存チェック
- ハードコードされたシークレットの検出
- デザイン標準（Ivory & Gold）準拠
- ローカライゼーション（日本語 + 英語）
- ライセンス管理（InsightOffice 製品）
- Git 状態（未コミット変更、リモート同期）
- AI アシスタント（Claude API のみ、モデルティア制御）

### Android 固有
- versionCode / versionName の更新
- 署名設定（signingConfigs）
- Play Store メタデータ（日英、文字数制限）
- ProGuard/R8 設定

### iOS 固有
- Bundle Version の更新
- App Store メタデータ（日英）
- Provisioning Profile

### C# (WPF) 固有
- AssemblyVersion / FileVersion の更新
- Syncfusion ライセンスのハードコード禁止
- ファイル関連付け（独自拡張子）

### React 固有
- TypeScript strict mode
- console.log の残存チェック
- ビルド成功確認

### Python 固有
- バージョン番号の更新
- 依存パッケージのピン留め

## 参照ドキュメント

- `standards/RELEASE_CHECKLIST.md` — 全チェック項目の詳細
- `standards/LOCALIZATION.md` — ストアメタデータのローカライゼーション
- `CLAUDE.md` §12 — 開発完了チェックリスト
