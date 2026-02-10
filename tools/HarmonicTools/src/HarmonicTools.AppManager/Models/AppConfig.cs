using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace HarmonicTools.AppManager.Models;

/// <summary>
/// アプリ管理設定の永続化
/// </summary>
public class AppConfig
{
    /// <summary>
    /// 設定バージョン。製品一覧が更新された際にインクリメントする。
    /// バージョン不一致時はデフォルトのアプリ一覧で上書きされる。
    /// </summary>
    public int ConfigVersion { get; set; }

    /// <summary>現在の設定バージョン（アプリ一覧を更新したらインクリメント）</summary>
    private const int CurrentConfigVersion = 7;

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
                var config = JsonSerializer.Deserialize<AppConfig>(json);
                if (config != null)
                {
                    if (config.ConfigVersion < CurrentConfigVersion)
                    {
                        config = MigrateApps(config);
                        config.Save();
                    }

                    // 型の整合性チェック（旧バージョンからの移行漏れ対策）
                    EnsureCorrectTypes(config);

                    return config;
                }
            }
        }
        catch { }
        return CreateDefault();
    }

    /// <summary>
    /// デフォルト定義に基づいてアプリの Type および Web 固有フィールドを補完する。
    /// config.json に保存された値が不正・未設定の場合（旧バージョンからの移行漏れ等）のフォールバック。
    /// </summary>
    private static void EnsureCorrectTypes(AppConfig config)
    {
        var defaults = CreateDefault();
        var defaultsByCode = defaults.Apps.ToDictionary(a => a.ProductCode);
        var needsSave = false;

        foreach (var app in config.Apps)
        {
            if (!defaultsByCode.TryGetValue(app.ProductCode, out var def))
                continue;

            // Type の修正
            if (app.Type != def.Type)
            {
                app.Type = def.Type;
                needsSave = true;
            }

            // Web 系フィールドの補完（空の場合のみデフォルトで埋める）
            if (def.IsWebBased)
            {
                if (string.IsNullOrEmpty(app.Framework) && !string.IsNullOrEmpty(def.Framework))
                    { app.Framework = def.Framework; needsSave = true; }
                if (string.IsNullOrEmpty(app.DevCommand) && !string.IsNullOrEmpty(def.DevCommand))
                    { app.DevCommand = def.DevCommand; needsSave = true; }
                if (string.IsNullOrEmpty(app.WebBuildCommand) && !string.IsNullOrEmpty(def.WebBuildCommand))
                    { app.WebBuildCommand = def.WebBuildCommand; needsSave = true; }
                if (string.IsNullOrEmpty(app.DevUrl) && !string.IsNullOrEmpty(def.DevUrl))
                    { app.DevUrl = def.DevUrl; needsSave = true; }
                if (string.IsNullOrEmpty(app.ProductionUrl) && !string.IsNullOrEmpty(def.ProductionUrl))
                    { app.ProductionUrl = def.ProductionUrl; needsSave = true; }
            }
        }

        if (needsSave)
            config.Save();
    }

    /// <summary>
    /// 古い設定のアプリ一覧を最新のデフォルトで更新する。
    ///
    /// 方針:
    /// - Name・Description のみデフォルトから更新（製品名・説明の変更を反映）
    /// - パス系（BasePath, SolutionPath, ProjectPath, ExeRelativePath 等）は
    ///   ユーザー環境固有のためすべて保持
    /// - デフォルトに存在しない新製品は末尾に追加
    /// - 廃止された製品コードは除外
    /// </summary>
    private static AppConfig MigrateApps(AppConfig old)
    {
        var defaults = CreateDefault();
        var defaultsByCode = defaults.Apps.ToDictionary(a => a.ProductCode);

        // 廃止された製品コード（リネーム・統合で不要になったもの）
        var removedCodes = new HashSet<string> { "FGIN", "IODX", "HMSH", "HMDC", "INSL" };

        // 既存アプリの Name・Description を更新（パス系はそのまま保持）
        var migratedApps = new List<AppDefinition>();
        var seenCodes = new HashSet<string>();
        foreach (var app in old.Apps)
        {
            // 廃止コードはスキップ
            if (removedCodes.Contains(app.ProductCode))
                continue;

            // 同一 ProductCode の重複はスキップ（最初の1つだけ保持）
            if (!seenCodes.Add(app.ProductCode))
                continue;

            if (defaultsByCode.TryGetValue(app.ProductCode, out var def))
            {
                // デフォルトに存在する製品 → Name・Description・Type を更新
                app.Name = def.Name;
                app.Description = def.Description;
                app.Type = def.Type;

                // Web 系固有フィールドはデフォルトから補完（ユーザー未設定の場合のみ）
                if (def.IsWebBased)
                {
                    if (string.IsNullOrEmpty(app.Framework)) app.Framework = def.Framework;
                    if (string.IsNullOrEmpty(app.DevCommand)) app.DevCommand = def.DevCommand;
                    if (string.IsNullOrEmpty(app.WebBuildCommand)) app.WebBuildCommand = def.WebBuildCommand;
                    if (string.IsNullOrEmpty(app.DevUrl)) app.DevUrl = def.DevUrl;
                    if (string.IsNullOrEmpty(app.ProductionUrl)) app.ProductionUrl = def.ProductionUrl;
                }
            }

            migratedApps.Add(app);
        }

        // デフォルトにあるが旧設定に存在しなかった新製品を末尾に追加
        foreach (var def in defaults.Apps)
        {
            if (!seenCodes.Contains(def.ProductCode))
                migratedApps.Add(def);
        }

        return new AppConfig
        {
            ConfigVersion = CurrentConfigVersion,
            Apps = migratedApps,
            LastSelectedApp = old.LastSelectedApp,
        };
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
            ConfigVersion = CurrentConfigVersion,
            Apps = new List<AppDefinition>
            {
                // ══════════════════════════════════════════════════════
                // Tier 1: 業務変革ツール（年額 98万〜398万円）
                // ══════════════════════════════════════════════════════
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
                    Description = "[Tier1] RPA・ローコードのマイグレーション自動化ツール"
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
                    Description = "[Tier1] AIエディタ搭載 — 業務最適化RPA製品"
                },

                // ══════════════════════════════════════════════════════
                // Tier 2: AI活用ツール（年額 48万〜198万円）
                // ══════════════════════════════════════════════════════
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
                    Description = "[Tier2] 画像とテキストから動画を自動作成"
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
                    Description = "[Tier2] 業務資料向けAI画像の大量自動生成ツール"
                },

                // ══════════════════════════════════════════════════════
                // Tier 3: InsightOffice Suite（年額 3.98万〜4.98万円/人）
                // ══════════════════════════════════════════════════════
                new()
                {
                    Name = "InsightOfficeSlide",
                    ProductCode = "INSS",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-slide-win-C"),
                    SolutionPath = "InsightOfficeSlide.sln",
                    ProjectPath = @"src\InsightOfficeSlide\InsightOfficeSlide.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"src\InsightOfficeSlide\bin\{config}\net8.0-windows\InsightOfficeSlide.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "[Tier3] AIアシスタント搭載 — PowerPointテキスト抽出・レビューツール"
                },
                new()
                {
                    Name = "InsightOfficeSheet",
                    ProductCode = "IOSH",
                    BasePath = Path.Combine(DefaultDevRoot, "app-Insight-excel"),
                    SolutionPath = "InsightOfficeSheet.sln",
                    ProjectPath = @"src\InsightOfficeSheet.App\InsightOfficeSheet.App.csproj",
                    TestProjectPath = @"tests\InsightOfficeSheet.Core.Tests\InsightOfficeSheet.Core.Tests.csproj",
                    ExeRelativePath = @"src\InsightOfficeSheet.App\bin\{config}\net8.0-windows\InsightOfficeSheet.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "[Tier3] AIアシスタント搭載 — 経営数値管理・予実管理・計画シミュレーション"
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
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "[Tier3] AIアシスタント搭載 — 参照資料付きWord文書管理ツール"
                },
                new()
                {
                    Name = "InsightPy",
                    ProductCode = "INPY",
                    BasePath = Path.Combine(DefaultDevRoot, "app-insight-py-win"),
                    SolutionPath = "",
                    ProjectPath = "",
                    TestProjectPath = "",
                    ExeRelativePath = @"dist\InsightPy.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "[Tier3] AIエディタ搭載 — 業務調査・データ収集のためのPython実行基盤"
                },

                // ══════════════════════════════════════════════════════
                // Tier 4: シニア向け社会貢献ツール（年額 0.98万円/人）
                // ══════════════════════════════════════════════════════
                new()
                {
                    Name = "InsightSeniorOffice",
                    ProductCode = "ISOF",
                    BasePath = Path.Combine(DefaultDevRoot, "app-harmonic-sheet"),
                    SolutionPath = "InsightSeniorOffice.sln",
                    ProjectPath = @"src\InsightSeniorOffice\InsightSeniorOffice.csproj",
                    TestProjectPath = "",
                    ExeRelativePath = @"src\InsightSeniorOffice\bin\{config}\net8.0-windows\InsightSeniorOffice.exe",
                    BuildCommand = "build.ps1",
                    InstallerDir = "Output",
                    Description = "[Tier4] AIアシスタント搭載 — シニア向け統合オフィスツール"
                },

                // ══════════════════════════════════════════════════════
                // Web アプリ（製品 Web 版）
                // ══════════════════════════════════════════════════════
                new()
                {
                    Name = "InterviewInsight",
                    ProductCode = "IVIN",
                    Type = AppType.WebApp,
                    BasePath = Path.Combine(DefaultDevRoot, "app-auto-interview-web"),
                    Description = "[Tier1] 自動ヒアリング・業務調査支援",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3010",
                },
                new()
                {
                    Name = "InsightProcess",
                    ProductCode = "INPR",
                    Type = AppType.WebApp,
                    BasePath = Path.Combine(DefaultDevRoot, "Insight-Process"),
                    Description = "業務プロセス可視化・DX評価ツール",
                    Framework = "React + Vite",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:5173",
                },

                // ── Webサイト ──
                new()
                {
                    Name = "Harmonic Insight",
                    ProductCode = "WEB-HOME",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "web-home"),
                    Description = "コーポレートサイト",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3000",
                    ProductionUrl = "https://h-insight.jp",
                },
                new()
                {
                    Name = "Insight Series",
                    ProductCode = "WEB-INSIGHT",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "web-insight"),
                    Description = "Insight Series 製品ページ",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3001",
                    ProductionUrl = "https://insight.h-insight.jp",
                },
                new()
                {
                    Name = "Framework",
                    ProductCode = "WEB-FW",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "web-framework"),
                    Description = "ビジネスフレームワーク集",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3002",
                    ProductionUrl = "https://framework.h-insight.jp",
                },
                new()
                {
                    Name = "Blog",
                    ProductCode = "WEB-BLOG",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "web-blog"),
                    Description = "技術・ビジネスブログ",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3003",
                    ProductionUrl = "https://blog.h-insight.jp",
                },
                new()
                {
                    Name = "Documentation",
                    ProductCode = "WEB-DOCS",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "web-docs"),
                    Description = "製品マニュアル・APIリファレンス",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3004",
                    ProductionUrl = "https://docs.h-insight.jp",
                },
                new()
                {
                    Name = "Support",
                    ProductCode = "WEB-SUP",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "web-support"),
                    Description = "お問い合わせ・ヘルプセンター",
                    Framework = "Next.js",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:3005",
                    ProductionUrl = "https://support.h-insight.jp",
                },
                new()
                {
                    Name = "License Server",
                    ProductCode = "WEB-LIC",
                    Type = AppType.Website,
                    BasePath = Path.Combine(DefaultDevRoot, "app-license-server"),
                    Description = "統合ライセンスサーバー (Hono)",
                    Framework = "Hono",
                    DevCommand = "npm run dev",
                    WebBuildCommand = "npm run build",
                    DevUrl = "http://localhost:8787",
                    ProductionUrl = "https://license.harmonicinsight.com",
                },
            }
        };
    }
}
