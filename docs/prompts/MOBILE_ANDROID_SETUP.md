# insight-common Android (Kotlin) モジュール追加

このプロンプトを使用して、insight-common リポジトリに Android (Kotlin) 用モジュールを追加してください。

## 概要

insight-common リポジトリに以下の Android 用モジュールを追加します：
- `license/kotlin/` - ライセンス管理
- `utils/kotlin/` - 共通ユーティリティ
- `errors/kotlin/` - 共通エラー定義

## 実行手順

以下の構成でファイルを作成してください：

### 1. ディレクトリ構造

```
insight-common/
├── license/
│   └── kotlin/
│       └── InsightLicense.kt
├── utils/
│   └── kotlin/
│       └── InsightUtils.kt
├── errors/
│   └── kotlin/
│       └── InsightErrors.kt
└── i18n/
    └── kotlin/
        └── InsightI18n.kt
```

### 2. license/kotlin/InsightLicense.kt

```kotlin
package com.harmonicinsight.common.license

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.security.MessageDigest

/**
 * Insight Series ライセンスティア
 */
enum class LicenseTier(val code: String, val displayName: String) {
    FREE("FREE", "Free"),
    TRIAL("TRIAL", "Trial"),
    BIZ("BIZ", "Business"),
    ENT("ENT", "Enterprise")
}

/**
 * Insight Series 製品コード
 */
enum class ProductCode(val code: String, val displayName: String) {
    SALES("SALES", "SalesInsight"),
    SLIDE("SLIDE", "InsightSlide"),
    PY("PY", "InsightPy"),
    IVIN("IVIN", "InterviewInsight"),
    ALL("ALL", "All Products")
}

/**
 * 機能制限
 */
data class FeatureLimits(
    val maxFiles: Int,
    val maxRecords: Int,
    val batchProcessing: Boolean,
    val export: Boolean,
    val cloudSync: Boolean,
    val priority: Boolean
)

/**
 * ライセンス検証結果
 */
data class LicenseValidationResult(
    val isValid: Boolean,
    val product: ProductCode? = null,
    val tier: LicenseTier? = null,
    val expiresAt: LocalDate? = null,
    val errorMessage: String? = null
)

/**
 * ティア別機能制限
 */
object TierLimits {
    private val limits = mapOf(
        LicenseTier.TRIAL to FeatureLimits(
            maxFiles = 10,
            maxRecords = 500,
            batchProcessing = true,
            export = true,
            cloudSync = false,
            priority = false
        ),
        LicenseTier.BIZ to FeatureLimits(
            maxFiles = Int.MAX_VALUE,
            maxRecords = 50000,
            batchProcessing = true,
            export = true,
            cloudSync = true,
            priority = true
        ),
        LicenseTier.ENT to FeatureLimits(
            maxFiles = Int.MAX_VALUE,
            maxRecords = Int.MAX_VALUE,
            batchProcessing = true,
            export = true,
            cloudSync = true,
            priority = true
        )
    )

    fun getFeatureLimits(tier: LicenseTier): FeatureLimits {
        return limits[tier] ?: limits[LicenseTier.TRIAL]!!
    }
}

/**
 * ライセンスバリデーター
 *
 * ライセンスキー形式: INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]
 */
class LicenseValidator {

    companion object {
        private val LICENSE_PATTERN = Regex(
            """^INS-(SALES|SLIDE|PY|IVIN|ALL)-(TRIAL|STD|PRO|ENT)-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{2})$"""
        )

        private val PRODUCT_MAP = ProductCode.values().associateBy { it.code }
        private val TIER_MAP = LicenseTier.values().associateBy { it.code }
    }

    /**
     * ライセンスキーを検証
     */
    fun validate(licenseKey: String, currentProduct: ProductCode? = null): LicenseValidationResult {
        val trimmedKey = licenseKey.trim().uppercase()

        val match = LICENSE_PATTERN.matchEntire(trimmedKey)
            ?: return LicenseValidationResult(
                isValid = false,
                errorMessage = "無効なライセンスキー形式です"
            )

        val (productCode, tierCode, segment1, segment2, checksum) = match.destructured

        // チェックサム検証
        val expectedChecksum = calculateChecksum("$productCode-$tierCode-$segment1-$segment2")
        if (checksum != expectedChecksum) {
            return LicenseValidationResult(
                isValid = false,
                errorMessage = "ライセンスキーのチェックサムが無効です"
            )
        }

        val product = PRODUCT_MAP[productCode]!!
        val tier = TIER_MAP[tierCode]!!

        // 製品チェック
        if (currentProduct != null && product != ProductCode.ALL && product != currentProduct) {
            return LicenseValidationResult(
                isValid = false,
                product = product,
                tier = tier,
                errorMessage = "このライセンスキーは${currentProduct.displayName}では使用できません"
            )
        }

        // 有効期限をセグメントからデコード
        val expiresAt = decodeExpiryDate(segment1, segment2)

        // 有効期限チェック（TRIALとSTD/PROのみ）
        if (tier != LicenseTier.ENT && expiresAt != null) {
            if (LocalDate.now().isAfter(expiresAt)) {
                return LicenseValidationResult(
                    isValid = false,
                    product = product,
                    tier = tier,
                    expiresAt = expiresAt,
                    errorMessage = "ライセンスの有効期限が切れています"
                )
            }
        }

        return LicenseValidationResult(
            isValid = true,
            product = product,
            tier = tier,
            expiresAt = expiresAt
        )
    }

    /**
     * チェックサムを計算
     */
    private fun calculateChecksum(data: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val hash = md.digest(data.toByteArray())
        return hash.take(2)
            .joinToString("") { "%02X".format(it) }
            .take(2)
    }

    /**
     * セグメントから有効期限をデコード
     */
    private fun decodeExpiryDate(segment1: String, segment2: String): LocalDate? {
        return try {
            // セグメントの最初の6文字から日付をデコード（YYMMDD形式）
            val dateStr = (segment1 + segment2).take(6)
            val year = 2000 + dateStr.substring(0, 2).toInt()
            val month = dateStr.substring(2, 4).toInt()
            val day = dateStr.substring(4, 6).toInt()
            LocalDate.of(year, month, day)
        } catch (e: Exception) {
            null
        }
    }
}

/**
 * ライセンスキー生成（開発・テスト用）
 */
object LicenseGenerator {

    fun generate(
        product: ProductCode,
        tier: LicenseTier,
        expiresAt: LocalDate? = null
    ): String {
        val expiry = expiresAt ?: when (tier) {
            LicenseTier.TRIAL -> LocalDate.now().plusDays(14)
            LicenseTier.STD, LicenseTier.PRO -> LocalDate.now().plusYears(1)
            LicenseTier.ENT -> LocalDate.now().plusYears(100)
        }

        val dateStr = expiry.format(DateTimeFormatter.ofPattern("yyMMdd"))
        val random1 = (1000..9999).random().toString().take(2)
        val random2 = (1000..9999).random().toString().take(2)

        val segment1 = dateStr.take(4)
        val segment2 = dateStr.takeLast(2) + random1

        val checksumData = "${product.code}-${tier.code}-$segment1-$segment2"
        val md = MessageDigest.getInstance("SHA-256")
        val hash = md.digest(checksumData.toByteArray())
        val checksum = hash.take(2)
            .joinToString("") { "%02X".format(it) }
            .take(2)

        return "INS-${product.code}-${tier.code}-$segment1-$segment2-$checksum"
    }
}
```

### 3. utils/kotlin/InsightUtils.kt

```kotlin
package com.harmonicinsight.common.utils

import java.text.NumberFormat
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.*
import java.util.regex.Pattern

/**
 * 日付フォーマット
 */
object DateUtils {

    fun formatDate(
        date: LocalDate,
        style: String = "medium",
        locale: Locale = Locale.JAPANESE
    ): String {
        val pattern = when (style) {
            "short" -> if (locale == Locale.JAPANESE) "yy/MM/dd" else "MM/dd/yy"
            "long" -> if (locale == Locale.JAPANESE) "yyyy年M月d日" else "MMMM d, yyyy"
            else -> if (locale == Locale.JAPANESE) "yyyy/MM/dd" else "MMM d, yyyy"
        }
        return date.format(DateTimeFormatter.ofPattern(pattern, locale))
    }

    fun formatDateTime(
        dateTime: LocalDateTime,
        style: String = "medium",
        locale: Locale = Locale.JAPANESE
    ): String {
        val datePattern = when (style) {
            "short" -> if (locale == Locale.JAPANESE) "yy/MM/dd" else "MM/dd/yy"
            "long" -> if (locale == Locale.JAPANESE) "yyyy年M月d日" else "MMMM d, yyyy"
            else -> if (locale == Locale.JAPANESE) "yyyy/MM/dd" else "MMM d, yyyy"
        }
        val timePattern = "HH:mm"
        return dateTime.format(DateTimeFormatter.ofPattern("$datePattern $timePattern", locale))
    }

    fun formatRelativeDate(date: LocalDate, locale: Locale = Locale.JAPANESE): String {
        val now = LocalDate.now()
        val days = ChronoUnit.DAYS.between(date, now)

        return when {
            days == 0L -> if (locale == Locale.JAPANESE) "今日" else "Today"
            days == 1L -> if (locale == Locale.JAPANESE) "昨日" else "Yesterday"
            days == -1L -> if (locale == Locale.JAPANESE) "明日" else "Tomorrow"
            days in 2..6 -> if (locale == Locale.JAPANESE) "${days}日前" else "$days days ago"
            days in -6..-2 -> if (locale == Locale.JAPANESE) "${-days}日後" else "in ${-days} days"
            days in 7..29 -> if (locale == Locale.JAPANESE) "${days / 7}週間前" else "${days / 7} weeks ago"
            days in 30..364 -> if (locale == Locale.JAPANESE) "${days / 30}ヶ月前" else "${days / 30} months ago"
            days >= 365 -> if (locale == Locale.JAPANESE) "${days / 365}年前" else "${days / 365} years ago"
            else -> formatDate(date, "medium", locale)
        }
    }

    fun daysUntil(targetDate: LocalDate): Long {
        return ChronoUnit.DAYS.between(LocalDate.now(), targetDate)
    }
}

/**
 * 数値フォーマット
 */
object NumberUtils {

    fun formatNumber(value: Number, locale: Locale = Locale.JAPANESE): String {
        return NumberFormat.getNumberInstance(locale).format(value)
    }

    fun formatCurrency(
        value: Number,
        currencyCode: String = "JPY",
        locale: Locale = Locale.JAPANESE
    ): String {
        val format = NumberFormat.getCurrencyInstance(locale)
        format.currency = Currency.getInstance(currencyCode)
        return format.format(value)
    }

    fun formatPercent(value: Double, decimals: Int = 1): String {
        return String.format("%.${decimals}f%%", value * 100)
    }

    fun formatFileSize(bytes: Long, locale: Locale = Locale.JAPANESE): String {
        val units = if (locale == Locale.JAPANESE) {
            listOf("B", "KB", "MB", "GB", "TB")
        } else {
            listOf("B", "KB", "MB", "GB", "TB")
        }

        var size = bytes.toDouble()
        var unitIndex = 0

        while (size >= 1024 && unitIndex < units.size - 1) {
            size /= 1024
            unitIndex++
        }

        return if (unitIndex == 0) {
            "$bytes ${units[0]}"
        } else {
            String.format("%.1f %s", size, units[unitIndex])
        }
    }
}

/**
 * 文字列ユーティリティ
 */
object StringUtils {

    fun truncate(text: String, maxLength: Int, suffix: String = "..."): String {
        return if (text.length <= maxLength) {
            text
        } else {
            text.take(maxLength - suffix.length) + suffix
        }
    }

    fun toSnakeCase(text: String): String {
        return text
            .replace(Regex("([a-z])([A-Z])"), "$1_$2")
            .replace(Regex("([A-Z]+)([A-Z][a-z])"), "$1_$2")
            .lowercase()
    }

    fun toCamelCase(text: String): String {
        return text.split(Regex("[_\\-\\s]+"))
            .mapIndexed { index, word ->
                if (index == 0) word.lowercase()
                else word.replaceFirstChar { it.uppercase() }
            }
            .joinToString("")
    }

    fun toPascalCase(text: String): String {
        return text.split(Regex("[_\\-\\s]+"))
            .joinToString("") { word ->
                word.replaceFirstChar { it.uppercase() }
            }
    }
}

/**
 * バリデーション
 */
object ValidationUtils {

    private val EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    )

    private val URL_PATTERN = Pattern.compile(
        "^https?://[\\w\\-]+(\\.[\\w\\-]+)+(/[\\w\\-./?%&=]*)?$"
    )

    private val PHONE_JP_PATTERN = Pattern.compile(
        "^0[0-9]{9,10}$|^\\+81[0-9]{9,10}$"
    )

    fun isValidEmail(email: String): Boolean {
        return EMAIL_PATTERN.matcher(email).matches()
    }

    fun isValidUrl(url: String): Boolean {
        return URL_PATTERN.matcher(url).matches()
    }

    fun isValidPhoneJP(phone: String): Boolean {
        val normalized = phone.replace(Regex("[\\s\\-()]"), "")
        return PHONE_JP_PATTERN.matcher(normalized).matches()
    }
}

/**
 * コレクションユーティリティ
 */
object CollectionUtils {

    fun <T, K> groupBy(items: List<T>, keySelector: (T) -> K): Map<K, List<T>> {
        return items.groupBy(keySelector)
    }

    fun <T> unique(items: List<T>): List<T> {
        return items.distinct()
    }

    fun <T> uniqueBy(items: List<T>, selector: (T) -> Any?): List<T> {
        return items.distinctBy(selector)
    }
}

/**
 * その他ユーティリティ
 */
object MiscUtils {

    fun generateId(length: Int = 12): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        return (1..length)
            .map { chars.random() }
            .joinToString("")
    }

    fun isEmpty(value: Any?): Boolean {
        return when (value) {
            null -> true
            is String -> value.isBlank()
            is Collection<*> -> value.isEmpty()
            is Map<*, *> -> value.isEmpty()
            is Array<*> -> value.isEmpty()
            else -> false
        }
    }

    suspend fun sleep(millis: Long) {
        kotlinx.coroutines.delay(millis)
    }
}
```

### 4. errors/kotlin/InsightErrors.kt

```kotlin
package com.harmonicinsight.common.errors

/**
 * エラーコード
 */
enum class ErrorCode(val code: String) {
    UNKNOWN("UNKNOWN"),
    VALIDATION("VALIDATION"),
    LICENSE_REQUIRED("LICENSE_REQUIRED"),
    LICENSE_EXPIRED("LICENSE_EXPIRED"),
    LICENSE_INVALID("LICENSE_INVALID"),
    FEATURE_LOCKED("FEATURE_LOCKED"),
    NETWORK_ERROR("NETWORK_ERROR"),
    NETWORK_TIMEOUT("NETWORK_TIMEOUT"),
    FILE_NOT_FOUND("FILE_NOT_FOUND"),
    FILE_READ_ERROR("FILE_READ_ERROR"),
    FILE_WRITE_ERROR("FILE_WRITE_ERROR"),
    PERMISSION_DENIED("PERMISSION_DENIED"),
    QUOTA_EXCEEDED("QUOTA_EXCEEDED"),
    RATE_LIMITED("RATE_LIMITED"),
    SERVER_ERROR("SERVER_ERROR"),
    MAINTENANCE("MAINTENANCE")
}

/**
 * Insight Series 基底エラー
 */
open class InsightError(
    val errorCode: ErrorCode,
    override val message: String,
    override val cause: Throwable? = null,
    val context: Map<String, Any>? = null
) : Exception(message, cause) {

    fun toMap(): Map<String, Any?> {
        return mapOf(
            "code" to errorCode.code,
            "message" to message,
            "context" to context
        )
    }

    fun getErrorMessageKey(): String {
        return "errors.${errorCode.code.lowercase()}"
    }
}

/**
 * ライセンスエラー
 */
class LicenseError(
    errorCode: ErrorCode,
    message: String,
    cause: Throwable? = null,
    context: Map<String, Any>? = null
) : InsightError(errorCode, message, cause, context) {

    companion object {
        fun required() = LicenseError(
            ErrorCode.LICENSE_REQUIRED,
            "ライセンスが必要です"
        )

        fun expired(expiresAt: String? = null) = LicenseError(
            ErrorCode.LICENSE_EXPIRED,
            "ライセンスの有効期限が切れています",
            context = expiresAt?.let { mapOf("expiresAt" to it) }
        )

        fun invalid(reason: String? = null) = LicenseError(
            ErrorCode.LICENSE_INVALID,
            reason ?: "無効なライセンスキーです"
        )
    }
}

/**
 * バリデーションエラー
 */
class ValidationError(
    message: String,
    val field: String? = null,
    cause: Throwable? = null
) : InsightError(
    ErrorCode.VALIDATION,
    message,
    cause,
    field?.let { mapOf("field" to it) }
)

/**
 * ネットワークエラー
 */
class NetworkError(
    errorCode: ErrorCode = ErrorCode.NETWORK_ERROR,
    message: String,
    cause: Throwable? = null,
    val statusCode: Int? = null
) : InsightError(
    errorCode,
    message,
    cause,
    statusCode?.let { mapOf("statusCode" to it) }
) {
    companion object {
        fun timeout() = NetworkError(
            ErrorCode.NETWORK_TIMEOUT,
            "リクエストがタイムアウトしました"
        )

        fun serverError(statusCode: Int) = NetworkError(
            ErrorCode.SERVER_ERROR,
            "サーバーエラーが発生しました",
            statusCode = statusCode
        )
    }
}

/**
 * ファイルエラー
 */
class FileError(
    errorCode: ErrorCode,
    message: String,
    val path: String? = null,
    cause: Throwable? = null
) : InsightError(
    errorCode,
    message,
    cause,
    path?.let { mapOf("path" to it) }
) {
    companion object {
        fun notFound(path: String) = FileError(
            ErrorCode.FILE_NOT_FOUND,
            "ファイルが見つかりません: $path",
            path = path
        )

        fun readError(path: String, cause: Throwable? = null) = FileError(
            ErrorCode.FILE_READ_ERROR,
            "ファイルの読み込みに失敗しました: $path",
            path = path,
            cause = cause
        )

        fun writeError(path: String, cause: Throwable? = null) = FileError(
            ErrorCode.FILE_WRITE_ERROR,
            "ファイルの書き込みに失敗しました: $path",
            path = path,
            cause = cause
        )
    }
}

/**
 * リトライ可能なエラーかどうかを判定
 */
fun isRetryable(error: Throwable): Boolean {
    return when (error) {
        is InsightError -> error.errorCode in listOf(
            ErrorCode.NETWORK_ERROR,
            ErrorCode.NETWORK_TIMEOUT,
            ErrorCode.SERVER_ERROR,
            ErrorCode.RATE_LIMITED
        )
        else -> false
    }
}

/**
 * 任意の例外を InsightError に変換
 */
fun toInsightError(error: Throwable): InsightError {
    return when (error) {
        is InsightError -> error
        is java.net.SocketTimeoutException -> NetworkError.timeout()
        is java.io.FileNotFoundException -> FileError(
            ErrorCode.FILE_NOT_FOUND,
            error.message ?: "ファイルが見つかりません",
            cause = error
        )
        is java.io.IOException -> InsightError(
            ErrorCode.FILE_READ_ERROR,
            error.message ?: "I/Oエラーが発生しました",
            cause = error
        )
        is SecurityException -> InsightError(
            ErrorCode.PERMISSION_DENIED,
            error.message ?: "権限がありません",
            cause = error
        )
        else -> InsightError(
            ErrorCode.UNKNOWN,
            error.message ?: "不明なエラーが発生しました",
            cause = error
        )
    }
}
```

### 5. i18n/kotlin/InsightI18n.kt

```kotlin
package com.harmonicinsight.common.i18n

import android.content.Context
import org.json.JSONObject
import java.util.Locale

/**
 * 多言語対応ヘルパー
 */
object InsightI18n {

    private var translations: JSONObject? = null
    private var currentLocale: Locale = Locale.JAPANESE

    /**
     * 初期化（Contextを使用してassetsからJSONを読み込む）
     */
    fun init(context: Context, locale: Locale = Locale.getDefault()) {
        currentLocale = when {
            locale.language == "ja" -> Locale.JAPANESE
            else -> Locale.ENGLISH
        }

        val fileName = if (currentLocale == Locale.JAPANESE) "ja.json" else "en.json"

        try {
            val json = context.assets.open("i18n/$fileName")
                .bufferedReader()
                .use { it.readText() }
            translations = JSONObject(json)
        } catch (e: Exception) {
            translations = JSONObject()
        }
    }

    /**
     * ロケールを設定
     */
    fun setLocale(context: Context, locale: Locale) {
        init(context, locale)
    }

    /**
     * 翻訳を取得
     * @param key ドット区切りのキー（例: "common.save"）
     * @param params プレースホルダー置換用パラメータ
     */
    fun t(key: String, params: Map<String, Any>? = null): String {
        val keys = key.split(".")
        var current: Any? = translations

        for (k in keys) {
            current = when (current) {
                is JSONObject -> current.opt(k)
                else -> null
            }
            if (current == null) return key
        }

        var result = current.toString()

        // パラメータ置換
        params?.forEach { (paramKey, value) ->
            result = result.replace("{$paramKey}", value.toString())
        }

        return result
    }

    /**
     * 現在のロケールを取得
     */
    fun getCurrentLocale(): Locale = currentLocale

    /**
     * ロケールを検出
     */
    fun detectLocale(): Locale {
        return if (Locale.getDefault().language == "ja") {
            Locale.JAPANESE
        } else {
            Locale.ENGLISH
        }
    }
}

/**
 * 拡張関数：Context から直接翻訳を取得
 */
fun Context.t(key: String, params: Map<String, Any>? = null): String {
    return InsightI18n.t(key, params)
}
```

## Android アプリでの使用方法

### build.gradle.kts への依存関係追加

```kotlin
// アプリの build.gradle.kts
dependencies {
    // insight-common をサブモジュールとして追加している場合
    implementation(project(":insight-common"))
}
```

### Application クラスで初期化

```kotlin
class InsightApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // i18n 初期化
        InsightI18n.init(this)
    }
}
```

### Activity での使用例

```kotlin
class MainActivity : AppCompatActivity() {

    private val licenseValidator = LicenseValidator()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ライセンス検証
        val result = licenseValidator.validate(
            licenseKey = "INS-SALES-PRO-2601-1534-A7",
            currentProduct = ProductCode.SALES
        )

        if (result.isValid) {
            val limits = TierLimits.getFeatureLimits(result.tier!!)
            Log.d("License", "Max files: ${limits.maxFiles}")
        }

        // i18n
        val saveText = t("common.save")  // "保存"

        // Utils
        val formattedDate = DateUtils.formatDate(LocalDate.now(), "long")
        val formattedPrice = NumberUtils.formatCurrency(1500)
    }
}
```

## 注意事項

1. **i18n JSONファイルの配置**: `app/src/main/assets/i18n/` に `ja.json` と `en.json` をコピーしてください
2. **パッケージ名**: 必要に応じて `com.harmonicinsight.common` を変更してください
3. **Coroutines**: `MiscUtils.sleep()` を使用する場合は `kotlinx-coroutines-android` が必要です

## 確認項目

- [ ] license/kotlin/InsightLicense.kt を作成
- [ ] utils/kotlin/InsightUtils.kt を作成
- [ ] errors/kotlin/InsightErrors.kt を作成
- [ ] i18n/kotlin/InsightI18n.kt を作成
- [ ] 各ファイルがコンパイルできることを確認
