"""
Insight Series 共通エラー定義 - Python
"""

from enum import Enum
from typing import Any, Dict, List, Optional


# ============== エラーコード ==============

class ErrorCode(str, Enum):
    """エラーコード"""
    # 一般
    UNKNOWN = "UNKNOWN"
    VALIDATION = "VALIDATION"
    NOT_FOUND = "NOT_FOUND"
    ALREADY_EXISTS = "ALREADY_EXISTS"

    # ネットワーク
    NETWORK = "NETWORK"
    TIMEOUT = "TIMEOUT"
    SERVER_ERROR = "SERVER_ERROR"

    # 認証・認可
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    SESSION_EXPIRED = "SESSION_EXPIRED"

    # ライセンス
    LICENSE_REQUIRED = "LICENSE_REQUIRED"
    LICENSE_INVALID = "LICENSE_INVALID"
    LICENSE_EXPIRED = "LICENSE_EXPIRED"
    FEATURE_LOCKED = "FEATURE_LOCKED"
    LIMIT_EXCEEDED = "LIMIT_EXCEEDED"

    # ファイル
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    FILE_ACCESS_DENIED = "FILE_ACCESS_DENIED"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    FILE_INVALID_TYPE = "FILE_INVALID_TYPE"
    FILE_CORRUPTED = "FILE_CORRUPTED"

    # データ
    DATA_INVALID = "DATA_INVALID"
    DATA_CONFLICT = "DATA_CONFLICT"
    DATA_IMPORT_FAILED = "DATA_IMPORT_FAILED"
    DATA_EXPORT_FAILED = "DATA_EXPORT_FAILED"


# ============== エラークラス ==============

class InsightError(Exception):
    """Insight 共通エラー"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        cause: Optional[Exception] = None
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.cause = cause

    def to_dict(self) -> Dict[str, Any]:
        """エラーを辞書形式に変換"""
        return {
            "name": self.__class__.__name__,
            "code": self.code.value,
            "message": self.message,
            "details": self.details,
        }

    def __str__(self) -> str:
        return f"[{self.code.value}] {self.message}"

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(code={self.code}, message={self.message!r})"


# ============== 専用エラークラス ==============

class LicenseError(InsightError):
    """ライセンスエラー"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        if code not in (
            ErrorCode.LICENSE_REQUIRED,
            ErrorCode.LICENSE_INVALID,
            ErrorCode.LICENSE_EXPIRED,
            ErrorCode.FEATURE_LOCKED,
            ErrorCode.LIMIT_EXCEEDED
        ):
            raise ValueError(f"Invalid license error code: {code}")
        super().__init__(code, message, details)


class ValidationError(InsightError):
    """バリデーションエラー"""

    def __init__(
        self,
        errors: List[Dict[str, str]],
        message: str = "Validation failed"
    ):
        super().__init__(
            ErrorCode.VALIDATION,
            message,
            details={"errors": errors}
        )
        self.errors = errors
        self.field = errors[0].get("field") if errors else None


class NetworkError(InsightError):
    """ネットワークエラー"""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        cause: Optional[Exception] = None
    ):
        code = ErrorCode.SERVER_ERROR if status_code and status_code >= 500 else ErrorCode.NETWORK
        super().__init__(code, message, cause=cause)
        self.status_code = status_code


class FileError(InsightError):
    """ファイルエラー"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        file_path: Optional[str] = None
    ):
        if code not in (
            ErrorCode.FILE_NOT_FOUND,
            ErrorCode.FILE_ACCESS_DENIED,
            ErrorCode.FILE_TOO_LARGE,
            ErrorCode.FILE_INVALID_TYPE,
            ErrorCode.FILE_CORRUPTED
        ):
            raise ValueError(f"Invalid file error code: {code}")
        super().__init__(code, message, details={"file_path": file_path})
        self.file_path = file_path


# ============== ヘルパー関数 ==============

def to_insight_error(error: Exception) -> InsightError:
    """エラーをInsightErrorに変換"""
    if isinstance(error, InsightError):
        return error
    return InsightError(ErrorCode.UNKNOWN, str(error), cause=error)


def get_error_message_key(code: ErrorCode) -> str:
    """エラーコードからi18nメッセージキーを取得"""
    key_map = {
        ErrorCode.UNKNOWN: "errors.unknown",
        ErrorCode.VALIDATION: "validation.error",
        ErrorCode.NOT_FOUND: "errors.notFound",
        ErrorCode.ALREADY_EXISTS: "errors.alreadyExists",
        ErrorCode.NETWORK: "errors.network",
        ErrorCode.TIMEOUT: "errors.timeout",
        ErrorCode.SERVER_ERROR: "errors.serverError",
        ErrorCode.UNAUTHORIZED: "errors.unauthorized",
        ErrorCode.FORBIDDEN: "errors.forbidden",
        ErrorCode.SESSION_EXPIRED: "auth.errors.sessionExpired",
        ErrorCode.LICENSE_REQUIRED: "license.errors.required",
        ErrorCode.LICENSE_INVALID: "license.errors.invalidFormat",
        ErrorCode.LICENSE_EXPIRED: "license.errors.expired",
        ErrorCode.FEATURE_LOCKED: "feature.locked",
        ErrorCode.LIMIT_EXCEEDED: "feature.limitReached",
        ErrorCode.FILE_NOT_FOUND: "file.errors.notFound",
        ErrorCode.FILE_ACCESS_DENIED: "file.errors.accessDenied",
        ErrorCode.FILE_TOO_LARGE: "file.errors.tooLarge",
        ErrorCode.FILE_INVALID_TYPE: "file.errors.invalidType",
        ErrorCode.FILE_CORRUPTED: "file.errors.corrupted",
        ErrorCode.DATA_INVALID: "errors.dataInvalid",
        ErrorCode.DATA_CONFLICT: "errors.dataConflict",
        ErrorCode.DATA_IMPORT_FAILED: "file.errors.uploadFailed",
        ErrorCode.DATA_EXPORT_FAILED: "file.errors.downloadFailed",
    }
    return key_map.get(code, "errors.unknown")


def is_retryable(error: InsightError) -> bool:
    """エラーがリトライ可能かどうか"""
    retryable_codes = {
        ErrorCode.NETWORK,
        ErrorCode.TIMEOUT,
        ErrorCode.SERVER_ERROR,
    }
    return error.code in retryable_codes


__all__ = [
    "ErrorCode",
    "InsightError",
    "LicenseError",
    "ValidationError",
    "NetworkError",
    "FileError",
    "to_insight_error",
    "get_error_message_key",
    "is_retryable",
]
