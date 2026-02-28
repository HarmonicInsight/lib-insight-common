# ライセンス発行ツール

Insight Series のライセンスキーを発行するCLIツール

## キー形式

```
PPPP-PLAN-YYMM-HASH-SIG1-SIG2

例: INSS-BIZ-2701-A3F8-K9X2-M4PQ
    │    │    │    │    └─ 署名（8文字）
    │    │    │    └────── メールハッシュ（4文字）
    │    │    └─────────── 有効期限（2027年1月）
    │    └──────────────── プラン（Business）
    └───────────────────── 製品（Insight Deck Quality Gate）
```

## セットアップ

```bash
git clone https://github.com/HarmonicInsight/cross-lib-insight-common.git
cd insight-common/license/tools
```

※ Python 3.7以上が必要。追加パッケージ不要。

---

## 使い方

```bash
python generate-license.py -p INSS --plan BIZ -e user@example.com --expires 2027-01-31
```

## 使用例

### 1. トライアルライセンス（30日間）

```bash
python generate-license.py -p INSS --trial -e user@example.com
python generate-license.py -p INPY --trial -e user@example.com
python generate-license.py -p IVIN --trial -e user@example.com
```

### 2. 年間ライセンス（12ヶ月）

```bash
# Insight Deck Quality Gate Business
python generate-license.py -p INSS --plan BIZ -e user@example.com -m 12

# Insight Performance Management Business
python generate-license.py -p IOSH --plan BIZ -e user@example.com -m 12

# InsightPy
python generate-license.py -p INPY --plan BIZ -e user@example.com -m 12

# InterviewInsight
python generate-license.py -p IVIN --plan BIZ -e user@example.com -m 12
```

### 3. 指定日までのライセンス

```bash
python generate-license.py -p INSS --plan BIZ -e user@example.com --expires 2027-12-31
```

---

## オプション

| オプション | 短縮形 | 説明 | 必須 |
|-----------|--------|------|:----:|
| `--product` | `-p` | 製品コード | ○ |
| `--email` | `-e` | メールアドレス | ○ |
| `--plan` | - | プラン (BIZ/ENT) | △ |
| `--trial` | - | トライアル発行 | △ |
| `--expires` | - | 有効期限 (YYYY-MM-DD) | - |
| `--months` | `-m` | 有効期間（月数） | - |
| `--json` | - | JSON形式のみ出力 | - |
| `--csv` | - | CSV形式のみ出力 | - |

※ `--plan` または `--trial` のどちらかが必須

---

## 製品コード

| コード | 製品名 |
|--------|--------|
| `INSS` | Insight Deck Quality Gate |
| `IOSH` | Insight Performance Management |
| `IOSD` | Insight AI Briefcase |
| `INPY` | InsightPy |
| `INMV` | InsightCast |
| `INBT` | InsightBot |
| `INCA` | InsightNoCodeAnalyzer |
| `INIG` | InsightImageGen |
| `IVIN` | InterviewInsight |

## プラン

| コード | 名称 | 期間 |
|--------|------|------|
| `TRIAL` | トライアル | 30日 |
| `BIZ` | Business | 年間 |
| `ENT` | Enterprise | 要相談 |

---

## 出力例

```
========================================
  Insight Series ライセンス発行
========================================

製品:       Insight Deck Quality Gate (INSS)
プラン:     Business (BIZ)
メール:     user@example.com
有効期限:   2027-01-31

----------------------------------------
ライセンスキー: INSS-BIZ-2701-A3F8-K9X2-M4PQ
----------------------------------------
```

---

## 注意事項

1. **メールアドレス紐付け**: ライセンスキーはメールアドレスと紐付けられます。認証時に同じメールアドレスが必要です。

2. **オフライン検証**: ライセンス検証はオフラインで実行可能。サーバーとの通信は不要です。

3. **署名検証**: HMAC-SHA256による署名検証で改ざんを検知します。
