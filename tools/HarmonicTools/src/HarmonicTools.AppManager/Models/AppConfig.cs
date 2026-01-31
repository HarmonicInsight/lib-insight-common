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

    public static AppConfig CreateDefault()
    {
        return new AppConfig
        {
            Apps = new List<AppDefinition>
            {
                // ── Harmonic シリーズ（HarmonicSheet ソリューション）──
                new()
                {
                    Name = "HarmonicSheet",
                    ProductCode = "HMSH",
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicSheet.App/HarmonicSheet.App.csproj",
                    TestProjectPath = "tests/HarmonicSheet.Core.Tests",
                    ExeRelativePath = "src/HarmonicSheet.App/bin/{config}/net8.0-windows/HarmonicSheet.App.exe",
                    Description = "Excel 操作ツール（セル編集・数式・マクロ対応）"
                },
                new()
                {
                    Name = "HarmonicDoc",
                    ProductCode = "HMDC",
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicDoc.App/HarmonicDoc.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/HarmonicDoc.App/bin/{config}/net8.0-windows/HarmonicDoc.App.exe",
                    Description = "Word 操作ツール（文書解析・テンプレート処理）"
                },
                new()
                {
                    Name = "HarmonicSlide",
                    ProductCode = "HMSL",
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicSlide.App/HarmonicSlide.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/HarmonicSlide.App/bin/{config}/net8.0-windows/HarmonicSlide.App.exe",
                    Description = "PowerPoint 操作ツール（スライド編集・変換）"
                },

                // ── Insight シリーズ（config/products.ts 登録製品）──
                new()
                {
                    Name = "InsightSlide",
                    ProductCode = "INSS",
                    SolutionPath = "InsightSlide.sln",
                    ProjectPath = "src/InsightSlide.App/InsightSlide.App.csproj",
                    TestProjectPath = "tests/InsightSlide.Core.Tests",
                    ExeRelativePath = "src/InsightSlide.App/bin/{config}/net8.0-windows/InsightSlide.App.exe",
                    Description = "PowerPoint コンテンツ抽出・更新ツール"
                },
                new()
                {
                    Name = "InsightMovie",
                    ProductCode = "INMV",
                    SolutionPath = "InsightMovie.sln",
                    ProjectPath = "src/InsightMovie.App/InsightMovie.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/InsightMovie.App/bin/{config}/net8.0-windows/InsightMovie.App.exe",
                    Description = "画像・テキスト・PPT から AI 動画作成"
                },
                new()
                {
                    Name = "InsightBot",
                    ProductCode = "INBT",
                    SolutionPath = "InsightBot.sln",
                    ProjectPath = "src/InsightBot.App/InsightBot.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/InsightBot.App/bin/{config}/net8.0-windows/InsightBot.App.exe",
                    Description = "Python RPA 自動化ボット"
                },
                new()
                {
                    Name = "InsightNoCodeAnalyzer",
                    ProductCode = "INCA",
                    SolutionPath = "InsightNoCodeAnalyzer.sln",
                    ProjectPath = "src/InsightNoCodeAnalyzer.App/InsightNoCodeAnalyzer.App.csproj",
                    TestProjectPath = "tests/InsightNoCodeAnalyzer.Core.Tests",
                    ExeRelativePath = "src/InsightNoCodeAnalyzer.App/bin/{config}/net8.0-windows/InsightNoCodeAnalyzer.App.exe",
                    Description = "RPA・ローコード解析・移行アセスメントツール"
                },
                new()
                {
                    Name = "InsightImageGen",
                    ProductCode = "INIG",
                    SolutionPath = "InsightImageGen.sln",
                    ProjectPath = "src/InsightImageGen.App/InsightImageGen.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/InsightImageGen.App/bin/{config}/net8.0-windows/InsightImageGen.App.exe",
                    Description = "Stable Diffusion・VOICEVOX AI 画像・音声生成ツール"
                },
            }
        };
    }
}
