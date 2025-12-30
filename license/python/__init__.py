"""
Insight Series License Management - Python
InsightPy等のPython製アプリケーション向けライセンス管理モジュール
"""

import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any


class ProductCode(Enum):
    """製品コード"""
    SALES = "SALES"  # SalesInsight
    SLIDE = "SLIDE"  # InsightSlide
    PY = "PY"        # InsightPy
    INTV = "INTV"    # InterviewInsight
    ALL = "ALL"      # 全製品バンドル


class LicenseTier(Enum):
    """ライセンスティア"""
    TRIAL = "TRIAL"  # トライアル（期間指定）
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

# ティア定義
# - duration_days: 日数ベースの期限（TRIAL用）
# - duration_months: 月数ベースの期限（STD/PRO用）
# - None: 永久ライセンス（ENT用）
TIERS: Dict[LicenseTier, Dict[str, Any]] = {
    LicenseTier.TRIAL: {"name": "Trial", "name_ja": "トライアル", "duration_months": None, "duration_days": 14},
    LicenseTier.STD: {"name": "Standard", "name_ja": "スタンダード", "duration_months": 12},
    LicenseTier.PRO: {"name": "Professional", "name_ja": "プロフェッショナル", "duration_months": 12},
    LicenseTier.ENT: {"name": "Enterprise", "name_ja": "エンタープライズ", "duration_months": None},
}


@dataclass
class FeatureLimits:
    """機能制限"""
    max_files: int
    max_records: int
    batch_processing: bool
    export: bool
    cloud_sync: bool
    priority: bool


# 機能制限定義
TIER_LIMITS: Dict[LicenseTier, FeatureLimits] = {
    LicenseTier.TRIAL: FeatureLimits(
        max_files=10,
        max_records=500,
        batch_processing=True,
        export=True,
        cloud_sync=False,
        priority=False,
    ),
    LicenseTier.STD: FeatureLimits(
        max_files=50,
        max_records=5000,
        batch_processing=True,
        export=True,
        cloud_sync=False,
        priority=False,
    ),
    LicenseTier.PRO: FeatureLimits(
        max_files=float('inf'),
        max_records=50000,
        batch_processing=True,
        export=True,
        cloud_sync=True,
        priority=True,
    ),
    LicenseTier.ENT: FeatureLimits(
        max_files=float('inf'),
        max_records=float('inf'),
        batch_processing=True,
        export=True,
        cloud_sync=True,
        priority=True,
    ),
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

    def validate(self, license_key: str, stored_expires_at: Optional[datetime] = None) -> LicenseInfo:
        """
        ライセンスキーを検証する

        Args:
            license_key: ライセンスキー
            stored_expires_at: 保存されている有効期限（任意）
        """
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

        # 有効期限の決定
        expires_at = stored_expires_at

        # 期限切れチェック (ENT は期限なし)
        if tier != LicenseTier.ENT and expires_at:
            if expires_at < datetime.now():
                return LicenseInfo(
                    is_valid=False,
                    product=product,
                    tier=tier,
                    expires_at=expires_at,
                    error="License expired"
                )

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


def get_feature_limits(tier: Optional[LicenseTier]) -> FeatureLimits:
    """機能制限を取得"""
    if not tier:
        return TIER_LIMITS[LicenseTier.TRIAL]  # デフォルトはTRIAL制限
    return TIER_LIMITS[tier]


def _calculate_default_expiry(tier: LicenseTier) -> Optional[datetime]:
    """デフォルトの有効期限を計算"""
    tier_config = TIERS[tier]

    # 日数ベースの期限 (TRIAL用)
    duration_days = tier_config.get("duration_days")
    if duration_days:
        return datetime.now() + timedelta(days=duration_days)

    # 月数ベースの期限 (STD, PRO用)
    duration_months = tier_config.get("duration_months")
    if duration_months:
        now = datetime.now()
        new_month = now.month + duration_months
        new_year = now.year + (new_month - 1) // 12
        new_month = (new_month - 1) % 12 + 1
        return datetime(new_year, new_month, now.day)

    return None  # 永久ライセンス (ENT)


def generate_license_key(
    product_code: ProductCode,
    tier: LicenseTier,
) -> str:
    """ライセンスキーを生成する"""
    import random
    import string

    chars = string.ascii_uppercase + string.digits
    random_part = lambda: ''.join(random.choices(chars, k=4))

    part1 = random_part()
    part2 = random_part()
    base_key = f"INS-{product_code.value}-{tier.value}-{part1}-{part2}"
    checksum = _calculate_checksum(base_key)

    return f"{base_key}-{checksum}"


def generate_license_with_expiry(
    product_code: ProductCode,
    tier: LicenseTier,
    expires_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    ライセンスキーと有効期限を一緒に生成

    Args:
        product_code: 製品コード
        tier: ライセンスティア
        expires_at: 有効期限（指定しない場合はティアのデフォルト期間）

    Returns:
        {"license_key": str, "expires_at": datetime | None}
    """
    license_key = generate_license_key(product_code, tier)
    final_expires_at = expires_at if expires_at else _calculate_default_expiry(tier)

    return {
        "license_key": license_key,
        "expires_at": final_expires_at,
    }


__all__ = [
    "ProductCode",
    "LicenseTier",
    "LicenseInfo",
    "FeatureLimits",
    "LicenseValidator",
    "generate_license_key",
    "generate_license_with_expiry",
    "get_feature_limits",
    "PRODUCT_NAMES",
    "TIER_NAMES",
    "TIERS",
    "TIER_LIMITS",
]
