using System.Windows;

namespace InsightIPOAnalyzer;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // グローバル例外ハンドラー
        DispatcherUnhandledException += (sender, args) =>
        {
            MessageBox.Show(
                $"予期しないエラーが発生しました:\n{args.Exception.Message}",
                "エラー",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            args.Handled = true;
        };
    }
}
