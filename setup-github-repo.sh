#!/bin/bash
# ============================================
# construction-tdwh GitHub リポジトリセットアップ
# ============================================
# 使い方: bash setup-github-repo.sh

TOKEN="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"

# 1. GitHubにリポジトリ作成
echo "=== GitHubリポジトリを作成中... ==="
curl -s -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "construction-tdwh",
    "description": "建設業テキストデータウェアハウス - AI コンサルティング基盤",
    "private": true,
    "auto_init": false
  }' \
  https://api.github.com/user/repos

echo ""
echo "=== リポジトリ作成完了 ==="

# 2. GitHubユーザー名を取得
USERNAME=$(curl -s -H "Authorization: token $TOKEN" https://api.github.com/user | grep '"login"' | head -1 | sed 's/.*: "//;s/".*//')
echo "GitHub ユーザー: $USERNAME"

# 3. ローカルリポジトリを初期化
mkdir -p construction-tdwh
cd construction-tdwh
git init

# 4. プロンプトファイルをコピー（同じディレクトリにconstruction-tdwh-prompt.mdがある前提）
cp ../construction-tdwh-prompt.md ./CLAUDE_CODE_PROMPT.md

# 5. README作成
cat > README.md << 'EOF'
# Construction TDWH（建設業テキストデータウェアハウス）

建設業に特化したテキストデータウェアハウス。  
公開情報を自動クロールし、目的別マートに構造化して格納する RAG 基盤。

## 概要

DWH の設計思想をテキストナレッジに適用:
- **データレイク層**: 公開情報の自動クロール・蓄積
- **マート層**: 目的別に構造化されたナレッジストア
- **ディスパッチ層**: 質問意図に応じたマートルーティング＆統合

## マート構成

| マート | 内容 | 主なソース |
|--------|------|------------|
| law | 法務・法令 | e-Gov, 国交省通達 |
| accounting | 会計・経審 | 国交省, JICPA |
| terminology | 用語・技術 | 日建連, 建築学会 |
| dx_case | DX事例 | i-Construction, 業界メディア |
| method | 工法・技術基準 | 仕様書, 積算基準 |
| safety | 安全管理 | 厚労省, 国交省 |

## セットアップ

```bash
uv init && uv sync
cp .env.example .env  # APIキーを設定
python scripts/setup_db.py
python scripts/crawl.py --source egov_construction_law  # テスト
python scripts/process.py --all
python scripts/query.py "建設業許可の要件は？"
```

## Claude Code での構築

`CLAUDE_CODE_PROMPT.md` を Claude Code に投入し、Phase 1 から順に実装してください。

## 将来構想

- オートインタビュー型 AI コンサルティングサービスとの統合
- ユーザー企業ごとのプライベートマート
- 専門家ナレッジ（判断ロジック）層の追加
EOF

# 6. .gitignore作成
cat > .gitignore << 'EOF'
.env
__pycache__/
*.pyc
data/raw/
data/processed/
data/exports/
.chroma/
*.egg-info/
dist/
build/
.venv/
node_modules/
EOF

# 7. コミット＆プッシュ
git add .
git commit -m "Initial commit: TDWH設計プロンプトとプロジェクト定義"
git branch -M main
git remote add origin https://${TOKEN}@github.com/${USERNAME}/construction-tdwh.git
git push -u origin main

echo ""
echo "=== 完了 ==="
echo "リポジトリ: https://github.com/${USERNAME}/construction-tdwh"
echo ""
echo "次のステップ:"
echo "  1. Claude Code でリポジトリを開く"
echo "  2. CLAUDE_CODE_PROMPT.md の Phase 1 から投入"
echo "  3. Phase ごとに動作確認しながら進める"
