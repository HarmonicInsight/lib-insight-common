"""
Insight Series License Management - Python
オフラインライセンス認証モジュール

キー形弁E PPPP-PLAN-YYMM-HASH-SIG1-SIG2
"""

import hmac
import hashlib
import base64
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, Any


# =============================================================================
# 定数・設宁E
# =============================================================================

class ProductCode(Enum):
    """製品コード！E斁E��！E""
    INSS = "INSS"  # InsightOfficeSlide
    IOSH = "IOSH"  # InsightOfficeSheet
    IOSD = "IOSD"  # InsightOfficeDoc
    INPY = "INPY"  # InsightPy
    INMV = "INMV"  # InsightCast
    INBT = "INBT"  # InsightBot (RPA)
    INCA = "INCA"  # InsightNoCodeAnalyzer
    INIG = "INIG"  # InsightImageGen
    IVIN = "IVIN"  # InterviewInsight


class Plan(Enum):
    """プラン"""
    TRIAL = "TRIAL"    # トライアル�E�E4日間！E
    STD = "STD"        # Standard
    PRO = "PRO"        # Professional


PRODUCT_NAMES: Dict[ProductCode, str] = {
    ProductCode.INSS: "InsightOfficeSlide",
    ProductCode.IOSH: "InsightOfficeSheet",
    ProductCode.IOSD: "InsightOfficeDoc",
    ProductCode.INPY: "InsightPy",
    ProductCode.INMV: "InsightCast",
    ProductCode.INBT: "InsightBot",
    ProductCode.INCA: "InsightNoCodeAnalyzer",
    ProductCode.INIG: "InsightImageGen",
    ProductCode.IVIN: "InterviewInsight",
}

PLAN_NAMES: Dict[Plan, str] = {
    Plan.TRIAL: "トライアル",
    Plan.STD: "Standard",
    Plan.PRO: "Pro",
}

# 製品と対応�Eラン
PRODUCT_PLANS: Dict[str, list] = {
    "InsightOfficeSlide": [ProductCode.INSS],
    "InsightOfficeSheet": [ProductCode.IOSH],
    "InsightOfficeDoc": [ProductCode.IOSD],
    "InsightPy": [ProductCode.INPY],
    "InsightCast": [ProductCode.INMV],
    "InsightBot": [ProductCode.INBT],
    "InsightNoCodeAnalyzer": [ProductCode.INCA],
    "InsightImageGen": [ProductCode.INIG],
    "InterviewInsight": [ProductCode.IVIN],
}

# トライアル期間�E�日�E�E
TRIAL_DAYS = 14

# ライセンスキー正規表現
# 形弁E PPPP-PLAN-YYMM-HASH-SIG1-SIG2
LICENSE_KEY_REGEX = re.compile(
    r"^(INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN)-(TRIAL|STD|PRO)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
)


# =============================================================================
# エラーコーチE
# =============================================================================

class ErrorCode(Enum):
    E001 = "E001"  # キー形式不正
    E002 = "E002"  # 署名検証失敁E
    E003 = "E003"  # メール不一致
    E004 = "E004"  # 期限刁E��
    E005 = "E005"  # 製品不一致
    E006 = "E006"  # トライアル渁E


ERROR_MESSAGES: Dict[ErrorCode, str] = {
    ErrorCode.E001: "ライセンスキーの形式が正しくありません",
    ErrorCode.E002: "ライセンスキーが無効でぁE,
    ErrorCode.E003: "メールアドレスが一致しません",
    ErrorCode.E004: "ライセンスの有効期限が�EれてぁE��ぁE,
    ErrorCode.E005: "こ�Eライセンスは {product} 用でぁE,
    ErrorCode.E006: "トライアル期間は終亁E��てぁE��ぁE,
}


# =============================================================================
# チE�Eタクラス
# =============================================================================

@dataclass
class AuthResult:
    """認証結果"""
    success: bool
    product: Optional[ProductCode] = None
    plan: Optional[Plan] = None
    expires: Optional[datetime] = None
    error_code: Optional[ErrorCode] = None
    message: Optional[str] = None


class LicenseStatus(Enum):
    """ライセンス状慁E""
    VALID = "valid"                    # 有効
    EXPIRING_SOON = "expiring_soon"    # 30日以冁E��期限刁E��
    EXPIRED = "expired"                # 期限刁E��
    NOT_FOUND = "not_found"            # 未認証


@dataclass
class StatusResult:
    """スチE�Eタス確認結果"""
    status: LicenseStatus
    is_valid: bool
    product: Optional[ProductCode] = None
    plan: Optional[Plan] = None
    expires: Optional[datetime] = None
    days_remaining: Optional[int] = None
    email: Optional[str] = None


# =============================================================================
# 署名�Eハッシュ
# =============================================================================

# 署名用シークレチE��キー
_SECRET_KEY = b"insight-series-license-secret-2026"


def _generate_email_hash(email: str) -> str:
    """メールアドレスから4斁E���Eハッシュを生戁E""
    h = hashlib.sha256(email.lower().strip().encode()).digest()
    return base64.b32encode(h)[:4].decode().upper()


def _generate_signature(data: str) -> str:
    """署名を生�E�E�E斁E��！E""
    sig = hmac.new(_SECRET_KEY, data.encode(), hashlib.sha256).digest()
    return base64.b32encode(sig)[:8].decode().upper()


def _verify_signature(data: str, signature: str) -> bool:
    """署名を検証"""
    try:
        expected = _generate_signature(data)
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False


# =============================================================================
# ライセンスマネージャー
# =============================================================================

class LicenseManager:
    """ライセンス管琁E��ラス"""

    def __init__(self, product: str, config_dir: Optional[Path] = None):
        """
        Args:
            product: 製品名�E�EnsightOfficeSlide, InsightPy, InterviewInsight, etc.�E�E
            config_dir: 設定保存ディレクトリ�E�省略時�EチE��ォルト！E
        """
        self.product = product
        self.config_dir = config_dir or self._get_default_config_dir()
        self.config_path = self.config_dir / "license.dat"
        self._cached_data: Optional[Dict] = None

    def _get_default_config_dir(self) -> Path:
        """チE��ォルト�E設定ディレクトリ"""
        if os.name == 'nt':  # Windows
            base = Path(os.environ.get('APPDATA', ''))
        else:  # macOS/Linux
            home = Path.home()
            if (home / "Library").exists():  # macOS
                base = home / "Library" / "Application Support"
            else:  # Linux
                base = home / ".config"
        return base / "HarmonicInsight" / self.product

    def _get_valid_product_codes(self) -> list:
        """こ�E製品で有効な製品コード一覧"""
        return PRODUCT_PLANS.get(self.product, [])

    def authenticate(self, email: str, key: str) -> AuthResult:
        """
        ライセンス認証

        Args:
            email: メールアドレス
            key: ライセンスキー

        Returns:
            AuthResult
        """
        email = email.strip().lower()
        key = key.strip().upper()

        # 1. キー形式チェチE��
        match = LICENSE_KEY_REGEX.match(key)
        if not match:
            return AuthResult(
                success=False,
                error_code=ErrorCode.E001,
                message=ERROR_MESSAGES[ErrorCode.E001]
            )

        product_code_str, plan_str, yymm, email_hash, sig1, sig2 = match.groups()
        product_code = ProductCode(product_code_str)
        plan = Plan(plan_str)
        signature = sig1 + sig2

        # 2. 署名検証
        sign_data = f"{product_code_str}-{plan_str}-{yymm}-{email_hash}"
        if not _verify_signature(sign_data, signature):
            return AuthResult(
                success=False,
                error_code=ErrorCode.E002,
                message=ERROR_MESSAGES[ErrorCode.E002]
            )

        # 3. メールハッシュ照吁E
        expected_hash = _generate_email_hash(email)
        if email_hash != expected_hash:
            return AuthResult(
                success=False,
                error_code=ErrorCode.E003,
                message=ERROR_MESSAGES[ErrorCode.E003]
            )

        # 4. 有効期限チェチE��
        try:
            year = 2000 + int(yymm[:2])
            month = int(yymm[2:])
            # 月末日を有効期限とする
            if month == 12:
                expires = datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                expires = datetime(year, month + 1, 1) - timedelta(days=1)
            expires = expires.replace(hour=23, minute=59, second=59)
        except ValueError:
            return AuthResult(
                success=False,
                error_code=ErrorCode.E001,
                message=ERROR_MESSAGES[ErrorCode.E001]
            )

        if datetime.now() > expires:
            return AuthResult(
                success=False,
                product=product_code,
                plan=plan,
                expires=expires,
                error_code=ErrorCode.E004,
                message=ERROR_MESSAGES[ErrorCode.E004]
            )

        # 5. 製品コードチェチE��
        valid_codes = self._get_valid_product_codes()
        if product_code not in valid_codes:
            return AuthResult(
                success=False,
                product=product_code,
                plan=plan,
                expires=expires,
                error_code=ErrorCode.E005,
                message=ERROR_MESSAGES[ErrorCode.E005].format(
                    product=PRODUCT_NAMES.get(product_code, product_code.value)
                )
            )

        # 認証成功 ↁEローカル保孁E
        self._save_license(email, key, product_code, plan, expires)

        return AuthResult(
            success=True,
            product=product_code,
            plan=plan,
            expires=expires
        )

    def _save_license(
        self,
        email: str,
        key: str,
        product_code: ProductCode,
        plan: Plan,
        expires: datetime
    ) -> None:
        """ライセンス惁E��を保孁E""
        self.config_dir.mkdir(parents=True, exist_ok=True)

        data = {
            "email": email,
            "key": key,
            "product": PRODUCT_NAMES.get(product_code, product_code.value),
            "productCode": product_code.value,
            "plan": plan.value,
            "expires": expires.strftime("%Y-%m-%d"),
            "verifiedAt": datetime.now().isoformat()
        }

        # 簡易暗号化（本番ではより強固な暗号化を使用�E�E
        content = json.dumps(data, ensure_ascii=False)
        encoded = base64.b64encode(content.encode()).decode()

        with open(self.config_path, 'w', encoding='utf-8') as f:
            f.write(encoded)

        self._cached_data = data

    def _load_license(self) -> Optional[Dict]:
        """保存されたライセンス惁E��を読み込む"""
        if self._cached_data:
            return self._cached_data

        if not self.config_path.exists():
            return None

        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                encoded = f.read()

            content = base64.b64decode(encoded).decode()
            self._cached_data = json.loads(content)
            return self._cached_data
        except Exception:
            return None

    def check_status(self) -> StatusResult:
        """ライセンス状態を確誁E""
        data = self._load_license()

        if not data:
            return StatusResult(
                status=LicenseStatus.NOT_FOUND,
                is_valid=False
            )

        try:
            expires = datetime.strptime(data["expires"], "%Y-%m-%d")
            expires = expires.replace(hour=23, minute=59, second=59)
            now = datetime.now()
            days_remaining = (expires - now).days

            product_code = ProductCode(data["productCode"])
            plan = Plan(data["plan"])

            if now > expires:
                return StatusResult(
                    status=LicenseStatus.EXPIRED,
                    is_valid=False,
                    product=product_code,
                    plan=plan,
                    expires=expires,
                    days_remaining=0,
                    email=data.get("email")
                )

            if days_remaining <= 30:
                status = LicenseStatus.EXPIRING_SOON
            else:
                status = LicenseStatus.VALID

            return StatusResult(
                status=status,
                is_valid=True,
                product=product_code,
                plan=plan,
                expires=expires,
                days_remaining=days_remaining,
                email=data.get("email")
            )

        except Exception:
            return StatusResult(
                status=LicenseStatus.NOT_FOUND,
                is_valid=False
            )

    def clear_license(self) -> None:
        """ライセンス惁E��をクリア"""
        self._cached_data = None
        if self.config_path.exists():
            self.config_path.unlink()

    @property
    def days_remaining(self) -> int:
        """残り日数"""
        status = self.check_status()
        return status.days_remaining or 0


# =============================================================================
# ライセンスキー生�E�E�開発老E���E�E
# =============================================================================

def generate_license_key(
    product_code: ProductCode,
    plan: Plan,
    email: str,
    expires: datetime
) -> str:
    """
    ライセンスキーを生戁E

    Args:
        product_code: 製品コーチE
        plan: プラン
        email: メールアドレス
        expires: 有効期限

    Returns:
        ライセンスキー�E�EPPP-PLAN-YYMM-HASH-SIG1-SIG2形式！E
    """
    # YYMM形弁E
    yymm = expires.strftime("%y%m")

    # メールハッシュ
    email_hash = _generate_email_hash(email)

    # 署名データ
    sign_data = f"{product_code.value}-{plan.value}-{yymm}-{email_hash}"

    # 署名生戁E
    signature = _generate_signature(sign_data)
    sig1, sig2 = signature[:4], signature[4:]

    return f"{product_code.value}-{plan.value}-{yymm}-{email_hash}-{sig1}-{sig2}"


def generate_trial_key(product_code: ProductCode, email: str) -> str:
    """
    トライアルキーを生戁E

    Args:
        product_code: 製品コーチE
        email: メールアドレス

    Returns:
        トライアルキー
    """
    expires = datetime.now() + timedelta(days=TRIAL_DAYS)
    return generate_license_key(product_code, Plan.TRIAL, email, expires)


# =============================================================================
# エクスポ�EチE
# =============================================================================

__all__ = [
    # クラス
    "LicenseManager",
    "ProductCode",
    "Plan",
    "ErrorCode",
    "LicenseStatus",
    "AuthResult",
    "StatusResult",
    # 定数
    "PRODUCT_NAMES",
    "PLAN_NAMES",
    "TRIAL_DAYS",
    "ERROR_MESSAGES",
    # 関数
    "generate_license_key",
    "generate_trial_key",
]
