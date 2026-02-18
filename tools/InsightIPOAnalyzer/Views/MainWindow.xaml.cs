using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using InsightIPOAnalyzer.Helpers;
using InsightIPOAnalyzer.Models;
using InsightIPOAnalyzer.ViewModels;
using InsightIPOAnalyzer.Views.Controls;

namespace InsightIPOAnalyzer.Views;

public partial class MainWindow : Window
{
    private readonly MainViewModel _vm;
    private readonly Dictionary<string, IpoNodeControl> _nodeControls = new();
    private IpoNodeControl? _selectedNodeControl;

    public string[] DataTypesList => DataTypes.All;

    public MainWindow()
    {
        InitializeComponent();
        DataContext = this;

        _vm = new MainViewModel();
        _vm.PropertyChanged += ViewModel_PropertyChanged;

        ShowProjectProperties();
        RefreshUI();
    }

    // --- ViewModel property change handler ---

    private void ViewModel_PropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        switch (e.PropertyName)
        {
            case nameof(MainViewModel.IsDirty):
                DirtyIndicator.Visibility = _vm.IsDirty ? Visibility.Visible : Visibility.Collapsed;
                break;
            case nameof(MainViewModel.StatusText):
                StatusText.Text = _vm.StatusText;
                break;
            case nameof(MainViewModel.NodeCount):
                StatusNodeCount.Text = _vm.TotalNodeCount.ToString();
                break;
            case nameof(MainViewModel.CanNavigateUp):
                BtnNavigateUp.Visibility = _vm.CanNavigateUp ? Visibility.Visible : Visibility.Collapsed;
                break;
            case nameof(MainViewModel.CurrentLevelName):
                StatusLevelName.Text = _vm.CurrentLevelName;
                break;
            case nameof(MainViewModel.ProjectName):
                ProjectNameDisplay.Text = _vm.ProjectName;
                if (ProjectPropsPanel.Visibility == Visibility.Visible)
                    UpdateProjectPropsUI();
                break;
            case nameof(MainViewModel.ProjectDescription):
                ProjectDescDisplay.Text = _vm.ProjectDescription;
                break;
        }
    }

    // --- Refresh UI ---

    private void RefreshUI()
    {
        RefreshCanvas();
        RefreshTreeView();
        RefreshBreadcrumb();
        RefreshStatusBar();
        RefreshPropertiesDisplay();
    }

    private void RefreshCanvas()
    {
        // Clear existing controls
        var toRemove = DiagramCanvas.Children.OfType<IpoNodeControl>().ToList();
        foreach (var ctrl in toRemove)
        {
            DiagramCanvas.Children.Remove(ctrl);
        }
        _nodeControls.Clear();

        // Add nodes for current level
        foreach (var node in _vm.CurrentLevelNodes)
        {
            AddNodeToCanvas(node);
        }

        // Show/hide empty hint
        EmptyCanvasHint.Visibility = _vm.CurrentLevelNodes.Count == 0
            ? Visibility.Visible
            : Visibility.Collapsed;
    }

    private void AddNodeToCanvas(IpoNode node)
    {
        var control = new IpoNodeControl
        {
            IpoNode = node,
            ViewModel = _vm,
        };

        control.NodeSelected += NodeControl_Selected;
        control.DrillDownRequested += NodeControl_DrillDown;
        control.PositionChanged += NodeControl_PositionChanged;
        control.DataChanged += NodeControl_DataChanged;

        Canvas.SetLeft(control, node.X);
        Canvas.SetTop(control, node.Y);

        DiagramCanvas.Children.Add(control);
        _nodeControls[node.Id] = control;
    }

    private void RefreshTreeView()
    {
        ProjectTreeView.Items.Clear();
        ProjectNameDisplay.Text = _vm.ProjectName;
        ProjectDescDisplay.Text = _vm.ProjectDescription;

        var treeData = _vm.GetProjectTree();
        foreach (var item in treeData)
        {
            var treeItem = CreateTreeViewItem(item);
            ProjectTreeView.Items.Add(treeItem);
        }
    }

    private TreeViewItem CreateTreeViewItem(TreeNodeItem item)
    {
        var tvi = new TreeViewItem
        {
            Header = item.Name,
            Tag = item,
            IsExpanded = true,
            FontSize = 12,
            Foreground = item.NodeType == "step"
                ? (item.HasSubAnalysis
                    ? FindResource("PrimaryBrush") as SolidColorBrush
                    : FindResource("TextSecondaryBrush") as SolidColorBrush)
                : FindResource("TextPrimaryBrush") as SolidColorBrush,
        };

        if (item.HasSubAnalysis)
        {
            tvi.FontWeight = FontWeights.SemiBold;
        }

        foreach (var child in item.Children)
        {
            tvi.Items.Add(CreateTreeViewItem(child));
        }

        return tvi;
    }

    private void RefreshBreadcrumb()
    {
        BreadcrumbPanel.Items.Clear();

        for (int i = 0; i < _vm.BreadcrumbPath.Count; i++)
        {
            var crumb = _vm.BreadcrumbPath[i];
            var isLast = i == _vm.BreadcrumbPath.Count - 1;

            if (i > 0)
            {
                BreadcrumbPanel.Items.Add(new TextBlock
                {
                    Text = " > ",
                    FontSize = 13,
                    Foreground = FindResource("TextTertiaryBrush") as SolidColorBrush,
                    VerticalAlignment = VerticalAlignment.Center,
                });
            }

            if (isLast)
            {
                BreadcrumbPanel.Items.Add(new TextBlock
                {
                    Text = crumb.Name,
                    FontSize = 13,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = FindResource("TextPrimaryBrush") as SolidColorBrush,
                    VerticalAlignment = VerticalAlignment.Center,
                });
            }
            else
            {
                var index = i;
                var link = new Button
                {
                    Content = crumb.Name,
                    Style = FindResource("ToolbarButtonStyle") as Style,
                    FontSize = 13,
                    Padding = new Thickness(4, 2, 4, 2),
                };
                link.Click += (s, e) =>
                {
                    _vm.NavigateTo(index);
                    RefreshUI();
                };
                BreadcrumbPanel.Items.Add(link);
            }
        }
    }

    private void RefreshStatusBar()
    {
        StatusNodeCount.Text = _vm.TotalNodeCount.ToString();
        StatusLevelName.Text = _vm.CurrentLevelName;
        StatusText.Text = _vm.StatusText;
        DirtyIndicator.Visibility = _vm.IsDirty ? Visibility.Visible : Visibility.Collapsed;
        BtnNavigateUp.Visibility = _vm.CanNavigateUp ? Visibility.Visible : Visibility.Collapsed;
    }

    private void RefreshPropertiesDisplay()
    {
        if (_vm.SelectedElement is IpoNode node)
        {
            ShowNodeProperties(node);
        }
        else
        {
            ShowProjectProperties();
        }
    }

    // --- Properties Panel ---

    private void ShowProjectProperties()
    {
        NoSelectionText.Visibility = Visibility.Collapsed;
        ProjectPropsPanel.Visibility = Visibility.Visible;
        NodePropsPanel.Visibility = Visibility.Collapsed;
        UpdateProjectPropsUI();
    }

    private void UpdateProjectPropsUI()
    {
        TxtProjectName.TextChanged -= ProjectName_TextChanged;
        TxtProjectDescription.TextChanged -= ProjectDescription_TextChanged;
        TxtProjectAuthor.TextChanged -= ProjectAuthor_TextChanged;

        TxtProjectName.Text = _vm.ProjectName;
        TxtProjectDescription.Text = _vm.ProjectDescription;
        TxtProjectAuthor.Text = _vm.ProjectAuthor;

        TxtProjectName.TextChanged += ProjectName_TextChanged;
        TxtProjectDescription.TextChanged += ProjectDescription_TextChanged;
        TxtProjectAuthor.TextChanged += ProjectAuthor_TextChanged;
    }

    private void ShowNodeProperties(IpoNode node)
    {
        NoSelectionText.Visibility = Visibility.Collapsed;
        ProjectPropsPanel.Visibility = Visibility.Collapsed;
        NodePropsPanel.Visibility = Visibility.Visible;

        TxtNodeName.TextChanged -= NodeName_TextChanged;
        TxtNodeDescription.TextChanged -= NodeDescription_TextChanged;

        TxtNodeName.Text = node.Name;
        TxtNodeDescription.Text = node.Description;

        PropsInputsList.ItemsSource = null;
        PropsInputsList.ItemsSource = node.Inputs;
        PropsStepsList.ItemsSource = null;
        PropsStepsList.ItemsSource = node.ProcessSteps.OrderBy(s => s.Order).ToList();
        PropsOutputsList.ItemsSource = null;
        PropsOutputsList.ItemsSource = node.Outputs;

        TxtNodeName.TextChanged += NodeName_TextChanged;
        TxtNodeDescription.TextChanged += NodeDescription_TextChanged;
    }

    // --- Node Control Events ---

    private void NodeControl_Selected(object? sender, EventArgs e)
    {
        if (sender is not IpoNodeControl control) return;

        // Deselect previous
        if (_selectedNodeControl is not null)
        {
            _selectedNodeControl.IsSelected = false;
        }

        _selectedNodeControl = control;
        _selectedNodeControl.IsSelected = true;
        _vm.SelectedElement = control.IpoNode;

        if (control.IpoNode is not null)
        {
            ShowNodeProperties(control.IpoNode);
        }
    }

    private void NodeControl_DrillDown(object? sender, IpoProcessStep step)
    {
        _vm.DrillDown(step);
        _selectedNodeControl = null;
        RefreshUI();
    }

    private void NodeControl_PositionChanged(object? sender, (double X, double Y) pos)
    {
        // Position is already updated in the control
    }

    private void NodeControl_DataChanged(object? sender, EventArgs e)
    {
        RefreshTreeView();
        if (_selectedNodeControl?.IpoNode is not null)
        {
            ShowNodeProperties(_selectedNodeControl.IpoNode);
        }
    }

    // --- Titlebar ---

    private void Titlebar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ToggleMaximize();
        }
        else
        {
            DragMove();
        }
    }

    private void Titlebar_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        // No-op (DragMove handles it)
    }

    private void ToggleMaximize()
    {
        if (WindowState == WindowState.Maximized)
        {
            WindowState = WindowState.Normal;
            WindowBorder.CornerRadius = new CornerRadius(8);
        }
        else
        {
            WindowState = WindowState.Maximized;
            WindowBorder.CornerRadius = new CornerRadius(0);
        }
    }

    private void Minimize_Click(object sender, RoutedEventArgs e) => WindowState = WindowState.Minimized;

    private void Maximize_Click(object sender, RoutedEventArgs e) => ToggleMaximize();

    private void Close_Click(object sender, RoutedEventArgs e)
    {
        if (_vm.IsDirty)
        {
            var result = MessageBox.Show(
                Strings.UnsavedChanges,
                Strings.Confirm,
                MessageBoxButton.YesNoCancel,
                MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                _vm.SaveProject();
                Close();
            }
            else if (result == MessageBoxResult.No)
            {
                Close();
            }
            // Cancel = do nothing
        }
        else
        {
            Close();
        }
    }

    // --- Toolbar Commands ---

    private void New_Click(object sender, RoutedEventArgs e)
    {
        _vm.NewProject();
        _selectedNodeControl = null;
        RefreshUI();
    }

    private void Open_Click(object sender, RoutedEventArgs e)
    {
        _vm.OpenProject();
        _selectedNodeControl = null;
        RefreshUI();
    }

    private void Save_Click(object sender, RoutedEventArgs e) => _vm.SaveProjectAs();

    private void Export_Click(object sender, RoutedEventArgs e) => _vm.ExportJson();

    private void Import_Click(object sender, RoutedEventArgs e)
    {
        _vm.ImportJson();
        _selectedNodeControl = null;
        RefreshUI();
    }

    private void Sample_Click(object sender, RoutedEventArgs e)
    {
        _vm.LoadSample();
        _selectedNodeControl = null;
        RefreshUI();
    }

    private void AddNode_Click(object sender, RoutedEventArgs e)
    {
        _vm.AddNode();
        RefreshUI();

        // Select the newly added node
        var lastNode = _vm.CurrentLevelNodes.LastOrDefault();
        if (lastNode is not null && _nodeControls.TryGetValue(lastNode.Id, out var ctrl))
        {
            NodeControl_Selected(ctrl, EventArgs.Empty);
        }
    }

    private void Delete_Click(object sender, RoutedEventArgs e)
    {
        _vm.DeleteSelectedNode();
        _selectedNodeControl = null;
        RefreshUI();
    }

    // --- Navigation ---

    private void NavigateUp_Click(object sender, RoutedEventArgs e)
    {
        _vm.NavigateUp();
        _selectedNodeControl = null;
        RefreshUI();
    }

    // --- Canvas ---

    private void Canvas_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        // Clicking on empty canvas deselects
        if (e.OriginalSource is System.Windows.Shapes.Rectangle || e.OriginalSource == DiagramCanvas)
        {
            if (_selectedNodeControl is not null)
            {
                _selectedNodeControl.IsSelected = false;
                _selectedNodeControl = null;
            }
            _vm.SelectedElement = null;
            ShowProjectProperties();
        }
    }

    // --- Tree View ---

    private void ProjectTree_SelectedItemChanged(object sender, RoutedPropertyChangedEventArgs<object> e)
    {
        // Tree selection can highlight corresponding node on canvas
        if (e.NewValue is TreeViewItem tvi && tvi.Tag is TreeNodeItem treeNode)
        {
            if (treeNode.NodeType == "node" && _nodeControls.TryGetValue(treeNode.Id, out var ctrl))
            {
                NodeControl_Selected(ctrl, EventArgs.Empty);
            }
        }
    }

    // --- Properties TextChanged ---

    private void ProjectName_TextChanged(object sender, TextChangedEventArgs e)
    {
        _vm.ProjectName = TxtProjectName.Text;
        RefreshTreeView();
    }

    private void ProjectDescription_TextChanged(object sender, TextChangedEventArgs e)
    {
        _vm.ProjectDescription = TxtProjectDescription.Text;
    }

    private void ProjectAuthor_TextChanged(object sender, TextChangedEventArgs e)
    {
        _vm.ProjectAuthor = TxtProjectAuthor.Text;
    }

    private void NodeName_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_vm.SelectedElement is IpoNode node)
        {
            node.Name = TxtNodeName.Text;
            _vm.IsDirty = true;
            _selectedNodeControl?.RefreshData();
            RefreshTreeView();
        }
    }

    private void NodeDescription_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_vm.SelectedElement is IpoNode node)
        {
            node.Description = TxtNodeDescription.Text;
            _vm.IsDirty = true;
        }
    }

    // --- Language Toggle ---

    private void LanguageToggle_Click(object sender, RoutedEventArgs e)
    {
        Strings.ToggleLanguage();
        RefreshAllStrings();
    }

    private void RefreshAllStrings()
    {
        // Toolbar
        BtnNewText.Text = Strings.NewProject;
        BtnOpenText.Text = Strings.OpenProject;
        BtnSaveText.Text = Strings.SaveProject;
        BtnExportText.Text = Strings.ExportJson;
        BtnImportText.Text = Strings.ImportJson;
        BtnSampleText.Text = Strings.LoadSample;
        BtnAddNodeText.Text = Strings.AddNode;
        BtnDeleteText.Text = Strings.DeleteNode;

        // Panels
        TreeHeaderText.Text = Strings.ProjectTree;
        PropertiesHeaderText.Text = Strings.Properties;

        // Properties labels
        ProjectPropsHeader.Text = Strings.ProjectProperties;
        NodePropsHeader.Text = Strings.NodeProperties;
        LblProjectName.Text = Strings.Name;
        LblProjectDesc.Text = Strings.Description;
        LblProjectAuthor.Text = Strings.Author;
        LblNodeName.Text = Strings.Name;
        LblNodeDesc.Text = Strings.Description;
        LblInputs.Text = Strings.Input;
        LblProcess.Text = Strings.Process;
        LblOutputs.Text = Strings.Output;
        NoSelectionText.Text = Strings.NoSelection;

        // Status bar
        StatusNodesLabel.Text = Strings.Nodes + ": ";
        StatusLevelLabel.Text = Strings.Level + ": ";

        // Language toggle
        LanguageText.Text = Strings.LanguageToggle;

        // Empty hint
        EmptyHintLine1.Text = Strings.IsJapanese
            ? "ここにIPOノードを追加して分析を開始"
            : "Add IPO nodes here to start analysis";
        EmptyHintLine2.Text = Strings.IsJapanese
            ? "ツールバーの「ノード追加」をクリック、またはサンプルを読み込み"
            : "Click 'Add Node' in toolbar, or load a sample";

        // Status
        StatusText.Text = Strings.Ready;
    }
}
