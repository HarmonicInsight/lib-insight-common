# InsightLauncher Android 統合ガイド

insight-common のランチャーアイコン（全 15 製品）を Android アプリに統合する手順。

## アーキテクチャ

```
insight-common (サブモジュール)
  └── brand/icons/generated/launcher/
      ├── launcher-manifest.json     ← 全製品メタデータ
      ├── INSS/mipmap-*/ic_launcher.png
      ├── IOSH/mipmap-*/ic_launcher.png
      └── ...（15 製品 × 5 密度 = 75 PNG）
          ↓
  scripts/sync-launcher-assets.sh   ← コピースクリプト
          ↓
Android App
  └── app/src/main/assets/launcher/
      ├── launcher-manifest.json
      ├── INSS/mipmap-*/ic_launcher.png
      └── ...
```

## Step 1: insight-common をサブモジュールとして追加

```bash
git submodule add https://github.com/HarmonicInsight/cross-lib-insight-common.git insight-common
git submodule update --init
```

## Step 2: アイコンを assets にコピー

### 手動実行

```bash
./insight-common/scripts/sync-launcher-assets.sh app/src/main/assets/launcher
```

### オプション

```bash
# ドライラン（何がコピーされるか確認）
./insight-common/scripts/sync-launcher-assets.sh --dry-run app/src/main/assets/launcher

# クリーンコピー（既存ファイルを削除してからコピー）
./insight-common/scripts/sync-launcher-assets.sh --clean app/src/main/assets/launcher

# 検証付き（コピー後にファイル数をチェック）
./insight-common/scripts/sync-launcher-assets.sh --verify app/src/main/assets/launcher
```

## Step 3: Gradle でビルド時に自動同期

`app/build.gradle.kts` に以下を追加:

```kotlin
// ============================================================
// insight-common ランチャーアイコン同期タスク
// ============================================================
tasks.register<Exec>("syncLauncherAssets") {
    description = "Sync launcher icons from insight-common to assets"
    group = "build"

    val insightCommonDir = rootProject.file("insight-common")
    val syncScript = insightCommonDir.resolve("scripts/sync-launcher-assets.sh")
    val targetDir = project.file("src/main/assets/launcher")

    // スクリプトが存在する場合のみ実行
    onlyIf { syncScript.exists() }

    commandLine("bash", syncScript.absolutePath, "--verify", targetDir.absolutePath)

    // insight-common のアイコンが変更された場合のみ再実行
    inputs.dir(insightCommonDir.resolve("brand/icons/generated/launcher"))
    outputs.dir(targetDir)
}

// preBuild に依存させて自動実行
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

    commandLine 'bash', syncScript.absolutePath, '--verify', targetDir.absolutePath

    inputs.dir new File(insightCommonDir, 'brand/icons/generated/launcher')
    outputs.dir targetDir
}

preBuild.dependsOn syncLauncherAssets
```

## Step 4: Kotlin コードでアイコンを読み込む

### LauncherManifestReader をプロジェクトにコピー

```bash
cp insight-common/android/launcher/LauncherManifestReader.kt \
   app/src/main/java/com/harmonic/insight/launcher/icons/
```

パッケージ名はアプリに合わせて変更してください。

### 使い方

```kotlin
// 初期化
val reader = LauncherManifestReader(applicationContext)

// assets にマニフェストがあるか確認
if (!reader.isAvailable()) {
    Log.w("Launcher", "Launcher manifest not found in assets")
    return
}

// 全エントリ取得（displayOrder 順にソート済み）
val entries = reader.getEntries()

// カテゴリ別に取得
val grouped = reader.getEntriesByCategory()
// grouped[LauncherIconCategory.OFFICE]     → [INSS, IOSH, IOSD]
// grouped[LauncherIconCategory.AI_TOOLS]   → [INPY, INMV, INIG]
// grouped[LauncherIconCategory.ENTERPRISE] → [INCA, INBT, IVIN]

// 製品のみ（ユーティリティ除外）
val products = reader.getProductEntries()

// アイコン Bitmap を読み込む（デバイス密度に合わせて自動選択）
val bitmap: Bitmap? = reader.loadIcon("IOSH")

// PackageManager フォールバック付き
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
        // insight-common のアセットアイコンを優先
        return manifestReader.loadIconWithFallback(
            code = productCode,
            packageName = packageName,
            packageManager = packageManager,
        )
    }

    fun getAllApps(): List<AppInfo> {
        // マニフェストから全製品を取得し、インストール状態と合わせて表示
        return manifestReader.getEntries().map { entry ->
            AppInfo(
                code = entry.code,
                name = entry.name,
                category = entry.category,
                displayOrder = entry.displayOrder,
                icon = getAppIcon(entry.code, resolvePackageName(entry.code)),
                isInstalled = isPackageInstalled(resolvePackageName(entry.code)),
            )
        }
    }
}
```

## assets ディレクトリ構造

同期後の構造:

```
app/src/main/assets/launcher/
├── launcher-manifest.json
├── INSS/
│   ├── mipmap-mdpi/ic_launcher.png      (48×48)
│   ├── mipmap-hdpi/ic_launcher.png      (72×72)
│   ├── mipmap-xhdpi/ic_launcher.png     (96×96)
│   ├── mipmap-xxhdpi/ic_launcher.png    (144×144)
│   └── mipmap-xxxhdpi/ic_launcher.png   (192×192)
├── IOSH/
│   └── ... (同構造)
├── IOSD/
├── ISOF/
├── INPY/
├── INMV/
├── INIG/
├── INCA/
├── INBT/
├── IVIN/
├── CAMERA/
├── VOICE_CLOCK/
├── PINBOARD/
├── VOICE_MEMO/
└── QR/
```

## .gitignore

assets にコピーされたアイコンはビルド時に生成されるため、`.gitignore` に追加を推奨:

```gitignore
# insight-common から同期されるランチャーアイコン
app/src/main/assets/launcher/
```

## FAQ

**Q: アイコンが表示されません**
A: `./insight-common/scripts/sync-launcher-assets.sh --verify app/src/main/assets/launcher` で検証してください。

**Q: インストールされていないアプリも表示できますか？**
A: はい。`launcher-manifest.json` は全 15 製品の情報を持っているため、インストール状態に関係なくアイコンとメタデータを取得できます。`isInstalled` フラグは PackageManager で別途判定してください。

**Q: 製品が追加されたらどうなりますか？**
A: insight-common 側で `python scripts/generate-app-icon.py --launcher` を再実行すると、マニフェストとアイコンが更新されます。ランチャーアプリ側は `sync-launcher-assets.sh` を再実行するだけで反映されます。

**Q: TypeScript の app-icon-manager.ts は使えますか？**
A: Kotlin アプリでは直接使えません。代わりに `LauncherManifestReader.kt` が同等の機能を提供します。マニフェスト JSON は共通フォーマットなので、どの言語からでも読み取れます。
