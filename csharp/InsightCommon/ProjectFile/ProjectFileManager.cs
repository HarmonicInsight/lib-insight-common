using System;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.Tasks;

namespace InsightCommon.ProjectFile;

/// <summary>
/// InsightOffice プロジェクトファイル（ZIP パッケージ）の読み書きマネージャー
///
/// .inss / .iosh / .iosd ファイルを ZIP として作成・展開・保存する。
/// 各アプリのファイル操作はこのクラスを通じて行う。
///
/// <para>
/// 使用パターン:
/// 1. CreateFromOfficeFile() — 既存 Office ファイルからプロジェクトファイルを新規作成
/// 2. Open() — 既存プロジェクトファイルを一時ディレクトリに展開
/// 3. Save() — 一時ディレクトリの内容を ZIP に再パッケージ
/// 4. ExportOfficeFile() — ZIP から Office ファイルのみを抽出
/// </para>
///
/// 対応: config/project-file.ts
/// </summary>
public class ProjectFileManager : IDisposable
{
    private string? _workDir;
    private string? _projectFilePath;
    private string? _productCode;
    private bool _disposed;

    /// <summary>現在の作業ディレクトリ（ZIP 展開先）</summary>
    public string? WorkDirectory => _workDir;

    /// <summary>現在開いているプロジェクトファイルのパス</summary>
    public string? ProjectFilePath => _projectFilePath;

    /// <summary>メタデータ（展開後に読み込まれる）</summary>
    public ProjectFileMetadata? Metadata { get; private set; }

    /// <summary>内包 Office ドキュメントの作業コピーパス</summary>
    public string? DocumentPath => _workDir != null && _productCode != null
        ? Path.Combine(_workDir, ProjectFilePaths.GetInnerDocumentName(_productCode) ?? "")
        : null;

    // =========================================================================
    // 新規作成
    // =========================================================================

    /// <summary>
    /// 既存の Office ファイルからプロジェクトファイルを新規作成する
    /// </summary>
    /// <param name="officeFilePath">元の Office ファイルパス（.xlsx, .pptx, .docx）</param>
    /// <param name="projectFilePath">保存先のプロジェクトファイルパス（.iosh, .inss, .iosd）</param>
    /// <param name="productCode">製品コード（INSS / IOSH / IOSD）</param>
    /// <param name="author">作成者名</param>
    /// <param name="appVersion">アプリバージョン</param>
    /// <param name="appBuildNumber">アプリビルド番号</param>
    public async Task CreateFromOfficeFileAsync(
        string officeFilePath,
        string projectFilePath,
        string productCode,
        string author,
        string appVersion,
        int appBuildNumber)
    {
        if (!File.Exists(officeFilePath))
            throw new FileNotFoundException("Office file not found.", officeFilePath);

        var innerDocName = ProjectFilePaths.GetInnerDocumentName(productCode)
            ?? throw new ArgumentException($"Unknown product code: {productCode}", nameof(productCode));

        _productCode = productCode;
        _projectFilePath = projectFilePath;

        // 一時ディレクトリに構造を作成
        _workDir = CreateTempWorkDir();
        Directory.CreateDirectory(Path.Combine(_workDir, "history", "snapshots"));
        Directory.CreateDirectory(Path.Combine(_workDir, "references", "files"));
        Directory.CreateDirectory(Path.Combine(_workDir, "scripts", "files"));
        Directory.CreateDirectory(Path.Combine(_workDir, "ai_memory_deep"));

        // Office ファイルをコピー
        var destDoc = Path.Combine(_workDir, innerDocName);
        File.Copy(officeFilePath, destDoc);

        // メタデータ作成
        var hash = await ComputeFileHashAsync(destDoc);
        var now = DateTime.UtcNow.ToString("o");
        Metadata = new ProjectFileMetadata
        {
            SchemaVersion = ProjectFilePaths.SchemaVersion,
            ProductCode = productCode,
            AppVersion = appVersion,
            AppBuildNumber = appBuildNumber,
            Title = Path.GetFileNameWithoutExtension(officeFilePath),
            Author = author,
            CreatedAt = now,
            UpdatedAt = now,
            LastModifiedBy = author,
            OriginalFileName = Path.GetFileName(officeFilePath),
            DocumentHash = hash,
        };

        // 各 JSON ファイルを書き込み
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.Metadata), Metadata);
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.StickyNotes), Array.Empty<object>());
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.AiMemory), new { version = "1.0", lastUpdatedAt = now, entries = Array.Empty<object>() });
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.AiChatHistory), new AiChatHistory());
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.HistoryIndex), new HistoryIndex());
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.ReferencesIndex), new ReferencesIndex());
        await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.ScriptsIndex), new ScriptsIndex());

        // content_types.xml 生成
        var contentTypesXml = GenerateContentTypesXml(productCode, innerDocName);
        await File.WriteAllTextAsync(Path.Combine(_workDir, ProjectFilePaths.ContentTypes), contentTypesXml);

        // ZIP として保存
        await PackToZipAsync(projectFilePath);
    }

    // =========================================================================
    // 開く
    // =========================================================================

    /// <summary>
    /// 既存のプロジェクトファイルを開く（一時ディレクトリに展開）
    /// </summary>
    /// <param name="projectFilePath">プロジェクトファイルのパス</param>
    public async Task OpenAsync(string projectFilePath)
    {
        if (!File.Exists(projectFilePath))
            throw new FileNotFoundException("Project file not found.", projectFilePath);

        _projectFilePath = projectFilePath;

        // 拡張子から製品コードを解決
        var ext = Path.GetExtension(projectFilePath);
        _productCode = ProjectFilePaths.ResolveProductCode(ext)
            ?? throw new InvalidOperationException($"Unknown project file extension: {ext}");

        // 一時ディレクトリに展開
        _workDir = CreateTempWorkDir();
        ZipFile.ExtractToDirectory(projectFilePath, _workDir);

        // メタデータ読み込み
        var metadataPath = Path.Combine(_workDir, ProjectFilePaths.Metadata);
        if (File.Exists(metadataPath))
        {
            var json = await File.ReadAllTextAsync(metadataPath);
            Metadata = JsonSerializer.Deserialize<ProjectFileMetadata>(json, JsonOptions.CaseInsensitive);
        }
    }

    // =========================================================================
    // 保存
    // =========================================================================

    /// <summary>
    /// 現在の作業ディレクトリの内容をプロジェクトファイルとして保存する（上書き）
    /// </summary>
    /// <param name="updatedBy">更新者名</param>
    public async Task SaveAsync(string updatedBy)
    {
        if (_workDir == null || _projectFilePath == null || _productCode == null)
            throw new InvalidOperationException("No project file is currently open.");

        // メタデータを更新
        if (Metadata != null)
        {
            Metadata.UpdatedAt = DateTime.UtcNow.ToString("o");
            Metadata.LastModifiedBy = updatedBy;

            // ドキュメントハッシュを再計算
            var docPath = DocumentPath;
            if (docPath != null && File.Exists(docPath))
            {
                Metadata.DocumentHash = await ComputeFileHashAsync(docPath);
            }

            await WriteJsonAsync(Path.Combine(_workDir, ProjectFilePaths.Metadata), Metadata);
        }

        // アトミック保存: 一時ファイルに書き込み → リネーム
        await PackToZipAsync(_projectFilePath);
    }

    /// <summary>
    /// 別名で保存する
    /// </summary>
    public async Task SaveAsAsync(string newPath, string updatedBy)
    {
        if (_workDir == null || _productCode == null)
            throw new InvalidOperationException("No project file is currently open.");

        _projectFilePath = newPath;
        await SaveAsync(updatedBy);
    }

    // =========================================================================
    // エクスポート
    // =========================================================================

    /// <summary>
    /// プロジェクトファイルから Office ファイルのみをエクスポートする
    /// </summary>
    /// <param name="outputPath">出力先パス</param>
    public void ExportOfficeFile(string outputPath)
    {
        var docPath = DocumentPath
            ?? throw new InvalidOperationException("No document is currently loaded.");

        if (!File.Exists(docPath))
            throw new FileNotFoundException("Inner document not found in work directory.", docPath);

        File.Copy(docPath, outputPath, overwrite: true);
    }

    // =========================================================================
    // ZIP 内の JSON データ読み書き
    // =========================================================================

    /// <summary>
    /// 作業ディレクトリ内の JSON ファイルを読み込む
    /// </summary>
    public async Task<T?> ReadEntryAsync<T>(string entryPath) where T : class
    {
        if (_workDir == null)
            throw new InvalidOperationException("No project file is currently open.");

        var fullPath = Path.Combine(_workDir, entryPath);
        if (!File.Exists(fullPath))
            return null;

        var json = await File.ReadAllTextAsync(fullPath);
        return JsonSerializer.Deserialize<T>(json, JsonOptions.CaseInsensitive);
    }

    /// <summary>
    /// 作業ディレクトリ内の JSON ファイルを書き込む
    /// </summary>
    public async Task WriteEntryAsync<T>(string entryPath, T data)
    {
        if (_workDir == null)
            throw new InvalidOperationException("No project file is currently open.");

        var fullPath = Path.Combine(_workDir, entryPath);
        var dir = Path.GetDirectoryName(fullPath);
        if (dir != null && !Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        await WriteJsonAsync(fullPath, data);
    }

    /// <summary>
    /// 作業ディレクトリにバイナリファイルを追加する（参考資料等）
    /// </summary>
    public async Task AddBinaryEntryAsync(string entryPath, byte[] data)
    {
        if (_workDir == null)
            throw new InvalidOperationException("No project file is currently open.");

        var fullPath = Path.Combine(_workDir, entryPath);
        var dir = Path.GetDirectoryName(fullPath);
        if (dir != null && !Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        await File.WriteAllBytesAsync(fullPath, data);
    }

    /// <summary>
    /// 作業ディレクトリからエントリを削除する
    /// </summary>
    public void RemoveEntry(string entryPath)
    {
        if (_workDir == null)
            throw new InvalidOperationException("No project file is currently open.");

        var fullPath = Path.Combine(_workDir, entryPath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }

    // =========================================================================
    // バリデーション
    // =========================================================================

    /// <summary>
    /// プロジェクトファイルの簡易バリデーション（ZIP を開かずにチェック）
    /// </summary>
    public static bool IsValidProjectFile(string filePath)
    {
        if (!File.Exists(filePath))
            return false;

        try
        {
            using var archive = ZipFile.OpenRead(filePath);
            // metadata.json の存在確認
            return archive.GetEntry(ProjectFilePaths.Metadata) != null;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// ファイルパスがプロジェクトファイルの拡張子かどうか
    /// </summary>
    public static bool IsProjectFileExtension(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext is ".inss" or ".iosh" or ".iosd";
    }

    /// <summary>
    /// ファイルパスがインポート可能な Office ファイルかどうか
    /// </summary>
    public static bool IsImportableOfficeFile(string filePath, string productCode)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        var importable = ProjectFilePaths.GetImportableExtensions(productCode);
        return importable.Contains(ext);
    }

    // =========================================================================
    // ファイルダイアログ用フィルタ
    // =========================================================================

    /// <summary>
    /// 「開く」ダイアログ用のフィルタ文字列を生成
    ///
    /// 例: "InsightOfficeSheet プロジェクト (*.iosh)|*.iosh|Excel ファイル (*.xlsx;*.xls;*.csv)|*.xlsx;*.xls;*.csv|すべてのファイル (*.*)|*.*"
    /// </summary>
    public static string GetOpenDialogFilter(string productCode, string locale = "ja")
    {
        var ext = ProjectFilePaths.GetExtension(productCode)?.TrimStart('.') ?? "";
        var importExts = ProjectFilePaths.GetImportableExtensions(productCode);
        var importFilter = string.Join(";", importExts.Select(e => $"*{e}"));

        return locale == "ja"
            ? $"プロジェクトファイル (*.{ext})|*.{ext}|Office ファイル ({importFilter})|{importFilter}|すべてのファイル (*.*)|*.*"
            : $"Project File (*.{ext})|*.{ext}|Office File ({importFilter})|{importFilter}|All Files (*.*)|*.*";
    }

    /// <summary>
    /// 「保存」ダイアログ用のフィルタ文字列を生成
    /// </summary>
    public static string GetSaveDialogFilter(string productCode, string locale = "ja")
    {
        var ext = ProjectFilePaths.GetExtension(productCode)?.TrimStart('.') ?? "";
        return locale == "ja"
            ? $"プロジェクトファイル (*.{ext})|*.{ext}"
            : $"Project File (*.{ext})|*.{ext}";
    }

    // =========================================================================
    // 内部ヘルパー
    // =========================================================================

    private static string CreateTempWorkDir()
    {
        var dir = Path.Combine(Path.GetTempPath(), "InsightOffice", Guid.NewGuid().ToString("N")[..8]);
        Directory.CreateDirectory(dir);
        return dir;
    }

    private async Task PackToZipAsync(string outputPath)
    {
        if (_workDir == null) return;

        // アトミック保存: 一時ファイルに書き込み → リネーム
        var tempZip = outputPath + ".tmp";
        try
        {
            // 既存の一時ファイルがあれば削除
            if (File.Exists(tempZip))
                File.Delete(tempZip);

            await Task.Run(() => ZipFile.CreateFromDirectory(_workDir, tempZip, CompressionLevel.Optimal, false));

            // 元ファイルを置き換え
            if (File.Exists(outputPath))
                File.Delete(outputPath);

            File.Move(tempZip, outputPath);
        }
        catch
        {
            // 失敗時は一時ファイルをクリーンアップ
            if (File.Exists(tempZip))
                File.Delete(tempZip);
            throw;
        }
    }

    private static async Task WriteJsonAsync<T>(string path, T data)
    {
        var json = JsonSerializer.Serialize(data, JsonOptions.WriteIndented);
        await File.WriteAllTextAsync(path, json);
    }

    private static async Task<string> ComputeFileHashAsync(string filePath)
    {
        await using var stream = File.OpenRead(filePath);
        var hashBytes = await SHA256.HashDataAsync(stream);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static string GenerateContentTypesXml(string productCode, string innerDocName)
    {
        var officeContentType = productCode.ToUpperInvariant() switch
        {
            "INSS" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "IOSH" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "IOSD" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream",
        };

        return $"""
            <?xml version="1.0" encoding="UTF-8"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Default Extension="json" ContentType="application/json" />
              <Default Extension="xml" ContentType="application/xml" />
              <Default Extension="py" ContentType="text/x-python" />
              <Default Extension="pdf" ContentType="application/pdf" />
              <Default Extension="png" ContentType="image/png" />
              <Default Extension="jpg" ContentType="image/jpeg" />
              <Override PartName="/{innerDocName}" ContentType="{officeContentType}" />
              <Override PartName="/metadata.json" ContentType="application/json" />
            </Types>
            """;
    }

    // =========================================================================
    // Dispose
    // =========================================================================

    /// <summary>
    /// 一時ディレクトリをクリーンアップする
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;

        if (disposing && _workDir != null && Directory.Exists(_workDir))
        {
            try { Directory.Delete(_workDir, recursive: true); }
            catch { /* クリーンアップ失敗は無視 */ }
        }

        _disposed = true;
    }

    ~ProjectFileManager() => Dispose(false);
}
