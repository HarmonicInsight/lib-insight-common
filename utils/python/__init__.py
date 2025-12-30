"""
Insight Series 共通ユーティリティ - Python
"""

import re
import json
import unicodedata
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
from functools import wraps
import time
import uuid

T = TypeVar('T')


# ============== 日付フォーマット ==============

def format_date(
    date: Optional[Union[datetime, str]],
    format: str = 'short',
    locale: str = 'ja'
) -> str:
    """日付をフォーマット"""
    if not date:
        return ''

    if isinstance(date, str):
        try:
            date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        except ValueError:
            return ''

    if format == 'long':
        if locale == 'ja':
            return f"{date.year}年{date.month}月{date.day}日"
        else:
            return date.strftime('%B %d, %Y')
    elif format == 'iso':
        return date.strftime('%Y-%m-%d')
    else:  # short
        if locale == 'ja':
            return date.strftime('%Y/%m/%d')
        else:
            return date.strftime('%m/%d/%Y')


def format_relative_date(
    date: Union[datetime, str],
    locale: str = 'ja'
) -> str:
    """相対的な日付表現"""
    if isinstance(date, str):
        date = datetime.fromisoformat(date.replace('Z', '+00:00'))

    now = datetime.now(date.tzinfo) if date.tzinfo else datetime.now()
    diff = now.date() - date.date()
    diff_days = diff.days

    if diff_days == 0:
        return '今日' if locale == 'ja' else 'Today'
    if diff_days == 1:
        return '昨日' if locale == 'ja' else 'Yesterday'
    if diff_days == -1:
        return '明日' if locale == 'ja' else 'Tomorrow'
    if 0 < diff_days < 7:
        return f'{diff_days}日前' if locale == 'ja' else f'{diff_days} days ago'
    if -7 < diff_days < 0:
        return f'{-diff_days}日後' if locale == 'ja' else f'in {-diff_days} days'

    return format_date(date, 'short', locale)


def days_until(date: Optional[Union[datetime, str]]) -> Optional[int]:
    """残り日数を計算"""
    if not date:
        return None

    if isinstance(date, str):
        date = datetime.fromisoformat(date.replace('Z', '+00:00'))

    now = datetime.now(date.tzinfo) if date.tzinfo else datetime.now()
    diff = (date.date() - now.date()).days
    return diff


# ============== 数値・通貨フォーマット ==============

def format_number(value: Optional[float], decimals: int = 0) -> str:
    """数値をフォーマット（カンマ区切り）"""
    if value is None:
        return ''
    return f'{value:,.{decimals}f}'


def format_currency(
    value: Optional[float],
    unit: str = '万円'
) -> str:
    """通貨フォーマット"""
    if value is None:
        return ''
    return f'{format_number(value)}{unit}'


def format_percent(value: Optional[float], decimals: int = 0) -> str:
    """パーセントフォーマット"""
    if value is None:
        return ''
    return f'{format_number(value, decimals)}%'


def format_file_size(bytes_size: int) -> str:
    """ファイルサイズフォーマット"""
    if bytes_size == 0:
        return '0 B'

    units = ['B', 'KB', 'MB', 'GB', 'TB']
    k = 1024
    i = 0

    while bytes_size >= k and i < len(units) - 1:
        bytes_size /= k
        i += 1

    return f'{bytes_size:.1f} {units[i]}'


# ============== 文字列操作 ==============

def truncate(s: str, max_length: int, suffix: str = '...') -> str:
    """文字列を省略"""
    if len(s) <= max_length:
        return s
    return s[:max_length - len(suffix)] + suffix


def to_snake_case(s: str) -> str:
    """文字列をスネークケースに変換"""
    s = re.sub(r'([a-z])([A-Z])', r'\1_\2', s)
    s = re.sub(r'[\s\-]+', '_', s)
    return s.lower()


def to_camel_case(s: str) -> str:
    """文字列をキャメルケースに変換"""
    components = re.split(r'[-_\s]+', s)
    return components[0].lower() + ''.join(c.title() for c in components[1:])


def to_pascal_case(s: str) -> str:
    """文字列をパスカルケースに変換"""
    components = re.split(r'[-_\s]+', s)
    return ''.join(c.title() for c in components)


def normalize_japanese(s: str) -> str:
    """日本語文字列を正規化（全角→半角など）"""
    return unicodedata.normalize('NFKC', s)


# ============== バリデーション ==============

def is_valid_email(email: str) -> bool:
    """メールアドレスの検証"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


def is_valid_url(url: str) -> bool:
    """URLの検証"""
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    return bool(re.match(pattern, url))


def is_valid_phone_jp(phone: str) -> bool:
    """電話番号の検証（日本）"""
    phone = re.sub(r'[-\s]', '', phone)
    return bool(re.match(r'^0\d{9,10}$', phone))


# ============== 配列操作 ==============

def group_by(items: List[T], key_fn: Callable[[T], str]) -> Dict[str, List[T]]:
    """配列をグループ化"""
    result: Dict[str, List[T]] = {}
    for item in items:
        key = key_fn(item)
        if key not in result:
            result[key] = []
        result[key].append(item)
    return result


def unique(items: List[T], key_fn: Optional[Callable[[T], Any]] = None) -> List[T]:
    """配列の重複を除去"""
    if key_fn is None:
        seen: set = set()
        result = []
        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)
        return result

    seen_keys: set = set()
    result = []
    for item in items:
        key = key_fn(item)
        if key not in seen_keys:
            seen_keys.add(key)
            result.append(item)
    return result


def sort_by_locale(
    items: List[T],
    key_fn: Callable[[T], str],
    reverse: bool = False
) -> List[T]:
    """配列をソート（日本語対応）"""
    import locale
    try:
        locale.setlocale(locale.LC_COLLATE, 'ja_JP.UTF-8')
    except locale.Error:
        pass
    return sorted(items, key=lambda x: locale.strxfrm(key_fn(x)), reverse=reverse)


# ============== その他 ==============

def sleep(seconds: float) -> None:
    """遅延実行"""
    time.sleep(seconds)


def debounce(wait: float):
    """デバウンスデコレータ"""
    def decorator(fn: Callable):
        last_call = [0.0]

        @wraps(fn)
        def wrapper(*args, **kwargs):
            now = time.time()
            if now - last_call[0] >= wait:
                last_call[0] = now
                return fn(*args, **kwargs)
        return wrapper
    return decorator


def throttle(limit: float):
    """スロットルデコレータ"""
    def decorator(fn: Callable):
        last_call = [0.0]

        @wraps(fn)
        def wrapper(*args, **kwargs):
            now = time.time()
            if now - last_call[0] >= limit:
                last_call[0] = now
                return fn(*args, **kwargs)
        return wrapper
    return decorator


def generate_id(length: int = 8) -> str:
    """ランダムID生成"""
    import string
    import random
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


def generate_uuid() -> str:
    """UUID生成"""
    return str(uuid.uuid4())


def deep_clone(obj: T) -> T:
    """ディープクローン"""
    return json.loads(json.dumps(obj))


def is_empty(value: Any) -> bool:
    """空値チェック"""
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ''
    if isinstance(value, (list, dict)):
        return len(value) == 0
    return False


__all__ = [
    # 日付
    'format_date',
    'format_relative_date',
    'days_until',
    # 数値
    'format_number',
    'format_currency',
    'format_percent',
    'format_file_size',
    # 文字列
    'truncate',
    'to_snake_case',
    'to_camel_case',
    'to_pascal_case',
    'normalize_japanese',
    # バリデーション
    'is_valid_email',
    'is_valid_url',
    'is_valid_phone_jp',
    # 配列
    'group_by',
    'unique',
    'sort_by_locale',
    # その他
    'sleep',
    'debounce',
    'throttle',
    'generate_id',
    'generate_uuid',
    'deep_clone',
    'is_empty',
]
