#!/usr/bin/env bash
# ============================================
# env-crypto.sh - 環境変数ファイルの暗号化/復号
# ============================================
# Usage:
#   ./scripts/env-crypto.sh encrypt <product-code>  [passphrase]
#   ./scripts/env-crypto.sh decrypt <product-code>  [passphrase]
#   ./scripts/env-crypto.sh list
#
# Examples:
#   ./scripts/env-crypto.sh encrypt ivin
#   ./scripts/env-crypto.sh decrypt ivin
#   ./scripts/env-crypto.sh encrypt ivin "my-secret-passphrase"
#   ./scripts/env-crypto.sh list
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="$SCRIPT_DIR/../config/env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  env-crypto.sh - 環境変数 暗号化/復号ツール${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 encrypt <product-code> [passphrase]"
    echo "  $0 decrypt <product-code> [passphrase]"
    echo "  $0 list"
    echo ""
    echo "Examples:"
    echo "  $0 encrypt ivin              # 対話的にパスフレーズ入力"
    echo "  $0 decrypt ivin              # 対話的にパスフレーズ入力"
    echo "  $0 encrypt ivin \"secret123\"   # パスフレーズを引数で指定"
    echo "  $0 list                       # 利用可能な環境ファイル一覧"
    echo ""
    echo "Products: ivin, inss, iosh, iosd, inbt, inpy, inmv, inig, isof"
    exit 1
}

list_envs() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  利用可能な環境ファイル${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""

    # Plain text files
    local found_plain=false
    for f in "$ENV_DIR"/.env.*; do
        [ -f "$f" ] || continue
        [[ "$f" == *.enc ]] && continue
        found_plain=true
        local name
        name=$(basename "$f" | sed 's/^\.env\.//')
        echo -e "  ${GREEN}[平文]${NC}    .env.${name}"
    done
    $found_plain || echo -e "  ${YELLOW}平文ファイルなし${NC}"

    echo ""

    # Encrypted files
    local found_enc=false
    for f in "$ENV_DIR"/.env.*.enc; do
        [ -f "$f" ] || continue
        found_enc=true
        local name
        name=$(basename "$f" | sed 's/^\.env\.//' | sed 's/\.enc$//')
        local size
        size=$(wc -c < "$f" | tr -d ' ')
        echo -e "  ${YELLOW}[暗号化]${NC}  .env.${name}.enc  (${size} bytes)"
    done
    $found_enc || echo -e "  ${YELLOW}暗号化ファイルなし${NC}"

    echo ""
}

encrypt_env() {
    local product="$1"
    local passphrase="${2:-}"
    local plain_file="$ENV_DIR/.env.${product}"
    local enc_file="$ENV_DIR/.env.${product}.enc"

    if [ ! -f "$plain_file" ]; then
        echo -e "${RED}Error: ${plain_file} が見つかりません${NC}"
        exit 1
    fi

    if [ -z "$passphrase" ]; then
        echo -n "パスフレーズを入力: "
        read -rs passphrase
        echo ""
        echo -n "パスフレーズを再入力: "
        read -rs passphrase_confirm
        echo ""
        if [ "$passphrase" != "$passphrase_confirm" ]; then
            echo -e "${RED}Error: パスフレーズが一致しません${NC}"
            exit 1
        fi
    fi

    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
        -in "$plain_file" \
        -out "$enc_file" \
        -pass "pass:${passphrase}"

    echo -e "${GREEN}暗号化完了${NC}: ${enc_file}"
    echo -e "${YELLOW}注意${NC}: 平文ファイル (.env.${product}) は git に含まれません（.gitignore 済み）"
    echo -e "${YELLOW}注意${NC}: 暗号化ファイル (.env.${product}.enc) は git にコミット可能です"
}

decrypt_env() {
    local product="$1"
    local passphrase="${2:-}"
    local enc_file="$ENV_DIR/.env.${product}.enc"
    local plain_file="$ENV_DIR/.env.${product}"

    if [ ! -f "$enc_file" ]; then
        echo -e "${RED}Error: ${enc_file} が見つかりません${NC}"
        exit 1
    fi

    if [ -z "$passphrase" ]; then
        echo -n "パスフレーズを入力: "
        read -rs passphrase
        echo ""
    fi

    if openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
        -in "$enc_file" \
        -out "$plain_file" \
        -pass "pass:${passphrase}" 2>/dev/null; then
        echo -e "${GREEN}復号完了${NC}: ${plain_file}"
        echo ""
        echo -e "${CYAN}--- 内容 ---${NC}"
        cat "$plain_file"
        echo ""
        echo -e "${CYAN}------------${NC}"
    else
        echo -e "${RED}Error: 復号に失敗しました（パスフレーズが正しくありません）${NC}"
        rm -f "$plain_file"
        exit 1
    fi
}

# --- Main ---
[ $# -lt 1 ] && usage

case "$1" in
    encrypt)
        [ $# -lt 2 ] && usage
        encrypt_env "$2" "${3:-}"
        ;;
    decrypt)
        [ $# -lt 2 ] && usage
        decrypt_env "$2" "${3:-}"
        ;;
    list)
        list_envs
        ;;
    *)
        usage
        ;;
esac
