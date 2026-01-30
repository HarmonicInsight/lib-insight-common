using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Media;
using HarmonicTools.LicenseManager.Models;
using HarmonicTools.LicenseManager.Services;
using Microsoft.Win32;

namespace HarmonicTools.LicenseManager;

public partial class MainWindow : Window
{
    private readonly LicenseGenerator _generator = new();
    private readonly LicenseStore _store;

    public MainWindow()
    {
        InitializeComponent();

        _store = LicenseStore.Load();

        // 製品コンボボックス初期化
        foreach (var code in LicenseGenerator.ProductCodes)
        {
            var name = LicenseGenerator.ProductNames.GetValueOrDefault(code, code);
            ProductCombo.Items.Add(new ComboBoxItem { Content = $"{code} - {name}", Tag = code });
        }
        ProductCombo.SelectedIndex = 0;

        // プランコンボボックス初期化
        foreach (var plan in LicenseGenerator.PlanCodes)
        {
            PlanCombo.Items.Add(new ComboBoxItem { Content = plan, Tag = plan });
        }
        PlanCombo.SelectedIndex = 1; // STD default

        // 月コンボボックス初期化
        for (int i = 1; i <= 12; i++)
        {
            MonthCombo.Items.Add(new ComboBoxItem { Content = i.ToString("D2"), Tag = i });
        }
        MonthCombo.SelectedIndex = DateTime.Now.Month - 1;

        // 履歴表示
        RefreshGrid();
    }

    // ── Title Bar ──

    private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
            ToggleMaximize();
        else
            DragMove();
    }

    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;
    private void Maximize_Click(object sender, RoutedEventArgs e) => ToggleMaximize();
    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    private void ToggleMaximize()
    {
        WindowState = WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;
    }

    // ── Generate ──

    private void ProductCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        // 製品選択時の処理（将来拡張用）
    }

    private void Generate_Click(object sender, RoutedEventArgs e)
    {
        var productItem = ProductCombo.SelectedItem as ComboBoxItem;
        var planItem = PlanCombo.SelectedItem as ComboBoxItem;
        var monthItem = MonthCombo.SelectedItem as ComboBoxItem;

        if (productItem == null || planItem == null || monthItem == null)
        {
            ShowError("全ての項目を選択してください。");
            return;
        }

        var email = EmailBox.Text.Trim();
        if (string.IsNullOrEmpty(email) || !email.Contains('@'))
        {
            ShowError("有効なメールアドレスを入力してください。");
            return;
        }

        if (!int.TryParse(YearBox.Text.Trim(), out var year) || year < 25 || year > 99)
        {
            ShowError("年は 25-99 の範囲で入力してください。");
            return;
        }

        var productCode = productItem.Tag as string ?? "";
        var plan = planItem.Tag as string ?? "";
        var month = (int)(monthItem.Tag ?? 1);

        try
        {
            var key = _generator.Generate(productCode, plan, email, year, month);

            // 検証
            var verified = _generator.Verify(key, email);

            GeneratedKeyText.Text = key;
            VerifyBadge.Text = verified ? "検証OK" : "検証NG";
            VerifyBadge.Foreground = verified
                ? (Brush)FindResource("SuccessBrush")
                : (Brush)FindResource("ErrorBrush");

            // 記録保存
            var record = new LicenseRecord
            {
                Key = key,
                ProductCode = productCode,
                ProductName = LicenseGenerator.ProductNames.GetValueOrDefault(productCode, productCode),
                Plan = plan,
                Email = email,
                ExpiryYYMM = $"{year:D2}{month:D2}",
                IssuedAt = DateTime.Now,
                Note = NoteBox.Text.Trim()
            };

            _store.Add(record);
            RefreshGrid();
        }
        catch (Exception ex)
        {
            ShowError($"キー生成エラー: {ex.Message}");
        }
    }

    // ── Actions ──

    private void CopyKey_Click(object sender, RoutedEventArgs e)
    {
        if (!string.IsNullOrEmpty(GeneratedKeyText.Text))
        {
            Clipboard.SetText(GeneratedKeyText.Text);
        }
    }

    private void ExportCsv_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new SaveFileDialog
        {
            Filter = "CSV files (*.csv)|*.csv",
            FileName = $"licenses_{DateTime.Now:yyyyMMdd}.csv",
            DefaultExt = ".csv"
        };

        if (dialog.ShowDialog() == true)
        {
            try
            {
                var csv = _store.ExportCsv();
                System.IO.File.WriteAllText(dialog.FileName, csv, System.Text.Encoding.UTF8);
                MessageBox.Show($"エクスポート完了: {dialog.FileName}", "完了",
                    MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                ShowError($"エクスポートエラー: {ex.Message}");
            }
        }
    }

    private void DeleteRecord_Click(object sender, RoutedEventArgs e)
    {
        if (LicenseGrid.SelectedItem is LicenseRecord record)
        {
            var result = MessageBox.Show(
                $"このライセンス記録を削除しますか？\n{record.Key}",
                "確認", MessageBoxButton.YesNo, MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                _store.Remove(record);
                RefreshGrid();
            }
        }
    }

    // ── Helpers ──

    private void RefreshGrid()
    {
        LicenseGrid.ItemsSource = null;
        LicenseGrid.ItemsSource = _store.Records;
    }

    private static void ShowError(string message)
    {
        MessageBox.Show(message, "エラー", MessageBoxButton.OK, MessageBoxImage.Warning);
    }
}

/// <summary>
/// 空文字列で Collapsed、それ以外で Visible を返すコンバーター
/// </summary>
public class StringToVisibilityConverter : IValueConverter
{
    public static readonly StringToVisibilityConverter Instance = new();

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return string.IsNullOrEmpty(value as string) ? Visibility.Collapsed : Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
