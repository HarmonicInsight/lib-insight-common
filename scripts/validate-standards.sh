#!/bin/bash
#
# Insight Series 讓呎ｺ匁､懆ｨｼ繧ｹ繧ｯ繝ｪ繝励ヨ
# 譁ｰ隕上・繝ｭ繧ｸ繧ｧ繧ｯ繝井ｽ懈・譎ゅ・PR菴懈・譎ゅ↓螳溯｡悟ｿ・・
#
# 菴ｿ縺・婿:
#   ./validate-standards.sh <project-directory>
#

set -e

# 繧ｫ繝ｩ繝ｼ螳夂ｾｩ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color

# 讀懆ｨｼ邨先棡
ERRORS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${GOLD}========================================${NC}"
    echo -e "${GOLD} Insight Series 讓呎ｺ匁､懆ｨｼ${NC}"
    echo -e "${GOLD}========================================${NC}"
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
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}繧ｨ繝ｩ繝ｼ: 繝・ぅ繝ｬ繧ｯ繝医Μ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ: $PROJECT_DIR${NC}"
    exit 1
fi

# ============================================================
# insight-common 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ閾ｪ蜍輔そ繝・ヨ繧｢繝・・
# ============================================================
if [ -f "$PROJECT_DIR/.gitmodules" ] && grep -q "insight-common" "$PROJECT_DIR/.gitmodules" 2>/dev/null; then
    if [ ! -f "$PROJECT_DIR/insight-common/CLAUDE.md" ]; then
        echo -e "${YELLOW}insight-common 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ繧貞・譛溷喧縺励※縺・∪縺・..${NC}"
        git -C "$PROJECT_DIR" submodule init 2>/dev/null || true
        git -C "$PROJECT_DIR" submodule update --recursive 2>/dev/null || true
    fi
    # 繧ｹ繧ｯ繝ｪ繝励ヨ縺ｮ螳溯｡梧ｨｩ髯舌ｒ莉倅ｸ・
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

# ========================================
# 1. 繝・じ繧､繝ｳ繧ｷ繧ｹ繝・Β讀懆ｨｼ・亥・繝励Λ繝・ヨ繝輔か繝ｼ繝蜈ｱ騾夲ｼ・
# ========================================
print_section "1" "繝・じ繧､繝ｳ繧ｷ繧ｹ繝・Β・・vory & Gold Theme・画､懆ｨｼ"

# 遖∵ｭ｢: Blue (#2563EB) 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_blue_primary() {
    local blue_as_primary=$(grep -r "primary.*#2563EB\|#2563EB.*primary\|Primary.*2563EB\|primaryColor.*2563EB" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -5)

    if [ -n "$blue_as_primary" ]; then
        print_error "Blue (#2563EB) 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・∪縺・
        echo "      $blue_as_primary" | head -3
        return 1
    fi
    print_ok "Blue 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・
    return 0
}

# 蠢・・ Gold (#B8942F) 縺後・繝ｩ繧､繝槭Μ縺ｨ縺励※菴ｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_gold_primary() {
    local gold_primary=$(grep -r "#B8942F\|B8942F\|0xFFB8942F" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -1)

    if [ -z "$gold_primary" ]; then
        print_error "Gold (#B8942F) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        return 1
    fi
    print_ok "Gold (#B8942F) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

# 蠢・・ Ivory閭梧勹 (#FAF8F5) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ
check_ivory_background() {
    local ivory=$(grep -r "#FAF8F5\|FAF8F5\|0xFFFAF8F5" "$PROJECT_DIR" --include="*.xaml" --include="*.xml" --include="*.json" --include="*.ts" --include="*.tsx" --include="*.swift" --include="*.kt" --include="*.css" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -1)

    if [ -z "$ivory" ]; then
        print_warning "Ivory閭梧勹 (#FAF8F5) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        return 1
    fi
    print_ok "Ivory閭梧勹 (#FAF8F5) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

check_blue_primary
check_gold_primary
check_ivory_background

# ========================================
# 2. 繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｷ繧ｹ繝・Β讀懆ｨｼ
# ========================================
print_section "2" "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｷ繧ｹ繝・Β讀懆ｨｼ"

check_license_manager() {
    local license_file=$(find "$PROJECT_DIR" \( -name "*LicenseManager*" -o -name "*license_manager*" \) -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)

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
print_section "3" "陬ｽ蜩√さ繝ｼ繝画､懆ｨｼ"

check_product_code() {
    local product_codes="INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN"
    local found_code=$(grep -rE "($product_codes)" "$PROJECT_DIR" --include="*.cs" --include="*.ts" --include="*.py" --include="*.swift" --include="*.kt" --include="*.json" --exclude-dir=node_modules --exclude-dir=insight-common 2>/dev/null | head -1)

    if [ -z "$found_code" ]; then
        print_warning "逋ｻ骭ｲ貂医∩陬ｽ蜩√さ繝ｼ繝峨′隕九▽縺九ｊ縺ｾ縺帙ｓ・域眠隕剰｣ｽ蜩√・蝣ｴ蜷医・ config/products.ts 縺ｫ逋ｻ骭ｲ縺励※縺上□縺輔＞・・
        return 1
    fi
    print_ok "陬ｽ蜩√さ繝ｼ繝峨′菴ｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
    return 0
}

check_product_code || true

# ========================================
# 4. Android 蝗ｺ譛画､懆ｨｼ
# ========================================
if [ "$PLATFORM" = "android" ]; then
    echo ""
    print_section "4" "Android 蝗ｺ譛峨メ繧ｧ繝・け"

    # 4.1 Version Catalog
    if [ -f "$PROJECT_DIR/gradle/libs.versions.toml" ]; then
        print_ok "gradle/libs.versions.toml 縺悟ｭ伜惠"

        agp_ver=$(grep '^agp\s*=' "$PROJECT_DIR/gradle/libs.versions.toml" 2>/dev/null | head -1)
        if [ -n "$agp_ver" ]; then
            print_ok "AGP 繝舌・繧ｸ繝ｧ繝ｳ螳夂ｾｩ: $agp_ver"
        else
            print_warning "AGP 繝舌・繧ｸ繝ｧ繝ｳ縺・libs.versions.toml 縺ｫ螳夂ｾｩ縺輔ｌ縺ｦ縺・∪縺帙ｓ"
        fi

        kotlin_ver=$(grep '^kotlin\s*=' "$PROJECT_DIR/gradle/libs.versions.toml" 2>/dev/null | head -1)
        if [ -n "$kotlin_ver" ]; then
            print_ok "Kotlin 繝舌・繧ｸ繝ｧ繝ｳ螳夂ｾｩ: $kotlin_ver"
        else
            print_warning "Kotlin 繝舌・繧ｸ繝ｧ繝ｳ縺・libs.versions.toml 縺ｫ螳夂ｾｩ縺輔ｌ縺ｦ縺・∪縺帙ｓ"
        fi
    else
        print_error "gradle/libs.versions.toml 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.2 SDK 繝舌・繧ｸ繝ｧ繝ｳ
    build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" -path "*/app/*" 2>/dev/null | head -1)
    if [ -z "$build_file" ]; then
        build_file=$(find "$PROJECT_DIR" -name "build.gradle.kts" 2>/dev/null | grep -v '/build/' | head -1)
    fi

    if [ -n "$build_file" ]; then
        compile_sdk=$(grep "compileSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$compile_sdk" | grep -q "35"; then
            print_ok "compileSdk = 35"
        elif [ -n "$compile_sdk" ]; then
            print_error "compileSdk 縺・35 縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ: $compile_sdk"
        else
            print_warning "compileSdk 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi

        target_sdk=$(grep "targetSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$target_sdk" | grep -q "35"; then
            print_ok "targetSdk = 35"
        elif [ -n "$target_sdk" ]; then
            print_error "targetSdk 縺・35 縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ: $target_sdk"
        fi

        min_sdk=$(grep "minSdk\s*=" "$build_file" 2>/dev/null | head -1)
        if echo "$min_sdk" | grep -q "26"; then
            print_ok "minSdk = 26"
        elif [ -n "$min_sdk" ]; then
            print_warning "minSdk 縺・26 縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ: $min_sdk"
        fi

        jvm_target=$(grep 'jvmTarget\s*=' "$build_file" 2>/dev/null | head -1)
        if echo "$jvm_target" | grep -q "17"; then
            print_ok "JVM Target = 17"
        elif [ -n "$jvm_target" ]; then
            print_error "JVM Target 縺・17 縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ: $jvm_target"
        fi
    else
        print_warning "app/build.gradle.kts 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.3 ProGuard / R8
    if [ -n "$build_file" ]; then
        if grep -q "isMinifyEnabled\s*=\s*true" "$build_file" 2>/dev/null; then
            print_ok "ProGuard/R8 縺梧怏蜉ｹ (isMinifyEnabled = true)"
        else
            print_error "繝ｪ繝ｪ繝ｼ繧ｹ繝薙Ν繝峨〒 isMinifyEnabled = true 縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ"
        fi

        if grep -q "isShrinkResources\s*=\s*true" "$build_file" 2>/dev/null; then
            print_ok "繝ｪ繧ｽ繝ｼ繧ｹ邵ｮ蟆上′譛牙柑 (isShrinkResources = true)"
        else
            print_warning "isShrinkResources = true 縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ"
        fi
    fi

    if find "$PROJECT_DIR" -name "proguard-rules.pro" 2>/dev/null | head -1 | grep -q .; then
        print_ok "proguard-rules.pro 縺悟ｭ伜惠"
    else
        print_warning "proguard-rules.pro 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.4 繝・・繝槭ヵ繧｡繧､繝ｫ
    color_kt=$(find "$PROJECT_DIR" -name "Color.kt" -path "*/theme/*" 2>/dev/null | head -1)
    if [ -n "$color_kt" ]; then
        if grep -q "InsightPrimaryLight" "$color_kt" 2>/dev/null; then
            print_ok "Color.kt: Insight 讓呎ｺ門多蜷・(InsightPrimaryLight)"
        else
            print_warning "Color.kt: InsightPrimaryLight 蜻ｽ蜷阪′隕九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_error "ui/theme/Color.kt 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    theme_kt=$(find "$PROJECT_DIR" -name "Theme.kt" -path "*/theme/*" 2>/dev/null | head -1)
    if [ -n "$theme_kt" ]; then
        if grep -q "InsightTypography" "$theme_kt" 2>/dev/null; then
            print_ok "Theme.kt: InsightTypography 繧剃ｽｿ逕ｨ"
        else
            print_warning "Theme.kt: InsightTypography 縺悟盾辣ｧ縺輔ｌ縺ｦ縺・∪縺帙ｓ"
        fi
    else
        print_error "ui/theme/Theme.kt 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    type_kt=$(find "$PROJECT_DIR" -name "Type.kt" -path "*/theme/*" 2>/dev/null | head -1)
    if [ -n "$type_kt" ]; then
        if grep -q "InsightTypography" "$type_kt" 2>/dev/null; then
            print_ok "Type.kt: InsightTypography 螟画焚蜷・
        else
            print_error "Type.kt: InsightTypography 螟画焚蜷阪′隕九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_error "ui/theme/Type.kt 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.5 colors.xml
    colors_xml=$(find "$PROJECT_DIR" -name "colors.xml" -path "*/values/*" 2>/dev/null | head -1)
    if [ -n "$colors_xml" ]; then
        if grep -q "B8942F" "$colors_xml" 2>/dev/null; then
            print_ok "colors.xml: Gold (#B8942F) 縺悟ｮ夂ｾｩ"
        else
            print_error "colors.xml: Gold (#B8942F) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
        if grep -q "FAF8F5" "$colors_xml" 2>/dev/null; then
            print_ok "colors.xml: Ivory (#FAF8F5) 縺悟ｮ夂ｾｩ"
        else
            print_warning "colors.xml: Ivory (#FAF8F5) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_error "res/values/colors.xml 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.6 i18n
    strings_ja=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values/*" ! -path "*/values-*/*" 2>/dev/null | head -1)
    if [ -n "$strings_ja" ]; then
        print_ok "values/strings.xml (譌･譛ｬ隱・ 縺悟ｭ伜惠"
    else
        print_warning "values/strings.xml (譌･譛ｬ隱・ 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    strings_en=$(find "$PROJECT_DIR" -name "strings.xml" -path "*/values-en/*" 2>/dev/null | head -1)
    if [ -n "$strings_en" ]; then
        print_ok "values-en/strings.xml (闍ｱ隱・ 縺悟ｭ伜惠"
    else
        print_warning "values-en/strings.xml (闍ｱ隱・ 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.7 繝代ャ繧ｱ繝ｼ繧ｸ蜷・
    if [ -n "$build_file" ]; then
        namespace=$(grep 'namespace\s*=' "$build_file" 2>/dev/null | head -1)
        if echo "$namespace" | grep -q "com\.harmonic"; then
            print_ok "繝代ャ繧ｱ繝ｼ繧ｸ蜷・ com.harmonic.* 貅匁侠"
        elif [ -n "$namespace" ]; then
            print_warning "繝代ャ繧ｱ繝ｼ繧ｸ蜷阪′ com.harmonic.* 蠖｢蠑上〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ: $namespace"
        fi
    fi

    # 4.8 Adaptive Icon
    foreground=$(find "$PROJECT_DIR" -name "ic_launcher_foreground.xml" 2>/dev/null | head -1)
    if [ -n "$foreground" ]; then
        if grep -q "B8942F" "$foreground" 2>/dev/null; then
            print_ok "ic_launcher_foreground.xml: Gold (#B8942F) 菴ｿ逕ｨ"
        else
            print_warning "ic_launcher_foreground.xml: Gold (#B8942F) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_warning "ic_launcher_foreground.xml 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    background_icon=$(find "$PROJECT_DIR" -name "ic_launcher_background.xml" 2>/dev/null | head -1)
    if [ -n "$background_icon" ]; then
        if grep -q "FAF8F5" "$background_icon" 2>/dev/null; then
            print_ok "ic_launcher_background.xml: Ivory (#FAF8F5) 閭梧勹"
        else
            print_warning "ic_launcher_background.xml: Ivory (#FAF8F5) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_warning "ic_launcher_background.xml 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.9 AAB bundle config
    if [ -n "$build_file" ]; then
        if grep -q "bundle\s*{" "$build_file" 2>/dev/null; then
            print_ok "bundle {} 繝悶Ο繝・け縺悟ｭ伜惠・・AB 譛驕ｩ蛹厄ｼ・
            if grep -q "enableSplit\s*=\s*true" "$build_file" 2>/dev/null; then
                print_ok "AAB split 驟堺ｿ｡縺梧怏蜉ｹ"
            else
                print_warning "AAB split 驟堺ｿ｡ (enableSplit = true) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
        else
            print_error "bundle {} 繝悶Ο繝・け縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・lay Store 縺ｮ AAB 繝薙Ν繝峨↓蠢・ｦ・ｼ・
        fi
    fi

    # 4.10 CI/CD 繝ｯ繝ｼ繧ｯ繝輔Ο繝ｼ
    ci_workflow=$(find "$PROJECT_DIR" -name "build.yml" -path "*/.github/workflows/*" 2>/dev/null | head -1)
    if [ -n "$ci_workflow" ]; then
        print_ok ".github/workflows/build.yml 縺悟ｭ伜惠"
        if grep -q "assembleRelease" "$ci_workflow" 2>/dev/null; then
            print_ok "CI: APK 繝薙Ν繝・(assembleRelease) 縺瑚ｨｭ螳壹＆繧後※縺・ｋ"
        else
            print_warning "CI: assembleRelease 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
        if grep -q "bundleRelease" "$ci_workflow" 2>/dev/null; then
            print_ok "CI: AAB 繝薙Ν繝・(bundleRelease) 縺瑚ｨｭ螳壹＆繧後※縺・ｋ"
        else
            print_error "CI: bundleRelease 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・lay Store 蠢・茨ｼ・
        fi
        if grep -q "submodules" "$ci_workflow" 2>/dev/null; then
            print_ok "CI: submodules 縺瑚ｨｭ螳壹＆繧後※縺・ｋ"
        else
            if [ -f "$PROJECT_DIR/.gitmodules" ]; then
                print_warning "CI: 繧ｵ繝悶Δ繧ｸ繝･繝ｼ繝ｫ縺悟ｭ伜惠縺吶ｋ縺・submodules: true 縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ"
            fi
        fi
    else
        print_warning ".github/workflows/build.yml 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 4.11 Play Store 繝｡繧ｿ繝・・繧ｿ
    if [ -d "$PROJECT_DIR/fastlane/metadata/android" ]; then
        print_ok "fastlane/metadata/android/ 縺悟ｭ伜惠"
        for locale in "ja-JP" "en-US"; do
            locale_dir="$PROJECT_DIR/fastlane/metadata/android/$locale"
            if [ -d "$locale_dir" ]; then
                print_ok "繧ｹ繝医い繝｡繧ｿ繝・・繧ｿ ($locale) 縺悟ｭ伜惠"
                for file in "title.txt" "short_description.txt" "full_description.txt"; do
                    if [ -f "$locale_dir/$file" ]; then
                        print_ok "  $locale/$file 縺悟ｭ伜惠"
                    else
                        print_warning "  $locale/$file 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
                    fi
                done
            else
                print_warning "繧ｹ繝医い繝｡繧ｿ繝・・繧ｿ ($locale) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
        done
    else
        print_warning "fastlane/metadata/android/ 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・lay Store 繝ｪ繝ｪ繝ｼ繧ｹ譎ゅ↓蠢・ｦ・ｼ・
    fi

    # 4.12 Keystore 險ｭ螳・
    if [ -f "$PROJECT_DIR/keystore.properties" ] || [ -f "$PROJECT_DIR/keystore.properties.example" ]; then
        print_ok "keystore.properties(.example) 縺悟ｭ伜惠"
    else
        print_warning "keystore.properties 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・医Μ繝ｪ繝ｼ繧ｹ繝薙Ν繝峨・鄂ｲ蜷阪↓蠢・ｦ・ｼ・
    fi

    # 4.13 髢狗匱逕ｨ keystore・井ｸ頑嶌縺阪う繝ｳ繧ｹ繝医・繝ｫ蟇ｾ遲厄ｼ・
    if [ -f "$PROJECT_DIR/app/dev.keystore" ]; then
        print_ok "app/dev.keystore 縺悟ｭ伜惠・医メ繝ｼ繝蜈ｱ譛峨・ debug 鄂ｲ蜷搾ｼ・
    else
        print_warning "app/dev.keystore 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・井ｸ頑嶌縺阪う繝ｳ繧ｹ繝医・繝ｫ縺ｫ蠢・ｦ・窶・ﾂｧ8.5 蜿ら・・・
    fi

    # 4.14 debug signingConfig 縺ｮ遒ｺ隱・
    local app_gradle="$PROJECT_DIR/app/build.gradle.kts"
    if [ -f "$app_gradle" ]; then
        if grep -q 'getByName("debug")' "$app_gradle" 2>/dev/null && grep -q "dev.keystore" "$app_gradle" 2>/dev/null; then
            print_ok "debug signingConfig 縺・dev.keystore 繧貞盾辣ｧ"
        else
            print_warning "debug signingConfig 縺・dev.keystore 繧貞盾辣ｧ縺励※縺・∪縺帙ｓ・按ｧ8.5 蜿ら・・・
        fi
    fi

    # keystore 縺後Μ繝昴ず繝医Μ縺ｫ蜷ｫ縺ｾ繧後※縺・↑縺・％縺ｨ繧堤｢ｺ隱搾ｼ・ev.keystore 縺ｯ髯､螟厄ｼ・
    if find "$PROJECT_DIR" \( -name "*.jks" -o -name "*.keystore" \) ! -name "dev.keystore" 2>/dev/null | head -1 | grep -q .; then
        gitignore_file="$PROJECT_DIR/.gitignore"
        if [ -f "$gitignore_file" ]; then
            if grep -q "\.jks" "$gitignore_file" 2>/dev/null && grep -q "\.keystore" "$gitignore_file" 2>/dev/null; then
                print_ok ".gitignore: release keystore 繝輔ぃ繧､繝ｫ縺碁勁螟悶＆繧後※縺・ｋ"
            else
                print_error ".gitignore: *.jks / *.keystore 縺碁勁螟悶＆繧後※縺・∪縺帙ｓ"
            fi
        fi
    fi
fi

# ========================================
# 5. Expo/React Native 蝗ｺ譛画､懆ｨｼ
# ========================================
if [ "$PLATFORM" = "expo" ]; then
    echo ""
    print_section "5" "Expo/React Native 蝗ｺ譛峨メ繧ｧ繝・け"

    # 5.1 app.json
    if [ -f "$PROJECT_DIR/app.json" ]; then
        print_ok "app.json 縺悟ｭ伜惠"

        if grep -q "2563EB" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_error "app.json: Blue (#2563EB) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・∪縺・
        else
            print_ok "app.json: Blue 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・↑縺・
        fi

        if grep -q "B8942F" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_ok "app.json: Gold (#B8942F) 縺御ｽｿ逕ｨ縺輔ｌ縺ｦ縺・ｋ"
        else
            print_warning "app.json: Gold (#B8942F) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi

        if grep -q "expo-router" "$PROJECT_DIR/app.json" 2>/dev/null; then
            print_ok "app.json: expo-router 繝励Λ繧ｰ繧､繝ｳ縺瑚ｨｭ螳壹＆繧後※縺・ｋ"
        else
            print_warning "app.json: expo-router 繝励Λ繧ｰ繧､繝ｳ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_error "app.json 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 5.2 eas.json
    if [ -f "$PROJECT_DIR/eas.json" ]; then
        print_ok "eas.json 縺悟ｭ伜惠"

        if grep -q '"production"' "$PROJECT_DIR/eas.json" 2>/dev/null; then
            print_ok "eas.json: production 繝励Ο繝輔ぃ繧､繝ｫ縺悟ｮ夂ｾｩ縺輔ｌ縺ｦ縺・ｋ"
        else
            print_warning "eas.json: production 繝励Ο繝輔ぃ繧､繝ｫ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_warning "eas.json 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・AS Build 譛ｪ險ｭ螳夲ｼ・
    fi

    # 5.3 package.json 萓晏ｭ倬未菫・
    if [ -f "$PROJECT_DIR/package.json" ]; then
        if grep -q '"expo-router"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            print_ok "package.json: expo-router 縺御ｾ晏ｭ倬未菫ゅ↓縺ゅｋ"
        else
            print_warning "package.json: expo-router 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi

        if grep -q '"expo"' "$PROJECT_DIR/package.json" 2>/dev/null; then
            print_ok "package.json: expo 縺御ｾ晏ｭ倬未菫ゅ↓縺ゅｋ"
        fi
    fi

    # 5.4 lib/colors.ts
    colors_ts=$(find "$PROJECT_DIR" -name "colors.ts" -path "*/lib/*" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$colors_ts" ]; then
        if grep -q "B8942F" "$colors_ts" 2>/dev/null; then
            print_ok "lib/colors.ts: Gold (#B8942F) 縺悟ｮ夂ｾｩ縺輔ｌ縺ｦ縺・ｋ"
        else
            print_error "lib/colors.ts: Gold (#B8942F) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi

        if grep -q "FAF8F5" "$colors_ts" 2>/dev/null; then
            print_ok "lib/colors.ts: Ivory (#FAF8F5) 縺悟ｮ夂ｾｩ縺輔ｌ縺ｦ縺・ｋ"
        else
            print_warning "lib/colors.ts: Ivory (#FAF8F5) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        # colors.ts 縺・src/ 驟堺ｸ九↓縺ゅｋ蜿ｯ閭ｽ諤ｧ繧・
        colors_ts_alt=$(find "$PROJECT_DIR" -name "colors.ts" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
        if [ -n "$colors_ts_alt" ]; then
            print_warning "colors.ts 縺・lib/ 莉･螟悶↓驟咲ｽｮ縺輔ｌ縺ｦ縺・∪縺・ $colors_ts_alt"
            if grep -q "B8942F" "$colors_ts_alt" 2>/dev/null; then
                print_ok "colors.ts: Gold (#B8942F) 縺悟ｮ夂ｾｩ縺輔ｌ縺ｦ縺・ｋ"
            else
                print_error "colors.ts: Gold (#B8942F) 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
            fi
        else
            print_error "lib/colors.ts 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・医き繝ｩ繝ｼ螳夂ｾｩ繝輔ぃ繧､繝ｫ縺悟ｿ・ｦ・ｼ・
        fi
    fi

    # 5.5 lib/theme.ts
    theme_ts=$(find "$PROJECT_DIR" -name "theme.ts" -path "*/lib/*" -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$theme_ts" ]; then
        print_ok "lib/theme.ts 縺悟ｭ伜惠"
    else
        print_warning "lib/theme.ts 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・医ユ繝ｼ繝槫ｮ夂ｾｩ繝輔ぃ繧､繝ｫ謗ｨ螂ｨ・・
    fi

    # 5.6 lib/license-manager.ts
    license_ts=$(find "$PROJECT_DIR" \( -name "license-manager.ts" -o -name "licenseManager.ts" \) -not -path "*/node_modules/*" -not -path "*/insight-common/*" 2>/dev/null | head -1)
    if [ -n "$license_ts" ]; then
        print_ok "license-manager.ts 縺悟ｭ伜惠"
    else
        print_warning "license-manager.ts 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・nsightOffice 陬ｽ蜩√〒縺ｯ蠢・茨ｼ・
    fi

    # 5.7 TypeScript strict mode
    if [ -f "$PROJECT_DIR/tsconfig.json" ]; then
        if grep -q '"strict"\s*:\s*true' "$PROJECT_DIR/tsconfig.json" 2>/dev/null; then
            print_ok "tsconfig.json: strict mode 縺梧怏蜉ｹ"
        else
            print_warning "tsconfig.json: strict mode 縺檎┌蜉ｹ縺ｧ縺・
        fi
    else
        print_warning "tsconfig.json 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
    fi

    # 5.8 expo-router 繝輔ぃ繧､繝ｫ讒矩
    if [ -d "$PROJECT_DIR/app" ]; then
        if [ -f "$PROJECT_DIR/app/_layout.tsx" ]; then
            print_ok "app/_layout.tsx 縺悟ｭ伜惠・・xpo-router 繝ｫ繝ｼ繝医Ξ繧､繧｢繧ｦ繝茨ｼ・
        else
            print_warning "app/_layout.tsx 縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ"
        fi
    else
        print_warning "app/ 繝・ぅ繝ｬ繧ｯ繝医Μ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ・・xpo-router 讒矩縺ｧ縺ｯ縺ｪ縺・庄閭ｽ諤ｧ・・
    fi

    # 5.9 繝代ャ繧ｱ繝ｼ繧ｸ蜷・
    if [ -f "$PROJECT_DIR/app.json" ]; then
        expo_package=$(grep -o '"package"\s*:\s*"[^"]*"' "$PROJECT_DIR/app.json" 2>/dev/null | head -1)
        if echo "$expo_package" | grep -q "com\.harmonicinsight"; then
            print_ok "繝代ャ繧ｱ繝ｼ繧ｸ蜷・ com.harmonicinsight.* 貅匁侠"
        elif [ -n "$expo_package" ]; then
            print_warning "繝代ャ繧ｱ繝ｼ繧ｸ蜷阪′ com.harmonicinsight.* 蠖｢蠑上〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ: $expo_package"
        fi
    fi
fi

# ========================================
# 邨先棡繧ｵ繝槭Μ繝ｼ
# ========================================
echo ""
echo -e "${GOLD}========================================${NC}"
echo -e "${GOLD} 讀懆ｨｼ邨先棡${NC}"
echo -e "${GOLD}========================================${NC}"
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

if [ "$PLATFORM" = "android" ]; then
    echo -e "蜿ら・: ${BLUE}insight-common/standards/ANDROID.md${NC}"
    echo -e "繝・Φ繝励Ξ繝ｼ繝・ ${BLUE}insight-common/templates/android/${NC}"
elif [ "$PLATFORM" = "expo" ]; then
    echo -e "蜿ら・: ${BLUE}insight-common/standards/ANDROID.md ﾂｧ13${NC}"
    echo -e "繝・Φ繝励Ξ繝ｼ繝・ ${BLUE}insight-common/templates/expo/${NC}"
else
    echo -e "蜿ら・: ${BLUE}insight-common/standards/README.md${NC}"
fi
echo ""

# 邨ゆｺ・さ繝ｼ繝・
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}讓呎ｺ悶↓貅匁侠縺励※縺・∪縺帙ｓ縲ゆｿｮ豁｣縺励※縺上□縺輔＞縲・{NC}"
    exit 1
fi

exit 0
