using System.IO;
using System.Text.Json;

namespace HarmonicTools.AppManager.Models;

/// <summary>
/// アプリ管理設定の永続化
/// </summary>
public class AppConfig
{
    public List<AppDefinition> Apps { get; set; } = new();
    public string? LastSelectedApp { get; set; }

    private static readonly string ConfigDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "HarmonicInsight", "AppManager");

    private static readonly string ConfigFile = Path.Combine(ConfigDir, "config.json");

    public static AppConfig Load()
    {
        try
        {
            if (File.Exists(ConfigFile))
            {
                var json = File.ReadAllText(ConfigFile);
                return JsonSerializer.Deserialize<AppConfig>(json) ?? CreateDefault();
            }
        }
        catch { }
        return CreateDefault();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(ConfigDir);
            var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(ConfigFile, json);
        }
        catch { }
    }

    /// <summary>
    /// デフォルトの開発ルートディレクトリ（C:\dev）
    /// 各アプリの BasePath = DevRoot + リポジトリフォルダ名
    /// </summary>
    private const string DefaultDevRoot = @"C:\dev";

    /// <summary>
    /// 統合リリースリポジトリ（全製品共通）
    /// タグ形式: {ProductCode}-v{Version} (例: INBT-v1.0.0)
    /// </summary>
    public const string ReleaseRepo = "HarmonicInsight/releases";

    public static AppConfig CreateDefault()
    {
        return new AppConfig
        {
            Apps = new List<AppDefinition>
            {
                // ── 【A】コンサルティング連動型 ──
                new()
                {
                    Name = "InsightNoCodeAnalyzer",
                    ProductCode = "INCA",
                    BasePath = Path.Combine(DefaultDevRoot, "app-nocode-analyzer-C"),
                    SolutionPath = "InsightNoCodeAnalyzer.sln",
                    ProjectPath = "InsightNoCodeAnalyzer/InsightNoCodeAnalyzer.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "InsightNoCodeAnalyzer/bin/{config}/net8.0-windows/InsightNoCodeAnalyzer.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "RPA・ローコード解析・移行アセスメントツール"
                },
                new()
                {
                    Name = "InsightBot",
                    ProductCode = "INBT",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-bot-C"),
                    SolutionPath = @"csharp\InsightBotRPA.sln",
                    ProjectPath = @"csharp\src\InsightBotRPA.Studio\InsightBotRPA.Studio.csproj",
                    TestProjectPath = @"csharp\tests\InsightBotRPA.Core.Tests\InsightBotRPA.Core.Tests.csproj",
                    ExeRelativePath = @"csharp\src\InsightBotRPA.Studio\bin\{config}\net8.0-windows\InsightBotRPA.Studio.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "Python RPA自動化ボット"
                },
                new()
                {
                    Name = "ForguncyInsight",
                    ProductCode = "FGIN",
                    BasePath = Path.Combine(DefaultDevRoot, "app-win-insight-forguncy"),
                    SolutionPath = "ForguncyInsight.sln",
                    ProjectPath = @"ForguncyInsight\ForguncyInsight.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"ForguncyInsight\bin\{config}\net8.0-windows\ForguncyInsight.exe",
                    Description = "Forguncy連携・分析ツール"
                },
                new()
                {
                    Name = "InterviewInsight",
                    ProductCode = "IVIN",
                    BasePath = Path.Combine(DefaultDevRoot, "app-auto-interview-web"),
                    SolutionPath = "",
                    ProjectPath = "",
                    TestProjectPath = "",
                    ExeRelativePath = "",
                    Description = "AIステークホルダーヒアリング・業務調査支援（Web）"
                },

                // ── Content Creation ──
                new()
                {
                    Name = "InsightMovie",
                    ProductCode = "INMV",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-movie-gen-win-C"),
                    SolutionPath = "InsightMovie.sln",
                    ProjectPath = @"InsightMovie\InsightMovie.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"InsightMovie\bin\{config}\net8.0-windows\InsightMovie.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "画像・テキスト・PPTからAI動画作成"
                },
                new()
                {
                    Name = "InsightImageGen",
                    ProductCode = "INIG",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-image-gen-C"),
                    SolutionPath = "InsightMediaGenerator.sln",
                    ProjectPath = @"InsightMediaGenerator\InsightMediaGenerator.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"InsightMediaGenerator\bin\{config}\net8.0-windows\InsightMediaGenerator.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "AI画像・音声生成ツール（Stable Diffusion・VOICEVOX）"
                },

                // ── InsightOffice Suite（各製品は独立リポ + 共通ライブラリ）──
                new()
                {
                    Name = "InsightOfficeSheet",
                    ProductCode = "IOSH",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-excel"),
                    SolutionPath = "InsightOfficeSheet.sln",
                    ProjectPath = @"src\InsightOfficeSheet.App\InsightOfficeSheet.App.csproj",
                    TestProjectPath = @"tests\InsightOfficeSheet.Core.Tests\InsightOfficeSheet.Core.Tests.csproj",
                    ExeRelativePath = @"src\InsightOfficeSheet.App\bin\{config}\net8.0-windows\InsightOfficeSheet.exe",
                    Description = "AI版管理付きスプレッドシート（Sheet専用リポ）"
                },
                new()
                {
                    Name = "InsightOfficeDoc",
                    ProductCode = "IOSD",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-doc"),
                    SolutionPath = "InsightOfficeDoc.sln",
                    ProjectPath = @"src\InsightOfficeDoc.App\InsightOfficeDoc.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"src\InsightOfficeDoc.App\bin\{config}\net8.0-windows\InsightOfficeDoc.exe",
                    Description = "AIドキュメント校正・バージョン管理（Doc専用リポ）"
                },
                new()
                {
                    Name = "InsightOfficeSlide",
                    ProductCode = "INSS",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-slide"),
                    SolutionPath = "InsightOfficeSlide.sln",
                    ProjectPath = @"src\InsightOfficeSlide\InsightOfficeSlide.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"src\InsightOfficeSlide\bin\{config}\net8.0-windows\InsightOfficeSlide.exe",
                    Description = "AIスライドレビュー・バージョン管理（Slide専用リポ）"
                },

                // ── Automation ──
                new()
                {
                    Name = "InsightPy",
                    ProductCode = "INPY",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-py-win"),
                    SolutionPath = "",
                    ProjectPath = "",
                    TestProjectPath = "",
                    ExeRelativePath = @"dist\InsightPy.exe",
                    BuildCommand = "build.bat",
                    Description = "Windows自動化のためのPython実行環境（PyInstaller）"
                },
            }
        };
    }
}
