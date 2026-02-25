using System.IO;
using System.Linq;
using System.Text.Json.Serialization;

namespace HarmonicTools.AppManager.Models;

/// <summary>
/// ビルド設定の定数
/// </summary>
public static class BuildConstants
{
    /// <summary>ターゲットフレームワーク</summary>
    public const string TargetFramework = "net8.0-windows";

    /// <summary>ランタイム識別子</summary>
    public const string RuntimeIdentifier = "win-x64";
}

/// <summary>
/// アプリの種別
/// </summary>
public enum AppType
{
    /// <summary>デスクトップアプリ（WPF / Python 等）</summary>
    Desktop,
    /// <summary>Webアプリ（Next.js / React 等の製品）</summary>
    WebApp,
    /// <summary>Webサイト（コーポレートサイト・ブログ・ドキュメント等）</summary>
    Website,
    /// <summary>スマホアプリ（Android / iOS / クロスプラットフォーム）</summary>
    MobileApp
}

/// <summary>
/// 管理対象アプリの定義
/// </summary>
public class AppDefinition
{
    public string Name { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string SolutionPath { get; set; } = string.Empty;
    public string ProjectPath { get; set; } = string.Empty;
    public string TestProjectPath { get; set; } = string.Empty;
    public string ExeRelativePath { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// アプリの種別（Desktop / WebApp）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AppType Type { get; set; } = AppType.Desktop;

    /// <summary>
    /// dotnet 以外のビルドコマンド（例: "build.bat"）。空なら dotnet build を使用。
    /// </summary>
    public string BuildCommand { get; set; } = string.Empty;

    /// <summary>
    /// 最後にリリースしたタグ（例: "INBT-v1.0.0"）。リリース成功時に保存。
    /// </summary>
    public string LastReleasedTag { get; set; } = string.Empty;

    /// <summary>
    /// インストーラー出力ディレクトリ（BasePath からの相対パス、例: "Output"）
    /// build.ps1 が Inno Setup で生成した exe が格納されるフォルダ
    /// </summary>
    public string InstallerDir { get; set; } = string.Empty;

    // ── Web App 専用フィールド ──

    /// <summary>
    /// 開発サーバー起動コマンド（例: "npm run dev"）
    /// </summary>
    public string DevCommand { get; set; } = string.Empty;

    /// <summary>
    /// 開発サーバーURL（例: "http://localhost:3000"）
    /// </summary>
    public string DevUrl { get; set; } = string.Empty;

    /// <summary>
    /// ビルドコマンド（Web用、例: "npm run build"）
    /// </summary>
    public string WebBuildCommand { get; set; } = string.Empty;

    /// <summary>
    /// 本番URL（例: "https://h-insight.jp"）
    /// </summary>
    public string ProductionUrl { get; set; } = string.Empty;

    /// <summary>
    /// フレームワーク（例: "Next.js", "React"）
    /// </summary>
    public string Framework { get; set; } = string.Empty;

    // ── Mobile App 専用フィールド ──

    /// <summary>
    /// モバイルプラットフォーム（例: "Android", "iOS", "Cross-platform"）
    /// </summary>
    public string MobilePlatform { get; set; } = string.Empty;

    /// <summary>
    /// バンドルID / パッケージ名（例: "com.harmonicinsight.insightmobile"）
    /// </summary>
    public string BundleId { get; set; } = string.Empty;

    /// <summary>
    /// ストアURL（Play Store / App Store）
    /// </summary>
    public string StoreUrl { get; set; } = string.Empty;

    /// <summary>
    /// Webアプリかどうか
    /// </summary>
    [JsonIgnore]
    public bool IsWebApp => Type == AppType.WebApp;

    /// <summary>
    /// Webサイトかどうか
    /// </summary>
    [JsonIgnore]
    public bool IsWebSite => Type == AppType.Website;

    /// <summary>
    /// Web系（WebApp または Website）かどうか
    /// </summary>
    [JsonIgnore]
    public bool IsWebBased => Type == AppType.WebApp || Type == AppType.Website;

    /// <summary>
    /// スマホアプリかどうか
    /// </summary>
    [JsonIgnore]
    public bool IsMobileApp => Type == AppType.MobileApp;

    /// <summary>
    /// dotnet プロジェクトかどうか
    /// </summary>
    [JsonIgnore]
    public bool IsDotNet => !string.IsNullOrEmpty(ProjectPath) && !IsWebBased;

    /// <summary>
    /// 解決済みのソリューション絶対パス
    /// </summary>
    [JsonIgnore]
    public string ResolvedSolutionPath => string.IsNullOrEmpty(BasePath)
        ? SolutionPath
        : Path.Combine(BasePath, SolutionPath);

    /// <summary>
    /// 解決済みのプロジェクト絶対パス
    /// </summary>
    [JsonIgnore]
    public string ResolvedProjectPath => string.IsNullOrEmpty(BasePath)
        ? ProjectPath
        : Path.Combine(BasePath, ProjectPath);

    /// <summary>
    /// 解決済みのテストプロジェクト絶対パス
    /// </summary>
    [JsonIgnore]
    public string ResolvedTestProjectPath => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(TestProjectPath)
        ? TestProjectPath
        : Path.Combine(BasePath, TestProjectPath);

    /// <summary>
    /// ベースパス（リポジトリルート）
    /// </summary>
    public string BasePath { get; set; } = string.Empty;

    /// <summary>
    /// Debug exe パス
    /// </summary>
    [JsonIgnore]
    public string DebugExePath => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath)
        ? string.Empty
        : Path.Combine(BasePath, ExeRelativePath.Replace("{config}", "Debug"));

    /// <summary>
    /// Release exe パス
    /// </summary>
    [JsonIgnore]
    public string ReleaseExePath => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath)
        ? string.Empty
        : Path.Combine(BasePath, ExeRelativePath.Replace("{config}", "Release"));

    /// <summary>
    /// Self-contained publish exe パス (win-x64)
    /// build.ps1 がある場合は {BasePath}/publish/{exeName} を使用
    /// </summary>
    [JsonIgnore]
    public string PublishExePath
    {
        get
        {
            if (string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath))
                return string.Empty;
            var exeName = Path.GetFileName(ExeRelativePath.Replace("{config}", "Release"));

            // build.ps1 がある場合は /publish フォルダを使用
            if (HasBuildScript)
            {
                return Path.Combine(BasePath, "publish", exeName);
            }

            // dotnet publish のデフォルト出力先
            if (string.IsNullOrEmpty(ProjectPath))
                return string.Empty;
            var projectDir = Path.GetDirectoryName(ResolvedProjectPath) ?? "";
            return Path.Combine(projectDir, "bin", "Release", BuildConstants.TargetFramework, BuildConstants.RuntimeIdentifier, "publish", exeName);
        }
    }

    /// <summary>
    /// build.ps1 等のビルドスクリプトがあるか
    /// </summary>
    [JsonIgnore]
    public bool HasBuildScript => !string.IsNullOrEmpty(BuildCommand);

    /// <summary>
    /// インストーラー出力ディレクトリの絶対パス
    /// </summary>
    [JsonIgnore]
    public string ResolvedInstallerDir => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(InstallerDir)
        ? string.Empty
        : Path.Combine(BasePath, InstallerDir);

    /// <summary>
    /// インストーラー exe を検索して最新のものを返す
    /// </summary>
    [JsonIgnore]
    public string? LatestInstallerExe
    {
        get
        {
            var dir = ResolvedInstallerDir;
            if (string.IsNullOrEmpty(dir) || !Directory.Exists(dir)) return null;
            return Directory.GetFiles(dir, "*Setup*.exe")
                .Concat(Directory.GetFiles(dir, "*Installer*.exe"))
                .Select(f => new FileInfo(f))
                .OrderByDescending(f => f.LastWriteTime)
                .FirstOrDefault()?.FullName;
        }
    }

    /// <summary>
    /// 配布用 exe パス（dotnet: PublishExePath, 非dotnet: ExeRelativePath ベース）
    /// </summary>
    [JsonIgnore]
    public string DistExePath
    {
        get
        {
            if (IsDotNet) return PublishExePath;
            if (string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath)) return string.Empty;
            return Path.Combine(BasePath, ExeRelativePath);
        }
    }

    [JsonIgnore]
    public string StatusIcon
    {
        get
        {
            var released = !string.IsNullOrEmpty(LastReleasedTag);

            // Web 系の場合
            if (IsWebBased)
            {
                var hasUrl = !string.IsNullOrEmpty(ProductionUrl);
                string status;
                if (released) status = "★ デプロイ済";
                else if (hasUrl) status = "● 公開中";
                else status = "○ 開発中";

                var version = released ? LastReleasedTag : ProductCode;
                return $"{version}  {status}";
            }

            // スマホアプリの場合
            if (IsMobileApp)
            {
                var hasStore = !string.IsNullOrEmpty(StoreUrl);
                string status;
                if (released) status = "★ リリース済";
                else if (hasStore) status = "● 公開中";
                else status = "○ 開発中";

                var version = released ? LastReleasedTag : ProductCode;
                return $"{version}  {status}";
            }

            var hasInstaller = LatestInstallerExe != null;

            // ビルド状態を判定
            string desktopStatus;
            if (!IsDotNet)
            {
                var hasDist = !string.IsNullOrEmpty(DistExePath) && File.Exists(DistExePath);
                if (released) desktopStatus = "★ リリース済";
                else if (hasInstaller) desktopStatus = "● インストーラー有";
                else if (hasDist) desktopStatus = "● 配布可";
                else desktopStatus = "○ 未ビルド";
            }
            else
            {
                var hasPublish = !string.IsNullOrEmpty(PublishExePath) && File.Exists(PublishExePath);
                var hasRelease = !string.IsNullOrEmpty(ReleaseExePath) && File.Exists(ReleaseExePath);

                if (released) desktopStatus = "★ リリース済";
                else if (hasInstaller) desktopStatus = "● インストーラー有";
                else if (hasPublish) desktopStatus = "● 配布可";
                else if (hasRelease) desktopStatus = "◐ ビルド済";
                else desktopStatus = "○ 未ビルド";
            }

            // バージョン表示: リリース済みならタグ、それ以外は製品コード
            var version2 = released ? LastReleasedTag : ProductCode;
            return $"{version2}  {desktopStatus}";
        }
    }

    public override string ToString() => $"{Name} ({ProductCode})";
}
