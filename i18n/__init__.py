"""
Insight Series i18n - Python
多言語サポートヘルパー
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

# 翻訳ファイルのパス
_I18N_DIR = Path(__file__).parent

# 利用可能なロケール
LOCALES = {
    'ja': {'name': 'Japanese', 'native_name': '日本語'},
    'en': {'name': 'English', 'native_name': 'English'},
}

# 翻訳データのキャッシュ
_translations: Dict[str, Dict[str, Any]] = {}

# 現在のロケール
_current_locale = 'ja'


def _load_translations(locale: str) -> Dict[str, Any]:
    """翻訳ファイルを読み込む"""
    if locale in _translations:
        return _translations[locale]

    file_path = _I18N_DIR / f'{locale}.json'
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            _translations[locale] = json.load(f)
            return _translations[locale]

    return {}


def set_locale(locale: str) -> None:
    """現在のロケールを設定"""
    global _current_locale
    if locale in LOCALES:
        _current_locale = locale
        _load_translations(locale)


def get_locale() -> str:
    """現在のロケールを取得"""
    return _current_locale


def detect_locale() -> str:
    """システムロケールを検出"""
    import locale as sys_locale
    try:
        lang, _ = sys_locale.getdefaultlocale()
        if lang:
            lang_code = lang.split('_')[0]
            if lang_code in LOCALES:
                return lang_code
    except Exception:
        pass
    return 'ja'  # デフォルト


def t(key: str, params: Optional[Dict[str, Any]] = None) -> str:
    """
    翻訳を取得

    Args:
        key: ドット区切りのキー (例: "license.title")
        params: 置換パラメータ (例: {"days": 14})

    Returns:
        翻訳されたテキスト
    """
    translations = _load_translations(_current_locale)
    keys = key.split('.')
    value: Any = translations

    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            # フォールバック: 英語を試す
            value = _load_translations('en')
            for fallback_key in keys:
                if isinstance(value, dict) and fallback_key in value:
                    value = value[fallback_key]
                else:
                    return key  # キーが見つからない場合はキー自体を返す
            break

    if not isinstance(value, str):
        return key

    # パラメータ置換 (例: {days} → 14)
    if params:
        for name, val in params.items():
            value = value.replace(f'{{{name}}}', str(val))

    return value


def get_translations(locale: Optional[str] = None) -> Dict[str, Any]:
    """翻訳オブジェクトを取得"""
    return _load_translations(locale or _current_locale)


# 初期化
_load_translations(_current_locale)


__all__ = [
    't',
    'set_locale',
    'get_locale',
    'detect_locale',
    'get_translations',
    'LOCALES',
]
