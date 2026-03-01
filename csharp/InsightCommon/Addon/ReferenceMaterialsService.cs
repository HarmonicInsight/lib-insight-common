using System.IO;
using System.Text;
using System.Text.Json;

namespace InsightCommon.Addon;

/// <summary>
/// 参考資料サービス（Insight Business Suite 全アプリ共通）
///
/// PDF・テキスト・画像等の参考資料を管理し、
/// AI アシスタントのコンテキストとして活用するためのサービス。
///
/// Insight AI Doc Factory (IOSD) で先行実装された参考資料機能を、
/// 全 Insight Business Suite アプリで共用できるよう共通化したもの。
///
/// I/O コントラクト:
/// - attach:  ファイル添付 → テキスト抽出 → インデックス登録
/// - search:  キーワード検索 → 関連度順ソート
///
/// 使用例:
/// <code>
/// var refService = new ReferenceMaterialsService("InsightPerformanceManagement");
///
/// // 参考資料を添付
/// var result = await refService.AttachAsync(@"C:\docs\spec.pdf", "pdf");
///
/// // 検索（AI コンテキストに使用）
/// var results = refService.Search("売上集計の計算式");
///
/// // AI プロンプトにコンテキストとして渡す
/// var context = refService.BuildAiContext(["ref-001", "ref-002"]);
/// </code>
/// </summary>
public class ReferenceMaterialsService
{
    private readonly string _storageDir;
    private readonly List<ReferenceDocument> _documents = [];
    private readonly string _indexPath;

    public ReferenceMaterialsService(string productName)
    {
        _storageDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "HarmonicInsight", productName, "references");
        _indexPath = Path.Combine(_storageDir, "_index.json");
        Directory.CreateDirectory(_storageDir);
        LoadIndex();
    }

    /// <summary>参考資料の数</summary>
    public int Count => _documents.Count;

    /// <summary>全参考資料を取得</summary>
    public IReadOnlyList<ReferenceDocument> Documents => _documents.AsReadOnly();

    // =========================================================================
    // 添付（I/O コントラクト: attach）
    // =========================================================================

    /// <summary>
    /// 参考資料を添付
    /// </summary>
    /// <param name="filePath">ファイルパス</param>
    /// <param name="fileType">ファイル種別: pdf / text / docx / image</param>
    public async Task<AttachResult> AttachAsync(string filePath, string fileType)
    {
        if (!File.Exists(filePath))
            return new AttachResult { Success = false, Error = "ファイルが見つかりません" };

        var id = $"ref-{Guid.NewGuid():N}"[..12];
        var fileName = Path.GetFileName(filePath);

        // テキスト抽出
        var extractedText = await ExtractTextAsync(filePath, fileType);

        // チャンク分割（約500文字ずつ）
        var chunks = ChunkText(extractedText, 500);

        // ストレージにコピー
        var storedPath = Path.Combine(_storageDir, $"{id}{Path.GetExtension(filePath)}");
        File.Copy(filePath, storedPath, overwrite: true);

        var doc = new ReferenceDocument
        {
            Id = id,
            FileName = fileName,
            FileType = fileType,
            StoredPath = storedPath,
            ExtractedText = extractedText,
            Chunks = chunks,
            AttachedAt = DateTime.UtcNow,
            PageCount = fileType == "pdf" ? EstimatePageCount(extractedText) : null,
        };

        _documents.Add(doc);
        SaveIndex();

        return new AttachResult
        {
            Success = true,
            ReferenceId = id,
            ExtractedTextPreview = extractedText.Length > 500 ? extractedText[..500] + "..." : extractedText,
            PageCount = doc.PageCount,
        };
    }

    /// <summary>
    /// 参考資料を削除
    /// </summary>
    public bool Remove(string referenceId)
    {
        var doc = _documents.FirstOrDefault(d => d.Id == referenceId);
        if (doc == null) return false;

        _documents.Remove(doc);
        if (File.Exists(doc.StoredPath))
            try { File.Delete(doc.StoredPath); } catch { }

        SaveIndex();
        return true;
    }

    // =========================================================================
    // 検索（I/O コントラクト: search）
    // =========================================================================

    /// <summary>
    /// 参考資料を検索
    /// </summary>
    /// <param name="query">検索クエリ</param>
    /// <param name="maxResults">最大件数</param>
    public List<SearchResult> Search(string query, int maxResults = 5)
    {
        var queryTerms = query.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var results = new List<SearchResult>();

        foreach (var doc in _documents)
        {
            foreach (var chunk in doc.Chunks)
            {
                var lowerChunk = chunk.ToLowerInvariant();
                var matchCount = queryTerms.Count(term => lowerChunk.Contains(term));
                if (matchCount > 0)
                {
                    results.Add(new SearchResult
                    {
                        ReferenceId = doc.Id,
                        Title = doc.FileName,
                        Snippet = TrimToSnippet(chunk, queryTerms.FirstOrDefault() ?? "", 200),
                        Relevance = (double)matchCount / queryTerms.Length,
                    });
                }
            }
        }

        return results
            .OrderByDescending(r => r.Relevance)
            .Take(maxResults)
            .ToList();
    }

    /// <summary>
    /// 参考資料のテキスト内容を取得
    /// </summary>
    public string? GetContent(string referenceId)
    {
        var doc = _documents.FirstOrDefault(d => d.Id == referenceId);
        return doc?.ExtractedText;
    }

    // =========================================================================
    // AI コンテキスト構築
    // =========================================================================

    /// <summary>
    /// 指定された参考資料を AI プロンプトのコンテキストとして整形
    /// </summary>
    public string BuildAiContext(IEnumerable<string> referenceIds)
    {
        var sb = new StringBuilder();
        sb.AppendLine("## 参考資料");

        foreach (var id in referenceIds)
        {
            var doc = _documents.FirstOrDefault(d => d.Id == id);
            if (doc == null) continue;

            sb.AppendLine(System.Globalization.CultureInfo.InvariantCulture, $"\n### {doc.FileName}");
            sb.AppendLine(doc.ExtractedText);
        }

        return sb.ToString();
    }

    /// <summary>
    /// 検索クエリに基づいて自動的に関連する参考資料のコンテキストを構築
    /// </summary>
    public string BuildAutoContext(string query, int maxChunks = 3)
    {
        var results = Search(query, maxChunks);
        if (results.Count == 0) return "";

        var sb = new StringBuilder();
        sb.AppendLine("## 関連する参考資料（自動選択）");

        foreach (var result in results)
        {
            sb.AppendLine(System.Globalization.CultureInfo.InvariantCulture, $"\n### {result.Title}（関連度: {result.Relevance:P0}）");
            sb.AppendLine(result.Snippet);
        }

        return sb.ToString();
    }

    // =========================================================================
    // テキスト抽出
    // =========================================================================

    private static async Task<string> ExtractTextAsync(string filePath, string fileType)
    {
        return fileType switch
        {
            "text" or "txt" => await File.ReadAllTextAsync(filePath),
            "pdf" => await ExtractPdfTextAsync(filePath),
            "docx" => await ExtractDocxTextAsync(filePath),
            _ => $"[{fileType} ファイル: テキスト抽出非対応]",
        };
    }

    /// <summary>
    /// PDF テキスト抽出（Python subprocess 使用）
    ///
    /// PyMuPDF (fitz) を使ってテキストを抽出する。
    /// Python 環境がない場合はファイル名のみ返す。
    /// </summary>
    private static async Task<string> ExtractPdfTextAsync(string filePath)
    {
        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"-c \"import fitz; doc=fitz.open(r'{filePath.Replace("'", "\\'")}'); print('\\n'.join(p.get_text() for p in doc))\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = System.Diagnostics.Process.Start(psi);
            if (process == null)
                return $"[PDF: {Path.GetFileName(filePath)}] テキスト抽出に失敗しました";

            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            return process.ExitCode == 0 && !string.IsNullOrWhiteSpace(output)
                ? output
                : $"[PDF: {Path.GetFileName(filePath)}] テキスト抽出にはPython + PyMuPDF が必要です";
        }
        catch
        {
            return $"[PDF: {Path.GetFileName(filePath)}] テキスト抽出にはPython + PyMuPDF が必要です";
        }
    }

    /// <summary>
    /// DOCX テキスト抽出（Python subprocess 使用）
    /// </summary>
    private static async Task<string> ExtractDocxTextAsync(string filePath)
    {
        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"-c \"from docx import Document; doc=Document(r'{filePath.Replace("'", "\\'")}'); print('\\n'.join(p.text for p in doc.paragraphs))\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = System.Diagnostics.Process.Start(psi);
            if (process == null)
                return $"[DOCX: {Path.GetFileName(filePath)}] テキスト抽出に失敗しました";

            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            return process.ExitCode == 0 && !string.IsNullOrWhiteSpace(output)
                ? output
                : $"[DOCX: {Path.GetFileName(filePath)}] テキスト抽出にはPython + python-docx が必要です";
        }
        catch
        {
            return $"[DOCX: {Path.GetFileName(filePath)}] テキスト抽出にはPython + python-docx が必要です";
        }
    }

    // =========================================================================
    // チャンク分割
    // =========================================================================

    private static List<string> ChunkText(string text, int chunkSize)
    {
        var chunks = new List<string>();
        if (string.IsNullOrEmpty(text)) return chunks;

        var paragraphs = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var current = new StringBuilder();

        foreach (var para in paragraphs)
        {
            if (current.Length + para.Length > chunkSize && current.Length > 0)
            {
                chunks.Add(current.ToString().Trim());
                current.Clear();
            }
            current.AppendLine(para);
        }

        if (current.Length > 0)
            chunks.Add(current.ToString().Trim());

        return chunks;
    }

    private static string TrimToSnippet(string text, string term, int maxLength)
    {
        var idx = text.IndexOf(term, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) idx = 0;

        var start = Math.Max(0, idx - maxLength / 4);
        var length = Math.Min(maxLength, text.Length - start);
        var snippet = text.Substring(start, length);

        if (start > 0) snippet = "..." + snippet;
        if (start + length < text.Length) snippet += "...";

        return snippet;
    }

    private static int EstimatePageCount(string text)
    {
        // 日本語テキスト約800文字/ページとして概算
        return Math.Max(1, (int)Math.Ceiling(text.Length / 800.0));
    }

    // =========================================================================
    // 永続化
    // =========================================================================

    private void SaveIndex()
    {
        var data = _documents.Select(d => new ReferenceIndexEntry
        {
            Id = d.Id,
            FileName = d.FileName,
            FileType = d.FileType,
            StoredPath = d.StoredPath,
            AttachedAt = d.AttachedAt,
            PageCount = d.PageCount,
            TextLength = d.ExtractedText.Length,
        }).ToList();

        var json = JsonSerializer.Serialize(data, JsonOptions.WriteIndented);
        File.WriteAllText(_indexPath, json);
    }

    private void LoadIndex()
    {
        if (!File.Exists(_indexPath)) return;

        try
        {
            var json = File.ReadAllText(_indexPath);
            var entries = JsonSerializer.Deserialize<List<ReferenceIndexEntry>>(json,
                JsonOptions.CaseInsensitive);
            if (entries == null) return;

            foreach (var entry in entries)
            {
                if (!File.Exists(entry.StoredPath)) continue;

                var text = File.ReadAllText(entry.StoredPath);
                _documents.Add(new ReferenceDocument
                {
                    Id = entry.Id,
                    FileName = entry.FileName,
                    FileType = entry.FileType,
                    StoredPath = entry.StoredPath,
                    ExtractedText = text,
                    Chunks = ChunkText(text, 500),
                    AttachedAt = entry.AttachedAt,
                    PageCount = entry.PageCount,
                });
            }
        }
        catch
        {
            // インデックス破損は無視
        }
    }
}

// =========================================================================
// 型定義
// =========================================================================

public class ReferenceDocument
{
    public string Id { get; set; } = "";
    public string FileName { get; set; } = "";
    public string FileType { get; set; } = "";
    public string StoredPath { get; set; } = "";
    public string ExtractedText { get; set; } = "";
    public List<string> Chunks { get; set; } = [];
    public DateTime AttachedAt { get; set; }
    public int? PageCount { get; set; }
}

public class AttachResult
{
    public bool Success { get; set; }
    public string? ReferenceId { get; set; }
    public string? ExtractedTextPreview { get; set; }
    public int? PageCount { get; set; }
    public string? Error { get; set; }
}

public class SearchResult
{
    public string ReferenceId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Snippet { get; set; } = "";
    public double Relevance { get; set; }
}

internal sealed class ReferenceIndexEntry
{
    public string Id { get; set; } = "";
    public string FileName { get; set; } = "";
    public string FileType { get; set; } = "";
    public string StoredPath { get; set; } = "";
    public DateTime AttachedAt { get; set; }
    public int? PageCount { get; set; }
    public int TextLength { get; set; }
}
