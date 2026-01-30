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
                new()
                {
                    Name = "HarmonicSheet",
                    ProductCode = "HMSH",
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicSheet.App/HarmonicSheet.App.csproj",
                    TestProjectPath = "tests/HarmonicSheet.Core.Tests",
                    ExeRelativePath = "src/HarmonicSheet.App/bin/{config}/net8.0-windows/HarmonicSheet.App.exe",
                    Description = "Excel 操作ツール"
                },
                new()
                {
                    Name = "HarmonicDoc",
                    ProductCode = "HMDC",
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicDoc.App/HarmonicDoc.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/HarmonicDoc.App/bin/{config}/net8.0-windows/HarmonicDoc.App.exe",
                    Description = "Word 操作ツール"
                },
                new()
                {
                    Name = "HarmonicSlide",
                    ProductCode = "HMSL",
                    SolutionPath = "HarmonicSheet.sln",
                    ProjectPath = "src/HarmonicSlide.App/HarmonicSlide.App.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = "src/HarmonicSlide.App/bin/{config}/net8.0-windows/HarmonicSlide.App.exe",
                    Description = "PowerPoint 操作ツール"
                }
            }
        };
    }
}
