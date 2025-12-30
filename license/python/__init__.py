"""
Insight Series License Management - Python
InsightPy等のPython製アプリケーション向けライセンス管理モジュール
"""

import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class ProductCode(Enum):
    """製品コード"""
    SALES = "SALES"  # SalesInsight
    SLIDE = "SLIDE"  # InsightSlide
    PY = "PY"        # InsightPy
    INTV = "INTV"    # InterviewInsight
    ALL = "ALL"      # 全製品バンドル


class LicenseTier(Enum):
    """ライセンスティア"""
    TRIAL = "TRIAL"  # トライアル（30日）
    STD = "STD"      # Standard（年間）
    PRO = "PRO"      # Professional（年間）
    ENT = "ENT"      # Enterprise（永久）


PRODUCT_NAMES = {
    ProductCode.SALES: "SalesInsight",
    ProductCode.SLIDE: "InsightSlide",
    ProductCode.PY: "InsightPy",
    ProductCode.INTV: "InterviewInsight",
    ProductCode.ALL: "Insight Series Bundle",
}

TIER_NAMES = {
    LicenseTier.TRIAL: "Trial",
    LicenseTier.STD: "Standard",
    LicenseTier.PRO: "Professional",
    LicenseTier.ENT: "Enterprise",
}

# ライセンスキーのフォーマット検証用正規表現
# 形式: INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
LICENSE_KEY_REGEX = re.compile(
    r"^INS-(SALES|SLIDE|PY|INTV|ALL)-(TRIAL|STD|PRO|ENT)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$"
)


@dataclass
class LicenseInfo:
    """ライセンス情報"""
    is_valid: bool
    product: Optional[ProductCode]
    tier: Optional[LicenseTier]
    expires_at: Optional[datetime]
    error: Optional[str] = None


def _calculate_checksum(input_str: str) -> str:
    """チェックサムを計算する"""
    total = sum(ord(c) * (i + 1) for i, c in enumerate(input_str))
    checksum_value = total % 1296

    # Base36エンコード
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if checksum_value == 0:
        return "00"

    result = ""
    while checksum_value:
        result = chars[checksum_value % 36] + result
        checksum_value //= 36

    return result.zfill(2)


class LicenseValidator:
    """ライセンスバリデーター"""

    def validate(self, license_key: str) -> LicenseInfo:
        """ライセンスキーを検証する"""
        if not license_key:
            return LicenseInfo(
                is_valid=False,
                product=None,
                tier=None,
                expires_at=None,
                error="License key is required"
            )

        normalized = license_key.strip().upper()
        match = LICENSE_KEY_REGEX.match(normalized)

        if not match:
            return LicenseInfo(
                is_valid=False,
                product=None,
                tier=None,
                expires_at=None,
                error="Invalid license key format"
            )

        product_str, tier_str, part1, part2, provided_checksum = match.groups()

        # チェックサム検証
        base_key = f"INS-{product_str}-{tier_str}-{part1}-{part2}"
        expected_checksum = _calculate_checksum(base_key)

        if provided_checksum != expected_checksum:
            return LicenseInfo(
                is_valid=False,
                product=None,
                tier=None,
                expires_at=None,
                error="Invalid checksum"
            )

        product = ProductCode(product_str)
        tier = LicenseTier(tier_str)

        # 有効期限の計算
        expires_at = None
        if tier != LicenseTier.ENT:
            days = 30 if tier == LicenseTier.TRIAL else 365
            expires_at = datetime.now() + timedelta(days=days)

        return LicenseInfo(
            is_valid=True,
            product=product,
            tier=tier,
            expires_at=expires_at
        )

    def is_product_covered(self, license_info: LicenseInfo, target_product: ProductCode) -> bool:
        """製品がライセンスでカバーされているかチェック"""
        if not license_info.is_valid or not license_info.product:
            return False

        # ALLライセンスは全製品をカバー
        if license_info.product == ProductCode.ALL:
            return True

        return license_info.product == target_product


def generate_license_key(product: ProductCode, tier: LicenseTier) -> str:
    """ライセンスキーを生成する（開発・テスト用）"""
    import random
    import string

    chars = string.ascii_uppercase + string.digits
    random_part = lambda: ''.join(random.choices(chars, k=4))

    part1 = random_part()
    part2 = random_part()
    base_key = f"INS-{product.value}-{tier.value}-{part1}-{part2}"
    checksum = _calculate_checksum(base_key)

    return f"{base_key}-{checksum}"


__all__ = [
    "ProductCode",
    "LicenseTier",
    "LicenseInfo",
    "LicenseValidator",
    "generate_license_key",
    "PRODUCT_NAMES",
    "TIER_NAMES",
]
