using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using HarmonicTools.AppManager.Models;

namespace HarmonicTools.AppManager.Services;

/// <summary>
/// アイコンのスキャン・ステータス確認・デプロイ（コピー）を担当するサービス。
///
/// insight-common リポジトリ内の brand/icons/ をマスターソースとして、
/// 各アプリのリポジトリにアイコンが正しく配置されているかを確認する。
/// </summary>
public class IconService
{
    /// <summary>
    /// insight-common リポジトリのルートパス。
    /// App Manager は tools/HarmonicTools/ 配下にいるため、
    /// 実行時に自動検出するか、設定から取得する。
    /// </summary>
    public string? InsightCommonRoot { get; set; }

    /// <summary>
    /// insight-common のルートを自動検出する。
    /// App Manager の exe が tools/HarmonicTools/.../bin/... にいる場合を想定。
    /// </summary>
    public static string? DetectInsightCommonRoot()
    {
        // 実行ファイルの場所から遡って brand/icons/ があるディレクトリを探す
        var dir = AppDomain.CurrentDomain.BaseDirectory;
        for (var i = 0; i < 10; i++)
        {
            var parent = Path.GetDirectoryName(dir);
            if (parent == null) break;
            dir = parent;

            if (Directory.Exists(Path.Combine(dir, "brand", "icons"))
                && File.Exists(Path.Combine(dir, "CLAUDE.md")))
            {
                return dir;
            }
        }

        return null;
    }

    /// <summary>
    /// 全製品のアイコン定義を構築する。
    /// config/app-icons.ts の定義を C# 側にハードコードしたもの。
    ///
    /// TS ファイルのパースは行わず、両者を同期的に管理する。
    /// </summary>
    public List<IconDefinition> BuildIconDefinitions(AppConfig config)
    {
        var definitions = GetAllIconDefinitions();

        // AppConfig から各製品の BasePath を取得してマッピング
        var appsByCode = config.Apps.ToDictionary(a => a.ProductCode, a => a);

        foreach (var def in definitions)
        {
            if (appsByCode.TryGetValue(def.ProductCode, out var app))
            {
                def.AppBasePath = app.BasePath;
            }
        }

        return definitions;
    }

    /// <summary>
    /// 指定した IconDefinition のマスターファイルとターゲットファイルの
    /// 存在・更新日時を確認してステータスを設定する。
    /// </summary>
    public void ScanIcon(IconDefinition def)
    {
        // マスターファイルの確認
        var masterPath = ResolveMasterPath(def);
        if (masterPath != null && File.Exists(masterPath))
        {
            def.HasMaster = true;
            def.MasterLastModified = File.GetLastWriteTime(masterPath);
        }
        else
        {
            def.HasMaster = false;
            def.MasterLastModified = null;
        }

        // ターゲットファイルの確認
        if (string.IsNullOrEmpty(def.AppBasePath) || !Directory.Exists(def.AppBasePath))
        {
            // BasePath 未設定 → 全ターゲット Unknown
            foreach (var platform in def.Platforms)
            {
                foreach (var target in platform.Targets)
                {
                    target.Status = IconTargetStatus.Unknown;
                    target.LastModified = null;
                    target.FileSizeBytes = null;
                }
            }
        }
        else
        {
            foreach (var platform in def.Platforms)
            {
                foreach (var target in platform.Targets)
                {
                    var targetPath = Path.Combine(def.AppBasePath, target.Path);
                    if (File.Exists(targetPath))
                    {
                        var info = new FileInfo(targetPath);
                        target.LastModified = info.LastWriteTime;
                        target.FileSizeBytes = info.Length;

                        // マスターより新しければ UpToDate、そうでなければ Outdated
                        if (def.MasterLastModified.HasValue
                            && info.LastWriteTime >= def.MasterLastModified.Value)
                        {
                            target.Status = IconTargetStatus.UpToDate;
                        }
                        else
                        {
                            target.Status = IconTargetStatus.Outdated;
                        }
                    }
                    else
                    {
                        target.Status = IconTargetStatus.Missing;
                        target.LastModified = null;
                        target.FileSizeBytes = null;
                    }
                }
            }
        }

        def.NotifyStatusChanged();
    }

    /// <summary>
    /// 全アイコンをスキャンしてステータスを更新する。
    /// </summary>
    public void ScanAll(List<IconDefinition> definitions)
    {
        foreach (var def in definitions)
        {
            ScanIcon(def);
        }
    }

    /// <summary>
    /// マスター PNG をターゲットパスにコピー（ICO 変換は generate-app-icon.py に委譲）。
    /// PNG → PNG のコピーのみ行い、ICO 生成は Python スクリプトのジョブとして扱う。
    /// </summary>
    public (bool success, string message) CopyMasterToTarget(IconDefinition def, IconTarget target)
    {
        if (string.IsNullOrEmpty(def.AppBasePath))
            return (false, "アプリのリポジトリパスが設定されていません。");

        var masterPath = ResolveMasterPath(def);
        if (masterPath == null || !File.Exists(masterPath))
            return (false, $"マスターアイコンが見つかりません: {def.MasterPng ?? def.MasterSvg}");

        if (target.Format == IconFormat.Ico)
            return (false, "ICO ファイルの生成には generate-app-icon.py を使用してください。");

        var targetPath = Path.Combine(def.AppBasePath, target.Path);
        var targetDir = Path.GetDirectoryName(targetPath);

        try
        {
            if (!string.IsNullOrEmpty(targetDir))
                Directory.CreateDirectory(targetDir);

            File.Copy(masterPath, targetPath, overwrite: true);
            return (true, $"コピー完了: {target.Path}");
        }
        catch (Exception ex)
        {
            return (false, $"コピー失敗: {ex.Message}");
        }
    }

    /// <summary>
    /// マスターアイコンファイルを Explorer で開く
    /// </summary>
    public void OpenMasterInExplorer(IconDefinition def)
    {
        var path = ResolveMasterPath(def);
        if (path == null || !File.Exists(path)) return;

        var dir = Path.GetDirectoryName(path);
        if (dir != null && Directory.Exists(dir))
        {
            Process.Start("explorer.exe", $"/select,\"{path}\"");
        }
    }

    /// <summary>
    /// ターゲットアイコンファイルを Explorer で開く
    /// </summary>
    public void OpenTargetInExplorer(IconDefinition def, IconTarget target)
    {
        if (string.IsNullOrEmpty(def.AppBasePath)) return;
        var path = Path.Combine(def.AppBasePath, target.Path);
        if (File.Exists(path))
        {
            Process.Start("explorer.exe", $"/select,\"{path}\"");
        }
        else
        {
            var dir = Path.GetDirectoryName(path);
            if (dir != null && Directory.Exists(dir))
                Process.Start("explorer.exe", dir);
        }
    }

    // ─────────────────────────────────────────────────────
    // 内部ヘルパー
    // ─────────────────────────────────────────────────────

    /// <summary>
    /// マスターファイルの絶対パスを解決する。
    /// PNG を優先し、なければ SVG を返す。
    /// </summary>
    private string? ResolveMasterPath(IconDefinition def)
    {
        if (string.IsNullOrEmpty(InsightCommonRoot)) return null;

        // PNG 優先
        if (!string.IsNullOrEmpty(def.MasterPng))
        {
            var pngPath = Path.Combine(InsightCommonRoot, def.MasterPng);
            if (File.Exists(pngPath)) return pngPath;
        }

        if (!string.IsNullOrEmpty(def.MasterSvg))
        {
            var svgPath = Path.Combine(InsightCommonRoot, def.MasterSvg);
            if (File.Exists(svgPath)) return svgPath;
        }

        return null;
    }

    /// <summary>
    /// 全製品のアイコン定義（config/app-icons.ts と同期）。
    /// TS ファイルを直接パースするのではなく、C# 側でも定義を持つ。
    /// </summary>
    private static List<IconDefinition> GetAllIconDefinitions()
    {
        // WPF 共通ターゲット
        static List<IconTarget> WpfTargets() => new()
        {
            new() { Path = @"Assets\app.ico", Format = IconFormat.Ico, Sizes = [16, 24, 32, 48, 64, 128, 256], Description = "アプリケーションアイコン (ICO)" },
            new() { Path = @"Assets\icon_256.png", Format = IconFormat.Png, Sizes = [256], Description = "タイトルバー・スプラッシュ用 (256px PNG)" },
        };

        static List<IconTarget> WpfWithFileIcon(string fileIconName) =>
        [
            .. WpfTargets(),
            new() { Path = $@"Assets\{fileIconName}", Format = IconFormat.Ico, Sizes = [16, 24, 32, 48, 64, 128, 256], Description = "ファイル関連付けアイコン (ICO)" },
        ];

        // Web 共通ターゲット
        static List<IconTarget> WebTargets() => new()
        {
            new() { Path = @"public\favicon.ico", Format = IconFormat.Ico, Sizes = [32], Description = "ファビコン (ICO)" },
            new() { Path = @"public\icon-192.png", Format = IconFormat.Png, Sizes = [192], Description = "PWA アイコン (192px)" },
            new() { Path = @"public\icon-512.png", Format = IconFormat.Png, Sizes = [512], Description = "PWA アイコン (512px)" },
            new() { Path = @"public\apple-touch-icon.png", Format = IconFormat.Png, Sizes = [180], Description = "iOS Safari タッチアイコン" },
        };

        // Electron ターゲット
        static List<IconTarget> ElectronTargets() => new()
        {
            new() { Path = @"build\icon.ico", Format = IconFormat.Ico, Sizes = [16, 24, 32, 48, 64, 128, 256], Description = "Electron Windows アイコン" },
            new() { Path = @"build\icon.png", Format = IconFormat.Png, Sizes = [512], Description = "Electron Linux アイコン" },
        };

        return new List<IconDefinition>
        {
            // Tier 1
            new()
            {
                ProductCode = "INCA", ProductName = "InsightNoCodeAnalyzer",
                MasterSvg = @"brand\icons\svg\icon-insight-nca.svg",
                MasterPng = @"brand\icons\png\icon-insight-nca.png",
                Motif = "フローチャート + ギア",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },
            new()
            {
                ProductCode = "INBT", ProductName = "InsightBot",
                MasterSvg = @"brand\icons\svg\icon-insight-bot.svg",
                MasterPng = @"brand\icons\png\icon-insight-bot.png",
                Motif = "ロボット + チャット吹き出し",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },
            new()
            {
                ProductCode = "IVIN", ProductName = "InterviewInsight",
                MasterSvg = @"brand\icons\svg\icon-interview-insight.svg",
                MasterPng = @"brand\icons\png\icon-interview-insight.png",
                Motif = "ロボット + マイク + クリップボード",
                Platforms = [new() { Platform = "web", Targets = WebTargets() }],
            },

            // Tier 2
            new()
            {
                ProductCode = "INMV", ProductName = "InsightCast",
                MasterSvg = @"brand\icons\svg\icon-insight-cast.svg",
                MasterPng = @"brand\icons\png\icon-insight-cast.png",
                Motif = "映写機 + フィルム + ギア",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },
            new()
            {
                ProductCode = "INIG", ProductName = "InsightImageGen",
                MasterSvg = @"brand\icons\svg\icon-insight-imagegen.svg",
                MasterPng = @"brand\icons\png\icon-insight-imagegen.png",
                Motif = "モニター + アパーチャ + ギア",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },

            // Tier 3
            new()
            {
                ProductCode = "INSS", ProductName = "InsightOfficeSlide",
                MasterSvg = @"brand\icons\svg\icon-insight-slide.svg",
                MasterPng = @"brand\icons\png\icon-insight-slide.png",
                Motif = "プレゼンボード + ギア + 矢印",
                Platforms = [new() { Platform = "wpf", Targets = WpfWithFileIcon("inss-file.ico") }],
            },
            new()
            {
                ProductCode = "IOSH", ProductName = "InsightOfficeSheet",
                MasterSvg = @"brand\icons\svg\icon-insight-sheet.svg",
                MasterPng = @"brand\icons\png\icon-insight-sheet.png",
                Motif = "スプレッドシートグリッド + ギア",
                Platforms = [new() { Platform = "wpf", Targets = WpfWithFileIcon("iosh-file.ico") }],
            },
            new()
            {
                ProductCode = "IOSD", ProductName = "InsightOfficeDoc",
                MasterSvg = @"brand\icons\svg\icon-insight-doc.svg",
                MasterPng = @"brand\icons\png\icon-insight-doc.png",
                Motif = "ドキュメント + ギア + DB",
                Platforms = [new() { Platform = "wpf", Targets = WpfWithFileIcon("iosd-file.ico") }],
            },
            new()
            {
                ProductCode = "INPY", ProductName = "InsightPy",
                MasterSvg = @"brand\icons\svg\icon-insight-py.svg",
                MasterPng = @"brand\icons\png\icon-insight-py.png",
                Motif = "Python ヘビ + 回路基板",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },

            // Tier 4
            new()
            {
                ProductCode = "ISOF", ProductName = "InsightSeniorOffice",
                MasterSvg = "",
                MasterPng = @"brand\icons\png\icon-senior-office.png",
                Motif = "カレンダー + 文書 + メール + ギア",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },

            // Web App
            new()
            {
                ProductCode = "INBA", ProductName = "InsightBrowser AI",
                MasterSvg = "",
                MasterPng = "",
                Motif = "ブラウザ + AI スパークル",
                Platforms =
                [
                    new() { Platform = "electron", Targets = ElectronTargets() },
                    new() { Platform = "web", Targets = WebTargets() },
                ],
            },

            // Utility
            new()
            {
                ProductCode = "LAUNCHER", ProductName = "Insight Launcher",
                MasterSvg = @"brand\icons\svg\icon-launcher.svg",
                MasterPng = @"brand\icons\png\icon-launcher.png",
                Motif = "2x2 グリッド + ロケット + 回路基板",
                Platforms = [new() { Platform = "wpf", Targets = WpfTargets() }],
            },
        };
    }
}
