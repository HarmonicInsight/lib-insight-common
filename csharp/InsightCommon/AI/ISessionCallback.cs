using System.Collections.Generic;

namespace InsightCommon.AI;

/// <summary>
/// セッション進行中の UI 通知コールバック — 各アプリが任意で実装
/// ツール実行ステータスやイテレーション進捗を UI に反映するために使用
/// </summary>
public interface ISessionCallback
{
    /// <summary>ツール実行開始時に呼ばれる（例: 「get_cell_range を実行中...」表示）</summary>
    void OnToolExecuting(string toolName);

    /// <summary>ツール実行完了時に呼ばれる</summary>
    void OnToolExecuted(string toolName, bool isError);

    /// <summary>Tool Use ループの各イテレーション完了時に呼ばれる</summary>
    void OnIterationCompleted(int current, int max);

    /// <summary>
    /// AI 応答からメモリエントリが抽出された時に呼ばれる
    /// アプリ側はこのコールバックでメモリパネル UI を更新し、
    /// ユーザーに確認後ホットキャッシュへ保存する
    /// </summary>
    void OnMemoryExtracted(IReadOnlyList<MemoryEntry> entries);
}
