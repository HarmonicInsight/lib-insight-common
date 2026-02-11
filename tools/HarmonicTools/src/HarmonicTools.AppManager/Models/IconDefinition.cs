using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace HarmonicTools.AppManager.Models;

/// <summary>
/// アイコンフォーマット
/// </summary>
public enum IconFormat
{
    Ico,
    Png,
    Svg,
    Icns,
    VectorDrawable
}

/// <summary>
/// アイコン配置先のステータス
/// </summary>
public enum IconTargetStatus
{
    /// <summary>ファイルが存在し、最新</summary>
    UpToDate,
    /// <summary>ファイルが存在するが古い（マスターより更新日時が前）</summary>
    Outdated,
    /// <summary>ファイルが存在しない</summary>
    Missing,
    /// <summary>リポジトリパスが未設定のため確認不可</summary>
    Unknown
}

/// <summary>
/// プラットフォーム別アイコン出力ターゲット
/// </summary>
public class IconTarget
{
    /// <summary>アプリの BasePath からの相対パス</summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>フォーマット</summary>
    public IconFormat Format { get; set; }

    /// <summary>サイズ（px）</summary>
    public int[] Sizes { get; set; } = [];

    /// <summary>説明</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>ステータス（スキャン後に設定）</summary>
    public IconTargetStatus Status { get; set; } = IconTargetStatus.Unknown;

    /// <summary>ファイルが存在する場合の最終更新日時</summary>
    public DateTime? LastModified { get; set; }

    /// <summary>ファイルサイズ（バイト）</summary>
    public long? FileSizeBytes { get; set; }

    /// <summary>ステータスアイコン文字列（UI 表示用）</summary>
    public string StatusIcon => Status switch
    {
        IconTargetStatus.UpToDate => "✓",
        IconTargetStatus.Outdated => "↻",
        IconTargetStatus.Missing  => "✗",
        _                         => "?"
    };

    /// <summary>ステータスの日本語ラベル</summary>
    public string StatusLabel => Status switch
    {
        IconTargetStatus.UpToDate => "最新",
        IconTargetStatus.Outdated => "更新あり",
        IconTargetStatus.Missing  => "未配置",
        _                         => "不明"
    };
}

/// <summary>
/// プラットフォーム別アイコン構成
/// </summary>
public class IconPlatformConfig
{
    public string Platform { get; set; } = string.Empty;

    /// <summary>プラットフォームの日本語表示名</summary>
    public string PlatformLabel => Platform switch
    {
        "wpf"      => "WPF (C#)",
        "web"      => "Web",
        "android"  => "Android",
        "ios"      => "iOS",
        "expo"     => "Expo",
        "electron" => "Electron",
        _          => Platform
    };

    public List<IconTarget> Targets { get; set; } = new();

    /// <summary>全ターゲットが UpToDate かどうか</summary>
    public bool IsComplete => Targets.Count > 0 && Targets.TrueForAll(t => t.Status == IconTargetStatus.UpToDate);

    /// <summary>サマリー文字列（例: "3/5 配置済み"）</summary>
    public string Summary
    {
        get
        {
            var placed = Targets.FindAll(t => t.Status == IconTargetStatus.UpToDate || t.Status == IconTargetStatus.Outdated).Count;
            return $"{placed}/{Targets.Count} 配置済み";
        }
    }
}

/// <summary>
/// 製品のアイコン定義（スキャン結果を含む）
/// </summary>
public class IconDefinition : INotifyPropertyChanged
{
    /// <summary>製品コード</summary>
    public string ProductCode { get; set; } = string.Empty;

    /// <summary>製品名</summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>マスター SVG パス（insight-common ルートからの相対パス）</summary>
    public string MasterSvg { get; set; } = string.Empty;

    /// <summary>マスター PNG パス</summary>
    public string MasterPng { get; set; } = string.Empty;

    /// <summary>アイコンモチーフ説明</summary>
    public string Motif { get; set; } = string.Empty;

    /// <summary>プラットフォーム別構成</summary>
    public List<IconPlatformConfig> Platforms { get; set; } = new();

    /// <summary>マスターファイルが存在するか</summary>
    public bool HasMaster { get; set; }

    /// <summary>マスターファイルの最終更新日時</summary>
    public DateTime? MasterLastModified { get; set; }

    /// <summary>アプリの BasePath（AppConfig から取得）</summary>
    public string? AppBasePath { get; set; }

    /// <summary>全プラットフォームの総合ステータスアイコン</summary>
    public string OverallStatusIcon
    {
        get
        {
            if (!HasMaster) return "⚠ マスターなし";
            if (string.IsNullOrEmpty(AppBasePath)) return "— パス未設定";

            var totalTargets = 0;
            var upToDate = 0;
            var missing = 0;

            foreach (var p in Platforms)
            {
                foreach (var t in p.Targets)
                {
                    totalTargets++;
                    if (t.Status == IconTargetStatus.UpToDate) upToDate++;
                    else if (t.Status == IconTargetStatus.Missing) missing++;
                }
            }

            if (totalTargets == 0) return "— ターゲットなし";
            if (upToDate == totalTargets) return $"✓ 全{totalTargets}件 最新";
            if (missing == totalTargets) return $"✗ 全{totalTargets}件 未配置";
            return $"◐ {upToDate}/{totalTargets} 配置済み";
        }
    }

    /// <summary>リスト表示用の説明</summary>
    public string DisplayDescription => $"{Motif}  —  {OverallStatusIcon}";

    public event PropertyChangedEventHandler? PropertyChanged;

    public void NotifyStatusChanged()
    {
        OnPropertyChanged(nameof(OverallStatusIcon));
        OnPropertyChanged(nameof(DisplayDescription));
    }

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }

    public override string ToString() => $"{ProductName} ({ProductCode})";
}
