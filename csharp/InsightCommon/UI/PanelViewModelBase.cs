using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using InsightCommon.License;

namespace InsightCommon.UI;

/// <summary>
/// Insight Series 共通パネルViewModel基底クラス
///
/// 全製品のサイドパネル（履歴・AI・掲示板等）で共通の開閉制御、
/// リサイズ、ライセンスゲートを提供。
/// </summary>
public abstract class PanelViewModelBase : INotifyPropertyChanged
{
    private readonly PanelDefinition _definition;
    private readonly InsightLicenseManager? _licenseManager;

    private bool _isOpen;
    private double _width;
    private bool _isPoppedOut;

    protected PanelViewModelBase(
        PanelDefinition definition,
        InsightLicenseManager? licenseManager = null)
    {
        _definition = definition;
        _licenseManager = licenseManager;
        _width = definition.DefaultWidth;

        ToggleCommand = new RelayCommand(Toggle, CanToggle);
        PopOutCommand = new RelayCommand(PopOut, () => IsOpen && !IsPoppedOut);
        PopInCommand = new RelayCommand(PopIn, () => IsPoppedOut);
    }

    // ═══════════════════════════════════════════════════════════════
    // プロパティ
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// パネル定義情報
    /// </summary>
    public PanelDefinition Definition => _definition;

    /// <summary>
    /// パネルID
    /// </summary>
    public string PanelId => _definition.Id;

    /// <summary>
    /// パネル表示名（日本語）
    /// </summary>
    public string NameJa => _definition.NameJa;

    /// <summary>
    /// パネル表示名（英語）
    /// </summary>
    public string NameEn => _definition.NameEn;

    /// <summary>
    /// Segoe MDL2 Assetsアイコン
    /// </summary>
    public string IconMdl2 => _definition.IconMdl2;

    /// <summary>
    /// 絵文字アイコン
    /// </summary>
    public string IconEmoji => _definition.IconEmoji;

    /// <summary>
    /// パネルが開いているか
    /// </summary>
    public bool IsOpen
    {
        get => _isOpen;
        set
        {
            if (_isOpen == value) return;
            _isOpen = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(GridWidth));
            OnPropertyChanged(nameof(Opacity));
            OnIsOpenChanged(value);
        }
    }

    /// <summary>
    /// パネル幅（ピクセル）
    /// </summary>
    public double Width
    {
        get => _width;
        set
        {
            var newWidth = Math.Max(_definition.MinWidth, value);
            if (Math.Abs(_width - newWidth) < 0.1) return;
            _width = newWidth;
            OnPropertyChanged();
            OnPropertyChanged(nameof(GridWidth));
        }
    }

    /// <summary>
    /// Grid列幅用（閉じている場合は0）
    /// </summary>
    public double GridWidth => IsOpen ? Width : 0;

    /// <summary>
    /// 最小幅
    /// </summary>
    public double MinWidth => _definition.MinWidth;

    /// <summary>
    /// 別ウィンドウにポップアウト中か
    /// </summary>
    public bool IsPoppedOut
    {
        get => _isPoppedOut;
        set
        {
            if (_isPoppedOut == value) return;
            _isPoppedOut = value;
            OnPropertyChanged();
            ((RelayCommand)PopOutCommand).RaiseCanExecuteChanged();
            ((RelayCommand)PopInCommand).RaiseCanExecuteChanged();
        }
    }

    /// <summary>
    /// ツールバーアイコンの透明度（閉:0.4, 開:1.0）
    /// </summary>
    public double Opacity => IsOpen ? 1.0 : 0.4;

    /// <summary>
    /// ライセンス上利用可能か
    /// </summary>
    public bool IsAvailable
    {
        get
        {
            if (_licenseManager == null) return true;
            if (_definition.LicenseGate == PanelLicenseGate.None) return true;

            var plan = _licenseManager.CurrentLicense?.Plan ?? PlanCode.Trial;
            return _definition.LicenseGate switch
            {
                PanelLicenseGate.Biz => plan >= PlanCode.Biz,
                PanelLicenseGate.Ent => plan >= PlanCode.Ent,
                _ => true
            };
        }
    }

    /// <summary>
    /// 必要なプラン名（ライセンスゲートがある場合）
    /// </summary>
    public string? RequiredPlanName => _definition.LicenseGate switch
    {
        PanelLicenseGate.Biz => "BIZ",
        PanelLicenseGate.Ent => "ENT",
        _ => null
    };

    // ═══════════════════════════════════════════════════════════════
    // コマンド
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// パネル開閉トグルコマンド
    /// </summary>
    public ICommand ToggleCommand { get; }

    /// <summary>
    /// ポップアウトコマンド（別ウィンドウに出す）
    /// </summary>
    public ICommand PopOutCommand { get; }

    /// <summary>
    /// ポップインコマンド（本体に戻す）
    /// </summary>
    public ICommand PopInCommand { get; }

    // ═══════════════════════════════════════════════════════════════
    // メソッド
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// パネルを開く
    /// </summary>
    public void Open()
    {
        if (!CanToggle()) return;
        IsOpen = true;
    }

    /// <summary>
    /// パネルを閉じる
    /// </summary>
    public void Close()
    {
        IsOpen = false;
    }

    /// <summary>
    /// パネル開閉をトグル
    /// </summary>
    public void Toggle()
    {
        if (!CanToggle()) return;
        IsOpen = !IsOpen;
    }

    /// <summary>
    /// トグル可否（ライセンスチェック）
    /// </summary>
    protected virtual bool CanToggle()
    {
        // 閉じる操作は常に許可
        if (IsOpen) return true;

        // ライセンスチェック
        return IsAvailable;
    }

    /// <summary>
    /// ポップアウト（派生クラスで実装）
    /// </summary>
    protected virtual void PopOut()
    {
        IsPoppedOut = true;
        OnPopOut();
    }

    /// <summary>
    /// ポップイン（派生クラスで実装）
    /// </summary>
    protected virtual void PopIn()
    {
        IsPoppedOut = false;
        OnPopIn();
    }

    /// <summary>
    /// 幅をリセット
    /// </summary>
    public void ResetWidth()
    {
        Width = _definition.DefaultWidth;
    }

    // ═══════════════════════════════════════════════════════════════
    // 仮想メソッド（派生クラスでオーバーライド）
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 開閉状態変更時のコールバック
    /// </summary>
    protected virtual void OnIsOpenChanged(bool isOpen) { }

    /// <summary>
    /// ポップアウト時のコールバック
    /// </summary>
    protected virtual void OnPopOut() { }

    /// <summary>
    /// ポップイン時のコールバック
    /// </summary>
    protected virtual void OnPopIn() { }

    // ═══════════════════════════════════════════════════════════════
    // INotifyPropertyChanged
    // ═══════════════════════════════════════════════════════════════

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

/// <summary>
/// 履歴パネルViewModel基底クラス
/// </summary>
public abstract class HistoryPanelViewModelBase : PanelViewModelBase
{
    protected HistoryPanelViewModelBase(InsightLicenseManager? licenseManager = null)
        : base(InsightIcons.Panels.History, licenseManager) { }

    /// <summary>
    /// 比較モード中か
    /// </summary>
    public abstract bool IsCompareMode { get; set; }

    /// <summary>
    /// 比較モード切り替えコマンド
    /// </summary>
    public abstract ICommand ToggleCompareModeCommand { get; }

    /// <summary>
    /// バージョン保存コマンド
    /// </summary>
    public abstract ICommand SaveVersionCommand { get; }
}

/// <summary>
/// AIアシスタントパネルViewModel基底クラス
/// </summary>
public abstract class AiPanelViewModelBase : PanelViewModelBase
{
    protected AiPanelViewModelBase(InsightLicenseManager? licenseManager = null)
        : base(InsightIcons.Panels.AI, licenseManager) { }

    /// <summary>
    /// APIキーが設定されているか
    /// </summary>
    public abstract bool HasApiKey { get; }

    /// <summary>
    /// 送信中か
    /// </summary>
    public abstract bool IsSending { get; }

    /// <summary>
    /// メッセージ送信コマンド
    /// </summary>
    public abstract ICommand SendCommand { get; }

    /// <summary>
    /// チャットクリアコマンド
    /// </summary>
    public abstract ICommand ClearCommand { get; }
}

/// <summary>
/// 参考資料パネルViewModel基底クラス
/// </summary>
public abstract class ReferencePanelViewModelBase : PanelViewModelBase
{
    protected ReferencePanelViewModelBase(InsightLicenseManager? licenseManager = null)
        : base(InsightIcons.Panels.Reference, licenseManager) { }

    /// <summary>
    /// 資料数
    /// </summary>
    public abstract int MaterialCount { get; }

    /// <summary>
    /// ファイル追加コマンド
    /// </summary>
    public abstract ICommand AddFileCommand { get; }

    /// <summary>
    /// 全削除コマンド
    /// </summary>
    public abstract ICommand ClearAllCommand { get; }
}

/// <summary>
/// シンプルなRelayCommand実装
/// </summary>
public class RelayCommand : ICommand
{
    private readonly Action _execute;
    private readonly Func<bool>? _canExecute;

    public RelayCommand(Action execute, Func<bool>? canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public event EventHandler? CanExecuteChanged;

    public bool CanExecute(object? parameter) => _canExecute?.Invoke() ?? true;

    public void Execute(object? parameter) => _execute();

    public void RaiseCanExecuteChanged()
    {
        CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }
}

/// <summary>
/// パラメータ付きRelayCommand実装
/// </summary>
public class RelayCommand<T> : ICommand
{
    private readonly Action<T?> _execute;
    private readonly Func<T?, bool>? _canExecute;

    public RelayCommand(Action<T?> execute, Func<T?, bool>? canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public event EventHandler? CanExecuteChanged;

    public bool CanExecute(object? parameter) =>
        _canExecute?.Invoke(parameter is T t ? t : default) ?? true;

    public void Execute(object? parameter) =>
        _execute(parameter is T t ? t : default);

    public void RaiseCanExecuteChanged()
    {
        CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }
}

/// <summary>
/// パネル定義情報（InsightIconsから移動せず参照用に再定義）
/// </summary>
public record PanelDefinition(
    string Id,
    string NameJa,
    string NameEn,
    string IconMdl2,
    string IconEmoji,
    int DefaultWidth,
    int MinWidth,
    PanelLicenseGate LicenseGate
);

/// <summary>
/// パネルのライセンス制御
/// </summary>
public enum PanelLicenseGate
{
    None,
    Biz,
    Ent
}
