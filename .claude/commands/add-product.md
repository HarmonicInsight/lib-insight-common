# 新規製品追加コマンド

HARMONIC insight 製品エコシステムに新規製品を追加するガイド付きワークフローです。

`$ARGUMENTS` に製品コードと製品名を指定してください（例: `INXX InsightNewProduct`）。

## 手順

まず以下の情報をユーザーに確認してください:

1. **製品コード**（4文字、例: INXX）
2. **製品名**（例: InsightNewProduct）
3. **製品の説明**
4. **ティア**（Tier 1: 業務変革ツール / Tier 2: AI活用ツール / Tier 3: InsightOffice Suite）
5. **価格帯**（STD / PRO / ENT 各プランの年額）
6. **プラットフォーム**（WPF / React / Python / Android / iOS）
7. **AI アシスタント搭載の有無**
8. **独自拡張子の有無**（InsightOffice 系の場合）

## 確認後の実装手順

1. `config/products.ts` に製品定義を追加
2. `config/products.json` に JSON 版を同期
3. `config/pricing.ts` に価格設定を追加
4. `config/sales-strategy.ts` に販売戦略を追加
5. `config/addon-modules.ts` にモジュール定義を追加（該当する場合）
6. `config/installer.ts` にインストーラー設定を追加（デスクトップアプリの場合）
7. `config/reseller-strategy.ts` にリセラー対象として追加
8. `CLAUDE.md` の製品一覧テーブルを更新

## 検証

すべてのファイルを更新した後、以下を実行:

```bash
bash ./scripts/validate-standards.sh .
```

整合性チェック:
- 製品コードがすべてのファイルで一致しているか
- 価格設定がティアの範囲内か
- リセラー最低ティアが適切か
