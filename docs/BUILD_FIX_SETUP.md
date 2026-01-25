# Claude Code 自動ビルドエラー修正環境 構築ガイド

> 新規 Windows PC に Claude Code からビルドエラーを自動修正できる環境を構築する手順です。

---

## セットアップ方法の選択

| 方法 | 難易度 | 所要時間 | 推奨用途 |
|------|--------|----------|----------|
| **GitHub Codespaces** | 簡単 | 3分 | すぐ試したい、チーム共有 |
| WSL 2 | 中程度 | 30分 | 本格的な開発環境 |
| ネイティブ Windows | 中程度 | 20分 | WSL不要の場合 |

**推奨**: まず **Codespaces** で試してから、必要に応じてローカル環境を構築してください。

---

## GitHub Codespaces（最速セットアップ）

### Step 1: Codespaces を起動

1. GitHub でリポジトリを開く
2. `Code` → `Codespaces` → `Create codespace on main`
3. 自動的にセットアップが実行される（2-3分）

### Step 2: 各サービスにログイン

```bash
# Claude Code（必須）
claude login

# GitHub（通常は自動認証済み）
gh auth status

# 以下は使用するサービスのみ
vercel login      # Vercel
railway login     # Railway
eas login         # EAS (Expo)
supabase login    # Supabase
```

### Step 3: 使用開始

```bash
# 方法1: スクリプト実行（全環境チェック）
./scripts/auto-fix.sh

# 方法2: シンプル版
./scripts/fix.sh

# 方法3: Claude Code に直接指示
claude "ビルドエラー直して"
```

### Codespaces で利用可能なツール

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Node.js | 24.x LTS | JavaScript/TypeScript |
| Python | 3.13.x | Python |
| gh | 最新版 | GitHub 操作 |
| claude | 最新版 | AI 自動修正 |
| vercel | 最新版 | Vercel デプロイ |
| railway | 最新版 | Railway デプロイ |
| eas | 最新版 | Expo/RN ビルド |
| supabase | 最新版 | Supabase 操作 |

### 他のリポジトリに適用する

以下のファイルをコピーしてください：

```
your-repo/
├── .devcontainer/
│   ├── devcontainer.json
│   └── setup.sh
└── scripts/
    ├── auto-fix.sh
    └── fix.sh
```

---

## 概要

Claude Code を使って、以下のプラットフォームのビルドエラーを自動検出・修正できます：

| プラットフォーム | CLI ツール | エラーログ取得 |
|----------------|-----------|--------------|
| GitHub Actions | `gh` | 可能 |
| Vercel | `vercel` | 可能 |
| Railway | `railway` | 可能 |
| EAS (Expo) | `eas` | 可能 |
| Supabase | `supabase` | 可能 |
| Xcode Cloud | `gh` + API | 可能 |
| fastlane | `fastlane` | 可能 |

---

## 前提条件

- Windows 10/11 (64bit)
- インターネット接続
- 各サービスのアカウント（GitHub, Vercel, Railway, Expo, Supabase）

---

## 推奨バージョン一覧（2026年1月時点）

| ツール | 推奨バージョン | 入手先 | 備考 |
|-------|--------------|--------|------|
| Node.js | **24.x LTS** (Krypton) | [nodejs.org](https://nodejs.org/) | Active LTS（2028年4月まで） |
| Python | **3.13.x** または **3.14.x** | [python.org](https://www.python.org/downloads/) | 3.10は2026年10月でEOL |
| Git | 最新版 | [git-scm.com](https://git-scm.com/) | |
| Claude Code | 最新版 | npm または公式インストーラー | ネイティブWindows対応済み |

---

## WSL について

### 結論: **WSL 2 推奨**（必須ではない）

Claude Code は 2025年にネイティブ Windows 版がリリースされ、PowerShell から直接実行可能です。ただし、以下の理由から **WSL 2 環境を推奨** します：

| 項目 | ネイティブ Windows | WSL 2 |
|------|-------------------|-------|
| セットアップ | 簡単 | やや手間 |
| サンドボックス | 非対応 | **対応**（セキュリティ向上） |
| Linux コマンド | Git Bash 経由 | **ネイティブ** |
| シェルスクリプト | 互換性問題あり | **完全互換** |
| Docker 連携 | Docker Desktop 必要 | **シームレス** |

**推奨**: 開発をメインで行う場合は WSL 2 をセットアップしてください。

---

## Step 1: 基本ツールのインストール

### 1.1 Node.js のインストール

**推奨バージョン: 24.x LTS "Krypton"**（Active LTS、2028年4月までサポート）

**方法A: 公式インストーラー（推奨）**
1. [Node.js 公式サイト](https://nodejs.org/ja/) にアクセス
2. **24.x LTS** をダウンロード
3. インストーラーを実行
4. 「Automatically install the necessary tools...」に**チェックを入れる**（Chocolatey経由でビルドツールがインストールされる）

**方法B: winget を使用**
```powershell
winget install OpenJS.NodeJS.LTS
```

確認：
```powershell
node --version   # v24.x.x が表示されること
npm --version
```

### 1.2 Python のインストール

**推奨バージョン: 3.13.x または 3.14.x**

> Python は一部のツール（fastlane の依存関係など）で必要になる場合があります。

**方法A: Python Install Manager（推奨）**
```powershell
winget install 9NQ7512CXL7T
```

**方法B: 公式インストーラー**
1. [Python 公式サイト](https://www.python.org/downloads/) にアクセス
2. **Python 3.13.x** または **3.14.x** をダウンロード
3. インストール時に **「Add Python to PATH」にチェック**

確認：
```powershell
python --version   # Python 3.13.x または 3.14.x
pip --version
```

### 1.3 Git のインストール

1. [Git for Windows](https://gitforwindows.org/) にアクセス
2. ダウンロードしてインストール
3. 設定は基本的にデフォルトでOK（エディタは好みで選択）

または winget:
```powershell
winget install Git.Git
```

確認：
```powershell
git --version
```

Git 初期設定：
```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 1.4 Windows Terminal のインストール（推奨）

```powershell
winget install Microsoft.WindowsTerminal
```

または Microsoft Store で「Windows Terminal」を検索してインストール。

---

## Step 2: Claude Code のインストール

### 2.1 Claude Code CLI のインストール

```powershell
npm install -g @anthropic-ai/claude-code
```

確認：
```powershell
claude --version
```

### 2.2 Claude Code の認証

```powershell
claude auth login
```

ブラウザが開くので、Anthropic アカウントでログインします。

---

## Step 3: GitHub CLI (gh) のインストール

### 3.1 インストール

**方法A: winget を使用（推奨）**
```powershell
winget install --id GitHub.cli
```

**方法B: 直接ダウンロード**
1. [GitHub CLI Releases](https://github.com/cli/cli/releases) にアクセス
2. `gh_*_windows_amd64.msi` をダウンロード
3. インストーラーを実行

確認：
```powershell
gh --version
```

### 3.2 認証

```powershell
gh auth login
```

対話形式で進めます：
1. `? What account do you want to log into?` → **GitHub.com**
2. `? What is your preferred protocol for Git operations?` → **HTTPS**（推奨）
3. `? Authenticate Git with your GitHub credentials?` → **Yes**
4. `? How would you like to authenticate GitHub CLI?` → **Login with a web browser**
5. 表示される8桁コードをコピー
6. ブラウザで認証を完了

確認：
```powershell
gh auth status
```

---

## Step 4: Vercel CLI のインストール

### 4.1 インストール

```powershell
npm install -g vercel
```

確認：
```powershell
vercel --version
```

### 4.2 認証

```powershell
vercel login
```

メールアドレスを入力し、送られてくるリンクをクリックして認証します。

確認：
```powershell
vercel whoami
```

---

## Step 5: Railway CLI のインストール

### 5.1 インストール

```powershell
npm install -g @railway/cli
```

確認：
```powershell
railway --version
```

### 5.2 認証

```powershell
railway login
```

ブラウザが開くので Railway アカウントでログインします。

確認：
```powershell
railway whoami
```

---

## Step 6: EAS CLI (Expo) のインストール

### 6.1 インストール

```powershell
npm install -g eas-cli
```

確認：
```powershell
eas --version
```

### 6.2 認証

```powershell
eas login
```

Expo アカウントの認証情報を入力します。

確認：
```powershell
eas whoami
```

---

## Step 7: Supabase CLI のインストール

### 7.1 インストール

**方法A: npm を使用**
```powershell
npm install -g supabase
```

**方法B: winget を使用**
```powershell
winget install --id Supabase.CLI
```

**方法C: Scoop を使用**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

確認：
```powershell
supabase --version
```

### 7.2 認証

```powershell
supabase login
```

ブラウザが開くので Supabase アカウントでログインします。

確認：
```powershell
supabase projects list
```

### 7.3 プロジェクトリンク（プロジェクトディレクトリ内で実行）

```powershell
supabase link --project-ref <PROJECT_ID>
```

`<PROJECT_ID>` は Supabase ダッシュボードの URL から取得できます：
`https://supabase.com/dashboard/project/<PROJECT_ID>`

---

## Step 8: iOS/macOS ビルドツール（macOS のみ）

> **注意**: iOS/macOS アプリのビルドには macOS が必要です。Windows では Xcode Cloud のログ確認のみ可能です。

### 8.1 Xcode Cloud（GitHub CLI 経由）

Xcode Cloud のビルド状況は GitHub Actions と同様に `gh` コマンドで確認できます：

```bash
# Xcode Cloud のワークフロー一覧
gh run list --workflow="Xcode Cloud"

# 失敗したビルドのログ
gh run view <RUN_ID> --log-failed
```

### 8.2 fastlane のインストール（macOS）

```bash
# Homebrew でインストール（推奨）
brew install fastlane

# または RubyGems でインストール
sudo gem install fastlane
```

確認：
```bash
fastlane --version
```

### 8.3 fastlane の認証

```bash
# App Store Connect API キーを設定（推奨）
# 1. App Store Connect で API キーを作成
# 2. 環境変数を設定
export APP_STORE_CONNECT_API_KEY_ID="YOUR_KEY_ID"
export APP_STORE_CONNECT_API_KEY_ISSUER_ID="YOUR_ISSUER_ID"
export APP_STORE_CONNECT_API_KEY_KEY_FILEPATH="/path/to/AuthKey_XXXXX.p8"

# または Apple ID でログイン
fastlane spaceauth -u your@email.com
```

### 8.4 fastlane コマンド

```bash
# ビルド＆テスト
fastlane ios build
fastlane ios test

# TestFlight にアップロード
fastlane ios beta

# App Store にリリース
fastlane ios release

# 証明書・プロビジョニングプロファイル同期
fastlane match development
fastlane match appstore
```

---

## Step 9: 環境確認

全ての CLI が正しくインストールされているか確認：

```powershell
# 一括確認スクリプト
Write-Host "=== CLI Version Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Node.js:" -NoNewline; node --version
Write-Host "npm:" -NoNewline; npm --version
Write-Host "Python:" -NoNewline; python --version
Write-Host "Git:" -NoNewline; git --version
Write-Host "Claude Code:" -NoNewline; claude --version
Write-Host "GitHub CLI:" -NoNewline; gh --version | Select-Object -First 1
Write-Host "Vercel:" -NoNewline; vercel --version
Write-Host "Railway:" -NoNewline; railway --version
Write-Host "EAS:" -NoNewline; eas --version
Write-Host "Supabase:" -NoNewline; supabase --version

Write-Host ""
Write-Host "=== Auth Status Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "GitHub:" -ForegroundColor Yellow
gh auth status

Write-Host "Vercel:" -ForegroundColor Yellow
vercel whoami

Write-Host "Railway:" -ForegroundColor Yellow
railway whoami

Write-Host "EAS:" -ForegroundColor Yellow
eas whoami

Write-Host "Supabase:" -ForegroundColor Yellow
supabase projects list
```

---

## 使い方

### プロジェクトディレクトリで Claude Code を起動

```powershell
cd C:\path\to\your\project
claude
```

### ビルドエラー確認コマンド

Claude Code に以下を伝えるだけで、自動でエラーを検出・修正します：

```
ビルドエラー直して
```

または、特定のプラットフォームを指定：

```
GitHub Actions のエラーを確認して修正して
Vercel のデプロイエラーを直して
Railway のビルドログ見て
EAS のビルドエラー直して
Supabase の Edge Functions のエラー確認して
```

### 全プラットフォーム一括確認

```
GitHub、Vercel、Railway、EAS、Supabase の全てのビルド状況を確認して、エラーがあれば修正してpushして
```

---

## 各プラットフォームの手動コマンド

### GitHub Actions

```powershell
# 失敗したワークフロー一覧
gh run list --status failure --limit 5

# 特定の実行のログ（失敗部分のみ）
gh run view <RUN_ID> --log-failed

# 全ログを取得
gh run view <RUN_ID> --log
```

### Vercel

```powershell
# デプロイ一覧
vercel list

# 特定のデプロイのログ
vercel logs <DEPLOYMENT_URL>

# デプロイの詳細
vercel inspect <DEPLOYMENT_ID> --logs
```

### Railway

```powershell
# 最新ログ
railway logs

# サービス状態
railway status

# 特定のサービスのログ
railway logs --service <SERVICE_NAME>
```

### EAS (Expo)

```powershell
# 失敗したビルド一覧
eas build:list --status=errored --limit=5

# 特定のビルドの詳細
eas build:view <BUILD_ID>

# 最新のビルド状態
eas build:list --limit=1
```

### Supabase

```powershell
# Edge Functions 一覧
supabase functions list

# Edge Functions のログ（リアルタイム）
supabase functions logs <FUNCTION_NAME>

# データベースのマイグレーション状態
supabase migration list

# ローカル開発環境の状態
supabase status

# Edge Functions のデプロイ
supabase functions deploy <FUNCTION_NAME>

# 全 Edge Functions をデプロイ
supabase functions deploy

# データベースの差分確認
supabase db diff

# リモートDBとの差分を確認
supabase db diff --linked
```

### Xcode Cloud

```bash
# Xcode Cloud ワークフロー一覧（GitHub Actions として表示）
gh run list --workflow="Xcode Cloud" --limit=5

# 失敗したビルドのログ
gh run view <RUN_ID> --log-failed

# App Store Connect API 経由（要 API キー設定）
# Xcode Cloud のビルド一覧は App Store Connect からも確認可能
```

### fastlane（macOS のみ）

```bash
# iOS ビルド
fastlane ios build

# テスト実行
fastlane ios test

# TestFlight アップロード
fastlane ios beta

# ビルドエラーの詳細ログ
fastlane ios build --verbose

# 利用可能なレーン一覧
fastlane lanes

# 証明書の状態確認
fastlane match nuke distribution  # 注意: 証明書を削除
fastlane match appstore --readonly  # 読み取りのみ
```

---

## プロジェクト用 CLAUDE.md テンプレート

各プロジェクトの `CLAUDE.md` に以下を追加すると、Claude Code がビルドエラーを自動修正できます：

```markdown
# ビルドエラー自動修正

「ビルドエラー直して」と言われたら、以下を順番にチェック：

## 1. GitHub Actions
```bash
gh run list --status failure --limit 1
```
→ 失敗があれば `gh run view <ID> --log-failed` でログ取得

## 2. Vercel
```bash
vercel list
```
→ 失敗があれば `vercel logs <URL>` でログ取得

## 3. Railway
```bash
railway logs
```
→ 最新ログを確認

## 4. EAS (Expo)
```bash
eas build:list --status=errored --limit=1
```
→ 失敗があれば `eas build:view <ID>` でログ取得

## 5. Supabase
```bash
supabase functions list
supabase functions logs <FUNCTION_NAME>
```
→ Edge Functions のエラーログを確認

## 6. Xcode Cloud
```bash
gh run list --workflow="Xcode Cloud" --limit=1
```
→ 失敗があれば `gh run view <ID> --log-failed` でログ取得

## 7. fastlane（macOS）
```bash
fastlane ios build --verbose
```
→ ビルドエラーの詳細を確認

## 修正後
```bash
git add -A && git commit -m "fix: ビルドエラーを修正" && git push
```
```

---

## トラブルシューティング

### 「認証されていません」エラー

各 CLI の認証をやり直してください：

```powershell
# GitHub
gh auth logout
gh auth login

# Vercel
vercel logout
vercel login

# Railway
railway logout
railway login

# EAS
eas logout
eas login

# Supabase
supabase logout
supabase login
```

### 「コマンドが見つかりません」エラー

1. ターミナル（PowerShell/コマンドプロンプト）を再起動
2. それでもダメな場合は PC を再起動
3. PATH 環境変数を確認

### npm グローバルインストールの権限エラー

管理者として PowerShell を起動してインストール：
1. スタートメニューで「PowerShell」を検索
2. 右クリック → 「管理者として実行」
3. `npm install -g ...` を再実行

### Railway でプロジェクトが見つからない

```powershell
# プロジェクトをリンク
railway link
```

### Vercel でプロジェクトが見つからない

```powershell
# プロジェクトをリンク
vercel link
```

---

## WSL 2 環境のセットアップ（推奨）

WSL 2 を使用すると、サンドボックス機能が有効になりセキュリティが向上します。

### WSL 2 のインストール

```powershell
# 管理者権限で PowerShell を実行
wsl --install
```

再起動後、Ubuntu が自動的にセットアップされます。

### WSL 2 であることを確認

```powershell
wsl --list --verbose
```

VERSION が `2` であることを確認。`1` の場合は変換：
```powershell
wsl --set-version Ubuntu 2
```

### WSL 内でのセットアップ

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# 必要なパッケージ
sudo apt install -y build-essential curl git ripgrep

# Node.js (nvm 経由 - バージョン管理が容易)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 24    # LTS版
nvm use 24
nvm alias default 24

# Python (pyenv 経由 - バージョン管理が容易)
curl https://pyenv.run | bash

# ~/.bashrc に以下を追加
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Python インストール
pyenv install 3.13.11
pyenv global 3.13.11

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Supabase CLI (別途インストール - npm版は非推奨)
curl -fsSL https://deb.supabase.com/signing-key.asc | sudo gpg --dearmor -o /usr/share/keyrings/supabase-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/supabase-archive-keyring.gpg] https://deb.supabase.com stable main" | sudo tee /etc/apt/sources.list.d/supabase.list > /dev/null
sudo apt update
sudo apt install supabase

# npm グローバルツール
npm install -g @anthropic-ai/claude-code vercel @railway/cli eas-cli

# 全認証
gh auth login
vercel login
railway login
eas login
supabase login
claude auth login
```

### バージョン確認

```bash
node --version      # v24.x.x
python --version    # Python 3.13.x
git --version
gh --version
vercel --version
railway --version
eas --version
supabase --version
claude --version
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-25 | 1.1.0 | WSL 2 推奨、Python追加、バージョン情報追加 |
| 2026-01-25 | 1.0.0 | 初版作成 |

---

## 参考リンク

- [Claude Code 公式ドキュメント](https://code.claude.com/docs/en/setup)
- [Node.js リリーススケジュール](https://nodejs.org/en/about/previous-releases)
- [Python ダウンロード](https://www.python.org/downloads/)
- [WSL インストールガイド](https://docs.microsoft.com/ja-jp/windows/wsl/install)

---

## 関連ドキュメント

- [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md) - 開発標準ガイド
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - insight-common 組み込みガイド
- [QUICKSTART.md](./QUICKSTART.md) - クイックスタート
