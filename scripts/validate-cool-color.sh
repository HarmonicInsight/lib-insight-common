#!/bin/bash
#
# Insight Series Cool Blue & Slate 繝・・繝樊､懆ｨｼ繧ｹ繧ｯ繝ｪ繝励ヨ
# 讌ｭ蜍咏ｳｻ繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ・・NBT/INCA/IVIN・峨・讓呎ｺ匁､懆ｨｼ
#
# 菴ｿ縺・婿:
#   ./validate-cool-color.sh <project-directory>
#

set -e

# 繧ｫ繝ｩ繝ｼ螳夂ｾｩ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 讀懆ｨｼ邨先棡
ERRORS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} Cool Blue & Slate 繝・・繝樊､懆ｨｼ${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

print_section() {
    echo -e "${YELLOW}[$1]${NC} $2"
}

print_ok() {
    echo -e "  ${GREEN}笨・{NC} $1"
}

print_error() {
    echo -e "  ${RED}笨・{NC} $1"
    ((ERRORS++)) || true
}

print_warning() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((WARNINGS++)) || true
}

# 蠑墓焚繝√ぉ繝・け
if [ -z "$1" ]; then
    echo "菴ｿ逕ｨ譁ｹ豕・ $0 <project-directory>"
    echo ""
    echo "萓・ $0 /path/to/your-app"
    echo ""
    echo "蟇ｾ雎｡: 讌ｭ蜍咏ｳｻ繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ (INBT/INCA/IVIN)"
    echo "繝・・繝・ Cool Blue & Slate"
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}繧ｨ繝ｩ繝ｼ: 繝・ぅ繝ｬ繧ｯ繝医Μ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ: $PROJECT_DIR${NC}"
    exit 1
fi

# insight-common 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ閾ｪ蜍輔そ繝・ヨ繧｢繝・・
if [ -f "$PROJECT_DIR/.gitmodules" ] && grep -q "insight-common" "$PROJECT_DIR/.gitmodules" 2>/dev/null; then
    if [ ! -f "$PROJECT_DIR/insight-common/CLAUDE.md" ]; then
        echo -e "${YELLOW}insight-common 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ繧貞・譛溷喧縺励※縺・∪縺・..${NC}"
        git -C "$PROJECT_DIR" submodule init 2>/dev/null || true
        git -C "$PROJECT_DIR" submodule update --recursive 2>/dev/null || true
    fi
    chmod +x "$PROJECT_DIR/insight-common/scripts/"*.sh 2>/dev/null || true
fi

print_header
echo "讀懆ｨｼ蟇ｾ雎｡: $PROJECT_DIR"
echo ""

# 繝励Λ繝・ヨ繝輔か繝ｼ繝讀懷・
detect_platform() {
    if compgen -G "$PROJECT_DIR"/*.csproj > /dev/null 2>&1; then
        echo "csharp"
    elif [ -f "$PROJECT_DIR/build.gradle.kts" ] || [ -f "$PROJECT_DIR/build.gradle" ]; then
        echo "android"
    elif [ -f "$PROJECT_DIR/package.json" ]; then
        if grep -q '"expo"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            echo "expo"
        else
            echo "react"
        fi
    elif [ -f "$PROJECT_DIR/requirements.txt" ] || [ -f "$PROJECT_DIR/pyproject.toml" ]; then
        echo "python"
    elif [ -f "$PROJECT_DIR/Package.swift" ]; then
        echo "ios"
    else
        echo "unknown"
    fi
}

PLATFORM=$(detect_platform)
echo "讀懷・縺輔ｌ縺溘・繝ｩ繝・ヨ繝輔か繝ｼ繝: $PLATFORM"
echo ""

# 讀懃ｴ｢蟇ｾ雎｡繝輔ぃ繧､繝ｫ諡｡蠑ｵ蟄撰ｼ亥・騾夲ｼ・
SEARCH_INCLUDES='--include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --include="*.py" --include="*.cs"'
SEARCH_EXCLUDES='--exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git --exclude-dir=build --exclude-dir=dist'

# ========================================
# 1. Cool Blue & Slate 繝・・繝樊､懆ｨｼ
# ========================================
print_section "1" "繧ｫ繝ｩ繝ｼ繧ｷ繧ｹ繝・Β・・ool Blue & Slate Theme・画､懆ｨｼ"

# 蠢・・ Blue (#2563EB) 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_blue_primary() {
    local blue_found=$(grep -r "#2563EB\|2563EB\|0xFF2563EB" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$blue_found" ]; then
        print_error "Blue (#2563EB) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・ool 繝・・繝槭・繝励Λ繧､繝槭Μ繧ｫ繝ｩ繝ｼ・・
        return 1
    fi
    print_ok "Blue (#2563EB) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

# 蠢・・ Slate 閭梧勹 (#F8FAFC) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_slate_background() {
    local slate_found=$(grep -r "#F8FAFC\|F8FAFC\|0xFFF8FAFC" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$slate_found" ]; then
        print_error "Slate 閭梧勹 (#F8FAFC) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        return 1
    fi
    print_ok "Slate 閭梧勹 (#F8FAFC) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

# 遖∵ｭ｢: Gold (#B8942F) 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・
check_no_gold_primary() {
    local gold_as_primary=$(grep -r "primary.*#B8942F\|#B8942F.*primary\|Primary.*B8942F\|primaryColor.*B8942F" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -5)

    if [ -n "$gold_as_primary" ]; then
        print_error "Gold (#B8942F) 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・∪縺呻ｼ・ool 繝・・繝槭〒縺ｯ Blue 繧剃ｽｿ逕ｨ・・
        echo "      $gold_as_primary" | head -3
        return 1
    fi
    print_ok "Gold 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・
    return 0
}

# 遖∵ｭ｢: Ivory (#FAF8F5) 縺瑚レ譎ｯ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・
check_no_ivory_background() {
    local ivory_as_bg=$(grep -r "background.*#FAF8F5\|#FAF8F5.*background\|Background.*FAF8F5\|BgPrimary.*FAF8F5" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -5)

    if [ -n "$ivory_as_bg" ]; then
        print_error "Ivory (#FAF8F5) 縺瑚レ譎ｯ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・∪縺呻ｼ・ool 繝・・繝槭〒縺ｯ Slate #F8FAFC 繧剃ｽｿ逕ｨ・・
        echo "      $ivory_as_bg" | head -3
        return 1
    fi
    print_ok "Ivory 縺瑚レ譎ｯ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・
    return 0
}

# 謗ｨ螂ｨ: 鬮倥さ繝ｳ繝医Λ繧ｹ繝医ユ繧ｭ繧ｹ繝・(#0F172A) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_high_contrast_text() {
    local text_found=$(grep -r "#0F172A\|0F172A\|0xFF0F172A" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$text_found" ]; then
        print_warning "鬮倥さ繝ｳ繝医Λ繧ｹ繝医ユ繧ｭ繧ｹ繝・(#0F172A) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        return 1
    fi
    print_ok "鬮倥さ繝ｳ繝医Λ繧ｹ繝医ユ繧ｭ繧ｹ繝・(#0F172A) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

# 謗ｨ螂ｨ: 繝繝ｼ繧ｯ繧ｵ繧､繝峨ヰ繝ｼ (#1E293B) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_dark_sidebar() {
    local sidebar_found=$(grep -r "#1E293B\|1E293B\|0xFF1E293B" "$PROJECT_DIR" \
        --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
        --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
        --include="*.py" --include="*.cs" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -z "$sidebar_found" ]; then
        print_warning "繝繝ｼ繧ｯ繧ｵ繧､繝峨ヰ繝ｼ (#1E293B) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・域･ｭ蜍咏ｳｻ繧｢繝励Μ縺ｧ縺ｯ謗ｨ螂ｨ・・
        return 1
    fi
    print_ok "繝繝ｼ繧ｯ繧ｵ繧､繝峨ヰ繝ｼ (#1E293B) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

# 謗ｨ螂ｨ: 繧ｹ繝・・繧ｿ繧ｹ繧ｫ繝ｩ繝ｼ縺ｮ菴ｿ逕ｨ・・PA邉ｻ縺ｮ縺ｿ・・
check_status_colors() {
    local status_colors_found=0

    for color in "#DBEAFE" "#DCFCE7" "#FEF3C7" "#FEE2E2"; do
        if grep -rq "$color" "$PROJECT_DIR" \
            --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" \
            --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" \
            --include="*.py" --include="*.cs" \
            --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
            2>/dev/null; then
            ((status_colors_found++)) || true
        fi
    done

    if [ "$status_colors_found" -ge 3 ]; then
        print_ok "繧ｹ繝・・繧ｿ繧ｹ繝舌ャ繧ｸ繧ｫ繝ｩ繝ｼ縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ ($status_colors_found/4)"
    elif [ "$status_colors_found" -ge 1 ]; then
        print_warning "繧ｹ繝・・繧ｿ繧ｹ繝舌ャ繧ｸ繧ｫ繝ｩ繝ｼ縺碁Κ蛻・噪縺ｫ菴ｿ逕ｨ ($status_colors_found/4)・亥・繧ｹ繝・・繧ｿ繧ｹ濶ｲ繧呈純縺医※縺上□縺輔＞・・
    else
        print_warning "繧ｹ繝・・繧ｿ繧ｹ繝舌ャ繧ｸ繧ｫ繝ｩ繝ｼ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・PA/繝繝・す繝･繝懊・繝臥ｳｻ縺ｧ縺ｯ謗ｨ螂ｨ・・
    fi
}

# 繝上・繝峨さ繝ｼ繝峨＆繧後◆濶ｲ蛟､縺ｮ繝√ぉ繝・け
check_hardcoded_colors() {
    local hardcoded_count=0

    # 荳闊ｬ逧・↑濶ｲ蛟､縺ｮ繝上・繝峨さ繝ｼ繝画､懷・・・xxx 蠖｢蠑上〒縲∝ｮ夂ｾｩ繝輔ぃ繧､繝ｫ莉･螟厄ｼ・
    local color_defs=$(grep -rn "background:\s*#\|color:\s*#\|fill:\s*#\|stroke:\s*#" "$PROJECT_DIR" \
        --include="*.tsx" --include="*.ts" --include="*.css" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | grep -v "colors" | grep -v "theme" | grep -v "Color" | head -5)

    if [ -n "$color_defs" ]; then
        print_warning "繝上・繝峨さ繝ｼ繝峨＆繧後◆濶ｲ蛟､縺梧､懷・縺輔ｌ縺ｾ縺励◆・亥､画焚 / colors-cool.json 繧貞盾辣ｧ縺励※縺上□縺輔＞・・
        echo "      $(echo "$color_defs" | head -3)"
    else
        print_ok "繝上・繝峨さ繝ｼ繝峨＆繧後◆濶ｲ蛟､縺ｯ讀懷・縺輔ｌ縺ｾ縺帙ｓ縺ｧ縺励◆"
    fi
}

check_blue_primary
check_slate_background
check_no_gold_primary
check_no_ivory_background
check_high_contrast_text
check_dark_sidebar
check_status_colors
check_hardcoded_colors

# ========================================
# 2. 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｷ繧ｹ繝・Β讀懆ｨｼ
# ========================================
echo ""
print_section "2" "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｷ繧ｹ繝・Β讀懆ｨｼ"

check_license_manager() {
    local license_file=$(find "$PROJECT_DIR" \( -name "*LicenseManager*" -o -name "*license_manager*" \) \
        -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)

    if [ -z "$license_file" ]; then
        print_warning "LicenseManager 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・医Θ繝ｼ繝・ぅ繝ｪ繝・ぅ繧｢繝励Μ縺ｮ蝣ｴ蜷医・荳崎ｦ・ｼ・
        return 1
    fi
    print_ok "LicenseManager: $license_file"
    return 0
}

check_license_manager || true

# ========================================
# 3. 陬ｽ蜩√さ繝ｼ繝画､懆ｨｼ
# ========================================
echo ""
print_section "3" "陬ｽ蜩√さ繝ｼ繝画､懆ｨｼ"

check_product_code() {
    # Cool 繝・・繝槫ｯｾ雎｡縺ｮ陬ｽ蜩√さ繝ｼ繝・
    local cool_product_codes="INBT|INCA|IVIN"
    local found_cool=$(grep -rE "($cool_product_codes)" "$PROJECT_DIR" \
        --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" \
        --include="*.kt" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -n "$found_cool" ]; then
        print_ok "Cool 繝・・繝槫ｯｾ雎｡縺ｮ陬ｽ蜩√さ繝ｼ繝峨′菴ｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
        return 0
    fi

    # Ivory 繝・・繝槫ｯｾ雎｡縺ｮ陬ｽ蜩√さ繝ｼ繝峨′菴ｿ繧上ｌ縺ｦ縺・↑縺・°繝√ぉ繝・け
    local ivory_product_codes="INSS|IOSH|IOSD|ISOF|INMV|INIG|INPY"
    local found_ivory=$(grep -rE "($ivory_product_codes)" "$PROJECT_DIR" \
        --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" \
        --include="*.kt" --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | head -1)

    if [ -n "$found_ivory" ]; then
        print_warning "Ivory & Gold 繝・・繝槫ｯｾ雎｡縺ｮ陬ｽ蜩√さ繝ｼ繝峨′讀懷・縺輔ｌ縺ｾ縺励◆・・ool 繝・・繝槭′豁｣縺励＞縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞・・
        return 1
    fi

    print_warning "逋ｻ骭ｲ貂医∩陬ｽ蜩√さ繝ｼ繝峨′隕九▽縺九ｊ縺ｾ縺帙ｓ・・onfig/products.ts 縺ｫ逋ｻ骭ｲ縺励※縺上□縺輔＞・・
    return 1
}

check_product_code || true

# ========================================
# 4. 繧ｻ繧ｭ繝･繝ｪ繝・ぅ繝ｻ蜩∬ｳｪ繝√ぉ繝・け
# ========================================
echo ""
print_section "4" "繧ｻ繧ｭ繝･繝ｪ繝・ぅ繝ｻ蜩∬ｳｪ繝√ぉ繝・け"

# API 繧ｭ繝ｼ縺ｮ繝上・繝峨さ繝ｼ繝・
check_hardcoded_secrets() {
    local secrets=$(grep -rn "api_key\s*=\s*['\"].\+['\"\|API_KEY\s*=\s*['\"].\+['\"]" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.py" --include="*.cs" \
        --include="*.kt" --include="*.swift" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        --exclude="*.example" --exclude="*.sample" \
        2>/dev/null | grep -vi "process\.env\|os\.environ\|Environment\." | head -3)

    if [ -n "$secrets" ]; then
        print_error "繝上・繝峨さ繝ｼ繝峨＆繧後◆ API 繧ｭ繝ｼ縺梧､懷・縺輔ｌ縺ｾ縺励◆"
        echo "      $secrets" | head -2
    else
        print_ok "繝上・繝峨さ繝ｼ繝峨＆繧後◆ API 繧ｭ繝ｼ縺ｯ讀懷・縺輔ｌ縺ｾ縺帙ｓ縺ｧ縺励◆"
    fi
}

# 繝・ヰ繝・げ蜃ｺ蜉帙・谿句ｭ・
check_debug_output() {
    local debug_count=0

    local console_logs=$(grep -rn "console\.log\|console\.debug" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | wc -l)

    local print_stmts=$(grep -rn "^[[:space:]]*print(" "$PROJECT_DIR" \
        --include="*.py" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | wc -l)

    debug_count=$((console_logs + print_stmts))

    if [ "$debug_count" -gt 0 ]; then
        print_warning "繝・ヰ繝・げ蜃ｺ蜉帙′ $debug_count 莉ｶ讀懷・縺輔ｌ縺ｾ縺励◆・医Μ繝ｪ繝ｼ繧ｹ蜑阪↓髯､蜴ｻ縺励※縺上□縺輔＞・・
    else
        print_ok "繝・ヰ繝・げ蜃ｺ蜉帙・讀懷・縺輔ｌ縺ｾ縺帙ｓ縺ｧ縺励◆"
    fi
}

# TODO/FIXME 縺ｮ谿句ｭ・
check_todos() {
    local todo_count=$(grep -rn "TODO\|FIXME\|HACK\|XXX" "$PROJECT_DIR" \
        --include="*.ts" --include="*.tsx" --include="*.py" --include="*.cs" \
        --include="*.kt" --include="*.swift" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=insight-common --exclude-dir=.git \
        2>/dev/null | wc -l)

    if [ "$todo_count" -gt 0 ]; then
        print_warning "TODO/FIXME 縺・$todo_count 莉ｶ讀懷・縺輔ｌ縺ｾ縺励◆・医Μ繝ｪ繝ｼ繧ｹ蜑阪↓隗｣豎ｺ縺励※縺上□縺輔＞・・
    else
        print_ok "TODO/FIXME 縺ｯ讀懷・縺輔ｌ縺ｾ縺帙ｓ縺ｧ縺励◆"
    fi
}

check_hardcoded_secrets
check_debug_output
check_todos

# ========================================
# 5. 繝ｭ繝ｼ繧ｫ繝ｩ繧､繧ｼ繝ｼ繧ｷ繝ｧ繝ｳ讀懆ｨｼ
# ========================================
echo ""
print_section "5" "繝ｭ繝ｼ繧ｫ繝ｩ繧､繧ｼ繝ｼ繧ｷ繝ｧ繝ｳ讀懆ｨｼ"

check_i18n() {
    case "$PLATFORM" in
        android)
            local strings_ja=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values/*" ! -path "*/values-*/*" 2>/dev/null | head -1)
            local strings_en=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values-en/*" 2>/dev/null | head -1)

            if [ -n "$strings_ja" ]; then
                print_ok "values/strings.xml (譌･譛ｬ隱・ 縺悟ｭ伜惠"
            else
                print_warning "values/strings.xml (譌･譛ｬ隱・ 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi

            if [ -n "$strings_en" ]; then
                print_ok "values-en/strings.xml (闍ｱ隱・ 縺悟ｭ伜惠"
            else
                print_warning "values-en/strings.xml (闍ｱ隱・ 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
            ;;
        react|expo)
            local i18n_ja=$(find "$PROJECT_DIR" -name "ja.json" -path "*/i18n/*" -o -name "ja.json" -path "*/locales/*" -o -name "ja.json" -path "*/lang/*" 2>/dev/null | head -1)
            local i18n_en=$(find "$PROJECT_DIR" -name "en.json" -path "*/i18n/*" -o -name "en.json" -path "*/locales/*" -o -name "en.json" -path "*/lang/*" 2>/dev/null | head -1)

            if [ -n "$i18n_ja" ]; then
                print_ok "譌･譛ｬ隱槭Μ繧ｽ繝ｼ繧ｹ繝輔ぃ繧､繝ｫ縺悟ｭ伜惠: $i18n_ja"
            else
                print_warning "譌･譛ｬ隱槭Μ繧ｽ繝ｼ繧ｹ繝輔ぃ繧､繝ｫ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi

            if [ -n "$i18n_en" ]; then
                print_ok "闍ｱ隱槭Μ繧ｽ繝ｼ繧ｹ繝輔ぃ繧､繝ｫ縺悟ｭ伜惠: $i18n_en"
            else
                print_warning "闍ｱ隱槭Μ繧ｽ繝ｼ繧ｹ繝輔ぃ繧､繝ｫ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
            ;;
        csharp)
            local resx_ja=$(find "$PROJECT_DIR" -name "*.resx" ! -name "*.en.resx" ! -name "*.en-US.resx" 2>/dev/null | head -1)
            local resx_en=$(find "$PROJECT_DIR" -name "*.en.resx" -o -name "*.en-US.resx" 2>/dev/null | head -1)

            if [ -n "$resx_ja" ]; then
                print_ok "譌･譛ｬ隱槭Μ繧ｽ繝ｼ繧ｹ (.resx) 縺悟ｭ伜惠"
            else
                print_warning "譌･譛ｬ隱槭Μ繧ｽ繝ｼ繧ｹ (.resx) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi

            if [ -n "$resx_en" ]; then
                print_ok "闍ｱ隱槭Μ繧ｽ繝ｼ繧ｹ (.resx) 縺悟ｭ伜惠"
            else
                print_warning "闍ｱ隱槭Μ繧ｽ繝ｼ繧ｹ (.resx) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
            ;;
        python)
            local i18n_dir=$(find "$PROJECT_DIR" -type d \( -name "i18n" -o -name "locales" -o -name "translations" \) 2>/dev/null | head -1)
            if [ -n "$i18n_dir" ]; then
                print_ok "繝ｭ繝ｼ繧ｫ繝ｩ繧､繧ｼ繝ｼ繧ｷ繝ｧ繝ｳ繝・ぅ繝ｬ繧ｯ繝医Μ縺悟ｭ伜惠: $i18n_dir"
            else
                print_warning "繝ｭ繝ｼ繧ｫ繝ｩ繧､繧ｼ繝ｼ繧ｷ繝ｧ繝ｳ繝・ぅ繝ｬ繧ｯ繝医Μ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
            ;;
        *)
            print_warning "繝励Λ繝・ヨ繝輔か繝ｼ繝蝗ｺ譛峨・繝ｭ繝ｼ繧ｫ繝ｩ繧､繧ｼ繝ｼ繧ｷ繝ｧ繝ｳ繝√ぉ繝・け繧偵せ繧ｭ繝・・"
            ;;
    esac
}

check_i18n

# ========================================
# 邨先棡繧ｵ繝槭Μ繝ｼ
# ========================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN} 讀懆ｨｼ邨先棡${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}繧ｨ繝ｩ繝ｼ: $ERRORS 莉ｶ${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}隴ｦ蜻・ $WARNINGS 莉ｶ${NC}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}縺吶∋縺ｦ縺ｮ繝√ぉ繝・け縺ｫ蜷域ｼ縺励∪縺励◆・・{NC}"
fi

echo ""
echo -e "繝・・繝樊ｨ呎ｺ・ ${CYAN}insight-common/standards/COOL_COLOR.md${NC}"
echo -e "繧ｫ繝ｩ繝ｼ螳夂ｾｩ: ${CYAN}insight-common/brand/colors-cool.json${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Cool Blue & Slate 讓呎ｺ悶↓貅匁侠縺励※縺・∪縺帙ｓ縲ゆｿｮ豁｣縺励※縺上□縺輔＞縲・{NC}"
    exit 1
fi

exit 0
