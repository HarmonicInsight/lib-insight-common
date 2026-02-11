# リポジトリリネーム移行ガイド

> 作成日: 2026-02-11
> 対象: 全開発者・全ローカルPC

---

## 概要

全 HarmonicInsight リポジトリを `{platform}-{type}-{product}` 形式にリネームします。
GitHub上でリネーム後、**全ローカルPCで remote URL の更新**が必要です。

---

## 1. リネーム実行手順（管理者）

### Phase 1: cross-lib-insight-common（最優先）

これが全製品のサブモジュール元なので最初に実行。

```bash
# GitHub上でリネーム（Settings > Repository name）
# lib-insight-common → cross-lib-insight-common
```

### Phase 2: アクティブ製品リポジトリ

| 優先度 | 旧名 | 新名 |
|:------:|------|------|
| 1 | `app-Insight-slide` | `win-app-insight-slide` |
| 2 | `app-Insight-excel` | `win-app-insight-sheet` |
| 3 | `app-Insight-doc` | `win-app-insight-doc` |
| 4 | `app-Insight-bot-C` | `win-app-insight-bot` |
| 5 | `app-nocode-analyzer-C` | `win-app-nocode-analyzer` |
| 6 | `app-insight-py-win` | `win-app-insight-py` |
| 7 | `app-insight-image-gen-C` | `win-app-insight-image-gen` |
| 8 | `app-insight-movie-gen-win-C` | `win-app-insight-movie-gen` |
| 9 | `app-harmonic-sheet` | `win-app-insight-sheet-senior` |
| 10 | `app-auto-interview-web` | `web-app-auto-interview` |
| 11 | `releases` | `cross-releases` |

### Phase 3: その他（web / android / ios / mobile 等）

完全なリストは `docs/repository-naming-audit.md` を参照。

---

## 2. ローカルPC 移行手順（全開発者）

### パターンA: アプリ本体のリポジトリ（remote URL 更新）

```bash
# 例: app-Insight-slide → win-app-insight-slide
cd /path/to/app-Insight-slide

# 1. 現在のremote確認
git remote -v

# 2. remote URL 更新
git remote set-url origin https://github.com/HarmonicInsight/win-app-insight-slide.git

# 3. 確認
git remote -v
git fetch origin
```

### パターンB: サブモジュール（insight-common）の URL 更新

アプリリポジトリ内のサブモジュール URL も更新が必要です。

```bash
cd /path/to/your-app

# 1. .gitmodules のURL確認
cat .gitmodules

# 2. .gitmodules のURLを書き換え
#    旧: url = https://github.com/HarmonicInsight/lib-insight-common.git
#    新: url = https://github.com/HarmonicInsight/cross-lib-insight-common.git
#    ※ローカルのディレクトリ名(path)はそのまま

git config --file .gitmodules submodule.lib-insight-common.url https://github.com/HarmonicInsight/cross-lib-insight-common.git

# Web アプリ系の場合（path が insight-common）
git config --file .gitmodules submodule.insight-common.url https://github.com/HarmonicInsight/cross-lib-insight-common.git

# 3. 内部設定の同期
git submodule sync

# 4. 確認
git submodule status

# 5. コミット
git add .gitmodules
git commit -m "chore: update submodule URL for cross-lib-insight-common rename"
git push
```

### パターンC: クリーンクローンし直す場合

既存ローカルが複雑な場合はクローンし直すのが最も確実。

```bash
# 旧ディレクトリをバックアップ（念のため）
mv app-Insight-slide app-Insight-slide.bak

# 新名でクローン
git clone https://github.com/HarmonicInsight/win-app-insight-slide.git
cd win-app-insight-slide

# サブモジュール初期化
git submodule update --init --recursive
```

---

## 3. 一括更新スクリプト（PowerShell / Windows）

```powershell
# rename-remotes.ps1
# 全アプリの remote URL を一括更新

$renames = @{
    "app-Insight-slide"         = "win-app-insight-slide"
    "app-Insight-excel"         = "win-app-insight-sheet"
    "app-Insight-doc"           = "win-app-insight-doc"
    "app-Insight-bot-C"         = "win-app-insight-bot"
    "app-nocode-analyzer-C"     = "win-app-nocode-analyzer"
    "app-insight-py-win"        = "win-app-insight-py"
    "app-insight-py-pro-win"    = "win-app-insight-py-pro"
    "app-insight-image-gen-C"   = "win-app-insight-image-gen"
    "app-insight-movie-gen-win-C" = "win-app-insight-movie-gen"
    "app-harmonic-sheet"        = "win-app-insight-sheet-senior"
    "app-auto-interview-web"    = "web-app-auto-interview"
    "lib-insight-common"        = "cross-lib-insight-common"
}

$baseDir = "C:\Dev"  # 開発ディレクトリに合わせて変更

foreach ($old in $renames.Keys) {
    $new = $renames[$old]
    $path = Join-Path $baseDir $old

    if (Test-Path $path) {
        Write-Host "Updating: $old -> $new" -ForegroundColor Yellow
        Push-Location $path

        # remote URL 更新
        git remote set-url origin "https://github.com/HarmonicInsight/$new.git"

        # サブモジュール URL 更新（.gitmodules がある場合）
        if (Test-Path ".gitmodules") {
            $content = Get-Content .gitmodules -Raw
            $content = $content -replace "HarmonicInsight/lib-insight-common", "HarmonicInsight/cross-lib-insight-common"
            $content = $content -replace "HarmonicInsight/insight-common", "HarmonicInsight/cross-lib-insight-common"
            Set-Content .gitmodules $content
            git submodule sync
        }

        git fetch origin
        Pop-Location
        Write-Host "  Done: $new" -ForegroundColor Green
    } else {
        Write-Host "  Skip: $old (not found)" -ForegroundColor Gray
    }
}

Write-Host "`nAll remotes updated!" -ForegroundColor Green
```

---

## 4. CI/CD 更新

### GitHub Actions（各アプリリポジトリ）

reusable workflow の参照パスを更新:

```yaml
# 旧
uses: HarmonicInsight/lib-insight-common/.github/workflows/reusable-validate.yml@main

# 新
uses: HarmonicInsight/cross-lib-insight-common/.github/workflows/reusable-validate.yml@main
```

---

## 5. 注意事項

- GitHub は旧 URL から新 URL へ自動リダイレクトするが、**永続的ではない**（別の新リポジトリが旧名で作成されたらリダイレクトが切れる）
- ローカルの `.gitmodules` に記載の `path =` はそのまま（ディレクトリ名は変えない）
- App Manager のパス設定もリネーム後に再設定が必要
- IDE のプロジェクト設定（Recent Projects 等）は手動で更新

---

## 6. チェックリスト

- [ ] GitHub 上でリポジトリをリネーム
- [ ] ローカル PC の remote URL を更新（パターンA）
- [ ] サブモジュール URL を更新（パターンB）
- [ ] CI/CD の workflow 参照を更新
- [ ] App Manager のパスを再設定
- [ ] `git fetch origin` が成功することを確認
- [ ] `git submodule update --remote` が成功することを確認
