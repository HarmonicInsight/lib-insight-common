---
name: android
description: Android アプリの開発標準。Kotlin、Jetpack Compose、Android XML レイアウトの作業時に自動適用。Material 3 + Ivory & Gold テーマ、ライセンス統合パターンを提供。
allowed-tools: Read, Grep, Glob, Bash
---

# Android 開発標準

対象: Harmonic Insight Android アプリ（将来的なモバイル展開）

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | Kotlin |
| UI | Jetpack Compose (Material 3) |
| 認証 | Firebase Auth |
| データ | Supabase |
| 最小 API | 26 (Android 8.0) |

## Ivory & Gold テーマ (Compose)

```kotlin
val IvoryGoldColors = lightColorScheme(
    primary = Color(0xFFB8942F),           // Gold
    onPrimary = Color.White,
    background = Color(0xFFFAF8F5),        // Ivory
    surface = Color.White,
    onBackground = Color(0xFF1C1917),      // Text Primary
    onSurface = Color(0xFF1C1917),
    outline = Color(0xFFE7E2DA),           // Border
    error = Color(0xFFDC2626),
)
```

## プロジェクト構成

```
app/src/main/
├── java/com/harmonicinsight/{app}/
│   ├── ui/theme/
│   │   ├── Color.kt           # Ivory & Gold カラー
│   │   ├── Theme.kt           # テーマ定義
│   │   └── Type.kt            # タイポグラフィ
│   ├── license/
│   │   ├── LicenseManager.kt
│   │   └── LicenseScreen.kt   # ライセンス画面
│   └── MainActivity.kt
└── res/values/
    └── colors.xml              # XML カラーリソース
```

## 禁止事項

- Blue をプライマリに使用（Material Design デフォルトを上書き必須）
- 独自認証（Firebase Auth を使用）
- クライアント側権限判定

## 詳細リファレンス

`insight-common/standards/ANDROID.md` に完全なガイドあり。
