package com.harmonic.insight.__APPNAME__.license

import android.content.Context
import android.content.SharedPreferences
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.regex.Pattern

// ============================================================
// Insight ライセンスマネージャー
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ を実際のパッケージ名に置換してください。
// __PRODUCT_CODE__ を製品コード (例: "IOSH") に置換してください。
//
// ライセンスキー形式:
//   {製品コード}-{プラン}-{YYMM}-{HASH}-{SIG1}-{SIG2}
//   例: IOSH-STD-2601-XXXX-XXXX-XXXX
//
// config/license-server.ts と連携してオンライン認証を追加可能。
// ============================================================

class LicenseManager(context: Context) {
    companion object {
        const val PRODUCT_CODE = "__PRODUCT_CODE__"

        private val KEY_PATTERN = Pattern.compile(
            "^([A-Z]{4})-(TRIAL|STD|PRO|ENT)-(\\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$"
        )

        private const val PREFS_NAME = "insight_license"
        private const val KEY_EMAIL = "email"
        private const val KEY_LICENSE = "key"
        private const val KEY_PLAN = "plan"
        private const val KEY_EXPIRY = "expiry"
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var currentPlan: PlanCode? = null
        private set

    var email: String? = null
        private set

    var expiryDate: LocalDate? = null
        private set

    val isActivated: Boolean
        get() = currentPlan != null

    val isExpired: Boolean
        get() = expiryDate?.isBefore(LocalDate.now()) == true

    val isValid: Boolean
        get() = isActivated && !isExpired

    init {
        loadLicense()
    }

    /**
     * ライセンスキーを検証してアクティベートする。
     *
     * @param email ユーザーのメールアドレス
     * @param key ライセンスキー
     * @return 成功時は Result.success、失敗時は Result.failure
     */
    fun activate(email: String, key: String): Result<String> {
        val normalizedKey = key.trim().uppercase()
        val matcher = KEY_PATTERN.matcher(normalizedKey)

        if (!matcher.matches()) {
            return Result.failure(LicenseException.InvalidFormat)
        }

        val productCode = matcher.group(1)!!
        val planStr = matcher.group(2)!!
        val yymm = matcher.group(3)!!

        if (productCode != PRODUCT_CODE) {
            return Result.failure(LicenseException.WrongProduct(productCode))
        }

        val plan = PlanCode.fromString(planStr)
            ?: return Result.failure(LicenseException.InvalidFormat)

        // YYMM から有効期限を計算 (発行月から365日)
        val year = 2000 + yymm.substring(0, 2).toInt()
        val month = yymm.substring(2, 4).toInt()
        val issueDate = LocalDate.of(year, month, 1)
        val expiry = when (plan) {
            PlanCode.TRIAL -> issueDate.plusDays(30)
            else -> issueDate.plusDays(365)
        }

        // 保存
        prefs.edit()
            .putString(KEY_EMAIL, email)
            .putString(KEY_LICENSE, normalizedKey)
            .putString(KEY_PLAN, plan.name)
            .putString(KEY_EXPIRY, expiry.format(DateTimeFormatter.ISO_LOCAL_DATE))
            .apply()

        this.email = email
        this.currentPlan = plan
        this.expiryDate = expiry

        return Result.success(plan.displayNameJa)
    }

    /**
     * ライセンスをクリア（ログアウト）する。
     */
    fun deactivate() {
        prefs.edit().clear().apply()
        currentPlan = null
        email = null
        expiryDate = null
    }

    /**
     * 指定機能が現在のプランで利用可能かチェックする。
     *
     * @param feature 機能名
     * @param featureMatrix 機能 → 利用可能プラン のマップ
     */
    fun canUseFeature(
        feature: String,
        featureMatrix: Map<String, Set<PlanCode>>,
    ): Boolean {
        val plan = currentPlan ?: return false
        if (!isValid) return false
        return featureMatrix[feature]?.contains(plan) == true
    }

    private fun loadLicense() {
        val planStr = prefs.getString(KEY_PLAN, null) ?: return
        val expiryStr = prefs.getString(KEY_EXPIRY, null) ?: return

        currentPlan = PlanCode.fromString(planStr)
        email = prefs.getString(KEY_EMAIL, null)
        expiryDate = try {
            LocalDate.parse(expiryStr, DateTimeFormatter.ISO_LOCAL_DATE)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 有効期限のフォーマット済み表示文字列を返す。
     */
    fun formattedExpiry(): String {
        return expiryDate?.format(
            DateTimeFormatter.ofPattern("yyyy年MM月dd日")
        ) ?: "---"
    }
}

/**
 * ライセンス例外クラス。
 */
sealed class LicenseException(message: String) : Exception(message) {
    data object InvalidFormat : LicenseException("無効なライセンスキー形式です")
    data class WrongProduct(val code: String) : LicenseException("この製品用のキーではありません (製品コード: $code)")
}
