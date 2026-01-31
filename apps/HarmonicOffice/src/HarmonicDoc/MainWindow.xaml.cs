using System.Windows;
using System.Windows.Input;
using HarmonicOffice.Common.License;

namespace HarmonicDoc;

public partial class MainWindow : Window
{
    private const string VERSION = "1.0.0";
    private const string PRODUCT_CODE = "HMDC";
    private const string PRODUCT_NAME = "HarmonicDoc";

    private readonly InsightLicenseManager _licenseManager;
    private bool _isJapanese = true;

    // Feature matrix: feature -> allowed plans
    private readonly Dictionary<string, PlanCode[]> _featureMatrix = new()
    {
        ["read_doc"] = [PlanCode.Free, PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["write_doc"] = [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["convert"] = [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["template"] = [PlanCode.Trial, PlanCode.Pro, PlanCode.Ent],
        ["batch"] = [PlanCode.Pro, PlanCode.Ent],
        ["macro"] = [PlanCode.Pro, PlanCode.Ent],
    };

    public MainWindow()
    {
        InitializeComponent();
        _licenseManager = new InsightLicenseManager(PRODUCT_CODE, PRODUCT_NAME);
        UpdatePlanBadge();
    }

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
            ? WindowState.Normal : WindowState.Maximized;

    private void CloseButton_Click(object sender, RoutedEventArgs e) => Close();

    private void LanguageToggle_Click(object sender, RoutedEventArgs e)
    {
        _isJapanese = !_isJapanese;
        LanguageButton.Content = _isJapanese ? "English" : "日本語";
        LicenseButtonText.Text = _isJapanese ? "ライセンス" : "License";
        // Update other UI text as needed
    }

    private void LicenseButton_Click(object sender, RoutedEventArgs e)
    {
        var licenseWindow = new Views.LicenseWindow(_licenseManager, _featureMatrix, _isJapanese);
        licenseWindow.Owner = this;
        licenseWindow.ShowDialog();
        UpdatePlanBadge();
    }

    private void UpdatePlanBadge()
    {
        PlanBadgeText.Text = _licenseManager.CurrentLicense.PlanDisplayName;
    }
}
