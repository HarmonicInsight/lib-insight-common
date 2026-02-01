using System.IO;
using System.Linq;

namespace HarmonicTools.AppManager.Models;

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

    /// <summary>
    /// dotnet プロジェクトかどうか
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public bool IsDotNet => !string.IsNullOrEmpty(ProjectPath);

    /// <summary>
    /// 解決済みのソリューション絶対パス
    /// </summary>
    public string ResolvedSolutionPath => string.IsNullOrEmpty(BasePath)
        ? SolutionPath
        : Path.Combine(BasePath, SolutionPath);

    /// <summary>
    /// 解決済みのプロジェクト絶対パス
    /// </summary>
    public string ResolvedProjectPath => string.IsNullOrEmpty(BasePath)
        ? ProjectPath
        : Path.Combine(BasePath, ProjectPath);

    /// <summary>
    /// 解決済みのテストプロジェクト絶対パス
    /// </summary>
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
    public string DebugExePath => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath)
        ? string.Empty
        : Path.Combine(BasePath, ExeRelativePath.Replace("{config}", "Debug"));

    /// <summary>
    /// Release exe パス
    /// </summary>
    public string ReleaseExePath => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath)
        ? string.Empty
        : Path.Combine(BasePath, ExeRelativePath.Replace("{config}", "Release"));

    /// <summary>
    /// Self-contained publish exe パス (win-x64)
    /// </summary>
    public string PublishExePath
    {
        get
        {
            if (string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ProjectPath) || string.IsNullOrEmpty(ExeRelativePath))
                return string.Empty;
            var projectDir = Path.GetDirectoryName(ResolvedProjectPath) ?? "";
            var exeName = Path.GetFileName(ExeRelativePath.Replace("{config}", "Release"));
            return Path.Combine(projectDir, "bin", "Release", "net8.0-windows", "win-x64", "publish", exeName);
        }
    }

    /// <summary>
    /// build.ps1 等のビルドスクリプトがあるか
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public bool HasBuildScript => !string.IsNullOrEmpty(BuildCommand);

    /// <summary>
    /// インストーラー出力ディレクトリの絶対パス
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public string ResolvedInstallerDir => string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(InstallerDir)
        ? string.Empty
        : Path.Combine(BasePath, InstallerDir);

    /// <summary>
    /// インストーラー exe を検索して最新のものを返す
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
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
    [System.Text.Json.Serialization.JsonIgnore]
    public string DistExePath
    {
        get
        {
            if (IsDotNet) return PublishExePath;
            if (string.IsNullOrEmpty(BasePath) || string.IsNullOrEmpty(ExeRelativePath)) return string.Empty;
            return Path.Combine(BasePath, ExeRelativePath);
        }
    }

    [System.Text.Json.Serialization.JsonIgnore]
    public string StatusIcon
    {
        get
        {
            var released = !string.IsNullOrEmpty(LastReleasedTag);
            var hasInstaller = LatestInstallerExe != null;

            // ビルド状態を判定
            string status;
            if (!IsDotNet)
            {
                var hasDist = !string.IsNullOrEmpty(DistExePath) && File.Exists(DistExePath);
                if (released) status = "★ リリース済";
                else if (hasInstaller) status = "● インストーラー有";
                else if (hasDist) status = "● 配布可";
                else status = "○ 未ビルド";
            }
            else
            {
                var hasPublish = !string.IsNullOrEmpty(PublishExePath) && File.Exists(PublishExePath);
                var hasRelease = !string.IsNullOrEmpty(ReleaseExePath) && File.Exists(ReleaseExePath);

                if (released) status = "★ リリース済";
                else if (hasInstaller) status = "● インストーラー有";
                else if (hasPublish) status = "● 配布可";
                else if (hasRelease) status = "◐ ビルド済";
                else status = "○ 未ビルド";
            }

            // バージョン表示: リリース済みならタグ、それ以外は製品コード
            var version = released ? LastReleasedTag : ProductCode;
            return $"{version}  {status}";
        }
    }

    public override string ToString() => $"{Name} ({ProductCode})";
}
