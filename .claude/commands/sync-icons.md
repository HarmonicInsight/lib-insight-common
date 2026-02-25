# アイコン同期コマンド

insight-common の `brand/icons/generated/` をソースオブトゥルースとして、アプリリポジトリのアイコンを同期します。

`$ARGUMENTS` に製品コード（例: `VOICE_CLOCK`、`CAMERA`、`IOSH`）を指定してください。

## 製品コードとリポジトリの対応

| 製品コード | 生成ディレクトリ名 | リポジトリ | プラットフォーム |
|-----------|-------------------|-----------|----------------|
| VOICE_CLOCK | InsightVoiceClock | android-app-insight-voice-clock | Android Native |
| CAMERA | InsightCamera | android-app-insight-camera | Android Native |
| INSS | InsightOfficeSlide | app-insight-slides | WPF |
| IOSH | InsightOfficeSheet | app-insight-sheet | WPF |
| IOSD | InsightOfficeDoc | app-insight-doc | WPF |
| ISOF | InsightSeniorOffice | app-insight-senior-office | WPF |
| INPY | InsightPy | app-insight-py | WPF |
| INBT | InsightBot | app-insight-bot | WPF |
| INCA | InsightNoCodeAnalyzer | app-insight-nca | Tauri |
| IVIN | InterviewInsight | app-interview-insight | Tauri |
| PINBOARD | InsightPinBoard | expo-app-insight-pinboard | Expo |
| VOICE_MEMO | InsightVoiceMemo | expo-app-insight-voice-memo | Expo |
| QR | InsightQR | web-app-insight-qr | Web |
| INMV | InsightCast | app-insight-cast | Python |
| INIG | InsightImageGen | app-insight-image-gen | Python |
| LAUNCHER | InsightLauncher | android-app-insight-launcher | Android Native |

## 実行手順

### Step 1: ソースの確認

insight-common の `brand/icons/generated/<生成ディレクトリ名>/` にマスターアイコンが存在するか確認する。

```bash
ls -R brand/icons/generated/<生成ディレクトリ名>/
```

ファイルが存在しない場合、`scripts/generate-app-icon.py` で生成が必要。
```bash
python scripts/generate-app-icon.py --product <製品コード>
```

### Step 2: アプリリポジトリの取得

対象のアプリリポジトリがローカルにあるか確認する。
なければ GitHub からクローンする（Organization: `HarmonicInsight`）。

### Step 3: 差分の認識

ソース（insight-common）とターゲット（アプリリポジトリ）の各ファイルを比較する。

**Android Native の場合**
- ソース: `brand/icons/generated/<Dir>/mipmap-*/` → ターゲット: `app/src/main/res/mipmap-*/`
- **注意**: ターゲットに `drawable/ic_launcher_foreground.xml` や `mipmap-anydpi-v26/` が残っている場合は削除すること（mipmap PNG を上書きしてしまうため）

**WPF の場合**
- ソース: `brand/icons/generated/<Dir>/` → ターゲット: `Resources/`

**Expo の場合**
- ソース: `brand/icons/generated/<Dir>/` → ターゲット: `assets/`

**Tauri の場合**
- ソース: `brand/icons/generated/<Dir>/` → ターゲット: `src-tauri/icons/`

差分がない場合は「同期済み、差分なし」と報告して終了。

### Step 4: ファイルコピー

差分のあるファイルのみ、insight-common のソースをアプリリポジトリに上書きコピーする。
**insight-common 側が常にソースオブトゥルース**。

### Step 5: コミット & プッシュ

アプリリポジトリ側で:
1. `claude/` プレフィックス付きブランチを作成（現在のセッションブランチと同名が望ましい）
2. 変更をコミット: `fix: sync <アイコン種別> icon from insight-common`
3. プッシュ

### Step 6: 報告

以下を報告する:
- 同期したファイル一覧
- 差分の概要
- プッシュ先のブランチとPR作成URL

## 既存スクリプトの活用

ファイル数が多い場合は `sync-app-icons.sh` を活用できる:

```bash
# Android（mipmap PNGs）
./scripts/sync-app-icons.sh --product VOICE_CLOCK /path/to/app/src/main/res/

# WPF
./scripts/sync-app-icons.sh --product IOSH /path/to/app/Resources/

# Expo
./scripts/sync-app-icons.sh --product CAMERA /path/to/app/assets/
```

## 注意事項

- **ソースオブトゥルース**: 常に `brand/icons/generated/` が正。アプリ側で独自にアイコンを編集してはいけない
- **アイコン変更時**: まず insight-common 側で `brand/icons/generated/` を更新してからこのコマンドを実行する
- **ブランドカラー**: Gold (#B8942F) がプライマリ、Ivory (#FAF8F5) が背景であること
- **プッシュ認証**: アプリリポジトリへのプッシュには GitHub PAT が必要な場合がある
