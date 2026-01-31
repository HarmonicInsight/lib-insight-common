using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using HarmonicOffice.Common.License;

namespace HarmonicSheet.Views;

public partial class LicenseWindow : Window
{
    private readonly InsightLicenseManager _licenseManager;
    private bool _isJapanese;

    /// <summary>
    /// HarmonicSheet 機能マトリクス（表示用）
    /// </summary>
    private readonly Dictionary<string, (string JaName, string EnName, PlanCode[] AllowedPlans)> _featureMatrix = new()
    {
        ["read_excel"]  = ("Excel 読み込み",  "Read Excel",     [PlanCode.Free, PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent]),
        ["write_excel"] = ("Excel 書き出し",  "Write Excel",    [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent]),
        ["formula"]     = ("数式操作",        "Formulas",       [PlanCode.Trial, PlanCode.Std, PlanCode.Pro, PlanCode.Ent]),
        ["macro"]       = ("マクロ実行",      "Run Macro",      [PlanCode.Trial, PlanCode.Pro, PlanCode.Ent]),
        ["batch"]       = ("一括処理",        "Batch Process",  [PlanCode.Pro, PlanCode.Ent]),
        ["template"]    = ("テンプレート",    "Templates",      [PlanCode.Pro, PlanCode.Ent]),
    };

    public LicenseWindow(InsightLicenseManager licenseManager, bool isJapanese)
    {
        InitializeComponent();
        _licenseManager = licenseManager;
        _isJapanese = isJapanese;
        UpdateUI();
    }

    // ── タイトルバー操作 ──

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        DragMove();
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = true;
        Close();
    }

    // ── アクティベーション ──

    private void Activate_Click(object sender, RoutedEventArgs e)
    {
        var email = EmailTextBox.Text.Trim();
        var key = LicenseKeyTextBox.Text.Trim();

        var (success, message) = _licenseManager.Activate(email, key);

        StatusMessage.Text = message;
        StatusMessage.Foreground = success
            ? (Brush)FindResource("SuccessBrush")
            : (Brush)FindResource("ErrorBrush");

        if (success)
        {
            UpdateUI();
        }
    }

    private void Clear_Click(object sender, RoutedEventArgs e)
    {
        _licenseManager.Deactivate();
        EmailTextBox.Text = string.Empty;
        LicenseKeyTextBox.Text = string.Empty;
        StatusMessage.Text = _isJapanese
            ? "ライセンスがクリアされました。"
            : "License has been cleared.";
        StatusMessage.Foreground = (Brush)FindResource("TextSecondaryBrush");
        UpdateUI();
    }

    private void TextBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            Activate_Click(sender, e);
        }
    }

    // ── UI 更新 ──

    private void UpdateUI()
    {
        var license = _licenseManager.CurrentLicense;

        // プラン表示
        CurrentPlanText.Text = license.PlanDisplayName;

        // 有効期限
        if (license.ExpiresAt.HasValue)
        {
            ExpiryDateText.Text = _isJapanese
                ? $"有効期限: {license.ExpiresAt.Value:yyyy年MM月dd日}"
                : $"Expires: {license.ExpiresAt.Value:yyyy/MM/dd}";
            ExpiryDateText.Visibility = Visibility.Visible;
        }
        else
        {
            ExpiryDateText.Text = _isJapanese ? "有効期限: -" : "Expires: -";
            ExpiryDateText.Visibility = Visibility.Visible;
        }

        // メール・キー復元
        if (!string.IsNullOrEmpty(license.Email))
            EmailTextBox.Text = license.Email;
        if (!string.IsNullOrEmpty(license.Key))
            LicenseKeyTextBox.Text = license.Key;

        // 言語テキスト更新
        UpdateLanguageTexts();

        // 機能一覧更新
        UpdateFeatureList();
    }

    private void UpdateLanguageTexts()
    {
        if (_isJapanese)
        {
            WindowTitleText.Text = "ライセンス管理";
            CurrentPlanLabel.Text = "現在のプラン";
            FeatureListLabel.Text = "機能一覧";
            ActivationSectionLabel.Text = "ライセンス認証";
            EmailLabel.Text = "メールアドレス";
            LicenseKeyLabel.Text = "ライセンスキー";
            ActivateButton.Content = "アクティベート";
            ClearButton.Content = "クリア";
        }
        else
        {
            WindowTitleText.Text = "License Management";
            CurrentPlanLabel.Text = "Current Plan";
            FeatureListLabel.Text = "Features";
            ActivationSectionLabel.Text = "License Activation";
            EmailLabel.Text = "Email Address";
            LicenseKeyLabel.Text = "License Key";
            ActivateButton.Content = "Activate";
            ClearButton.Content = "Clear";
        }
    }

    private void UpdateFeatureList()
    {
        FeatureListPanel.Children.Clear();
        var currentPlan = _licenseManager.CurrentLicense.Plan;

        foreach (var (_, (jaName, enName, allowedPlans)) in _featureMatrix)
        {
            var isAvailable = allowedPlans.Contains(currentPlan);
            var featureName = _isJapanese ? jaName : enName;
            var statusSymbol = isAvailable ? "\u25CB" : "\u00D7";

            var row = new Grid();
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            row.Margin = new Thickness(0, 0, 0, 6);

            var nameBlock = new TextBlock
            {
                Text = featureName,
                FontSize = 13,
                Foreground = (Brush)FindResource("TextPrimaryBrush"),
                VerticalAlignment = VerticalAlignment.Center
            };
            Grid.SetColumn(nameBlock, 0);

            var statusBlock = new TextBlock
            {
                Text = statusSymbol,
                FontSize = 14,
                FontWeight = FontWeights.SemiBold,
                Foreground = isAvailable
                    ? (Brush)FindResource("SuccessBrush")
                    : (Brush)FindResource("TextTertiaryBrush"),
                VerticalAlignment = VerticalAlignment.Center,
                HorizontalAlignment = HorizontalAlignment.Right
            };
            Grid.SetColumn(statusBlock, 1);

            row.Children.Add(nameBlock);
            row.Children.Add(statusBlock);
            FeatureListPanel.Children.Add(row);
        }
    }
}
