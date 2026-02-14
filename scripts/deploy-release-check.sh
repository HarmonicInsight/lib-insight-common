#!/bin/bash
#
# 既存リポジトリに release-check スキルと CLAUDE.md を配布するスクリプト
#
# 使い方:
#   ./deploy-release-check.sh [--dry-run]
#
# 前提:
#   - GitHub CLI (gh) がインストール済み
#   - HarmonicInsight org へのアクセス権限あり
#   - このスクリプトは insight-common/scripts/ から実行
#
# 動作:
#   1. 各リポジトリを /tmp にクローン
#   2. .claude/commands/release-check.md を配置
#   3. CLAUDE.md にリリースチェック情報を追加（既存の場合はスキップ）
#   4. コミット + プッシュ
#

set -e

# カラー
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GOLD='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}ドライラン: 変更はコミット・プッシュしません${NC}"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMON_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} release-check 配布スクリプト${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""

# 対象リポジトリ（dependent-repos.ts から抽出）
REPOS=(
    "win-app-nocode-analyzer"
    "win-app-insight-bot"
    "web-app-auto-interview"
    "win-app-insight-movie-gen"
    "win-app-insight-image-gen"
    "win-app-insight-slide"
    "win-app-insight-sheet"
    "win-app-insight-doc"
    "win-app-insight-py"
    "win-app-insight-py-pro"
    "win-app-insight-sheet-senior"
    "win-app-insight-launcher"
    "android-app-insight-launcher"
    "android-app-insight-voice-clock"
    "android-app-insight-camera"
    "mobile-app-voice-memo"
    "win-app-insight-pinboard"
    "web-app-insight-qr"
    "android-app-insight-qr"
)

WORK_DIR=$(mktemp -d)
SUCCESS=0
SKIPPED=0
FAILED=0

echo "作業ディレクトリ: $WORK_DIR"
echo "対象リポジトリ: ${#REPOS[@]} 件"
echo ""

# release-check.md の内容
RELEASE_CHECK_SKILL='# リリースチェック

リリース前の包括チェック（標準検証 + リリース固有チェック）を実行します。

## 実行手順

1. `$ARGUMENTS` が指定されている場合はそのディレクトリを対象に、未指定の場合はカレントディレクトリを対象にする
2. `insight-common/scripts/release-check.sh` を実行する

```bash
bash ./insight-common/scripts/release-check.sh ${ARGUMENTS:-.}
```

3. エラーがあれば修正案を具体的に提示する
4. 警告があれば確認すべき内容を説明する
5. 手動確認項目の一覧を表示する

検証に失敗した場合は `standards/RELEASE_CHECKLIST.md` を参照して対応案を提示してください。

検証項目:
- デザイン標準（Ivory & Gold）
- バージョン番号の更新
- TODO/FIXME/HACK の残存
- デバッグ出力の残存
- ハードコードされたシークレット
- ローカライゼーション（日本語 + 英語）
- ライセンス管理
- Git 状態
- プラットフォーム固有チェック'

# CLAUDE.md に追加するセクション
CLAUDE_ADDITION='
## リリースチェック

> リリース前に必ず実行してください。

```bash
# リリース前の包括チェック
./insight-common/scripts/release-check.sh .
```

または Claude Code で `/release-check` を実行。

### AI アシスタント自動行動ルール

| トリガー | アクション |
|---------|----------|
| 「リリース」「デプロイ」「公開」「本番」 | `/release-check` を提案・実行 |
| 新規 UI 実装 | Ivory & Gold デザイン標準を確認 |'

for repo in "${REPOS[@]}"; do
    echo -e "${CYAN}--- $repo ---${NC}"

    repo_dir="$WORK_DIR/$repo"

    # クローン
    if ! gh repo clone "HarmonicInsight/$repo" "$repo_dir" -- --depth 1 2>/dev/null; then
        echo -e "  ${RED}✗ クローン失敗（スキップ）${NC}"
        ((FAILED++)) || true
        continue
    fi

    cd "$repo_dir"

    # .claude/commands/release-check.md を配置
    changed=false

    mkdir -p .claude/commands
    if [ ! -f ".claude/commands/release-check.md" ]; then
        echo "$RELEASE_CHECK_SKILL" > .claude/commands/release-check.md
        echo -e "  ${GREEN}✓${NC} .claude/commands/release-check.md 作成"
        changed=true
    else
        echo -e "  ${YELLOW}!${NC} .claude/commands/release-check.md は既に存在（スキップ）"
    fi

    # CLAUDE.md にリリースチェック情報を追加
    if [ -f "CLAUDE.md" ]; then
        if grep -q "release-check\|リリースチェック" CLAUDE.md 2>/dev/null; then
            echo -e "  ${YELLOW}!${NC} CLAUDE.md にリリースチェック情報は既に存在（スキップ）"
        else
            echo "$CLAUDE_ADDITION" >> CLAUDE.md
            echo -e "  ${GREEN}✓${NC} CLAUDE.md にリリースチェック情報を追加"
            changed=true
        fi
    else
        # CLAUDE.md がない場合は新規作成
        cat > CLAUDE.md << 'CLEOF'
# 開発ガイド

> このプロジェクトは `insight-common/CLAUDE.md` の全標準に準拠します。
> 開発・レビュー・リリース前に必ず参照してください。

## 標準ドキュメント

```bash
cat insight-common/CLAUDE.md                          # 全体ガイド
cat insight-common/standards/RELEASE_CHECKLIST.md     # リリースチェック
```

## 検証コマンド

```bash
# 開発中の標準検証
./insight-common/scripts/validate-standards.sh .

# リリース前の包括チェック
./insight-common/scripts/release-check.sh .
```

## AI アシスタント自動行動ルール

| トリガー | アクション |
|---------|----------|
| 「リリース」「デプロイ」「公開」「本番」 | `/release-check` を提案・実行 |
| 新規 UI 実装 | Ivory & Gold デザイン標準を確認 |
CLEOF
        echo -e "  ${GREEN}✓${NC} CLAUDE.md 新規作成"
        changed=true
    fi

    # コミット & プッシュ
    if [ "$changed" = true ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "  ${YELLOW}ドライラン: コミット・プッシュはスキップ${NC}"
            ((SUCCESS++)) || true
        else
            git add .claude/commands/release-check.md CLAUDE.md 2>/dev/null || true
            if git diff --cached --quiet 2>/dev/null; then
                echo -e "  ${YELLOW}!${NC} 変更なし（スキップ）"
                ((SKIPPED++)) || true
            else
                git commit -m "feat: add /release-check skill for automated release validation

Deploy release-check skill (.claude/commands/release-check.md) and
update CLAUDE.md with auto-action rules. AI will now proactively
suggest release checks when users mention releasing or deploying.

See: insight-common/standards/RELEASE_CHECKLIST.md"
                git push origin HEAD
                echo -e "  ${GREEN}✓ コミット & プッシュ完了${NC}"
                ((SUCCESS++)) || true
            fi
        fi
    else
        echo -e "  ${YELLOW}!${NC} 変更不要（スキップ）"
        ((SKIPPED++)) || true
    fi

    cd "$WORK_DIR"
done

# クリーンアップ
rm -rf "$WORK_DIR"

# サマリー
echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} 配布結果${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""
echo -e "  ${GREEN}成功: ${SUCCESS} 件${NC}"
echo -e "  ${YELLOW}スキップ: ${SKIPPED} 件${NC}"
echo -e "  ${RED}失敗: ${FAILED} 件${NC}"
echo ""
echo -e "合計: ${#REPOS[@]} リポジトリ"
echo ""
