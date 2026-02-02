using System.Windows;
using System.Windows.Controls;

namespace InsightCommon.Addon;

/// <summary>
/// アドインパネルホスト（InsightOffice 全アプリ共通）
///
/// モジュールの UI パネルを動的にホストするコンテナ。
/// AddonManager のモジュール状態に応じてパネルの表示/非表示を切り替える。
///
/// ホストアプリは各配置場所（Right, Bottom, Dialog, Tab）に対して
/// AddonPanelHost を1つずつ配置し、モジュール UI を登録する。
///
/// 使用例:
/// <code>
/// // MainWindow.xaml.cs
/// var rightPanelHost = new AddonPanelHost(addonManager, AddonPanelPosition.Right);
///
/// // モジュール UI を登録
/// rightPanelHost.RegisterPanel("ai_assistant", new AiAssistantPanel());
/// rightPanelHost.RegisterPanel("reference_materials", new ReferenceMaterialsPanel());
///
/// // XAML のコンテナに追加
/// RightPanelContainer.Content = rightPanelHost;
/// </code>
/// </summary>
public class AddonPanelHost : UserControl
{
    private readonly AddonManager _addonManager;
    private readonly AddonPanelPosition _position;
    private readonly Dictionary<string, UIElement> _panels = new();
    private readonly Grid _container;
    private readonly TabControl? _tabControl;
    private string? _activeModuleId;

    public AddonPanelHost(AddonManager addonManager, AddonPanelPosition position)
    {
        _addonManager = addonManager;
        _position = position;

        _container = new Grid();

        if (position == AddonPanelPosition.Tab)
        {
            _tabControl = new TabControl();
            _container.Children.Add(_tabControl);
        }

        Content = _container;

        // モジュール状態変更をリッスン
        _addonManager.ModuleStateChanged += OnModuleStateChanged;
    }

    /// <summary>
    /// モジュール UI パネルを登録
    ///
    /// ホストアプリがモジュールの UI 実装を提供する。
    /// パネルはモジュールが有効な場合のみ表示される。
    /// </summary>
    /// <param name="moduleId">モジュール ID</param>
    /// <param name="panel">UI 要素</param>
    public void RegisterPanel(string moduleId, UIElement panel)
    {
        var info = AddonModuleCatalog.GetModule(moduleId);
        if (info == null || info.PanelPosition != _position) return;

        _panels[moduleId] = panel;
        panel.Visibility = Visibility.Collapsed;

        if (_position == AddonPanelPosition.Tab && _tabControl != null)
        {
            var tabItem = new TabItem
            {
                Header = info.NameJa,
                Content = panel,
                Tag = moduleId,
                Visibility = Visibility.Collapsed,
            };
            _tabControl.Items.Add(tabItem);
        }
        else
        {
            _container.Children.Add(panel);
        }

        // 現在有効なら表示
        if (_addonManager.IsEnabled(moduleId))
        {
            ShowPanel(moduleId);
        }
    }

    /// <summary>
    /// 指定モジュールのパネルを表示（同一配置場所の他パネルは非表示）
    /// </summary>
    public void ShowPanel(string moduleId)
    {
        if (!_panels.ContainsKey(moduleId) || !_addonManager.IsEnabled(moduleId))
            return;

        if (_position == AddonPanelPosition.Tab && _tabControl != null)
        {
            // タブモードでは有効なモジュールのタブだけ表示
            foreach (TabItem tab in _tabControl.Items)
            {
                var tabModuleId = tab.Tag as string;
                if (tabModuleId != null)
                {
                    tab.Visibility = _addonManager.IsEnabled(tabModuleId)
                        ? Visibility.Visible
                        : Visibility.Collapsed;
                }
            }

            // 指定タブを選択
            foreach (TabItem tab in _tabControl.Items)
            {
                if (tab.Tag as string == moduleId)
                {
                    _tabControl.SelectedItem = tab;
                    break;
                }
            }
        }
        else
        {
            // 非タブモードでは1つだけ表示
            foreach (var (id, panel) in _panels)
            {
                panel.Visibility = id == moduleId ? Visibility.Visible : Visibility.Collapsed;
            }
        }

        _activeModuleId = moduleId;
        ActiveModuleChanged?.Invoke(this, moduleId);
    }

    /// <summary>
    /// すべてのパネルを非表示
    /// </summary>
    public void HideAll()
    {
        foreach (var (_, panel) in _panels)
        {
            panel.Visibility = Visibility.Collapsed;
        }

        if (_tabControl != null)
        {
            foreach (TabItem tab in _tabControl.Items)
            {
                tab.Visibility = Visibility.Collapsed;
            }
        }

        _activeModuleId = null;
    }

    /// <summary>現在表示中のモジュール ID</summary>
    public string? ActiveModuleId => _activeModuleId;

    /// <summary>表示中モジュールが変更されたときに発火</summary>
    public event EventHandler<string>? ActiveModuleChanged;

    /// <summary>登録済みパネルの数</summary>
    public int PanelCount => _panels.Count;

    /// <summary>有効なパネルがあるか</summary>
    public bool HasEnabledPanels =>
        _panels.Keys.Any(id => _addonManager.IsEnabled(id));

    /// <summary>
    /// モジュール状態に応じてパネル表示を更新
    /// </summary>
    public void RefreshVisibility()
    {
        if (_position == AddonPanelPosition.Tab && _tabControl != null)
        {
            foreach (TabItem tab in _tabControl.Items)
            {
                var tabModuleId = tab.Tag as string;
                if (tabModuleId != null)
                {
                    tab.Visibility = _addonManager.IsEnabled(tabModuleId)
                        ? Visibility.Visible
                        : Visibility.Collapsed;
                }
            }
        }
        else
        {
            // アクティブモジュールが無効化された場合、別の有効なモジュールを表示
            if (_activeModuleId != null && !_addonManager.IsEnabled(_activeModuleId))
            {
                var firstEnabled = _panels.Keys.FirstOrDefault(id => _addonManager.IsEnabled(id));
                if (firstEnabled != null)
                    ShowPanel(firstEnabled);
                else
                    HideAll();
            }
        }
    }

    private void OnModuleStateChanged(object? sender, ModuleStateChangedEventArgs e)
    {
        if (!_panels.ContainsKey(e.ModuleId)) return;

        // UI スレッドで更新
        Dispatcher.Invoke(() =>
        {
            if (e.IsEnabled)
            {
                // タブモードでは表示するだけ、非タブモードではアクティブにする
                if (_position == AddonPanelPosition.Tab)
                    RefreshVisibility();
                else
                    ShowPanel(e.ModuleId);
            }
            else
            {
                RefreshVisibility();
            }
        });
    }
}
