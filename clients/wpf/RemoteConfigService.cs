// =============================================================================
// HARMONIC insight — リモートコンフィグ クライアント (WPF / .NET 8.0)
// =============================================================================
//
// 【使い方】
//
// 1. App.xaml.cs の OnStartup で初期化:
//
//    var remoteConfig = new RemoteConfigService(
//        productCode: "INSS",
//        appVersion: "2.1.0",
//        buildNumber: 45,
//        licenseKey: storedLicenseKey,
//        deviceId: DeviceIdHelper.GetOrCreate()
//    );
//    await remoteConfig.InitializeAsync();
//
// 2. API キー取得:
//
//    var claudeKey = remoteConfig.GetApiKey("claude");
//    var syncfusionKey = remoteConfig.GetApiKey("syncfusion");
//
// 3. 更新チェック:
//
//    var update = remoteConfig.GetUpdateCheck();
//    if (update?.ForceUpdate == true)
//        ShowForceUpdateDialog(update);
//
// 4. フィーチャーフラグ:
//
//    if (remoteConfig.IsFeatureEnabled("new_ai_editor"))
//        EnableNewAiEditor();
//
// 5. モデルレジストリ:
//
//    var models = remoteConfig.GetModelRegistry();
//
// 【依存】
// - System.Net.Http (標準)
// - System.Text.Json (標準)
// - System.Security.Cryptography (標準)
// - System.Security.Cryptography.ProtectedData (NuGet: DPAPI)
//
// 【重要】
// - このファイルは insight-common サブモジュールから参照するか、
//   各アプリにコピーして使用してください。
// - 名前空間は各アプリに合わせて変更してください。
// =============================================================================

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace HarmonicInsight.RemoteConfig;

// =============================================================================
// DTO — サーバーとの通信用型定義
// =============================================================================

/// <summary>更新の緊急度</summary>
public enum UpdateUrgency
{
    [JsonStringEnumMemberName("optional")] Optional,
    [JsonStringEnumMemberName("recommended")] Recommended,
    [JsonStringEnumMemberName("critical")] Critical,
}

/// <summary>リリース情報</summary>
public sealed record RemoteReleaseInfo(
    string ProductCode,
    string LatestVersion,
    int LatestBuildNumber,
    string MinimumRequiredVersion,
    int MinimumRequiredBuildNumber,
    UpdateUrgency Urgency,
    Dictionary<string, string> Changelog,
    string ReleasedAt,
    string DownloadUrl,
    string InstallerHash,
    long InstallerSize,
    string? AutoUpdateManifestUrl
);

/// <summary>バージョンチェック結果</summary>
public sealed record UpdateCheckResult(
    bool UpdateAvailable,
    bool ForceUpdate,
    RemoteReleaseInfo? Release,
    string ServerTime,
    string NextCheckAfter
);

/// <summary>暗号化情報</summary>
public sealed record EncryptionInfo(
    string Algorithm,
    string Iv,
    string AuthTag
);

/// <summary>API キーレスポンス</summary>
public sealed record ApiKeyResponse(
    string Provider,
    string Key,
    bool Encrypted,
    EncryptionInfo? Encryption,
    int KeyVersion,
    string RotatedAt,
    string? ExpiresAt,
    string? NextRotationAt
);

/// <summary>フィーチャーフラグ定義</summary>
public sealed record FeatureFlag(
    string Key,
    string[] Products,
    string Strategy,
    int? RolloutPercentage,
    string[]? AllowedUserIds,
    string[]? AllowedPlans,
    JsonElement Value,
    string? MinimumAppVersion,
    Dictionary<string, string> Description,
    string? ExpiresAt,
    string UpdatedAt
);

/// <summary>フィーチャーフラグレスポンス</summary>
public sealed record FeatureFlagsResponse(
    FeatureFlag[] Flags,
    string Etag
);

/// <summary>モデル定義</summary>
public sealed record ModelDefinition(
    string Id,
    string Family,
    string DisplayName,
    string Version,
    string ReleaseDate,
    string MinimumTier,
    double InputPer1M,
    double OutputPer1M,
    int MaxContextTokens,
    string Icon,
    string Status,
    string? IsDefaultForTier,
    string DescriptionJa,
    string DescriptionEn
);

/// <summary>モデルレジストリレスポンス</summary>
public sealed record RemoteModelRegistryResponse(
    ModelDefinition[] Models,
    int RegistryVersion,
    string UpdatedAt,
    string Etag
);

/// <summary>統合リモートコンフィグレスポンス</summary>
public sealed record RemoteConfigResponse(
    UpdateCheckResult UpdateCheck,
    ApiKeyResponse[] ApiKeys,
    RemoteModelRegistryResponse? ModelRegistry,
    FeatureFlagsResponse FeatureFlags,
    string ServerTime,
    string Etag
);

// =============================================================================
// ローカルキャッシュ
// =============================================================================

/// <summary>キャッシュエントリ</summary>
internal sealed class CacheEntry<T>
{
    public T? Data { get; set; }
    public string FetchedAt { get; set; } = "";
    public string? Etag { get; set; }
    public int TtlSeconds { get; set; }
}

/// <summary>ローカルキャッシュファイル構造</summary>
internal sealed class LocalCacheFile
{
    public int CacheVersion { get; set; } = 1;
    public string LastUpdated { get; set; } = "";
    public CacheEntry<UpdateCheckResult>? UpdateCheck { get; set; }
    public CacheEntry<RemoteModelRegistryResponse>? ModelRegistry { get; set; }
    public CacheEntry<FeatureFlagsResponse>? FeatureFlags { get; set; }
    public Dictionary<string, CacheEntry<ApiKeyResponse>>? ApiKeys { get; set; }
}

// =============================================================================
// メインサービス
// =============================================================================

/// <summary>
/// リモートコンフィグサービス
///
/// アプリ起動時に InitializeAsync() を呼び出すと、
/// バックグラウンドで定期ポーリングを開始する。
/// </summary>
public sealed class RemoteConfigService : IDisposable
{
    // --- 定数 ---
    private const string BaseUrl = "https://license.harmonicinsight.com";
    private const string ConfigEndpoint = "/api/v1/remote-config/config";
    private const int DefaultPollingIntervalMs = 4 * 60 * 60 * 1000; // 4時間
    private const int InitialDelayMs = 5_000; // 5秒
    private const int ErrorRetryIntervalMs = 15 * 60 * 1000; // 15分
    private const int MaxConsecutiveErrors = 5;
    private const int CacheVersion = 1;

    // --- キャッシュ TTL (秒) ---
    private const int TtlUpdateCheck = 4 * 60 * 60;
    private const int TtlApiKeys = 24 * 60 * 60;
    private const int TtlModelRegistry = 4 * 60 * 60;
    private const int TtlFeatureFlags = 1 * 60 * 60;

    // --- フィールド ---
    private readonly string _productCode;
    private readonly string _appVersion;
    private readonly int _buildNumber;
    private readonly string _licenseKey;
    private readonly string _deviceId;
    private readonly string _plan;
    private readonly string? _userId;
    private readonly string _locale;
    private readonly string _cachePath;
    private readonly HttpClient _http;
    private readonly Timer _pollTimer;
    private readonly JsonSerializerOptions _jsonOptions;

    private RemoteConfigResponse? _lastResponse;
    private LocalCacheFile _cache = new();
    private string? _lastEtag;
    private int? _lastModelRegistryVersion;
    private int _consecutiveErrors;
    private bool _disposed;

    /// <summary>更新通知イベント</summary>
    public event Action<UpdateCheckResult>? OnUpdateAvailable;

    /// <summary>API キー更新イベント</summary>
    public event Action<string, string>? OnApiKeyRotated;

    /// <summary>コンフィグ取得完了イベント</summary>
    public event Action<RemoteConfigResponse>? OnConfigFetched;

    /// <summary>エラーイベント</summary>
    public event Action<Exception>? OnError;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="productCode">製品コード（INSS, IOSH 等）</param>
    /// <param name="appVersion">現在のバージョン（例: "2.1.0"）</param>
    /// <param name="buildNumber">ビルド番号（例: 45）</param>
    /// <param name="licenseKey">ライセンスキー</param>
    /// <param name="deviceId">デバイスID（マシン固有）</param>
    /// <param name="plan">現在のプラン（STD, PRO, ENT）</param>
    /// <param name="userId">ユーザーID（フィーチャーフラグ判定用）</param>
    /// <param name="locale">ロケール（ja / en）</param>
    public RemoteConfigService(
        string productCode,
        string appVersion,
        int buildNumber,
        string licenseKey,
        string deviceId,
        string plan = "STD",
        string? userId = null,
        string locale = "ja")
    {
        _productCode = productCode;
        _appVersion = appVersion;
        _buildNumber = buildNumber;
        _licenseKey = licenseKey;
        _deviceId = deviceId;
        _plan = plan;
        _userId = userId;
        _locale = locale;

        // キャッシュパス
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var cacheDir = Path.Combine(appData, "HarmonicInsight", productCode);
        Directory.CreateDirectory(cacheDir);
        _cachePath = Path.Combine(cacheDir, "remote-config-cache.json");

        // HTTP クライアント
        _http = new HttpClient { BaseAddress = new Uri(BaseUrl) };
        _http.DefaultRequestHeaders.Add("X-License-Key", licenseKey);
        _http.DefaultRequestHeaders.Add("X-Device-Id", deviceId);
        _http.DefaultRequestHeaders.Add("X-Product-Code", productCode);
        _http.DefaultRequestHeaders.Add("X-App-Version", appVersion);

        // JSON オプション
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        };

        // ポーリングタイマー（まだ開始しない）
        _pollTimer = new Timer(PollCallback, null, Timeout.Infinite, Timeout.Infinite);
    }

    // =========================================================================
    // 初期化
    // =========================================================================

    /// <summary>
    /// サービスを初期化（アプリ起動時に1回呼ぶ）
    ///
    /// 1. ローカルキャッシュの読み込み
    /// 2. サーバーからコンフィグ取得（InitialDelay 後）
    /// 3. 定期ポーリング開始
    /// </summary>
    public async Task InitializeAsync(CancellationToken ct = default)
    {
        // 1. ローカルキャッシュ読み込み
        LoadCache();

        // 2. 初回フェッチ（UI表示後に遅延実行）
        _ = Task.Run(async () =>
        {
            await Task.Delay(InitialDelayMs, ct);
            await FetchConfigAsync(ct);
        }, ct);

        // 3. ポーリング開始
        _pollTimer.Change(DefaultPollingIntervalMs, DefaultPollingIntervalMs);

        await Task.CompletedTask;
    }

    // =========================================================================
    // データ取得（パブリック API）
    // =========================================================================

    /// <summary>更新チェック結果を取得</summary>
    public UpdateCheckResult? GetUpdateCheck()
    {
        if (_lastResponse != null) return _lastResponse.UpdateCheck;
        if (IsCacheValid(_cache.UpdateCheck)) return _cache.UpdateCheck!.Data;
        return null;
    }

    /// <summary>API キーを取得（復号済み）</summary>
    /// <param name="provider">claude / syncfusion</param>
    public string? GetApiKey(string provider)
    {
        // メモリキャッシュから
        var key = _lastResponse?.ApiKeys?.FirstOrDefault(k => k.Provider == provider);
        if (key != null) return DecryptApiKey(key);

        // ローカルキャッシュから
        if (_cache.ApiKeys?.TryGetValue(provider, out var cached) == true && IsCacheValid(cached))
            return cached.Data != null ? DecryptApiKey(cached.Data) : null;

        return null;
    }

    /// <summary>モデルレジストリを取得</summary>
    public ModelDefinition[]? GetModelRegistry()
    {
        if (_lastResponse?.ModelRegistry != null) return _lastResponse.ModelRegistry.Models;
        if (IsCacheValid(_cache.ModelRegistry)) return _cache.ModelRegistry!.Data?.Models;
        return null;
    }

    /// <summary>フィーチャーフラグの判定</summary>
    public bool IsFeatureEnabled(string flagKey)
    {
        var flags = _lastResponse?.FeatureFlags?.Flags
                    ?? (_cache.FeatureFlags?.Data?.Flags);
        if (flags == null) return false;

        var flag = flags.FirstOrDefault(f => f.Key == flagKey);
        if (flag == null) return false;

        return EvaluateFlag(flag);
    }

    /// <summary>全フィーチャーフラグを取得</summary>
    public FeatureFlag[]? GetFeatureFlags()
    {
        return _lastResponse?.FeatureFlags?.Flags
               ?? _cache.FeatureFlags?.Data?.Flags;
    }

    /// <summary>最新のレスポンス全体を取得</summary>
    public RemoteConfigResponse? GetLastResponse() => _lastResponse;

    // =========================================================================
    // サーバー通信
    // =========================================================================

    /// <summary>サーバーからコンフィグを取得</summary>
    public async Task<RemoteConfigResponse?> FetchConfigAsync(CancellationToken ct = default)
    {
        try
        {
            var request = new
            {
                productCode = _productCode,
                appVersion = _appVersion,
                buildNumber = _buildNumber,
                platform = "wpf",
                licenseKey = _licenseKey,
                deviceId = _deviceId,
                plan = _plan,
                userId = _userId,
                locale = _locale,
                ifNoneMatch = _lastEtag,
                lastModelRegistryVersion = _lastModelRegistryVersion,
            };

            var response = await _http.PostAsJsonAsync(ConfigEndpoint, request, _jsonOptions, ct);

            // 304 Not Modified — キャッシュ有効
            if (response.StatusCode == HttpStatusCode.NotModified)
            {
                _consecutiveErrors = 0;
                return _lastResponse;
            }

            response.EnsureSuccessStatusCode();

            var config = await response.Content.ReadFromJsonAsync<RemoteConfigResponse>(_jsonOptions, ct);
            if (config == null) return _lastResponse;

            // キャッシュ更新
            _lastResponse = config;
            _lastEtag = config.Etag;
            if (config.ModelRegistry != null)
                _lastModelRegistryVersion = config.ModelRegistry.RegistryVersion;

            UpdateCache(config);
            SaveCache();

            _consecutiveErrors = 0;

            // イベント発火
            OnConfigFetched?.Invoke(config);
            if (config.UpdateCheck.UpdateAvailable)
                OnUpdateAvailable?.Invoke(config.UpdateCheck);

            return config;
        }
        catch (Exception ex)
        {
            _consecutiveErrors++;
            OnError?.Invoke(ex);

            // エラーが多すぎたらポーリング間隔を延長
            if (_consecutiveErrors >= MaxConsecutiveErrors)
                _pollTimer.Change(ErrorRetryIntervalMs * 2, ErrorRetryIntervalMs * 2);
            else if (_consecutiveErrors > 1)
                _pollTimer.Change(ErrorRetryIntervalMs, DefaultPollingIntervalMs);

            return _lastResponse;
        }
    }

    // =========================================================================
    // 内部: キャッシュ管理
    // =========================================================================

    private void LoadCache()
    {
        try
        {
            if (!File.Exists(_cachePath)) return;
            var json = File.ReadAllText(_cachePath, Encoding.UTF8);
            var cached = JsonSerializer.Deserialize<LocalCacheFile>(json, _jsonOptions);
            if (cached?.CacheVersion == CacheVersion)
                _cache = cached;
        }
        catch
        {
            // キャッシュ破損時は無視
            _cache = new LocalCacheFile();
        }
    }

    private void SaveCache()
    {
        try
        {
            _cache.LastUpdated = DateTime.UtcNow.ToString("o");
            var json = JsonSerializer.Serialize(_cache, _jsonOptions);

            // アトミック書き込み（一時ファイル → リネーム）
            var tmpPath = _cachePath + ".tmp";
            File.WriteAllText(tmpPath, json, Encoding.UTF8);
            File.Move(tmpPath, _cachePath, overwrite: true);
        }
        catch
        {
            // キャッシュ保存失敗は無視
        }
    }

    private void UpdateCache(RemoteConfigResponse config)
    {
        var now = DateTime.UtcNow.ToString("o");

        _cache.UpdateCheck = new CacheEntry<UpdateCheckResult>
        {
            Data = config.UpdateCheck,
            FetchedAt = now,
            Etag = config.Etag,
            TtlSeconds = TtlUpdateCheck,
        };

        _cache.FeatureFlags = new CacheEntry<FeatureFlagsResponse>
        {
            Data = config.FeatureFlags,
            FetchedAt = now,
            Etag = config.FeatureFlags.Etag,
            TtlSeconds = TtlFeatureFlags,
        };

        if (config.ModelRegistry != null)
        {
            _cache.ModelRegistry = new CacheEntry<RemoteModelRegistryResponse>
            {
                Data = config.ModelRegistry,
                FetchedAt = now,
                Etag = config.ModelRegistry.Etag,
                TtlSeconds = TtlModelRegistry,
            };
        }

        _cache.ApiKeys ??= new Dictionary<string, CacheEntry<ApiKeyResponse>>();
        foreach (var key in config.ApiKeys)
        {
            _cache.ApiKeys[key.Provider] = new CacheEntry<ApiKeyResponse>
            {
                Data = key,
                FetchedAt = now,
                TtlSeconds = TtlApiKeys,
            };
        }
    }

    private static bool IsCacheValid<T>(CacheEntry<T>? entry)
    {
        if (entry?.Data == null || string.IsNullOrEmpty(entry.FetchedAt)) return false;
        if (!DateTime.TryParse(entry.FetchedAt, out var fetchedAt)) return false;
        return (DateTime.UtcNow - fetchedAt).TotalSeconds < entry.TtlSeconds;
    }

    // =========================================================================
    // 内部: API キー復号
    // =========================================================================

    private string DecryptApiKey(ApiKeyResponse keyResponse)
    {
        if (!keyResponse.Encrypted) return keyResponse.Key;

        // AES-256-GCM 復号
        // 復号キーは licenseKey + deviceId から HKDF で派生
        try
        {
            var derivedKey = DeriveKey(_licenseKey, _deviceId);
            var cipherText = Convert.FromBase64String(keyResponse.Key);
            var iv = Convert.FromBase64String(keyResponse.Encryption!.Iv);
            var authTag = Convert.FromBase64String(keyResponse.Encryption.AuthTag);

            using var aesGcm = new AesGcm(derivedKey, AesGcm.TagByteSizes.MaxSize);
            var plainText = new byte[cipherText.Length];
            aesGcm.Decrypt(iv, cipherText, authTag, plainText);

            return Encoding.UTF8.GetString(plainText);
        }
        catch
        {
            // 復号失敗時は空文字を返す
            return "";
        }
    }

    private static byte[] DeriveKey(string licenseKey, string deviceId)
    {
        // HKDF (HMAC-based Key Derivation Function)
        var ikm = Encoding.UTF8.GetBytes(licenseKey + ":" + deviceId);
        var salt = Encoding.UTF8.GetBytes("harmonic-insight-remote-config-v1");
        var info = Encoding.UTF8.GetBytes("api-key-encryption");
        return HKDF.DeriveKey(HashAlgorithmName.SHA256, ikm, 32, salt, info);
    }

    // =========================================================================
    // 内部: フィーチャーフラグ評価
    // =========================================================================

    private bool EvaluateFlag(FeatureFlag flag)
    {
        // 期限切れ
        if (!string.IsNullOrEmpty(flag.ExpiresAt) &&
            DateTime.TryParse(flag.ExpiresAt, out var expires) &&
            expires < DateTime.UtcNow)
            return false;

        // 製品チェック
        if (flag.Products.Length > 0 && !flag.Products.Contains(_productCode))
            return false;

        // 最小バージョンチェック
        if (!string.IsNullOrEmpty(flag.MinimumAppVersion) &&
            CompareVersions(_appVersion, flag.MinimumAppVersion) < 0)
            return false;

        return flag.Strategy switch
        {
            "all" => true,
            "none" => false,
            "percentage" =>
                _userId != null &&
                flag.RolloutPercentage.HasValue &&
                HashToPercentage(_userId) < flag.RolloutPercentage.Value,
            "allowlist" =>
                flag.AllowedUserIds?.Contains(_userId ?? "") == true,
            "plan_based" =>
                flag.AllowedPlans?.Contains(_plan) == true,
            _ => false,
        };
    }

    private static int HashToPercentage(string userId)
    {
        // FNV-1a ハッシュ → 0-99
        uint hash = 2166136261;
        foreach (var c in userId)
        {
            hash ^= c;
            hash *= 16777619;
        }
        return (int)(hash % 100);
    }

    // =========================================================================
    // 内部: バージョン比較
    // =========================================================================

    internal static int CompareVersions(string a, string b)
    {
        var partsA = a.Split('.').Select(int.Parse).ToArray();
        var partsB = b.Split('.').Select(int.Parse).ToArray();
        var maxLen = Math.Max(partsA.Length, partsB.Length);

        for (var i = 0; i < maxLen; i++)
        {
            var numA = i < partsA.Length ? partsA[i] : 0;
            var numB = i < partsB.Length ? partsB[i] : 0;
            if (numA != numB) return numA - numB;
        }
        return 0;
    }

    // =========================================================================
    // 内部: ポーリング
    // =========================================================================

    private async void PollCallback(object? state)
    {
        if (_disposed) return;
        await FetchConfigAsync();
    }

    // =========================================================================
    // Dispose
    // =========================================================================

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _pollTimer.Dispose();
        _http.Dispose();
    }
}

// =============================================================================
// デバイスID ヘルパー
// =============================================================================

/// <summary>
/// デバイスID（マシン固有の識別子）を生成・管理
///
/// Windows の MachineGuid をベースに SHA-256 ハッシュを生成。
/// 初回生成後はローカルに保存し、以降は固定値を返す。
/// </summary>
public static class DeviceIdHelper
{
    private const string FileName = "device-id";

    /// <summary>デバイスIDを取得（なければ生成）</summary>
    public static string GetOrCreate(string productCode = "shared")
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var dir = Path.Combine(appData, "HarmonicInsight", productCode);
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, FileName);

        if (File.Exists(path))
        {
            var existing = File.ReadAllText(path).Trim();
            if (!string.IsNullOrEmpty(existing)) return existing;
        }

        var deviceId = GenerateDeviceId();
        File.WriteAllText(path, deviceId);
        return deviceId;
    }

    private static string GenerateDeviceId()
    {
        // Windows: マシンGUID + ユーザー名
        var machineGuid = "";
        try
        {
            using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Cryptography");
            machineGuid = key?.GetValue("MachineGuid")?.ToString() ?? "";
        }
        catch { /* レジストリ読み取り不可 */ }

        var raw = $"{machineGuid}:{Environment.MachineName}:{Environment.UserName}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
