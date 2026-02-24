"""
HARMONIC insight 窶・繝ｪ繝｢繝ｼ繝医さ繝ｳ繝輔ぅ繧ｰ 繧ｯ繝ｩ繧､繧｢繝ｳ繝・(Python / CustomTkinter)

============================================================================
縲蝉ｽｿ縺・婿縲・
============================================================================

    from remote_config import RemoteConfigClient

    # 1. 蛻晄悄蛹・
    client = RemoteConfigClient(
        product_code="INMV",
        app_version="1.0.0",
        build_number=1,
        license_key=stored_license_key,
        device_id=get_or_create_device_id(),
        plan="STD",
    )
    client.initialize()

    # 2. API 繧ｭ繝ｼ蜿門ｾ・
    claude_key = client.get_api_key("claude")
    syncfusion_key = client.get_api_key("syncfusion")

    # 3. 譖ｴ譁ｰ繝√ぉ繝・け
    update = client.get_update_check()
    if update and update.get("forceUpdate"):
        show_force_update_dialog(update)

    # 4. 繝輔ぅ繝ｼ繝√Ε繝ｼ繝輔Λ繧ｰ
    if client.is_feature_enabled("new_editor"):
        enable_new_editor()

    # 5. 繝｢繝・Ν繝ｬ繧ｸ繧ｹ繝医Μ
    models = client.get_model_registry()

    # 6. 繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・・医い繝励Μ邨ゆｺ・凾・・
    client.dispose()

縲蝉ｾ晏ｭ倥・
- requests (HTTP)
- keyring (繧ｻ繧ｭ繝･繧｢繧ｹ繝医Ξ繝ｼ繧ｸ 窶・莉ｻ諢・

縲仙ｯｾ雎｡陬ｽ蜩√・
- INMV (InsightCast) 窶・Python + CustomTkinter + PyInstaller
- INIG (InsightImageGen) 窶・Python + CustomTkinter + PyInstaller
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
# 螳壽焚
# =============================================================================

BASE_URL = "https://license.harmonicinsight.com"
CONFIG_ENDPOINT = "/api/v1/remote-config/config"

DEFAULT_POLLING_INTERVAL_S = 4 * 60 * 60  # 4譎る俣
INITIAL_DELAY_S = 5  # 5遘・
ERROR_RETRY_INTERVAL_S = 15 * 60  # 15蛻・
MAX_CONSECUTIVE_ERRORS = 5
CACHE_VERSION = 1

TTL_UPDATE_CHECK = 4 * 60 * 60  # 遘・
TTL_API_KEYS = 24 * 60 * 60
TTL_MODEL_REGISTRY = 4 * 60 * 60
TTL_FEATURE_FLAGS = 1 * 60 * 60


# =============================================================================
# 繝・ヰ繧､繧ｹID 繝倥Ν繝代・
# =============================================================================

def get_or_create_device_id(product_code: str = "shared") -> str:
    """繝・ヰ繧､繧ｹID繧貞叙蠕暦ｼ医↑縺代ｌ縺ｰ逕滓・縺励※菫晏ｭ假ｼ・""
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
    """繝槭す繝ｳ蝗ｺ譛峨・繝・ヰ繧､繧ｹID繧堤函謌・""
    parts = [
        platform.node(),  # hostname
        platform.machine(),
        platform.processor(),
        os.getlogin() if hasattr(os, "getlogin") else "",
    ]
    raw = ":".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def _get_cache_dir(product_code: str) -> Path:
    """繝励Λ繝・ヨ繝輔か繝ｼ繝縺ｫ蠢懊§縺溘く繝｣繝・す繝･繝・ぅ繝ｬ繧ｯ繝医Μ"""
    if platform.system() == "Windows":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    elif platform.system() == "Darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    return base / "HarmonicInsight" / product_code


# =============================================================================
# 繝｡繧､繝ｳ繧ｯ繝ｩ繧､繧｢繝ｳ繝・
# =============================================================================

class RemoteConfigClient:
    """
    繝ｪ繝｢繝ｼ繝医さ繝ｳ繝輔ぅ繧ｰ繧ｯ繝ｩ繧､繧｢繝ｳ繝・

    繧｢繝励Μ襍ｷ蜍墓凾縺ｫ initialize() 繧貞他縺ｳ蜃ｺ縺吶→縲・
    繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝峨せ繝ｬ繝・ラ縺ｧ螳壽悄繝昴・繝ｪ繝ｳ繧ｰ繧帝幕蟋九☆繧九・
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

        # 繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ
        self.on_update_available: Callable[[dict], None] | None = None
        self.on_api_key_rotated: Callable[[str, str], None] | None = None
        self.on_config_fetched: Callable[[dict], None] | None = None
        self.on_error: Callable[[Exception], None] | None = None

    # =========================================================================
    # 蛻晄悄蛹・
    # =========================================================================

    def initialize(self) -> None:
        """繧ｵ繝ｼ繝薙せ繧貞・譛溷喧・郁ｵｷ蜍墓凾縺ｫ1蝗槫他縺ｶ・・""
        self._load_cache()

        # 繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝峨・繝ｼ繝ｪ繝ｳ繧ｰ髢句ｧ・
        self._poll_thread = threading.Thread(
            target=self._polling_loop,
            daemon=True,
            name=f"RemoteConfig-{self._product_code}",
        )
        self._poll_thread.start()

    # =========================================================================
    # 繝代ヶ繝ｪ繝・け API
    # =========================================================================

    def get_update_check(self) -> dict[str, Any] | None:
        """譖ｴ譁ｰ繝√ぉ繝・け邨先棡繧貞叙蠕・""
        with self._lock:
            if self._last_response:
                return self._last_response.get("updateCheck")
            cached = self._cache.get("updateCheck")
            if cached and self._is_cache_valid(cached):
                return cached.get("data")
            return None

    def get_api_key(self, provider: str) -> str | None:
        """API 繧ｭ繝ｼ繧貞叙蠕暦ｼ亥ｾｩ蜿ｷ貂医∩・・""
        with self._lock:
            # 繝｡繝｢繝ｪ縺九ｉ
            if self._last_response:
                for key in self._last_response.get("apiKeys", []):
                    if key.get("provider") == provider:
                        return self._decrypt_api_key(key)

            # 繧ｭ繝｣繝・す繝･縺九ｉ
            cached_keys = self._cache.get("apiKeys", {})
            cached = cached_keys.get(provider)
            if cached and self._is_cache_valid(cached) and cached.get("data"):
                return self._decrypt_api_key(cached["data"])

            return None

    def get_model_registry(self) -> list[dict[str, Any]] | None:
        """繝｢繝・Ν繝ｬ繧ｸ繧ｹ繝医Μ繧貞叙蠕・""
        with self._lock:
            if self._last_response and self._last_response.get("modelRegistry"):
                return self._last_response["modelRegistry"].get("models")
            cached = self._cache.get("modelRegistry")
            if cached and self._is_cache_valid(cached) and cached.get("data"):
                return cached["data"].get("models")
            return None

    def is_feature_enabled(self, flag_key: str) -> bool:
        """繝輔ぅ繝ｼ繝√Ε繝ｼ繝輔Λ繧ｰ縺ｮ蛻､螳・""
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
        """蜈ｨ繝輔ぅ繝ｼ繝√Ε繝ｼ繝輔Λ繧ｰ繧貞叙蠕・""
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
        """譛譁ｰ繝ｬ繧ｹ繝昴Φ繧ｹ蜈ｨ菴・""
        with self._lock:
            return self._last_response

    # =========================================================================
    # 繧ｵ繝ｼ繝舌・騾壻ｿ｡
    # =========================================================================

    def fetch_config(self) -> dict[str, Any] | None:
        """繧ｵ繝ｼ繝舌・縺九ｉ繧ｳ繝ｳ繝輔ぅ繧ｰ繧貞叙蠕・""
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

            # 繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ
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
    # 繝昴・繝ｪ繝ｳ繧ｰ
    # =========================================================================

    def _polling_loop(self) -> None:
        """繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝峨・繝ｼ繝ｪ繝ｳ繧ｰ繝ｫ繝ｼ繝・""
        # 蛻晏屓驕・ｻｶ
        if self._stop_event.wait(INITIAL_DELAY_S):
            return

        while not self._stop_event.is_set():
            self.fetch_config()

            # 繝昴・繝ｪ繝ｳ繧ｰ髢馴囈豎ｺ螳・
            if self._consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                interval = ERROR_RETRY_INTERVAL_S * 2
            elif self._consecutive_errors > 1:
                interval = ERROR_RETRY_INTERVAL_S
            else:
                interval = DEFAULT_POLLING_INTERVAL_S

            if self._stop_event.wait(interval):
                return

    # =========================================================================
    # 繧ｭ繝｣繝・す繝･
    # =========================================================================

    def _load_cache(self) -> None:
        """繝ｭ繝ｼ繧ｫ繝ｫ繧ｭ繝｣繝・す繝･隱ｭ縺ｿ霎ｼ縺ｿ"""
        try:
            if self._cache_path.exists():
                data = json.loads(self._cache_path.read_text(encoding="utf-8"))
                if data.get("cacheVersion") == CACHE_VERSION:
                    self._cache = data
        except Exception:
            self._cache = {"cacheVersion": CACHE_VERSION, "lastUpdated": ""}

    def _save_cache(self) -> None:
        """繝ｭ繝ｼ繧ｫ繝ｫ繧ｭ繝｣繝・す繝･菫晏ｭ假ｼ医い繝医Α繝・け譖ｸ縺崎ｾｼ縺ｿ・・""
        try:
            self._cache["lastUpdated"] = _iso_now()
            self._cache_dir.mkdir(parents=True, exist_ok=True)
            tmp_path = self._cache_path.with_suffix(".tmp")
            tmp_path.write_text(json.dumps(self._cache, ensure_ascii=False), encoding="utf-8")
            tmp_path.replace(self._cache_path)
        except Exception:
            pass

    def _update_cache(self, config: dict[str, Any]) -> None:
        """繧ｭ繝｣繝・す繝･繧呈峩譁ｰ"""
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
        """繧ｭ繝｣繝・す繝･繧ｨ繝ｳ繝医Μ縺ｮ譛牙柑諤ｧ繝√ぉ繝・け"""
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
    # API 繧ｭ繝ｼ蠕ｩ蜿ｷ
    # =========================================================================

    def _decrypt_api_key(self, key_response: dict[str, Any]) -> str:
        """API 繧ｭ繝ｼ縺ｮ蠕ｩ蜿ｷ"""
        if not key_response.get("encrypted"):
            return key_response.get("key", "")

        # AES-256-GCM 蠕ｩ蜿ｷ
        # 蠕ｩ蜿ｷ繧ｭ繝ｼ縺ｯ licenseKey + deviceId 縺九ｉ HKDF 縺ｧ豢ｾ逕・
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
            # AES-GCM: ciphertext + auth_tag 繧堤ｵ仙粋
            plain = aesgcm.decrypt(iv, cipher_text + auth_tag, None)
            return plain.decode()

        except ImportError:
            logger.warning("cryptography 繝代ャ繧ｱ繝ｼ繧ｸ縺悟ｿ・ｦ√〒縺・ pip install cryptography")
            return key_response.get("key", "")
        except Exception as e:
            logger.warning("API 繧ｭ繝ｼ蠕ｩ蜿ｷ螟ｱ謨・ %s", e)
            return ""

    # =========================================================================
    # 繝輔ぅ繝ｼ繝√Ε繝ｼ繝輔Λ繧ｰ隧穂ｾ｡
    # =========================================================================

    def _evaluate_flag(self, flag: dict[str, Any]) -> bool:
        """繝輔ぅ繝ｼ繝√Ε繝ｼ繝輔Λ繧ｰ繧定ｩ穂ｾ｡"""
        from datetime import datetime, timezone

        # 譛滄剞蛻・ｌ
        expires_at = flag.get("expiresAt")
        if expires_at:
            try:
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if exp < datetime.now(timezone.utc):
                    return False
            except Exception:
                pass

        # 陬ｽ蜩√メ繧ｧ繝・け
        products = flag.get("products", [])
        if products and self._product_code not in products:
            return False

        # 譛蟆上ヰ繝ｼ繧ｸ繝ｧ繝ｳ
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
        """繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・・医い繝励Μ邨ゆｺ・凾縺ｫ蜻ｼ縺ｶ・・""
        self._stop_event.set()
        if self._poll_thread and self._poll_thread.is_alive():
            self._poll_thread.join(timeout=2)
        self._session.close()


# =============================================================================
# 繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ
# =============================================================================

def _compare_versions(a: str, b: str) -> int:
    """繧ｻ繝槭Φ繝・ぅ繝・け繝舌・繧ｸ繝ｧ繝ｳ豈碑ｼ・""
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
    """FNV-1a 繝上ャ繧ｷ繝･ 竊・0-99"""
    h = 2166136261
    for c in user_id:
        h ^= ord(c)
        h = (h * 16777619) & 0xFFFFFFFF
    return h % 100


def _iso_now() -> str:
    """迴ｾ蝨ｨ譎ょ綾繧・ISO 8601 縺ｧ霑斐☆"""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
