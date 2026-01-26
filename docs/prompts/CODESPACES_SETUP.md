# GitHub Codespaces 自動ビルド環境セットアップ

> Claude Code に以下をコピー＆ペーストするだけで、Codespaces 環境が構築されます。

---

## 方法1: ワンコマンド（推奨）

アプリリポジトリの Codespace ターミナルで:

```bash
./insight-common/scripts/setup-codespaces.sh
```

これで `.devcontainer/devcontainer.json` と `.devcontainer/setup.sh` が自動生成されます。

---

## 方法2: Claude Code にコピペ

以下を Claude Code にそのまま貼り付けてください:

```
このリポジトリに GitHub Codespaces の自動ビルド環境を構築してください。

## 要件

1. `.devcontainer/devcontainer.json` を作成
2. `.devcontainer/setup.sh` を作成
3. Codespace 起動時に以下の CLI が自動インストールされること:
   - Claude Code CLI (`@anthropic-ai/claude-code`)
   - Vercel CLI (`vercel`)
   - Supabase CLI (`supabase`)
   - TypeScript / ts-node
4. プロジェクトの `npm install` が自動実行されること
5. `.gitmodules` があればサブモジュールを初期化すること
6. Prisma があれば `prisma generate` を実行すること

## devcontainer.json の仕様

- ベースイメージ: `mcr.microsoft.com/devcontainers/universal:2`
- Node.js 24, Python 3.13, GitHub CLI を features で追加
- Dockerfile があれば `docker-in-docker` feature も追加
- ポート転送: 3000 (Next.js), 5432 (PostgreSQL - Prisma使用時)
- VS Code 拡張: Copilot, Prettier, ESLint, Tailwind CSS, Prisma (あれば)
- 環境変数: ANTHROPIC_API_KEY, VERCEL_TOKEN を localEnv から引き継ぎ
- `postCreateCommand` で `.devcontainer/setup.sh` を実行

## setup.sh の仕様

1. Claude Code CLI インストール
2. Vercel / Supabase CLI インストール
3. TypeScript / ts-node インストール
4. npm install (lock ファイルに応じて npm/pnpm/yarn を選択)
5. Prisma generate (prisma/ ディレクトリがある場合)
6. git submodule update --init --recursive (.gitmodules がある場合)
7. インストール結果の確認表示

完了したら git add して commit、push してください。
```

---

## 方法3: 最短プロンプト

```
insight-common の .devcontainer/ テンプレートを参考に、このリポジトリ用の Codespaces 自動ビルド環境を作って。Claude Code CLI と Vercel CLI が自動インストールされるようにして。commit & push まで。
```

---

## セットアップ後の使い方

### Codespace の起動

1. GitHub でリポジトリを開く
2. `Code` > `Codespaces` > `Create codespace on main`
3. 自動的にセットアップが実行される（2-3分）

### CLI ログイン（初回のみ）

```bash
claude login        # Claude Code（必須）
gh auth status      # GitHub（通常は自動認証済み）
vercel login        # Vercel
supabase login      # Supabase
```

### 開発開始

```bash
npm run dev         # 開発サーバー起動
```

### ビルドエラー自動修正

```bash
claude "ビルドエラー直して"
```

---

## 環境変数の設定（Codespaces Secrets）

Codespace で環境変数を永続化するには、GitHub の Codespaces Secrets を設定:

1. GitHub > Settings > Codespaces > Secrets
2. 以下を追加:

| Secret 名 | 説明 |
|-----------|------|
| `ANTHROPIC_API_KEY` | Claude API キー |
| `VERCEL_TOKEN` | Vercel トークン |
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー |

---

## 対象リポジトリの構成例

```
app-query-licence-management-web/
├── .devcontainer/           <-- 生成される
│   ├── devcontainer.json
│   └── setup.sh
├── insight-common/          <-- サブモジュール
├── prisma/
├── src/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── next.config.ts
```

---

## 参考

- [BUILD_FIX_SETUP.md](../BUILD_FIX_SETUP.md) - 自動ビルドエラー修正の詳細
- [insight-common/.devcontainer/](../../.devcontainer/) - ベーステンプレート
