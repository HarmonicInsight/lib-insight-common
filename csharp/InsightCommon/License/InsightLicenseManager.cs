using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace InsightCommon.License;

/// <summary>
/// Insight Series 蜈ｱ騾壹Λ繧､繧ｻ繝ｳ繧ｹ繝槭ロ繝ｼ繧ｸ繝｣繝ｼ
///
/// 繧ｭ繝ｼ蠖｢蠑・ PPPP-PLAN-YYMM-HASH-SIG1-SIG2
/// 繝上ャ繧ｷ繝･: SHA256 竊・Base32 蜈磯ｭ4譁・ｭ・
/// 鄂ｲ蜷・ HMAC-SHA256 竊・Base32 蜈磯ｭ8譁・ｭ・(SIG1=4 + SIG2=4)
/// </summary>
public class InsightLicenseManager
{
    private const string SECRET_KEY = "insight-series-license-secret-2026";

    private static readonly Regex LICENSE_KEY_REGEX = new(
        @"^(INSS|IOSH|IOSD|INPY|INMV|INBT|INCA|INIG|IVIN)-(TRIAL|STD|PRO)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$",
        RegexOptions.Compiled);

    private readonly string _productCode;
    private readonly string _productName;
    private readonly string _configDir;
    private readonly string _licenseFile;

    /// <summary>迴ｾ蝨ｨ縺ｮ繝ｩ繧､繧ｻ繝ｳ繧ｹ諠・ｱ</summary>
    public LicenseInfo CurrentLicense { get; private set; } = new();

    /// <summary>繧｢繧ｯ繝・ぅ繝吶・繝域ｸ医∩縺九←縺・°</summary>
    public bool IsActivated => CurrentLicense.Plan != PlanCode.Free && CurrentLicense.IsValid;

    /// <summary>譛滄剞蛻・ｌ30譌･莉･蜀・・隴ｦ蜻願｡ｨ遉ｺ縺悟ｿ・ｦ√°</summary>
    public bool ShouldShowExpiryWarning => CurrentLicense.DaysRemaining is > 0 and <= 30;

    /// <summary>
    /// 繧ｳ繝ｳ繧ｹ繝医Λ繧ｯ繧ｿ
    /// </summary>
    /// <param name="productCode">陬ｽ蜩√さ繝ｼ繝・(INSS, IOSH, IOSD, INPY, INMV, INBT, INCA, INIG, IVIN)</param>
    /// <param name="productName">陬ｽ蜩∝錐 (InsightOfficeSlide, InsightOfficeSheet, InsightOfficeDoc, etc.)</param>
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

    // 笏笏 Base32 (RFC 4648) 笏笏

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

    // 笏笏 讀懆ｨｼ 笏笏

    public LicenseInfo ValidateKey(string key, string? email = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺悟・蜉帙＆繧後※縺・∪縺帙ｓ縲・ };
        }

        key = key.Trim().ToUpperInvariant();
        var match = LICENSE_KEY_REGEX.Match(key);
        if (!match.Success)
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｮ蠖｢蠑上′豁｣縺励￥縺ゅｊ縺ｾ縺帙ｓ縲・ };
        }

        var productStr = match.Groups[1].Value;
        var planStr = match.Groups[2].Value;
        var yymm = match.Groups[3].Value;
        var emailHash = match.Groups[4].Value;
        var sig1 = match.Groups[5].Value;
        var sig2 = match.Groups[6].Value;

        // 陬ｽ蜩√さ繝ｼ繝峨メ繧ｧ繝・け
        if (productStr != _productCode)
        {
            return new LicenseInfo
            {
                IsValid = false,
                ProductCode = productStr,
                ErrorMessage = $"縺薙・繧ｭ繝ｼ縺ｯ {productStr} 逕ｨ縺ｧ縺吶・_productCode} 逕ｨ縺ｮ繧ｭ繝ｼ繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・
            };
        }

        // 鄂ｲ蜷肴､懆ｨｼ
        var signature = sig1 + sig2;
        var signData = $"{productStr}-{planStr}-{yymm}-{emailHash}";
        if (!VerifySignature(signData, signature))
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺檎┌蜉ｹ縺ｧ縺吶・ };
        }

        // 繝｡繝ｼ繝ｫ繝上ャ繧ｷ繝･辣ｧ蜷・
        if (!string.IsNullOrEmpty(email))
        {
            var computedHash = ComputeEmailHash(email);
            if (!string.Equals(emailHash, computedHash, StringComparison.OrdinalIgnoreCase))
            {
                return new LicenseInfo { IsValid = false, ErrorMessage = "繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ縺御ｸ閾ｴ縺励∪縺帙ｓ縲・ };
            }
        }

        var plan = PlanDisplay.Parse(planStr);

        // 譛牙柑譛滄剞繝√ぉ繝・け
        DateTime? expiresAt = null;
        try
        {
            var year = 2000 + int.Parse(yymm[..2], System.Globalization.CultureInfo.InvariantCulture);
            var month = int.Parse(yymm[2..], System.Globalization.CultureInfo.InvariantCulture);
            expiresAt = month == 12
                ? new DateTime(year + 1, 1, 1).AddDays(-1)
                : new DateTime(year, month + 1, 1).AddDays(-1);
            expiresAt = expiresAt.Value.Date.AddHours(23).AddMinutes(59).AddSeconds(59);
        }
        catch
        {
            return new LicenseInfo { IsValid = false, ErrorMessage = "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺ｮ譌･莉倥′荳肴ｭ｣縺ｧ縺吶・ };
        }

        if (DateTime.Now > expiresAt)
        {
            return new LicenseInfo
            {
                IsValid = false,
                Plan = plan,
                ProductCode = productStr,
                ExpiresAt = expiresAt,
                ErrorMessage = $"繝ｩ繧､繧ｻ繝ｳ繧ｹ縺ｮ譛牙柑譛滄剞縺悟・繧後※縺・∪縺呻ｼ・expiresAt.Value:yyyy蟷ｴMM譛・d譌･}・峨・
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

    // 笏笏 繧｢繧ｯ繝・ぅ繝吶・繧ｷ繝ｧ繝ｳ 笏笏

    public (bool Success, string Message) Activate(string email, string key)
    {
        if (string.IsNullOrWhiteSpace(email))
            return (false, "繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・);

        if (string.IsNullOrWhiteSpace(key))
            return (false, "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・);

        var info = ValidateKey(key, email);
        if (!info.IsValid)
            return (false, info.ErrorMessage ?? "繝ｩ繧､繧ｻ繝ｳ繧ｹ繧ｭ繝ｼ縺檎┌蜉ｹ縺ｧ縺吶・);

        info.Email = email;
        info.Key = key;
        CurrentLicense = info;
        SaveLicense();

        return (true, $"繝ｩ繧､繧ｻ繝ｳ繧ｹ縺梧ｭ｣蟶ｸ縺ｫ繧｢繧ｯ繝・ぅ繝吶・繝医＆繧後∪縺励◆・・info.PlanDisplayName}・峨・);
    }

    public void Deactivate()
    {
        CurrentLicense = new LicenseInfo();
        if (File.Exists(_licenseFile))
            File.Delete(_licenseFile);
    }

    // 笏笏 讖溯・繝√ぉ繝・け 笏笏

    /// <summary>
    /// 謖・ｮ壹・讖溯・縺悟茜逕ｨ蜿ｯ閭ｽ縺九ｒ蛻､螳・
    /// </summary>
    /// <param name="featureMatrix">讖溯・蜷坂・險ｱ蜿ｯ繝励Λ繝ｳ驟榊・縺ｮ繝槭ャ繝・/param>
    /// <param name="feature">繝√ぉ繝・け縺吶ｋ讖溯・蜷・/param>
    public bool CanUseFeature(Dictionary<string, PlanCode[]> featureMatrix, string feature)
    {
        if (!featureMatrix.TryGetValue(feature, out var allowedPlans))
            return true;
        return allowedPlans.Contains(CurrentLicense.Plan);
    }

    // 笏笏 豌ｸ邯壼喧 笏笏

    private void SaveLicense()
    {
        var data = new
        {
            key = CurrentLicense.Key,
            email = CurrentLicense.Email,
            expires = CurrentLicense.ExpiresAt?.ToString("O")
        };
        var json = JsonSerializer.Serialize(data, JsonOptions.WriteIndented);
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

    /// <summary>譛牙柑譛滄剞縺ｮ陦ｨ遉ｺ譁・ｭ怜・</summary>
    public string ExpiryDateString
    {
        get
        {
            if (!CurrentLicense.ExpiresAt.HasValue) return "-";
            return CurrentLicense.ExpiresAt.Value.ToString("yyyy/MM/dd", System.Globalization.CultureInfo.InvariantCulture);
        }
    }
}
