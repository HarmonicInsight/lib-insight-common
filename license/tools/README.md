# ライセンス発行ツール

Insight Series のライセンスキーを発行するツール

## クイックスタート

### TypeScript版

```bash
cd insight-common/license/tools
npx ts-node generate-license.ts -p ALL -t TRIAL
```

### Python版

```bash
cd insight-common/license/tools
python generate-license.py -p ALL -t TRIAL
```

---

## 使用例

### 1. トライアルライセンス（14日間）

```bash
# 全製品トライアル
npx ts-node generate-license.ts -p ALL -t TRIAL

# 出力例:
# INS-ALL-TRIAL-A1B2-C3D4-X9
# 有効期限: 2025-02-01
```

### 2. 年間ライセンス

```bash
# InsightSlide Standard 12ヶ月
npx ts-node generate-license.ts -p SLIDE -t STD -m 12

# InsightForguncy Professional 12ヶ月
npx ts-node generate-license.ts -p FORG -t PRO -m 12
```

### 3. 指定日までのライセンス

```bash
# 2025年12月31日まで
npx ts-node generate-license.ts -p SLIDE -t PRO -e 2025-12-31
```

### 4. Enterpriseライセンス（永久）

```bash
npx ts-node generate-license.ts -p ALL -t ENT
# 有効期限: 永久
```

### 5. 一括発行

```bash
# 10個一括発行
npx ts-node generate-license.ts -p ALL -t TRIAL -n 10

# CSV形式で出力
python generate-license.py -p ALL -t TRIAL -n 10 --csv > licenses.csv
```

---

## コマンドオプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|------------|
| `--product` | `-p` | 製品コード | ALL |
| `--tier` | `-t` | ティア | TRIAL |
| `--expires` | `-e` | 有効期限 (YYYY-MM-DD) | - |
| `--months` | `-m` | 有効期間（月数） | - |
| `--count` | `-n` | 発行数 | 1 |
| `--json` | - | JSON形式のみ出力 (Python) | - |
| `--csv` | - | CSV形式のみ出力 (Python) | - |
| `--help` | `-h` | ヘルプ表示 | - |

---

## 製品コード一覧

| コード | 製品名 | 説明 |
|--------|--------|------|
| `SALES` | SalesInsight | 営業支援 |
| `SLIDE` | InsightSlide | プレゼン支援 |
| `PY` | InsightPy | Python開発支援 |
| `INTV` | InterviewInsight | 面接支援 |
| `FORG` | InsightForguncy | Forguncy開発支援 |
| `ALL` | Insight Series Bundle | 全製品バンドル |

---

## ティア一覧

| コード | 名称 | デフォルト期間 | 説明 |
|--------|------|----------------|------|
| `TRIAL` | Trial | 14日 | トライアル版 |
| `STD` | Standard | 12ヶ月 | 標準版 |
| `PRO` | Professional | 12ヶ月 | プロフェッショナル版 |
| `ENT` | Enterprise | 永久 | エンタープライズ版 |

---

## 運用フロー

### Phase 1: リリース初期（トライアル配布）

```bash
# 100個のトライアルライセンスを発行
python generate-license.py -p ALL -t TRIAL -n 100 --csv > trial_licenses.csv
```

### Phase 2: 正式販売

```bash
# 顧客ごとに発行
npx ts-node generate-license.ts -p ALL -t STD -m 12

# またはProfessional
npx ts-node generate-license.ts -p ALL -t PRO -m 12
```

### Phase 3: 製品別販売

```bash
# 製品ごとに発行
npx ts-node generate-license.ts -p SLIDE -t PRO -m 12
npx ts-node generate-license.ts -p FORG -t STD -m 12
```

---

## 出力形式

### 通常出力

```
========================================
  Insight Series ライセンス発行
========================================

製品: Insight Series Bundle (ALL)
ティア: Trial (TRIAL)
発行数: 1

----------------------------------------
1. INS-ALL-TRIAL-A1B2-C3D4-X9
   有効期限: 2025-02-01
----------------------------------------
```

### JSON形式

```json
[
  {
    "licenseKey": "INS-ALL-TRIAL-A1B2-C3D4-X9",
    "expiresAt": "2025-02-01",
    "product": "ALL",
    "tier": "TRIAL",
    "productName": "Insight Series Bundle",
    "tierName": "Trial"
  }
]
```

### CSV形式

```csv
license_key,expires_at,product,tier
INS-ALL-TRIAL-A1B2-C3D4-X9,2025-02-01,ALL,TRIAL
```

---

## ライセンスキー形式

```
INS-[PRODUCT]-[TIER]-[XXXX]-[XXXX]-[CC]

例: INS-ALL-TRIAL-A1B2-C3D4-X9
```

| 部分 | 説明 |
|------|------|
| `INS` | Insight Series 固定プレフィックス |
| `[PRODUCT]` | 製品コード (ALL, SLIDE, FORG, etc.) |
| `[TIER]` | ティア (TRIAL, STD, PRO, ENT) |
| `[XXXX]-[XXXX]` | 8桁のランダム英数字 |
| `[CC]` | 2桁のチェックサム |

---

## 注意事項

1. **有効期限の管理**: ライセンスキー自体には有効期限が含まれません。発行時に生成される有効期限は別途保存・管理が必要です。

2. **チェックサム**: ライセンスキーにはチェックサムが含まれており、改ざん検出が可能です。

3. **オフライン検証**: ライセンス検証はオフラインで実行可能です。サーバー通信は不要です。

4. **ALLライセンス**: `ALL` 製品コードのライセンスは全製品で使用可能です。
