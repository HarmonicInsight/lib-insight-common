---
description: Harmonic Insight 開発標準への準拠を検証。カラー、ライセンス、API パターン、禁止事項をチェック。
argument-hint: "[directory]"
---

# 開発標準検証

対象ディレクトリ: $ARGUMENTS (デフォルト: カレントディレクトリ)

## 自動検証

```bash
./insight-common/scripts/validate-standards.sh ${ARGUMENTS:-.}
```

## 手動チェックリスト

以下の項目を順番にチェックしてください:

### 1. デザイン

- [ ] Gold (#B8942F) がプライマリカラーとして使用されている
- [ ] Ivory (#FAF8F5) が背景色として使用されている
- [ ] Blue (#2563EB) がプライマリとして使用されて**いない**
- [ ] ハードコードされた色値がない（変数/StaticResource を使用）

検証コマンド:
```bash
# Blue がプライマリとして使われていないか
grep -rn "#2563EB\|blue-500\|blue-600" --include="*.tsx" --include="*.xaml" --include="*.css" --include="*.py" .
# Gold が使われているか
grep -rn "#B8942F\|brand.primary\|PrimaryColor\|PrimaryBrush" --include="*.tsx" --include="*.xaml" --include="*.css" --include="*.ts" .
```

### 2. ライセンス

- [ ] InsightLicenseManager が実装されている
- [ ] ライセンス画面が Insight Slides 形式に準拠
- [ ] プラン別機能制限が実装されている

### 3. API

- [ ] 全 API で `withGateway()` を使用
- [ ] 権限判定がサーバーサイドのみ
- [ ] `console.log` が本番コードに残っていない

検証コマンド:
```bash
# withGateway なしの API エンドポイント
grep -rn "export default" --include="*.ts" pages/api/ app/api/ 2>/dev/null | grep -v withGateway
# console.log の残留
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ app/ 2>/dev/null
```

### 4. サードパーティ

- [ ] Syncfusion キーが `third-party-licenses.json` 経由で登録
- [ ] API キーがハードコードされていない

### 5. AI アシスタント（InsightOffice 系のみ）

- [ ] Claude API のみ使用（OpenAI/Azure 不可）
- [ ] モデルティア制御が実装されている
- [ ] ライセンスゲートが実装されている

## 結果レポート

チェック結果をサマリーで報告:
- PASS: 準拠している項目
- FAIL: 準拠していない項目と修正方法
- WARN: 確認が必要な項目
