using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace HarmonicOffice.Common.License;

/// <summary>
/// Insight Series 共通ライセンスマネージャー
///
/// キー形式: PPPP-PLAN-YYMM-HASH-SIG1-SIG2
/// ハッシュ: SHA256 → Base32 先頭4文字
/// 署名: HMAC-SHA256 → Base32 先頭8文字 (SIG1=4 + SIG2=4)
/// </summary>
public class InsightLicenseManager
{
    private const string SECRET_KEY = "insight-series-license-secret-2026";

    private static readonly Regex LICENSE_KEY_REGEX = new(
        @"^(INSS|INSP|INPY|FGIN|INMV|INBT|INCA|INIG|HMSH|HMDC|HMSL)-(TRIAL|STD|PRO)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$",
        RegexOptions.Compiled);

    private readonly string _productCode;
    private readonly string _productName;
    private readonly string _configDir;
    private readonly string _licenseFile;

    /// <summary>現在のライセンス情報</summary>
    public LicenseInfo CurrentLicense { get; private set; } = new();

    /// <summary>アクティベート済みかどうか</summary>
    public bool IsActivated => CurrentLicense.Plan != PlanCode.Free && CurrentLicense.IsValid;

    /// <summary>期限切れ30日以内の警告表示が必要か</summary>
    public bool ShouldShowExpiryWarning => CurrentLicense.DaysRemaining is > 0 and <= 30;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="productCode">製品コード (HMSH, HMDC, HMSL, etc.)</param>
    /// <param name="productName">製品名 (HarmonicSheet, HarmonicDoc, HarmonicSlide)</param>
    public InsightLicenseManager(string productCode, string productName)
    {
        _productCode = productCode;
        _productName = productName;
        _configDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "HarmonicInsight", productName);
        _licenseFile = Path.Combine(_configDir, "license.json");
        Directory.CreateDirectory(_configDir);
        LoadLicense();
    }

    // ── Base32 (RFC 4648) ──

    private static string ToBase32(byte[] bytes)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var result = new StringBuilder();
        int bits = 0;
        int value = 0;

        foreach (var b in bytes)
        {
            value = (value << 8) | b;
            bits += 8;
            while (bits >= 5)
            {
                result.Append(alphabet[(value >> (bits - 5)) & 31]);
                bits -= 5;
            }
        }

        if (bits > 0)
        {
            result.Append(alphabet[(value << (5 - bits)) & 31]);
        }

        return result.ToString();
    }

    private static string ComputeEmailHash(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return ToBase32(hashBytes)[..4].ToUpperInvariant();
    }

    private static string GenerateSignature(string data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SECRET_KEY));
        var sig = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return ToBase32(sig)[..8].ToUpperInvariant();
    }

    private static bool VerifySignature(string data, string signature)
    {
        try
        {
            var expected = GenerateSignature(data);
            return string.Equals(expected, signature, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    // ── 検証 ──

    public LicenseInfo ValidateKey(string key, string? email = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "ライセンスキーが入力されていません。" };
        }

        key = key.Trim().ToUpperInvariant();
        var match = LICENSE_KEY_REGEX.Match(key);
        if (!match.Success)
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "ライセンスキーの形式が正しくありません。" };
        }

        var productStr = match.Groups[1].Value;
        var planStr = match.Groups[2].Value;
        var yymm = match.Groups[3].Value;
        var emailHash = match.Groups[4].Value;
        var sig1 = match.Groups[5].Value;
        var sig2 = match.Groups[6].Value;

        // 製品コードチェック
        if (productStr != _productCode)
        {
            return new LicenseInfo
            {
                IsValid = false,
                ProductCode = productStr,
                ErrorMessage = $"このキーは {productStr} 用です。{_productCode} 用のキーを入力してください。"
            };
        }

        // 署名検証
        var signature = sig1 + sig2;
        var signData = $"{productStr}-{planStr}-{yymm}-{emailHash}";
        if (!VerifySignature(signData, signature))
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "ライセンスキーが無効です。" };
        }

        // メールハッシュ照合
        if (!string.IsNullOrEmpty(email))
        {
            var computedHash = ComputeEmailHash(email);
            if (!string.Equals(emailHash, computedHash, StringComparison.OrdinalIgnoreCase))
            {
                return new LicenseInfo { IsValid = false, ErrorMessage = "メールアドレスが一致しません。" };
            }
        }

        var plan = PlanDisplay.Parse(planStr);

        // 有効期限チェック
        DateTime? expiresAt = null;
        try
        {
            var year = 2000 + int.Parse(yymm[..2]);
            var month = int.Parse(yymm[2..]);
            expiresAt = month == 12
                ? new DateTime(year + 1, 1, 1).AddDays(-1)
                : new DateTime(year, month + 1, 1).AddDays(-1);
            expiresAt = expiresAt.Value.Date.AddHours(23).AddMinutes(59).AddSeconds(59);
        }
        catch
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "ライセンスキーの日付が不正です。" };
        }

        if (DateTime.Now > expiresAt)
        {
            return new LicenseInfo
            {
                IsValid = false,
                Plan = plan,
                ProductCode = productStr,
                ExpiresAt = expiresAt,
                ErrorMessage = $"ライセンスの有効期限が切れています（{expiresAt.Value:yyyy年MM月dd日}）。"
            };
        }

        return new LicenseInfo
        {
            IsValid = true,
            Plan = plan,
            ProductCode = productStr,
            ExpiresAt = expiresAt,
            Email = email,
            Key = key
        };
    }

    // ── アクティベーション ──

    public (bool Success, string Message) Activate(string email, string key)
    {
        if (string.IsNullOrWhiteSpace(email))
            return (false, "メールアドレスを入力してください。");

        if (string.IsNullOrWhiteSpace(key))
            return (false, "ライセンスキーを入力してください。");

        var info = ValidateKey(key, email);
        if (!info.IsValid)
            return (false, info.ErrorMessage ?? "ライセンスキーが無効です。");

        info.Email = email;
        info.Key = key;
        CurrentLicense = info;
        SaveLicense();

        return (true, $"ライセンスが正常にアクティベートされました（{info.PlanDisplayName}）。");
    }

    public void Deactivate()
    {
        CurrentLicense = new LicenseInfo();
        if (File.Exists(_licenseFile))
            File.Delete(_licenseFile);
    }

    // ── 機能チェック ──

    /// <summary>
    /// 指定の機能が利用可能かを判定
    /// </summary>
    public bool CanUseFeature(Dictionary<string, PlanCode[]> featureMatrix, string feature)
    {
        if (!featureMatrix.TryGetValue(feature, out var allowedPlans))
            return true;
        return allowedPlans.Contains(CurrentLicense.Plan);
    }

    // ── 永続化 ──

    private void SaveLicense()
    {
        var data = new
        {
            key = CurrentLicense.Key,
            email = CurrentLicense.Email,
            expires = CurrentLicense.ExpiresAt?.ToString("O")
        };
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_licenseFile, json);
    }

    private void LoadLicense()
    {
        if (!File.Exists(_licenseFile))
        {
            CurrentLicense = new LicenseInfo();
            return;
        }

        try
        {
            var json = File.ReadAllText(_licenseFile);
            var data = JsonSerializer.Deserialize<JsonElement>(json);

            var key = data.GetProperty("key").GetString() ?? string.Empty;
            var email = data.GetProperty("email").GetString() ?? string.Empty;

            if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(email))
            {
                CurrentLicense = new LicenseInfo();
                return;
            }

            var info = ValidateKey(key, email);
            CurrentLicense = info.IsValid ? info : new LicenseInfo();
        }
        catch
        {
            CurrentLicense = new LicenseInfo();
        }
    }

    /// <summary>有効期限の表示文字列</summary>
    public string ExpiryDateString
    {
        get
        {
            if (!CurrentLicense.ExpiresAt.HasValue) return "-";
            return CurrentLicense.ExpiresAt.Value.ToString("yyyy/MM/dd");
        }
    }
}
