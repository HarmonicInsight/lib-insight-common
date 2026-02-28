using System.Security.Cryptography;
using System.Text;

namespace HarmonicTools.LicenseManager.Services;

/// <summary>
/// ライセンスキー生成サービス
/// InsightLicenseManager と同一アルゴリズムでキーを生成
/// </summary>
public class LicenseGenerator
{
    private const string SECRET_KEY = "insight-series-license-secret-2026";

    public static readonly string[] ProductCodes =
        { "INCA", "INBT", "IVIN", "INMV", "INIG", "INSS", "IOSH", "IOSD", "INPY", "ISOF" };

    public static readonly Dictionary<string, string> ProductNames = new()
    {
        // Tier 1: 業務変革ツール
        ["INCA"] = "InsightNoCodeAnalyzer",
        ["INBT"] = "InsightBot",
        ["IVIN"] = "InterviewInsight",
        // Tier 2: AI活用ツール
        ["INMV"] = "InsightCast",
        ["INIG"] = "InsightImageGen",
        // Tier 3: Insight Business Suite
        ["INSS"] = "Insight Deck Quality Gate",
        ["IOSH"] = "Insight Performance Management",
        ["IOSD"] = "Insight AI Briefcase",
        ["INPY"] = "InsightPy",
        // Tier 4: Accessibility
        ["ISOF"] = "InsightSeniorOffice",
    };

    public static readonly string[] PlanCodes = { "FREE", "TRIAL", "BIZ", "ENT" };

    /// <summary>
    /// ライセンスキーを生成
    /// </summary>
    /// <param name="productCode">製品コード</param>
    /// <param name="plan">プラン (FREE, TRIAL, BIZ, ENT)</param>
    /// <param name="email">メールアドレス</param>
    /// <param name="expiryYear">有効期限年 (2桁)</param>
    /// <param name="expiryMonth">有効期限月</param>
    /// <returns>生成されたライセンスキー</returns>
    public string Generate(string productCode, string plan, string email, int expiryYear, int expiryMonth)
    {
        var yymm = $"{expiryYear:D2}{expiryMonth:D2}";
        var emailHash = ComputeEmailHash(email);
        var signData = $"{productCode}-{plan}-{yymm}-{emailHash}";
        var signature = GenerateSignature(signData);
        var sig1 = signature[..4];
        var sig2 = signature[4..8];

        return $"{productCode}-{plan}-{yymm}-{emailHash}-{sig1}-{sig2}";
    }

    /// <summary>
    /// 生成したキーを検証（セルフテスト）
    /// </summary>
    public bool Verify(string key, string email)
    {
        var parts = key.Split('-');
        if (parts.Length != 6) return false;

        var productCode = parts[0];
        var plan = parts[1];
        var yymm = parts[2];
        var emailHash = parts[3];
        var sig1 = parts[4];
        var sig2 = parts[5];

        // メールハッシュ検証
        var computedHash = ComputeEmailHash(email);
        if (!string.Equals(emailHash, computedHash, StringComparison.OrdinalIgnoreCase))
            return false;

        // 署名検証
        var signData = $"{productCode}-{plan}-{yymm}-{emailHash}";
        var expectedSig = GenerateSignature(signData);
        var actualSig = sig1 + sig2;

        return string.Equals(expectedSig, actualSig, StringComparison.OrdinalIgnoreCase);
    }

    // ── Base32 (RFC 4648) ── InsightLicenseManager と同一実装

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
}
