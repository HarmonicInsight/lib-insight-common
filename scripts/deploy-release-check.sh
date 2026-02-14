#!/bin/bash
#
# 既存リポジトリに release-check スキル・スクリプト・CLAUDE.md を配布するスクリプト
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
#   2. .claude/commands/ に標準スキル（release-check.md, release-check-android.md）を配置
#   3. CLAUDE.md にリリースチェック情報を追加（既存の場合は更新）
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
echo -e "${GOLD} release-check 標準配布スクリプト${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""

# ソースファイルの存在チェック
SKILL_RELEASE_CHECK="$COMMON_DIR/.claude/commands/release-check.md"
SKILL_RELEASE_CHECK_ANDROID="$COMMON_DIR/.claude/commands/release-check-android.md"

if [ ! -f "$SKILL_RELEASE_CHECK" ]; then
    echo -e "${RED}エラー: $SKILL_RELEASE_CHECK が見つかりません${NC}"
    exit 1
fi

echo -e "配布元: ${CYAN}$COMMON_DIR${NC}"
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

# CLAUDE.md テンプレート（リリースチェック対応）
CLAUDE_MD_TEMPLATE='# 開発ガイド

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
| 「リリース」「デプロイ」「公開」「本番」「ship」「release」 | `/release-check` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check` の実行を推奨 |
| 新規 UI 実装 | Ivory & Gold デザイン標準を確認 |'

# CLAUDE.md に追加するセクション（既存の CLAUDE.md に追記する場合）
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
| 「リリース」「デプロイ」「公開」「本番」「ship」「release」 | `/release-check` を提案・実行 |
| 「PR 作って」「プルリク」「マージ」 | `/release-check` の実行を推奨 |
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

    changed=false

    # --------------------------------------------------------
    # 1. .claude/commands/ に標準スキルファイルをコピー
    # --------------------------------------------------------
    mkdir -p .claude/commands

    # release-check.md（全プラットフォーム共通）— 常に最新に上書き
    cp "$SKILL_RELEASE_CHECK" .claude/commands/release-check.md
    echo -e "  ${GREEN}✓${NC} .claude/commands/release-check.md 配置（標準版）"
    changed=true

    # release-check-android.md（Android リポジトリの場合のみ）
    if echo "$repo" | grep -qE "^android-|^mobile-"; then
        if [ -f "$SKILL_RELEASE_CHECK_ANDROID" ]; then
            cp "$SKILL_RELEASE_CHECK_ANDROID" .claude/commands/release-check-android.md
            echo -e "  ${GREEN}✓${NC} .claude/commands/release-check-android.md 配置"
        fi
    fi

    # --------------------------------------------------------
    # 2. .claude/settings.json に SessionStart フックを追加
    #    → 全ブランチでスキル自動同期を保証
    # --------------------------------------------------------
    SETTINGS_FILE=".claude/settings.json"
    SYNC_HOOK_CMD='bash ${CLAUDE_PROJECT_DIR}/insight-common/scripts/sync-skills.sh'

    if [ -f "$SETTINGS_FILE" ]; then
        if ! grep -q "sync-skills.sh" "$SETTINGS_FILE" 2>/dev/null; then
            # 既存の settings.json に SessionStart フックを追加
            # jq が使える場合は jq で、なければ手動追記
            if command -v jq >/dev/null 2>&1; then
                jq --arg cmd "$SYNC_HOOK_CMD" '
                  .hooks.SessionStart = (.hooks.SessionStart // []) + [{
                    "matcher": "",
                    "hooks": [{"type": "command", "command": $cmd}]
                  }]
                ' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
                echo -e "  ${GREEN}✓${NC} .claude/settings.json に sync-skills フック追加"
            else
                echo -e "  ${YELLOW}!${NC} jq 未インストール — .claude/settings.json の手動更新が必要"
            fi
        else
            echo -e "  ${YELLOW}!${NC} sync-skills フックは既に存在（スキップ）"
        fi
    else
        # 新規作成
        cat > "$SETTINGS_FILE" << SETTINGSEOF
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$SYNC_HOOK_CMD"
          }
        ]
      }
    ]
  }
}
SETTINGSEOF
        echo -e "  ${GREEN}✓${NC} .claude/settings.json 新規作成（sync-skills フック）"
    fi

    # --------------------------------------------------------
    # 3. CLAUDE.md にリリースチェック情報を追加/更新
    # --------------------------------------------------------
    if [ -f "CLAUDE.md" ]; then
        if grep -q "release-check\|リリースチェック" CLAUDE.md 2>/dev/null; then
            echo -e "  ${YELLOW}!${NC} CLAUDE.md にリリースチェック情報は既に存在（スキップ）"
        else
            echo "$CLAUDE_ADDITION" >> CLAUDE.md
            echo -e "  ${GREEN}✓${NC} CLAUDE.md にリリースチェック情報を追加"
        fi
    else
        echo "$CLAUDE_MD_TEMPLATE" > CLAUDE.md
        echo -e "  ${GREEN}✓${NC} CLAUDE.md 新規作成（標準テンプレート）"
    fi

    # --------------------------------------------------------
    # 4. コミット & プッシュ
    # --------------------------------------------------------
    if [ "$changed" = true ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "  ${YELLOW}ドライラン: コミット・プッシュはスキップ${NC}"
            ((SUCCESS++)) || true
        else
            git add .claude/commands/release-check.md \
                     .claude/commands/release-check-android.md \
                     .claude/settings.json \
                     CLAUDE.md 2>/dev/null || true
            if git diff --cached --quiet 2>/dev/null; then
                echo -e "  ${YELLOW}!${NC} 変更なし（スキップ）"
                ((SKIPPED++)) || true
            else
                git commit -m "feat: deploy standardized /release-check skill + auto-sync hook

Deploy the full standardized release-check skill from insight-common.
This version includes:
- Phase 0: Auto-bootstrap of insight-common submodule
- Phase 1-5: Standardized phased checking with table format output
- Platform-specific checks with expected values
- SessionStart hook for auto-syncing skills from submodule
- Consistent summary format across all repositories

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
echo -e "${CYAN}配布内容:${NC}"
echo "  - .claude/commands/release-check.md（標準版・全リポ）"
echo "  - .claude/commands/release-check-android.md（Android リポのみ）"
echo "  - .claude/settings.json（SessionStart sync-skills フック）"
echo "  - CLAUDE.md（自動行動ルール追加）"
echo ""
