package com.harmonic.insight.__APPNAME__.license

// ============================================================
// Insight ライセンス プランコード
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ を実際のパッケージ名に置換してください。
// config/products.ts のプラン体系に準拠。
// ============================================================

enum class PlanCode(val displayName: String, val displayNameJa: String) {
    TRIAL("TRIAL", "トライアル"),
    STD("STD", "スタンダード"),
    PRO("PRO", "プロフェッショナル"),
    ENT("ENT", "エンタープライズ"),
    ;

    companion object {
        fun fromString(value: String): PlanCode? {
            return entries.find { it.name == value.uppercase() }
        }
    }
}
