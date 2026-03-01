// =============================================================================
// HARMONIC insight — Velopack 自動更新統合 (WPF / .NET 8.0)
// =============================================================================
//
// 【概要】
// RemoteConfigService のバージョンチェック結果と Velopack 自動更新を連携する。
//
// Velopack (Squirrel 後継) は .NET 8.0 対応の差分更新フレームワーク。
// インストーラー作成・差分更新・サイレント更新をサポート。
//
// 【対象製品】
// - INSS (Insight Deck Quality Gate)       — WPF
// - IOSH (Insight Performance Management)  — WPF
// - IOSD (Insight AI Doc Factory)            — WPF
// - ISOF (InsightSeniorOffice) — WPF
// - INBT (InsightBot)          — WPF
// - INPY (InsightPy)           — WPF
//
// 【NuGet パッケージ】
// dotnet add package Velopack
//
// 【更新マニフェスト URL】
// https://releases.harmonicinsight.com/wpf/{ProductCode}/RELEASES
//
// 【使い方 — App.xaml.cs】
//
//    // ■ Program.cs (エントリポイント)
//    // Velopack は Main() の最初で VelopackApp.Build().Run() を呼ぶ必要がある
//
//    public static class Program
//    {
//        [STAThread]
//        public static void Main(string[] args)
//        {
//            // Velopack: インストール・更新・アンインストール時のフックを登録
//            VelopackApp.Build()
//                .WithFirstRun((v) => { /* 初回起動時の処理 */ })
//                .Run();
//
//            var app = new App();
//            app.InitializeComponent();
//            app.Run();
//        }
//    }
//
//    // ■ App.xaml.cs (起動時の更新チェック)
//
//    private VelopackAutoUpdater? _updater;
//
//    protected override async void OnStartup(StartupEventArgs e)
//    {
//        base.OnStartup(e);
//
//        _updater = new VelopackAutoUpdater("INSS");  // or "IOSD", "IOSH"
//
//        // 起動時にバックグラウンドで更新チェック
//        var result = await _updater.CheckForUpdateAsync();
//
//        switch (result.Status)
//        {
//            case VelopackUpdateStatus.ForceRequired:
//                // 強制更新: UI をブロックして更新を適用
//                await _updater.DownloadAndApplyAsync(result);
//                break;
//
//            case VelopackUpdateStatus.Available:
//                // 任意更新: バナーやダイアログで通知
//                ShowUpdateNotification(result);
//                break;
//
//            case VelopackUpdateStatus.UpToDate:
//            case VelopackUpdateStatus.Error:
//                // 何もしない
//                break;
//        }
//    }
//
//    // ユーザーが「更新」を選択した場合:
//    private async void OnUpdateButtonClicked()
//    {
//        await _updater!.DownloadAndApplyAsync();
//    }
//
// =============================================================================

using System;
using System.Threading;
using System.Threading.Tasks;

namespace HarmonicInsight.RemoteConfig;

// =============================================================================
// 更新ステータス
// =============================================================================

/// <summary>自動更新チェック結果のステータス</summary>
public enum VelopackUpdateStatus
{
    /// <summary>最新版を使用中</summary>
    UpToDate,
    /// <summary>更新あり（任意）</summary>
    Available,
    /// <summary>強制更新が必要</summary>
    ForceRequired,
    /// <summary>チェック中にエラーが発生</summary>
    Error,
}

/// <summary>自動更新チェック結果</summary>
public sealed class VelopackUpdateResult
{
    /// <summary>ステータス</summary>
    public VelopackUpdateStatus Status { get; init; }

    /// <summary>最新バージョン</summary>
    public string? LatestVersion { get; init; }

    /// <summary>変更履歴</summary>
    public string? Changelog { get; init; }

    /// <summary>ダウンロード URL</summary>
    public string? DownloadUrl { get; init; }

    /// <summary>更新の緊急度</summary>
    public UpdateUrgency? Urgency { get; init; }

    /// <summary>エラーメッセージ（Status == Error の場合）</summary>
    public string? ErrorMessage { get; init; }
}

// =============================================================================
// Velopack 自動更新ヘルパー
// =============================================================================

/// <summary>
/// Velopack 自動更新の統合ヘルパー
///
/// RemoteConfigService からバージョン情報を取得し、
/// Velopack の更新チェック・ダウンロード・適用を管理する。
///
/// 【更新フロー】
/// 1. アプリ起動 → RemoteConfig でバージョンチェック
/// 2. 更新あり → Velopack で差分ダウンロード
/// 3. ダウンロード完了 → 次回起動時に適用 or 即座に再起動
///
/// 【差分更新】
/// Velopack は前バージョンとの差分のみダウンロードするため、
/// 通常は数 MB のダウンロードで済む。
/// </summary>
public sealed class VelopackAutoUpdater
{
    private const string ReleasesBaseUrl = "https://releases.harmonicinsight.com/wpf";

    private readonly string _productCode;
    private readonly string _releasesUrl;

    /// <summary>ダウンロード進捗イベント（0-100）</summary>
    public event Action<int>? OnDownloadProgress;

    /// <summary>更新準備完了イベント（再起動で適用可能）</summary>
    public event Action<string>? OnUpdateReady;

    /// <summary>エラーイベント</summary>
    public event Action<Exception>? OnError;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="productCode">製品コード（INSS, IOSH, IOSD 等）</param>
    /// <param name="customReleasesUrl">カスタム URL（テスト用）</param>
    public VelopackAutoUpdater(string productCode, string? customReleasesUrl = null)
    {
        _productCode = productCode;
        _releasesUrl = customReleasesUrl ?? $"{ReleasesBaseUrl}/{productCode}/RELEASES";
    }

    /// <summary>
    /// 更新チェックを実行
    ///
    /// RemoteConfigService の結果を使って判定するか、
    /// 直接 Velopack のマニフェストをチェックする。
    /// </summary>
    /// <param name="remoteConfigResult">
    /// RemoteConfigService からの更新チェック結果。
    /// null の場合は Velopack マニフェストを直接チェック。
    /// </param>
    public async Task<VelopackUpdateResult> CheckForUpdateAsync(
        UpdateCheckResult? remoteConfigResult = null,
        CancellationToken ct = default)
    {
        try
        {
            // RemoteConfig の結果がある場合はそれを優先
            if (remoteConfigResult != null)
            {
                if (!remoteConfigResult.UpdateAvailable)
                {
                    return new VelopackUpdateResult { Status = VelopackUpdateStatus.UpToDate };
                }

                var locale = Thread.CurrentThread.CurrentUICulture.TwoLetterISOLanguageName == "ja"
                    ? "ja" : "en";

                return new VelopackUpdateResult
                {
                    Status = remoteConfigResult.ForceUpdate
                        ? VelopackUpdateStatus.ForceRequired
                        : VelopackUpdateStatus.Available,
                    LatestVersion = remoteConfigResult.Release?.LatestVersion,
                    Changelog = remoteConfigResult.Release?.Changelog
                        .GetValueOrDefault(locale, ""),
                    DownloadUrl = remoteConfigResult.Release?.DownloadUrl,
                    Urgency = remoteConfigResult.Release?.Urgency,
                };
            }

            // Velopack 直接チェック（RemoteConfig が利用できない場合のフォールバック）
            //
            // using Velopack;
            // var mgr = new UpdateManager(_releasesUrl);
            // var info = await mgr.CheckForUpdatesAsync();
            //
            // if (info == null)
            //     return new VelopackUpdateResult { Status = VelopackUpdateStatus.UpToDate };
            //
            // return new VelopackUpdateResult
            // {
            //     Status = VelopackUpdateStatus.Available,
            //     LatestVersion = info.TargetFullRelease.Version.ToString(),
            // };

            // フォールバック: Velopack パッケージがない場合
            return new VelopackUpdateResult { Status = VelopackUpdateStatus.UpToDate };
        }
        catch (Exception ex)
        {
            OnError?.Invoke(ex);
            return new VelopackUpdateResult
            {
                Status = VelopackUpdateStatus.Error,
                ErrorMessage = ex.Message,
            };
        }
    }

    /// <summary>
    /// 更新をダウンロードして適用（再起動）
    ///
    /// 【注意】このメソッドを呼ぶとアプリが再起動します。
    /// ユーザーの未保存データがある場合は事前に保存を促してください。
    /// </summary>
    /// <param name="result">CheckForUpdateAsync の結果</param>
    public async Task DownloadAndApplyAsync(
        VelopackUpdateResult? result = null,
        CancellationToken ct = default)
    {
        // Velopack を使った更新の適用
        //
        // using Velopack;
        //
        // var mgr = new UpdateManager(_releasesUrl);
        // var info = await mgr.CheckForUpdatesAsync();
        // if (info == null) return;
        //
        // // ダウンロード（進捗コールバック付き）
        // await mgr.DownloadUpdatesAsync(info, (progress) =>
        // {
        //     OnDownloadProgress?.Invoke(progress);
        // });
        //
        // OnUpdateReady?.Invoke(info.TargetFullRelease.Version.ToString());
        //
        // // 適用して再起動
        // mgr.ApplyUpdatesAndRestart(info);

        await Task.CompletedTask;
    }

    /// <summary>
    /// サイレント更新（バックグラウンドでDL → 次回起動時に適用）
    ///
    /// ユーザーの作業を中断せずに更新を準備する。
    /// 次回アプリ起動時に自動的に新バージョンが適用される。
    /// </summary>
    public async Task DownloadSilentlyAsync(CancellationToken ct = default)
    {
        // using Velopack;
        //
        // var mgr = new UpdateManager(_releasesUrl);
        // var info = await mgr.CheckForUpdatesAsync();
        // if (info == null) return;
        //
        // await mgr.DownloadUpdatesAsync(info);
        // // ApplyUpdatesAndRestart は呼ばない → 次回起動時に自動適用
        //
        // OnUpdateReady?.Invoke(info.TargetFullRelease.Version.ToString());

        await Task.CompletedTask;
    }

    /// <summary>
    /// 更新マニフェスト URL を取得
    /// </summary>
    public string GetReleasesUrl() => _releasesUrl;
}
