#!/bin/bash
# ============================================
# 全環境ビルドエラー自動修正スクリプト
# Harmonic Insight - insight-common
# ============================================

MAX_ATTEMPTS=5
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)}"

echo "============================================"
echo "  Auto-Fix Build Errors"
echo "  Repository: $REPO"
echo "============================================"

# ---------------------------------------------
# 1. GitHub Actions チェック
# ---------------------------------------------
check_github_actions() {
    echo ""
    echo "[GitHub Actions] Checking..."

    RUN_ID=$(gh run list --status failure --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null)

    if [ -z "$RUN_ID" ]; then
        echo "  OK - No failed runs"
        return 0
    fi

    echo "  FAILED - Run #$RUN_ID"
    ERROR_LOG=$(gh run view $RUN_ID --log-failed 2>/dev/null | tail -100)

    echo "  Fixing with Claude Code..."
    claude -p "GitHub Actionsのビルドエラーを修正してください。ファイルを直接編集してください。

エラーログ:
$ERROR_LOG"

    return 1
}

# ---------------------------------------------
# 2. Vercel チェック
# ---------------------------------------------
check_vercel() {
    echo ""
    echo "[Vercel] Checking..."

    if ! command -v vercel &> /dev/null; then
        echo "  SKIP - CLI not configured"
        return 0
    fi

    DEPLOY_STATUS=$(vercel list --json 2>/dev/null | head -1 | jq -r '.[0].state' 2>/dev/null)

    if [ "$DEPLOY_STATUS" != "ERROR" ]; then
        echo "  OK - No failed deployments"
        return 0
    fi

    DEPLOY_URL=$(vercel list --json 2>/dev/null | head -1 | jq -r '.[0].url' 2>/dev/null)
    echo "  FAILED - $DEPLOY_URL"

    ERROR_LOG=$(vercel logs $DEPLOY_URL 2>/dev/null | tail -50)

    echo "  Fixing with Claude Code..."
    claude -p "Vercelのビルドエラーを修正してください。ファイルを直接編集してください。

エラーログ:
$ERROR_LOG"

    return 1
}

# ---------------------------------------------
# 3. Railway チェック
# ---------------------------------------------
check_railway() {
    echo ""
    echo "[Railway] Checking..."

    if ! command -v railway &> /dev/null; then
        echo "  SKIP - CLI not configured"
        return 0
    fi

    ERROR_LOG=$(railway logs 2>/dev/null | grep -i "error" | tail -30)

    if [ -z "$ERROR_LOG" ]; then
        echo "  OK - No errors detected"
        return 0
    fi

    echo "  FAILED - Errors found in logs"
    echo "  Fixing with Claude Code..."

    claude -p "Railwayのビルドエラーを修正してください。ファイルを直接編集してください。

エラーログ:
$ERROR_LOG"

    return 1
}

# ---------------------------------------------
# 4. EAS (Expo) チェック
# ---------------------------------------------
check_eas() {
    echo ""
    echo "[EAS (Expo)] Checking..."

    if ! command -v eas &> /dev/null; then
        echo "  SKIP - CLI not configured"
        return 0
    fi

    BUILD_ID=$(eas build:list --status=errored --limit=1 --json 2>/dev/null | jq -r '.[0].id' 2>/dev/null)

    if [ -z "$BUILD_ID" ] || [ "$BUILD_ID" == "null" ]; then
        echo "  OK - No failed builds"
        return 0
    fi

    echo "  FAILED - Build $BUILD_ID"
    ERROR_LOG=$(eas build:view $BUILD_ID --json 2>/dev/null | jq -r '.message // .error // "Unknown error"')

    echo "  Fixing with Claude Code..."
    claude -p "EAS (Expo)のビルドエラーを修正してください。ファイルを直接編集してください。

Build ID: $BUILD_ID
エラー:
$ERROR_LOG"

    return 1
}

# ---------------------------------------------
# 5. Supabase チェック
# ---------------------------------------------
check_supabase() {
    echo ""
    echo "[Supabase] Checking..."

    if ! command -v supabase &> /dev/null; then
        echo "  SKIP - CLI not configured"
        return 0
    fi

    # Edge Functions のエラーチェック
    FUNCTIONS=$(supabase functions list 2>/dev/null)

    if [ -z "$FUNCTIONS" ]; then
        echo "  SKIP - No project linked"
        return 0
    fi

    # マイグレーションエラーチェック
    MIGRATION_STATUS=$(supabase db diff 2>&1)

    if echo "$MIGRATION_STATUS" | grep -qi "error"; then
        echo "  FAILED - Migration errors"
        echo "  Fixing with Claude Code..."

        claude -p "Supabaseのマイグレーションエラーを修正してください。ファイルを直接編集してください。

エラー:
$MIGRATION_STATUS"

        return 1
    fi

    echo "  OK - No errors detected"
    return 0
}

# ---------------------------------------------
# 6. ローカルビルド チェック
# ---------------------------------------------
check_local_build() {
    echo ""
    echo "[Local Build] Checking..."

    if [ -f "package.json" ]; then
        BUILD_OUTPUT=$(npm run build 2>&1)
        if [ $? -eq 0 ]; then
            echo "  OK - Build successful"
            return 0
        fi

        echo "  FAILED - Build errors"
        echo "  Fixing with Claude Code..."

        claude -p "ローカルビルドエラーを修正してください。ファイルを直接編集してください。

エラー:
$BUILD_OUTPUT"

        return 1
    fi

    echo "  SKIP - No package.json found"
    return 0
}

# ---------------------------------------------
# メイン処理
# ---------------------------------------------
FIXED=0

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo ""
    echo "============================================"
    echo "  Attempt $attempt / $MAX_ATTEMPTS"
    echo "============================================"

    ERRORS=0

    check_github_actions || ERRORS=$((ERRORS + 1))
    check_vercel || ERRORS=$((ERRORS + 1))
    check_railway || ERRORS=$((ERRORS + 1))
    check_eas || ERRORS=$((ERRORS + 1))
    check_supabase || ERRORS=$((ERRORS + 1))
    check_local_build || ERRORS=$((ERRORS + 1))

    if [ $ERRORS -eq 0 ]; then
        echo ""
        echo "============================================"
        echo "  All checks passed!"
        echo "============================================"
        FIXED=1
        break
    fi

    echo ""
    echo "Errors found. Fixes applied. Retrying..."
    sleep 3
done

# ---------------------------------------------
# 結果とコミット
# ---------------------------------------------
if [ $FIXED -eq 1 ]; then
    if ! git diff --quiet 2>/dev/null; then
        echo ""
        echo "Committing fixes..."
        git add -A
        git commit -m "fix: auto-fix build errors"
        git push
        echo "Fixes pushed!"
    fi
else
    echo ""
    echo "============================================"
    echo "  Could not fix all errors after $MAX_ATTEMPTS attempts"
    echo "============================================"
    exit 1
fi
