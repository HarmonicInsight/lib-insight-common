#!/bin/bash
#
# HARMONIC insight リリース作成スクリプト
#
# Android アプリの GitHub Release を作成する。
# build.gradle.kts から versionName を読み取り、タグを作成して push する。
# GitHub Actions の build.yml が v* タグで GitHub Release を自動作成する。
#
# 使い方:
#   ./create-release.sh <project-directory> [options]
#
# オプション:
#   --version <version>   バージョンを指定（省略時は build.gradle.kts から読み取り）
#   --overwrite           既存の同一バージョンの Release とタグを削除して再作成
#   --dry-run             実際には実行せず、実行予定の操作を表示
#   --skip-checks         release-check.sh をスキップ
#   --draft               ドラフトリリースとして作成
#   --prerelease <suffix> プレリリースサフィックスを付与（rc.1, beta.1, alpha.1）
#   --help                ヘルプを表示
#
# 前提:
#   - gh CLI がインストール済み（GitHub Release の削除に使用）
#   - git が設定済み（push 権限あり）
#   - build.gradle.kts に versionName / versionCode が定義されている
#

set -e

# ============================================================
# カラー定義
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ============================================================
# ヘルパー関数
# ============================================================
print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} HARMONIC insight リリース作成${NC}"
    echo -e "${GOLD}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${CYAN}[$1/$TOTAL_STEPS]${NC} $2"
}

print_ok() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "  ${RED}✗${NC} $1"
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "  ${BLUE}→${NC} $1"
}

print_dryrun() {
    echo -e "  ${YELLOW}[dry-run]${NC} $1"
}

usage() {
    echo "使用方法: $0 <project-directory> [options]"
    echo ""
    echo "オプション:"
    echo "  --version <version>     バージョンを指定（例: 1.1.0）"
    echo "  --overwrite             既存リリースを削除して再作成"
    echo "  --dry-run               実行予定の操作を表示（実際には実行しない）"
    echo "  --skip-checks           release-check.sh をスキップ"
    echo "  --draft                 ドラフトリリースとして作成"
    echo "  --prerelease <suffix>   プレリリースサフィックス（例: rc.1, beta.1）"
    echo "  --help                  このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0 .                                    # build.gradle.kts からバージョンを読み取り"
    echo "  $0 . --version 1.0.0                    # バージョン指定"
    echo "  $0 . --version 1.0.0 --overwrite        # 既存の v1.0.0 を上書き"
    echo "  $0 . --prerelease rc.1                  # v1.0.0-rc.1 として作成"
    echo "  $0 . --draft                            # ドラフトリリース"
    echo "  $0 . --dry-run                          # 確認のみ（実行しない）"
    exit 0
}

# ============================================================
# 引数解析
# ============================================================
PROJECT_DIR=""
VERSION=""
OVERWRITE=false
DRY_RUN=false
SKIP_CHECKS=false
DRAFT=false
PRERELEASE_SUFFIX=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)
            VERSION="$2"
            shift 2
            ;;
        --overwrite)
            OVERWRITE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --draft)
            DRAFT=true
            shift
            ;;
        --prerelease)
            PRERELEASE_SUFFIX="$2"
            shift 2
            ;;
        --help|-h)
            usage
            ;;
        *)
            if [ -z "$PROJECT_DIR" ]; then
                PROJECT_DIR="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: プロジェクトディレクトリを指定してください${NC}"
    echo ""
    usage
fi

# プロジェクトディレクトリの正規化
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}エラー: ディレクトリが存在しません: $PROJECT_DIR${NC}"
    exit 1
fi

# ============================================================
# メイン処理
# ============================================================
TOTAL_STEPS=6
print_header

# --- Step 1: プラットフォーム検出・バージョン読み取り ---
print_step 1 "バージョン情報の確認"

# build.gradle.kts からバージョンを読み取り
GRADLE_FILE=""
for f in "$PROJECT_DIR/app/build.gradle.kts" "$PROJECT_DIR/app/build.gradle"; do
    if [ -f "$f" ]; then
        GRADLE_FILE="$f"
        break
    fi
done

if [ -z "$GRADLE_FILE" ]; then
    print_error "build.gradle.kts が見つかりません: $PROJECT_DIR/app/"
    exit 1
fi

# versionName を読み取り
GRADLE_VERSION_NAME=$(grep -oP 'versionName\s*=?\s*"?\K[0-9]+\.[0-9]+\.[0-9]+' "$GRADLE_FILE" 2>/dev/null || true)
GRADLE_VERSION_CODE=$(grep -oP 'versionCode\s*=?\s*\K[0-9]+' "$GRADLE_FILE" 2>/dev/null || true)

if [ -n "$GRADLE_VERSION_NAME" ]; then
    print_ok "build.gradle.kts の versionName: $GRADLE_VERSION_NAME"
else
    print_warning "build.gradle.kts から versionName を読み取れませんでした"
fi

if [ -n "$GRADLE_VERSION_CODE" ]; then
    print_ok "build.gradle.kts の versionCode: $GRADLE_VERSION_CODE"
else
    print_warning "build.gradle.kts から versionCode を読み取れませんでした"
fi

# バージョン決定
if [ -z "$VERSION" ]; then
    if [ -n "$GRADLE_VERSION_NAME" ]; then
        VERSION="$GRADLE_VERSION_NAME"
        print_info "build.gradle.kts からバージョンを使用: $VERSION"
    else
        print_error "バージョンを指定してください（--version オプション）"
        exit 1
    fi
fi

# セマンティックバージョニングの検証
if ! echo "$VERSION" | grep -qP '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    print_error "バージョン形式が不正です: $VERSION（MAJOR.MINOR.PATCH 形式で指定してください）"
    exit 1
fi
print_ok "バージョン形式: OK ($VERSION)"

# build.gradle.kts のバージョンと一致するか確認
if [ -n "$GRADLE_VERSION_NAME" ] && [ "$VERSION" != "$GRADLE_VERSION_NAME" ]; then
    print_warning "指定バージョン ($VERSION) と build.gradle.kts ($GRADLE_VERSION_NAME) が異なります"
    print_warning "build.gradle.kts の versionName を $VERSION に更新してください"
fi

# タグ名の決定
if [ -n "$PRERELEASE_SUFFIX" ]; then
    TAG_NAME="v${VERSION}-${PRERELEASE_SUFFIX}"
    print_info "プレリリースタグ: $TAG_NAME"
else
    TAG_NAME="v${VERSION}"
fi
echo ""

# --- Step 2: Git 状態の確認 ---
print_step 2 "Git 状態の確認"

cd "$PROJECT_DIR"

# Git リポジトリか確認
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "Git リポジトリではありません: $PROJECT_DIR"
    exit 1
fi

# 現在のブランチ
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
print_ok "現在のブランチ: $CURRENT_BRANCH"

# 未コミットの変更があるか
if [ -n "$(git status --porcelain)" ]; then
    print_warning "未コミットの変更があります"
    git status --short
    echo ""
    print_info "リリースコミットに含める場合は、先に git add && git commit してください"
    print_info "または、このスクリプトが自動でコミットします"

    if [ "$DRY_RUN" = false ]; then
        echo ""
        echo -ne "  未コミットの変更をリリースコミットに含めますか？ (y/N): "
        read -r INCLUDE_CHANGES
        if [ "$INCLUDE_CHANGES" = "y" ] || [ "$INCLUDE_CHANGES" = "Y" ]; then
            git add -A
            git commit -m "release: ${TAG_NAME}"
            print_ok "変更をコミットしました: release: ${TAG_NAME}"
        else
            print_error "未コミットの変更があるため中断します。先にコミットしてください。"
            exit 1
        fi
    else
        print_dryrun "git add -A && git commit -m 'release: ${TAG_NAME}'"
    fi
else
    print_ok "ワーキングツリーはクリーンです"
fi

# リモートとの同期状態
REMOTE_BRANCH=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
if [ -n "$REMOTE_BRANCH" ]; then
    LOCAL_HEAD=$(git rev-parse HEAD)
    REMOTE_HEAD=$(git rev-parse "$REMOTE_BRANCH" 2>/dev/null || echo "")
    if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
        print_ok "リモートと同期済み"
    else
        print_warning "リモートと同期されていません（push が必要です）"
    fi
else
    print_warning "リモートトラッキングブランチが設定されていません"
fi
echo ""

# --- Step 3: 既存タグ・リリースの確認 ---
print_step 3 "既存タグ・リリースの確認"

TAG_EXISTS=false
RELEASE_EXISTS=false

# ローカルタグの確認
if git tag -l "$TAG_NAME" | grep -q "$TAG_NAME"; then
    TAG_EXISTS=true
    print_warning "ローカルタグ '$TAG_NAME' が既に存在します"
else
    print_ok "ローカルタグ '$TAG_NAME' は存在しません"
fi

# リモートタグの確認
if git ls-remote --tags origin "$TAG_NAME" 2>/dev/null | grep -q "$TAG_NAME"; then
    TAG_EXISTS=true
    print_warning "リモートタグ '$TAG_NAME' が既に存在します"
else
    print_ok "リモートタグ '$TAG_NAME' は存在しません（リモート）"
fi

# GitHub Release の確認（gh CLI が利用可能な場合）
if command -v gh &> /dev/null; then
    if gh release view "$TAG_NAME" > /dev/null 2>&1; then
        RELEASE_EXISTS=true
        print_warning "GitHub Release '$TAG_NAME' が既に存在します"
    else
        print_ok "GitHub Release '$TAG_NAME' は存在しません"
    fi
else
    print_warning "gh CLI が未インストールのため GitHub Release の確認をスキップ"
fi

# 既存タグ/リリースがある場合の処理
if [ "$TAG_EXISTS" = true ] || [ "$RELEASE_EXISTS" = true ]; then
    if [ "$OVERWRITE" = true ]; then
        print_info "--overwrite が指定されています。既存のタグ/リリースを削除します"
        echo ""

        if [ "$DRY_RUN" = false ]; then
            # GitHub Release の削除
            if [ "$RELEASE_EXISTS" = true ] && command -v gh &> /dev/null; then
                echo -ne "  GitHub Release '$TAG_NAME' を削除します... "
                if gh release delete "$TAG_NAME" --yes 2>/dev/null; then
                    echo -e "${GREEN}OK${NC}"
                else
                    echo -e "${YELLOW}スキップ（存在しないか権限不足）${NC}"
                fi
            fi

            # リモートタグの削除
            echo -ne "  リモートタグ '$TAG_NAME' を削除します... "
            if git push origin --delete "$TAG_NAME" 2>/dev/null; then
                echo -e "${GREEN}OK${NC}"
            else
                echo -e "${YELLOW}スキップ（存在しない）${NC}"
            fi

            # ローカルタグの削除
            echo -ne "  ローカルタグ '$TAG_NAME' を削除します... "
            if git tag -d "$TAG_NAME" 2>/dev/null; then
                echo -e "${GREEN}OK${NC}"
            else
                echo -e "${YELLOW}スキップ（存在しない）${NC}"
            fi

            print_ok "既存のタグ/リリースを削除しました"
        else
            print_dryrun "gh release delete $TAG_NAME --yes"
            print_dryrun "git push origin --delete $TAG_NAME"
            print_dryrun "git tag -d $TAG_NAME"
        fi
    else
        echo ""
        print_error "タグ '$TAG_NAME' が既に存在します"
        print_info "上書きする場合は --overwrite オプションを指定してください:"
        print_info "  $0 $PROJECT_DIR --version $VERSION --overwrite"
        exit 1
    fi
fi
echo ""

# --- Step 4: リリースチェック ---
print_step 4 "リリースチェック"

if [ "$SKIP_CHECKS" = true ]; then
    print_warning "リリースチェックをスキップします（--skip-checks）"
else
    # insight-common のパスを探す
    INSIGHT_COMMON=""
    for p in "$PROJECT_DIR/insight-common" "$PROJECT_DIR/../cross-lib-insight-common" "$(dirname "$0")/.."; do
        if [ -f "$p/scripts/release-check.sh" ]; then
            INSIGHT_COMMON="$(cd "$p" && pwd)"
            break
        fi
    done

    if [ -n "$INSIGHT_COMMON" ]; then
        print_info "release-check.sh を実行します..."
        echo ""
        if "$INSIGHT_COMMON/scripts/release-check.sh" "$PROJECT_DIR" --platform android; then
            print_ok "リリースチェック: OK"
        else
            echo ""
            print_warning "リリースチェックで問題が検出されました"
            if [ "$DRY_RUN" = false ]; then
                echo -ne "  続行しますか？ (y/N): "
                read -r CONTINUE
                if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
                    print_error "中断しました"
                    exit 1
                fi
            fi
        fi
    else
        print_warning "release-check.sh が見つからないためスキップ"
    fi
fi
echo ""

# --- Step 5: タグ作成・プッシュ ---
print_step 5 "タグ作成・プッシュ"

if [ "$DRY_RUN" = false ]; then
    # ローカルコミットをプッシュ
    echo -ne "  コミットをプッシュしています... "
    if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}スキップ（既に最新 or プッシュ不要）${NC}"
    fi

    # タグ作成
    echo -ne "  タグ '$TAG_NAME' を作成しています... "
    git tag "$TAG_NAME"
    echo -e "${GREEN}OK${NC}"

    # タグをプッシュ
    echo -ne "  タグをプッシュしています... "

    # リトライロジック（最大4回、指数バックオフ）
    RETRY_COUNT=0
    MAX_RETRIES=4
    BACKOFF=2

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if git push origin "$TAG_NAME" 2>/dev/null; then
            echo -e "${GREEN}OK${NC}"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo -ne "${YELLOW}リトライ ($RETRY_COUNT/$MAX_RETRIES)... ${NC}"
                sleep $BACKOFF
                BACKOFF=$((BACKOFF * 2))
            else
                echo -e "${RED}失敗${NC}"
                print_error "タグのプッシュに失敗しました。ネットワークを確認してください。"
                exit 1
            fi
        fi
    done

    print_ok "タグ '$TAG_NAME' をプッシュしました"
else
    print_dryrun "git push origin $CURRENT_BRANCH"
    print_dryrun "git tag $TAG_NAME"
    print_dryrun "git push origin $TAG_NAME"
fi
echo ""

# --- Step 6: 完了サマリー ---
print_step 6 "完了"

echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} リリース作成完了${NC}"
echo -e "${GOLD}========================================${NC}"
echo ""
echo -e "  バージョン:   ${BOLD}$VERSION${NC}"
echo -e "  タグ:         ${BOLD}$TAG_NAME${NC}"
echo -e "  versionCode:  ${BOLD}${GRADLE_VERSION_CODE:-不明}${NC}"
if [ -n "$PRERELEASE_SUFFIX" ]; then
    echo -e "  種別:         ${YELLOW}プレリリース${NC}"
fi
if [ "$DRAFT" = true ]; then
    echo -e "  種別:         ${YELLOW}ドラフト${NC}"
fi
if [ "$OVERWRITE" = true ]; then
    echo -e "  上書き:       ${YELLOW}はい${NC}"
fi
echo ""

if [ "$DRY_RUN" = false ]; then
    # GitHub リポジトリの URL を取得
    REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's|git@github.com:|https://github.com/|')
    if [ -n "$REPO_URL" ]; then
        echo -e "  ${BLUE}GitHub Actions:${NC}"
        echo -e "    ${REPO_URL}/actions"
        echo ""
        echo -e "  ${BLUE}リリースページ（ビルド完了後）:${NC}"
        echo -e "    ${REPO_URL}/releases/tag/${TAG_NAME}"
    fi

    echo ""
    echo -e "  ${GREEN}次のステップ:${NC}"
    echo "    1. GitHub Actions のビルドが完了するのを待つ"
    echo "    2. Releases ページで APK / AAB をダウンロード"
    echo "    3. リリースノートを確認・編集"
    echo "    4. Play Store に AAB をアップロード（必要な場合）"
else
    echo -e "  ${YELLOW}[dry-run] 実際の操作は行われませんでした${NC}"
fi

echo ""
