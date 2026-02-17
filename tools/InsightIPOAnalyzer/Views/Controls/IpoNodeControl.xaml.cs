using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using InsightIPOAnalyzer.Models;
using InsightIPOAnalyzer.ViewModels;

namespace InsightIPOAnalyzer.Views.Controls;

public partial class IpoNodeControl : UserControl
{
    private bool _isDragging;
    private Point _dragStartPoint;
    private Point _originalPosition;

    public static readonly DependencyProperty IpoNodeProperty =
        DependencyProperty.Register(nameof(IpoNode), typeof(IpoNode), typeof(IpoNodeControl),
            new PropertyMetadata(null, OnIpoNodeChanged));

    public static readonly DependencyProperty IsSelectedProperty =
        DependencyProperty.Register(nameof(IsSelected), typeof(bool), typeof(IpoNodeControl),
            new PropertyMetadata(false, OnIsSelectedChanged));

    public static readonly DependencyProperty ViewModelProperty =
        DependencyProperty.Register(nameof(ViewModel), typeof(MainViewModel), typeof(IpoNodeControl));

    public IpoNode? IpoNode
    {
        get => (IpoNode?)GetValue(IpoNodeProperty);
        set => SetValue(IpoNodeProperty, value);
    }

    public bool IsSelected
    {
        get => (bool)GetValue(IsSelectedProperty);
        set => SetValue(IsSelectedProperty, value);
    }

    public MainViewModel? ViewModel
    {
        get => (MainViewModel?)GetValue(ViewModelProperty);
        set => SetValue(ViewModelProperty, value);
    }

    /// <summary>
    /// ドリルダウンイベント。プロセスステップのサブ分析にナビゲート。
    /// </summary>
    public event EventHandler<IpoProcessStep>? DrillDownRequested;

    /// <summary>
    /// ノード位置変更イベント。
    /// </summary>
    public event EventHandler<(double X, double Y)>? PositionChanged;

    /// <summary>
    /// ノード選択イベント。
    /// </summary>
    public event EventHandler? NodeSelected;

    /// <summary>
    /// ノードのデータ変更イベント。
    /// </summary>
    public event EventHandler? DataChanged;

    public IpoNodeControl()
    {
        InitializeComponent();
        MouseLeftButtonDown += OnMouseLeftButtonDown;
    }

    private static void OnIpoNodeChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is IpoNodeControl control && e.NewValue is IpoNode node)
        {
            control.RefreshData();
        }
    }

    private static void OnIsSelectedChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is IpoNodeControl control)
        {
            control.UpdateSelectionVisual();
        }
    }

    public void RefreshData()
    {
        if (IpoNode is null) return;

        NodeNameText.Text = IpoNode.Name;
        InputsList.ItemsSource = null;
        InputsList.ItemsSource = IpoNode.Inputs;
        ProcessStepsList.ItemsSource = null;
        ProcessStepsList.ItemsSource = IpoNode.ProcessSteps.OrderBy(s => s.Order).ToList();
        OutputsList.ItemsSource = null;
        OutputsList.ItemsSource = IpoNode.Outputs;
    }

    private void UpdateSelectionVisual()
    {
        if (IsSelected)
        {
            NodeBorder.BorderBrush = FindResource("SelectionBrush") as SolidColorBrush;
            NodeBorder.BorderThickness = new Thickness(2);
        }
        else
        {
            NodeBorder.BorderBrush = FindResource("BorderBrush") as SolidColorBrush;
            NodeBorder.BorderThickness = new Thickness(1);
        }
    }

    private void OnMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        NodeSelected?.Invoke(this, EventArgs.Empty);
    }

    // --- Drag Support ---

    private void NodeHeader_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2) return; // ダブルクリックは無視

        _isDragging = true;
        _dragStartPoint = e.GetPosition(Parent as UIElement);
        _originalPosition = new Point(
            Canvas.GetLeft(this),
            Canvas.GetTop(this));

        if (double.IsNaN(_originalPosition.X)) _originalPosition.X = 0;
        if (double.IsNaN(_originalPosition.Y)) _originalPosition.Y = 0;

        (sender as UIElement)?.CaptureMouse();
        e.Handled = true;
        NodeSelected?.Invoke(this, EventArgs.Empty);
    }

    private void NodeHeader_MouseMove(object sender, MouseEventArgs e)
    {
        if (!_isDragging) return;

        var currentPos = e.GetPosition(Parent as UIElement);
        var offsetX = currentPos.X - _dragStartPoint.X;
        var offsetY = currentPos.Y - _dragStartPoint.Y;

        var newX = Math.Max(0, _originalPosition.X + offsetX);
        var newY = Math.Max(0, _originalPosition.Y + offsetY);

        Canvas.SetLeft(this, newX);
        Canvas.SetTop(this, newY);
    }

    private void NodeHeader_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (!_isDragging) return;

        _isDragging = false;
        (sender as UIElement)?.ReleaseMouseCapture();

        var newX = Canvas.GetLeft(this);
        var newY = Canvas.GetTop(this);

        if (IpoNode is not null)
        {
            IpoNode.X = newX;
            IpoNode.Y = newY;
            PositionChanged?.Invoke(this, (newX, newY));
        }
    }

    // --- Add/Remove Items ---

    private void AddInput_Click(object sender, RoutedEventArgs e)
    {
        if (IpoNode is null || ViewModel is null) return;
        ViewModel.AddInput(IpoNode);
        RefreshData();
        DataChanged?.Invoke(this, EventArgs.Empty);
    }

    private void AddStep_Click(object sender, RoutedEventArgs e)
    {
        if (IpoNode is null || ViewModel is null) return;
        ViewModel.AddProcessStep(IpoNode);
        RefreshData();
        DataChanged?.Invoke(this, EventArgs.Empty);
    }

    private void AddOutput_Click(object sender, RoutedEventArgs e)
    {
        if (IpoNode is null || ViewModel is null) return;
        ViewModel.AddOutput(IpoNode);
        RefreshData();
        DataChanged?.Invoke(this, EventArgs.Empty);
    }

    private void RemoveInput_Click(object sender, RoutedEventArgs e)
    {
        if (IpoNode is null || ViewModel is null) return;
        if (sender is Button btn && btn.Tag is IpoItem item)
        {
            ViewModel.RemoveInput(IpoNode, item);
            RefreshData();
            DataChanged?.Invoke(this, EventArgs.Empty);
        }
    }

    private void RemoveStep_Click(object sender, RoutedEventArgs e)
    {
        if (IpoNode is null || ViewModel is null) return;
        if (sender is Button btn && btn.Tag is IpoProcessStep step)
        {
            ViewModel.RemoveProcessStep(IpoNode, step);
            RefreshData();
            DataChanged?.Invoke(this, EventArgs.Empty);
        }
    }

    private void RemoveOutput_Click(object sender, RoutedEventArgs e)
    {
        if (IpoNode is null || ViewModel is null) return;
        if (sender is Button btn && btn.Tag is IpoItem item)
        {
            ViewModel.RemoveOutput(IpoNode, item);
            RefreshData();
            DataChanged?.Invoke(this, EventArgs.Empty);
        }
    }

    private void DrillDown_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button btn && btn.Tag is IpoProcessStep step)
        {
            DrillDownRequested?.Invoke(this, step);
        }
    }
}
