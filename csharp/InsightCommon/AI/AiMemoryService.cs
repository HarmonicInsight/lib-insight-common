using System;
using System.Collections.Generic;
using System.Linq;

namespace InsightCommon.AI;

/// <summary>
/// AI メモリサービス — CRUD・マージ・重複排除・プラン制限
///
/// ReferenceMaterialsService と同様のパターンで、
/// プロジェクトファイル ZIP 内のホットキャッシュを管理する。
///
/// 使い方:
/// <code>
/// var hotCache = LoadFromZip&lt;AiMemoryHotCache&gt;("ai_memory.json");
/// var service = new AiMemoryService("BIZ", hotCache);
/// var result = service.MergeEntries(extractedEntries);
/// WriteToZip("ai_memory.json", service.HotCache);
/// </code>
/// </summary>
public class AiMemoryService
{
    private AiMemoryHotCache _hotCache;
    private readonly string _planCode;
    private readonly object _lock = new();

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="planCode">現在のライセンスプラン（FREE/TRIAL/BIZ/ENT）</param>
    /// <param name="initialCache">ZIP から読み込んだホットキャッシュ（null の場合は空で初期化）</param>
    public AiMemoryService(string planCode, AiMemoryHotCache? initialCache = null)
    {
        _planCode = planCode.ToUpperInvariant();
        _hotCache = initialCache ?? new AiMemoryHotCache();
    }

    // ═══════════════════════════════════════════════════════════════
    // プロパティ
    // ═══════════════════════════════════════════════════════════════

    /// <summary>ホットキャッシュ（保存時にこれを ZIP に書き込む）</summary>
    public AiMemoryHotCache HotCache
    {
        get { lock (_lock) return _hotCache; }
    }

    /// <summary>現在のエントリ数</summary>
    public int EntryCount
    {
        get { lock (_lock) return _hotCache.Entries.Count; }
    }

    /// <summary>メモリ機能が有効か</summary>
    public bool IsEnabled => AiMemoryLimitsRegistry.GetLimits(_planCode).Enabled;

    /// <summary>エントリ追加可能か</summary>
    public bool CanAddMore
    {
        get { lock (_lock) return AiMemoryLimitsRegistry.CanAddToHotCache(_planCode, _hotCache.Entries.Count); }
    }

    /// <summary>現在の使用量と上限を取得</summary>
    public (int current, int max) GetCapacity()
    {
        lock (_lock)
        {
            var limits = AiMemoryLimitsRegistry.GetLimits(_planCode);
            return (_hotCache.Entries.Count, limits.HotCacheMaxEntries);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 新規エントリをマージ（重複排除付き）
    ///
    /// MemoryExtractor が抽出したエントリ一覧を受け取り、
    /// 既存エントリとの重複を検出・マージして追加する。
    /// プラン制限を超える分はスキップされる。
    /// </summary>
    public MemoryMergeResult MergeEntries(IReadOnlyList<MemoryEntry> newEntries)
    {
        lock (_lock)
        {
            var added = new List<MemoryEntry>();
            var updated = new List<MemoryEntry>();
            var skipped = 0;

            foreach (var entry in newEntries)
            {
                var existing = FindDuplicate(entry);
                if (existing != null)
                {
                    MergeInto(existing, entry);
                    updated.Add(existing);
                }
                else if (AiMemoryLimitsRegistry.CanAddToHotCache(_planCode, _hotCache.Entries.Count))
                {
                    _hotCache.Entries.Add(entry);
                    added.Add(entry);
                }
                else
                {
                    skipped++;
                }
            }

            if (added.Count > 0 || updated.Count > 0)
            {
                _hotCache.LastUpdatedAt = DateTime.UtcNow.ToString("o");
            }

            EnforceLimits();

            return new MemoryMergeResult
            {
                Added = added.Count,
                Updated = updated.Count,
                Skipped = skipped,
                AddedEntries = added,
                UpdatedEntries = updated,
            };
        }
    }

    /// <summary>
    /// エントリを ID で削除
    /// </summary>
    public bool RemoveEntry(string entryId)
    {
        lock (_lock)
        {
            var entry = _hotCache.Entries.FirstOrDefault(e => e.Id == entryId);
            if (entry == null) return false;

            _hotCache.Entries.Remove(entry);
            _hotCache.LastUpdatedAt = DateTime.UtcNow.ToString("o");
            return true;
        }
    }

    /// <summary>
    /// エントリを更新（ID で検索して置換）
    /// </summary>
    public bool UpdateEntry(MemoryEntry updated)
    {
        lock (_lock)
        {
            var index = _hotCache.Entries.FindIndex(e => e.Id == updated.Id);
            if (index < 0) return false;

            _hotCache.Entries[index] = updated;
            _hotCache.LastUpdatedAt = DateTime.UtcNow.ToString("o");
            return true;
        }
    }

    /// <summary>
    /// 全エントリをクリア
    /// </summary>
    public void ClearAll()
    {
        lock (_lock)
        {
            _hotCache.Entries.Clear();
            _hotCache.LastUpdatedAt = DateTime.UtcNow.ToString("o");
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 検索
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// キーワードでエントリを検索（部分一致、大小無視）
    /// </summary>
    public List<MemoryEntry> Search(string query)
    {
        lock (_lock)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<MemoryEntry>(_hotCache.Entries);

            var q = query.Trim();
            return _hotCache.Entries
                .Where(e => MatchesQuery(e, q))
                .ToList();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 重複排除（private）
    // ═══════════════════════════════════════════════════════════════

    /// <summary>
    /// 既存エントリから重複を検出
    /// </summary>
    private MemoryEntry? FindDuplicate(MemoryEntry entry)
    {
        return entry switch
        {
            PersonMemoryEntry person => _hotCache.Entries
                .OfType<PersonMemoryEntry>()
                .FirstOrDefault(e =>
                    string.Equals(e.Name, person.Name, StringComparison.OrdinalIgnoreCase) ||
                    e.Aliases.Any(a => person.Aliases.Any(pa =>
                        string.Equals(a, pa, StringComparison.OrdinalIgnoreCase))) ||
                    e.Aliases.Any(a =>
                        string.Equals(a, person.Name, StringComparison.OrdinalIgnoreCase)) ||
                    person.Aliases.Any(pa =>
                        string.Equals(pa, e.Name, StringComparison.OrdinalIgnoreCase))),

            GlossaryMemoryEntry glossary => _hotCache.Entries
                .OfType<GlossaryMemoryEntry>()
                .FirstOrDefault(e =>
                    string.Equals(e.Term, glossary.Term, StringComparison.OrdinalIgnoreCase)),

            ProjectMemoryEntry project => _hotCache.Entries
                .OfType<ProjectMemoryEntry>()
                .FirstOrDefault(e =>
                    string.Equals(e.Name, project.Name, StringComparison.OrdinalIgnoreCase) ||
                    e.Aliases.Any(a => project.Aliases.Any(pa =>
                        string.Equals(a, pa, StringComparison.OrdinalIgnoreCase))) ||
                    e.Aliases.Any(a =>
                        string.Equals(a, project.Name, StringComparison.OrdinalIgnoreCase)) ||
                    project.Aliases.Any(pa =>
                        string.Equals(pa, e.Name, StringComparison.OrdinalIgnoreCase))),

            PreferenceMemoryEntry pref => _hotCache.Entries
                .OfType<PreferenceMemoryEntry>()
                .FirstOrDefault(e =>
                    string.Equals(e.Key, pref.Key, StringComparison.OrdinalIgnoreCase)),

            _ => null,
        };
    }

    /// <summary>
    /// 既存エントリに新規エントリの情報をマージ
    /// </summary>
    private static void MergeInto(MemoryEntry existing, MemoryEntry incoming)
    {
        existing.ReferenceCount++;
        existing.LastReferencedAt = DateTime.UtcNow.ToString("o");

        switch (existing)
        {
            case PersonMemoryEntry ep when incoming is PersonMemoryEntry ip:
                ep.Aliases = ep.Aliases.Union(ip.Aliases, StringComparer.OrdinalIgnoreCase).ToList();
                if (!string.IsNullOrEmpty(ip.Title)) ep.Title = ip.Title;
                if (!string.IsNullOrEmpty(ip.Department)) ep.Department = ip.Department;
                ep.RelatedProjects = ep.RelatedProjects.Union(ip.RelatedProjects, StringComparer.OrdinalIgnoreCase).ToList();
                if (!string.IsNullOrEmpty(ip.Notes)) ep.Notes = ip.Notes;
                break;

            case GlossaryMemoryEntry eg when incoming is GlossaryMemoryEntry ig:
                if (!string.IsNullOrEmpty(ig.Expansion)) eg.Expansion = ig.Expansion;
                if (!string.IsNullOrEmpty(ig.Description)) eg.Description = ig.Description;
                break;

            case ProjectMemoryEntry epr when incoming is ProjectMemoryEntry ipr:
                epr.Aliases = epr.Aliases.Union(ipr.Aliases, StringComparer.OrdinalIgnoreCase).ToList();
                if (!string.IsNullOrEmpty(ipr.Status)) epr.Status = ipr.Status;
                if (!string.IsNullOrEmpty(ipr.Description)) epr.Description = ipr.Description;
                epr.RelatedPeople = epr.RelatedPeople.Union(ipr.RelatedPeople, StringComparer.OrdinalIgnoreCase).ToList();
                break;

            case PreferenceMemoryEntry epf when incoming is PreferenceMemoryEntry ipf:
                epf.Value = ipf.Value;
                if (!string.IsNullOrEmpty(ipf.Description)) epf.Description = ipf.Description;
                break;
        }
    }

    /// <summary>
    /// プラン制限を超過している場合、参照回数が少ない順に末尾から除去
    /// </summary>
    private void EnforceLimits()
    {
        var limits = AiMemoryLimitsRegistry.GetLimits(_planCode);
        if (limits.HotCacheMaxEntries == -1) return;

        while (_hotCache.Entries.Count > limits.HotCacheMaxEntries)
        {
            var leastReferenced = _hotCache.Entries
                .OrderBy(e => e.ReferenceCount)
                .ThenBy(e => e.LastReferencedAt)
                .First();
            _hotCache.Entries.Remove(leastReferenced);
        }
    }

    /// <summary>
    /// エントリがクエリにマッチするか（部分一致、大小無視）
    /// </summary>
    private static bool MatchesQuery(MemoryEntry entry, string query)
    {
        return entry switch
        {
            PersonMemoryEntry p =>
                Contains(p.Name, query) ||
                p.Aliases.Any(a => Contains(a, query)) ||
                Contains(p.Title, query) ||
                Contains(p.Department, query),

            GlossaryMemoryEntry g =>
                Contains(g.Term, query) ||
                Contains(g.Expansion, query) ||
                Contains(g.Description, query),

            ProjectMemoryEntry pr =>
                Contains(pr.Name, query) ||
                pr.Aliases.Any(a => Contains(a, query)) ||
                Contains(pr.Description, query),

            PreferenceMemoryEntry pf =>
                Contains(pf.Key, query) ||
                Contains(pf.Value, query) ||
                Contains(pf.Description, query),

            _ => false,
        };
    }

    private static bool Contains(string? text, string query)
    {
        return text != null && text.Contains(query, StringComparison.OrdinalIgnoreCase);
    }
}
