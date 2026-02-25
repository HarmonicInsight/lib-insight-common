/**
 * HARMONIC insight — リモートコンフィグ & アプリ自動更新
 *
 * ============================================================================
 * 【設計方針】
 * ============================================================================
 *
 * デスクトップアプリ（WPF / Tauri / Python）のリモート構成管理。
 * 既存ライセンスサーバー（license.harmonicinsight.com）にエンドポイントを追加し、
 * 以下を**アプリ再ビルドなし**で配信する：
 *
 *   1. バージョンチェック & 自動更新通知
 *   2. API キーローテーション（Claude / Syncfusion 等）
 *   3. モデルレジストリのホットアップデート
 *   4. フィーチャーフラグ（段階的ロールアウト）
 *
 * ## アーキテクチャ
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  ライセンスサーバー (Railway + Hono)                                 │
 * │  https://license.harmonicinsight.com                                │
 * │                                                                     │
 * │  ┌──────────────────────────────────────────────────────────────┐   │
 * │  │  /api/v1/remote-config                                      │   │
 * │  │                                                              │   │
 * │  │  ① バージョンチェック    GET /versions/:productCode          │   │
 * │  │  ② コンフィグ取得       GET /config/:productCode            │   │
 * │  │  ③ API キー取得         POST /api-keys                      │   │
 * │  │  ④ モデルレジストリ      GET /models                         │   │
 * │  │  ⑤ フィーチャーフラグ    GET /features/:productCode          │   │
 * │  │                                                              │   │
 * │  └──────────────────────────────────────────────────────────────┘   │
 * │                                                                     │
 * │  Supabase テーブル:                                                 │
 * │  - remote_config        (製品別コンフィグ値)                        │
 * │  - remote_config_log    (変更監査ログ)                              │
 * │  - app_releases         (リリース情報・DLリンク)                     │
 * │  - api_key_vault        (暗号化キー保管庫)                          │
 * │  - feature_flags        (フラグ定義・ロールアウト率)                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *          ▲
 *          │ HTTPS (ポーリング: 起動時 + 定期)
 *          │
 * ┌────────┴──────────────────────────────────────────────────────────────┐
 * │  デスクトップアプリ (WPF / Tauri / Python)                            │
 * │                                                                       │
 * │  ┌─────────────────────────────────────────────────────────────────┐  │
 * │  │  RemoteConfigClient                                             │  │
 * │  │                                                                 │  │
 * │  │  • 起動時にバージョンチェック → 更新通知                          │  │
 * │  │  • バックグラウンドで定期ポーリング（4時間ごと）                   │  │
 * │  │  • ローカルキャッシュ（オフライン対応）                            │  │
 * │  │  • API キーのセキュアストレージ連携                               │  │
 * │  │  • If-None-Match (ETag) でトラフィック最小化                      │  │
 * │  └─────────────────────────────────────────────────────────────────┘  │
 * │                                                                       │
 * │  ┌─────────────────────────────────────────────────────────────────┐  │
 * │  │  AutoUpdater (アプリバイナリ更新)                                │  │
 * │  │                                                                 │  │
 * │  │  WPF   → Velopack (Squirrel後継、差分更新)                      │  │
 * │  │  Tauri → tauri-plugin-updater (組み込み)                        │  │
 * │  │  Python → PyUpdater / カスタム                                  │  │
 * │  └─────────────────────────────────────────────────────────────────┘  │
 * └───────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## セキュリティ
 *
 * - API キーはサーバー側で AES-256-GCM 暗号化して配信
 * - 復号キーはライセンスキー + デバイス ID から派生（HKDF）
 * - トランスポートは HTTPS（TLS 1.3）
 * - Firebase トークンまたはライセンスキーで認証
 * - 管理画面での変更は全て監査ログに記録
 *
 * ## キャッシュ戦略
 *
 * | データ種別        | TTL        | キャッシュ場所     |
 * |------------------|------------|-------------------|
 * | バージョン情報    | 4時間      | メモリ + ファイル  |
 * | API キー         | 24時間     | セキュアストレージ |
 * | モデルレジストリ  | 4時間      | メモリ + ファイル  |
 * | フィーチャーフラグ | 1時間      | メモリ + ファイル  |
 * | コンフィグ値      | 4時間      | メモリ + ファイル  |
 *
 * ## 使い方
 *
 * ```typescript
 * import {
 *   checkForUpdates,
 *   getRemoteConfig,
 *   getRemoteApiKey,
 *   getRemoteModelRegistry,
 *   isFeatureEnabled,
 *   REMOTE_CONFIG_ENDPOINTS,
 *   AUTO_UPDATE_CONFIG,
 * } from '@/insight-common/config/remote-config';
 *
 * // === 起動時チェック ===
 *
 * // 1. バージョンチェック
 * const update = checkForUpdates('INSS', '2.2.0', 50);
 * if (update.updateAvailable) {
 *   showUpdateDialog(update);
 * }
 *
 * // 2. リモートコンフィグ取得（API キー + モデル + フラグ一括）
 * const config = getRemoteConfig('INSS', '2.2.0');
 * // → { apiKeys, modelRegistry, featureFlags, syncfusionKey, ... }
 *
 * // === API キーローテーション ===
 *
 * // サーバーから最新の Claude API キーを取得
 * const apiKey = getRemoteApiKey('INSS', 'claude', licenseKey, deviceId);
 * // → { key: 'sk-ant-...', expiresAt: '2026-04-01', rotatedAt: '2026-02-20' }
 *
 * // === モデルレジストリの動的更新 ===
 *
 * // ローカルレジストリをサーバーの最新版で上書き
 * const models = getRemoteModelRegistry();
 * // → ModelDefinition[] — 新モデル追加・非推奨化が即座に反映
 *
 * // === フィーチャーフラグ ===
 *
 * // 段階的ロールアウト対応
 * const enabled = isFeatureEnabled('INSS', 'new_ai_editor', userId);
 * ```
 *
 * ## C# (WPF) 実装例
 *
 * ```csharp
 * // RemoteConfigService.cs
 * public class RemoteConfigService
 * {
 *     private readonly HttpClient _http;
 *     private readonly string _baseUrl = "https://license.harmonicinsight.com";
 *     private readonly Timer _pollTimer;
 *     private RemoteConfigResponse? _cachedConfig;
 *
 *     public RemoteConfigService(string licenseKey, string deviceId)
 *     {
 *         _http = new HttpClient();
 *         _http.DefaultRequestHeaders.Add("X-License-Key", licenseKey);
 *         _http.DefaultRequestHeaders.Add("X-Device-Id", deviceId);
 *
 *         // 4時間ごとにポーリング
 *         _pollTimer = new Timer(PollConfig, null,
 *             TimeSpan.Zero, TimeSpan.FromHours(4));
 *     }
 *
 *     public async Task<UpdateCheckResult> CheckForUpdatesAsync(
 *         string productCode, string currentVersion, int buildNumber)
 *     {
 *         var url = $"{_baseUrl}/api/v1/remote-config/versions/{productCode}" +
 *                   $"?currentVersion={currentVersion}&buildNumber={buildNumber}";
 *         return await _http.GetFromJsonAsync<UpdateCheckResult>(url);
 *     }
 *
 *     public async Task<string?> GetClaudeApiKeyAsync()
 *     {
 *         var resp = await _http.PostAsJsonAsync(
 *             $"{_baseUrl}/api/v1/remote-config/api-keys",
 *             new { provider = "claude" });
 *         var result = await resp.Content.ReadFromJsonAsync<ApiKeyResponse>();
 *         return Decrypt(result.EncryptedKey, _deviceKey);
 *     }
 * }
 * ```
 *
 * ## Tauri 実装例
 *
 * ```typescript
 * // src/lib/remote-config.ts (Tauri frontend)
 * import { check } from '@tauri-apps/plugin-updater';
 * import { relaunch } from '@tauri-apps/plugin-process';
 *
 * // Tauri 組み込みの自動更新
 * const update = await check();
 * if (update) {
 *   await update.downloadAndInstall();
 *   await relaunch();
 * }
 *
 * // リモートコンフィグ（API キー等）は共通クライアントで取得
 * import { fetchRemoteConfig } from './remote-config-client';
 * const config = await fetchRemoteConfig('INCA', '1.0.0');
 * ```
 */

import type { ProductCode, PlanCode, AppPlatform } from './products';
import type { ModelDefinition, ModelStatus, ModelFamily } from './ai-assistant';
import type { AiModelTier } from './usage-based-licensing';

// =============================================================================
// 型定義: バージョンチェック & アプリ更新
// =============================================================================

/** 更新の緊急度 */
export type UpdateUrgency =
  | 'critical'     // セキュリティ修正。即時更新を強く推奨（ダイアログ表示）
  | 'recommended'  // 重要なバグ修正・機能追加。更新を推奨（バナー表示）
  | 'optional';    // 軽微な改善。通知のみ（設定画面で表示）

/** プラットフォーム別の配布構成 */
export interface PlatformDistribution {
  /** 自動更新フレームワーク */
  autoUpdateFramework: string;
  /** 更新マニフェスト URL */
  manifestUrl: string;
  /** ダウンロードベース URL */
  downloadBaseUrl: string;
  /** 差分更新対応か */
  supportsDelta: boolean;
  /** サイレント更新対応か（バックグラウンドでDL → 次回起動時適用） */
  supportsSilent: boolean;
}

/** リリース情報（サーバーから配信） */
export interface RemoteReleaseInfo {
  /** 製品コード */
  productCode: ProductCode;
  /** 最新バージョン */
  latestVersion: string;
  /** 最新ビルド番号 */
  latestBuildNumber: number;
  /** 最小必須バージョン（これ未満は強制更新） */
  minimumRequiredVersion: string;
  /** 最小必須ビルド番号 */
  minimumRequiredBuildNumber: number;
  /** 更新の緊急度 */
  urgency: UpdateUrgency;
  /** 更新内容（Markdown） */
  changelog: {
    ja: string;
    en: string;
  };
  /** リリース日 */
  releasedAt: string;
  /** ダウンロードURL */
  downloadUrl: string;
  /** インストーラーのハッシュ（SHA-256） */
  installerHash: string;
  /** インストーラーのサイズ（bytes） */
  installerSize: number;
  /** 自動更新マニフェスト（Velopack / Tauri Updater 用） */
  autoUpdateManifestUrl?: string;
}

/** バージョンチェック結果 */
export interface UpdateCheckResult {
  /** 更新が利用可能か */
  updateAvailable: boolean;
  /** 強制更新が必要か（minimumRequired を下回っている） */
  forceUpdate: boolean;
  /** リリース情報（更新がある場合） */
  release?: RemoteReleaseInfo;
  /** サーバー時刻 */
  serverTime: string;
  /** 次回チェック推奨時刻（ISO 8601） */
  nextCheckAfter: string;
}

// =============================================================================
// 型定義: API キーローテーション
// =============================================================================

/** API キープロバイダー */
export type ApiKeyProvider =
  | 'claude'       // Anthropic Claude API
  | 'syncfusion'   // Syncfusion Essential Studio
  | 'firebase'     // Firebase（将来的にサーバー経由配信する場合）
  | 'resend';      // メール送信用（将来用）

/** API キーの配信ポリシー */
export interface ApiKeyPolicy {
  /** プロバイダー */
  provider: ApiKeyProvider;
  /** 暗号化して配信するか */
  encrypted: boolean;
  /** ローテーション間隔の目安（日） */
  rotationIntervalDays: number;
  /** キャッシュ TTL（秒） */
  cacheTtlSeconds: number;
  /** 説明 */
  description: string;
}

/**
 * API キー配信ポリシー定義
 *
 * Claude API キーは頻繁に更新される可能性があるため短めの TTL。
 * Syncfusion は年次更新だが、更新忘れ防止のためサーバー配信。
 */
export const API_KEY_POLICIES: Record<ApiKeyProvider, ApiKeyPolicy> = {
  claude: {
    provider: 'claude',
    encrypted: true,
    rotationIntervalDays: 90,
    cacheTtlSeconds: 86_400, // 24時間
    description: 'Claude API キー。モデル更新やアカウント変更時にローテーション。',
  },
  syncfusion: {
    provider: 'syncfusion',
    encrypted: false, // Community License キーは公開情報
    rotationIntervalDays: 365,
    cacheTtlSeconds: 604_800, // 7日
    description: 'Syncfusion Community License キー。年次更新。',
  },
  firebase: {
    provider: 'firebase',
    encrypted: true,
    rotationIntervalDays: 180,
    cacheTtlSeconds: 86_400,
    description: 'Firebase 設定。通常は変更なし。',
  },
  resend: {
    provider: 'resend',
    encrypted: true,
    rotationIntervalDays: 365,
    cacheTtlSeconds: 86_400,
    description: 'メール送信用キー。サーバーサイド専用。',
  },
};

/** API キーレスポンス（サーバーから） */
export interface ApiKeyResponse {
  /** プロバイダー */
  provider: ApiKeyProvider;
  /** 暗号化キー（encrypted: true の場合）または平文キー */
  key: string;
  /** 暗号化されているか */
  encrypted: boolean;
  /** 暗号化方式（encrypted: true の場合） */
  encryption?: {
    algorithm: 'aes-256-gcm';
    /** Base64 エンコードされた IV */
    iv: string;
    /** Base64 エンコードされた認証タグ */
    authTag: string;
  };
  /** キーのバージョン（ローテーション追跡用） */
  keyVersion: number;
  /** ローテーション日時 */
  rotatedAt: string;
  /** 有効期限（既知の場合） */
  expiresAt?: string;
  /** 次回ローテーション予定（目安） */
  nextRotationAt?: string;
}

/** API キーリクエスト */
export interface ApiKeyRequest {
  /** 取得するプロバイダー（指定なしで全キー） */
  providers?: ApiKeyProvider[];
  /** ライセンスキー（認証用） */
  licenseKey: string;
  /** デバイスID（復号キー派生用） */
  deviceId: string;
  /** 製品コード */
  productCode: ProductCode;
}

// =============================================================================
// 型定義: リモートモデルレジストリ
// =============================================================================

/**
 * リモートモデルレジストリレスポンス
 *
 * ローカルの MODEL_REGISTRY をサーバー側で上書き更新できる。
 * 新モデル追加・非推奨化・料金変更を、アプリ再ビルドなしで反映。
 */
export interface RemoteModelRegistryResponse {
  /** モデル一覧 */
  models: ModelDefinition[];
  /** レジストリバージョン（変更検知用） */
  registryVersion: number;
  /** 最終更新日時 */
  updatedAt: string;
  /** ETag（キャッシュバリデーション用） */
  etag: string;
}

// =============================================================================
// 型定義: フィーチャーフラグ
// =============================================================================

/** フィーチャーフラグのロールアウト戦略 */
export type RolloutStrategy =
  | 'all'            // 全ユーザーに有効
  | 'none'           // 全ユーザーに無効
  | 'percentage'     // ユーザーIDハッシュベースで段階的
  | 'allowlist'      // 指定ユーザーのみ
  | 'plan_based';    // プランベース（例: ENT のみ）

/** フィーチャーフラグ定義 */
export interface FeatureFlag {
  /** フラグキー（ユニーク） */
  key: string;
  /** 対象製品（空 = 全製品） */
  products: ProductCode[];
  /** ロールアウト戦略 */
  strategy: RolloutStrategy;
  /** ロールアウト率（percentage 戦略の場合、0-100） */
  rolloutPercentage?: number;
  /** 許可リスト（allowlist 戦略の場合） */
  allowedUserIds?: string[];
  /** 対象プラン（plan_based 戦略の場合） */
  allowedPlans?: PlanCode[];
  /** フラグの値（boolean 以外も対応） */
  value: boolean | string | number;
  /** 最小アプリバージョン（このバージョン以上でのみ有効） */
  minimumAppVersion?: string;
  /** 説明 */
  description: {
    ja: string;
    en: string;
  };
  /** 有効期限（一時的なフラグの場合） */
  expiresAt?: string;
  /** 最終更新日時 */
  updatedAt: string;
}

/** フィーチャーフラグレスポンス */
export interface FeatureFlagsResponse {
  /** フラグ一覧 */
  flags: FeatureFlag[];
  /** ETag */
  etag: string;
}

// =============================================================================
// 型定義: 統合リモートコンフィグ
// =============================================================================

/**
 * 統合リモートコンフィグレスポンス
 *
 * 1 回の API コールで必要な情報を全て取得。
 * アプリ起動時に呼び出し、以降はポーリングで差分取得。
 */
export interface RemoteConfigResponse {
  /** バージョンチェック結果 */
  updateCheck: UpdateCheckResult;
  /** API キー一覧 */
  apiKeys: ApiKeyResponse[];
  /** モデルレジストリ（変更がある場合のみ含む） */
  modelRegistry?: RemoteModelRegistryResponse;
  /** フィーチャーフラグ */
  featureFlags: FeatureFlagsResponse;
  /** サーバー時刻 */
  serverTime: string;
  /** レスポンス ETag（統合） */
  etag: string;
}

/** リモートコンフィグリクエスト */
export interface RemoteConfigRequest {
  /** 製品コード */
  productCode: ProductCode;
  /** 現在のアプリバージョン */
  appVersion: string;
  /** ビルド番号 */
  buildNumber: number;
  /** プラットフォーム */
  platform: AppPlatform;
  /** ライセンスキー */
  licenseKey: string;
  /** デバイスID */
  deviceId: string;
  /** 現在のプラン */
  plan: PlanCode;
  /** ユーザーID（フィーチャーフラグ判定用） */
  userId?: string;
  /** ロケール */
  locale: 'ja' | 'en';
  /** 前回取得時の ETag（304 判定用） */
  ifNoneMatch?: string;
  /** 前回取得時のモデルレジストリバージョン */
  lastModelRegistryVersion?: number;
}

// =============================================================================
// 型定義: ローカルキャッシュ
// =============================================================================

/** ローカルキャッシュエントリ */
export interface CacheEntry<T> {
  /** キャッシュされたデータ */
  data: T;
  /** 取得日時（ISO 8601） */
  fetchedAt: string;
  /** ETag */
  etag?: string;
  /** TTL（秒） */
  ttlSeconds: number;
}

/** ローカルキャッシュファイルの構造 */
export interface LocalCacheFile {
  /** キャッシュバージョン（マイグレーション用） */
  cacheVersion: number;
  /** 最終更新日時 */
  lastUpdated: string;
  /** バージョンチェック結果 */
  updateCheck?: CacheEntry<UpdateCheckResult>;
  /** モデルレジストリ */
  modelRegistry?: CacheEntry<RemoteModelRegistryResponse>;
  /** フィーチャーフラグ */
  featureFlags?: CacheEntry<FeatureFlagsResponse>;
}

// =============================================================================
// 定数: ポーリング & キャッシュ設定
// =============================================================================

/**
 * リモートコンフィグのポーリング・キャッシュ設定
 */
export const REMOTE_CONFIG_SETTINGS = {
  /** ポーリング間隔（ミリ秒） */
  polling: {
    /** 標準ポーリング間隔: 4時間 */
    defaultIntervalMs: 4 * 60 * 60 * 1000,
    /** 最小ポーリング間隔: 30分（サーバー負荷保護） */
    minimumIntervalMs: 30 * 60 * 1000,
    /** 起動後の初回チェック遅延: 5秒（UI表示を優先） */
    initialDelayMs: 5_000,
    /** エラー時のリトライ間隔: 15分 */
    errorRetryIntervalMs: 15 * 60 * 1000,
    /** 最大リトライ回数（連続エラー時） */
    maxConsecutiveErrors: 5,
  },

  /** キャッシュ TTL（秒） */
  cacheTtl: {
    /** バージョンチェック: 4時間 */
    updateCheck: 4 * 60 * 60,
    /** API キー: 24時間 */
    apiKeys: 24 * 60 * 60,
    /** モデルレジストリ: 4時間 */
    modelRegistry: 4 * 60 * 60,
    /** フィーチャーフラグ: 1時間 */
    featureFlags: 1 * 60 * 60,
    /** 統合コンフィグ: 4時間 */
    config: 4 * 60 * 60,
  },

  /** ローカルキャッシュ */
  localCache: {
    /** キャッシュファイル名 */
    fileName: 'remote-config-cache.json',
    /** キャッシュバージョン（互換性が壊れたらインクリメント） */
    version: 1,
    /**
     * キャッシュファイルの保存場所（プレースホルダー）
     *
     * WPF:   %LOCALAPPDATA%\HarmonicInsight\{ProductCode}\remote-config-cache.json
     * Tauri: $APPDATA/{product-name}/remote-config-cache.json
     * Python: ~/.harmonic-insight/{product-code}/remote-config-cache.json
     */
    getPath: (productCode: ProductCode): string =>
      `%LOCALAPPDATA%/HarmonicInsight/${productCode}/remote-config-cache.json`,
  },

  /** API キーのセキュアストレージ */
  secureStorage: {
    /**
     * WPF:   Windows Credential Manager (ProtectedData API)
     * Tauri: tauri-plugin-stronghold / OS keychain
     * Python: keyring ライブラリ
     */
    keyPrefix: 'harmonic-insight',
    /** キー名フォーマット */
    getKeyName: (productCode: ProductCode, provider: ApiKeyProvider): string =>
      `harmonic-insight/${productCode}/${provider}`,
  },
} as const;

// =============================================================================
// 定数: 自動更新フレームワーク設定
// =============================================================================

/**
 * プラットフォーム別の自動更新構成
 *
 * アプリバイナリの更新はプラットフォームネイティブの仕組みを使う。
 * リモートコンフィグ（API キー等）の更新は共通の HTTP ポーリング。
 */
export const AUTO_UPDATE_CONFIG: Record<string, PlatformDistribution> = {
  /** WPF (.NET 8.0) — Velopack */
  wpf: {
    autoUpdateFramework: 'Velopack',
    manifestUrl: 'https://releases.harmonicinsight.com/wpf/{productCode}/RELEASES',
    downloadBaseUrl: 'https://releases.harmonicinsight.com/wpf/{productCode}/',
    supportsDelta: true,
    supportsSilent: true,
  },
  /** Tauri (Rust + TypeScript) — tauri-plugin-updater */
  tauri: {
    autoUpdateFramework: 'tauri-plugin-updater',
    manifestUrl: 'https://releases.harmonicinsight.com/tauri/{productCode}/latest.json',
    downloadBaseUrl: 'https://releases.harmonicinsight.com/tauri/{productCode}/',
    supportsDelta: false, // Tauri は全体置換
    supportsSilent: true,
  },
  /** Python (CustomTkinter + PyInstaller) — カスタム */
  python: {
    autoUpdateFramework: 'custom',
    manifestUrl: 'https://releases.harmonicinsight.com/python/{productCode}/latest.json',
    downloadBaseUrl: 'https://releases.harmonicinsight.com/python/{productCode}/',
    supportsDelta: false,
    supportsSilent: false,
  },
};

// =============================================================================
// API エンドポイント定義（license-server.ts に追加するもの）
// =============================================================================

/**
 * リモートコンフィグ用 API エンドポイント
 *
 * 既存の LICENSE_SERVER_ENDPOINTS と同じパターン。
 * ライセンスサーバーに追加。
 */
export const REMOTE_CONFIG_ENDPOINTS = {

  // --- 統合エンドポイント（推奨: 起動時に1回呼ぶ） ---

  /** 統合リモートコンフィグ取得 */
  getConfig: {
    method: 'POST' as const,
    path: '/api/v1/remote-config/config',
    auth: 'license_key',
    description: '統合リモートコンフィグを取得。起動時に1回呼び出し。ETag 対応。',
  },

  // --- 個別エンドポイント ---

  /** バージョンチェック */
  checkVersion: {
    method: 'GET' as const,
    path: '/api/v1/remote-config/versions/:productCode',
    auth: 'api_key',
    description: '製品の最新バージョン・更新情報を取得。',
  },

  /** API キー取得 */
  getApiKeys: {
    method: 'POST' as const,
    path: '/api/v1/remote-config/api-keys',
    auth: 'license_key',
    description: 'API キーを取得（暗号化配信）。ライセンスキー + デバイスID で認証。',
  },

  /** モデルレジストリ取得 */
  getModelRegistry: {
    method: 'GET' as const,
    path: '/api/v1/remote-config/models',
    auth: 'api_key',
    description: '最新のモデルレジストリを取得。ETag 対応。',
  },

  /** フィーチャーフラグ取得 */
  getFeatureFlags: {
    method: 'GET' as const,
    path: '/api/v1/remote-config/features/:productCode',
    auth: 'api_key',
    description: '製品のフィーチャーフラグを取得。ETag 対応。',
  },

  // --- 管理系（管理画面用） ---

  /** リモートコンフィグ値の更新 */
  adminUpdateConfig: {
    method: 'PUT' as const,
    path: '/api/v1/admin/remote-config',
    auth: 'admin',
    description: 'リモートコンフィグ値を更新。変更ログ自動記録。',
  },

  /** API キーのローテーション */
  adminRotateApiKey: {
    method: 'POST' as const,
    path: '/api/v1/admin/remote-config/rotate-key',
    auth: 'admin',
    description: 'API キーをローテーション。旧キーは猶予期間後に無効化。',
  },

  /** リリース情報の登録 */
  adminPublishRelease: {
    method: 'POST' as const,
    path: '/api/v1/admin/remote-config/releases',
    auth: 'admin',
    description: '新しいリリースを登録。自動更新マニフェストも更新。',
  },

  /** フィーチャーフラグの更新 */
  adminUpdateFeatureFlag: {
    method: 'PUT' as const,
    path: '/api/v1/admin/remote-config/features/:flagKey',
    auth: 'admin',
    description: 'フィーチャーフラグを更新。ロールアウト率の変更等。',
  },

  /** リモートコンフィグの変更ログ */
  adminConfigLog: {
    method: 'GET' as const,
    path: '/api/v1/admin/remote-config/log',
    auth: 'admin',
    description: 'リモートコンフィグの全変更履歴。監査用。',
  },
} as const;

// =============================================================================
// DB テーブル定義（Supabase 追加テーブル）
// =============================================================================

/**
 * リモートコンフィグ用の追加 DB テーブル
 *
 * 既存の Supabase に追加。
 */
export const REMOTE_CONFIG_TABLES = {
  /** アプリリリース情報 */
  app_releases: {
    columns: [
      'id UUID PRIMARY KEY',
      'product_code TEXT NOT NULL',
      'version TEXT NOT NULL',
      'build_number INTEGER NOT NULL',
      'platform TEXT NOT NULL',
      'urgency TEXT NOT NULL DEFAULT \'optional\'',
      'minimum_required_version TEXT',
      'minimum_required_build_number INTEGER',
      'changelog_ja TEXT',
      'changelog_en TEXT',
      'download_url TEXT NOT NULL',
      'auto_update_manifest_url TEXT',
      'installer_hash TEXT NOT NULL',
      'installer_size BIGINT',
      'released_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'is_active BOOLEAN NOT NULL DEFAULT TRUE',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ],
    indexes: [
      'UNIQUE(product_code, version, platform)',
      'INDEX idx_releases_product (product_code, is_active)',
    ],
  },

  /** API キー保管庫 */
  api_key_vault: {
    columns: [
      'id UUID PRIMARY KEY',
      'provider TEXT NOT NULL',
      'key_version INTEGER NOT NULL',
      'encrypted_key TEXT NOT NULL',
      'encryption_iv TEXT',
      'encryption_auth_tag TEXT',
      'plain_key_hash TEXT NOT NULL',
      'rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'expires_at TIMESTAMPTZ',
      'next_rotation_at TIMESTAMPTZ',
      'is_active BOOLEAN NOT NULL DEFAULT TRUE',
      'rotated_by TEXT NOT NULL',
      'notes TEXT',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ],
    indexes: [
      'UNIQUE(provider, key_version)',
      'INDEX idx_vault_provider_active (provider, is_active)',
    ],
  },

  /** フィーチャーフラグ */
  feature_flags: {
    columns: [
      'id UUID PRIMARY KEY',
      'key TEXT NOT NULL UNIQUE',
      'products TEXT[] NOT NULL DEFAULT \'{}\'',
      'strategy TEXT NOT NULL DEFAULT \'none\'',
      'rollout_percentage INTEGER DEFAULT 0',
      'allowed_user_ids TEXT[] DEFAULT \'{}\'',
      'allowed_plans TEXT[] DEFAULT \'{}\'',
      'value JSONB NOT NULL DEFAULT \'false\'',
      'minimum_app_version TEXT',
      'description_ja TEXT',
      'description_en TEXT',
      'expires_at TIMESTAMPTZ',
      'is_active BOOLEAN NOT NULL DEFAULT TRUE',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ],
    indexes: [
      'INDEX idx_flags_active (is_active, key)',
    ],
  },

  /** リモートコンフィグ変更ログ */
  remote_config_log: {
    columns: [
      'id UUID PRIMARY KEY',
      'action TEXT NOT NULL',
      'target_type TEXT NOT NULL',
      'target_id TEXT NOT NULL',
      'changed_by TEXT NOT NULL',
      'old_value JSONB',
      'new_value JSONB',
      'reason TEXT',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ],
    indexes: [
      'INDEX idx_config_log_target (target_type, target_id)',
      'INDEX idx_config_log_date (created_at DESC)',
    ],
  },
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * セマンティックバージョンを比較
 *
 * @returns 負数: a < b, 0: a == b, 正数: a > b
 */
export function compareVersions(a: string, b: string): number {
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

/**
 * ローカルバージョンチェック（サーバーレスポンスとの比較）
 *
 * サーバーから取得した RemoteReleaseInfo と現在のバージョンを比較し、
 * 更新が必要かを判定する。
 */
export function checkForUpdates(
  release: RemoteReleaseInfo,
  currentVersion: string,
  currentBuildNumber: number,
): UpdateCheckResult {
  const versionComparison = compareVersions(release.latestVersion, currentVersion);
  const updateAvailable = versionComparison > 0 ||
    (versionComparison === 0 && release.latestBuildNumber > currentBuildNumber);

  const forceUpdate = compareVersions(currentVersion, release.minimumRequiredVersion) < 0 ||
    (compareVersions(currentVersion, release.minimumRequiredVersion) === 0 &&
     currentBuildNumber < release.minimumRequiredBuildNumber);

  const now = new Date();
  const nextCheck = new Date(now.getTime() + REMOTE_CONFIG_SETTINGS.polling.defaultIntervalMs);

  return {
    updateAvailable,
    forceUpdate,
    release: updateAvailable ? release : undefined,
    serverTime: now.toISOString(),
    nextCheckAfter: nextCheck.toISOString(),
  };
}

/**
 * フィーチャーフラグの有効判定
 *
 * ユーザーID ベースのパーセンテージロールアウトでは、
 * ユーザーID のハッシュを 0-99 の範囲に正規化して判定する。
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  context: {
    productCode: ProductCode;
    userId?: string;
    plan?: PlanCode;
    appVersion?: string;
  },
): boolean {
  // 期限切れチェック
  if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
    return false;
  }

  // 製品チェック
  if (flag.products.length > 0 && !flag.products.includes(context.productCode)) {
    return false;
  }

  // 最小バージョンチェック
  if (flag.minimumAppVersion && context.appVersion) {
    if (compareVersions(context.appVersion, flag.minimumAppVersion) < 0) {
      return false;
    }
  }

  // 戦略別判定
  switch (flag.strategy) {
    case 'all':
      return true;
    case 'none':
      return false;
    case 'percentage':
      if (!context.userId || flag.rolloutPercentage === undefined) return false;
      return hashToPercentage(context.userId) < flag.rolloutPercentage;
    case 'allowlist':
      return flag.allowedUserIds?.includes(context.userId ?? '') ?? false;
    case 'plan_based':
      return flag.allowedPlans?.includes(context.plan ?? 'TRIAL') ?? false;
    default:
      return false;
  }
}

/**
 * ユーザーIDを 0-99 の整数にハッシュする（ロールアウト判定用）
 *
 * 簡易的な FNV-1a ハッシュ。暗号学的安全性は不要。
 * 同一ユーザーは常に同じ結果を返す（一貫性保証）。
 */
function hashToPercentage(userId: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  return Math.abs(hash) % 100;
}

/**
 * キャッシュの有効性チェック
 */
export function isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
  if (!entry) return false;
  const fetchedAt = new Date(entry.fetchedAt).getTime();
  const now = Date.now();
  return (now - fetchedAt) < entry.ttlSeconds * 1000;
}

/**
 * プラットフォームの自動更新マニフェスト URL を生成
 */
export function getAutoUpdateManifestUrl(
  platform: string,
  productCode: ProductCode,
): string {
  const config = AUTO_UPDATE_CONFIG[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return config.manifestUrl.replace('{productCode}', productCode);
}

/**
 * 自動更新のダウンロード URL を生成
 */
export function getDownloadUrl(
  platform: string,
  productCode: ProductCode,
  fileName: string,
): string {
  const config = AUTO_UPDATE_CONFIG[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return config.downloadBaseUrl.replace('{productCode}', productCode) + fileName;
}

/**
 * 更新通知の表示方法を決定
 */
export function getUpdateNotificationType(
  result: UpdateCheckResult,
): 'force_dialog' | 'dialog' | 'banner' | 'badge' | 'none' {
  if (!result.updateAvailable) return 'none';
  if (result.forceUpdate) return 'force_dialog';

  switch (result.release?.urgency) {
    case 'critical':
      return 'dialog';
    case 'recommended':
      return 'banner';
    case 'optional':
      return 'badge';
    default:
      return 'none';
  }
}

/**
 * API キーローテーション時の猶予期間（旧キーも有効な期間）
 *
 * 全クライアントがポーリングで新キーを取得するまでの猶予。
 * デフォルト: 7日間。
 */
export const API_KEY_GRACE_PERIOD_DAYS = 7;

/**
 * API キーリクエストのバリデーション
 */
export function validateApiKeyRequest(
  req: ApiKeyRequest,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!req.licenseKey) {
    errors.push('ライセンスキーが必要です。');
  }
  if (!req.deviceId) {
    errors.push('デバイスIDが必要です。');
  }
  if (!req.productCode) {
    errors.push('製品コードが必要です。');
  }

  if (req.providers) {
    for (const p of req.providers) {
      if (!API_KEY_POLICIES[p]) {
        errors.push(`不明なプロバイダー: ${p}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Railway cron ジョブ: API キー有効期限チェック（日次）
 *
 * 期限切れが近い API キー（30日以内）を検出し、
 * 管理者にアラートメールを送信。
 */
export const CRON_JOBS = {
  /** API キー有効期限チェック */
  checkApiKeyExpiry: {
    schedule: '0 9 * * *', // 毎日 09:00 JST
    description: 'API キーの有効期限チェック。30日以内の期限切れを管理者に通知。',
  },
  /** フィーチャーフラグの期限切れ無効化 */
  cleanupExpiredFlags: {
    schedule: '0 3 * * *', // 毎日 03:00 JST
    description: '期限切れフィーチャーフラグの自動無効化。',
  },
} as const;

// =============================================================================
// エクスポート
// =============================================================================

// =============================================================================
// InsightOffice 系デフォルトフィーチャーフラグ
// =============================================================================

/**
 * InsightOffice 系アプリ（INSS / IOSH / IOSD / ISOF）向けの
 * デフォルトフィーチャーフラグ定義。
 *
 * サーバーにフラグが未登録の場合のフォールバック値として使用。
 * サーバー側でフラグを作成すれば、これらの値は上書きされる。
 */
export const INSIGHT_OFFICE_DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'remote_api_key_rotation',
    products: ['INSS', 'IOSH', 'IOSD', 'ISOF', 'INBT', 'INPY'] as ProductCode[],
    strategy: 'all',
    value: true,
    description: {
      ja: 'リモート API キーローテーション（Claude / Syncfusion）を有効化',
      en: 'Enable remote API key rotation (Claude / Syncfusion)',
    },
    updatedAt: '2026-02-23T00:00:00Z',
  },
  {
    key: 'remote_model_registry',
    products: ['INSS', 'IOSH', 'IOSD', 'ISOF', 'INBT', 'INPY'] as ProductCode[],
    strategy: 'all',
    value: true,
    description: {
      ja: 'リモートモデルレジストリのホットアップデートを有効化',
      en: 'Enable remote model registry hot-update',
    },
    updatedAt: '2026-02-23T00:00:00Z',
  },
  {
    key: 'auto_update_check',
    products: ['INSS', 'IOSH', 'IOSD', 'ISOF', 'INBT', 'INPY'] as ProductCode[],
    strategy: 'all',
    value: true,
    description: {
      ja: '起動時の自動バージョンチェックを有効化',
      en: 'Enable automatic version check on startup',
    },
    updatedAt: '2026-02-23T00:00:00Z',
  },
  {
    key: 'velopack_auto_update',
    products: ['INSS', 'IOSH', 'IOSD', 'ISOF', 'INBT', 'INPY'] as ProductCode[],
    strategy: 'all',
    value: true,
    description: {
      ja: 'Velopack 差分自動更新を有効化（WPF アプリ）',
      en: 'Enable Velopack delta auto-update (WPF apps)',
    },
    updatedAt: '2026-02-23T00:00:00Z',
  },
  {
    key: 'velopack_silent_update',
    products: ['INSS', 'IOSH', 'IOSD', 'ISOF', 'INBT', 'INPY'] as ProductCode[],
    strategy: 'plan_based',
    allowedPlans: ['PRO', 'ENT'] as PlanCode[],
    value: true,
    description: {
      ja: 'サイレント自動更新（バックグラウンドDL → 次回起動時適用）を有効化（PRO/ENT のみ）',
      en: 'Enable silent auto-update (background download, apply on next launch) for PRO/ENT',
    },
    updatedAt: '2026-02-23T00:00:00Z',
  },
  {
    key: 'ai_model_user_selection',
    products: ['INSS', 'IOSH', 'IOSD', 'ISOF'] as ProductCode[],
    strategy: 'all',
    value: true,
    description: {
      ja: 'AI モデルのユーザー選択 UI を有効化',
      en: 'Enable AI model user selection UI',
    },
    updatedAt: '2026-02-23T00:00:00Z',
  },
];

/**
 * 製品別のリモートコンフィグ初期化パラメータ
 *
 * 各製品でリモートコンフィグクライアントを初期化する際のデフォルト設定。
 */
export const PRODUCT_REMOTE_CONFIG_DEFAULTS: Record<string, {
  /** ポーリング間隔（ミリ秒） */
  pollingIntervalMs: number;
  /** 起動時の初回チェック遅延（ミリ秒） */
  initialDelayMs: number;
  /** 自動更新フレームワーク */
  autoUpdateFramework: string;
  /** API キープロバイダー一覧 */
  requiredApiKeys: ApiKeyProvider[];
}> = {
  // InsightOffice Suite（Syncfusion + Claude）
  INSS: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'velopack',
    requiredApiKeys: ['claude', 'syncfusion'],
  },
  IOSH: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'velopack',
    requiredApiKeys: ['claude', 'syncfusion'],
  },
  IOSD: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'velopack',
    requiredApiKeys: ['claude', 'syncfusion'],
  },
  ISOF: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'velopack',
    requiredApiKeys: ['claude', 'syncfusion'],
  },
  // InsightBot（Claude のみ）
  INBT: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'velopack',
    requiredApiKeys: ['claude'],
  },
  // InsightPy（Claude のみ）
  INPY: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'velopack',
    requiredApiKeys: ['claude'],
  },
  // Tauri アプリ（Claude のみ）
  INCA: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'tauri-plugin-updater',
    requiredApiKeys: ['claude'],
  },
  IVIN: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'tauri-plugin-updater',
    requiredApiKeys: ['claude'],
  },
  // Python アプリ（Claude のみ）
  INMV: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'custom',
    requiredApiKeys: ['claude'],
  },
  INIG: {
    pollingIntervalMs: 4 * 60 * 60 * 1000,
    initialDelayMs: 5_000,
    autoUpdateFramework: 'custom',
    requiredApiKeys: ['claude'],
  },
};

/**
 * 製品のリモートコンフィグデフォルト設定を取得
 */
export function getProductRemoteConfigDefaults(productCode: ProductCode): typeof PRODUCT_REMOTE_CONFIG_DEFAULTS[string] | undefined {
  return PRODUCT_REMOTE_CONFIG_DEFAULTS[productCode];
}

export default {
  // 設定
  REMOTE_CONFIG_SETTINGS,
  REMOTE_CONFIG_ENDPOINTS,
  REMOTE_CONFIG_TABLES,
  AUTO_UPDATE_CONFIG,
  API_KEY_POLICIES,
  API_KEY_GRACE_PERIOD_DAYS,
  CRON_JOBS,
  INSIGHT_OFFICE_DEFAULT_FEATURE_FLAGS,
  PRODUCT_REMOTE_CONFIG_DEFAULTS,

  // 関数
  compareVersions,
  checkForUpdates,
  isFeatureEnabled,
  isCacheValid,
  getAutoUpdateManifestUrl,
  getDownloadUrl,
  getUpdateNotificationType,
  validateApiKeyRequest,
  getProductRemoteConfigDefaults,
};
