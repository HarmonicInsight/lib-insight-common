using System.Windows;
using System.Windows.Input;
using HarmonicOffice.Common.License;
using HarmonicSheet.Views;

namespace HarmonicSheet;

public partial class MainWindow : Window
{
    private readonly InsightLicenseManager _licenseManager;
    private bool _isJapanese = true;

    /// <summary>
    /// HarmonicSheet 機能マトリクス
    /// キー: 機能名, 値: その機能を利用可能なプラン一覧
    /// </summary>
    private readonly Dictionary<string, PlanCode[]> _featureMatrix = new()
    {
        ["read_excel"]  = [PlanCode.Free, PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["write_excel"] = [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["formula"]     = [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["macro"]       = [PlanCode.Trial, PlanCode.Pro, PlanCode.Ent],
        ["batch"]       = [PlanCode.Pro, PlanCode.Ent],
        ["template"]    = [PlanCode.Pro, PlanCode.Ent],
    };

    public MainWindow()
    {
        InitializeComponent();
        _licenseManager = new InsightLicenseManager("HMSH", "HarmonicSheet");
        UpdatePlanBadge();
        UpdateLanguageUI();
    }

    // ── タイトルバー操作 ──

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
            MaximizeButton_Click(sender, e);
        else
            DragMove();
    }

    private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        => WindowState = WindowState.Minimized;

    private void MaximizeButton_Click(object sender, RoutedEventArgs e)
        => WindowState = WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;

    private void CloseButton_Click(object sender, RoutedEventArgs e)
        => Close();

    // ── 言語切り替え ──

    private void LanguageToggle_Click(object sender, RoutedEventArgs e)
    {
        _isJapanese = !_isJapanese;
        UpdateLanguageUI();
    }

    private void UpdateLanguageUI()
    {
        if (_isJapanese)
        {
            // 日本語モード: ボタンには反対の言語を表示
            LanguageToggleButton.Content = "English";
            LicenseButtonText.Text = "ライセンス";
            ToolbarTitleText.Text = "Excel 操作ツール";
            BtnReadExcel.Content = "Excel 読み込み";
            BtnWriteExcel.Content = "Excel 書き出し";
            BtnFormula.Content = "数式操作";
            BtnMacro.Content = "マクロ実行";
            BtnBatch.Content = "一括処理";
            BtnTemplate.Content = "テンプレート";
            PlaceholderSubText.Text = "Excel ファイルを選択するか、上のツールバーから操作を選んでください";
        }
        else
        {
            // 英語モード: ボタンには反対の言語を表示
            LanguageToggleButton.Content = "日本語";
            LicenseButtonText.Text = "License";
            ToolbarTitleText.Text = "Excel Operations";
            BtnReadExcel.Content = "Read Excel";
            BtnWriteExcel.Content = "Write Excel";
            BtnFormula.Content = "Formulas";
            BtnMacro.Content = "Run Macro";
            BtnBatch.Content = "Batch Process";
            BtnTemplate.Content = "Templates";
            PlaceholderSubText.Text = "Select an Excel file or choose an operation from the toolbar above";
        }
    }

    // ── ライセンス ──

    private void LicenseButton_Click(object sender, RoutedEventArgs e)
    {
        var licenseWindow = new LicenseWindow(_licenseManager, _isJapanese);
        licenseWindow.Owner = this;
        licenseWindow.ShowDialog();
        UpdatePlanBadge();
    }

    private void UpdatePlanBadge()
    {
        PlanBadgeText.Text = _licenseManager.CurrentLicense.PlanDisplayName;
    }
}
