# ライセンス発行ツール

Insight Series のライセンスキーを発行するツール

## セットアップ

```bash
git clone https://github.com/HarmonicInsight/insight-common.git
cd insight-common/license/tools
```

※ Python 3.7以上が必要（追加パッケージ不要）

---

## 使い方

```bash
python generate-license.py -p ALL -t TRIAL
```

## 使用例

### 1. トライアルライセンス（14日間）

```bash
python generate-license.py -p ALL -t TRIAL
```

### 2. 年間ライセンス

```bash
# InsightSlide Standard 12ヶ月
python generate-license.py -p SLIDE -t STD -m 12

# InsightForguncy Professional 12ヶ月
python generate-license.py -p FORG -t PRO -m 12
```

### 3. 指定日までのライセンス

```bash
python generate-license.py -p SLIDE -t PRO -e 2025-12-31
```

### 4. Enterpriseライセンス（永久）

```bash
python generate-license.py -p ALL -t ENT
```

### 5. 一括発行

```bash
# 10個発行
python generate-license.py -p ALL -t TRIAL -n 10

# CSV出力
python generate-license.py -p ALL -t TRIAL -n 100 --csv > licenses.csv

# JSON出力
python generate-license.py -p ALL -t TRIAL -n 10 --json > licenses.json
```

---

## オプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|------------|
| `--product` | `-p` | 製品コード | ALL |
| `--tier` | `-t` | ティア | TRIAL |
| `--expires` | `-e` | 有効期限 (YYYY-MM-DD) | - |
| `--months` | `-m` | 有効期間（月数） | - |
| `--count` | `-n` | 発行数 | 1 |
| `--json` | - | JSON形式のみ出力 | - |
| `--csv` | - | CSV形式のみ出力 | - |
| `--help` | `-h` | ヘルプ表示 | - |

---

## 製品コード

| コード | 製品名 |
|--------|--------|
| `SALES` | SalesInsight |
| `SLIDE` | InsightSlide |
| `PY` | InsightPy |
| `INTV` | InterviewInsight |
| `FORG` | InsightForguncy |
| `ALL` | 全製品バンドル |

## ティア

| コード | 名称 | 期間 |
|--------|------|------|
| `TRIAL` | Trial | 14日 |
| `STD` | Standard | 12ヶ月 |
| `PRO` | Professional | 12ヶ月 |
| `ENT` | Enterprise | 永久 |

---

## 出力例

```
========================================
  Insight Series ライセンス発行
========================================

製品: Insight Series Bundle (ALL)
ティア: Trial (TRIAL)

----------------------------------------
1. INS-ALL-TRIAL-A1B2-C3D4-X9
   有効期限: 2025-01-18
----------------------------------------
```
