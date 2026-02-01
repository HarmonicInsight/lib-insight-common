using System.IO;

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
    /// 公開用リポジトリ名（GitHub Releases 配布先）
    /// 例: "HarmonicInsight/harmonic-sheet"
    /// 空の場合はリリース機能を使用不可
    /// </summary>
    public string PublicRepo { get; set; } = string.Empty;

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

    public override string ToString() => $"{Name} ({ProductCode})";
}
