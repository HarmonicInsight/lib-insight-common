using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace InsightCommon.AI;

/// <summary>
/// ツール実行インターフェース — 各アプリが製品固有のツール実装を提供する
/// IOSH: スプレッドシート操作、INSS: スライド操作、IOSD: ドキュメント操作、INPY: Python 実行
/// </summary>
public interface IToolExecutor
{
    /// <summary>
    /// ツールを実行し結果を返す
    /// </summary>
    /// <param name="toolName">ツール名（例: get_cell_range, set_cell_values）</param>
    /// <param name="input">Claude API から渡されるツール入力パラメータ</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>実行結果</returns>
    Task<ToolExecutionResult> ExecuteAsync(string toolName, JsonElement input, CancellationToken ct);
}

/// <summary>
/// ツール実行結果
/// </summary>
public class ToolExecutionResult
{
    /// <summary>結果テキスト（Claude に tool_result として返送される）</summary>
    public string Content { get; init; } = "";

    /// <summary>エラーが発生した場合 true</summary>
    public bool IsError { get; init; }
}
