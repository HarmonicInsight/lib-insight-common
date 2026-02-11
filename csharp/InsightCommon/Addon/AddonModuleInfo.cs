using System.Text.Json.Serialization;

namespace InsightCommon.Addon;

/// <summary>
/// アドインモジュールの状態
/// </summary>
public enum AddonState
{
    NotInstalled,
    Installed,
    Enabled,
    Disabled
}

/// <summary>
/// モジュール配布タイプ
/// </summary>
public enum AddonDistributionType
{
    /// <summary>アプリに同梱（有効/無効切り替え可能）</summary>
    Bundled,
    /// <summary>別途インストールが必要</summary>
    Extension
}

/// <summary>
/// モジュール UI パネル配置場所
/// </summary>
public enum AddonPanelPosition
{
    Right,
    Bottom,
    Dialog,
    Tab
}

/// <summary>
/// アドインモジュールの定義情報
///
/// config/addon-modules.ts の C# 対応版。
/// TypeScript 定義と同一の構造を維持する。
/// </summary>
public class AddonModuleInfo
{
    /// <summary>モジュール ID（一意）</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>モジュール名（英語）</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>モジュール名（日本語）</summary>
    public string NameJa { get; set; } = string.Empty;

    /// <summary>説明（英語）</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>説明（日本語）</summary>
    public string DescriptionJa { get; set; } = string.Empty;

    /// <summary>バージョン</summary>
    public string Version { get; set; } = "1.0.0";

    /// <summary>配布タイプ</summary>
    public AddonDistributionType Distribution { get; set; }

    /// <summary>UI パネルの配置場所</summary>
    public AddonPanelPosition PanelPosition { get; set; }

    /// <summary>ライセンスで必要なフィーチャーキー</summary>
    public string RequiredFeatureKey { get; set; } = string.Empty;

    /// <summary>利用可能プラン</summary>
    public string[] AllowedPlans { get; set; } = [];

    /// <summary>依存する他のモジュール ID</summary>
    public string[] RequiresModules { get; set; } = [];

    /// <summary>アイコン名（Segoe Fluent Icons）</summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>テーマカラー</summary>
    public string ThemeColor { get; set; } = "#B8942F";
}

/// <summary>
/// モジュールのランタイム状態（有効/無効 + ロック状態）
/// </summary>
public class AddonModuleState
{
    public string ModuleId { get; set; } = string.Empty;
    public AddonState State { get; set; } = AddonState.Disabled;

    /// <summary>管理者によって強制有効化されているか</summary>
    public bool LockedEnabled { get; set; }

    /// <summary>管理者によって強制無効化されているか</summary>
    public bool LockedDisabled { get; set; }

    /// <summary>モジュール固有の設定値</summary>
    public Dictionary<string, object> Settings { get; set; } = new();

    /// <summary>ユーザーが切り替え可能か</summary>
    [JsonIgnore]
    public bool CanToggle => !LockedEnabled && !LockedDisabled;
}
