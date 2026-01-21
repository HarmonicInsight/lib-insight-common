# iOS/Expo開発 トラブルシューティングガイド

このドキュメントは、InsightVoiceMemoアプリ開発で遭遇した問題と解決策をまとめたものです。
今後のiOS/Expoアプリ開発で同じ問題に遭遇しないよう、参照してください。

---

## 目次

1. [環境構築](#1-環境構築)
2. [Xcode設定](#2-xcode設定)
3. [Expoビルド](#3-expoビルド)
4. [プロジェクト構造](#4-プロジェクト構造)
5. [Git運用](#5-git運用)
6. [リリース前チェック](#6-リリース前チェック)

---

## 1. 環境構築

### 1.1 Homebrew（必須）

```bash
# インストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# パス設定（インストール後に表示される指示に従う）
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 1.2 CocoaPods

#### ❌ やってはいけない方法
```bash
# Rubyのgemでインストール → 5時間以上かかることがある
sudo gem install cocoapods  # 絶対にやらない
```

#### ✅ 正しい方法
```bash
# Homebrewでインストール → 1-2分で完了
brew install cocoapods
pod --version
```

### 1.3 Node.js

```bash
# nvmでインストール（バージョン管理が楽）
brew install nvm
nvm install 20
nvm use 20
```

---

## 2. Xcode設定

### 2.1 SDK not found エラー

```
xcrun: error: SDK "iphoneos" cannot be located
```

#### 原因
`xcode-select`がCommand Line Toolsを指している

#### 確認方法
```bash
xcode-select -p
# 出力が /Library/Developer/CommandLineTools → 問題あり
```

#### 解決方法
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# 確認
xcrun --sdk iphoneos --show-sdk-path
# /Applications/Xcode.app/.../iPhoneOS.sdk が出ればOK
```

### 2.2 ライセンス同意

```bash
sudo xcodebuild -license accept
```

---

## 3. Expoビルド

### 3.1 基本的なビルドフロー

```bash
# 1. 依存関係インストール
npm install

# 2. ネイティブプロジェクト生成
npx expo prebuild --platform ios --clean

# 3. CocoaPods依存関係インストール
cd ios && pod install && cd ..

# 4. Xcodeで開く
open ios/[プロジェクト名].xcworkspace
```

### 3.2 よくあるエラー

#### glogビルドエラー
```
configure: error: C compiler cannot create executables
```

**原因**: xcode-select設定（2.1参照）

#### Pod installが遅い
**原因**: ネットワーク問題またはキャッシュ破損

```bash
# キャッシュクリア
pod cache clean --all
rm -rf ~/Library/Caches/CocoaPods

# 再実行
cd ios && pod install
```

### 3.3 クリーンビルド

問題が解決しない場合：

```bash
rm -rf ios
rm -rf node_modules
npm install
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

---

## 4. プロジェクト構造

### 4.1 AppIcon not found エラー（Swift/Xcode）

#### 原因
`project.pbxproj`の`path`設定と実際のディレクトリ構造が不一致

#### 確認方法（リモートからClaude Codeで）
```bash
# pbxprojの期待するパス
grep -A2 "path = " *.xcodeproj/project.pbxproj | grep sourceTree

# 実際のファイル構造
find . -name "Assets.xcassets" -type d
```

#### よくあるパターン
```
期待される構造:           実際の構造:
MyApp/                    MyApp/
├── MyApp/                ├── Assets.xcassets/  ← 直接ルートにある
│   ├── Assets.xcassets/  ├── Info.plist
│   ├── Info.plist        └── MyApp.xcodeproj/
│   └── *.swift
└── MyApp.xcodeproj/
```

#### 解決方法
ファイルを正しい場所に移動：
```bash
mkdir -p MyApp
mv Assets.xcassets Info.plist *.swift MyApp/
```

### 4.2 AppIcon設定（Contents.json）

正しいフォーマット（iOS 12+）:
```json
{
  "images": [
    {
      "filename": "AppIcon.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
```

**注意**: 1024x1024 PNG、RGBA形式が必要

---

## 5. Git運用

### 5.1 ブランチ分岐エラー

```
hint: You have divergent branches and need to specify how to reconcile them.
```

#### 解決方法
```bash
# リベースで解決
git pull --rebase origin [branch-name]

# コンフリクトが発生した場合
git rebase --abort  # 中止して
git fetch origin
git reset --hard origin/[branch-name]  # リモートに合わせる
```

### 5.2 prebuild生成ファイルのコンフリクト

`ios/`フォルダは`.gitignore`に含めることを推奨：
```gitignore
# .gitignore
ios/
android/
```

理由：prebuildで毎回生成されるため、コンフリクトの原因になる

---

## 6. リリース前チェック

### 6.1 必須確認項目

| 項目 | 確認方法 | 備考 |
|------|---------|------|
| アイコン | `ls assets/icon.png` | 1024x1024 PNG |
| スプラッシュ | `ls assets/splash-icon.png` | |
| Bundle ID | `app.json` → ios.bundleIdentifier | 一意である必要 |
| ビルド番号 | `app.json` → ios.buildNumber | リリースごとに増加 |
| 権限説明 | `app.json` → ios.infoPlist | 使用する権限のみ |

### 6.2 未実装機能のUI

**重要**: UIに表示しているが実装していない機能は削除またはグレーアウト

悪い例:
- 「インポート」ボタンがあるが押すと「準備中」と表示
- 通知設定UIがあるが実際に通知されない

良い例:
- 未実装機能はUIから削除
- または「Coming Soon」と明記してボタンを無効化

### 6.3 ビルド番号管理

TestFlight/App Storeに同じビルド番号はアップロード不可

```json
// app.json
{
  "expo": {
    "ios": {
      "buildNumber": "1"  // リリースごとに増加: 1 → 2 → 3
    }
  }
}
```

**自動化推奨**: GitHub ActionsでCI時に自動インクリメント

---

## 7. リモート検証（Claude Code活用）

### 7.1 Macなしで確認できること

| 項目 | 確認方法 |
|------|---------|
| プロジェクト構造 | `find`, `ls` |
| 設定ファイル | `cat app.json`, `cat project.pbxproj` |
| アイコン存在 | `file assets/icon.png` |
| 依存関係 | `cat package.json` |
| ビルド設定 | `grep` でpbxproj解析 |

### 7.2 Xcodeを開かないと確認できないこと

- 署名設定（Signing & Capabilities）
- プロビジョニングプロファイル
- 実機デバッグ
- シミュレータ実行

### 7.3 ビルド前検証スクリプト（推奨）

```python
# validate_ios_project.py
import json
import os
import re

def validate():
    errors = []

    # 1. app.json確認
    with open('app.json') as f:
        config = json.load(f)['expo']

    if not config.get('ios', {}).get('bundleIdentifier'):
        errors.append("Bundle IDが未設定")

    # 2. アイコン確認
    icon_path = config.get('icon', './assets/icon.png')
    if not os.path.exists(icon_path.lstrip('./')):
        errors.append(f"アイコンが見つかりません: {icon_path}")

    # 3. 権限と機能の整合性
    infoPlist = config.get('ios', {}).get('infoPlist', {})
    if 'NSPhotoLibraryUsageDescription' in infoPlist:
        # 写真機能が実装されているか確認
        pass

    return errors

if __name__ == "__main__":
    errors = validate()
    if errors:
        print("❌ 問題が見つかりました:")
        for e in errors:
            print(f"  - {e}")
    else:
        print("✅ 検証OK")
```

---

## 8. トラブル発生時のフローチャート

```
ビルドエラー発生
    │
    ├─ SDK not found → xcode-select設定を確認（2.1）
    │
    ├─ Pod install失敗 → Homebrewでcocoapods入れ直し（1.2）
    │
    ├─ AppIcon not found → ディレクトリ構造を確認（4.1）
    │
    ├─ コンフリクト → git reset --hard（5.1）
    │
    └─ 原因不明 → クリーンビルド（3.3）
```

---

## 更新履歴

- 2025-01-21: 初版作成（InsightVoiceMemo開発での学びをもとに）
