using System.Windows;
using System.Windows.Input;
using HarmonicOffice.Common.License;

namespace HarmonicSlide;

public partial class MainWindow : Window
{
    private const string VERSION = "1.0.0";
    private const string PRODUCT_CODE = "HMSL";
    private const string PRODUCT_NAME = "HarmonicSlide";

    private readonly InsightLicenseManager _licenseManager;
    private bool _isJapanese = true;

    private readonly Dictionary<string, PlanCode[]> _featureMatrix = new()
    {
        ["read_pptx"] = [PlanCode.Free, PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["write_pptx"] = [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["extract_slides"] = [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent],
        ["generate_pdf"] = [PlanCode.Trial, PlanCode.Pro, PlanCode.Ent],
        ["batch"] = [PlanCode.Pro, PlanCode.Ent],
        ["template"] = [PlanCode.Pro, PlanCode.Ent],
    };

    public MainWindow()
    {
        InitializeComponent();
        _licenseManager = new InsightLicenseManager(PRODUCT_CODE, PRODUCT_NAME);
        UpdatePlanBadge();
    }

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2) MaximizeButton_Click(sender, e);
        else DragMove();
    }

    private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        => WindowState = WindowState.Minimized;

    private void MaximizeButton_Click(object sender, RoutedEventArgs e)
        => WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void CloseButton_Click(object sender, RoutedEventArgs e) => Close();

    private void LanguageToggle_Click(object sender, RoutedEventArgs e)
    {
        _isJapanese = !_isJapanese;
        LanguageButton.Content = _isJapanese ? "English" : "日本語";
        LicenseButtonText.Text = _isJapanese ? "ライセンス" : "License";
    }

    private void LicenseButton_Click(object sender, RoutedEventArgs e)
    {
        var win = new Views.LicenseWindow(_licenseManager, _featureMatrix, _isJapanese);
        win.Owner = this;
        win.ShowDialog();
        UpdatePlanBadge();
    }

    private void UpdatePlanBadge()
    {
        PlanBadgeText.Text = _licenseManager.CurrentLicense.PlanDisplayName;
    }
}
