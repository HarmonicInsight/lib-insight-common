# Claude Code 自動ビルドエラー修正環境 構築ガイド

> 新規 Windows PC に Claude Code からビルドエラーを自動修正できる環境を構築する手順です。

---

## 概要

Claude Code を使って、以下のプラットフォームのビルドエラーを自動検出・修正できます：

| プラットフォーム | CLI ツール | エラーログ取得 |
|----------------|-----------|--------------|
| GitHub Actions | `gh` | 可能 |
| Vercel | `vercel` | 可能 |
| Railway | `railway` | 可能 |
| EAS (Expo) | `eas` | 可能 |

---

## 前提条件

- Windows 10/11 (64bit)
- インターネット接続
- 各サービスのアカウント（GitHub, Vercel, Railway, Expo）

---

## Step 1: 基本ツールのインストール

### 1.1 Node.js のインストール

1. [Node.js 公式サイト](https://nodejs.org/ja/) にアクセス
2. **LTS 版**（推奨版）をダウンロード
3. インストーラーを実行（デフォルト設定でOK）
4. 「Automatically install the necessary tools...」にチェック

確認：
```powershell
node --version
npm --version
```

### 1.2 Git のインストール

1. [Git for Windows](https://gitforwindows.org/) にアクセス
2. ダウンロードしてインストール
3. 設定は基本的にデフォルトでOK（エディタは好みで選択）

確認：
```powershell
git --version
```

Git 初期設定：
```powershell
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 1.3 Windows Terminal のインストール（推奨）

1. Microsoft Store で「Windows Terminal」を検索
2. インストール

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

## Step 7: 環境確認

全ての CLI が正しくインストールされているか確認：

```powershell
# 一括確認スクリプト
Write-Host "=== CLI Version Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Node.js:" -NoNewline; node --version
Write-Host "npm:" -NoNewline; npm --version
Write-Host "Git:" -NoNewline; git --version
Write-Host "Claude Code:" -NoNewline; claude --version
Write-Host "GitHub CLI:" -NoNewline; gh --version | Select-Object -First 1
Write-Host "Vercel:" -NoNewline; vercel --version
Write-Host "Railway:" -NoNewline; railway --version
Write-Host "EAS:" -NoNewline; eas --version

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
```

### 全プラットフォーム一括確認

```
GitHub、Vercel、Railway、EAS の全てのビルド状況を確認して、エラーがあれば修正してpushして
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

## WSL 環境の場合（オプション）

WSL (Windows Subsystem for Linux) を使用する場合は、WSL 内でも同様にセットアップします。

### WSL のインストール

```powershell
# 管理者権限で実行
wsl --install
```

### WSL 内でのセットアップ

```bash
# Node.js (nvm 経由)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# npm ツール
npm install -g @anthropic-ai/claude-code vercel @railway/cli eas-cli

# 認証
gh auth login
vercel login
railway login
eas login
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-25 | 1.0.0 | 初版作成 |

---

## 関連ドキュメント

- [DEVELOPMENT_STANDARDS.md](./DEVELOPMENT_STANDARDS.md) - 開発標準ガイド
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - insight-common 組み込みガイド
- [QUICKSTART.md](./QUICKSTART.md) - クイックスタート
