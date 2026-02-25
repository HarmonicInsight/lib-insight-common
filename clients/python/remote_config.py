"""
HARMONIC insight — リモートコンフィグ クライアント (Python / CustomTkinter)

============================================================================
【使い方】
============================================================================

    from remote_config import RemoteConfigClient

    # 1. 初期化
    client = RemoteConfigClient(
        product_code="INMV",
        app_version="1.0.0",
        build_number=1,
        license_key=stored_license_key,
        device_id=get_or_create_device_id(),
        plan="STD",
    )
    client.initialize()

    # 2. API キー取得
    claude_key = client.get_api_key("claude")
    syncfusion_key = client.get_api_key("syncfusion")

    # 3. 更新チェック
    update = client.get_update_check()
    if update and update.get("forceUpdate"):
        show_force_update_dialog(update)

    # 4. フィーチャーフラグ
    if client.is_feature_enabled("new_editor"):
        enable_new_editor()

    # 5. モデルレジストリ
    models = client.get_model_registry()

    # 6. クリーンアップ（アプリ終了時）
    client.dispose()

【依存】
- requests (HTTP)
- keyring (セキュアストレージ — 任意)

【対象製品】
- INMV (InsightMovie) — Python + CustomTkinter + PyInstaller
- INIG (InsightImageGen) — Python + CustomTkinter + PyInstaller
============================================================================
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import platform
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

import requests

logger = logging.getLogger("harmonic.remote_config")

# =============================================================================
# 定数
# =============================================================================

BASE_URL = "https://license.harmonicinsight.com"
CONFIG_ENDPOINT = "/api/v1/remote-config/config"

DEFAULT_POLLING_INTERVAL_S = 4 * 60 * 60  # 4時間
INITIAL_DELAY_S = 5  # 5秒
ERROR_RETRY_INTERVAL_S = 15 * 60  # 15分
MAX_CONSECUTIVE_ERRORS = 5
CACHE_VERSION = 1

TTL_UPDATE_CHECK = 4 * 60 * 60  # 秒
TTL_API_KEYS = 24 * 60 * 60
TTL_MODEL_REGISTRY = 4 * 60 * 60
TTL_FEATURE_FLAGS = 1 * 60 * 60


# =============================================================================
# デバイスID ヘルパー
# =============================================================================

def get_or_create_device_id(product_code: str = "shared") -> str:
    """デバイスIDを取得（なければ生成して保存）"""
    cache_dir = _get_cache_dir(product_code)
    device_id_path = cache_dir / "device-id"

    if device_id_path.exists():
        existing = device_id_path.read_text().strip()
        if existing:
            return existing

    device_id = _generate_device_id()
    cache_dir.mkdir(parents=True, exist_ok=True)
    device_id_path.write_text(device_id)
    return device_id


def _generate_device_id() -> str:
    """マシン固有のデバイスIDを生成"""
    parts = [
        platform.node(),  # hostname
        platform.machine(),
        platform.processor(),
        os.getlogin() if hasattr(os, "getlogin") else "",
    ]
    raw = ":".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cache_dir(product_code: str) -> Path:
    """プラットフォームに応じたキャッシュディレクトリ"""
    if platform.system() == "Windows":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    elif platform.system() == "Darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    return base / "HarmonicInsight" / product_code


# =============================================================================
# メインクライアント
# =============================================================================

class RemoteConfigClient:
    """
    リモートコンフィグクライアント

    アプリ起動時に initialize() を呼び出すと、
    バックグラウンドスレッドで定期ポーリングを開始する。
    """

    def __init__(
        self,
        product_code: str,
        app_version: str,
        build_number: int,
        license_key: str,
        device_id: str,
        plan: str = "STD",
        user_id: str | None = None,
        locale: str = "ja",
        base_url: str = BASE_URL,
    ):
        self._product_code = product_code
        self._app_version = app_version
        self._build_number = build_number
        self._license_key = license_key
        self._device_id = device_id
        self._plan = plan
        self._user_id = user_id or ""
        self._locale = locale
        self._base_url = base_url

        self._cache_dir = _get_cache_dir(product_code)
        self._cache_path = self._cache_dir / "remote-config-cache.json"

        self._session = requests.Session()
        self._session.headers.update({
            "Content-Type": "application/json",
            "X-License-Key": license_key,
            "X-Device-Id": device_id,
            "X-Product-Code": product_code,
            "X-App-Version": app_version,
        })

        self._last_response: dict[str, Any] | None = None
        self._cache: dict[str, Any] = {"cacheVersion": CACHE_VERSION, "lastUpdated": ""}
        self._last_etag: str | None = None
        self._last_model_registry_version: int | None = None
        self._consecutive_errors = 0
        self._poll_thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

        # コールバック
        self.on_update_available: Callable[[dict], None] | None = None
        self.on_api_key_rotated: Callable[[str, str], None] | None = None
        self.on_config_fetched: Callable[[dict], None] | None = None
        self.on_error: Callable[[Exception], None] | None = None

    # =========================================================================
    # 初期化
    # =========================================================================

    def initialize(self) -> None:
        """サービスを初期化（起動時に1回呼ぶ）"""
        self._load_cache()

        # バックグラウンドポーリング開始
        self._poll_thread = threading.Thread(
            target=self._polling_loop,
            daemon=True,
            name=f"RemoteConfig-{self._product_code}",
        )
        self._poll_thread.start()

    # =========================================================================
    # パブリック API
    # =========================================================================

    def get_update_check(self) -> dict[str, Any] | None:
        """更新チェック結果を取得"""
        with self._lock:
            if self._last_response:
                return self._last_response.get("updateCheck")
            cached = self._cache.get("updateCheck")
            if cached and self._is_cache_valid(cached):
                return cached.get("data")
            return None

    def get_api_key(self, provider: str) -> str | None:
        """API キーを取得（復号済み）"""
        with self._lock:
            # メモリから
            if self._last_response:
                for key in self._last_response.get("apiKeys", []):
                    if key.get("provider") == provider:
                        return self._decrypt_api_key(key)

            # キャッシュから
            cached_keys = self._cache.get("apiKeys", {})
            cached = cached_keys.get(provider)
            if cached and self._is_cache_valid(cached) and cached.get("data"):
                return self._decrypt_api_key(cached["data"])

            return None

    def get_model_registry(self) -> list[dict[str, Any]] | None:
        """モデルレジストリを取得"""
        with self._lock:
            if self._last_response and self._last_response.get("modelRegistry"):
                return self._last_response["modelRegistry"].get("models")
            cached = self._cache.get("modelRegistry")
            if cached and self._is_cache_valid(cached) and cached.get("data"):
                return cached["data"].get("models")
            return None

    def is_feature_enabled(self, flag_key: str) -> bool:
        """フィーチャーフラグの判定"""
        with self._lock:
            flags = None
            if self._last_response:
                ff = self._last_response.get("featureFlags")
                if ff:
                    flags = ff.get("flags")
            if flags is None:
                cached = self._cache.get("featureFlags")
                if cached and cached.get("data"):
                    flags = cached["data"].get("flags")
            if not flags:
                return False

            for flag in flags:
                if flag.get("key") == flag_key:
                    return self._evaluate_flag(flag)
            return False

    def get_feature_flags(self) -> list[dict[str, Any]] | None:
        """全フィーチャーフラグを取得"""
        with self._lock:
            if self._last_response:
                ff = self._last_response.get("featureFlags")
                if ff:
                    return ff.get("flags")
            cached = self._cache.get("featureFlags")
            if cached and cached.get("data"):
                return cached["data"].get("flags")
            return None

    def get_last_response(self) -> dict[str, Any] | None:
        """最新レスポンス全体"""
        with self._lock:
            return self._last_response

    # =========================================================================
    # サーバー通信
    # =========================================================================

    def fetch_config(self) -> dict[str, Any] | None:
        """サーバーからコンフィグを取得"""
        try:
            body = {
                "productCode": self._product_code,
                "appVersion": self._app_version,
                "buildNumber": self._build_number,
                "platform": "python",
                "licenseKey": self._license_key,
                "deviceId": self._device_id,
                "plan": self._plan,
                "userId": self._user_id or None,
                "locale": self._locale,
                "ifNoneMatch": self._last_etag,
                "lastModelRegistryVersion": self._last_model_registry_version,
            }

            resp = self._session.post(
                f"{self._base_url}{CONFIG_ENDPOINT}",
                json=body,
                timeout=30,
            )

            # 304 Not Modified
            if resp.status_code == 304:
                self._consecutive_errors = 0
                return self._last_response

            resp.raise_for_status()
            config = resp.json()

            with self._lock:
                self._last_response = config
                self._last_etag = config.get("etag")
                model_registry = config.get("modelRegistry")
                if model_registry:
                    self._last_model_registry_version = model_registry.get("registryVersion")

                self._update_cache(config)
                self._save_cache()

            self._consecutive_errors = 0

            # コールバック
            if self.on_config_fetched:
                self.on_config_fetched(config)

            update_check = config.get("updateCheck", {})
            if update_check.get("updateAvailable") and self.on_update_available:
                self.on_update_available(update_check)

            return config

        except Exception as e:
            self._consecutive_errors += 1
            logger.warning("Remote config fetch failed (%d): %s", self._consecutive_errors, e)
            if self.on_error:
                self.on_error(e)
            return self._last_response

    # =========================================================================
    # ポーリング
    # =========================================================================

    def _polling_loop(self) -> None:
        """バックグラウンドポーリングループ"""
        # 初回遅延
        if self._stop_event.wait(INITIAL_DELAY_S):
            return

        while not self._stop_event.is_set():
            self.fetch_config()

            # ポーリング間隔決定
            if self._consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                interval = ERROR_RETRY_INTERVAL_S * 2
            elif self._consecutive_errors > 1:
                interval = ERROR_RETRY_INTERVAL_S
            else:
                interval = DEFAULT_POLLING_INTERVAL_S

            if self._stop_event.wait(interval):
                return

    # =========================================================================
    # キャッシュ
    # =========================================================================

    def _load_cache(self) -> None:
        """ローカルキャッシュ読み込み"""
        try:
            if self._cache_path.exists():
                data = json.loads(self._cache_path.read_text(encoding="utf-8"))
                if data.get("cacheVersion") == CACHE_VERSION:
                    self._cache = data
        except Exception:
            self._cache = {"cacheVersion": CACHE_VERSION, "lastUpdated": ""}

    def _save_cache(self) -> None:
        """ローカルキャッシュ保存（アトミック書き込み）"""
        try:
            self._cache["lastUpdated"] = _iso_now()
            self._cache_dir.mkdir(parents=True, exist_ok=True)
            tmp_path = self._cache_path.with_suffix(".tmp")
            tmp_path.write_text(json.dumps(self._cache, ensure_ascii=False), encoding="utf-8")
            tmp_path.replace(self._cache_path)
        except Exception:
            pass

    def _update_cache(self, config: dict[str, Any]) -> None:
        """キャッシュを更新"""
        now = _iso_now()

        self._cache["updateCheck"] = {
            "data": config.get("updateCheck"),
            "fetchedAt": now,
            "etag": config.get("etag"),
            "ttlSeconds": TTL_UPDATE_CHECK,
        }

        ff = config.get("featureFlags")
        if ff:
            self._cache["featureFlags"] = {
                "data": ff,
                "fetchedAt": now,
                "etag": ff.get("etag"),
                "ttlSeconds": TTL_FEATURE_FLAGS,
            }

        mr = config.get("modelRegistry")
        if mr:
            self._cache["modelRegistry"] = {
                "data": mr,
                "fetchedAt": now,
                "etag": mr.get("etag"),
                "ttlSeconds": TTL_MODEL_REGISTRY,
            }

        if "apiKeys" not in self._cache:
            self._cache["apiKeys"] = {}
        for key in config.get("apiKeys", []):
            self._cache["apiKeys"][key["provider"]] = {
                "data": key,
                "fetchedAt": now,
                "ttlSeconds": TTL_API_KEYS,
            }

    @staticmethod
    def _is_cache_valid(entry: dict[str, Any] | None) -> bool:
        """キャッシュエントリの有効性チェック"""
        if not entry or not entry.get("data") or not entry.get("fetchedAt"):
            return False
        try:
            from datetime import datetime, timezone
            fetched_at = datetime.fromisoformat(entry["fetchedAt"].replace("Z", "+00:00"))
            elapsed = (datetime.now(timezone.utc) - fetched_at).total_seconds()
            return elapsed < entry.get("ttlSeconds", 0)
        except Exception:
            return False

    # =========================================================================
    # API キー復号
    # =========================================================================

    def _decrypt_api_key(self, key_response: dict[str, Any]) -> str:
        """API キーの復号"""
        if not key_response.get("encrypted"):
            return key_response.get("key", "")

        # AES-256-GCM 復号
        # 復号キーは licenseKey + deviceId から HKDF で派生
        try:
            import hmac
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
            from cryptography.hazmat.primitives.kdf.hkdf import HKDF
            from cryptography.hazmat.primitives import hashes
            import base64

            ikm = f"{self._license_key}:{self._device_id}".encode()
            salt = b"harmonic-insight-remote-config-v1"
            info = b"api-key-encryption"

            hkdf = HKDF(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                info=info,
            )
            derived_key = hkdf.derive(ikm)

            enc = key_response.get("encryption", {})
            iv = base64.b64decode(enc.get("iv", ""))
            auth_tag = base64.b64decode(enc.get("authTag", ""))
            cipher_text = base64.b64decode(key_response["key"])

            aesgcm = AESGCM(derived_key)
            # AES-GCM: ciphertext + auth_tag を結合
            plain = aesgcm.decrypt(iv, cipher_text + auth_tag, None)
            return plain.decode()

        except ImportError:
            logger.warning("cryptography パッケージが必要です: pip install cryptography")
            return key_response.get("key", "")
        except Exception as e:
            logger.warning("API キー復号失敗: %s", e)
            return ""

    # =========================================================================
    # フィーチャーフラグ評価
    # =========================================================================

    def _evaluate_flag(self, flag: dict[str, Any]) -> bool:
        """フィーチャーフラグを評価"""
        from datetime import datetime, timezone

        # 期限切れ
        expires_at = flag.get("expiresAt")
        if expires_at:
            try:
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if exp < datetime.now(timezone.utc):
                    return False
            except Exception:
                pass

        # 製品チェック
        products = flag.get("products", [])
        if products and self._product_code not in products:
            return False

        # 最小バージョン
        min_ver = flag.get("minimumAppVersion")
        if min_ver and _compare_versions(self._app_version, min_ver) < 0:
            return False

        strategy = flag.get("strategy", "none")

        if strategy == "all":
            return True
        if strategy == "none":
            return False
        if strategy == "percentage":
            if not self._user_id or flag.get("rolloutPercentage") is None:
                return False
            return _hash_to_percentage(self._user_id) < flag["rolloutPercentage"]
        if strategy == "allowlist":
            return self._user_id in (flag.get("allowedUserIds") or [])
        if strategy == "plan_based":
            return self._plan in (flag.get("allowedPlans") or [])

        return False

    # =========================================================================
    # Dispose
    # =========================================================================

    def dispose(self) -> None:
        """クリーンアップ（アプリ終了時に呼ぶ）"""
        self._stop_event.set()
        if self._poll_thread and self._poll_thread.is_alive():
            self._poll_thread.join(timeout=2)
        self._session.close()


# =============================================================================
# ユーティリティ
# =============================================================================

def _compare_versions(a: str, b: str) -> int:
    """セマンティックバージョン比較"""
    parts_a = [int(x) for x in a.split(".")]
    parts_b = [int(x) for x in b.split(".")]
    max_len = max(len(parts_a), len(parts_b))

    for i in range(max_len):
        num_a = parts_a[i] if i < len(parts_a) else 0
        num_b = parts_b[i] if i < len(parts_b) else 0
        if num_a != num_b:
            return num_a - num_b
    return 0


def _hash_to_percentage(user_id: str) -> int:
    """FNV-1a ハッシュ → 0-99"""
    h = 2166136261
    for c in user_id:
        h ^= ord(c)
        h = (h * 16777619) & 0xFFFFFFFF
    return h % 100


def _iso_now() -> str:
    """現在時刻を ISO 8601 で返す"""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
