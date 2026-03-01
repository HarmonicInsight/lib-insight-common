using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Media;

namespace InsightCommon.UI;

/// <summary>
/// 全アプリ共通の UI スケール管理。Singleton。
/// LayoutTransform + ScaleTransform で Window 全体を均一スケーリングする。
///
/// <para>
/// <b>使い方</b>:
/// <list type="number">
///   <item><c>InsightScaleManager.Instance.ApplyToWindow(window)</c> を MainWindow の Loaded イベントで呼ぶ</item>
///   <item>ViewModel に ZoomIn / ZoomOut / Reset コマンドを追加</item>
///   <item>XAML に Ctrl+Plus / Ctrl+Minus / Ctrl+0 の KeyBinding を追加</item>
///   <item>ステータスバーに <c>ScalePercent</c> をバインドして表示</item>
/// </list>
/// </para>
///
/// <para>
/// <b>設計思想</b>:
/// Window の root content に <c>ScaleTransform</c> を <c>LayoutTransform</c> として適用し、
/// FontSize・Margin・コントロールサイズ等を均一にスケーリングする。
/// Syncfusion コンポーネント（Ribbon / Spreadsheet / RichTextBoxAdv）も自動で追従する。
/// 個別の FontSize 変更は不要。
/// </para>
///
/// <para>
/// <b>仕様定義</b>: <c>config/ui-scale.ts</c>
/// </para>
/// </summary>
public sealed class InsightScaleManager : INotifyPropertyChanged
{
    /// <summary>Singleton インスタンス</summary>
    public static InsightScaleManager Instance { get; } = new();

    // ── スケール範囲（config/ui-scale.ts と同期） ──

    /// <summary>最小倍率 (50%)</summary>
    public const double MinScale = 0.5;

    /// <summary>最大倍率 (200%)</summary>
    public const double MaxScale = 2.0;

    /// <summary>デフォルト倍率 (100%)</summary>
    public const double DefaultScale = 1.0;

    /// <summary>プリセット間のステップ (25%)</summary>
    public const double Step = 0.25;

    /// <summary>微調整ステップ (5%)</summary>
    public const double FineStep = 0.05;

    /// <summary>プリセット倍率一覧（Binding 用）</summary>
    public static double[] Presets => [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

    // ── 状態 ──

    private double _scaleFactor = DefaultScale;

    /// <summary>
    /// 現在のスケールファクター (0.5〜2.0)。
    /// 設定すると即座に全 Window に反映され、ファイルに永続化される。
    /// </summary>
    public double ScaleFactor
    {
        get => _scaleFactor;
        set
        {
            var clamped = Math.Clamp(value, MinScale, MaxScale);
            clamped = Math.Round(clamped, 2);
            if (Math.Abs(_scaleFactor - clamped) < 0.001) return;
            _scaleFactor = clamped;
            OnPropertyChanged();
            OnPropertyChanged(nameof(ScalePercent));
            ScaleChanged?.Invoke(this, clamped);
            Save();
        }
    }

    /// <summary>現在のスケールをパーセント文字列で返す（例: "125%"）</summary>
    public string ScalePercent => $"{(int)(_scaleFactor * 100)}%";

    // ── イベント ──

    /// <summary>スケールファクターが変更されたときに発火する</summary>
    public event EventHandler<double>? ScaleChanged;

    /// <inheritdoc />
    public event PropertyChangedEventHandler? PropertyChanged;

    // ── コンストラクタ ──

    private InsightScaleManager()
    {
        Load();
    }

    // ── Window 適用 ──

    /// <summary>
    /// Window に ScaleTransform を適用する。
    /// <c>InsightWindowChrome.Apply()</c> から自動呼び出しされるため、
    /// 通常は手動で呼ぶ必要はない。
    ///
    /// <para>
    /// InsightWindowChrome を使わない Window（ダイアログ等）では
    /// Loaded イベントで手動呼び出しすること。
    /// </para>
    /// </summary>
    /// <param name="window">対象の Window</param>
    public void ApplyToWindow(Window window)
    {
        if (window.Content is not FrameworkElement root) return;

        root.LayoutTransform = new ScaleTransform(_scaleFactor, _scaleFactor);

        // WeakReference でリークを防止
        var weakRoot = new WeakReference<FrameworkElement>(root);
        ScaleChanged += (_, factor) =>
        {
            if (weakRoot.TryGetTarget(out var r) && r.LayoutTransform is ScaleTransform st)
            {
                st.ScaleX = factor;
                st.ScaleY = factor;
            }
        };
    }

    // ── 操作 ──

    /// <summary>ステップ分拡大する (Ctrl+Plus)</summary>
    public void ZoomIn() => ScaleFactor += Step;

    /// <summary>ステップ分縮小する (Ctrl+Minus)</summary>
    public void ZoomOut() => ScaleFactor -= Step;

    /// <summary>100% にリセットする (Ctrl+0)</summary>
    public void Reset() => ScaleFactor = DefaultScale;

    /// <summary>指定倍率に設定する（プリセットボタン用）</summary>
    /// <param name="factor">スケールファクター (0.5〜2.0)</param>
    public void SetScale(double factor) => ScaleFactor = factor;

    // ── 永続化 ──

    private static string SettingsDir =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "HarmonicInsight");

    private static string SettingsPath =>
        Path.Combine(SettingsDir, "ui-scale.json");

    private void Save()
    {
        try
        {
            Directory.CreateDirectory(SettingsDir);
            var data = new ScaleSettings
            {
                ScaleFactor = _scaleFactor,
                LastModified = DateTime.UtcNow.ToString("o"),
            };
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(SettingsPath, json);
        }
        catch
        {
            // 保存失敗は無視（次回起動時にデフォルト値になるだけ）
        }
    }

    private void Load()
    {
        try
        {
            if (!File.Exists(SettingsPath)) return;
            var json = File.ReadAllText(SettingsPath);
            var data = JsonSerializer.Deserialize<ScaleSettings>(json);
            if (data != null)
            {
                _scaleFactor = Math.Clamp(data.ScaleFactor, MinScale, MaxScale);
                _scaleFactor = Math.Round(_scaleFactor, 2);
            }
        }
        catch
        {
            _scaleFactor = DefaultScale;
        }
    }

    private void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

    // ── 永続化モデル ──

    private sealed class ScaleSettings
    {
        public double ScaleFactor { get; set; } = DefaultScale;
        public string LastModified { get; set; } = "";
    }
}
