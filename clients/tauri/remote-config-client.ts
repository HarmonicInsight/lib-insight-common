/**
 * HARMONIC insight — リモートコンフィグ クライアント (Tauri / TypeScript)
 *
 * ============================================================================
 * 【使い方】
 * ============================================================================
 *
 * ```typescript
 * import { RemoteConfigClient } from '@/insight-common/clients/tauri/remote-config-client';
 *
 * // 1. 初期化（App.tsx の useEffect で）
 * const remoteConfig = new RemoteConfigClient({
 *   productCode: 'INCA',
 *   appVersion: '1.0.0',
 *   buildNumber: 1,
 *   licenseKey: storedLicenseKey,
 *   deviceId: await getDeviceId(),
 *   plan: 'STD',
 * });
 * await remoteConfig.initialize();
 *
 * // 2. API キー取得
 * const claudeKey = remoteConfig.getApiKey('claude');
 *
 * // 3. 更新チェック
 * const update = remoteConfig.getUpdateCheck();
 * if (update?.forceUpdate) showForceUpdateDialog(update);
 *
 * // 4. フィーチャーフラグ
 * if (remoteConfig.isFeatureEnabled('new_ui')) enableNewUI();
 *
 * // 5. モデルレジストリ
 * const models = remoteConfig.getModelRegistry();
 *
 * // 6. クリーンアップ（アンマウント時）
 * remoteConfig.dispose();
 * ```
 *
 * 【Tauri 自動更新との併用】
 *
 * このクライアントは「コンフィグの配信」を担当。
 * アプリバイナリの自動更新は tauri-plugin-updater を使う:
 *
 * ```typescript
 * import { check } from '@tauri-apps/plugin-updater';
 * import { relaunch } from '@tauri-apps/plugin-process';
 *
 * const update = await check();
 * if (update) {
 *   await update.downloadAndInstall();
 *   await relaunch();
 * }
 * ```
 *
 * 【依存】
 * - fetch (標準)
 * - @tauri-apps/plugin-stronghold (暗号化ストレージ — 任意)
 * - @tauri-apps/api/path (ファイルパス)
 * ============================================================================
 */

import type { ProductCode, PlanCode, AppPlatform } from '../../config/products';

// =============================================================================
// 型定義（remote-config.ts と同期）
// =============================================================================

type UpdateUrgency = 'critical' | 'recommended' | 'optional';
type ApiKeyProvider = 'claude' | 'syncfusion' | 'firebase' | 'resend';

interface RemoteReleaseInfo {
  productCode: string;
  latestVersion: string;
  latestBuildNumber: number;
  minimumRequiredVersion: string;
  minimumRequiredBuildNumber: number;
  urgency: UpdateUrgency;
  changelog: { ja: string; en: string };
  releasedAt: string;
  downloadUrl: string;
  installerHash: string;
  installerSize: number;
  autoUpdateManifestUrl?: string;
}

interface UpdateCheckResult {
  updateAvailable: boolean;
  forceUpdate: boolean;
  release?: RemoteReleaseInfo;
  serverTime: string;
  nextCheckAfter: string;
}

interface EncryptionInfo {
  algorithm: string;
  iv: string;
  authTag: string;
}

interface ApiKeyResponse {
  provider: ApiKeyProvider;
  key: string;
  encrypted: boolean;
  encryption?: EncryptionInfo;
  keyVersion: number;
  rotatedAt: string;
  expiresAt?: string;
  nextRotationAt?: string;
}

interface FeatureFlag {
  key: string;
  products: string[];
  strategy: string;
  rolloutPercentage?: number;
  allowedUserIds?: string[];
  allowedPlans?: string[];
  value: boolean | string | number;
  minimumAppVersion?: string;
  description: { ja: string; en: string };
  expiresAt?: string;
  updatedAt: string;
}

interface FeatureFlagsResponse {
  flags: FeatureFlag[];
  etag: string;
}

interface ModelDefinition {
  id: string;
  family: string;
  displayName: string;
  version: string;
  releaseDate: string;
  minimumTier: string;
  inputPer1M: number;
  outputPer1M: number;
  maxContextTokens: number;
  icon: string;
  status: string;
  isDefaultForTier?: string;
  descriptionJa: string;
  descriptionEn: string;
}

interface RemoteModelRegistryResponse {
  models: ModelDefinition[];
  registryVersion: number;
  updatedAt: string;
  etag: string;
}

interface RemoteConfigResponse {
  updateCheck: UpdateCheckResult;
  apiKeys: ApiKeyResponse[];
  modelRegistry?: RemoteModelRegistryResponse;
  featureFlags: FeatureFlagsResponse;
  serverTime: string;
  etag: string;
}

// =============================================================================
// ローカルキャッシュ型
// =============================================================================

interface CacheEntry<T> {
  data: T;
  fetchedAt: string;
  etag?: string;
  ttlSeconds: number;
}

interface LocalCacheFile {
  cacheVersion: number;
  lastUpdated: string;
  updateCheck?: CacheEntry<UpdateCheckResult>;
  modelRegistry?: CacheEntry<RemoteModelRegistryResponse>;
  featureFlags?: CacheEntry<FeatureFlagsResponse>;
  apiKeys?: Record<string, CacheEntry<ApiKeyResponse>>;
}

// =============================================================================
// 設定
// =============================================================================

interface RemoteConfigClientOptions {
  productCode: string;
  appVersion: string;
  buildNumber: number;
  licenseKey: string;
  deviceId: string;
  plan?: string;
  userId?: string;
  locale?: 'ja' | 'en';
  /** カスタムベースURL（テスト用） */
  baseUrl?: string;
}

// =============================================================================
// 定数
// =============================================================================

const BASE_URL = 'https://license.harmonicinsight.com';
const CONFIG_ENDPOINT = '/api/v1/remote-config/config';
const DEFAULT_POLLING_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4時間
const INITIAL_DELAY_MS = 5_000; // 5秒
const ERROR_RETRY_INTERVAL_MS = 15 * 60 * 1000; // 15分
const MAX_CONSECUTIVE_ERRORS = 5;
const CACHE_VERSION = 1;

const TTL = {
  updateCheck: 4 * 60 * 60,
  apiKeys: 24 * 60 * 60,
  modelRegistry: 4 * 60 * 60,
  featureFlags: 1 * 60 * 60,
} as const;

const CACHE_STORAGE_KEY = 'harmonic-remote-config-cache';

// =============================================================================
// メインクライアント
// =============================================================================

export class RemoteConfigClient {
  private readonly opts: Required<Omit<RemoteConfigClientOptions, 'baseUrl'>> & {
    baseUrl: string;
  };

  private lastResponse: RemoteConfigResponse | null = null;
  private cache: LocalCacheFile = { cacheVersion: CACHE_VERSION, lastUpdated: '' };
  private lastEtag: string | undefined;
  private lastModelRegistryVersion: number | undefined;
  private pollTimerId: ReturnType<typeof setInterval> | null = null;
  private consecutiveErrors = 0;
  private disposed = false;
  private decryptedKeyCache = new Map<string, { plainKey: string; keyVersion: number }>();

  // --- イベントリスナー ---
  private listeners = {
    updateAvailable: [] as Array<(result: UpdateCheckResult) => void>,
    apiKeyRotated: [] as Array<(provider: string, key: string) => void>,
    configFetched: [] as Array<(config: RemoteConfigResponse) => void>,
    error: [] as Array<(error: Error) => void>,
  };

  constructor(options: RemoteConfigClientOptions) {
    this.opts = {
      plan: 'STD',
      locale: 'ja',
      baseUrl: BASE_URL,
      ...options,
      userId: options.userId ?? '',
    };
  }

  // =========================================================================
  // 初期化
  // =========================================================================

  /**
   * サービスを初期化（アプリ起動時に1回呼ぶ）
   */
  async initialize(): Promise<void> {
    this.loadCache();

    // 初回フェッチ（5秒後）
    setTimeout(() => {
      if (!this.disposed) this.fetchConfig();
    }, INITIAL_DELAY_MS);

    // ポーリング開始
    this.pollTimerId = setInterval(() => {
      if (!this.disposed) this.fetchConfig();
    }, DEFAULT_POLLING_INTERVAL_MS);
  }

  // =========================================================================
  // パブリック API
  // =========================================================================

  /** 更新チェック結果 */
  getUpdateCheck(): UpdateCheckResult | null {
    if (this.lastResponse) return this.lastResponse.updateCheck;
    if (this.isCacheValid(this.cache.updateCheck)) return this.cache.updateCheck!.data;
    return null;
  }

  /** API キー取得（復号済み） */
  getApiKey(provider: ApiKeyProvider): string | null {
    const key = this.lastResponse?.apiKeys?.find((k) => k.provider === provider);
    if (key) return this.decryptApiKey(key);

    const cached = this.cache.apiKeys?.[provider];
    if (cached && this.isCacheValid(cached) && cached.data)
      return this.decryptApiKey(cached.data);

    return null;
  }

  /** モデルレジストリ */
  getModelRegistry(): ModelDefinition[] | null {
    if (this.lastResponse?.modelRegistry) return this.lastResponse.modelRegistry.models;
    if (this.isCacheValid(this.cache.modelRegistry)) return this.cache.modelRegistry!.data.models;
    return null;
  }

  /** フィーチャーフラグ判定 */
  isFeatureEnabled(flagKey: string): boolean {
    const flags = this.lastResponse?.featureFlags?.flags ?? this.cache.featureFlags?.data?.flags;
    if (!flags) return false;

    const flag = flags.find((f) => f.key === flagKey);
    if (!flag) return false;

    return this.evaluateFlag(flag);
  }

  /** 全フィーチャーフラグ */
  getFeatureFlags(): FeatureFlag[] | null {
    return this.lastResponse?.featureFlags?.flags ?? this.cache.featureFlags?.data?.flags ?? null;
  }

  /** 最新レスポンス全体 */
  getLastResponse(): RemoteConfigResponse | null {
    return this.lastResponse;
  }

  // =========================================================================
  // イベント
  // =========================================================================

  on(event: 'updateAvailable', handler: (result: UpdateCheckResult) => void): void;
  on(event: 'apiKeyRotated', handler: (provider: string, key: string) => void): void;
  on(event: 'configFetched', handler: (config: RemoteConfigResponse) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: string, handler: (...args: unknown[]) => void): void {
    (this.listeners as Record<string, unknown[]>)[event]?.push(handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    const list = (this.listeners as Record<string, unknown[]>)[event];
    if (list) {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const list = (this.listeners as Record<string, Array<(...a: unknown[]) => void>>)[event];
    list?.forEach((fn) => fn(...args));
  }

  // =========================================================================
  // サーバー通信
  // =========================================================================

  async fetchConfig(): Promise<RemoteConfigResponse | null> {
    try {
      const body = {
        productCode: this.opts.productCode,
        appVersion: this.opts.appVersion,
        buildNumber: this.opts.buildNumber,
        platform: 'tauri',
        licenseKey: this.opts.licenseKey,
        deviceId: this.opts.deviceId,
        plan: this.opts.plan,
        userId: this.opts.userId || undefined,
        locale: this.opts.locale,
        ifNoneMatch: this.lastEtag,
        lastModelRegistryVersion: this.lastModelRegistryVersion,
      };

      const resp = await fetch(`${this.opts.baseUrl}${CONFIG_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': this.opts.licenseKey,
          'X-Device-Id': this.opts.deviceId,
          'X-Product-Code': this.opts.productCode,
          'X-App-Version': this.opts.appVersion,
        },
        body: JSON.stringify(body),
      });

      // 304 Not Modified
      if (resp.status === 304) {
        this.consecutiveErrors = 0;
        return this.lastResponse;
      }

      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);

      const config: RemoteConfigResponse = await resp.json();

      this.lastResponse = config;
      this.lastEtag = config.etag;
      if (config.modelRegistry) {
        this.lastModelRegistryVersion = config.modelRegistry.registryVersion;
      }

      this.updateCache(config);
      this.saveCache();

      this.consecutiveErrors = 0;
      this.resetPollingInterval();

      // 暗号化キーを事前復号（バックグラウンド）
      for (const key of config.apiKeys) {
        if (key.encrypted) this.decryptApiKeyAsync(key).catch(() => {});
      }

      this.emit('configFetched', config);
      if (config.updateCheck.updateAvailable) {
        this.emit('updateAvailable', config.updateCheck);
      }

      return config;
    } catch (err) {
      this.consecutiveErrors++;
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('error', error);

      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        this.setPollingInterval(ERROR_RETRY_INTERVAL_MS * 2);
      } else if (this.consecutiveErrors > 1) {
        this.setPollingInterval(ERROR_RETRY_INTERVAL_MS);
      }

      return this.lastResponse;
    }
  }

  // =========================================================================
  // キャッシュ
  // =========================================================================

  private loadCache(): void {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (!raw) return;
      const cached: LocalCacheFile = JSON.parse(raw);
      if (cached.cacheVersion === CACHE_VERSION) this.cache = cached;
    } catch {
      this.cache = { cacheVersion: CACHE_VERSION, lastUpdated: '' };
    }
  }

  private saveCache(): void {
    try {
      this.cache.lastUpdated = new Date().toISOString();
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(this.cache));
    } catch {
      // ストレージ書き込み失敗は無視
    }
  }

  private updateCache(config: RemoteConfigResponse): void {
    const now = new Date().toISOString();

    this.cache.updateCheck = {
      data: config.updateCheck,
      fetchedAt: now,
      etag: config.etag,
      ttlSeconds: TTL.updateCheck,
    };

    this.cache.featureFlags = {
      data: config.featureFlags,
      fetchedAt: now,
      etag: config.featureFlags.etag,
      ttlSeconds: TTL.featureFlags,
    };

    if (config.modelRegistry) {
      this.cache.modelRegistry = {
        data: config.modelRegistry,
        fetchedAt: now,
        etag: config.modelRegistry.etag,
        ttlSeconds: TTL.modelRegistry,
      };
    }

    if (!this.cache.apiKeys) this.cache.apiKeys = {};
    for (const key of config.apiKeys) {
      this.cache.apiKeys[key.provider] = {
        data: key,
        fetchedAt: now,
        ttlSeconds: TTL.apiKeys,
      };
    }
  }

  private isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
    if (!entry?.data || !entry.fetchedAt) return false;
    const fetchedAt = new Date(entry.fetchedAt).getTime();
    return Date.now() - fetchedAt < entry.ttlSeconds * 1000;
  }

  // =========================================================================
  // API キー復号
  // =========================================================================

  private decryptApiKey(keyResponse: ApiKeyResponse): string {
    if (!keyResponse.encrypted) return keyResponse.key;

    // 同期的に復号済みキーを返すため、事前に復号しておく必要がある。
    // fetchConfig 時に非同期で復号し、結果をキャッシュに保持する。
    // ここでは復号済みキャッシュから取得を試みる。
    const cached = this.decryptedKeyCache.get(keyResponse.provider);
    if (cached && cached.keyVersion === keyResponse.keyVersion) return cached.plainKey;

    // 未復号の場合はバックグラウンドで復号開始
    this.decryptApiKeyAsync(keyResponse).catch(() => {});
    return '';
  }

  /**
   * AES-256-GCM + HKDF で API キーを非同期復号
   *
   * Web Crypto API を使用。WPF / Python と同じキー派生パラメータ。
   */
  private async decryptApiKeyAsync(keyResponse: ApiKeyResponse): Promise<string> {
    if (!keyResponse.encrypted) return keyResponse.key;

    try {
      const enc = new TextEncoder();
      const ikm = enc.encode(`${this.opts.licenseKey}:${this.opts.deviceId}`);
      const salt = enc.encode('harmonic-insight-remote-config-v1');
      const info = enc.encode('api-key-encryption');

      // HKDF でキー派生
      const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
      const aesKey = await crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt, info },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      );

      // 復号
      const iv = base64ToBytes(keyResponse.encryption!.iv);
      const authTag = base64ToBytes(keyResponse.encryption!.authTag);
      const cipherText = base64ToBytes(keyResponse.key);

      // Web Crypto API: ciphertext + authTag を結合
      const combined = new Uint8Array(cipherText.length + authTag.length);
      combined.set(cipherText);
      combined.set(authTag, cipherText.length);

      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        combined,
      );

      const plainKey = new TextDecoder().decode(plainBuffer);

      // キャッシュに保存
      this.decryptedKeyCache.set(keyResponse.provider, {
        plainKey,
        keyVersion: keyResponse.keyVersion,
      });

      return plainKey;
    } catch (err) {
      console.error('[RemoteConfig] API key decryption failed:', err);
      return '';
    }
  }

  // =========================================================================
  // フィーチャーフラグ評価
  // =========================================================================

  private evaluateFlag(flag: FeatureFlag): boolean {
    // 期限切れ
    if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) return false;

    // 製品チェック
    if (flag.products.length > 0 && !flag.products.includes(this.opts.productCode)) return false;

    // 最小バージョン
    if (flag.minimumAppVersion && compareVersions(this.opts.appVersion, flag.minimumAppVersion) < 0)
      return false;

    switch (flag.strategy) {
      case 'all':
        return true;
      case 'none':
        return false;
      case 'percentage':
        if (!this.opts.userId || flag.rolloutPercentage === undefined) return false;
        return hashToPercentage(this.opts.userId) < flag.rolloutPercentage;
      case 'allowlist':
        return flag.allowedUserIds?.includes(this.opts.userId) ?? false;
      case 'plan_based':
        return flag.allowedPlans?.includes(this.opts.plan) ?? false;
      default:
        return false;
    }
  }

  // =========================================================================
  // ポーリング制御
  // =========================================================================

  private setPollingInterval(ms: number): void {
    if (this.pollTimerId) clearInterval(this.pollTimerId);
    this.pollTimerId = setInterval(() => {
      if (!this.disposed) this.fetchConfig();
    }, ms);
  }

  private resetPollingInterval(): void {
    this.setPollingInterval(DEFAULT_POLLING_INTERVAL_MS);
  }

  // =========================================================================
  // Dispose
  // =========================================================================

  dispose(): void {
    this.disposed = true;
    if (this.pollTimerId) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
  }
}

// =============================================================================
// ユーティリティ
// =============================================================================

/** セマンティックバージョン比較 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

/** Base64 → Uint8Array */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** FNV-1a ハッシュ → 0-99 */
function hashToPercentage(userId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 100;
}

// =============================================================================
// React Hook（オプション）
// =============================================================================

/**
 * React 用フック
 *
 * ```tsx
 * import { useRemoteConfig } from '@/insight-common/clients/tauri/remote-config-client';
 *
 * function App() {
 *   const { client, updateCheck, isFeatureEnabled } = useRemoteConfig({
 *     productCode: 'INCA',
 *     appVersion: '1.0.0',
 *     buildNumber: 1,
 *     licenseKey: storedKey,
 *     deviceId: deviceId,
 *   });
 *
 *   if (updateCheck?.forceUpdate) return <ForceUpdateScreen />;
 *   if (isFeatureEnabled('new_ui')) return <NewUI />;
 *   return <DefaultUI />;
 * }
 * ```
 *
 * 注: React を使わないプロジェクトではこの関数は不要。
 * RemoteConfigClient クラスを直接使ってください。
 */

// React が利用可能な場合のみエクスポート（型のみ定義）
export type UseRemoteConfigResult = {
  client: RemoteConfigClient;
  updateCheck: UpdateCheckResult | null;
  isFeatureEnabled: (key: string) => boolean;
  getApiKey: (provider: ApiKeyProvider) => string | null;
  getModelRegistry: () => ModelDefinition[] | null;
};

export default RemoteConfigClient;
