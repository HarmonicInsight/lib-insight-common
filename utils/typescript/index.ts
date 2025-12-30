/**
 * Insight Series 共通ユーティリティ - TypeScript
 */

// ============== 日付フォーマット ==============

/**
 * 日付をフォーマット
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'iso' = 'short',
  locale: 'ja' | 'en' = 'ja'
): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  switch (format) {
    case 'long':
      return locale === 'ja'
        ? `${year}年${month}月${day}日`
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'iso':
      return d.toISOString().split('T')[0];
    case 'short':
    default:
      return locale === 'ja'
        ? `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        : `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
  }
}

/**
 * 相対的な日付表現
 */
export function formatRelativeDate(
  date: Date | string,
  locale: 'ja' | 'en' = 'ja'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === 'ja' ? '今日' : 'Today';
  if (diffDays === 1) return locale === 'ja' ? '昨日' : 'Yesterday';
  if (diffDays === -1) return locale === 'ja' ? '明日' : 'Tomorrow';
  if (diffDays > 0 && diffDays < 7) return locale === 'ja' ? `${diffDays}日前` : `${diffDays} days ago`;
  if (diffDays < 0 && diffDays > -7) return locale === 'ja' ? `${-diffDays}日後` : `in ${-diffDays} days`;

  return formatDate(d, 'short', locale);
}

/**
 * 残り日数を計算
 */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ============== 数値・通貨フォーマット ==============

/**
 * 数値をフォーマット（カンマ区切り）
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '';
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 通貨フォーマット（万円）
 */
export function formatCurrency(
  value: number | null | undefined,
  unit: '円' | '万円' = '万円'
): string {
  if (value == null) return '';
  return `${formatNumber(value)}${unit}`;
}

/**
 * パーセントフォーマット
 */
export function formatPercent(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '';
  return `${formatNumber(value, decimals)}%`;
}

/**
 * ファイルサイズフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============== 文字列操作 ==============

/**
 * 文字列を省略
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 文字列をスネークケースに変換
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * 文字列をキャメルケースに変換
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

/**
 * 文字列をパスカルケースに変換
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// ============== バリデーション ==============

/**
 * メールアドレスの検証
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * URLの検証
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 電話番号の検証（日本）
 */
export function isValidPhoneJP(phone: string): boolean {
  const re = /^0\d{9,10}$/;
  return re.test(phone.replace(/[-\s]/g, ''));
}

// ============== 配列操作 ==============

/**
 * 配列をグループ化
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

/**
 * 配列の重複を除去
 */
export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }
  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 配列をソート（日本語対応）
 */
export function sortByLocale<T>(
  array: T[],
  keyFn: (item: T) => string,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const collator = new Intl.Collator('ja');
  const sorted = [...array].sort((a, b) => collator.compare(keyFn(a), keyFn(b)));
  return order === 'desc' ? sorted.reverse() : sorted;
}

// ============== その他 ==============

/**
 * 遅延実行
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * デバウンス
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * スロットル
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * ランダムID生成
 */
export function generateId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * ディープクローン
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 空値チェック
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
