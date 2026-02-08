---
name: ios
description: iOS ネイティブアプリの開発標準。Swift、SwiftUI の作業時に自動適用。Ivory & Gold テーマ、ライセンス統合パターンを提供。Expo/React Native の場合は expo スキルを使用。
allowed-tools: Read, Grep, Glob, Bash
---

# iOS ネイティブ開発標準

> **Expo / React Native でクロスプラットフォーム開発する場合は `expo` スキルを使用してください。**
> このスキルは Swift + SwiftUI によるネイティブ iOS 専用です。

対象: Harmonic Insight iOS ネイティブアプリ

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | Swift |
| UI | SwiftUI |
| 認証 | Firebase Auth |
| データ | Supabase |
| 最小 iOS | 16.0 |

## Ivory & Gold テーマ (SwiftUI)

```swift
extension Color {
    static let brandPrimary = Color(hex: "B8942F")     // Gold
    static let brandPrimaryHover = Color(hex: "8C711E")
    static let bgPrimary = Color(hex: "FAF8F5")        // Ivory
    static let bgCard = Color.white
    static let textPrimary = Color(hex: "1C1917")
    static let textSecondary = Color(hex: "57534E")
    static let borderColor = Color(hex: "E7E2DA")
}
```

## Asset Catalog

```
Assets.xcassets/
├── Colors/
│   ├── BrandPrimary.colorset/    # #B8942F
│   ├── BgPrimary.colorset/       # #FAF8F5
│   └── TextPrimary.colorset/     # #1C1917
└── AppIcon.appiconset/
```

## 禁止事項

- Blue をプライマリに使用（iOS のデフォルト Tint を上書き必須）
- 独自認証（Firebase Auth を使用）
- クライアント側権限判定

## 詳細リファレンス

`insight-common/standards/IOS.md` に完全なガイドあり。
