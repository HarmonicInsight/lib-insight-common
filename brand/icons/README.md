# HARMONIC insight アプリアイコン シリーズ

## デザインシステム

すべてのアプリアイコンは統一されたデザイン言語を使用:

- **背景**: Ivory (#FAF8F5)
- **ベースサークル**: Gold (#B8942F)、半径 34dp
- **アイコンアート**: White (#FFFFFF)
- **スパークルアクセント**: Light Gold (#D4BC6A)、右上に配置
- **スタイル**: 丸みのある可愛いデザイン

## アイコン一覧

| ファイル名 | アプリ | モチーフ |
|-----------|--------|---------|
| `icon-launcher.svg` | Insight Launcher | 2x2 アプリグリッド |
| `icon-qr.svg` | Insight QR | QR コードパターン |
| `icon-voice-clock.svg` | Insight Voice Clock | ベル付き目覚まし時計 |
| `icon-camera.svg` | Insight Camera | カメラ + レンズ |
| `icon-incline.svg` | InclineInsight | ゲージ + スマイル |
| `icon-consul-type.svg` | ConsulType | 盾 + 肉球 |
| `icon-consul-evaluate.svg` | ConsulEvaluate | クリップボード + チェック |
| `icon-horoscope.svg` | Harmonic Horoscope | 三日月 + 星 |
| `icon-food-medicine.svg` | Food Medicine Insight | フォーク + カプセル |

## 使用方法

### Android (Native Kotlin)
SVG を Android Studio で Vector Drawable に変換し、
`app/src/main/res/drawable/ic_launcher_foreground.xml` として配置。

### Expo/React Native
SVG を 1024x1024 PNG に書き出し、`assets/icon.png` として配置。
