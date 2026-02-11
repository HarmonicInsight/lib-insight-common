# InsightLauncher Android 統合ガイド

insight-common でアイコンを一元管理し、ランチャーアプリに自動反映する仕組み。

## 全体フロー

```
insight-common（アイコンの Single Source of Truth）
  │
  │  ① デザイナーがマスター PNG を更新
  │     brand/icons/png/icon-*.png
  │
  │  ② ランチャー用 mipmap を再生成（1コマンド）
  │     ./scripts/update-launcher-icons.sh --push
  │     → generated/launcher/ に 15製品 × 5密度 のPNG + マニフェスト
  │     → 自動 commit & push
  │
  ├──────────────────────────────────────────────────
  │
  │  ③ ランチャーアプリをビルド（Gradle preBuild が自動実行）
  │     sync-launcher-assets.sh --pull --verify
  │     → submodule を最新に pull
  │     → 変更がなければスキップ（ハッシュ比較で高速）
  │     → 変更があれば assets/launcher/ にコピー
  │
  ▼
Android App — assets/launcher/ に最新アイコンが入った状態でビルド
```

**ポイント**: insight-common でアイコンを変更して push すれば、ランチャーアプリの次回ビルドで自動的に反映される。

## insight-common 側の操作

### アイコンを更新する場合

```bash
# ① マスター PNG を差し替え（例: IOSH のアイコンを更新）
cp new-icon.png brand/icons/png/icon-insight-sheet.png

# ② ランチャー用 mipmap を再生成 + commit + push（1コマンド）
./scripts/update-launcher-icons.sh --push

# 特定の製品だけ再生成したい場合
./scripts/update-launcher-icons.sh --product IOSH --push
```

### 新しい製品を追加する場合

1. `brand/icons/png/` にマスター PNG を追加
2. `scripts/generate-app-icon.py` の `PRODUCT_ICONS` に追加
3. `config/app-icon-manager.ts` の定数に追加
4. `./scripts/update-launcher-icons.sh --push` で再生成

## ランチャーアプリ側のセットアップ

### Step 1: insight-common をサブモジュールとして追加

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init
```

### Step 2: Gradle でビルド時に自動同期

`app/build.gradle.kts` に以下を追加:

```kotlin
// ============================================================
// insight-common ランチャーアイコン自動同期
// ビルドのたびに:
//   1. insight-common submodule を最新に pull
//   2. 変更があればアイコンを assets にコピー（なければスキップ）
// ============================================================
tasks.register<Exec>("syncLauncherAssets") {
    description = "Sync launcher icons from insight-common to assets"
    group = "build"

    val insightCommonDir = rootProject.file("insight-common")
    val syncScript = insightCommonDir.resolve("scripts/sync-launcher-assets.sh")
    val targetDir = project.file("src/main/assets/launcher")

    onlyIf { syncScript.exists() }

    commandLine(
        "bash", syncScript.absolutePath,
        "--pull",     // submodule を最新に更新
        "--verify",   // コピー後にファイル数を検証
        targetDir.absolutePath
    )
}

tasks.named("preBuild") {
    dependsOn("syncLauncherAssets")
}
```

**Groovy (`build.gradle`) の場合:**

```groovy
task syncLauncherAssets(type: Exec) {
    description 'Sync launcher icons from insight-common to assets'
    group 'build'

    def insightCommonDir = rootProject.file('insight-common')
    def syncScript = new File(insightCommonDir, 'scripts/sync-launcher-assets.sh')
    def targetDir = file('src/main/assets/launcher')

    onlyIf { syncScript.exists() }

    commandLine 'bash', syncScript.absolutePath,
        '--pull', '--verify', targetDir.absolutePath
}

preBuild.dependsOn syncLauncherAssets
```

これで **Gradle ビルドのたびに**:
- insight-common を `git pull` して最新化
- 前回同期時のハッシュと比較して変更があればコピー
- 変更がなければ `[SKIP]` で即座に終了（ビルド時間への影響なし）

### Step 3: LauncherManifestReader をプロジェクトにコピー

```bash
cp insight-common/android/launcher/LauncherManifestReader.kt \
   app/src/main/java/com/harmonic/insight/launcher/icons/
```

パッケージ名はアプリに合わせて変更してください。

### Step 4: Kotlin コードでアイコンを読み込む

```kotlin
val reader = LauncherManifestReader(applicationContext)

// 全エントリ取得（displayOrder 順にソート済み）
val entries = reader.getEntries()

// カテゴリ別に取得
val grouped = reader.getEntriesByCategory()

// アイコン Bitmap を読み込む（デバイス密度に合わせて自動選択）
val bitmap: Bitmap? = reader.loadIcon("IOSH")

// PackageManager フォールバック付き（アセット優先 → PM にフォールバック）
val drawable: Drawable? = reader.loadIconWithFallback(
    code = "IOSH",
    packageName = "com.harmonic.insight.sheet",
    packageManager = packageManager,
)
```

### 既存の AppRepository への統合例

```kotlin
class AppRepository(
    private val context: Context,
    private val packageManager: PackageManager,
) {
    private val manifestReader = LauncherManifestReader(context)

    fun getAppIcon(productCode: String, packageName: String?): Drawable? {
        // insight-common のアセットアイコンを優先、なければ PackageManager
        return manifestReader.loadIconWithFallback(
            code = productCode,
            packageName = packageName,
            packageManager = packageManager,
        )
    }

    fun getAllApps(): List<AppInfo> {
        // マニフェストから全製品を取得（未インストールも含む）
        return manifestReader.getEntries().map { entry ->
            val pkgName = resolvePackageName(entry.code)
            AppInfo(
                code = entry.code,
                name = entry.name,
                category = entry.category,
                displayOrder = entry.displayOrder,
                icon = getAppIcon(entry.code, pkgName),
                isInstalled = isPackageInstalled(pkgName),
            )
        }
    }
}
```

## sync スクリプトの変更チェック

`sync-launcher-assets.sh` は **ハッシュ比較** で不要なコピーをスキップします:

1. insight-common が git リポジトリの場合: `launcher/` ディレクトリの最終コミットハッシュを使用
2. git がない場合: `launcher-manifest.json` の SHA-256 + アイコンファイル数で代替
3. ハッシュは `assets/launcher/.launcher-sync-hash` に保存
4. 次回実行時にハッシュが一致すれば `[SKIP]` で即終了

```
1回目のビルド:  [OK] 15 products synced (76 files)  ← 約2秒
2回目のビルド:  [SKIP] No changes since last sync    ← 即座に完了
```

## assets ディレクトリ構造

```
app/src/main/assets/launcher/
├── launcher-manifest.json
├── .launcher-sync-hash         ← 変更チェック用（自動生成）
├── INSS/
│   ├── mipmap-mdpi/ic_launcher.png      (48×48)
│   ├── mipmap-hdpi/ic_launcher.png      (72×72)
│   ├── mipmap-xhdpi/ic_launcher.png     (96×96)
│   ├── mipmap-xxhdpi/ic_launcher.png    (144×144)
│   └── mipmap-xxxhdpi/ic_launcher.png   (192×192)
├── IOSH/ ...
├── IOSD/ ...
└── ... (15 製品)
```

## .gitignore

assets にコピーされるアイコンはビルド時に生成されるため、`.gitignore` に追加:

```gitignore
# insight-common から同期されるランチャーアイコン（ビルド時自動生成）
app/src/main/assets/launcher/
```

## FAQ

**Q: insight-common でアイコンを変えたのにアプリに反映されない**
A: `./scripts/update-launcher-icons.sh` で mipmap を再生成して push しましたか？ マスター PNG を差し替えただけでは mipmap は更新されません。

**Q: ビルドが遅くなりませんか？**
A: 変更がなければハッシュ比較で即スキップするので影響はありません。

**Q: インストールされていないアプリも表示できますか？**
A: はい。`launcher-manifest.json` は全 15 製品の情報を持っているため、インストール状態に関係なくアイコンとメタデータを取得できます。

**Q: 製品が追加されたらどうなりますか？**
A: insight-common 側で `update-launcher-icons.sh --push` を実行すれば、ランチャーアプリの次回ビルドで自動反映されます。
