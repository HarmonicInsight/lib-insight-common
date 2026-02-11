# VectorStore Infrastructure

TDWH (テキストデータウェアハウス) のベクトルストレージ基盤。

## ファイル構成

| ファイル | 用途 |
|---------|------|
| `pgvector-schema.sql` | Supabase + pgvector 用テーブル定義（本番） |

## セットアップ

### 本番 (Supabase)

```bash
# Supabase のダッシュボードまたは CLI から実行
psql $DATABASE_URL -f pgvector-schema.sql
```

### ローカル開発 (ChromaDB)

ローカル開発では ChromaDB を使用する。スキーマは不要（自動作成）。

```python
import chromadb
client = chromadb.PersistentClient(path="./data/.chroma")
collection = client.get_or_create_collection("mart_law")
```

## 設定

Embedding モデル・VectorStore の設定は `config/tdwh/embedding-config.ts` で一元管理。
