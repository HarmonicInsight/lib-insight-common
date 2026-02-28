# 標準レビューコマンド

HARMONIC insight 開発標準に基づくコードレビューを実行します。

**ACTION REQUIRED**: Task ツールを使用してサブエージェントを起動してください。

Task ツールのパラメータ:
- **subagent_type**: general-purpose
- **description**: Standards review
- **prompt**:

以下の手順でレビューを実行してください:

1. `.claude/agents/standards-reviewer.md` を読み、レビュー手順を確認する
2. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はブランチの変更差分を対象にする
3. 変更差分を `git diff main...HEAD` で取得する
4. 以下のチェックリストに沿ってレビューする:

### チェックリスト

**カラー標準**
- [ ] Gold (#B8942F) がプライマリカラーとして使用されている
- [ ] Ivory (#FAF8F5) が背景色として使用されている
- [ ] Blue (#2563EB) がプライマリとして使用されていない
- [ ] ハードコードされた色値がなく StaticResource/変数を使用している

**ライセンス**
- [ ] InsightLicenseManager が使用されている
- [ ] ライセンス画面が Insight Slides 形式に準拠している
- [ ] プラン体系: FREE / TRIAL / BIZ / ENT

**AI アシスタント（該当する場合）**
- [ ] Claude (Anthropic) API のみ使用
- [ ] モデル選択はティアで自動決定（ユーザー選択不可）
- [ ] ライセンスゲートが実装されている

**サードパーティ**
- [ ] Syncfusion キーが third-party-licenses.json 経由

5. レビュー結果をフィードバック形式（Critical / Important / Note / Summary）で報告する
