using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows;
using InsightIPOAnalyzer.Helpers;
using InsightIPOAnalyzer.Models;
using InsightIPOAnalyzer.Services;
using Microsoft.Win32;

namespace InsightIPOAnalyzer.ViewModels;

/// <summary>
/// メインウィンドウのViewModel。
/// プロジェクト管理、キャンバス上のノード管理、階層ナビゲーションを担当。
/// </summary>
public class MainViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    private IpoProject _project;
    private string? _currentParentStepId;
    private object? _selectedElement;
    private string? _currentFilePath;
    private bool _isDirty;
    private string _statusText;

    public MainViewModel()
    {
        _project = new IpoProject { Name = Strings.NewProject };
        _statusText = Strings.Ready;
        BreadcrumbPath = new ObservableCollection<BreadcrumbItem>();
        CurrentLevelNodes = new ObservableCollection<IpoNode>();
        NavigationStack = new Stack<string?>();

        RefreshCurrentLevel();
    }

    // --- Properties ---

    public IpoProject Project
    {
        get => _project;
        set { _project = value; OnPropertyChanged(); OnPropertyChanged(nameof(ProjectName)); }
    }

    public string ProjectName
    {
        get => _project.Name;
        set { _project.Name = value; MarkDirty(); OnPropertyChanged(); }
    }

    public string ProjectDescription
    {
        get => _project.Description;
        set { _project.Description = value; MarkDirty(); OnPropertyChanged(); }
    }

    public string ProjectAuthor
    {
        get => _project.Author;
        set { _project.Author = value; MarkDirty(); OnPropertyChanged(); }
    }

    public ObservableCollection<IpoNode> CurrentLevelNodes { get; }
    public ObservableCollection<BreadcrumbItem> BreadcrumbPath { get; }
    public Stack<string?> NavigationStack { get; }

    public object? SelectedElement
    {
        get => _selectedElement;
        set { _selectedElement = value; OnPropertyChanged(); OnPropertyChanged(nameof(HasSelection)); OnPropertyChanged(nameof(SelectedNodeName)); OnPropertyChanged(nameof(SelectedNodeDescription)); }
    }

    public bool HasSelection => _selectedElement is not null;

    public string? SelectedNodeName
    {
        get => (_selectedElement as IpoNode)?.Name;
        set { if (_selectedElement is IpoNode node) { node.Name = value ?? ""; MarkDirty(); OnPropertyChanged(); } }
    }

    public string? SelectedNodeDescription
    {
        get => (_selectedElement as IpoNode)?.Description;
        set { if (_selectedElement is IpoNode node) { node.Description = value ?? ""; MarkDirty(); OnPropertyChanged(); } }
    }

    public bool IsDirty
    {
        get => _isDirty;
        set { _isDirty = value; OnPropertyChanged(); }
    }

    public string StatusText
    {
        get => _statusText;
        set { _statusText = value; OnPropertyChanged(); }
    }

    public int NodeCount => CurrentLevelNodes.Count;

    public int TotalNodeCount => _project.Nodes.Count;

    public bool CanNavigateUp => NavigationStack.Count > 0;

    public string CurrentLevelName
    {
        get
        {
            if (_currentParentStepId is null) return Strings.RootLevel;
            var parentNode = _project.Nodes.FirstOrDefault(n =>
                n.ProcessSteps.Any(s => s.Id == _currentParentStepId));
            var step = parentNode?.ProcessSteps.FirstOrDefault(s => s.Id == _currentParentStepId);
            return step?.Name ?? Strings.RootLevel;
        }
    }

    // --- Project Commands ---

    public void NewProject()
    {
        if (_isDirty && !ConfirmDiscard()) return;

        _project = new IpoProject { Name = Strings.IsJapanese ? "新しいプロジェクト" : "New Project" };
        _currentFilePath = null;
        _currentParentStepId = null;
        NavigationStack.Clear();
        SelectedElement = null;
        IsDirty = false;
        RefreshCurrentLevel();
        OnPropertyChanged(nameof(ProjectName));
        OnPropertyChanged(nameof(ProjectDescription));
        OnPropertyChanged(nameof(ProjectAuthor));
        StatusText = Strings.Ready;
    }

    public async void SaveProject()
    {
        if (_currentFilePath is null)
        {
            SaveProjectAs();
            return;
        }

        try
        {
            await ProjectService.ExportAsync(_project, _currentFilePath);
            IsDirty = false;
            StatusText = Strings.SaveSuccess;
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, Strings.Error, MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    public async void SaveProjectAs()
    {
        var dlg = new SaveFileDialog
        {
            Filter = $"{Strings.JsonFiles} (*.json)|*.json|{Strings.AllFiles} (*.*)|*.*",
            DefaultExt = ".json",
            FileName = string.IsNullOrWhiteSpace(_project.Name) ? "ipo-project" : _project.Name
        };

        if (dlg.ShowDialog() == true)
        {
            _currentFilePath = dlg.FileName;
            try
            {
                await ProjectService.ExportAsync(_project, _currentFilePath);
                IsDirty = false;
                StatusText = Strings.SaveSuccess;
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, Strings.Error, MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public async void OpenProject()
    {
        if (_isDirty && !ConfirmDiscard()) return;

        var dlg = new OpenFileDialog
        {
            Filter = $"{Strings.JsonFiles} (*.json)|*.json|{Strings.AllFiles} (*.*)|*.*"
        };

        if (dlg.ShowDialog() == true)
        {
            try
            {
                _project = await ProjectService.ImportAsync(dlg.FileName);
                _currentFilePath = dlg.FileName;
                _currentParentStepId = null;
                NavigationStack.Clear();
                SelectedElement = null;
                IsDirty = false;
                RefreshCurrentLevel();
                OnPropertyChanged(nameof(Project));
                OnPropertyChanged(nameof(ProjectName));
                OnPropertyChanged(nameof(ProjectDescription));
                OnPropertyChanged(nameof(ProjectAuthor));
                StatusText = Strings.LoadSuccess;
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, Strings.Error, MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public async void ExportJson()
    {
        var dlg = new SaveFileDialog
        {
            Filter = $"{Strings.JsonFiles} (*.json)|*.json",
            DefaultExt = ".json",
            FileName = $"{(_project.Name.Length > 0 ? _project.Name : "ipo-export")}.json"
        };

        if (dlg.ShowDialog() == true)
        {
            try
            {
                await ProjectService.ExportAsync(_project, dlg.FileName);
                StatusText = Strings.SaveSuccess;
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, Strings.Error, MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public async void ImportJson()
    {
        var dlg = new OpenFileDialog
        {
            Filter = $"{Strings.JsonFiles} (*.json)|*.json|{Strings.AllFiles} (*.*)|*.*"
        };

        if (dlg.ShowDialog() == true)
        {
            try
            {
                _project = await ProjectService.ImportAsync(dlg.FileName);
                _currentParentStepId = null;
                NavigationStack.Clear();
                SelectedElement = null;
                IsDirty = true;
                RefreshCurrentLevel();
                OnPropertyChanged(nameof(Project));
                OnPropertyChanged(nameof(ProjectName));
                OnPropertyChanged(nameof(ProjectDescription));
                OnPropertyChanged(nameof(ProjectAuthor));
                StatusText = Strings.LoadSuccess;
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, Strings.Error, MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    public void LoadSample()
    {
        if (_isDirty && !ConfirmDiscard()) return;

        _project = ProjectService.CreateSampleProject();
        _currentFilePath = null;
        _currentParentStepId = null;
        NavigationStack.Clear();
        SelectedElement = null;
        IsDirty = false;
        RefreshCurrentLevel();
        OnPropertyChanged(nameof(Project));
        OnPropertyChanged(nameof(ProjectName));
        OnPropertyChanged(nameof(ProjectDescription));
        OnPropertyChanged(nameof(ProjectAuthor));
        StatusText = Strings.LoadSuccess;
    }

    // --- Node Commands ---

    public void AddNode()
    {
        var node = new IpoNode
        {
            ParentStepId = _currentParentStepId,
            Name = Strings.NewNodeName,
            X = 100 + (CurrentLevelNodes.Count * 60),
            Y = 100 + (CurrentLevelNodes.Count * 40),
        };

        _project.Nodes.Add(node);
        CurrentLevelNodes.Add(node);
        SelectedElement = node;
        MarkDirty();
        OnPropertyChanged(nameof(NodeCount));
        OnPropertyChanged(nameof(TotalNodeCount));
    }

    public void DeleteSelectedNode()
    {
        if (_selectedElement is not IpoNode node) return;

        var result = MessageBox.Show(
            Strings.ConfirmDelete,
            Strings.Confirm,
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result != MessageBoxResult.Yes) return;

        // 子ノード（サブ分析）も再帰的に削除
        DeleteNodeAndChildren(node.Id);

        // 接続も削除
        _project.Connections.RemoveAll(c => c.FromNodeId == node.Id || c.ToNodeId == node.Id);

        // 親ステップの ChildNodeId をクリア
        foreach (var n in _project.Nodes)
        {
            foreach (var step in n.ProcessSteps)
            {
                if (step.ChildNodeId == node.Id)
                    step.ChildNodeId = null;
            }
        }

        CurrentLevelNodes.Remove(node);
        _project.Nodes.Remove(node);
        SelectedElement = null;
        MarkDirty();
        OnPropertyChanged(nameof(NodeCount));
        OnPropertyChanged(nameof(TotalNodeCount));
    }

    private void DeleteNodeAndChildren(string nodeId)
    {
        var childNodes = _project.Nodes
            .Where(n => n.ParentStepId is not null &&
                        _project.Nodes.FirstOrDefault(pn => pn.Id == nodeId)
                            ?.ProcessSteps.Any(s => s.Id == n.ParentStepId) == true)
            .ToList();

        foreach (var child in childNodes)
        {
            DeleteNodeAndChildren(child.Id);
            _project.Nodes.Remove(child);
        }
    }

    public void UpdateNodePosition(IpoNode node, double x, double y)
    {
        node.X = x;
        node.Y = y;
        MarkDirty();
    }

    // --- IPO Item Commands ---

    public void AddInput(IpoNode node)
    {
        node.Inputs.Add(new IpoItem { Name = Strings.NewInputName });
        MarkDirty();
    }

    public void AddProcessStep(IpoNode node)
    {
        var order = node.ProcessSteps.Count > 0 ? node.ProcessSteps.Max(s => s.Order) + 1 : 1;
        node.ProcessSteps.Add(new IpoProcessStep { Name = Strings.NewProcessStepName, Order = order });
        MarkDirty();
    }

    public void AddOutput(IpoNode node)
    {
        node.Outputs.Add(new IpoItem { Name = Strings.NewOutputName });
        MarkDirty();
    }

    public void RemoveInput(IpoNode node, IpoItem item)
    {
        node.Inputs.Remove(item);
        MarkDirty();
    }

    public void RemoveProcessStep(IpoNode node, IpoProcessStep step)
    {
        // サブ分析ノードも削除
        if (step.ChildNodeId is not null)
        {
            var childNode = _project.Nodes.FirstOrDefault(n => n.Id == step.ChildNodeId);
            if (childNode is not null)
            {
                DeleteNodeAndChildren(childNode.Id);
                _project.Nodes.Remove(childNode);
            }
        }
        node.ProcessSteps.Remove(step);
        MarkDirty();
    }

    public void RemoveOutput(IpoNode node, IpoItem item)
    {
        node.Outputs.Remove(item);
        MarkDirty();
    }

    // --- Navigation ---

    /// <summary>
    /// プロセスステップのサブ分析にドリルダウン。
    /// ChildNodeId がなければサブ分析ノードを新規作成。
    /// </summary>
    public void DrillDown(IpoProcessStep step)
    {
        if (step.ChildNodeId is null)
        {
            // サブ分析ノードを新規作成
            var subNode = new IpoNode
            {
                ParentStepId = step.Id,
                Name = step.Name + (Strings.IsJapanese ? "（詳細）" : " (Detail)"),
                X = 80,
                Y = 80,
            };
            step.ChildNodeId = subNode.Id;
            _project.Nodes.Add(subNode);
            MarkDirty();
        }

        NavigationStack.Push(_currentParentStepId);
        _currentParentStepId = step.Id;
        SelectedElement = null;
        RefreshCurrentLevel();
    }

    /// <summary>
    /// 上の階層に戻る。
    /// </summary>
    public void NavigateUp()
    {
        if (NavigationStack.Count == 0) return;

        _currentParentStepId = NavigationStack.Pop();
        SelectedElement = null;
        RefreshCurrentLevel();
    }

    /// <summary>
    /// パンくずリストの特定の階層に移動。
    /// </summary>
    public void NavigateTo(int breadcrumbIndex)
    {
        // breadcrumbIndex 0 = Root
        while (NavigationStack.Count > breadcrumbIndex)
        {
            _currentParentStepId = NavigationStack.Pop();
        }
        SelectedElement = null;
        RefreshCurrentLevel();
    }

    // --- Hierarchy Tree ---

    /// <summary>
    /// プロジェクトツリーの全データを取得。
    /// </summary>
    public List<TreeNodeItem> GetProjectTree()
    {
        var rootNodes = _project.Nodes.Where(n => n.ParentStepId is null).ToList();
        return rootNodes.Select(BuildTreeNode).ToList();
    }

    private TreeNodeItem BuildTreeNode(IpoNode node)
    {
        var item = new TreeNodeItem
        {
            Id = node.Id,
            Name = node.Name,
            NodeType = "node",
            Children = new List<TreeNodeItem>()
        };

        foreach (var step in node.ProcessSteps.OrderBy(s => s.Order))
        {
            var stepItem = new TreeNodeItem
            {
                Id = step.Id,
                Name = $"P{step.Order}: {step.Name}",
                NodeType = "step",
                HasSubAnalysis = step.ChildNodeId is not null,
                Children = new List<TreeNodeItem>()
            };

            if (step.ChildNodeId is not null)
            {
                var childNode = _project.Nodes.FirstOrDefault(n => n.Id == step.ChildNodeId);
                if (childNode is not null)
                {
                    stepItem.Children.Add(BuildTreeNode(childNode));
                }
            }

            item.Children.Add(stepItem);
        }

        return item;
    }

    // --- Internal ---

    public void RefreshCurrentLevel()
    {
        CurrentLevelNodes.Clear();

        IEnumerable<IpoNode> nodes;
        if (_currentParentStepId is null)
        {
            nodes = _project.Nodes.Where(n => n.ParentStepId is null);
        }
        else
        {
            nodes = _project.Nodes.Where(n => n.ParentStepId == _currentParentStepId);
        }

        foreach (var node in nodes)
        {
            CurrentLevelNodes.Add(node);
        }

        RefreshBreadcrumb();
        OnPropertyChanged(nameof(NodeCount));
        OnPropertyChanged(nameof(TotalNodeCount));
        OnPropertyChanged(nameof(CanNavigateUp));
        OnPropertyChanged(nameof(CurrentLevelName));
    }

    private void RefreshBreadcrumb()
    {
        BreadcrumbPath.Clear();
        BreadcrumbPath.Add(new BreadcrumbItem { Name = Strings.RootLevel, ParentStepId = null });

        // NavigationStackの逆順 + 現在のレベル
        var stack = NavigationStack.ToArray();
        for (int i = stack.Length - 1; i >= 0; i--)
        {
            var stepId = stack[i];
            if (stepId is null) continue;

            var parentNode = _project.Nodes.FirstOrDefault(n =>
                n.ProcessSteps.Any(s => s.Id == stepId));
            var step = parentNode?.ProcessSteps.FirstOrDefault(s => s.Id == stepId);

            if (step is not null)
            {
                BreadcrumbPath.Add(new BreadcrumbItem { Name = step.Name, ParentStepId = stepId });
            }
        }

        if (_currentParentStepId is not null)
        {
            var parentNode = _project.Nodes.FirstOrDefault(n =>
                n.ProcessSteps.Any(s => s.Id == _currentParentStepId));
            var step = parentNode?.ProcessSteps.FirstOrDefault(s => s.Id == _currentParentStepId);

            if (step is not null)
            {
                BreadcrumbPath.Add(new BreadcrumbItem { Name = step.Name, ParentStepId = _currentParentStepId });
            }
        }
    }

    private void MarkDirty()
    {
        IsDirty = true;
        OnPropertyChanged(nameof(TotalNodeCount));
    }

    private bool ConfirmDiscard()
    {
        var result = MessageBox.Show(
            Strings.UnsavedChanges,
            Strings.Confirm,
            MessageBoxButton.YesNoCancel,
            MessageBoxImage.Question);

        if (result == MessageBoxResult.Yes)
        {
            SaveProject();
            return true;
        }
        return result == MessageBoxResult.No;
    }

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}

/// <summary>
/// パンくずリストのアイテム。
/// </summary>
public class BreadcrumbItem
{
    public string Name { get; set; } = "";
    public string? ParentStepId { get; set; }
}

/// <summary>
/// ツリービューのアイテム。
/// </summary>
public class TreeNodeItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string NodeType { get; set; } = "node";
    public bool HasSubAnalysis { get; set; }
    public List<TreeNodeItem> Children { get; set; } = new();
}
