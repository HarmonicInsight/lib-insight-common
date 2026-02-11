using System.IO;
using System.Text.Json;

namespace HarmonicTools.LicenseManager.Models;

/// <summary>
/// 発行済みライセンスの記録
/// </summary>
public class LicenseRecord
{
    public string Key { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ExpiryYYMM { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.Now;
    public string? Note { get; set; }

    public string ExpiryDisplay
    {
        get
        {
            if (ExpiryYYMM.Length != 4) return ExpiryYYMM;
            var yy = ExpiryYYMM[..2];
            var mm = ExpiryYYMM[2..];
            return $"20{yy}/{mm}";
        }
    }

    public string IssuedAtDisplay => IssuedAt.ToString("yyyy/MM/dd HH:mm");
}

/// <summary>
/// ライセンス記録の永続化
/// </summary>
public class LicenseStore
{
    public List<LicenseRecord> Records { get; set; } = new();

    private static readonly string ConfigDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "HarmonicInsight", "LicenseManager");

    private static readonly string StoreFile = Path.Combine(ConfigDir, "issued-licenses.json");

    public static LicenseStore Load()
    {
        try
        {
            if (File.Exists(StoreFile))
            {
                var json = File.ReadAllText(StoreFile);
                return JsonSerializer.Deserialize<LicenseStore>(json) ?? new LicenseStore();
            }
        }
        catch { }
        return new LicenseStore();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(ConfigDir);
            var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(StoreFile, json);
        }
        catch { }
    }

    public void Add(LicenseRecord record)
    {
        Records.Insert(0, record);
        Save();
    }

    public void Remove(LicenseRecord record)
    {
        Records.Remove(record);
        Save();
    }

    /// <summary>
    /// CSV形式でエクスポート
    /// </summary>
    public string ExportCsv()
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("発行日,製品コード,製品名,プラン,メールアドレス,有効期限,ライセンスキー,備考");
        foreach (var r in Records)
        {
            sb.AppendLine($"{r.IssuedAtDisplay},{r.ProductCode},{r.ProductName},{r.Plan},{r.Email},{r.ExpiryDisplay},{r.Key},{r.Note}");
        }
        return sb.ToString();
    }
}
