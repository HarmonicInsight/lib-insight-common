using System.IO;
using System.Text.Json;
using InsightCommon.License;

namespace InsightCommon.Addon;

/// <summary>
/// アドインマネージャー（Insight Business Suite 全アプリ共通）
///
/// モジュールの有効/無効管理、依存解決、管理者プロファイル適用、設定永続化を担当。
/// 各 Insight Business Suite アプリ（HMSH/HMDC/HMSL）は App.xaml.cs でこのクラスを初期化し、
/// モジュールの状態に応じて UI パネルを表示/非表示する。
///
/// 使用例:
/// <code>
/// var addonManager = new AddonManager("HMSH", "HarmonicSheet", licenseManager);
/// addonManager.Initialize();
///
/// // モジュール有効/無効チェック
/// if (addonManager.IsEnabled("ai_assistant"))
///     ShowAiPanel();
///
/// // ユーザーがモジュールを有効化
/// var result = addonManager.EnableModule("python_runtime");
/// if (!result.Success)
///     MessageBox.Show(result.Message);
/// </code>
/// </summary>
public class AddonManager
{
    private readonly string _productCode;
    private readonly string _productName;
    private readonly InsightLicenseManager _licenseManager;
    private readonly string _settingsPath;
    private readonly string _adminProfilePath;

    private readonly Dictionary<string, AddonModuleState> _moduleStates = new();
    private AdminDeployProfile? _adminProfile;

    /// <summary>モジュール状態が変更されたときに発火</summary>
    public event EventHandler<ModuleStateChangedEventArgs>? ModuleStateChanged;

    /// <summary>管理者プロファイルが読み込まれたか</summary>
    public bool HasAdminProfile => _adminProfile != null;

    /// <summary>管理者プロファイル名</summary>
    public string? AdminProfileName => _adminProfile?.Name;

    public AddonManager(string productCode, string productName, InsightLicenseManager licenseManager)
    {
        _productCode = productCode;
        _productName = productName;
        _licenseManager = licenseManager;

        var configDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "HarmonicInsight", productName);

        _settingsPath = Path.Combine(configDir, "addon-settings.json");
        _adminProfilePath = Path.Combine(configDir, "admin-profile.json");

        Directory.CreateDirectory(configDir);
    }

    /// <summary>
    /// アドインマネージャーを初期化
    ///
    /// 1. 管理者プロファイルの読み込み（存在する場合）
    /// 2. ユーザー設定の読み込み
    /// 3. デフォルト設定の適用
    /// 4. 依存関係の検証
    /// </summary>
    public void Initialize()
    {
        LoadAdminProfile();
        LoadUserSettings();
        ApplyDefaults();
        ValidateDependencies();
    }

    // =========================================================================
    // クエリ
    // =========================================================================

    /// <summary>モジュールが有効か</summary>
    public bool IsEnabled(string moduleId) =>
        _moduleStates.TryGetValue(moduleId, out var state) && state.State == AddonState.Enabled;

    /// <summary>モジュールの状態を取得</summary>
    public AddonModuleState? GetModuleState(string moduleId) =>
        _moduleStates.GetValueOrDefault(moduleId);

    /// <summary>全モジュール状態一覧を取得（UI 表示用）</summary>
    public List<AddonModuleViewModel> GetAllModuleViewModels()
    {
        if (!AddonModuleCatalog.ProductSupport.TryGetValue(_productCode, out var support))
            return [];

        var result = new List<AddonModuleViewModel>();
        var currentPlan = PlanDisplay.GetName(_licenseManager.CurrentLicense.Plan);

        foreach (var moduleId in support.SupportedModules)
        {
            var info = AddonModuleCatalog.GetModule(moduleId);
            if (info == null) continue;

            var state = _moduleStates.GetValueOrDefault(moduleId);
            var isEnabled = state?.State == AddonState.Enabled;
            var canToggle = state?.CanToggle ?? true;

            // ライセンスチェック
            var planAllowed = info.AllowedPlans.Contains(currentPlan);

            // 依存チェック
            var depsOk = info.RequiresModules.All(IsEnabled);

            result.Add(new AddonModuleViewModel
            {
                ModuleId = moduleId,
                Info = info,
                IsEnabled = isEnabled,
                CanToggle = canToggle && planAllowed,
                PlanAllowed = planAllowed,
                DependenciesMet = depsOk,
                LockedEnabled = state?.LockedEnabled ?? false,
                LockedDisabled = state?.LockedDisabled ?? false,
                StatusMessage = !planAllowed
                    ? $"{string.Join("/", info.AllowedPlans)} プランが必要です"
                    : !depsOk
                        ? $"依存モジュール: {string.Join(", ", info.RequiresModules.Where(d => !IsEnabled(d)).Select(d => AddonModuleCatalog.GetModule(d)?.NameJa ?? d))}"
                        : state?.LockedEnabled == true
                            ? "管理者により有効化（変更不可）"
                            : state?.LockedDisabled == true
                                ? "管理者により無効化（変更不可）"
                                : null,
            });
        }

        return result;
    }

    /// <summary>有効なモジュール ID の一覧を依存順で返す</summary>
    public List<string> GetEnabledModuleIds()
    {
        var enabled = _moduleStates
            .Where(kv => kv.Value.State == AddonState.Enabled)
            .Select(kv => kv.Key)
            .ToList();

        return ResolveModuleOrder(enabled);
    }

    // =========================================================================
    // 操作
    // =========================================================================

    /// <summary>
    /// モジュールを有効化
    /// </summary>
    public (bool Success, string Message) EnableModule(string moduleId)
    {
        var checkResult = CanEnable(moduleId);
        if (!checkResult.Allowed)
            return (false, checkResult.Reason!);

        var state = GetOrCreateState(moduleId);
        state.State = AddonState.Enabled;
        SaveUserSettings();
        ModuleStateChanged?.Invoke(this, new ModuleStateChangedEventArgs(moduleId, true));
        return (true, $"{AddonModuleCatalog.GetModule(moduleId)?.NameJa ?? moduleId} を有効化しました。");
    }

    /// <summary>
    /// モジュールを無効化
    /// </summary>
    public (bool Success, string Message) DisableModule(string moduleId)
    {
        var state = GetOrCreateState(moduleId);
        if (state.LockedEnabled)
            return (false, "管理者プロファイルにより有効化が固定されています。");

        // 依存先チェック: このモジュールに依存する有効なモジュールがあれば警告
        var dependents = GetEnabledDependents(moduleId);
        if (dependents.Count > 0)
        {
            var names = string.Join(", ", dependents.Select(d => AddonModuleCatalog.GetModule(d)?.NameJa ?? d));
            // 依存先も一緒に無効化
            foreach (var depId in dependents)
            {
                var depState = GetOrCreateState(depId);
                if (!depState.LockedEnabled)
                {
                    depState.State = AddonState.Disabled;
                    ModuleStateChanged?.Invoke(this, new ModuleStateChangedEventArgs(depId, false));
                }
            }
        }

        state.State = AddonState.Disabled;
        SaveUserSettings();
        ModuleStateChanged?.Invoke(this, new ModuleStateChangedEventArgs(moduleId, false));
        return (true, $"{AddonModuleCatalog.GetModule(moduleId)?.NameJa ?? moduleId} を無効化しました。");
    }

    /// <summary>
    /// モジュールの設定値を更新
    /// </summary>
    public void UpdateModuleSetting(string moduleId, string key, object value)
    {
        var state = GetOrCreateState(moduleId);
        state.Settings[key] = value;
        SaveUserSettings();
    }

    /// <summary>
    /// モジュールの設定値を取得
    /// </summary>
    public T? GetModuleSetting<T>(string moduleId, string key, T? defaultValue = default)
    {
        var state = GetOrCreateState(moduleId);
        if (state.Settings.TryGetValue(key, out var value))
        {
            try
            {
                if (value is JsonElement jsonElement)
                {
                    return JsonSerializer.Deserialize<T>(jsonElement.GetRawText());
                }
                return (T)Convert.ChangeType(value, typeof(T), System.Globalization.CultureInfo.InvariantCulture);
            }
            catch
            {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    // =========================================================================
    // 有効化チェック
    // =========================================================================

    /// <summary>
    /// モジュールが有効化可能かチェック
    ///
    /// 1. 製品がサポートしているか
    /// 2. ライセンスプランが対応しているか
    /// 3. 管理者ロックされていないか
    /// 4. 依存モジュールが有効になっているか
    /// </summary>
    public (bool Allowed, string? Reason) CanEnable(string moduleId)
    {
        // 製品サポートチェック
        if (!AddonModuleCatalog.ProductSupport.TryGetValue(_productCode, out var support) ||
            !support.SupportedModules.Contains(moduleId))
        {
            return (false, $"{_productCode} はモジュール {moduleId} をサポートしていません。");
        }

        var info = AddonModuleCatalog.GetModule(moduleId);
        if (info == null)
            return (false, $"不明なモジュール: {moduleId}");

        // 管理者ロックチェック
        var state = GetOrCreateState(moduleId);
        if (state.LockedDisabled)
            return (false, "管理者プロファイルにより無効化が固定されています。");

        // ライセンスチェック
        var currentPlan = PlanDisplay.GetName(_licenseManager.CurrentLicense.Plan);
        if (!info.AllowedPlans.Contains(currentPlan))
            return (false, $"{info.NameJa}には {string.Join("/", info.AllowedPlans)} プランが必要です。");

        // 依存チェック
        foreach (var depId in info.RequiresModules)
        {
            if (!IsEnabled(depId))
            {
                var depInfo = AddonModuleCatalog.GetModule(depId);
                return (false, $"{info.NameJa}には「{depInfo?.NameJa ?? depId}」が必要です。先に有効化してください。");
            }
        }

        return (true, null);
    }

    // =========================================================================
    // 依存解決
    // =========================================================================

    /// <summary>
    /// モジュールを有効化順に並べる（トポロジカルソート）
    /// 依存先が先に来るように並ぶ。
    /// </summary>
    public static List<string> ResolveModuleOrder(List<string> moduleIds)
    {
        var resolved = new List<string>();
        var visited = new HashSet<string>();

        void Visit(string id)
        {
            if (visited.Contains(id)) return;
            visited.Add(id);

            var info = AddonModuleCatalog.GetModule(id);
            if (info != null)
            {
                foreach (var depId in info.RequiresModules)
                {
                    if (moduleIds.Contains(depId))
                        Visit(depId);
                }
            }
            resolved.Add(id);
        }

        foreach (var id in moduleIds)
            Visit(id);

        return resolved;
    }

    /// <summary>指定モジュールに依存している有効なモジュール ID</summary>
    private List<string> GetEnabledDependents(string moduleId)
    {
        return _moduleStates
            .Where(kv => kv.Value.State == AddonState.Enabled)
            .Where(kv =>
            {
                var info = AddonModuleCatalog.GetModule(kv.Key);
                return info?.RequiresModules.Contains(moduleId) == true;
            })
            .Select(kv => kv.Key)
            .ToList();
    }

    // =========================================================================
    // 永続化
    // =========================================================================

    private void SaveUserSettings()
    {
        var data = _moduleStates
            .Where(kv => !kv.Value.LockedEnabled && !kv.Value.LockedDisabled)
            .ToDictionary(
                kv => kv.Key,
                kv => new AddonUserSetting
                {
                    Enabled = kv.Value.State == AddonState.Enabled,
                    Settings = kv.Value.Settings,
                });

        var json = JsonSerializer.Serialize(data, JsonOptions.WriteIndented);
        File.WriteAllText(_settingsPath, json);
    }

    private void LoadUserSettings()
    {
        if (!File.Exists(_settingsPath)) return;

        try
        {
            var json = File.ReadAllText(_settingsPath);
            var data = JsonSerializer.Deserialize<Dictionary<string, AddonUserSetting>>(json);
            if (data == null) return;

            foreach (var (moduleId, setting) in data)
            {
                var state = GetOrCreateState(moduleId);
                // 管理者ロック済みでなければユーザー設定を適用
                if (!state.LockedEnabled && !state.LockedDisabled)
                {
                    state.State = setting.Enabled ? AddonState.Enabled : AddonState.Disabled;
                }
                foreach (var (key, value) in setting.Settings)
                {
                    state.Settings[key] = value;
                }
            }
        }
        catch
        {
            // 設定ファイル破損は無視してデフォルトで動作
        }
    }

    // =========================================================================
    // 管理者プロファイル
    // =========================================================================

    private void LoadAdminProfile()
    {
        if (!File.Exists(_adminProfilePath)) return;

        try
        {
            var json = File.ReadAllText(_adminProfilePath);
            _adminProfile = JsonSerializer.Deserialize<AdminDeployProfile>(json,
                JsonOptions.CaseInsensitive);

            if (_adminProfile == null) return;

            // 強制有効化
            foreach (var moduleId in _adminProfile.ForcedEnabledModules)
            {
                var state = GetOrCreateState(moduleId);
                state.State = AddonState.Enabled;
                state.LockedEnabled = true;
            }

            // 強制無効化
            foreach (var moduleId in _adminProfile.DisabledModules)
            {
                var state = GetOrCreateState(moduleId);
                state.State = AddonState.Disabled;
                state.LockedDisabled = true;
            }

            // モジュール設定上書き
            foreach (var (moduleId, settings) in _adminProfile.ModuleSettings)
            {
                var state = GetOrCreateState(moduleId);
                foreach (var (key, value) in settings)
                {
                    state.Settings[key] = value;
                }
            }
        }
        catch
        {
            _adminProfile = null;
        }
    }

    // =========================================================================
    // デフォルト適用
    // =========================================================================

    private void ApplyDefaults()
    {
        if (!AddonModuleCatalog.ProductSupport.TryGetValue(_productCode, out var support))
            return;

        foreach (var moduleId in support.SupportedModules)
        {
            if (_moduleStates.ContainsKey(moduleId)) continue;

            var state = GetOrCreateState(moduleId);
            var info = AddonModuleCatalog.GetModule(moduleId);

            if (info?.Distribution == AddonDistributionType.Bundled &&
                support.DefaultEnabled.Contains(moduleId))
            {
                state.State = AddonState.Enabled;
            }
            else if (info?.Distribution == AddonDistributionType.Extension)
            {
                state.State = AddonState.NotInstalled;
            }
            else
            {
                state.State = AddonState.Disabled;
            }
        }
    }

    private void ValidateDependencies()
    {
        // 依存モジュールが無効なのに有効になっているモジュールを無効化
        var changed = true;
        while (changed)
        {
            changed = false;
            foreach (var (moduleId, state) in _moduleStates)
            {
                if (state.State != AddonState.Enabled) continue;

                var info = AddonModuleCatalog.GetModule(moduleId);
                if (info == null) continue;

                foreach (var depId in info.RequiresModules)
                {
                    if (!IsEnabled(depId) && !state.LockedEnabled)
                    {
                        state.State = AddonState.Disabled;
                        changed = true;
                        break;
                    }
                }
            }
        }
    }

    private AddonModuleState GetOrCreateState(string moduleId)
    {
        if (!_moduleStates.TryGetValue(moduleId, out var state))
        {
            state = new AddonModuleState { ModuleId = moduleId };
            _moduleStates[moduleId] = state;
        }
        return state;
    }
}

// =========================================================================
// 補助型
// =========================================================================

/// <summary>モジュール状態変更イベント引数</summary>
public class ModuleStateChangedEventArgs(string moduleId, bool isEnabled) : EventArgs
{
    public string ModuleId { get; } = moduleId;
    public bool IsEnabled { get; } = isEnabled;
}

/// <summary>UI バインディング用ビューモデル</summary>
public class AddonModuleViewModel
{
    public string ModuleId { get; set; } = string.Empty;
    public AddonModuleInfo Info { get; set; } = new();
    public bool IsEnabled { get; set; }
    public bool CanToggle { get; set; }
    public bool PlanAllowed { get; set; }
    public bool DependenciesMet { get; set; }
    public bool LockedEnabled { get; set; }
    public bool LockedDisabled { get; set; }
    public string? StatusMessage { get; set; }
}

/// <summary>ユーザー設定の永続化用</summary>
internal sealed class AddonUserSetting
{
    public bool Enabled { get; set; }
    public Dictionary<string, object> Settings { get; set; } = new();
}
