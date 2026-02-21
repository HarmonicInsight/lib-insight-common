using System;
using System.Diagnostics;
using System.IO;
using System.Text.Json;

namespace InsightCommon.ProjectFile;

/// <summary>
/// プロジェクトファイルの排他ロック管理
///
/// Word の ~$document.docx と同様のアプローチで、
/// ロックファイル（.lock）を使ってファイルの排他制御を行う。
///
/// <para>
/// 動作フロー:
/// 1. ファイルを開く → TryAcquireLock() でロック取得を試みる
/// 2. 成功 → 読み書きモードで開く
/// 3. 失敗（他のユーザーがロック中）→ 読み取り専用モードで開く
/// 4. ファイルを閉じる → ReleaseLock() でロック解放
/// </para>
///
/// <para>
/// 安全策:
/// - ハートビート: 定期的にロックファイルのタイムスタンプを更新
/// - スタルロック検知: ハートビートが一定時間更新されていないロックは無効とみなす
/// - プロセス存在チェック: ロックを保持するプロセスが生存しているか確認
/// </para>
/// </summary>
public class FileLockManager
{
    /// <summary>ロックファイルの拡張子</summary>
    public const string LockExtension = ".lock";

    /// <summary>ハートビートが更新されなかった場合にスタルとみなす閾値（分）</summary>
    private const int StaleThresholdMinutes = 30;

    /// <summary>ロックファイルのパスを生成</summary>
    public static string GetLockFilePath(string projectFilePath)
        => projectFilePath + LockExtension;

    /// <summary>
    /// ロックの取得を試みる
    /// </summary>
    /// <param name="projectFilePath">プロジェクトファイルのパス</param>
    /// <param name="userName">ユーザー名</param>
    /// <param name="applicationName">アプリケーション名（例: "InsightOfficeSheet"）</param>
    /// <returns>成功時は null、失敗時はロック保持者の情報</returns>
    public static FileLockInfo? TryAcquireLock(string projectFilePath, string userName, string applicationName)
    {
        var lockPath = GetLockFilePath(projectFilePath);

        // 既存のロックをチェック
        var existingLock = ReadLockInfo(lockPath);
        if (existingLock != null && !IsLockStale(existingLock))
        {
            // 自分自身のロックなら再取得OK
            if (existingLock.MachineName == Environment.MachineName
                && existingLock.ProcessId == Environment.ProcessId)
            {
                UpdateHeartbeat(lockPath, existingLock);
                return null;
            }

            // 他のユーザーがロック中
            return existingLock;
        }

        // ロック取得
        var lockInfo = new FileLockInfo
        {
            LockedBy = userName,
            MachineName = Environment.MachineName,
            ProcessId = Environment.ProcessId,
            LockedAt = DateTime.UtcNow.ToString("o"),
            Heartbeat = DateTime.UtcNow.ToString("o"),
            Application = applicationName,
        };

        try
        {
            WriteLockFile(lockPath, lockInfo);
            return null; // 成功
        }
        catch (IOException)
        {
            // 同時にロック取得を試みた場合の競合 → 再度チェック
            var conflictLock = ReadLockInfo(lockPath);
            return conflictLock ?? new FileLockInfo { LockedBy = "(unknown)" };
        }
    }

    /// <summary>
    /// ロックを解放する
    /// </summary>
    public static void ReleaseLock(string projectFilePath)
    {
        var lockPath = GetLockFilePath(projectFilePath);
        try
        {
            if (File.Exists(lockPath))
                File.Delete(lockPath);
        }
        catch (IOException)
        {
            // ネットワークドライブ等で削除できない場合は無視
            // ハートビート更新が止まるのでスタルロックとして処理される
        }
    }

    /// <summary>
    /// ハートビートを更新する（定期的に呼び出す: 推奨5分間隔）
    /// </summary>
    public static void UpdateHeartbeat(string projectFilePath)
    {
        var lockPath = GetLockFilePath(projectFilePath);
        var lockInfo = ReadLockInfo(lockPath);
        if (lockInfo == null) return;

        // 自分のロックでなければ更新しない
        if (lockInfo.MachineName != Environment.MachineName
            || lockInfo.ProcessId != Environment.ProcessId)
            return;

        UpdateHeartbeat(lockPath, lockInfo);
    }

    /// <summary>
    /// 現在のロック状態を確認する
    /// </summary>
    /// <returns>ロック情報（ロックされていない場合は null）</returns>
    public static FileLockInfo? GetCurrentLock(string projectFilePath)
    {
        var lockPath = GetLockFilePath(projectFilePath);
        var lockInfo = ReadLockInfo(lockPath);

        if (lockInfo == null) return null;
        if (IsLockStale(lockInfo)) return null;

        return lockInfo;
    }

    /// <summary>
    /// 自分がロックを保持しているか
    /// </summary>
    public static bool IsLockedByMe(string projectFilePath)
    {
        var lockInfo = GetCurrentLock(projectFilePath);
        if (lockInfo == null) return false;

        return lockInfo.MachineName == Environment.MachineName
            && lockInfo.ProcessId == Environment.ProcessId;
    }

    /// <summary>
    /// ロックファイルが存在し、有効かどうか
    /// </summary>
    public static bool IsLocked(string projectFilePath)
        => GetCurrentLock(projectFilePath) != null;

    // =========================================================================
    // 内部ヘルパー
    // =========================================================================

    private static bool IsLockStale(FileLockInfo lockInfo)
    {
        // ハートビートが閾値を超えている場合はスタル
        if (DateTime.TryParse(lockInfo.Heartbeat, out var heartbeat))
        {
            if (DateTime.UtcNow - heartbeat > TimeSpan.FromMinutes(StaleThresholdMinutes))
                return true;
        }

        // 同一マシンの場合、プロセスが生存しているか確認
        if (lockInfo.MachineName == Environment.MachineName)
        {
            try
            {
                Process.GetProcessById(lockInfo.ProcessId);
                return false; // プロセス生存 → スタルではない
            }
            catch (ArgumentException)
            {
                return true; // プロセス不在 → スタル
            }
        }

        return false; // リモートマシンの場合はハートビートのみで判定
    }

    private static FileLockInfo? ReadLockInfo(string lockPath)
    {
        try
        {
            if (!File.Exists(lockPath)) return null;
            var json = File.ReadAllText(lockPath);
            return JsonSerializer.Deserialize<FileLockInfo>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return null;
        }
    }

    private static void WriteLockFile(string lockPath, FileLockInfo lockInfo)
    {
        var json = JsonSerializer.Serialize(lockInfo,
            new JsonSerializerOptions { WriteIndented = true });

        // FileShare.None で排他的にロックファイルを作成
        using var fs = new FileStream(lockPath, FileMode.Create, FileAccess.Write, FileShare.None);
        using var writer = new StreamWriter(fs);
        writer.Write(json);
    }

    private static void UpdateHeartbeat(string lockPath, FileLockInfo lockInfo)
    {
        try
        {
            lockInfo.Heartbeat = DateTime.UtcNow.ToString("o");
            var json = JsonSerializer.Serialize(lockInfo,
                new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(lockPath, json);
        }
        catch (IOException)
        {
            // 更新失敗は無視（ネットワーク一時障害等）
        }
    }
}
