package com.harmonic.insight.__APPNAME__.license

// ============================================================
// Insight ライセンス プランコード（4ティア制）
//
// 【このファイルについて】
// insight-common/templates/android/ からコピーして使用。
// __APPNAME__ を実際のパッケージ名に置換してください。
// config/products.ts のプラン体系に準拠。
//
// FREE:  無料（Group A: 保存不可, Group B: 閲覧のみ, Standard ティア）
// TRIAL: 評価用（14日間, 全機能, Standard ティア）
// BIZ:   ビジネス（365日, 全機能, Standard ティア）
// ENT:   エンタープライズ（カスタマイズ, Premium ティア, API/SSO/監査）
// ============================================================

enum class PlanCode(val displayName: String, val displayNameJa: String) {
    FREE("FREE", "フリー"),
    TRIAL("TRIAL", "トライアル"),
    BIZ("BIZ", "ビジネス"),
    ENT("ENT", "エンタープライズ"),
    ;

    companion object {
        fun fromString(value: String): PlanCode? {
            return entries.find { it.name == value.uppercase() }
        }
    }
}
