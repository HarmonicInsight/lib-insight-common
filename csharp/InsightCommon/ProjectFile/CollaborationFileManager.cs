using System;
using System.IO;
using System.Text.Json;
using System.Threading;

namespace InsightCommon.ProjectFile;

/// <summary>
/// コラボレーションデータの外部ファイル管理（B 方式）
///
/// プロジェクトファイル（ZIP）と同じディレクトリに .collab.json を配置し、
/// 掲示板・付箋・メッセージを複数ユーザーが同時に読み書きできるようにする。
///
/// <para>
/// ファイル構成:
///   report.iosh              ← 本体 ZIP（排他ロック）
///   report.iosh.lock         ← ロックファイル
///   report.iosh.collab.json  ← コラボレーションデータ（楽観ロック）
/// </para>
///
/// <para>
/// 楽観ロック方式:
/// 1. ファイルのタイムスタンプを記録して読み込み
/// 2. 書き込み時にタイムスタンプが変わっていないか確認
/// 3. 変わっていたら最新データを再読み込みしてマージ
/// 4. リトライ（最大3回）
/// </para>
///
/// 対応: config/project-file.ts
/// </summary>
public class CollaborationFileManager
{
    /// <summary>コラボレーションファイルの拡張子</summary>
    public const string CollabExtension = ".collab.json";

    private static readonly JsonSerializerOptions s_writeOptions = new() { WriteIndented = true };
    private static readonly JsonSerializerOptions s_readOptions = new() { PropertyNameCaseInsensitive = true };

    private const int MaxRetries = 3;
    private const int RetryDelayMs = 200;

    private string? _collabFilePath;
    private DateTime _lastReadTimestamp;

    /// <summary>コラボレーションファイルのパス</summary>
    public string? CollabFilePath => _collabFilePath;

    /// <summary>コラボレーションファイルのパスを生成</summary>
    public static string GetCollabFilePath(string projectFilePath)
        => projectFilePath + CollabExtension;

    /// <summary>
    /// コラボレーションファイルを初期化（プロジェクトファイルに紐づけ）
    /// </summary>
    /// <param name="projectFilePath">プロジェクトファイルのパス</param>
    public void Initialize(string projectFilePath)
    {
        _collabFilePath = GetCollabFilePath(projectFilePath);
    }

    /// <summary>
    /// コラボレーションデータを読み込む
    ///
    /// ファイルが存在しない場合は空のデータを返す。
    /// </summary>
    public CollaborationData Load()
    {
        if (_collabFilePath == null)
            throw new InvalidOperationException("CollaborationFileManager has not been initialized.");

        if (!File.Exists(_collabFilePath))
        {
            _lastReadTimestamp = DateTime.MinValue;
            return new CollaborationData();
        }

        try
        {
            var json = File.ReadAllText(_collabFilePath);
            _lastReadTimestamp = File.GetLastWriteTimeUtc(_collabFilePath);
            return JsonSerializer.Deserialize<CollaborationData>(json, s_readOptions)
                ?? new CollaborationData();
        }
        catch (Exception ex) when (ex is IOException or JsonException)
        {
            // ファイル破損や同時アクセスエラー → 空データを返す
            return new CollaborationData();
        }
    }

    /// <summary>
    /// コラボレーションデータを保存する（楽観ロック付き）
    /// </summary>
    /// <returns>成功時 true、競合発生時 false</returns>
    public bool Save(CollaborationData data)
    {
        if (_collabFilePath == null)
            throw new InvalidOperationException("CollaborationFileManager has not been initialized.");

        data.UpdatedAt = DateTime.UtcNow.ToString("o");

        for (int attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                // 楽観ロック: 最後に読み込んだ時点からファイルが変更されていないか確認
                if (File.Exists(_collabFilePath))
                {
                    var currentTimestamp = File.GetLastWriteTimeUtc(_collabFilePath);
                    if (_lastReadTimestamp != DateTime.MinValue && currentTimestamp > _lastReadTimestamp)
                    {
                        // 他のユーザーが変更した → 競合
                        return false;
                    }
                }

                var json = JsonSerializer.Serialize(data, s_writeOptions);

                // アトミック書き込み: 一時ファイル → リネーム
                var tempPath = _collabFilePath + ".tmp";
                File.WriteAllText(tempPath, json);
                File.Move(tempPath, _collabFilePath, overwrite: true);

                _lastReadTimestamp = File.GetLastWriteTimeUtc(_collabFilePath);
                return true;
            }
            catch (IOException) when (attempt < MaxRetries - 1)
            {
                Thread.Sleep(RetryDelayMs * (1 << attempt));
            }
        }

        return false;
    }

    /// <summary>
    /// データを再読み込みして最新の状態を取得する
    ///
    /// Save() が false を返した場合（競合発生時）に呼び出して、
    /// 最新のデータを取得してから変更をマージし直す。
    /// </summary>
    public CollaborationData Reload() => Load();

    /// <summary>
    /// ZIP 内のデータを外部コラボレーションファイルにエクスポートする
    ///
    /// プロジェクトファイルを開いた直後に呼び出す。
    /// ZIP 内に sticky_notes.json 等がある場合、外部ファイルと統合する。
    /// </summary>
    /// <param name="zipStickyNotes">ZIP 内の付箋データ（JSON 文字列、なければ null）</param>
    public void ExportFromZip(string? zipStickyNotes)
    {
        if (_collabFilePath == null) return;

        var data = Load();

        // ZIP 内に付箋データがあり、外部ファイルに付箋が無い場合のみインポート
        if (zipStickyNotes != null && data.StickyNotes.Count == 0)
        {
            try
            {
                var notes = JsonSerializer.Deserialize<System.Collections.Generic.List<CollabStickyNote>>(
                    zipStickyNotes, s_readOptions);
                if (notes != null && notes.Count > 0)
                {
                    data.StickyNotes = notes;
                    Save(data);
                }
            }
            catch (JsonException)
            {
                // 付箋データの形式が異なる場合は無視
            }
        }
    }

    /// <summary>
    /// 外部コラボレーションデータを ZIP に統合するための JSON を取得する
    ///
    /// プロジェクトファイルを保存する直前に呼び出す。
    /// 外部の付箋データを ZIP 内の sticky_notes.json に書き戻す。
    /// </summary>
    public string GetStickyNotesJson()
    {
        var data = Load();
        return JsonSerializer.Serialize(data.StickyNotes, s_writeOptions);
    }

    /// <summary>
    /// ファイルが変更されたか（ポーリング用）
    ///
    /// 定期的に呼び出して、他のユーザーの変更を検知する。
    /// </summary>
    public bool HasChanges()
    {
        if (_collabFilePath == null || !File.Exists(_collabFilePath))
            return false;

        try
        {
            var currentTimestamp = File.GetLastWriteTimeUtc(_collabFilePath);
            return currentTimestamp > _lastReadTimestamp;
        }
        catch (IOException)
        {
            return false;
        }
    }

    /// <summary>
    /// コラボレーションファイルを削除する（クリーンアップ用）
    ///
    /// 通常は削除しない。プロジェクトファイル自体を削除する場合にのみ使用。
    /// </summary>
    public static void DeleteCollabFile(string projectFilePath)
    {
        var collabPath = GetCollabFilePath(projectFilePath);
        try
        {
            if (File.Exists(collabPath))
                File.Delete(collabPath);
        }
        catch (IOException)
        {
            // ignore
        }
    }
}
