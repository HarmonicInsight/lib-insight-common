/**
 * HARMONIC insight Launcher — Asset-based Icon Loader
 *
 * insight-common の launcher-manifest.json を読み取り、
 * assets/launcher/ 以下のアイコンを Bitmap として提供する。
 *
 * ## 前提
 * - insight-common/scripts/sync-launcher-assets.sh で
 *   app/src/main/assets/launcher/ にアイコン + マニフェストを同期済み
 * - assets/launcher/launcher-manifest.json が存在する
 * - assets/launcher/{CODE}/mipmap-{density}/ic_launcher.png が存在する
 *
 * ## 使い方
 * ```kotlin
 * // Application または Activity で初期化
 * val reader = LauncherManifestReader(applicationContext)
 *
 * // 全エントリ取得（表示順ソート済み）
 * val entries = reader.getEntries()
 *
 * // カテゴリ別に取得
 * val grouped = reader.getEntriesByCategory()
 *
 * // アイコン Bitmap を取得（デバイス密度に合わせて自動選択）
 * val bitmap = reader.loadIcon("IOSH")
 *
 * // 特定密度で取得
 * val bitmap = reader.loadIcon("IOSH", "xxhdpi")
 *
 * // PackageManager フォールバック付きで取得
 * val bitmap = reader.loadIconWithFallback("IOSH", "com.harmonic.iosh", packageManager)
 * ```
 *
 * ## ランチャーアプリへの統合パターン
 * 既存の AppRepository でアイコンを PackageManager から取得しているコードを
 * 以下のパターンで拡張可能:
 *
 * ```kotlin
 * // Before: PackageManager のみ
 * val icon = packageManager.getApplicationIcon(packageName)
 *
 * // After: insight-common アセット優先 → PackageManager フォールバック
 * val icon = launcherManifestReader.loadIconWithFallback(
 *     productCode, packageName, packageManager
 * ) ?: packageManager.getDefaultActivityIcon()
 * ```
 */
package com.harmonic.insight.launcher.icons

import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.util.Log
import org.json.JSONObject
import java.io.IOException

/**
 * launcher-manifest.json のエントリ
 */
data class LauncherIconEntry(
    /** 製品/ユーティリティコード (例: "IOSH", "CAMERA") */
    val code: String,
    /** 製品名（英語） */
    val name: String,
    /** マスターアイコンパス（insight-common 内の参照用。アプリでは使わない） */
    val masterIcon: String,
    /** カテゴリ: "office", "ai_tools", "enterprise", "senior", "utility" */
    val category: String,
    /** ランチャーでの表示順序 (小さいほど先頭) */
    val displayOrder: Int,
    /** 正規の製品（true）かユーティリティ（false）か */
    val isProduct: Boolean,
)

/**
 * アイコンカテゴリの表示名
 */
enum class LauncherIconCategory(val key: String, val labelJa: String, val labelEn: String) {
    OFFICE("office", "InsightOffice", "InsightOffice"),
    AI_TOOLS("ai_tools", "AI ツール", "AI Tools"),
    ENTERPRISE("enterprise", "業務変革ツール", "Enterprise Tools"),
    SENIOR("senior", "シニアオフィス", "Senior Office"),
    UTILITY("utility", "ユーティリティ", "Utilities");

    companion object {
        fun fromKey(key: String): LauncherIconCategory? =
            entries.find { it.key == key }
    }
}

/**
 * insight-common の launcher-manifest.json を読み取り、
 * assets 内のアイコンを提供するリーダー。
 *
 * @param context Application context
 * @param assetsBasePath assets 内のランチャーアイコン基底パス
 */
class LauncherManifestReader(
    private val context: Context,
    private val assetsBasePath: String = "launcher",
) {
    companion object {
        private const val TAG = "LauncherManifest"
        private const val MANIFEST_FILENAME = "launcher-manifest.json"
        private const val ICON_FILENAME = "ic_launcher.png"

        /** Android 密度名 → DPI マッピング */
        private val DENSITY_DPI = mapOf(
            "mdpi" to DisplayMetrics.DENSITY_MEDIUM,       // 160
            "hdpi" to DisplayMetrics.DENSITY_HIGH,         // 240
            "xhdpi" to DisplayMetrics.DENSITY_XHIGH,      // 320
            "xxhdpi" to DisplayMetrics.DENSITY_XXHIGH,     // 480
            "xxxhdpi" to DisplayMetrics.DENSITY_XXXHIGH,   // 640
        )

        /** 密度名のリスト（低→高） */
        private val DENSITY_ORDER = listOf("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")
    }

    private var cachedEntries: List<LauncherIconEntry>? = null
    private var manifestVersion: Int = 0

    /**
     * マニフェストが assets 内に存在するか確認
     */
    fun isAvailable(): Boolean {
        return try {
            context.assets.open("$assetsBasePath/$MANIFEST_FILENAME").use { true }
        } catch (e: IOException) {
            false
        }
    }

    /**
     * マニフェストから全エントリを取得（displayOrder 順）
     */
    fun getEntries(): List<LauncherIconEntry> {
        cachedEntries?.let { return it }

        val entries = mutableListOf<LauncherIconEntry>()
        try {
            val json = context.assets.open("$assetsBasePath/$MANIFEST_FILENAME")
                .bufferedReader()
                .use { it.readText() }

            val manifest = JSONObject(json)
            manifestVersion = manifest.optInt("version", 0)

            val entriesArray = manifest.getJSONArray("entries")
            for (i in 0 until entriesArray.length()) {
                val entry = entriesArray.getJSONObject(i)
                entries.add(
                    LauncherIconEntry(
                        code = entry.getString("code"),
                        name = entry.getString("name"),
                        masterIcon = entry.optString("masterIcon", ""),
                        category = entry.optString("category", "utility"),
                        displayOrder = entry.optInt("displayOrder", 999),
                        isProduct = entry.optBoolean("isProduct", false),
                    )
                )
            }

            entries.sortBy { it.displayOrder }
            cachedEntries = entries
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read launcher manifest", e)
        }

        return entries
    }

    /**
     * カテゴリ別にグルーピングされたエントリを取得
     */
    fun getEntriesByCategory(): Map<LauncherIconCategory, List<LauncherIconEntry>> {
        val entries = getEntries()
        val result = mutableMapOf<LauncherIconCategory, MutableList<LauncherIconEntry>>()

        // 空リストで初期化
        LauncherIconCategory.entries.forEach { cat ->
            result[cat] = mutableListOf()
        }

        for (entry in entries) {
            val category = LauncherIconCategory.fromKey(entry.category)
                ?: LauncherIconCategory.UTILITY
            result[category]?.add(entry)
        }

        return result
    }

    /**
     * 製品のみ取得（ユーティリティ除外）
     */
    fun getProductEntries(): List<LauncherIconEntry> =
        getEntries().filter { it.isProduct }

    /**
     * 指定製品コードのエントリを取得
     */
    fun getEntry(code: String): LauncherIconEntry? =
        getEntries().find { it.code == code }

    /**
     * 指定製品コードのアイコンを Bitmap として読み込む。
     * デバイスの画面密度に合わせて最適な密度を自動選択する。
     *
     * @param code 製品コード (例: "IOSH")
     * @param density 明示的な密度指定（null の場合はデバイス密度を使用）
     * @return Bitmap、またはアイコンが見つからない場合は null
     */
    fun loadIcon(code: String, density: String? = null): Bitmap? {
        val targetDensity = density ?: getDeviceDensityName()
        val assetPath = "$assetsBasePath/$code/mipmap-$targetDensity/$ICON_FILENAME"

        return try {
            context.assets.open(assetPath).use { inputStream ->
                BitmapFactory.decodeStream(inputStream)
            }
        } catch (e: IOException) {
            Log.w(TAG, "Icon not found in assets: $assetPath, trying fallback densities")
            // フォールバック: 低い密度から試す
            tryFallbackDensity(code, targetDensity)
        }
    }

    /**
     * assets のアイコンを優先し、見つからなければ PackageManager にフォールバックする。
     *
     * @param code 製品コード
     * @param packageName アプリのパッケージ名
     * @param packageManager PackageManager インスタンス
     * @return Drawable（BitmapDrawable or PackageManager の Drawable）、見つからない場合 null
     */
    fun loadIconWithFallback(
        code: String,
        packageName: String?,
        packageManager: PackageManager,
    ): Drawable? {
        // 1. assets のアイコンを試す
        val bitmap = loadIcon(code)
        if (bitmap != null) {
            return BitmapDrawable(context.resources, bitmap)
        }

        // 2. PackageManager にフォールバック
        if (packageName != null) {
            return try {
                packageManager.getApplicationIcon(packageName)
            } catch (e: PackageManager.NameNotFoundException) {
                Log.w(TAG, "Package not found: $packageName")
                null
            }
        }

        return null
    }

    /**
     * 全製品のアイコンを一括読み込み（Map<コード, Bitmap>）
     *
     * @param productsOnly true の場合、ユーティリティを除外
     */
    fun loadAllIcons(productsOnly: Boolean = false): Map<String, Bitmap> {
        val entries = if (productsOnly) getProductEntries() else getEntries()
        val result = mutableMapOf<String, Bitmap>()

        for (entry in entries) {
            loadIcon(entry.code)?.let { bitmap ->
                result[entry.code] = bitmap
            }
        }

        return result
    }

    /**
     * キャッシュをクリア（マニフェスト再読み込みが必要な場合）
     */
    fun clearCache() {
        cachedEntries = null
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * デバイスの画面密度に対応する密度名を返す
     */
    private fun getDeviceDensityName(): String {
        val dpi = context.resources.displayMetrics.densityDpi
        return when {
            dpi <= DisplayMetrics.DENSITY_MEDIUM -> "mdpi"
            dpi <= DisplayMetrics.DENSITY_HIGH -> "hdpi"
            dpi <= DisplayMetrics.DENSITY_XHIGH -> "xhdpi"
            dpi <= DisplayMetrics.DENSITY_XXHIGH -> "xxhdpi"
            else -> "xxxhdpi"
        }
    }

    /**
     * 指定密度でアイコンが見つからない場合、他の密度を試す
     */
    private fun tryFallbackDensity(code: String, failedDensity: String): Bitmap? {
        // 高い密度から順に試す（スケールダウンの方が品質が良い）
        val fallbackOrder = DENSITY_ORDER.reversed().filter { it != failedDensity }

        for (density in fallbackOrder) {
            val assetPath = "$assetsBasePath/$code/mipmap-$density/$ICON_FILENAME"
            try {
                return context.assets.open(assetPath).use { inputStream ->
                    BitmapFactory.decodeStream(inputStream)
                }
            } catch (_: IOException) {
                // この密度も見つからなければ次を試す
            }
        }

        Log.w(TAG, "No icon found for $code at any density")
        return null
    }
}
