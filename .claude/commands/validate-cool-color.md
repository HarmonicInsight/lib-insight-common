# Cool Blue & Slate テーマ検証コマンド

対象プロジェクトに対して Cool Blue & Slate テーマ（寒色系カラー標準）の検証を実行します。

## 対象

業務系アプリケーション: INBT（InsightBot）、INCA（InsightNoCodeAnalyzer）、IVIN（InterviewInsight）

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `scripts/validate-cool-color.sh` を実行する
3. エラーがあれば一覧を表示し、修正案を提示する
4. 警告があれば一覧を表示する

```bash
bash ./scripts/validate-cool-color.sh ${ARGUMENTS:-.}
```

検証に失敗した場合は、`standards/COOL_COLOR.md` を参照して修正案を提示してください。

## 主な検証項目

**必須チェック（エラー）:**
- Blue (#2563EB) がプライマリカラーとして使用されているか
- Slate (#F8FAFC) が背景色として使用されているか
- Gold (#B8942F) がプライマリとして使用されて**いない**か
- Ivory (#FAF8F5) が背景として使用されて**いない**か

**推奨チェック（警告）:**
- 高コントラストテキスト (#0F172A) が使用されているか
- ダークサイドバー (#1E293B) が使用されているか
- ステータスバッジカラーが定義されているか

## テーマ選択の確認

以下の製品は Cool Blue & Slate テーマが推奨です:
- **INBT**: InsightBot — RPA ジョブ監視・Agent 管理
- **INCA**: InsightNoCodeAnalyzer — コード解析・移行アセスメント
- **IVIN**: InterviewInsight — ヒアリングデータ分析

以下の製品は引き続き Ivory & Gold テーマを使用してください:
- INSS / IOSH / IOSD / INPY / ISOF / INMV / INIG

参照: `standards/COOL_COLOR.md` §7 テーマ選択ガイドライン
