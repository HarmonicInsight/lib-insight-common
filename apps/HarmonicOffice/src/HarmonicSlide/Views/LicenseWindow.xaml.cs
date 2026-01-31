using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using HarmonicOffice.Common.License;

namespace HarmonicSlide.Views;

public partial class LicenseWindow : Window
{
    private readonly InsightLicenseManager _licenseManager;
    private readonly Dictionary<string, PlanCode[]> _featureMatrix;
    private readonly bool _isJapanese;

    public LicenseWindow(InsightLicenseManager licenseManager, Dictionary<string, PlanCode[]> featureMatrix, bool isJapanese)
    {
        InitializeComponent();
        _licenseManager = licenseManager;
        _featureMatrix = featureMatrix;
        _isJapanese = isJapanese;
        UpdateUI();
    }

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e) => DragMove();
    private void CloseButton_Click(object sender, RoutedEventArgs e) => Close();

    private void Activate_Click(object sender, RoutedEventArgs e)
    {
        var email = EmailInput.Text.Trim();
        var key = KeyInput.Text.Trim();
        var (success, message) = _licenseManager.Activate(email, key);
        StatusMessage.Text = message;
        StatusMessage.Foreground = success
            ? (Brush)FindResource("SuccessBrush")
            : (Brush)FindResource("ErrorBrush");
        if (success) UpdateUI();
    }

    private void Clear_Click(object sender, RoutedEventArgs e)
    {
        _licenseManager.Deactivate();
        EmailInput.Text = "";
        KeyInput.Text = "";
        StatusMessage.Text = _isJapanese ? "ライセンスをクリアしました。" : "License cleared.";
        StatusMessage.Foreground = (Brush)FindResource("TextSecondaryBrush");
        UpdateUI();
    }

    private void KeyInput_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter) Activate_Click(sender, e);
    }

    private void UpdateUI()
    {
        var license = _licenseManager.CurrentLicense;
        PlanText.Text = license.PlanDisplayName;
        ExpiryText.Text = license.ExpiresAt.HasValue
            ? (_isJapanese ? $"有効期限: {license.ExpiresAt.Value:yyyy年MM月dd日}" : $"Expires: {license.ExpiresAt.Value:yyyy/MM/dd}")
            : (_isJapanese ? "有効期限: -" : "Expires: -");

        if (license.Email != null) EmailInput.Text = license.Email;
        if (license.Key != null) KeyInput.Text = license.Key;

        FeatureList.Children.Clear();
        var features = new Dictionary<string, string>
        {
            ["read_pptx"] = _isJapanese ? "PPTX読取" : "Read PPTX",
            ["write_pptx"] = _isJapanese ? "PPTX書込" : "Write PPTX",
            ["extract_slides"] = _isJapanese ? "スライド抽出" : "Extract Slides",
            ["generate_pdf"] = _isJapanese ? "PDF生成" : "Generate PDF",
            ["batch"] = _isJapanese ? "バッチ処理" : "Batch Processing",
            ["template"] = _isJapanese ? "テンプレート" : "Template",
        };

        foreach (var (featureKey, label) in features)
        {
            var available = _licenseManager.CanUseFeature(_featureMatrix, featureKey);
            var panel = new System.Windows.Controls.StackPanel { Orientation = System.Windows.Controls.Orientation.Horizontal, Margin = new Thickness(0, 4, 0, 4) };
            panel.Children.Add(new System.Windows.Controls.TextBlock
            {
                Text = available ? "\u25CB" : "\u00D7",
                Foreground = available ? (Brush)FindResource("SuccessBrush") : (Brush)FindResource("TextTertiaryBrush"),
                FontSize = 14,
                Width = 24,
                VerticalAlignment = VerticalAlignment.Center
            });
            panel.Children.Add(new System.Windows.Controls.TextBlock
            {
                Text = label,
                Foreground = (Brush)FindResource("TextPrimaryBrush"),
                FontSize = 14,
                FontFamily = new FontFamily("Segoe UI Variable, Segoe UI, Yu Gothic UI"),
                VerticalAlignment = VerticalAlignment.Center
            });
            FeatureList.Children.Add(panel);
        }
    }
}
