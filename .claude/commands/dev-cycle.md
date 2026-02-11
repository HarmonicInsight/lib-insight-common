# 開発サイクルコマンド

開発 → レビュー → 修正 のサイクルを自動オーケストレーションします。

`$ARGUMENTS` に実装対象の説明を指定してください。

## プロセス

あなたはオーケストレーターです。**自分で直接コードの実装やレビューを行わず**、必ず Task ツールでサブエージェントを起動してください。

### Phase 1: 準備

1. `$ARGUMENTS` の要件を理解する
2. フィーチャーブランチがなければ作成する
3. 既存のタスクファイルやレビューファイルを確認する

### Phase 2: 開発ループ（最大 5 回）

**Step A: 開発エージェント起動**

Task ツールを使用:
- **subagent_type**: general-purpose
- **description**: Developer implementing feature
- **prompt**: `.claude/agents/config-developer.md` を読み、要件に基づいて実装する

**Step B: レビューエージェント起動**

Task ツールを使用:
- **subagent_type**: general-purpose
- **description**: Standards review
- **prompt**: `.claude/agents/standards-reviewer.md` を読み、変更をレビューする

**Step C: 判定**

- APPROVE → Phase 3 へ
- REQUEST CHANGES → フィードバックを開発エージェントに渡して Step A に戻る

### Phase 3: 完了

1. テスト・リントを実行する
2. 標準検証を実行する: `bash ./scripts/validate-standards.sh .`
3. 実施内容のサマリーを報告する
4. コミットメッセージを提案する

## 各イテレーション後の報告

ユーザーに以下を報告:
- 実装された内容
- レビューの指摘事項
- 現在のステータス（承認済み / 修正中 / 回数上限）

5 回のイテレーションで APPROVE に至らない場合は、残課題をまとめてユーザーに判断を仰ぐ。
