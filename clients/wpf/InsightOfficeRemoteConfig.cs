// =============================================================================
// HARMONIC insight — InsightOffice リモートコンフィグ統合
// =============================================================================
//
// 【対象製品】
// - INSS (InsightOfficeSlide)  — プレゼンテーション
// - IOSH (InsightOfficeSheet)  — スプレッドシート
// - IOSD (InsightOfficeDoc)    — ドキュメント
// - ISOF (InsightSeniorOffice) — シニア向け統合ツール
//
// 【概要】
// RemoteConfigService をラップし、InsightOffice 系アプリ固有の
// 統合ロジックを提供する:
//
//   1. Syncfusion ライセンスキーのリモートローテーション
//   2. Claude API キーのリモート取得・更新
//   3. モデルレジストリのホットアップデート
//   4. Velopack 自動更新との連携
//   5. 更新通知 UI の制御
//
// 【使い方 — App.xaml.cs】
//
//    private InsightOfficeRemoteConfig? _remoteConfig;
//
//    protected override async void OnStartup(StartupEventArgs e)
//    {
//        base.OnStartup(e);
//
//        // --- Syncfusion 初期登録（ローカルフォールバック） ---
//        var syncKey = Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY")
//                      ?? ThirdPartyLicenses.GetSyncfusionKey();
//        Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(syncKey);
//
//        // --- ライセンスマネージャー初期化 ---
//        var license = await InsightLicenseManager.LoadAsync();
//
//        // --- リモートコンフィグ初期化 ---
//        _remoteConfig = new InsightOfficeRemoteConfig(
//            productCode: "INSS",          // or "IOSD", "IOSH", "ISOF"
//            appVersion: "2.2.0",          // 現在のバージョン
//            buildNumber: 50,              // 現在のビルド番号
//            licenseKey: license.Key,
//            plan: license.Plan            // "STD" / "PRO" / "ENT"
//        );
//
//        _remoteConfig.OnSyncfusionKeyRotated += (newKey) =>
//        {
//            Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(newKey);
//        };
//
//        _remoteConfig.OnClaudeApiKeyRotated += (newKey) =>
//        {
//            AiAssistantService.Instance.UpdateApiKey(newKey);
//        };
//
//        _remoteConfig.OnModelRegistryUpdated += (models) =>
//        {
//            AiAssistantService.Instance.UpdateModelRegistry(models);
//        };
//
//        _remoteConfig.OnUpdateAvailable += (result) =>
//        {
//            Dispatcher.Invoke(() => ShowUpdateNotification(result));
//        };
//
//        await _remoteConfig.InitializeAsync();
//    }
//
//    protected override void OnExit(ExitEventArgs e)
//    {
//        _remoteConfig?.Dispose();
//        base.OnExit(e);
//    }
//
// 【依存】
// - HarmonicInsight.RemoteConfig (RemoteConfigService.cs)
// - Velopack (NuGet: Velopack) — 自動更新
// - Syncfusion.Licensing (NuGet) — ライセンスキー再登録
// =============================================================================

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace HarmonicInsight.RemoteConfig;

/// <summary>
/// InsightOffice 系アプリ向けリモートコンフィグ統合
///
/// RemoteConfigService + Syncfusion キーローテーション + Claude API キー +
/// モデルレジストリ + Velopack 自動更新を一括管理する。
/// </summary>
public sealed class InsightOfficeRemoteConfig : IDisposable
{
    private readonly RemoteConfigService _service;
    private readonly string _productCode;
    private string? _currentSyncfusionKey;
    private string? _currentClaudeKey;
    private int? _currentModelRegistryVersion;
    private bool _disposed;

    // --- イベント ---

    /// <summary>Syncfusion ライセンスキーが更新された</summary>
    public event Action<string>? OnSyncfusionKeyRotated;

    /// <summary>Claude API キーが更新された</summary>
    public event Action<string>? OnClaudeApiKeyRotated;

    /// <summary>モデルレジストリが更新された</summary>
    public event Action<ModelDefinition[]>? OnModelRegistryUpdated;

    /// <summary>アプリ更新が利用可能</summary>
    public event Action<UpdateCheckResult>? OnUpdateAvailable;

    /// <summary>強制更新が必要</summary>
    public event Action<UpdateCheckResult>? OnForceUpdateRequired;

    /// <summary>エラー発生</summary>
    public event Action<Exception>? OnError;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="productCode">製品コード（INSS / IOSH / IOSD / ISOF）</param>
    /// <param name="appVersion">現在のバージョン</param>
    /// <param name="buildNumber">ビルド番号</param>
    /// <param name="licenseKey">ライセンスキー</param>
    /// <param name="plan">プラン（STD / PRO / ENT）</param>
    /// <param name="userId">ユーザーID（フィーチャーフラグ用、省略可）</param>
    /// <param name="locale">ロケール（ja / en）</param>
    public InsightOfficeRemoteConfig(
        string productCode,
        string appVersion,
        int buildNumber,
        string licenseKey,
        string plan = "STD",
        string? userId = null,
        string locale = "ja")
    {
        _productCode = productCode;
        var deviceId = DeviceIdHelper.GetOrCreate(productCode);

        _service = new RemoteConfigService(
            productCode: productCode,
            appVersion: appVersion,
            buildNumber: buildNumber,
            licenseKey: licenseKey,
            deviceId: deviceId,
            plan: plan,
            userId: userId,
            locale: locale
        );

        // 内部イベント → 外部イベントへの中継
        _service.OnConfigFetched += HandleConfigFetched;
        _service.OnUpdateAvailable += HandleUpdateAvailable;
        _service.OnError += (ex) => OnError?.Invoke(ex);
    }

    // =========================================================================
    // 初期化
    // =========================================================================

    /// <summary>
    /// リモートコンフィグを初期化し、バックグラウンドポーリングを開始する。
    ///
    /// 起動時に1回呼ぶ。ローカルキャッシュがあれば即座に利用可能。
    /// 5秒後にサーバーから最新を取得し、以降4時間ごとにポーリング。
    /// </summary>
    public async Task InitializeAsync(CancellationToken ct = default)
    {
        await _service.InitializeAsync(ct);
    }

    // =========================================================================
    // パブリック API
    // =========================================================================

    /// <summary>現在の Claude API キーを取得</summary>
    /// <returns>復号済みの Claude API キー（未取得の場合は null）</returns>
    public string? GetClaudeApiKey()
    {
        return _service.GetApiKey("claude");
    }

    /// <summary>現在の Syncfusion ライセンスキーを取得</summary>
    /// <returns>Syncfusion キー（未取得の場合は null）</returns>
    public string? GetSyncfusionKey()
    {
        return _service.GetApiKey("syncfusion");
    }

    /// <summary>モデルレジストリを取得</summary>
    public ModelDefinition[]? GetModelRegistry()
    {
        return _service.GetModelRegistry();
    }

    /// <summary>更新チェック結果を取得</summary>
    public UpdateCheckResult? GetUpdateCheck()
    {
        return _service.GetUpdateCheck();
    }

    /// <summary>フィーチャーフラグの判定</summary>
    public bool IsFeatureEnabled(string flagKey)
    {
        return _service.IsFeatureEnabled(flagKey);
    }

    /// <summary>手動でリモートコンフィグをリフレッシュ</summary>
    public async Task<RemoteConfigResponse?> RefreshAsync(CancellationToken ct = default)
    {
        return await _service.FetchConfigAsync(ct);
    }

    /// <summary>
    /// Velopack 自動更新を実行
    ///
    /// RemoteConfigService の更新チェック結果と Velopack を連携させる。
    /// 更新が利用可能な場合、Velopack 経由でダウンロード・インストールする。
    ///
    /// 【呼び出しタイミング】
    /// - OnUpdateAvailable イベント内
    /// - ユーザーが「更新」ボタンを押した時
    /// - アプリ終了時（サイレント更新）
    ///
    /// 【使い方】
    /// ```csharp
    /// // Velopack NuGet パッケージが必要:
    /// // dotnet add package Velopack
    ///
    /// _remoteConfig.OnUpdateAvailable += async (result) =>
    /// {
    ///     if (result.ForceUpdate)
    ///     {
    ///         // 強制更新: ユーザーに確認後すぐに更新
    ///         await _remoteConfig.ApplyVelopackUpdateAsync();
    ///     }
    ///     else
    ///     {
    ///         // 任意更新: バナーを表示
    ///         ShowUpdateBanner(result);
    ///     }
    /// };
    /// ```
    /// </summary>
    /// <returns>更新が適用されたか</returns>
    public async Task<bool> ApplyVelopackUpdateAsync()
    {
        // Velopack の呼び出しコード
        // アプリ側で Velopack パッケージを参照していることが前提
        //
        // using Velopack;
        //
        // var mgr = new UpdateManager(
        //     $"https://releases.harmonicinsight.com/wpf/{_productCode}/RELEASES"
        // );
        // var updateInfo = await mgr.CheckForUpdatesAsync();
        // if (updateInfo != null)
        // {
        //     await mgr.DownloadUpdatesAsync(updateInfo);
        //     mgr.ApplyUpdatesAndRestart(updateInfo);
        //     return true;
        // }
        // return false;

        // Note: Velopack API の実装は各アプリで行ってください。
        // このメソッドはテンプレートとして提供しています。
        await Task.CompletedTask;
        return false;
    }

    // =========================================================================
    // 内部: イベントハンドラ
    // =========================================================================

    private void HandleConfigFetched(RemoteConfigResponse config)
    {
        // Syncfusion キーローテーション検知
        var syncKey = config.ApiKeys?
            .FirstOrDefault(k => k.Provider == "syncfusion");
        if (syncKey != null)
        {
            var newKey = _service.GetApiKey("syncfusion");
            if (newKey != null && newKey != _currentSyncfusionKey)
            {
                _currentSyncfusionKey = newKey;
                OnSyncfusionKeyRotated?.Invoke(newKey);
            }
        }

        // Claude API キーローテーション検知
        var claudeKey = config.ApiKeys?
            .FirstOrDefault(k => k.Provider == "claude");
        if (claudeKey != null)
        {
            var newKey = _service.GetApiKey("claude");
            if (newKey != null && newKey != _currentClaudeKey)
            {
                _currentClaudeKey = newKey;
                OnClaudeApiKeyRotated?.Invoke(newKey);
            }
        }

        // モデルレジストリ更新検知
        if (config.ModelRegistry != null &&
            config.ModelRegistry.RegistryVersion != _currentModelRegistryVersion)
        {
            _currentModelRegistryVersion = config.ModelRegistry.RegistryVersion;
            OnModelRegistryUpdated?.Invoke(config.ModelRegistry.Models);
        }
    }

    private void HandleUpdateAvailable(UpdateCheckResult result)
    {
        if (result.ForceUpdate)
        {
            OnForceUpdateRequired?.Invoke(result);
        }
        else
        {
            OnUpdateAvailable?.Invoke(result);
        }
    }

    // =========================================================================
    // Dispose
    // =========================================================================

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _service.OnConfigFetched -= HandleConfigFetched;
        _service.OnUpdateAvailable -= HandleUpdateAvailable;
        _service.Dispose();
    }
}

// =============================================================================
// 更新通知の種別判定ヘルパー
// =============================================================================

/// <summary>
/// 更新通知の表示方法
/// </summary>
public enum UpdateNotificationType
{
    /// <summary>通知なし</summary>
    None,
    /// <summary>設定画面にバッジ表示（optional 更新）</summary>
    Badge,
    /// <summary>画面上部にバナー表示（recommended 更新）</summary>
    Banner,
    /// <summary>ダイアログ表示（critical 更新）</summary>
    Dialog,
    /// <summary>強制更新ダイアログ（閉じられない）</summary>
    ForceDialog,
}

/// <summary>
/// 更新通知ヘルパー
/// </summary>
public static class UpdateNotificationHelper
{
    /// <summary>
    /// 更新チェック結果から通知の表示方法を決定
    /// </summary>
    public static UpdateNotificationType GetNotificationType(UpdateCheckResult? result)
    {
        if (result == null || !result.UpdateAvailable)
            return UpdateNotificationType.None;

        if (result.ForceUpdate)
            return UpdateNotificationType.ForceDialog;

        return result.Release?.Urgency switch
        {
            UpdateUrgency.Critical => UpdateNotificationType.Dialog,
            UpdateUrgency.Recommended => UpdateNotificationType.Banner,
            UpdateUrgency.Optional => UpdateNotificationType.Badge,
            _ => UpdateNotificationType.None,
        };
    }

    /// <summary>
    /// 更新メッセージを取得（日本語 / 英語）
    /// </summary>
    public static string GetUpdateMessage(UpdateCheckResult result, string locale = "ja")
    {
        if (result.Release == null) return "";

        var changelog = locale == "en"
            ? result.Release.Changelog.GetValueOrDefault("en", "")
            : result.Release.Changelog.GetValueOrDefault("ja", "");

        var version = result.Release.LatestVersion;

        return locale == "en"
            ? $"Version {version} is available.\n\n{changelog}"
            : $"バージョン {version} が利用可能です。\n\n{changelog}";
    }

    /// <summary>
    /// 強制更新メッセージを取得
    /// </summary>
    public static string GetForceUpdateMessage(UpdateCheckResult result, string locale = "ja")
    {
        var version = result.Release?.LatestVersion ?? "";

        return locale == "en"
            ? $"A critical update (v{version}) is required.\nPlease update to continue using the application."
            : $"重要な更新（v{version}）が必要です。\nアプリケーションを継続してご利用いただくには、更新してください。";
    }
}
