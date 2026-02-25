#!/usr/bin/env bash
# =============================================================================
# insight-common 竊・蜷・い繝励Μ繝ｪ繝昴ず繝医Μ縺ｸ縺ｮ繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ + 繧｢繧､繧ｳ繝ｳ蜷梧悄
#
# 菴ｿ縺・婿:
#   ./scripts/sync-to-repos.sh                     # 蜈ｨ繝ｪ繝昴ず繝医Μ
#   ./scripts/sync-to-repos.sh win-app-insight-sheet  # 謖・ｮ壹Μ繝昴ず繝医Μ縺ｮ縺ｿ
#   ./scripts/sync-to-repos.sh --dry-run           # 螟画峩遒ｺ隱阪・縺ｿ
#   ./scripts/sync-to-repos.sh --list              # 蟇ｾ雎｡荳隕ｧ陦ｨ遉ｺ
#
# 蜑肴署:
#   - 蜷・Μ繝昴ず繝医Μ縺・$BASE_DIR 驟堺ｸ九↓繧ｯ繝ｭ繝ｼ繝ｳ貂医∩
#   - insight-common 縺ｮ繝ｫ繝ｼ繝医°繧牙ｮ溯｡・
# =============================================================================

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSIGHT_COMMON_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ICON_GENERATED="$INSIGHT_COMMON_ROOT/brand/icons/generated"

# 髢狗匱繝・ぅ繝ｬ繧ｯ繝医Μ・育腸蠅・､画焚 or 繝・ヵ繧ｩ繝ｫ繝茨ｼ・
BASE_DIR="${INSIGHT_DEV_DIR:-$(cd "$INSIGHT_COMMON_ROOT/.." && pwd)}"

DRY_RUN=false
FILTER=""

# --- 繝ｪ繝昴ず繝医Μ螳夂ｾｩ ---
# 蠖｢蠑・ "repo|product|name|icon_src|icon_dest|copy_mode"
REPOS=(
  "win-app-nocode-analyzer|INCA|InsightNoCodeAnalyzer|InsightNoCodeAnalyzer/|src-tauri/icons/|dir"
  "win-app-insight-bot|INBT|InsightBot|InsightBot|Resources|ico_png"
  "web-app-auto-interview|IVIN|InterviewInsight|InterviewInsight/|src-tauri/icons/|dir"
  "win-app-insight-cast|INMV|InsightCast|InsightCast|resources|ico_png"
  "win-app-insight-image-gen|INIG|InsightImageGen|InsightImageGen|resources|ico_png"
  "win-app-insight-slide|INSS|InsightOfficeSlide|InsightOfficeSlide|Resources|ico_png"
  "win-app-insight-sheet|IOSH|InsightOfficeSheet|InsightOfficeSheet|Resources|ico_png"
  "win-app-insight-doc|IOSD|InsightOfficeDoc|InsightOfficeDoc|Resources|ico_png"
  "win-app-insight-py|INPY|InsightPy|InsightPy|resources|ico_png"
  "win-app-insight-py-pro|INPY|InsightPy|InsightPy|resources|ico_png"
  "win-app-insight-sheet-senior|ISOF|InsightSeniorOffice|InsightSeniorOffice|Resources|ico_png"
  "win-app-insight-launcher|LAUNCHER|InsightLauncher|InsightLauncher|Resources|ico_png"
  "android-app-insight-launcher|LAUNCHER_ANDROID|InsightLauncherAndroid|InsightLauncherAndroid|app/src/main/res|android_native"
  "android-app-insight-voice-clock|VOICE_CLOCK|InsightVoiceClock|InsightVoiceClock|app/src/main/res|android_native"
  "android-app-insight-camera|CAMERA|InsightCamera|InsightCamera|app/src/main/res|android_native"
  "mobile-app-voice-memo|VOICE_MEMO|InsightVoiceMemo|InsightVoiceMemo|assets|expo"
  "win-app-insight-pinboard|PINBOARD|InsightPinBoard|InsightPinBoard|Resources|ico_png"
  "web-app-insight-qr|QR|InsightQR|InsightQR|public|web"
)

# --- Parse arguments ---
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --list)
      echo "=== 蜷梧悄蟇ｾ雎｡繝ｪ繝昴ず繝医Μ ==="
      printf "%-35s %-8s %s\n" "REPOSITORY" "CODE" "PRODUCT"
      printf "%-35s %-8s %s\n" "---" "---" "---"
      for entry in "${REPOS[@]}"; do
        IFS='|' read -r repo product name _ _ _ <<< "$entry"
        printf "%-35s %-8s %s\n" "$repo" "$product" "$name"
      done
      exit 0
      ;;
    --help|-h)
      echo "Usage: $0 [--dry-run] [--list] [repo-name ...]"
      echo ""
      echo "Options:"
      echo "  --dry-run  螟画峩繧堤｢ｺ隱阪☆繧九・縺ｿ・医さ繝溘ャ繝医＠縺ｪ縺・ｼ・
      echo "  --list     蟇ｾ雎｡繝ｪ繝昴ず繝医Μ荳隕ｧ繧定｡ｨ遉ｺ"
      echo "  --help     縺薙・繝倥Ν繝励ｒ陦ｨ遉ｺ"
      echo ""
      echo "Environment:"
      echo "  INSIGHT_DEV_DIR  髢狗匱繝・ぅ繝ｬ繧ｯ繝医Μ (default: ../ from insight-common)"
      exit 0
      ;;
    -*) echo "Unknown option: $arg"; exit 1 ;;
    *) FILTER="$FILTER $arg" ;;
  esac
done

# --- Functions ---
sync_claude_skills() {
  local repo_dir="$1" copy_mode="$2"
  local skills_dir="$INSIGHT_COMMON_ROOT/.claude/commands"

  # .claude/commands 繝・ぅ繝ｬ繧ｯ繝医Μ菴懈・
  mkdir -p "$repo_dir/.claude/commands"

  # 蜈ｱ騾壹せ繧ｭ繝ｫ: release-check
  if [ -f "$skills_dir/release-check.md" ]; then
    cp "$skills_dir/release-check.md" "$repo_dir/.claude/commands/release-check.md"
  fi

  # Android 蝗ｺ譛峨せ繧ｭ繝ｫ: release-check-android
  if [ "$copy_mode" = "android_native" ] || [ "$copy_mode" = "expo" ]; then
    if [ -f "$skills_dir/release-check-android.md" ]; then
      cp "$skills_dir/release-check-android.md" "$repo_dir/.claude/commands/release-check-android.md"
    fi
  fi

  # .claude/settings.json 縺ｫ SessionStart 繝輔ャ繧ｯ霑ｽ蜉・・ync-skills 閾ｪ蜍募酔譛滂ｼ・
  local settings_file="$repo_dir/.claude/settings.json"
  local sync_hook_cmd='bash ${CLAUDE_PROJECT_DIR}/insight-common/scripts/sync-skills.sh'

  if [ -f "$settings_file" ]; then
    if ! grep -q "sync-skills.sh" "$settings_file" 2>/dev/null; then
      if command -v jq >/dev/null 2>&1; then
        jq --arg cmd "$sync_hook_cmd" '
          .hooks.SessionStart = (.hooks.SessionStart // []) + [{
            "matcher": "",
            "hooks": [{"type": "command", "command": $cmd}]
          }]
        ' "$settings_file" > "${settings_file}.tmp" && mv "${settings_file}.tmp" "$settings_file"
        echo "        settings.json: sync-skills hook added"
      fi
    fi
  else
    cat > "$settings_file" << SETTINGSEOF
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$sync_hook_cmd"
          }
        ]
      }
    ]
  }
}
SETTINGSEOF
    echo "        settings.json: created with sync-skills hook"
  fi

  # CLAUDE.md 縺ｮ逕滓・・域里蟄倥ヵ繧｡繧､繝ｫ縺後↑縺・ｴ蜷医・縺ｿ・・
  if [ ! -f "$repo_dir/CLAUDE.md" ]; then
    local release_skill="/release-check"
    local platform_std=""
    case "$copy_mode" in
      android_native)
        release_skill="/release-check-android"
        platform_std="cat insight-common/standards/ANDROID.md             # Android 髢狗匱讓呎ｺ・
        ;;
      expo)
        release_skill="/release-check"
        platform_std="cat insight-common/standards/ANDROID.md             # Android (Expo) 髢狗匱讓呎ｺ・
        ;;
      ico_png)
        platform_std="cat insight-common/standards/CSHARP_WPF.md          # C# WPF 髢狗匱讓呎ｺ・
        ;;
      web)
        platform_std="cat insight-common/standards/REACT.md               # React 髢狗匱讓呎ｺ・
        ;;
    esac

    cat > "$repo_dir/CLAUDE.md" << CLEOF
# 髢狗匱繧ｬ繧､繝・

> 縺薙・繝励Ο繧ｸ繧ｧ繧ｯ繝医・ \`insight-common/CLAUDE.md\` 縺ｮ蜈ｨ讓呎ｺ悶↓貅匁侠縺励∪縺吶・
> 髢狗匱繝ｻ繝ｬ繝薙Η繝ｼ繝ｻ繝ｪ繝ｪ繝ｼ繧ｹ蜑阪↓蠢・★蜿ら・縺励※縺上□縺輔＞縲・

## 讓呎ｺ悶ラ繧ｭ繝･繝｡繝ｳ繝・

\`\`\`bash
cat insight-common/CLAUDE.md                       # 蜈ｨ菴薙ぎ繧､繝・
${platform_std}
cat insight-common/standards/RELEASE_CHECKLIST.md   # 繝ｪ繝ｪ繝ｼ繧ｹ繝√ぉ繝・け
cat insight-common/standards/LOCALIZATION.md        # 繝ｭ繝ｼ繧ｫ繝ｩ繧､繧ｼ繝ｼ繧ｷ繝ｧ繝ｳ
\`\`\`

## 讀懆ｨｼ繧ｳ繝槭Φ繝・

\`\`\`bash
# 髢狗匱荳ｭ縺ｮ讓呎ｺ匁､懆ｨｼ
./insight-common/scripts/validate-standards.sh .

# 繝ｪ繝ｪ繝ｼ繧ｹ蜑阪・蛹・峡繝√ぉ繝・け
./insight-common/scripts/release-check.sh .
\`\`\`

## AI 繧｢繧ｷ繧ｹ繧ｿ繝ｳ繝郁・蜍戊｡悟虚繝ｫ繝ｼ繝ｫ

| 繝医Μ繧ｬ繝ｼ・医Θ繝ｼ繧ｶ繝ｼ縺ｮ逋ｺ險繝ｻ迥ｶ豕・ｼ・| 閾ｪ蜍輔い繧ｯ繧ｷ繝ｧ繝ｳ |
|-------------------------------|--------------|
| 縲後Μ繝ｪ繝ｼ繧ｹ縲阪後ョ繝励Ο繧､縲阪悟・髢九阪梧悽逡ｪ縲阪茎hip縲阪罫elease縲・| \`${release_skill}\` 繧呈署譯医・螳溯｡・|
| 縲訓R 菴懊▲縺ｦ縲阪後・繝ｫ繝ｪ繧ｯ縲阪後・繝ｼ繧ｸ縲・| \`${release_skill}\` 縺ｮ螳溯｡後ｒ謗ｨ螂ｨ |
| 譁ｰ隕・UI 螳溯｣・・繝・じ繧､繝ｳ螟画峩 | Ivory & Gold 繝・じ繧､繝ｳ讓呎ｺ悶ｒ遒ｺ隱・|
| 繧ｹ繝医い繝｡繧ｿ繝・・繧ｿ繝ｻ繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｷ繝ｧ繝・ヨ縺ｮ隧ｱ鬘・| \`insight-common/standards/LOCALIZATION.md\` ﾂｧ6 繧貞盾辣ｧ |

## 笞・・驥崎ｦ√Ν繝ｼ繝ｫ

- 繝ｪ繝ｪ繝ｼ繧ｹ蜑阪↓ \`${release_skill}\` 繧・*蠢・★**螳溯｡後☆繧九％縺ｨ
- \`${release_skill}\` 縺ｯ**繝輔ぉ繝ｼ繧ｺ蛻･縺ｫ蟇ｾ隧ｱ逧・↓螳溯｡・*縺吶ｋ・井ｸ豌励↓繧・ｉ縺ｪ縺・ｼ・
- 繝・じ繧､繝ｳ: Gold (#B8942F) 縺後・繝ｩ繧､繝槭Μ縲！vory (#FAF8F5) 縺瑚レ譎ｯ
- Blue (#2563EB) 繧偵・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ**遖∵ｭ｢**
- TODO/FIXME 繧呈ｮ九＠縺溘∪縺ｾ繝ｪ繝ｪ繝ｼ繧ｹ**遖∵ｭ｢**
- API 繧ｭ繝ｼ繝ｻ繧ｷ繝ｼ繧ｯ繝ｬ繝・ヨ縺ｮ繝上・繝峨さ繝ｼ繝・*遖∵ｭ｢**
CLEOF
    echo "        CLAUDE.md generated"
  fi
}

copy_icons() {
  local icon_src="$1" icon_dest="$2" name="$3" mode="$4" repo_dir="$5"

  mkdir -p "$repo_dir/$icon_dest"

  case "$mode" in
    dir)
      cp -r "$ICON_GENERATED/$icon_src"* "$repo_dir/$icon_dest"
      ;;
    ico_png)
      cp "$ICON_GENERATED/$icon_src/$name.ico" "$repo_dir/$icon_dest/$name.ico"
      cp "$ICON_GENERATED/$icon_src/${name}_256.png" "$repo_dir/$icon_dest/${name}_256.png"
      ;;
    android_native)
      for subdir in drawable mipmap-anydpi-v26; do
        if [ -d "$ICON_GENERATED/$icon_src/$subdir" ]; then
          mkdir -p "$repo_dir/$icon_dest/$subdir"
          cp "$ICON_GENERATED/$icon_src/$subdir/"*.xml "$repo_dir/$icon_dest/$subdir/"
        fi
      done
      ;;
    expo)
      for f in icon.png adaptive-icon.png notification-icon.png splash-icon.png favicon.png; do
        [ -f "$ICON_GENERATED/$icon_src/$f" ] && cp "$ICON_GENERATED/$icon_src/$f" "$repo_dir/$icon_dest/$f"
      done
      # Android mipmap 繝・ぅ繝ｬ繧ｯ繝医Μ
      if [ -d "$ICON_GENERATED/$icon_src/android" ]; then
        cp -r "$ICON_GENERATED/$icon_src/android/"* "$repo_dir/$icon_dest/" 2>/dev/null || true
      fi
      ;;
    web)
      cp "$ICON_GENERATED/$icon_src/favicon.ico" "$repo_dir/$icon_dest/favicon.ico"
      for f in favicon-16.png favicon-32.png apple-touch-icon.png icon-192.png icon-512.png; do
        [ -f "$ICON_GENERATED/$icon_src/$f" ] && cp "$ICON_GENERATED/$icon_src/$f" "$repo_dir/$icon_dest/$f"
      done
      ;;
  esac
}

# --- Main ---
echo "=== insight-common 竊・蜷・Μ繝昴ず繝医Μ蜷梧悄 ==="
echo "  insight-common: $INSIGHT_COMMON_ROOT"
echo "  髢狗匱繝・ぅ繝ｬ繧ｯ繝医Μ: $BASE_DIR"
echo "  Dry run: $DRY_RUN"
echo ""

SUCCESS=0
SKIPPED=0
FAILED=0

for entry in "${REPOS[@]}"; do
  IFS='|' read -r repo product name icon_src icon_dest copy_mode <<< "$entry"

  # 繝輔ぅ繝ｫ繧ｿ繝√ぉ繝・け
  if [ -n "$FILTER" ]; then
    if ! echo "$FILTER" | grep -qw "$repo"; then
      continue
    fi
  fi

  REPO_DIR="$BASE_DIR/$repo"

  if [ ! -d "$REPO_DIR" ]; then
    echo "  SKIP  $repo (not found at $REPO_DIR)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "  SYNC  $repo ($product: $name)"

  # 1. 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ譖ｴ譁ｰ
  SUBMODULE_DIR="$REPO_DIR/insight-common"
  if [ -d "$SUBMODULE_DIR/.git" ] || [ -f "$SUBMODULE_DIR/.git" ]; then
    (cd "$REPO_DIR" && git submodule update --remote insight-common 2>/dev/null) || true
    echo "        submodule updated"
  else
    echo "        WARN: no insight-common submodule found"
  fi

  # 2. Claude Code 繧ｹ繧ｭ繝ｫ蜷梧悄
  sync_claude_skills "$REPO_DIR" "$copy_mode"
  echo "        skills synced"

  # 3. 繧｢繧､繧ｳ繝ｳ繧ｳ繝斐・
  if copy_icons "$icon_src" "$icon_dest" "$name" "$copy_mode" "$REPO_DIR"; then
    echo "        icons copied ($copy_mode)"
  else
    echo "        ERROR: icon copy failed"
    FAILED=$((FAILED + 1))
    continue
  fi

  # 3. git status
  CHANGES=$(cd "$REPO_DIR" && git status --porcelain)
  if [ -z "$CHANGES" ]; then
    echo "        no changes"
    SUCCESS=$((SUCCESS + 1))
    continue
  fi

  echo "        changes detected:"
  echo "$CHANGES" | while read -r line; do echo "          $line"; done

  if [ "$DRY_RUN" = true ]; then
    echo "        (dry-run: skipping commit)"
  else
    SHORT_SHA=$(cd "$INSIGHT_COMMON_ROOT" && git rev-parse --short HEAD)
    (
      cd "$REPO_DIR"
      git add -A
      git commit -m "chore: update insight-common to $SHORT_SHA

- 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ譖ｴ譁ｰ
- 繧｢繧､繧ｳ繝ｳ繝輔ぃ繧､繝ｫ蜷梧悄
- Claude Code 繧ｹ繧ｭ繝ｫ蜷梧悄"
    )
    echo "        committed"
  fi

  SUCCESS=$((SUCCESS + 1))
done

echo ""
echo "=== 螳御ｺ・ $SUCCESS synced, $SKIPPED skipped, $FAILED failed ==="
