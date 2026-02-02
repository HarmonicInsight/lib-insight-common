namespace InsightCommon.Addon;

/// <summary>
/// InsightOffice アプリ統合ガイド
///
/// 各 InsightOffice アプリ（HMSH/HMDC/HMSL）が AddonManager を
/// 初期化し、モジュール UI をホストするためのリファレンス実装。
///
/// ## App.xaml.cs での初期化
///
/// <code>
/// public partial class App : Application
/// {
///     public static InsightLicenseManager LicenseManager { get; private set; } = null!;
///     public static AddonManager AddonManager { get; private set; } = null!;
///     public static PythonScriptRunner PythonRunner { get; private set; } = null!;
///     public static ReferenceMaterialsService ReferenceService { get; private set; } = null!;
///     public static VoiceAndAvatarService VoiceService { get; private set; } = null!;
///
///     protected override void OnStartup(StartupEventArgs e)
///     {
///         base.OnStartup(e);
///
///         // Step 1: ライセンスマネージャー初期化
///         LicenseManager = new InsightLicenseManager("HMSH", "HarmonicSheet");
///
///         // Step 2: アドインマネージャー初期化
///         AddonManager = new AddonManager("HMSH", "HarmonicSheet", LicenseManager);
///         AddonManager.Initialize();
///
///         // Step 3: モジュールサービス初期化（有効なモジュールのみ）
///         if (AddonManager.IsEnabled("python_runtime"))
///             PythonRunner = new PythonScriptRunner("HMSH", AddonManager);
///
///         if (AddonManager.IsEnabled("reference_materials"))
///             ReferenceService = new ReferenceMaterialsService("HarmonicSheet");
///
///         if (AddonManager.IsEnabled("voice_input") || AddonManager.IsEnabled("vrm_avatar"))
///             VoiceService = new VoiceAndAvatarService(AddonManager);
///
///         // Step 4: モジュール状態変更をリッスン
///         AddonManager.ModuleStateChanged += OnModuleStateChanged;
///     }
///
///     private void OnModuleStateChanged(object? sender, ModuleStateChangedEventArgs e)
///     {
///         // モジュール有効化時にサービスを遅延初期化
///         switch (e.ModuleId)
///         {
///             case "python_runtime" when e.IsEnabled:
///                 PythonRunner ??= new PythonScriptRunner("HMSH", AddonManager);
///                 break;
///             case "reference_materials" when e.IsEnabled:
///                 ReferenceService ??= new ReferenceMaterialsService("HarmonicSheet");
///                 break;
///         }
///     }
/// }
/// </code>
///
/// ## MainWindow.xaml.cs でのパネルホスト設定
///
/// <code>
/// public partial class MainWindow : Window
/// {
///     private AddonPanelHost _rightPanelHost = null!;
///     private AddonPanelHost _bottomPanelHost = null!;
///
///     public MainWindow()
///     {
///         InitializeComponent();
///         SetupAddonPanels();
///     }
///
///     private void SetupAddonPanels()
///     {
///         var addonManager = App.AddonManager;
///
///         // 右パネルホスト
///         _rightPanelHost = new AddonPanelHost(addonManager, AddonPanelPosition.Right);
///         _rightPanelHost.RegisterPanel("ai_assistant", new AiAssistantPanel());
///         _rightPanelHost.RegisterPanel("reference_materials", new ReferenceMaterialsPanel(App.ReferenceService));
///         RightPanelContainer.Content = _rightPanelHost;
///
///         // 下パネルホスト
///         _bottomPanelHost = new AddonPanelHost(addonManager, AddonPanelPosition.Bottom);
///
///         if (App.PythonRunner != null)
///         {
///             _bottomPanelHost.RegisterPanel("ai_code_editor",
///                 new AiCodeEditorHost(addonManager, App.PythonRunner));
///             _bottomPanelHost.RegisterPanel("python_scripts",
///                 new PythonScriptsPanel(addonManager, App.PythonRunner, "HarmonicSheet"));
///         }
///
///         BottomPanelContainer.Content = _bottomPanelHost;
///     }
///
///     // アドイン管理画面を開く
///     private void OnAddonSettingsClick(object sender, RoutedEventArgs e)
///     {
///         var panel = new AddonSettingsPanel(App.AddonManager);
///         var window = new Window
///         {
///             Title = "アドイン管理",
///             Content = panel,
///             Width = 600,
///             Height = 500,
///             WindowStartupLocation = WindowStartupLocation.CenterOwner,
///             Owner = this,
///         };
///         window.ShowDialog();
///
///         // 設定変更後にパネル表示を更新
///         _rightPanelHost.RefreshVisibility();
///         _bottomPanelHost.RefreshVisibility();
///     }
/// }
/// </code>
///
/// ## 製品別の実装差分
///
/// | 項目 | HMSH | HMDC | HMSL |
/// |------|------|------|------|
/// | ProductCode | "HMSH" | "HMDC" | "HMSL" |
/// | ProductName | "HarmonicSheet" | "HarmonicDoc" | "HarmonicSlide" |
/// | board/messaging | ✅ サポート | ❌ なし | ❌ なし |
/// | ドキュメント形式 | .xlsx | .docx | .pptx |
/// | Python ライブラリ | openpyxl | python-docx | python-pptx |
/// | Syncfusion コンポーネント | SfSpreadsheet | SfRichTextBox | SfPresentation |
///
/// </summary>
public static class AddonIntegrationGuide
{
    // このクラスはドキュメント専用（実行コードなし）
    // 詳細は XML ドキュメントコメントを参照
}
