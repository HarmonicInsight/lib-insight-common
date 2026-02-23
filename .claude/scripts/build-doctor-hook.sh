#!/bin/bash
# =============================================================
# HARMONIC insight - Build Doctor Hook (PostToolUse: Bash)
# =============================================================
#
# Claude Code が Bash ツールでビルドコマンドを実行した後に自動実行される。
#
# 動作:
#   1) 実行されたコマンドがビルドコマンドかどうかを判定
#   2) ビルド失敗を検出した場合、JSON レポートに記録
#   3) GUI ダッシュボード (build-doctor-ui.sh) で確認可能
#
# このスクリプトは非ブロッキング（exit 0）で動作する。
# ビルド失敗時は STDERR にガイダンスを出力してClaude Codeに修正を促す。
#

set -uo pipefail

TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
TOOL_OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

if [ -z "$TOOL_INPUT" ]; then
  exit 0
fi

# ============================================================
# 1. ビルドコマンド判定
# ============================================================

# コマンド文字列を取得（JSON の command フィールド）
COMMAND=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('command', ''))
except:
    print('')
" 2>/dev/null)

if [ -z "$COMMAND" ]; then
  exit 0
fi

# ビルドコマンドのパターンマッチ
is_build_command() {
  local cmd="$1"
  # iOS
  echo "$cmd" | grep -qEi "xcodebuild .*(build|archive|test)|swift build" && return 0
  # Android
  echo "$cmd" | grep -qEi "gradlew.*(assemble|build|bundle|test|lint)" && return 0
  # C# / .NET
  echo "$cmd" | grep -qEi "dotnet (build|publish|test|pack)" && return 0
  # React / Next.js / Node
  echo "$cmd" | grep -qEi "npm run (build|dev|start|test)|npx next build|yarn build" && return 0
  # Python
  echo "$cmd" | grep -qEi "pyinstaller|python -m (py_compile|build|pytest)" && return 0
  # Tauri
  echo "$cmd" | grep -qEi "tauri (build|dev)" && return 0
  # Cargo (Rust)
  echo "$cmd" | grep -qEi "cargo (build|test|check)" && return 0
  # Expo
  echo "$cmd" | grep -qEi "eas build|expo build" && return 0
  return 1
}

if ! is_build_command "$COMMAND"; then
  exit 0
fi

# ============================================================
# 2. ビルド結果判定
# ============================================================

# TOOL_OUTPUT から exit_code と出力を取得
EXIT_CODE=$(echo "$TOOL_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # Bash ツール出力は stdout/stderr を含む場合あり
    print(data.get('exitCode', data.get('exit_code', '0')))
except:
    print('0')
" 2>/dev/null)

STDOUT=$(echo "$TOOL_OUTPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    out = data.get('stdout', data.get('output', ''))
    print(out[-3000:] if len(out) > 3000 else out)
except:
    print('')
" 2>/dev/null)

# ビルド成功パターンチェック
is_build_success() {
  local output="$1"
  echo "$output" | grep -qEi "BUILD SUCCEEDED|BUILD SUCCESSFUL|Build succeeded|Compiled successfully|Finished.*release|completed successfully" && return 0
  return 1
}

# exit_code=0 かつ成功パターンが含まれていれば成功
if [ "$EXIT_CODE" = "0" ] && is_build_success "$STDOUT"; then
  # ビルド成功 → 成功レポートを記録
  record_result "resolved" "" ""
  exit 0
fi

# exit_code=0 でもビルドコマンドでなければスキップ
if [ "$EXIT_CODE" = "0" ]; then
  exit 0
fi

# ============================================================
# 3. ビルド失敗 → エラー分類 & レポート記録
# ============================================================

# プラットフォーム検出
detect_platform_from_cmd() {
  local cmd="$1"
  echo "$cmd" | grep -qEi "xcodebuild|swift build" && echo "ios" && return
  echo "$cmd" | grep -qEi "gradlew" && echo "android" && return
  echo "$cmd" | grep -qEi "dotnet" && echo "wpf" && return
  echo "$cmd" | grep -qEi "npm run|npx|yarn|next" && echo "react" && return
  echo "$cmd" | grep -qEi "pyinstaller|python" && echo "python" && return
  echo "$cmd" | grep -qEi "tauri|cargo" && echo "tauri" && return
  echo "unknown"
}

PLATFORM=$(detect_platform_from_cmd "$COMMAND")

# エラーカテゴリ分類（簡易版 — build-doctor.sh の classify_error 相当）
classify_error_quick() {
  local output="$1"
  local platform="$2"

  # CodeSign (最優先)
  echo "$output" | grep -qEi "Code ?Sign|Provisioning profile|certificate.*expired|no signing" && echo "CodeSign" && return
  # Dependency
  echo "$output" | grep -qEi "could not resolve|could not find|ERESOLVE|pod install.*fail|ModuleNotFoundError|No matching distribution|failed to select a version" && echo "Dependency" && return
  # Link
  echo "$output" | grep -qEi "Undefined symbol|duplicate symbol|framework not found|library not found|ld:|linker" && echo "Link" && return
  # ScriptPhase
  echo "$output" | grep -qEi "PhaseScriptExecution|Run Script|swiftlint.*error" && echo "ScriptPhase" && return
  # Environment
  echo "$output" | grep -qEi "SDK.*not found|ANDROID_HOME|No space left|out of memory|ENOMEM|xcode-select.*error|Minimum supported Gradle" && echo "Environment" && return
  # Compile (デフォルト)
  echo "Compile"
}

CATEGORY=$(classify_error_quick "$STDOUT" "$PLATFORM")

# エラー行抽出（最大10行）
ERROR_LINES=$(echo "$STDOUT" | grep -Ei "error:|Error:|ERROR:|fatal:|FATAL:|failed|FAILED" | tail -10)

# ============================================================
# 4. JSON レポート書き出し
# ============================================================

LOG_DIR="$PROJECT_DIR/build_logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y-%m-%dT%H:%M:%S%z')
TIMESTAMP_FILE=$(date '+%Y%m%d_%H%M%S')

# ビルドログ保存
LOG_FILE="$LOG_DIR/${PLATFORM}_build_${TIMESTAMP_FILE}.log"
echo "$STDOUT" > "$LOG_FILE" 2>/dev/null

# セッションレポートファイル（1セッション = 1ファイル、追記型）
SESSION_REPORT="$LOG_DIR/session_report.json"

# 既存のセッションレポートがあれば読み込んで追記、なければ新規作成
python3 -c "
import json, os, sys

session_file = '$SESSION_REPORT'
platform = '$PLATFORM'
category = '$CATEGORY'
log_file = '$LOG_FILE'
timestamp = '$TIMESTAMP'
command = '''$COMMAND'''[:200]
error_lines = '''$ERROR_LINES'''[:1000]
exit_code = '$EXIT_CODE'
project_dir = '$PROJECT_DIR'

new_entry = {
    'timestamp': timestamp,
    'command': command.replace(\"'''\", ''),
    'platform': platform,
    'category': category,
    'exitCode': int(exit_code) if exit_code.isdigit() else 1,
    'status': 'build_failed',
    'logFile': log_file,
    'errorSummary': error_lines.replace(\"'''\", ''),
}

# セッションレポートの読み込み or 新規作成
if os.path.exists(session_file):
    try:
        with open(session_file, 'r') as f:
            report = json.load(f)
    except (json.JSONDecodeError, IOError):
        report = None
else:
    report = None

if report is None:
    report = {
        'version': '1.1.0',
        'type': 'claude_code_session',
        'startedAt': timestamp,
        'projectDir': project_dir,
        'platform': platform,
        'status': 'in_progress',
        'totalBuilds': 0,
        'failedBuilds': 0,
        'events': [],
    }

report['events'].append(new_entry)
report['totalBuilds'] = report.get('totalBuilds', 0) + 1
report['failedBuilds'] = report.get('failedBuilds', 0) + 1
report['lastUpdatedAt'] = timestamp
report['status'] = 'in_progress'
report['platform'] = platform

with open(session_file, 'w') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print(f'[BUILD-DOCTOR] Build failure recorded: {category}', file=sys.stderr)
print(f'[BUILD-DOCTOR] Log: {log_file}', file=sys.stderr)
" 2>&1

# ============================================================
# 5. Claude Code へのガイダンス出力
# ============================================================
# STDERR に出力することで Claude Code のコンテキストに含まれる

cat >&2 <<GUIDANCE

[BUILD-DOCTOR] ビルド失敗を検知しました
  Platform:  $PLATFORM
  Category:  $CATEGORY
  Exit Code: $EXIT_CODE
  Log:       $LOG_FILE

Build Doctor の推奨アクション:
  1. エラーログ末尾を確認してください
  2. config/build-doctor.ts の FIX_STRATEGIES を参照して修正してください
  3. compatibility/ の既知 NG 組み合わせを確認してください
  4. 修正後に再ビルドしてください

GUI で確認: ./scripts/build-doctor-ui.sh $PROJECT_DIR

GUIDANCE

exit 0
